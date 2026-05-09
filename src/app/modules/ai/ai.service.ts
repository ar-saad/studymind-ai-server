import { getGeminiModel } from "../../config/gemini";
import prisma from "../../config/prisma";
import logger from "../../config/logger";
import { AppError } from "../../utils/AppError";
import {
  StudyGuideInput,
  QuizInput,
  ChatInput,
  CreateTopicAIInput,
  SaveQuizResultInput,
} from "./ai.schema";

// ─── Constants ───────────────────────────────────────────────────────
const FREE_DAILY_LIMIT = 5;
const FREE_TOPIC_DAILY_LIMIT = 2;
const MAX_RETRIES = 2;

// ─── Types ───────────────────────────────────────────────────────────
interface StudyGuideResponse {
  overview: string;
  keyConcepts: { term: string; explanation: string }[];
  importantFacts: string[];
  commonMisconceptions: { myth: string; reality: string }[];
  summary: string;
}

interface QuizResponse {
  questions: {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

interface TopicCreationResponse {
  title: string;
  slug: string;
  description: string;
  category: string;
  isNewCategory: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Parse a JSON string from Gemini's response, stripping any markdown fences.
 */
function parseAIResponse<T>(text: string): T {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  return JSON.parse(cleaned) as T;
}

/**
 * Call Gemini with a prompt, retrying on parse failure up to MAX_RETRIES times.
 */
async function callGeminiWithRetry<T>(prompt: string): Promise<T> {
  const model = getGeminiModel();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return parseAIResponse<T>(text);
    } catch (error) {
      lastError = error as Error;
      logger.warn(`AI parse attempt ${attempt + 1} failed`, {
        error: lastError.message,
        attempt: attempt + 1,
      });
    }
  }

  throw new AppError(
    `AI response parsing failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`,
    500
  );
}

/**
 * Check if today's date matches the user's lastGenerationDate.
 * If not, reset counters. Returns the current daily generation count.
 */
async function getAndResetDailyCounters(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      dailyGenerations: true,
      topicsCreatedToday: true,
      lastGenerationDate: true,
    },
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const today = new Date().toISOString().split("T")[0];
  const lastDate = user.lastGenerationDate
    ? user.lastGenerationDate.toISOString().split("T")[0]
    : null;

  if (lastDate !== today) {
    // Reset both counters for the new day
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyGenerations: 0,
        topicsCreatedToday: 0,
        lastGenerationDate: new Date(),
      },
    });
    return { ...user, dailyGenerations: 0, topicsCreatedToday: 0 };
  }

  return user;
}

/**
 * Check and increment the daily generation limit.
 * Throws 429 if limit is reached for free users.
 */
async function checkAndIncrementDailyLimit(userId: string) {
  const user = await getAndResetDailyCounters(userId);

  if (user.plan === "FREE" && user.dailyGenerations >= FREE_DAILY_LIMIT) {
    throw new AppError(
      "Daily generation limit reached (5/day). Upgrade to Pro for unlimited generations.",
      429
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyGenerations: { increment: 1 },
      lastGenerationDate: new Date(),
    },
  });

  return {
    plan: user.plan,
    generationsUsed: user.dailyGenerations + 1,
    limit: user.plan === "FREE" ? FREE_DAILY_LIMIT : "unlimited",
  };
}

/**
 * Check and increment the topic creation limit.
 * Throws 429 if limit is reached for free users.
 */
async function checkTopicCreationLimit(userId: string) {
  const user = await getAndResetDailyCounters(userId);

  if (user.plan === "FREE" && user.topicsCreatedToday >= FREE_TOPIC_DAILY_LIMIT) {
    throw new AppError(
      "Daily topic creation limit reached (2/day). Upgrade to Pro for unlimited topic creation.",
      429
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      topicsCreatedToday: { increment: 1 },
      lastGenerationDate: new Date(),
    },
  });
}

/**
 * Log an AI generation event to the GenerationLog table.
 */
