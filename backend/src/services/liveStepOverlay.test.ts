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

const buildLiveStateWithTimes = (
  state: string,
  lastChanged: string,
  lastUpdated: string
): HaStateEntity => ({
  entity_id: 'sensor.steps',
  state,
  last_changed: lastChanged,
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

test('overlayTodayLiveSteps ignores a stale value even when last_updated bumped to today', () => {
  // Yesterday's count (12000) is still reported in the early morning before the
  // daily counter resets. Its value last changed yesterday, but an attribute-only
  // refresh moved last_updated into today. The overlay must not pin today to it.
  const snapshots = overlayTodayLiveSteps({
    snapshots: [buildSnapshot(0, '2026-06-05')],
    liveState: buildLiveStateWithTimes(
      '12000',
      '2026-06-04T21:30:00+02:00', // value last changed yesterday
      '2026-06-05T03:00:00+02:00' // attribute-only refresh today
    ),
    timeZone: 'Europe/Berlin',
    todayLabel: '2026-06-05'
  });

  assert.equal(snapshots[0]?.steps, 0);
});
