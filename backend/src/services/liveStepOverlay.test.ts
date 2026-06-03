import test from 'node:test';
import assert from 'node:assert/strict';
import type { HaStateEntity } from './homeAssistant';
import { overlayTodayLiveSteps } from './liveStepOverlay';
import type { DailySnapshotResult } from './snapshots';

const buildSnapshot = (steps: number, date: string): DailySnapshotResult => ({
  date: new Date(`${date}T00:00:00.000Z`),
  steps,
  hasStepData: true
});

const buildLiveState = (state: string, lastUpdated: string): HaStateEntity => ({
  entity_id: 'sensor.steps',
  state,
  last_changed: lastUpdated,
  last_updated: lastUpdated,
  attributes: {}
});

test('overlayTodayLiveSteps raises today to the live state when it is newer and higher', () => {
  const snapshots = overlayTodayLiveSteps({
    snapshots: [buildSnapshot(2008, '2026-06-03')],
    liveState: buildLiveState('4558', '2026-06-03T18:15:00+02:00'),
    timeZone: 'Europe/Berlin',
    todayLabel: '2026-06-03'
  });

  assert.equal(snapshots[0]?.steps, 4558);
  assert.equal(snapshots[0]?.hasStepData, true);
});

test('overlayTodayLiveSteps never lowers today below the history-derived value', () => {
  const snapshots = overlayTodayLiveSteps({
    snapshots: [buildSnapshot(4558, '2026-06-03')],
    liveState: buildLiveState('2008', '2026-06-03T18:15:00+02:00'),
    timeZone: 'Europe/Berlin',
    todayLabel: '2026-06-03'
  });

  assert.equal(snapshots[0]?.steps, 4558);
});

test('overlayTodayLiveSteps ignores stale live states from a different day', () => {
  const snapshots = overlayTodayLiveSteps({
    snapshots: [buildSnapshot(2008, '2026-06-03')],
    liveState: buildLiveState('4558', '2026-06-02T23:10:00+02:00'),
    timeZone: 'Europe/Berlin',
    todayLabel: '2026-06-03'
  });

  assert.equal(snapshots[0]?.steps, 2008);
});
