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
  calories?: number;
}

const aggregateSnapshots = (snapshots: AggregatedDay[]): AggregatedDay[] => {
  const map = new Map<string, { date: Date; steps: number; weightValues: number[]; distance: number; activeMinutes: number; calories: number }>();

  for (const snapshot of snapshots) {
    const key = snapshot.date.toISOString().split('T')[0];
    if (!map.has(key)) {
      map.set(key, {
        date: startOfDay(snapshot.date),
        steps: 0,
        weightValues: [],
        distance: 0,
        activeMinutes: 0,
        calories: 0
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
    if (snapshot.calories) {
      entry.calories += snapshot.calories;
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
      activeMinutes: entry.activeMinutes || undefined,
      calories: entry.calories || undefined
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};

const computeAdaptiveGoal = (days: AggregatedDay[]) => {
  if (!days.length) {
    return {
      target: env.DEFAULT_DAILY_GOAL,
      recentAverage: env.DEFAULT_DAILY_GOAL,
      achievedDays: 0,
      message: 'Starte heute mit deinem Standardziel von 10.000 Schritten.'
    };
  }

  const sorted = [...days].sort((a, b) => a.date.getTime() - b.date.getTime());
  const recentWindow = sorted.slice(-7);
  const avg = recentWindow.reduce((sum, day) => sum + day.steps, 0) / recentWindow.length;

  const upperCap = 20000;
  let target = env.DEFAULT_DAILY_GOAL;

  if (avg > env.DEFAULT_DAILY_GOAL) {
    target = Math.min(upperCap, Math.round((avg * 1.05) / 100) * 100);
  } else if (avg < env.DEFAULT_DAILY_GOAL * 0.8) {
    target = Math.max(5000, Math.round(((avg * 0.9 + env.DEFAULT_DAILY_GOAL) / 2) / 100) * 100);
  }

  const achievedDays = recentWindow.filter((day) => day.steps >= target).length;

  let message = 'Neues Ziel, neuer Fokus – bleib dran!';
  if (achievedDays >= 5) {
    message = 'Du triffst dein Ziel konstant, deshalb pushen wir es leicht nach oben.';
  } else if (achievedDays <= 2) {
    message = 'Wir justieren dein Ziel behutsam, damit es erreichbar bleibt.';
  }

  return {
    target,
    recentAverage: Math.round(avg),
    achievedDays,
    message
  };
};

const mealReferences = [
  { id: 'salad', label: 'Salatbowl', calories: 350 },
  { id: 'bowl', label: 'Proteinschüssel', calories: 500 },
  { id: 'burger', label: 'Burger', calories: 650 },
  { id: 'pizza', label: 'Pizzastück', calories: 800 }
];

const pickMealReference = (calories: number) => {
  if (calories <= 0) return mealReferences[0];
  let match = mealReferences[0];
  for (const meal of mealReferences) {
    if (calories >= meal.calories) {
      match = meal;
    }
  }
  return match;
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
        activeMinutes: snapshot.activeMinutes ?? undefined,
        calories: snapshot.calories ?? undefined
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

    const adaptiveGoal = computeAdaptiveGoal(days);

    return {
      today: {
        steps: todayEntry?.steps ?? 0,
        goal: env.DEFAULT_DAILY_GOAL,
        average7: average(7),
        average30: average(30)
      },
      weekly: weekDays,
      lifetime: stats,
      dailyTarget: adaptiveGoal
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

  app.get('/calories', { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const today = startOfDay(new Date());
    const days = await loadAggregatedDays(userId);
    const series = days.map((day) => ({
      date: formatISO(day.date, { representation: 'date' }),
      calories: Math.round(day.calories ?? 0)
    }));

    const totalCalories = series.reduce((sum, item) => sum + item.calories, 0);
    const averageCalories = series.length ? Math.round(totalCalories / series.length) : 0;
    const baseMealCalories = 650;
    const totalMeals = baseMealCalories ? Number((totalCalories / baseMealCalories).toFixed(1)) : 0;

    const todayKey = formatISO(today, { representation: 'date' });
    const todayEntry = series.find((entry) => entry.date === todayKey) ?? { date: todayKey, calories: 0 };
    const meal = pickMealReference(todayEntry.calories);
    const mealCount = meal.calories ? Number((todayEntry.calories / meal.calories).toFixed(1)) : 0;

    return {
      series,
      totals: {
        totalCalories,
        averageCalories,
        totalMeals,
        baseMealCalories
      },
      today: {
        calories: todayEntry.calories,
        mealEquivalent: {
          label: meal.label,
          calories: meal.calories,
          count: mealCount
        }
      },
      references: mealReferences
    };
  });

  const challengeDefinitions = [
    {
      id: 'steps-100k',
      title: '100k Pioneer',
      description: 'Erreiche 100.000 Schritte insgesamt.',
      criteria: { totalSteps: 100_000 }
    },
    {
      id: 'steps-500k',
      title: 'Half-Million Walker',
      description: '500.000 Schritte gesamt.',
      criteria: { totalSteps: 500_000 }
    },
    {
      id: 'streak-7',
      title: '7-Day Momentum',
      description: 'Halte eine Serie von 7 aktiven Tagen (>=5.000 Schritte).',
      criteria: { longestStreak: 7 }
    },
    {
      id: 'streak-30',
      title: '30-Day Hero',
      description: '30 Tage hintereinander aktiv.',
      criteria: { longestStreak: 30 }
    },
    {
      id: 'best-week-90k',
      title: 'Weekly Legend',
      description: 'Eine Woche mit mindestens 90.000 Schritten.',
      criteria: { bestWeekSteps: 90_000 }
    }
  ];

  app.get('/challenges', { preHandler: [app.authenticate] }, async (request) => {
    const userId = getUserId(request);
    const stats = await loadLifetimeStats(userId);

    const challenges = challengeDefinitions.map((challenge) => {
      const unlocked = Object.entries(challenge.criteria).every(([key, value]) => {
        const statValue = (stats as Record<string, number>)[key];
        return typeof statValue === 'number' && statValue >= (value as number);
      });
      return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        unlocked,
        criteria: challenge.criteria,
        progress: {
          totalSteps: stats.totalSteps,
          longestStreak: stats.longestStreak,
          bestWeekSteps: stats.bestWeekSteps
        }
      };
    });

    return { challenges };
  });
}
