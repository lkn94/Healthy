import { eachDayOfInterval, startOfDay } from 'date-fns';
import type { SensorMapping } from '@prisma/client';
import type { HistoryResponse, HaStateEntity } from './homeAssistant';

export interface DailySnapshotInput {
  history: HistoryResponse;
  mapping: SensorMapping;
  from: Date;
  to: Date;
  defaultStepLengthMeters: number;
}

export interface DailySnapshotResult {
  date: Date;
  steps: number;
  weight?: number;
  distanceKm?: number;
  activeMinutes?: number;
  calories?: number;
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
      stepMax?: number;
      stepMin?: number;
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

  trackEntry(params.mapping.stepsEntityId, (entry) => {
    const value = parseNumber(entry.state);
    if (value === undefined) return;
    const dayKey = entry.last_changed.split('T')[0];
    const day = ensureDay(dayKey);
    const rounded = Math.round(value);
    day.stepMax = day.stepMax !== undefined ? Math.max(day.stepMax, rounded) : rounded;
    day.stepMin = day.stepMin !== undefined ? Math.min(day.stepMin, rounded) : rounded;
  });

  trackEntry(params.mapping.weightEntityId, (entry) => {
    const value = parseNumber(entry.state);
    if (value === undefined) return;
    const dayKey = entry.last_changed.split('T')[0];
    ensureDay(dayKey).weightValues.push(value);
  });

  trackEntry(params.mapping.distanceEntityId, (entry) => {
    const value = parseNumber(entry.state);
    if (value === undefined) return;
    const dayKey = entry.last_changed.split('T')[0];
    const day = ensureDay(dayKey);
    day.distance = Math.max(day.distance ?? 0, value);
  });

  trackEntry(params.mapping.activeMinutesEntityId, (entry) => {
    const value = parseNumber(entry.state);
    if (value === undefined) return;
    const dayKey = entry.last_changed.split('T')[0];
    const day = ensureDay(dayKey);
    day.activeMinutes = Math.max(day.activeMinutes ?? 0, Math.round(value));
  });

  trackEntry(params.mapping.caloriesEntityId, (entry) => {
    const value = parseNumber(entry.state);
    if (value === undefined) return;
    const dayKey = entry.last_changed.split('T')[0];
    const day = ensureDay(dayKey);
    day.calories = Math.max(day.calories ?? 0, Math.round(value));
  });

  const snapshots: DailySnapshotResult[] = [];
  const days = eachDayOfInterval({ start: startOfDay(params.from), end: startOfDay(params.to) });
  for (const day of days) {
    const key = day.toISOString().split('T')[0];
    const aggregate = dayAggregation.get(key);
    const weightValues = aggregate?.weightValues ?? [];
    const weight = weightValues.length
      ? Number((weightValues.reduce((a, b) => a + b, 0) / weightValues.length).toFixed(2))
      : undefined;

    const stepMax = aggregate?.stepMax ?? 0;
    const stepMin = aggregate?.stepMin;
    let steps = stepMax;
    if (typeof stepMin === 'number' && stepMin < stepMax) {
      steps = stepMax - stepMin;
    }

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
      date: day,
      steps,
      weight,
      distanceKm,
      activeMinutes,
      calories
    });
  }

  return snapshots;
};
