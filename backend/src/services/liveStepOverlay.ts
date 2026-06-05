import type { HaStateEntity } from './homeAssistant';
import type { DailySnapshotResult } from './snapshots';
import { getZonedDayLabel } from './timezone';

const parseNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
};

export const overlayTodayLiveSteps = (params: {
  snapshots: DailySnapshotResult[];
  liveState: HaStateEntity | null;
  timeZone: string;
  todayLabel: string;
}) => {
  if (!params.liveState) {
    return params.snapshots;
  }

  // Decide whether the live reading belongs to today by when its *value* last
  // changed (last_changed), not last_updated. Home Assistant bumps last_updated
  // on attribute-only changes too, so a stale value carried over from yesterday
  // can have last_updated == today while still reporting yesterday's count.
  // Keying on last_updated would let that stale value overlay today (e.g. before
  // the daily counter resets in the morning) and re-pin today to yesterday's total.
  const liveLabel = getZonedDayLabel(
    params.liveState.last_changed || params.liveState.last_updated,
    params.timeZone
  );
  if (liveLabel !== params.todayLabel) {
    return params.snapshots;
  }

  const liveSteps = parseNumber(params.liveState.state);
  if (liveSteps === undefined) {
    return params.snapshots;
  }

  return params.snapshots.map((snapshot) => {
    const snapshotLabel = snapshot.date.toISOString().split('T')[0];
    if (snapshotLabel !== params.todayLabel) {
      return snapshot;
    }
    if (liveSteps <= snapshot.steps) {
      return snapshot;
    }
    return {
      ...snapshot,
      steps: liveSteps,
      hasStepData: true
    };
  });
};
