import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStepWrite } from './snapshotWrites';

test('resolveStepWrite preserves past steps when no new step history exists', () => {
  const decision = resolveStepWrite({
    existing: { steps: 8000 },
    snapshot: { steps: 0, hasStepData: false, calories: 650 },
    targetLabel: '2026-06-02',
    todayLabel: '2026-06-03',
    syncType: 'SCHEDULED'
  });

  assert.equal(decision.shouldWrite, true);
  assert.equal(decision.steps, 8000);
});

test('resolveStepWrite prevents scheduled regressions on past days', () => {
  const decision = resolveStepWrite({
    existing: { steps: 8000 },
    snapshot: { steps: 200, hasStepData: true },
    targetLabel: '2026-06-02',
    todayLabel: '2026-06-03',
    syncType: 'SYNC'
  });

  assert.equal(decision.shouldWrite, true);
  assert.equal(decision.steps, 8000);
});

test('resolveStepWrite allows explicit historical imports to correct past values', () => {
  const decision = resolveStepWrite({
    existing: { steps: 8000 },
    snapshot: { steps: 7200, hasStepData: true },
    targetLabel: '2026-06-02',
    todayLabel: '2026-06-03',
    syncType: 'IMPORT'
  });

  assert.equal(decision.shouldWrite, true);
  assert.equal(decision.steps, 7200);
});

test('resolveStepWrite skips creating empty past snapshots', () => {
  const decision = resolveStepWrite({
    snapshot: { steps: 0, hasStepData: false },
    targetLabel: '2026-06-02',
    todayLabel: '2026-06-03',
    syncType: 'SCHEDULED'
  });

  assert.equal(decision.shouldWrite, false);
  assert.equal(decision.steps, 0);
});
