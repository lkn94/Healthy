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

  const liveLabel = getZonedDayLabel(
    params.liveState.last_updated || params.liveState.last_changed,
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
