import type { FastifyInstance } from 'fastify';
import { addDays, startOfDay } from 'date-fns';

const sortValues = ['today', 'total'] as const;

export default async function leaderboardRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async (request) => {
    const sortParam = (request.query as { sort?: string }).sort;
    const sort = sortValues.includes(sortParam as any) ? (sortParam as 'today' | 'total') : 'total';
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    const [users, totalGroup, todayGroup] = await Promise.all([
      app.prisma.user.findMany({
        where: { showOnLeaderboard: true },
        select: { id: true, displayName: true }
      }),
      app.prisma.dailyHealthSnapshot.groupBy({
        by: ['userId'],
        _sum: { steps: true }
      }),
      app.prisma.dailyHealthSnapshot.groupBy({
        by: ['userId'],
        where: { date: { gte: today, lt: tomorrow } },
        _sum: { steps: true }
      })
    ]);

    const todayMap = new Map(todayGroup.map((entry) => [entry.userId, entry._sum.steps ?? 0]));
    const totalMap = new Map(totalGroup.map((entry) => [entry.userId, entry._sum.steps ?? 0]));

    const entries = users.map((user) => ({
      userId: user.id,
      displayName: user.displayName,
      stepsToday: todayMap.get(user.id) ?? 0,
      totalSteps: totalMap.get(user.id) ?? 0
    }));

    entries.sort((a, b) => {
      if (sort === 'today') {
        return b.stepsToday - a.stepsToday || b.totalSteps - a.totalSteps;
      }
      return b.totalSteps - a.totalSteps || b.stepsToday - a.stepsToday;
    });

    const limited = entries.slice(0, 10).map((entry, index) => ({
      rank: index + 1,
      displayName: entry.displayName,
      stepsToday: entry.stepsToday,
      totalSteps: entry.totalSteps
    }));

    return { entries: limited };
  });
}
