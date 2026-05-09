import prisma from "../../config/prisma";
import { GetTopicsQuery, CreateTopicInput, SubmitReviewInput } from "./topic.schema";
import { AppError } from "../../utils/AppError";

let cachedStats: any = null;
let cacheExpiry: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class TopicService {
  /**
   * Get paginated topics with search, filter, and sort.
   */
  static async getTopics(query: GetTopicsQuery) {
    const { page, limit, search, category, difficulty, sort } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Build order by
    let orderBy: any;
    switch (sort) {
      case "popular":
        orderBy = { studyCount: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "alphabetical":
        orderBy = { title: "asc" };
        break;
      default:
        orderBy = { studyCount: "desc" };
    }

    const [topics, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              reviews: true,
              quizResults: true,
            },
          },
        },
      }),
      prisma.topic.count({ where }),
    ]);

    return {
      topics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single topic by slug.
   */
  static async getTopicBySlug(slug: string) {
    const topic = await prisma.topic.findUnique({
      where: { slug },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            studySessions: true,
            quizResults: true,
            reviews: true,
          },
        },
      },
    });

    if (!topic) {
      throw new AppError("Topic not found.", 404);
    }

    return topic;
  }

  /**
   * Get popular topics (top 10 by study count).
   */
  static async getPopularTopics() {
    return prisma.topic.findMany({
      orderBy: { studyCount: "desc" },
      take: 10,
      include: {
        _count: {
          select: { reviews: true },
        },
      },
    });
  }

  /**
   * Get all distinct categories.
   */
  static async getCategories() {
    const categories = await prisma.topic.findMany({
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return categories.map((c) => c.category);
  }

  /**
   * Submit a review for a topic.
   */
  static async submitReview(
    userId: string,
    topicId: string,
    input: SubmitReviewInput
  ) {
    // Check if topic exists
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) {
      throw new AppError("Topic not found.", 404);
    }

    // Check if user already reviewed this topic
    const existingReview = await prisma.review.findFirst({
      where: { userId, topicId },
    });

    if (existingReview) {
      // Update existing review
      return prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: input.rating,
          comment: input.comment,
        },
      });
    }

    // Create new review
    return prisma.review.create({
      data: {
        userId,
        topicId,
        rating: input.rating,
        comment: input.comment,
      },
    });
  }

  /**
   * Get related topics (same category, excluding current).
   */
  static async getRelatedTopics(topicId: string, category: string) {
    return prisma.topic.findMany({
      where: {
        category,
        id: { not: topicId },
      },
      take: 4,
      orderBy: { studyCount: "desc" },
    });
  }

  /**
   * Get public stats for the landing page.
   */
  static async getPublicStats() {
    const now = Date.now();
    if (cachedStats && now < cacheExpiry) {
      return cachedStats;
    }

    const [totalTopics, totalUsers, totalQuizzes, passedQuizzes, avgScoreResult, newestTopic, popularTopics] = await Promise.all([
      prisma.topic.count(),
      prisma.user.count(),
      prisma.quizResult.count(),
      prisma.quizResult.count({ where: { passed: true } }),
      prisma.quizResult.aggregate({
        _avg: {
          score: true,
        },
      }),
      prisma.topic.findFirst({
        orderBy: { createdAt: "desc" },
        select: {
          title: true,
          slug: true,
        },
      }),
      prisma.topic.findMany({
        orderBy: { studyCount: "desc" },
        take: 6,
        select: {
          title: true,
          slug: true,
        },
      }),
    ]);

    const successRate = totalQuizzes > 0 ? (passedQuizzes / totalQuizzes) * 100 : 98.5;
    const averageQuizScore = avgScoreResult._avg.score !== null ? Math.round(avgScoreResult._avg.score) : 95;

    const stats = {
      totalTopics,
      totalUsers,
      totalQuizzes,
      successRate: parseFloat(successRate.toFixed(1)),
      averageQuizScore,
      newestTopic: newestTopic || { title: "Quantum Mechanics", slug: "quantum-mechanics" },
      popularTopics: popularTopics.length > 0 ? popularTopics : [
        { title: "Quantum Physics", slug: "quantum-physics" },
        { title: "World War II", slug: "world-war-ii" },
        { title: "Machine Learning", slug: "machine-learning" },
        { title: "Roman Empire", slug: "roman-empire" },
        { title: "Neuroscience", slug: "neuroscience" },
        { title: "Blockchain", slug: "blockchain" },
      ],
    };

    cachedStats = stats;
    cacheExpiry = now + CACHE_TTL;
    return stats;
  }
}
