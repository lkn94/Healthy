import type { PrismaClient } from '@prisma/client';
import { differenceInCalendarDays, getISOWeek, getISOWeekYear } from 'date-fns';

export interface LifetimeStats {
  totalSteps: number;
  totalKm: number;
  bestDaySteps: number;
  bestWeekSteps: number;
  currentStreak: number;
  longestStreak: number;
  daysTracked: number;
}

export const calculateLifetimeStats = (snapshots: { date: Date; steps: number; distanceKm?: number }[]): LifetimeStats => {
  const sorted = [...snapshots].sort((a, b) => a.date.getTime() - b.date.getTime());
  let totalSteps = 0;
  let totalKm = 0;
  let bestDaySteps = 0;
  let bestWeekSteps = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let lastActiveDate: Date | null = null;

  const weeklyTotals = new Map<string, number>();

  for (const snapshot of sorted) {
    totalSteps += snapshot.steps;
    if (snapshot.distanceKm) {
      totalKm += snapshot.distanceKm;
    }
    if (snapshot.steps > bestDaySteps) {
      bestDaySteps = snapshot.steps;
    }

    const weekKey = `${getISOWeekYear(snapshot.date)}-${getISOWeek(snapshot.date)}`;
    weeklyTotals.set(weekKey, (weeklyTotals.get(weekKey) ?? 0) + snapshot.steps);

    const isActiveDay = snapshot.steps >= 5000;
    if (isActiveDay) {
      if (lastActiveDate && differenceInCalendarDays(snapshot.date, lastActiveDate) === 1) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      lastActiveDate = snapshot.date;
    } else {
      currentStreak = 0;
      lastActiveDate = null;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
  }

  for (const value of weeklyTotals.values()) {
    if (value > bestWeekSteps) {
      bestWeekSteps = value;
    }
  }

  return {
    totalSteps,
    totalKm: Number(totalKm.toFixed(2)),
    bestDaySteps,
    bestWeekSteps,
    currentStreak,
    longestStreak,
    daysTracked: snapshots.length
  };
};

export const recalculateLifetimeStats = async (
  prisma: PrismaClient,
  connectionId: string
) => {
  const snapshots = await prisma.dailyHealthSnapshot.findMany({
    where: { connectionId },
    orderBy: { date: 'asc' }
  });

  const stats = calculateLifetimeStats(
    snapshots.map((snapshot) => ({
      date: snapshot.date,
      steps: snapshot.steps,
      distanceKm: snapshot.distanceKm ?? undefined
    }))
  );

  await prisma.lifetimeStat.upsert({
    where: { connectionId },
    update: stats,
    create: {
      connectionId,
      ...stats
    }
  });

  return stats;
};
