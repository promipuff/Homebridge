import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../src/lib/calc';
import type { CalcInput } from '../src/types';

const base: CalcInput = {
  utility: 'electricity', unit: 'kWh', mode: 'meter',
  previousReading: '18240', currentReading: '18902', usage: '',
  rate: '0.142', cycleDays: '30', daysElapsed: '18', fixedCharge: '10', taxPercent: '6',
  budget: '130', previousBill: '150', arrangement: 'direct', shareType: 'percent',
  sharePercent: '40', shareAmount: '', reductionPercent: 0,
};
const close = (a: number, b: number, eps = 0.011) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);

test('meter readings → usage, projection and bill (scenario A)', () => {
  const { errors, result } = calculate(base);
  assert.equal(errors.length, 0);
  const r = result!;
  close(r.usageSoFar, 662);
  close(r.dailyUsage, 36.78);
  close(r.projectedUsage, 1103.33);
  // (1103.333 × 0.142 + 10) × 1.06 = 176.67
  close(r.projectedBill, 176.67);
  // (662 × 0.142 + 10) × 1.06 = 110.24
  close(r.toDateBill, 110.24);
  assert.equal(r.status, 'over');
  close(r.remaining!, -46.67);
  close(r.changeVsPrevious!.amount, 26.67);
  close(r.changeVsPrevious!.pct!, 17.78);
});

test('budget thresholds: on track ≤ 90%, approaching 90–100%, over > 100%', () => {
  assert.equal(calculate({ ...base, budget: '200' }).result!.status, 'on_track'); // 88%
  assert.equal(calculate({ ...base, budget: '190' }).result!.status, 'approaching'); // 93%
  assert.equal(calculate({ ...base, budget: '176' }).result!.status, 'over');
  assert.equal(calculate({ ...base, budget: '' }).result!.status, 'no_budget');
});

test('shared by percent applies only the user share', () => {
  const r = calculate({ ...base, arrangement: 'shared', sharePercent: '40', budget: '75' }).result!;
  close(r.yourPortion, 70.67);
  assert.equal(r.status, 'approaching');
});

test('shared by fixed agreed amount ignores household usage', () => {
  const r = calculate({ ...base, arrangement: 'shared', shareType: 'amount', shareAmount: '55', budget: '60' }).result!;
  assert.equal(r.yourPortion, 55);
  assert.equal(r.status, 'approaching');
  close(r.yourPortionToDate, 33);
});

test('included in rent is informational: nothing owed, no budget status', () => {
  const r = calculate({ ...base, arrangement: 'included' }).result!;
  assert.equal(r.yourPortion, 0);
  assert.equal(r.status, 'informational');
  assert.equal(r.budget, null);
  close(r.projectedBill, 176.67);
});

test('reduction scenario lowers only the remaining days', () => {
  const r = calculate({ ...base, reductionPercent: 10 }).result!;
  // remaining 12 days × 36.78 × 0.9 + 662 = 1059.2 kWh → (1059.2×0.142+10)×1.06 = 170.03
  close(r.reduction.projectedBill, 170.03, 0.02);
  close(r.reduction.savings, 6.64, 0.02);
});

test('water in CCF with direct usage entry', () => {
  const r = calculate({ ...base, utility: 'water', unit: 'CCF', mode: 'usage', usage: '4', rate: '6.5', cycleDays: '30', daysElapsed: '15', fixedCharge: '12', taxPercent: '0', budget: '' }).result!;
  close(r.projectedUsage, 8);
  close(r.projectedBill, 64);
});

test('validation: reversed readings, zero days, elapsed > cycle, bad numbers', () => {
  const e1 = calculate({ ...base, currentReading: '100' }).errors;
  assert.ok(e1.some((e) => e.field === 'currentReading'));
  const e2 = calculate({ ...base, daysElapsed: '0' }).errors;
  assert.ok(e2.some((e) => e.field === 'daysElapsed'));
  const e3 = calculate({ ...base, daysElapsed: '40', cycleDays: '30' }).errors;
  assert.ok(e3.some((e) => e.field === 'daysElapsed'));
  const e4 = calculate({ ...base, rate: 'abc' }).errors;
  assert.ok(e4.some((e) => e.field === 'rate'));
  const e5 = calculate({ ...base, cycleDays: '30.5' }).errors;
  assert.ok(e5.some((e) => e.field === 'cycleDays'));
  const e6 = calculate({ ...base, arrangement: 'shared', sharePercent: '140' }).errors;
  assert.ok(e6.some((e) => e.field === 'sharePercent'));
});

test('trajectory spans the full cycle and ends at the projected portion', () => {
  const r = calculate(base).result!;
  assert.equal(r.trajectory.length, 31);
  close(r.trajectory[30].cost, r.projectedBill);
  assert.equal(r.trajectory[18].actual, true);
  assert.equal(r.trajectory[19].actual, false);
});
