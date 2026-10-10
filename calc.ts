// Utility affordability calculator. Pure functions, unit-tested in tests/calc.test.ts.
//
// Rules (shown to the user in the app):
//   usage so far      = current reading - previous reading   (or the usage the user typed)
//   daily pace        = usage so far / days elapsed
//   projected usage   = daily pace x days in cycle          (straight-line projection)
//   bill              = (usage x rate + fixed charges) x (1 + tax%)
//   fixed charges are counted once per cycle, in full, in both the to-date and projected figures
//   your portion      = bill (paid directly) | bill x your % (shared by %) | your agreed amount
//   status            = on track (<= 90% of budget) | approaching (90-100%) | over (> 100%)
import type { CalcInput, MeteredUtility, UsageUnit } from '../types';

export interface FieldError {
  field: keyof CalcInput;
  message: string;
}

export type BudgetStatus = 'on_track' | 'approaching' | 'over' | 'no_budget' | 'informational';

export interface TrajectoryPoint {
  day: number;
  cost: number;
  reduced: number;
  actual: boolean;
}

export interface CalcResult {
  usageSoFar: number;
  dailyUsage: number;
  projectedUsage: number;
  unit: UsageUnit;
  toDateBill: number;
  projectedBill: number;
  /** What the resident is expected to pay (0 when utilities are included in rent/fees). */
  yourPortion: number;
  yourPortionToDate: number;
  budget: number | null;
  remaining: number | null;
  budgetUsedPct: number | null;
  status: BudgetStatus;
  changeVsPrevious: { amount: number; pct: number | null } | null;
  reduction: { percent: number; projectedBill: number; yourPortion: number; savings: number };
  trajectory: TrajectoryPoint[];
  warnings: string[];
}

export const APPROACHING_THRESHOLD = 0.9;

export const UNITS: Record<MeteredUtility, UsageUnit[]> = {
  electricity: ['kWh'],
  water: ['gal', 'CCF'],
};

/** Plausibility ceilings that trigger a warning (not an error). */
const RATE_CEILING: Record<UsageUnit, number> = { kWh: 1.5, gal: 0.1, CCF: 40 };

function num(raw: string): number | null {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).replace(/[$,%\s]/g, '');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function validate(input: CalcInput): FieldError[] {
  const errors: FieldError[] = [];
  const need = (field: keyof CalcInput, label: string, opts: { min?: number; max?: number; integer?: boolean; optional?: boolean } = {}) => {
    const raw = input[field] as unknown as string;
    const v = num(raw);
    if (v === null) {
      if (!opts.optional && (raw === '' || raw === undefined)) errors.push({ field, message: `Enter ${label}.` });
      else if (raw !== '' && raw !== undefined) errors.push({ field, message: `${capital(label)} must be a number.` });
      return null;
    }
    if (opts.integer && !Number.isInteger(v)) {
      errors.push({ field, message: `${capital(label)} must be a whole number.` });
      return v;
    }
    if (opts.min !== undefined && v < opts.min) {
      errors.push({ field, message: `${capital(label)} can't be less than ${opts.min}.` });
    } else if (opts.max !== undefined && v > opts.max) {
      errors.push({ field, message: `${capital(label)} can't be more than ${opts.max}.` });
    }
    return v;
  };

  if (input.mode === 'meter') {
    const prev = need('previousReading', 'the previous meter reading', { min: 0 });
    const cur = need('currentReading', 'the current meter reading', { min: 0 });
    if (prev !== null && cur !== null && cur < prev) {
      errors.push({
        field: 'currentReading',
        message: 'The current reading is lower than the previous one. Check the numbers, or switch to "I know my usage" if your meter rolled over.',
      });
    }
  } else {
    need('usage', 'your usage so far', { min: 0 });
  }
  need('rate', 'the rate per unit', { min: 0 });
  const cycle = need('cycleDays', 'the billing-cycle length', { min: 1, max: 62, integer: true });
  const elapsed = need('daysElapsed', 'the days elapsed so far', { min: 1, max: 62, integer: true });
  if (cycle !== null && elapsed !== null && elapsed > cycle) {
    errors.push({ field: 'daysElapsed', message: 'Days elapsed can’t be more than the days in the billing cycle.' });
  }
  need('fixedCharge', 'fixed charges', { min: 0, optional: true });
  need('taxPercent', 'the tax rate', { min: 0, max: 30, optional: true });
  need('previousBill', 'last period’s bill', { min: 0, optional: true });
  if (input.arrangement !== 'included') need('budget', 'your budget', { min: 0, optional: true });
  if (input.arrangement === 'shared') {
    if (input.shareType === 'percent') need('sharePercent', 'your share', { min: 0, max: 100 });
    else need('shareAmount', 'your agreed amount', { min: 0 });
  }
  return errors;
}

