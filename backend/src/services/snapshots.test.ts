import test from 'node:test';
import assert from 'node:assert/strict';
import type { SensorMapping } from '@prisma/client';
import { buildDailySnapshots } from './snapshots';

const mapping: SensorMapping = {
  id: 'mapping-1',
  connectionId: 'connection-1',
  stepsEntityId: 'sensor.steps',
  weightEntityId: null,
  distanceEntityId: null,
  activeMinutesEntityId: null,
  caloriesEntityId: null,
  createdAt: new Date('2026-06-03T00:00:00.000Z'),
  updatedAt: new Date('2026-06-03T00:00:00.000Z')
};

test('buildDailySnapshots keeps the daily maximum for cumulative step sensors', () => {
  const snapshots = buildDailySnapshots({
    history: [
      [
        {
          entity_id: 'sensor.steps',
          state: '1200',
          last_changed: '2026-06-02T08:00:00+02:00',
          last_updated: '2026-06-02T08:00:00+02:00',
          attributes: {}
        },
        {
          entity_id: 'sensor.steps',
          state: '8000',
          last_changed: '2026-06-02T21:45:00+02:00',
          last_updated: '2026-06-02T21:45:00+02:00',
          attributes: {}
        },
        {
          entity_id: 'sensor.steps',
          state: '50',
          last_changed: '2026-06-02T23:50:00+02:00',
          last_updated: '2026-06-02T23:50:00+02:00',
          attributes: {}
        }
      ]
    ],
    mapping,
    dayLabels: ['2026-06-02'],
    timeZone: 'Europe/Berlin',
    defaultStepLengthMeters: 0.75
  });

  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0]?.steps, 8000);
  assert.equal(snapshots[0]?.hasStepData, true);
});

test('buildDailySnapshots ignores the carry-over boundary sample at midnight', () => {
  // Home Assistant injects the previous day's final value as a synthetic
  // sample stamped on the day start. A "steps today" counter that resets only
  // later in the day must not inherit that carry-over, otherwise "today" stays
  // pinned to yesterday's total and never appears to reset at 0:00.
  const snapshots = buildDailySnapshots({
    history: [
      [
        {
          entity_id: 'sensor.steps',
          state: '12000', // carry-over from yesterday, stamped exactly on day start
          last_changed: '2026-06-05T00:00:00+02:00',
          last_updated: '2026-06-05T00:00:00+02:00',
          attributes: {}
        },
        {
          entity_id: 'sensor.steps',
          state: '200', // late reset once the first data of the new day arrives
          last_changed: '2026-06-05T07:30:00+02:00',
          last_updated: '2026-06-05T07:30:00+02:00',
          attributes: {}
        },
        {
          entity_id: 'sensor.steps',
          state: '8000',
          last_changed: '2026-06-05T18:00:00+02:00',
          last_updated: '2026-06-05T18:00:00+02:00',
          attributes: {}
        }
      ]
    ],
    mapping,
    dayLabels: ['2026-06-05'],
    timeZone: 'Europe/Berlin',
    defaultStepLengthMeters: 0.75
  });

  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0]?.steps, 8000);
  assert.equal(snapshots[0]?.hasStepData, true);
});

test('buildDailySnapshots reports zero before the daily counter has reset', () => {
  // Early morning: only the stale carry-over exists yet. Today's steps are not
  // known, so the day must read 0 (not yesterday's total) until real data lands.
  const snapshots = buildDailySnapshots({
    history: [
      [
        {
          entity_id: 'sensor.steps',
          state: '12000',
          last_changed: '2026-06-05T00:00:00+02:00',
          last_updated: '2026-06-05T00:00:00+02:00',
          attributes: {}
        }
      ]
    ],
    mapping,
    dayLabels: ['2026-06-05'],
    timeZone: 'Europe/Berlin',
    defaultStepLengthMeters: 0.75
  });

  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0]?.steps, 0);
  assert.equal(snapshots[0]?.hasStepData, false);
});

test('buildDailySnapshots marks missing step history without inventing data', () => {
  const snapshots = buildDailySnapshots({
    history: [],
    mapping,
    dayLabels: ['2026-06-02'],
    timeZone: 'Europe/Berlin',
    defaultStepLengthMeters: 0.75
  });

  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0]?.steps, 0);
  assert.equal(snapshots[0]?.hasStepData, false);
});
