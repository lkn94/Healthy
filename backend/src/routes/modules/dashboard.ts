import type { FastifyInstance, FastifyRequest } from 'fastify';
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  formatISO,
  getISOWeek,
  getISOWeekYear,
  isSameDay,
  startOfDay,
  subDays
} from 'date-fns';
import { env } from '../../env';

interface AggregatedDay {
  date: Date;
  steps: number;
  weight?: number;
  distanceKm?: number;
  activeMinutes?: number;
}

const aggregateSnapshots = (snapshots: AggregatedDay[]): AggregatedDay[] => {
  const map = new Map<string, { date: Date; steps: number; weightValues: number[]; distance: number; activeMinutes: number }>();

  for (const snapshot of snapshots) {
    const key = snapshot.date.toISOString().split('T')[0];
    if (!map.has(key)) {
      map.set(key, {
        date: startOfDay(snapshot.date),
        steps: 0,
        weightValues: [],
        distance: 0,
        activeMinutes: 0
      });
    }
    const entry = map.get(key)!;
    entry.steps += snapshot.steps;
    if (snapshot.weight) {
      entry.weightValues.push(snapshot.weight);
    }
    if (snapshot.distanceKm) {
      entry.distance += snapshot.distanceKm;
    }
    if (snapshot.activeMinutes) {
      entry.activeMinutes += snapshot.activeMinutes;
    }
  }

  return [...map.values()] 
    .map((entry) => ({
      date: entry.date,
      steps: entry.steps,
      weight: entry.weightValues.length
        ? Number((entry.weightValues.reduce((a, b) => a + b, 0) / entry.weightValues.length).toFixed(2))
        : undefined,
      distanceKm: entry.distance ? Number(entry.distance.toFixed(2)) : undefined,
      activeMinutes: entry.activeMinutes || undefined
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

export default async function dashboardRoutes(app: FastifyInstance) {
  const getUserId = (request: FastifyRequest) => request.user.id;

  const loadAggregatedDays = async (userId: string) => {
    const snapshots = await app.prisma.dailyHealthSnapshot.findMany({
      where: { userId },
      orderBy: { date: 'asc' }
    });
    return aggregateSnapshots(
      snapshots.map((snapshot) => ({
        date: snapshot.date,
        steps: snapshot.steps,
        weight: snapshot.weight ?? undefined,
        distanceKm: snapshot.distanceKm ?? undefined,
        activeMinutes: snapshot.activeMinutes ?? undefined
      }))
    );
  };

  const loadLifetimeStats = async (userId: string) => {
    const stats = await app.prisma.lifetimeStat.findMany({
      where: { connection: { userId } }
    });
    return stats.reduce(
      (acc, stat) => {
        acc.totalSteps += stat.totalSteps;
        acc.totalKm += stat.totalKm;
        acc.bestDaySteps = Math.max(acc.bestDaySteps, stat.bestDaySteps);
        acc.bestWeekSteps = Math.max(acc.bestWeekSteps, stat.bestWeekSteps);
        acc.longestStreak = Math.max(acc.longestStreak, stat.longestStreak);
        acc.daysTracked += stat.daysTracked;
        return acc;
      },
      { totalSteps: 0, totalKm: 0, bestDaySteps: 0, bestWeekSteps: 0, longestStreak: 0, daysTracked: 0 }
    );
  };

  app.get('/overview', { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const today = startOfDay(new Date());
    const days = await loadAggregatedDays(userId);
    const todayEntry = days.find((day) => isSameDay(day.date, today));

    const average = (length: number) => {
      const relevant = days.filter((day) => differenceInCalendarDays(today, day.date) < length);
      if (!relevant.length) return 0;
      const total = relevant.reduce((sum, day) => sum + day.steps, 0);
      return Math.round(total / relevant.length);
    };

    const stats = await loadLifetimeStats(userId);

    const weekDays = eachDayOfInterval({ start: subDays(today, 6), end: today }).map((date) => {
      const entry = days.find((day) => isSameDay(day.date, date));
      return {
        date: formatISO(date, { representation: 'date' }),
        steps: entry?.steps ?? 0
      };
    });

    return {
      today: {
        steps: todayEntry?.steps ?? 0,
        goal: env.DEFAULT_DAILY_GOAL,
        average7: average(7),
        average30: average(30)
      },
      weekly: weekDays,
      lifetime: stats
    };
  });

  app.get('/progress', { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const today = startOfDay(new Date());
    const days = await loadAggregatedDays(userId);

    const last7 = eachDayOfInterval({ start: subDays(today, 6), end: today }).map((date) => {
      const entry = days.find((day) => isSameDay(day.date, date));
      return {
        date: formatISO(date, { representation: 'date' }),
        steps: entry?.steps ?? 0
      };
    });

    const last30 = eachDayOfInterval({ start: subDays(today, 29), end: today }).map((date) => {
      const entry = days.find((day) => isSameDay(day.date, date));
      return {
        date: formatISO(date, { representation: 'date' }),
        steps: entry?.steps ?? 0
      };
    });

    const heatmapRange = eachDayOfInterval({ start: subDays(today, 119), end: today });
    const heatmap = heatmapRange.map((date) => {
      const entry = days.find((day) => isSameDay(day.date, date));
      return {
        date: formatISO(date, { representation: 'date' }),
        steps: entry?.steps ?? 0
      };
    });

    const recordDay = days.reduce(
      (best, current) => (current.steps > best.steps ? current : best),
      { date: today, steps: 0 } as AggregatedDay
    );

    const weeklySums = new Map<string, number>();
    for (const day of days) {
      const weekKey = `${getISOWeekYear(day.date)}-${getISOWeek(day.date)}`;
      weeklySums.set(weekKey, (weeklySums.get(weekKey) ?? 0) + day.steps);
    }
    const bestWeek = Array.from(weeklySums.values()).reduce((max, value) => Math.max(max, value), 0);

    return {
      last7,
      last30,
      heatmap,
      records: {
        bestDaySteps: recordDay.steps,
        bestDayDate: formatISO(recordDay.date, { representation: 'date' }),
        bestWeekSteps: bestWeek
      }
    };
  });

  app.get('/lifetime', { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const stats = await loadLifetimeStats(userId);
    return stats;
  });

  app.get('/body', { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const today = startOfDay(new Date());
    const days = await loadAggregatedDays(userId);
    const last30 = eachDayOfInterval({ start: subDays(today, 29), end: today }).map((date) => {
      const entry = days.find((day) => isSameDay(day.date, date));
      return {
        date: formatISO(date, { representation: 'date' }),
        weight: entry?.weight,
        activeMinutes: entry?.activeMinutes ?? 0
      };
    });

    const weights = last30.map((item) => item.weight).filter((value): value is number => typeof value === 'number');
    const averageWeight = weights.length
      ? Number((weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(2))
      : null;

    return {
      trend: last30,
      averageWeight
    };
  });
}