async function logGeneration(
  userId: string,
  topicId: string | null,
  type: "GUIDE" | "QUIZ" | "CHAT" | "TOPIC_CREATE",
  status: "SUCCESS" | "ERROR",
  estimatedTokens: number = 0,
  errorMessage?: string
) {
  try {
    await prisma.generationLog.create({
      data: {
        userId,
        topicId,
        type,
        estimatedTokens,
        status,
        errorMessage: errorMessage || null,
      },
    });
  } catch (err) {
    logger.error("Failed to log generation", { error: (err as Error).message });
  }
}

// ─── Service ─────────────────────────────────────────────────────────

export class AIService {
  /**
   * Generate an AI study guide for a topic.
   */
  static async generateStudyGuide(userId: string, input: StudyGuideInput) {
    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: input.topicId },
    });
    if (!topic) throw new AppError("Topic not found.", 404);

    // Check daily limit
    const usage = await checkAndIncrementDailyLimit(userId);

    const prompt = `Generate a structured study guide for the following topic.
Topic: ${topic.title}
Difficulty: ${input.difficulty}
Return ONLY a valid JSON object with exactly this structure, no markdown:
{
  "overview": "string — 2 to 3 paragraph introduction",
  "keyConcepts": [{ "term": "string", "explanation": "string" }],
  "importantFacts": ["string"],
  "commonMisconceptions": [{ "myth": "string", "reality": "string" }],
  "summary": "string — 1 paragraph recap and why this topic matters"
}
Requirements:
- keyConcepts should have 5 to 8 items
- importantFacts should have 4 to 6 items
- commonMisconceptions should have 2 to 3 items
- All text should be clear and educational at the ${input.difficulty} level`;

    try {
      const startTime = Date.now();
      const guide = await callGeminiWithRetry<StudyGuideResponse>(prompt);
      const duration = Date.now() - startTime;

      // Mark study session as guide generated
      await prisma.studySession.updateMany({
        where: { userId, topicId: input.topicId },
        data: { guideGenerated: true },
      });

      logger.info("Study guide generated", {
        userId,
        topicId: input.topicId,
        topic: topic.title,
        durationMs: duration,
      });

      await logGeneration(userId, input.topicId, "GUIDE", "SUCCESS", 1500);

      return { guide, usage };
    } catch (error) {
      await logGeneration(
        userId,
        input.topicId,
        "GUIDE",
        "ERROR",
        0,
        (error as Error).message
      );
      throw error;
    }
  }

  /**
   * Generate an AI quiz for a topic.
   */
  static async generateQuiz(userId: string, input: QuizInput) {
    const topic = await prisma.topic.findUnique({
      where: { id: input.topicId },
    });
    if (!topic) throw new AppError("Topic not found.", 404);

    const usage = await checkAndIncrementDailyLimit(userId);

    // Build the study guide context section for the prompt
    let studyGuideSection = "";
    if (input.studyGuideContext) {
      const sg = input.studyGuideContext;
      studyGuideSection = `
The following study guide has been provided to the student. ALL quiz questions MUST be answerable
using ONLY the information contained in this study guide. Do NOT create questions about information
that is not present in the study guide.

=== STUDY GUIDE START ===
Overview: ${sg.overview}

Key Concepts:
${sg.keyConcepts.map((c) => `- ${c.term}: ${c.explanation}`).join("\n")}

Important Facts:
${sg.importantFacts.map((f) => `- ${f}`).join("\n")}

Common Misconceptions:
${sg.commonMisconceptions.map((m) => `- Myth: ${m.myth} | Reality: ${m.reality}`).join("\n")}

Summary: ${sg.summary}
=== STUDY GUIDE END ===
`;
    }

    const prompt = `Generate a multiple choice quiz for the following topic.
Topic: ${topic.title}
Difficulty: ${input.difficulty}
Number of questions: ${input.questionCount}
${studyGuideSection}
Return ONLY a valid JSON object with exactly this structure, no markdown:
{
  "questions": [
    {
      "id": "number — sequential starting from 1",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": "number — 0 to 3",
      "explanation": "string — why the correct answer is correct"
    }
  ]
}
Requirements:
- Exactly ${input.questionCount} questions
- Exactly 4 options per question
- correctIndex must be a valid index (0-3)
- Questions should test understanding at the ${input.difficulty} level
${input.studyGuideContext ? "- CRITICAL: Every question and its correct answer MUST be directly derived from the study guide provided above. Do not introduce any information not present in the study guide." : "- Mix of factual recall and conceptual understanding questions"}`;

    try {
      const startTime = Date.now();
      const quiz = await callGeminiWithRetry<QuizResponse>(prompt);
      const duration = Date.now() - startTime;

      logger.info("Quiz generated", {
        userId,
        topicId: input.topicId,
        topic: topic.title,
        questions: quiz.questions.length,
        durationMs: duration,
      });

      await logGeneration(userId, input.topicId, "QUIZ", "SUCCESS", 2000);

      return { quiz, usage };
    } catch (error) {
      await logGeneration(
        userId,
        input.topicId,
        "QUIZ",
        "ERROR",
        0,
        (error as Error).message
      );
      throw error;
    }
  }

  /**
   * Chat with the AI doubt solver for a specific topic.
   */
  static async chat(userId: string, input: ChatInput) {
    const topic = await prisma.topic.findUnique({
      where: { id: input.topicId },
    });
    if (!topic) throw new AppError("Topic not found.", 404);

    const usage = await checkAndIncrementDailyLimit(userId);

    const model = getGeminiModel();

    const systemPrompt = `You are a study assistant helping a user understand "${topic.title}" at ${input.difficulty} level. Only answer questions related to this topic. Answer clearly and concisely, using examples where helpful. If the user asks about something unrelated to "${topic.title}", politely redirect them back to the topic.`;

    // Build conversation history — last 10 messages
    const recentMessages = input.messages.slice(-10);

    const contents = recentMessages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    try {
      const startTime = Date.now();

      const chat = model.startChat({
        history: contents.slice(0, -1),
        systemInstruction: {
          role: "system",
          parts: [{ text: systemPrompt }],
        },
      });

      const lastMessage = recentMessages[recentMessages.length - 1];
      const result = await chat.sendMessage(lastMessage.content);
      const responseText = result.response.text();
      const duration = Date.now() - startTime;

      logger.info("Chat message processed", {
        userId,
        topicId: input.topicId,
        topic: topic.title,
        durationMs: duration,
      });

      await logGeneration(userId, input.topicId, "CHAT", "SUCCESS", 500);

      return {
        message: responseText,
        usage,
      };
    } catch (error) {
      await logGeneration(
        userId,
        input.topicId,
        "CHAT",
        "ERROR",
        0,
        (error as Error).message
      );
      throw error;
    }
  }

  /**
   * Create a new topic via AI generation.
   */
  static async createTopic(userId: string, input: CreateTopicAIInput) {
    // Check topic creation limit (separate from daily generations)
    await checkTopicCreationLimit(userId);

    // Get existing categories for the prompt
    const existingCategories = await prisma.topic.findMany({
      select: { category: true },
      distinct: ["category"],
    });
    const categoryNames = existingCategories.map((c) => c.category);

    const prompt = `A user wants to learn about the following subject.
User's description: ${input.description}
Preferred difficulty: ${input.difficulty}

Existing categories in our system: ${categoryNames.join(", ")}

Based on the user's description, generate a topic for our learning platform.
Return ONLY a valid JSON object with exactly this structure, no markdown:
{
  "title": "string — concise, specific topic title (max 60 characters)",
  "slug": "string — URL-safe slug derived from the title, lowercase, hyphens only",
  "description": "string — 2-3 sentence description of what this topic covers and what the learner will understand after studying it",
  "category": "string — must exactly match one of the existing categories if the topic fits, otherwise create a new concise category name (max 30 characters)",
  "isNewCategory": "boolean — true only if the category value is not in the existing list"
}`;

    try {
      const startTime = Date.now();
      const aiResponse = await callGeminiWithRetry<TopicCreationResponse>(prompt);
      const duration = Date.now() - startTime;

      // Check if slug already exists, append random suffix if so
      let slug = aiResponse.slug;
      const existingTopic = await prisma.topic.findUnique({ where: { slug } });
      if (existingTopic) {
        const suffix = Math.random().toString(36).substring(2, 6);
        slug = `${slug}-${suffix}`;
      }

      // Handle category: check if it matches an existing one (case-insensitive)
      let category = aiResponse.category;
      if (!aiResponse.isNewCategory) {
        const matched = categoryNames.find(
          (c) => c.toLowerCase() === category.toLowerCase()
        );
        if (matched) {
          category = matched; // Use the exact casing from DB
        }
      }

      // Create the topic
      const newTopic = await prisma.topic.create({
        data: {
          title: aiResponse.title,
          slug,
          description: aiResponse.description,
          category,
          difficulty: input.difficulty,
          createdByUserId: userId,
          studyCount: 0,
        },
      });

      logger.info("Topic created via AI", {
        userId,
        topicId: newTopic.id,
        title: newTopic.title,
        category,
        isNewCategory: aiResponse.isNewCategory,
        durationMs: duration,
      });

      await logGeneration(userId, newTopic.id, "TOPIC_CREATE", "SUCCESS", 800);

      return { slug: newTopic.slug, topic: newTopic };
    } catch (error) {
      await logGeneration(
        userId,
        null,
        "TOPIC_CREATE",
        "ERROR",
        0,
        (error as Error).message
      );
      throw error;
    }
  }

  /**
   * Save quiz results to the database.
   */
  static async saveQuizResult(userId: string, input: SaveQuizResultInput) {
    const topic = await prisma.topic.findUnique({
      where: { id: input.topicId },
    });
    if (!topic) throw new AppError("Topic not found.", 404);

    const quizResult = await prisma.quizResult.create({
      data: {
        userId,
        topicId: input.topicId,
        score: input.score,
        totalQuestions: input.totalQuestions,
        timeTaken: input.timeTaken,
        passed: input.passed,
        answers: {
          create: input.answers.map((a) => ({
            questionIndex: a.questionIndex,
            selectedIndex: a.selectedIndex,
            correctIndex: a.correctIndex,
            correct: a.correct,
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    // Mark study session as completed
    await prisma.studySession.updateMany({
      where: { userId, topicId: input.topicId, completedAt: null },
      data: { completedAt: new Date() },
    });

    logger.info("Quiz result saved", {
      userId,
      topicId: input.topicId,
      score: input.score,
      passed: input.passed,
    });

    return quizResult;
  }

  /**
   * Create a study session.
   */
  static async createStudySession(userId: string, topicId: string) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });
    if (!topic) throw new AppError("Topic not found.", 404);

    // Check for an existing active (uncompleted) session to prevent duplicates
    const existingSession = await prisma.studySession.findFirst({
      where: { userId, topicId, completedAt: null },
    });

    if (existingSession) {
      logger.info("Returning existing active study session", {
        userId,
        topicId,
        sessionId: existingSession.id,
      });
      return existingSession;
    }

    // Increment study count only for genuinely new sessions
    await prisma.topic.update({
      where: { id: topicId },
      data: { studyCount: { increment: 1 } },
    });

    const session = await prisma.studySession.create({
      data: {
        userId,
        topicId,
      },
    });

    return session;
  }

  /**
   * Get current usage stats for a user.
   */
  static async getUsageStats(userId: string) {
    const user = await getAndResetDailyCounters(userId);
    return {
      plan: user.plan,
      dailyGenerations: user.dailyGenerations,
      dailyLimit: user.plan === "FREE" ? FREE_DAILY_LIMIT : "unlimited",
      topicsCreatedToday: user.topicsCreatedToday,
      topicCreationLimit: user.plan === "FREE" ? FREE_TOPIC_DAILY_LIMIT : "unlimited",
    };
  }
}
