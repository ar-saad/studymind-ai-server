import prisma from "../../config/prisma";
import { GetTopicsQuery, CreateTopicInput, SubmitReviewInput } from "./topic.schema";
import { AppError } from "../../utils/AppError";

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
}
