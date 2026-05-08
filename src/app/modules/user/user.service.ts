import prisma from "../../config/prisma";
import { GetStudyHistoryQuery, GetQuizResultsQuery, UpdateProfileInput } from "./user.schema";
import { AppError } from "../../utils/AppError";

export class UserService {
  /**
   * Get dashboard overview stats for a user.
   */
  static async getDashboardOverview(userId: string) {
    const [
      topicsStudied,
      quizzesTaken,
      quizResults,
      recentActivity,
      user,
    ] = await Promise.all([
      prisma.studySession.count({ where: { userId } }),
      prisma.quizResult.count({ where: { userId } }),
      prisma.quizResult.findMany({
        where: { userId },
        select: { score: true, totalQuestions: true },
      }),
      prisma.studySession.findMany({
        where: { userId },
        orderBy: { startedAt: "desc" },
        take: 5,
        include: {
          topic: {
            select: { title: true, slug: true, category: true },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          plan: true,
          dailyGenerations: true,
          lastGenerationDate: true,
          image: true,
        },
      }),
    ]);

    // Calculate average score
    const avgScore =
      quizResults.length > 0
        ? Math.round(
            quizResults.reduce(
              (sum, q) => sum + (q.score / q.totalQuestions) * 100,
              0
            ) / quizResults.length
          )
        : 0;

    // Daily generation limit based on plan
    const dailyLimit = user?.plan === "PRO" ? "Unlimited" : 5;

    return {
      user: {
        name: user?.name,
        email: user?.email,
        plan: user?.plan,
        image: user?.image,
      },
      stats: {
        topicsStudied,
        quizzesTaken,
        averageScore: avgScore,
        dailyGenerationsUsed: user?.dailyGenerations || 0,
        dailyLimit,
      },
      recentActivity,
    };
  }

  /**
   * Get paginated study history for a user.
   */
  static async getStudyHistory(userId: string, query: GetStudyHistoryQuery) {
    const { page, limit, category, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (category) {
      where.topic = { category: { equals: category, mode: "insensitive" } };
    }

    if (dateFrom || dateTo) {
      where.startedAt = {};
      if (dateFrom) where.startedAt.gte = new Date(dateFrom);
      if (dateTo) where.startedAt.lte = new Date(dateTo);
    }

    const [sessions, total] = await Promise.all([
      prisma.studySession.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
        include: {
          topic: {
            select: {
              title: true,
              slug: true,
              category: true,
              difficulty: true,
            },
          },
        },
      }),
      prisma.studySession.count({ where }),
    ]);

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get paginated quiz results for a user.
   */
  static async getQuizResults(userId: string, query: GetQuizResultsQuery) {
    const { page, limit, scoreMin, scoreMax, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (dateFrom || dateTo) {
      where.completedAt = {};
      if (dateFrom) where.completedAt.gte = new Date(dateFrom);
      if (dateTo) where.completedAt.lte = new Date(dateTo);
    }

    const [results, total] = await Promise.all([
      prisma.quizResult.findMany({
        where,
        orderBy: { completedAt: "desc" },
        skip,
        take: limit,
        include: {
          topic: {
            select: { title: true, slug: true, category: true },
          },
          answers: true,
        },
      }),
      prisma.quizResult.count({ where }),
    ]);

    // Filter by score percentage on application level if needed
    let filtered = results;
    if (scoreMin !== undefined || scoreMax !== undefined) {
      filtered = results.filter((r) => {
        const pct = Math.round((r.score / r.totalQuestions) * 100);
        if (scoreMin !== undefined && pct < scoreMin) return false;
        if (scoreMax !== undefined && pct > scoreMax) return false;
        return true;
      });
    }

    return {
      results: filtered,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get progress data for charts.
   */
  static async getProgress(userId: string) {
    // Quiz scores over time (last 20 quizzes)
    const quizScoresOverTime = await prisma.quizResult.findMany({
      where: { userId },
      orderBy: { completedAt: "asc" },
      take: 20,
      select: {
        score: true,
        totalQuestions: true,
        completedAt: true,
        topic: { select: { title: true, category: true } },
      },
    });

    // Topics studied by category
    const sessionsByCategory = await prisma.studySession.groupBy({
      by: ["topicId"],
      where: { userId },
      _count: true,
    });

    // Get topics for category info
    const topicIds = sessionsByCategory.map((s) => s.topicId);
    const topics = await prisma.topic.findMany({
      where: { id: { in: topicIds } },
      select: { id: true, category: true },
    });

    // Aggregate by category
    const categoryMap = new Map<string, number>();
    for (const session of sessionsByCategory) {
      const topic = topics.find((t) => t.id === session.topicId);
      if (topic) {
        categoryMap.set(
          topic.category,
          (categoryMap.get(topic.category) || 0) + session._count
        );
      }
    }

    // Accuracy per category
    const quizResultsWithCategory = await prisma.quizResult.findMany({
      where: { userId },
      select: {
        score: true,
        totalQuestions: true,
        topic: { select: { category: true } },
      },
    });

    const accuracyMap = new Map<
      string,
      { correct: number; total: number }
    >();
    for (const qr of quizResultsWithCategory) {
      const cat = qr.topic.category;
      const existing = accuracyMap.get(cat) || { correct: 0, total: 0 };
      existing.correct += qr.score;
      existing.total += qr.totalQuestions;
      accuracyMap.set(cat, existing);
    }

    // Calculate streak (consecutive days studied)
    const allSessions = await prisma.studySession.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    });

    let streak = 0;
    if (allSessions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sessionDates = new Set(
        allSessions.map((s) => {
          const d = new Date(s.startedAt);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      );

      const sortedDates = Array.from(sessionDates).sort((a, b) => b - a);
      const oneDayMs = 86400000;

      // Check if the user studied today or yesterday
      if (
        sortedDates[0] === today.getTime() ||
        sortedDates[0] === today.getTime() - oneDayMs
      ) {
        streak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          if (sortedDates[i] === sortedDates[i - 1] - oneDayMs) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    return {
      quizScoresOverTime: quizScoresOverTime.map((q) => ({
        date: q.completedAt,
        score: Math.round((q.score / q.totalQuestions) * 100),
        topic: q.topic.title,
        category: q.topic.category,
      })),
      topicsByCategory: Array.from(categoryMap.entries()).map(
        ([category, count]) => ({
          category,
          count,
        })
      ),
      accuracyByCategory: Array.from(accuracyMap.entries()).map(
        ([category, data]) => ({
          category,
          accuracy: Math.round((data.correct / data.total) * 100),
        })
      ),
      streak,
    };
  }

  /**
   * Update user profile.
   */
  static async updateProfile(userId: string, input: UpdateProfileInput) {
    return prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true,
        role: true,
      },
    });
  }

  /**
   * Delete user account.
   */
  static async deleteAccount(userId: string) {
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
}
