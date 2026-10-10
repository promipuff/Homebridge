import { useState } from 'react';
import { useStore } from '../store';
import type { CalcInput, MeteredUtility, SharedExpense } from '../types';
import { STATUS_COPY, UNITS, calculate, money, qty, APPROACHING_THRESHOLD } from '../lib/calc';
import { billedUtilities, isOwner } from '../lib/personalize';
import { UTILITY_LABEL, PAY_LABEL } from '../lib/labels';
import { CONSERVATION_TIPS, RESOURCES } from '../data/resources';
import { uid } from '../lib/defaults';
import { TrajectoryChart } from './charts';
import { BudgetBar } from './Dashboard';
import { ResourceMini } from './Resources';
import { Button, Card, CardTitle, ChoiceGroup, Notice, PageHeader, Pill, SelectField, SourceBadge, Stat, TextField, cx, type Tone } from './ui';
import { Calculator, Droplets, Info, Leaf, Plus, Trash, Users, Zap } from '../icons';

export function UtilitiesPage() {
  const { state } = useStore();
  const billed = billedUtilities(state.profile);
  const first: MeteredUtility = billed.includes('electricity') || !billed.includes('water') ? 'electricity' : 'water';
  const [tab, setTab] = useState<MeteredUtility>(first);
  const p = state.profile;
  const none = !billed.includes('electricity') && !billed.includes('water');

  const intro =
    p.situation === 'house_owner'
      ? 'Estimate your household bills and find ways to use less.'
      : p.situation === 'shared'
        ? 'Enter only your agreed share. HomeBridge never asks what housemates pay, and shares don’t have to be equal.'
        : p.situation === 'dorm'
          ? 'If utilities are part of your housing fees, estimates here are for information only.'
          : 'Estimate the utilities you pay and see whether you’re on track for your budget.';

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader eyebrow="Utility affordability" title="Utilities" intro={intro} />
      {none && (
        <Notice title="No utility bills to track">
          Based on your answers, you don’t pay electricity or water directly. You can still estimate what your usage would cost. It isn’t an extra amount you owe.
        </Notice>
      )}
      <div role="tablist" aria-label="Utility" className="flex gap-2">
        {(['electricity', 'water'] as MeteredUtility[]).map((u) => (
          <button
            key={u}
            role="tab"
            id={`tab-${u}`}
            aria-selected={tab === u}
            aria-controls={`panel-${u}`}
            type="button"
            onClick={() => setTab(u)}
            className={cx('flex min-h-[44px] items-center gap-2 rounded-xl border px-4 font-semibold', tab === u ? 'border-forest bg-forest text-forest-ink' : 'border-line bg-surface text-ink hover:bg-surface-2')}
          >
            {u === 'electricity' ? <Zap size={18} /> : <Droplets size={18} />} {UTILITY_LABEL[u]}
            <span className={cx('text-xs font-normal', tab === u ? 'text-forest-ink' : 'text-muted')}>· {PAY_LABEL[p.utilities[u]]}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        <CalcPanel key={tab} utility={tab} />
      </div>
      {(p.situation === 'shared' || p.situation === 'condo') && <SharedExpenses />}
    </div>
  );
}

function CalcPanel({ utility }: { utility: MeteredUtility }) {
  const { state, update } = useStore();
  const input = state.calc[utility];
  const set = (patch: Partial<CalcInput>) => update((s) => ({ ...s, calc: { ...s.calc, [utility]: { ...s.calc[utility], ...patch } } }));
  const { errors, result } = calculate(input);
  const err = (f: keyof CalcInput) => errors.find((e) => e.field === f)?.message;
  const unit = input.unit;
  const profileArr = state.profile.utilities[utility];

  const tone = result ? (STATUS_COPY[result.status].tone as Tone) : 'muted';
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <Card as="section" aria-labelledby="in-h">
        <CardTitle id="in-h" icon={<Calculator size={20} />} action={<SourceBadge source="user_entered" />}>Your numbers</CardTitle>
        <form className="grid grid-cols-1 gap-5" onSubmit={(e) => e.preventDefault()} noValidate>
          <ChoiceGroup
            name={`arr-${utility}`}
            legend="How is this utility paid?"
            hint={profileArr === 'direct' || profileArr === 'included' || profileArr === 'shared' ? `From your profile: ${PAY_LABEL[profileArr]}.` : undefined}
            value={input.arrangement}
            onChange={(v) => set({ arrangement: v })}
            options={[
              { value: 'direct', label: 'I pay directly' },
              { value: 'shared', label: 'I pay a share' },
              { value: 'included', label: 'Included in rent/fees' },
            ]}
          />
          {input.arrangement === 'shared' && (
            <div className="grid grid-cols-1 gap-3 rounded-xl bg-surface-2 p-3">
              <ChoiceGroup
                name={`share-${utility}`}
                legend="How is your share set?"
                value={input.shareType}
                onChange={(v) => set({ shareType: v })}
                options={[{ value: 'percent', label: 'A percentage of the bill' }, { value: 'amount', label: 'A fixed agreed amount' }]}
              />
              {input.shareType === 'percent' ? (
                <TextField label="Your share" suffix="%" inputMode="decimal" value={input.sharePercent} error={err('sharePercent')} onChange={(e) => set({ sharePercent: e.target.value })} hint="Whatever you agreed. It doesn’t have to be an equal split." />
              ) : (
                <TextField label="Your agreed amount per cycle" prefix="$" inputMode="decimal" value={input.shareAmount} error={err('shareAmount')} onChange={(e) => set({ shareAmount: e.target.value })} />
              )}
            </div>
          )}

          <fieldset className="grid grid-cols-1 gap-3">
            <legend className="mb-1 text-sm font-semibold">Usage</legend>
            <div className="flex flex-wrap gap-2">
              <ChoiceGroup name={`mode-${utility}`} legend="I have" value={input.mode} onChange={(v) => set({ mode: v })} options={[{ value: 'meter', label: 'Meter readings' }, { value: 'usage', label: 'My usage so far' }]} />
              {UNITS[utility].length > 1 && (
                <SelectField label="Unit" value={unit} onChange={(e) => set({ unit: e.target.value as CalcInput['unit'] })} options={UNITS[utility].map((u) => ({ value: u, label: u === 'gal' ? 'Gallons (gal)' : u === 'CCF' ? 'Hundred cubic feet (CCF)' : u }))} />
              )}
            </div>
            {input.mode === 'meter' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField label="Previous reading" suffix={unit} inputMode="decimal" value={input.previousReading} error={err('previousReading')} onChange={(e) => set({ previousReading: e.target.value })} hint="From your last bill." />
                <TextField label="Current reading" suffix={unit} inputMode="decimal" value={input.currentReading} error={err('currentReading')} onChange={(e) => set({ currentReading: e.target.value })} hint="Read it off the meter today." />
              </div>
            ) : (
              <TextField label="Usage so far this cycle" suffix={unit} inputMode="decimal" value={input.usage} error={err('usage')} onChange={(e) => set({ usage: e.target.value })} />
            )}
          </fieldset>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="Rate" prefix="$" suffix={`per ${unit}`} inputMode="decimal" value={input.rate} error={err('rate')} onChange={(e) => set({ rate: e.target.value })} hint="The price per unit on your bill." />
            <TextField label="Fixed charges" prefix="$" suffix="per cycle" inputMode="decimal" value={input.fixedCharge} error={err('fixedCharge')} onChange={(e) => set({ fixedCharge: e.target.value })} hint="Base or service charge." />
            <TextField label="Days in billing cycle" suffix="days" inputMode="numeric" value={input.cycleDays} error={err('cycleDays')} onChange={(e) => set({ cycleDays: e.target.value })} />
            <TextField label="Days elapsed so far" suffix="days" inputMode="numeric" value={input.daysElapsed} error={err('daysElapsed')} onChange={(e) => set({ daysElapsed: e.target.value })} />
            <TextField label="Taxes (optional)" suffix="%" inputMode="decimal" value={input.taxPercent} error={err('taxPercent')} onChange={(e) => set({ taxPercent: e.target.value })} />
            <TextField label="Last period’s bill (optional)" prefix="$" inputMode="decimal" value={input.previousBill} error={err('previousBill')} onChange={(e) => set({ previousBill: e.target.value })} hint="Household total, for comparison." />
          </div>
          {input.arrangement !== 'included' && (
            <TextField
              label={input.arrangement === 'shared' ? 'My budget for my share' : 'My budget for this bill'}
              prefix="$"
              suffix="per cycle"
              inputMode="decimal"
              value={input.budget}
              error={err('budget')}
              onChange={(e) => set({ budget: e.target.value })}
              hint="Set by you. HomeBridge never guesses your income."
              className="rounded-xl border-2 border-sage p-3"
            />
          )}
          {errors.length > 0 && (
            <div role="alert" className="rounded-xl border border-danger bg-danger-soft p-3 text-sm">
              <p className="font-semibold text-danger">Fix {errors.length} {errors.length === 1 ? 'field' : 'fields'} to see an estimate:</p>
              <ul className="mt-1 list-disc pl-5 text-ink">{errors.map((e) => <li key={e.field}>{e.message}</li>)}</ul>
            </div>
          )}
        </form>
      </Card>

      <div className="grid grid-cols-1 content-start gap-6">
        {result ? (
          <>
            <Card as="section" aria-labelledby="res-h" className={cx('border-2', tone === 'danger' ? 'border-danger' : tone === 'amber' ? 'border-amber' : tone === 'ok' ? 'border-ok' : 'border-line')}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 id="res-h" className="font-display text-lg font-semibold">Estimate</h2>
                <div aria-live="polite"><Pill tone={tone}>{STATUS_COPY[result.status].label}</Pill></div>
              </div>
              <p className="mb-4 text-sm text-muted">{STATUS_COPY[result.status].explain}</p>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                <Stat
                  label={input.arrangement === 'included' ? 'Usage value (info only)' : input.arrangement === 'shared' ? 'Your projected share' : 'Projected bill'}
                  value={money(input.arrangement === 'included' ? result.projectedBill : result.yourPortion)}
                  sub={`End of ${input.cycleDays}-day cycle`}
                  tone={tone === 'muted' ? undefined : tone}
                />
                <Stat label="So far" value={money(input.arrangement === 'included' ? result.toDateBill : result.yourPortionToDate)} sub={`${qty(result.usageSoFar, unit)} in ${input.daysElapsed} days`} />
                {result.remaining !== null ? (
                  <Stat label={result.remaining < 0 ? 'Over budget by' : 'Budget left'} value={money(Math.abs(result.remaining))} sub={`Budget ${money(result.budget!)}`} tone={result.remaining < 0 ? 'danger' : undefined} />
                ) : (
                  <Stat label="Projected usage" value={qty(result.projectedUsage, unit)} sub={`${qty(result.dailyUsage, unit)}/day`} />
                )}
                {input.arrangement === 'shared' && <Stat label="Household bill" value={money(result.projectedBill)} sub="Projected total" />}
                {result.changeVsPrevious && (
                  <Stat
                    label="vs. last period"
                    value={`${result.changeVsPrevious.amount >= 0 ? '+' : '−'}${money(Math.abs(result.changeVsPrevious.amount)).replace('−', '')}`}
                    sub={result.changeVsPrevious.pct !== null ? `${result.changeVsPrevious.pct >= 0 ? 'up' : 'down'} ${Math.abs(result.changeVsPrevious.pct)}% (household)` : 'Household bill'}
                  />
                )}
                {result.remaining !== null && <Stat label="Projected usage" value={qty(result.projectedUsage, unit)} sub={`${qty(result.dailyUsage, unit)}/day`} />}
              </div>
              {result.budgetUsedPct !== null && <BudgetBar pct={result.budgetUsedPct} tone={tone} />}
              {result.warnings.map((w) => <p key={w} className="mt-3 flex gap-2 text-sm text-muted"><Info size={16} className="mt-0.5 shrink-0" />{w}</p>)}
            </Card>

            <Card>
              <CardTitle action={<SourceBadge source="user_entered" />}>Spending trajectory</CardTitle>
              <TrajectoryChart
                points={result.trajectory.map((pt) => ({ x: pt.day, label: `Day ${pt.day}`, a: pt.cost, b: pt.reduced, solid: pt.actual }))}
                budget={result.budget}
                formatY={money}
                aLabel={input.arrangement === 'direct' || (input.arrangement === 'shared' && input.shareType === 'percent') ? 'Your cost at current pace' : 'Household cost at current pace'}
                bLabel={`With ${result.reduction.percent}% less use`}
                markerX={Number(input.daysElapsed)}
                markerLabel="Today"
                summary={`Cumulative cost rises to ${money(result.trajectory[result.trajectory.length - 1].cost)} by day ${input.cycleDays}${result.budget ? `, against a budget of ${money(result.budget)}` : ''}. Solid line is the pace so far; dashed line is the projection.`}
              />
            </Card>

            <Card>
              <CardTitle icon={<Leaf size={20} />}>What if I use less?</CardTitle>
              <label htmlFor={`red-${utility}`} className="text-sm font-semibold">Reduce use for the rest of this cycle by <span className="tabular-nums text-forest">{input.reductionPercent}%</span></label>
              <input
                id={`red-${utility}`}
                type="range"
                min={0}
                max={30}
                step={5}
                value={input.reductionPercent}
                onChange={(e) => set({ reductionPercent: Number(e.target.value) })}
                className="mt-2 w-full accent-[var(--forest)]"
                aria-valuetext={`${input.reductionPercent} percent`}
              />
              <p className="mt-2 text-ink">
                {input.arrangement === 'shared' && input.shareType === 'amount'
                  ? <>The household bill would be about <strong>{money(result.reduction.projectedBill)}</strong>. Your agreed amount stays {money(result.yourPortion)}.</>
                  : input.arrangement === 'included'
                    ? <>Your usage would be worth about <strong>{money(result.reduction.projectedBill)}</strong>, saving the household about {money(result.projectedBill - result.reduction.projectedBill)}.</>
                    : <>You’d pay about <strong className="tabular-nums">{money(result.reduction.yourPortion)}</strong>, saving <strong className="tabular-nums text-ok">{money(result.reduction.savings)}</strong>{result.budget !== null && result.reduction.yourPortion <= result.budget && result.yourPortion > result.budget ? ', which brings you within budget' : ''}.</>}
              </p>
              <ul className="mt-3 grid gap-2">
                {CONSERVATION_TIPS[utility].map((tip) => (
                  <li key={tip.tip} className="rounded-lg bg-surface-2 px-3 py-2 text-sm"><strong className="block text-ink">{tip.tip}</strong><span className="text-muted">{tip.detail}</span></li>
                ))}
              </ul>
            </Card>

            {(result.status === 'over' || result.status === 'approaching') && <AssistanceCard />}
          </>
        ) : (
          <Card><p className="text-muted">Your estimate appears here once the fields on the left are filled in correctly.</p></Card>
        )}
        <HowCalculated />
      </div>
    </div>
  );
}

