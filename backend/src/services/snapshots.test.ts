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
