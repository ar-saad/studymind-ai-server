import { z } from "zod";

export const studyGuideSchema = z.object({
  topicId: z.string().uuid(),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
});

export const quizSchema = z.object({
  topicId: z.string().uuid(),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  questionCount: z.coerce.number().int().min(5).max(20).default(10),
});

export const chatSchema = z.object({
  topicId: z.string().uuid(),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  messages: z.array(
    z.object({
      role: z.enum(["user", "model"]),
      content: z.string().min(1).max(2000),
    })
  ),
});

export const createTopicAISchema = z.object({
  description: z.string().min(20).max(500),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
});

export const saveQuizResultSchema = z.object({
  topicId: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  totalQuestions: z.number().int().min(1).max(20),
  timeTaken: z.number().int().min(0),
  passed: z.boolean(),
  answers: z.array(
    z.object({
      questionIndex: z.number().int().min(0),
      selectedIndex: z.number().int().min(0).max(3),
      correctIndex: z.number().int().min(0).max(3),
      correct: z.boolean(),
    })
  ),
});

export const createStudySessionSchema = z.object({
  topicId: z.string().uuid(),
});

export type StudyGuideInput = z.infer<typeof studyGuideSchema>;
export type QuizInput = z.infer<typeof quizSchema>;
export type ChatInput = z.infer<typeof chatSchema>;
export type CreateTopicAIInput = z.infer<typeof createTopicAISchema>;
export type SaveQuizResultInput = z.infer<typeof saveQuizResultSchema>;
export type CreateStudySessionInput = z.infer<typeof createStudySessionSchema>;
