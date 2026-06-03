export interface StepSnapshotValues {
  steps: number;
  hasStepData?: boolean;
  weight?: number;
  distanceKm?: number;
  activeMinutes?: number;
  calories?: number;
}

export interface ExistingSnapshotValues {
  steps: number;
}

export interface SnapshotWriteDecision {
  shouldWrite: boolean;
  steps: number;
}

export const hasSnapshotData = (snapshot: StepSnapshotValues) =>
  snapshot.hasStepData ||
  typeof snapshot.weight === 'number' ||
  typeof snapshot.distanceKm === 'number' ||
  typeof snapshot.activeMinutes === 'number' ||
  typeof snapshot.calories === 'number';

export const resolveStepWrite = (params: {
  existing?: ExistingSnapshotValues | null;
  snapshot: StepSnapshotValues;
  targetLabel: string;
  todayLabel: string;
  syncType: 'IMPORT' | 'SYNC' | 'SCHEDULED';
}): SnapshotWriteDecision => {
  const hasAnyData = hasSnapshotData(params.snapshot);
  const isPastDay = params.targetLabel < params.todayLabel;

  if (!params.existing) {
    return {
      shouldWrite: hasAnyData || params.targetLabel === params.todayLabel,
      steps: params.snapshot.steps
    };
  }

  if (!hasAnyData && isPastDay) {
    return {
      shouldWrite: false,
      steps: params.existing.steps
    };
  }

  if (!params.snapshot.hasStepData && isPastDay) {
    return {
      shouldWrite: true,
      steps: params.existing.steps
    };
  }

  if (isPastDay && params.syncType !== 'IMPORT' && params.snapshot.steps < params.existing.steps) {
    return {
      shouldWrite: true,
      steps: params.existing.steps
    };
  }

  return {
    shouldWrite: true,
    steps: params.snapshot.steps
  };
};
