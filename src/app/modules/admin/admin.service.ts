import prisma from "../../config/prisma";
import {
  GetUsersQuery,
  UpdateUserPlanInput,
  GetGenerationLogsQuery,
  GetTopicAnalyticsQuery,
} from "./admin.schema";
import { AppError } from "../../utils/AppError";

export class AdminService {
  /**
   * Get platform overview KPIs.
   */
  static async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
    const fourteenDaysAgo = new Date(today.getTime() - 14 * 86400000);

    const [
      totalUsers,
      proUsers,
      freeUsers,
      totalGenerationsToday,
      totalGenerationsMonth,
      recentSignups,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: "PRO" } }),
      prisma.user.count({ where: { plan: "FREE" } }),
      prisma.generationLog.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.generationLog.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          createdAt: true,
        },
      }),
    ]);

    const conversionRate =
      totalUsers > 0 ? Math.round((proUsers / totalUsers) * 100) : 0;

    // New user signups over last 30 days
    const signupsByDay = await prisma.user.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
    });

    // AI generations per day over last 14 days
    const generationsByDay = await prisma.generationLog.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: fourteenDaysAgo } },
      _count: true,
    });

    return {
      kpis: {
        totalUsers,
        proUsers,
        freeUsers,
        conversionRate,
        totalGenerationsToday,
        totalGenerationsMonth,
      },
      recentSignups,
      signupsByDay: signupsByDay.map((s) => ({
        date: s.createdAt,
        count: s._count,
      })),
      generationsByDay: generationsByDay.map((g) => ({
        date: g.createdAt,
        count: g._count,
      })),
    };
  }

  /**
   * Get paginated users list with search and filters.
   */
  static async getUsers(query: GetUsersQuery) {
    const { page, limit, search, plan, role } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (plan) where.plan = plan;
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          role: true,
          dailyGenerations: true,
          createdAt: true,
          image: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update a user's plan.
   */
  static async updateUserPlan(userId: string, input: UpdateUserPlanInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found.", 404);

    return prisma.user.update({
      where: { id: userId },
      data: { plan: input.plan },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        role: true,
      },
    });
  }

  /**
   * Delete a user.
   */
  static async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found.", 404);

    // Delete in order of dependencies
    await prisma.quizAnswer.deleteMany({
      where: { quizResult: { userId } },
    });
    await prisma.quizResult.deleteMany({ where: { userId } });
    await prisma.studySession.deleteMany({ where: { userId } });
    await prisma.generationLog.deleteMany({ where: { userId } });
    await prisma.review.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  }

  /**
   * Get paginated generation logs.
   */
  static async getGenerationLogs(query: GetGenerationLogsQuery) {
    const { page, limit, type, dateFrom, dateTo, userId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      prisma.generationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
          topic: { select: { title: true } },
        },
      }),
      prisma.generationLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get topic analytics.
   */
  static async getTopicAnalytics(query: GetTopicAnalyticsQuery) {
    const where: any = {};
    if (query.category) {
      where.category = { equals: query.category, mode: "insensitive" };
    }

    const topics = await prisma.topic.findMany({
      where,
      orderBy: { studyCount: "desc" },
      include: {
        _count: {
          select: {
            studySessions: true,
            quizResults: true,
          },
        },
      },
    });

    // Get avg quiz score per topic
    const topicIds = topics.map((t) => t.id);
    const quizResults = await prisma.quizResult.groupBy({
      by: ["topicId"],
      where: { topicId: { in: topicIds } },
      _avg: { score: true },
      _count: true,
    });

    const quizMap = new Map(quizResults.map((q) => [q.topicId, q]));

    return topics.map((t) => {
      const quiz = quizMap.get(t.id);
      return {
        id: t.id,
        title: t.title,
        category: t.category,
        difficulty: t.difficulty,
        studyCount: t.studyCount,
        totalSessions: t._count.studySessions,
        totalQuizzes: t._count.quizResults,
        averageQuizScore: quiz?._avg?.score
          ? Math.round(quiz._avg.score)
          : null,
      };
    });
  }
}