function capital(s: string) {
  const t = s.replace(/^(the|your) /, '');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function calculate(input: CalcInput): { errors: FieldError[]; result: CalcResult | null } {
  const errors = validate(input);
  if (errors.length) return { errors, result: null };

  const usageSoFar = input.mode === 'meter' ? num(input.currentReading)! - num(input.previousReading)! : num(input.usage)!;
  const rate = num(input.rate)!;
  const cycleDays = num(input.cycleDays)!;
  const daysElapsed = num(input.daysElapsed)!; // validated >= 1, so no division by zero
  const fixed = num(input.fixedCharge) ?? 0;
  const taxMult = 1 + (num(input.taxPercent) ?? 0) / 100;
  const budgetRaw = num(input.budget);
  const budget = input.arrangement === 'included' || budgetRaw === null || budgetRaw === 0 ? null : budgetRaw;
  const prevBill = num(input.previousBill);
  const r = Math.min(Math.max(input.reductionPercent || 0, 0), 50) / 100;

  const dailyUsage = usageSoFar / daysElapsed;
  const projectedUsage = dailyUsage * cycleDays;
  const bill = (u: number) => (u * rate + fixed) * taxMult;
  const toDateBill = bill(usageSoFar);
  const projectedBill = bill(projectedUsage);

  const portion = (householdBill: number, isToDate = false): number => {
    if (input.arrangement === 'included') return 0;
    if (input.arrangement === 'direct') return householdBill;
    if (input.shareType === 'percent') return householdBill * (num(input.sharePercent)! / 100);
    const amt = num(input.shareAmount)!;
    return isToDate ? amt * (daysElapsed / cycleDays) : amt;
  };

  const reducedUsage = usageSoFar + dailyUsage * (cycleDays - daysElapsed) * (1 - r);
  const reducedBill = bill(reducedUsage);

  const yourPortion = portion(projectedBill);
  const status: BudgetStatus =
    input.arrangement === 'included'
      ? 'informational'
      : budget === null
        ? 'no_budget'
        : yourPortion > budget
          ? 'over'
          : yourPortion > budget * APPROACHING_THRESHOLD
            ? 'approaching'
            : 'on_track';

  // The chart shows the resident's portion when it scales with usage; otherwise the household cost for context.
  const chartsPortion = input.arrangement === 'direct' || (input.arrangement === 'shared' && input.shareType === 'percent');
  const chartValue = (v: number) => (chartsPortion ? portion(v) : v);
  const trajectory: TrajectoryPoint[] = [];
  for (let d = 0; d <= cycleDays; d++) {
    const used = dailyUsage * d;
    const usedReduced = d <= daysElapsed ? used : usageSoFar + dailyUsage * (d - daysElapsed) * (1 - r);
    trajectory.push({ day: d, cost: round2(chartValue(bill(used))), reduced: round2(chartValue(bill(usedReduced))), actual: d <= daysElapsed });
  }

  const warnings: string[] = [];
  if (rate > RATE_CEILING[input.unit]) {
    warnings.push(`A rate of $${rate} per ${input.unit} is unusually high. Check that the rate matches the unit you selected.`);
  }
  if (rate === 0) warnings.push('The rate is $0, so the estimate only includes fixed charges and tax.');
  if (daysElapsed < 4) warnings.push('With fewer than 4 days of data, the projection can swing a lot. It will steady as the cycle goes on.');
  if (input.arrangement === 'shared' && input.shareType === 'amount') {
    warnings.push('Your agreed amount stays the same no matter what the household uses, so the chart shows the household bill for context.');
  }

  return {
    errors: [],
    result: {
      usageSoFar: round2(usageSoFar),
      dailyUsage: round2(dailyUsage),
      projectedUsage: round2(projectedUsage),
      unit: input.unit,
      toDateBill: round2(toDateBill),
      projectedBill: round2(projectedBill),
      yourPortion: round2(yourPortion),
      yourPortionToDate: round2(portion(toDateBill, true)),
      budget,
      remaining: budget === null ? null : round2(budget - yourPortion),
      budgetUsedPct: budget === null ? null : round2((yourPortion / budget) * 100),
      status,
      changeVsPrevious:
        prevBill === null
          ? null
          : { amount: round2(projectedBill - prevBill), pct: prevBill > 0 ? round2(((projectedBill - prevBill) / prevBill) * 100) : null },
      reduction: {
        percent: Math.round(r * 100),
        projectedBill: round2(reducedBill),
        yourPortion: round2(portion(reducedBill)),
        savings: round2(portion(projectedBill) - portion(reducedBill)),
      },
      trajectory,
      warnings,
    },
  };
}

export const STATUS_COPY: Record<BudgetStatus, { label: string; tone: 'ok' | 'amber' | 'danger' | 'muted'; explain: string }> = {
  on_track: { label: 'On track', tone: 'ok', explain: 'Your projected amount is at or below 90% of your budget.' },
  approaching: { label: 'Approaching budget', tone: 'amber', explain: 'Your projected amount is between 90% and 100% of your budget.' },
  over: { label: 'Projected to exceed budget', tone: 'danger', explain: 'At the current pace, your amount will be more than your budget.' },
  no_budget: { label: 'No budget set', tone: 'muted', explain: 'Add a budget to see whether you are on track.' },
  informational: {
    label: 'Included in rent or fees',
    tone: 'muted',
    explain: 'This estimate shows what your usage would cost. It is not an extra amount you owe.',
  },
};

export const money = (n: number) =>
  (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const qty = (n: number, unit: string) =>
  `${n.toLocaleString('en-US', { maximumFractionDigits: unit === 'kWh' || unit === 'gal' ? 0 : 1 })} ${unit}`;
