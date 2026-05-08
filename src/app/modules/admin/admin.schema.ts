import { z } from "zod";

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().optional(),
  plan: z.enum(["FREE", "PRO"]).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  status: z.enum(["active", "banned"]).optional(),
});

export const updateUserPlanSchema = z.object({
  plan: z.enum(["FREE", "PRO"]),
});

export const updateUserStatusSchema = z.object({
  banned: z.boolean(),
});

export const getGenerationLogsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  type: z.enum(["GUIDE", "QUIZ", "CHAT", "PATH"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  userId: z.string().optional(),
});

export const getTopicAnalyticsSchema = z.object({
  category: z.string().optional(),
});

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type UpdateUserPlanInput = z.infer<typeof updateUserPlanSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type GetGenerationLogsQuery = z.infer<typeof getGenerationLogsSchema>;
export type GetTopicAnalyticsQuery = z.infer<typeof getTopicAnalyticsSchema>;
