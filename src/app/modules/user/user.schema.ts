import { z } from "zod";

export const getStudyHistorySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  category: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const getQuizResultsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  scoreMin: z.coerce.number().int().min(0).max(100).optional(),
  scoreMax: z.coerce.number().int().min(0).max(100).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  image: z.string().url().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
});

export type GetStudyHistoryQuery = z.infer<typeof getStudyHistorySchema>;
export type GetQuizResultsQuery = z.infer<typeof getQuizResultsSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
