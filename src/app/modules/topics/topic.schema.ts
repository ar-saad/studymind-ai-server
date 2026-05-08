import { z } from "zod";

export const getTopicsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  search: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
  sort: z.enum(["popular", "newest", "alphabetical"]).default("popular"),
});

export const createTopicSchema = z.object({
  title: z.string().min(2).max(200),
  category: z.string().min(2).max(50),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  description: z.string().min(10).max(2000),
  imageUrl: z.string().url().optional(),
});

export const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type GetTopicsQuery = z.infer<typeof getTopicsQuerySchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