function AssistanceCard() {
  const { state } = useStore();
  const ids = ['s-util-1', 's-util-2', 'n-liheap', ...(isOwner(state.profile) ? ['n-wap'] : []), 'n-211'];
  return (
    <Card className="border-amber">
      <CardTitle>Help with utility costs</CardTitle>
      <p className="mb-3 text-sm text-muted">Shown because your projection is close to or over the budget you set. Programs set their own eligibility; HomeBridge doesn’t decide it.</p>
      <ul className="grid grid-cols-1 gap-2">{ids.map((id) => <li key={id}><ResourceMini resource={RESOURCES.find((r) => r.id === id)!} /></li>)}</ul>
    </Card>
  );
}

function HowCalculated() {
  return (
    <details className="rounded-card border border-line bg-surface p-4 text-sm">
      <summary className="cursor-pointer font-semibold text-ink">How this is calculated</summary>
      <ul className="mt-3 grid list-disc gap-1.5 pl-5 text-ink">
        <li>Usage so far = current reading − previous reading (or the usage you entered).</li>
        <li>Daily pace = usage so far ÷ days elapsed. Projected usage = daily pace × days in the cycle. This assumes you keep the same pace.</li>
        <li>Estimated bill = usage × rate + fixed charges, then taxes are added. Fixed charges are counted once per cycle.</li>
        <li>Your amount = the full bill, your percentage of it, or your fixed agreed amount.</li>
        <li>Status: on track up to {Math.round(APPROACHING_THRESHOLD * 100)}% of your budget, approaching from {Math.round(APPROACHING_THRESHOLD * 100)}% to 100%, and projected to exceed above 100%.</li>
        <li>Not included: tiered or time-of-use pricing, seasonal rates, fuel adjustments, late fees, credits, or other provider-specific rules. Your actual bill may differ.</li>
      </ul>
    </details>
  );
}

