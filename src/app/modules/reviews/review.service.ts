import prisma from "../../config/prisma";
import { CreateReviewInput, UpdateReviewInput, GetReviewsQuery } from "./review.schema";
import { AppError } from "../../utils/AppError";

export class ReviewService {
  /**
   * Create a new review.
   */
  static async createReview(userId: string, input: CreateReviewInput) {
    const { topicId, rating, comment } = input;

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
      // Return the updated one (or we can throw, but upsert is much friendlier for completions)
      return prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment,
        },
        include: {
          topic: {
            select: { id: true, title: true, slug: true },
          },
        },
      });
    }

    return prisma.review.create({
      data: {
        userId,
        topicId,
        rating,
        comment,
      },
      include: {
        topic: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  /**
   * Get paginated reviews.
   */
  static async getReviews(query: GetReviewsQuery) {
    const { page, limit, topicId, userId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (topicId) where.topicId = topicId;
    if (userId) where.userId = userId;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          topic: {
            select: { id: true, title: true, slug: true },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get review by ID.
   */
  static async getReviewById(id: string) {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        topic: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    if (!review) {
      throw new AppError("Review not found.", 404);
    }

    return review;
  }

  /**
   * Update an existing review.
   */
  static async updateReview(userId: string, userRole: string, id: string, input: UpdateReviewInput) {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new AppError("Review not found.", 404);
    }

    // Only owner or admin can update
    if (review.userId !== userId && userRole !== "ADMIN") {
      throw new AppError("You are not authorized to update this review.", 403);
    }

    return prisma.review.update({
      where: { id },
      data: {
        rating: input.rating,
        comment: input.comment,
      },
      include: {
        topic: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
  }

  /**
   * Delete a review.
   */
  static async deleteReview(userId: string, userRole: string, id: string) {
    const review = await prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new AppError("Review not found.", 404);
    }

    // Only owner or admin can delete
    if (review.userId !== userId && userRole !== "ADMIN") {
      throw new AppError("You are not authorized to delete this review.", 403);
    }

    await prisma.review.delete({ where: { id } });
    return { id };
  }
}
