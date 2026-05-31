import type { SensorMapping } from '@prisma/client';
import type { HistoryResponse, HaStateEntity } from './homeAssistant';
import { dayLabelToUtcDate, getZonedDayBounds, getZonedDayLabel } from './timezone';

export interface DailySnapshotInput {
  history: HistoryResponse;
  mapping: SensorMapping;
  dayLabels: string[];
  timeZone: string;
  defaultStepLengthMeters: number;
}

export interface DailySnapshotResult {
  date: Date;
  steps: number;
  weight?: number;
  distanceKm?: number;
  activeMinutes?: number;
  calories?: number;
  hasStepData?: boolean;
}

const parseNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const buildDailySnapshots = (params: DailySnapshotInput): DailySnapshotResult[] => {
  const entityMap = new Map<string, HaStateEntity[]>();
  for (const entries of params.history) {
    if (entries.length) {
      entityMap.set(entries[0].entity_id, entries);
    }
  }

  const dayAggregation = new Map<
    string,
    {
      weightValues: number[];
      distance?: number;
      activeMinutes?: number;
      calories?: number;
    }
  >();

  const trackEntry = (entityId: string | null | undefined, handler: (entry: HaStateEntity) => void) => {
    if (!entityId) return;
    const entries = entityMap.get(entityId);
    if (!entries) return;
    for (const entry of entries) {
      handler(entry);
    }
  };

  const ensureDay = (dayKey: string) => {
    if (!dayAggregation.has(dayKey)) {
      dayAggregation.set(dayKey, { weightValues: [] });
    }
    return dayAggregation.get(dayKey)!;
  };

  trackEntry(params.mapping.weightEntityId, (entry) => {
    const value = parseNumber(entry.state);
    if (value === undefined) return;
    const dayKey = getZonedDayLabel(entry.last_changed, params.timeZone);
    ensureDay(dayKey).weightValues.push(value);
  });

  trackEntry(params.mapping.distanceEntityId, (entry) => {
    const value = parseNumber(entry.state);
    if (value === undefined) return;
    const dayKey = getZonedDayLabel(entry.last_changed, params.timeZone);
    const day = ensureDay(dayKey);
    day.distance = Math.max(day.distance ?? 0, value);
  });

  trackEntry(params.mapping.activeMinutesEntityId, (entry) => {
    const value = parseNumber(entry.state);
    if (value === undefined) return;
    const dayKey = getZonedDayLabel(entry.last_changed, params.timeZone);
    const day = ensureDay(dayKey);
    day.activeMinutes = Math.max(day.activeMinutes ?? 0, Math.round(value));
  });

  trackEntry(params.mapping.caloriesEntityId, (entry) => {
    const value = parseNumber(entry.state);
    if (value === undefined) return;
    const dayKey = getZonedDayLabel(entry.last_changed, params.timeZone);
    const day = ensureDay(dayKey);
    day.calories = Math.max(day.calories ?? 0, Math.round(value));
  });

  const snapshots: DailySnapshotResult[] = [];
  const stepSeries = computeDailySteps(
    entityMap.get(params.mapping.stepsEntityId ?? ''),
    params.dayLabels,
    params.timeZone
  );

  params.dayLabels.forEach((key, index) => {
    const aggregate = dayAggregation.get(key);
    const weightValues = aggregate?.weightValues ?? [];
    const weight = weightValues.length
      ? Number((weightValues.reduce((a, b) => a + b, 0) / weightValues.length).toFixed(2))
      : undefined;

    const { value: steps, hasData: hasStepData } = stepSeries[index] ?? { value: 0, hasData: false };

    let distanceKm: number | undefined;
    if (typeof aggregate?.distance === 'number') {
      const normalized = aggregate.distance > 500 ? aggregate.distance / 1000 : aggregate.distance;
      distanceKm = Number(normalized.toFixed(2));
    } else if (steps > 0) {
      distanceKm = Number(((steps * params.defaultStepLengthMeters) / 1000).toFixed(2));
    }
    const activeMinutes = aggregate?.activeMinutes;
    const calories = aggregate?.calories;

    snapshots.push({
      date: dayLabelToUtcDate(key),
      steps,
      weight,
      distanceKm,
      activeMinutes,
      calories,
      hasStepData
    });
  });

  return snapshots;
};

const computeDailySteps = (entries: HaStateEntity[] | undefined, dayLabels: string[], timeZone: string) => {
  if (!entries || !entries.length) {
    return dayLabels.map(() => ({ value: 0, hasData: false }));
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.last_changed).getTime() - new Date(b.last_changed).getTime()
  );
  const results: { value: number; hasData: boolean }[] = [];
  let pointer = 0;

  for (const dayLabel of dayLabels) {
    const { start, end } = getZonedDayBounds(dayLabel, timeZone);
    const dayStart = start.getTime();
    const dayEnd = end.getTime();
    let latestValue: number | null = null;

    while (pointer < sorted.length) {
      const entry = sorted[pointer];
      const ts = new Date(entry.last_changed).getTime();
      if (ts < dayStart) {
        pointer++;
        continue;
      }
      if (ts >= dayEnd) {
        break;
      }
      const value = parseNumber(entry.state);
      if (typeof value === 'number') {
        latestValue = Math.round(value);
      }
      pointer++;
    }

    results.push({ value: latestValue ?? 0, hasData: latestValue !== null });
  }

  return results;
};