function SharedExpenses() {
  const { state, update, toast } = useStore();
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [due, setDue] = useState('');
  const [error, setError] = useState('');
  const add = () => {
    const n = Number(amount.replace(/[$,]/g, ''));
    if (!label.trim()) return setError('Add a short name, like “Internet”.');
    if (!amount.trim() || !Number.isFinite(n) || n < 0) return setError('Enter your share as a dollar amount, like 20.');
    const d = due.trim();
    if (d && (!/^\d+$/.test(d) || Number(d) < 1 || Number(d) > 31)) return setError('Due day should be a number from 1 to 31.');
    const e: SharedExpense = { id: uid('se'), label: label.trim(), myShare: Math.round(n * 100) / 100, dueDay: d };
    update((s) => ({ ...s, sharedExpenses: [...s.sharedExpenses, e] }));
    setLabel(''); setAmount(''); setDue(''); setError('');
    toast('Shared expense added.');
  };
  const total = state.sharedExpenses.reduce((a, e) => a + e.myShare, 0);
  return (
    <Card>
      <CardTitle icon={<Users size={20} />} action={<SourceBadge source="user_entered" />}>
        {state.profile.situation === 'condo' ? 'Other shared costs (optional)' : 'My other shared expenses'}
      </CardTitle>
      <p className="mb-3 text-sm text-muted">
        {state.profile.situation === 'condo'
          ? 'For example, association dues or a shared water bill. Enter only what you pay.'
          : 'Record only your own agreed share. Other people’s amounts are never collected.'}
      </p>
      {state.sharedExpenses.length > 0 && (
        <ul className="mb-3 grid gap-2">
          {state.sharedExpenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2">
              <span className="min-w-0"><strong>{e.label}</strong>{e.dueDay && <span className="text-sm text-muted"> · due on day {e.dueDay}</span>}</span>
              <span className="flex items-center gap-2">
                <span className="font-semibold tabular-nums">{money(e.myShare)}</span>
                <Button size="sm" variant="ghost" aria-label={`Remove ${e.label}`} onClick={() => update((s) => ({ ...s, sharedExpenses: s.sharedExpenses.filter((x) => x.id !== e.id) }))}><Trash size={16} /></Button>
              </span>
            </li>
          ))}
          <li className="flex justify-between px-3 text-sm font-semibold"><span>My monthly total</span><span className="tabular-nums">{money(total)}</span></li>
        </ul>
      )}
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); add(); }} noValidate>
        <TextField label="Expense" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Internet" />
        <TextField label="My share" prefix="$" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <TextField label="Due day" inputMode="numeric" value={due} onChange={(e) => setDue(e.target.value)} placeholder="15" />
        <Button type="submit" variant="primary"><Plus size={18} /> Add</Button>
      </form>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-danger">{error}</p>}
    </Card>
  );
}
