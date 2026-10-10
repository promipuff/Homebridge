import type { ReactNode } from 'react';
import { useStore } from '../store';
import { dashboardCards, situationLabel, type CardId } from '../lib/personalize';
import { STATUS_COPY, money } from '../lib/calc';
import { dueReminders, openIssues, overdueFollowUps, recommendations, utilitySnapshots } from '../lib/derived';
import { currentReadings, dailySeries } from '../lib/sensors';
import { SCENARIOS } from '../lib/scenarios';
import { STATUS_LABEL, UTILITY_LABEL, REMINDER_LABEL, PARTY_LABEL } from '../lib/labels';
import { RESOURCES } from '../data/resources';
import { AlertCard, AlertSummaryBar } from './Alerts';
import { MiniLine } from './charts';
import { HomeStatusPanel } from './HomeStatus';
import { ResourceMini } from './Resources';
import { SafetyPanel } from './Safety';
import { Button, Card, CardTitle, Notice, Pill, SourceBadge, cx, fmtDate, type Tone } from './ui';
import { SITUATION_ICON } from './Onboarding';
import {
  AlarmSmoke, ArrowRight, Bell, Bookmark, Calculator, Droplets, GraduationCap, HeartHandshake, Accessibility, Activity,
  MessageSquare, Phone, Users, Wrench, X, Zap, Building,
} from '../icons';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function Dashboard() {
  const { state, go, t } = useStore();
  const p = state.profile;
  const cards = dashboardCards(state);
  const simplified = state.settings.simplified;
  const active = state.alerts.filter((a) => !a.acknowledged);
  const Icon = SITUATION_ICON[p.situation];
  const shown = simplified ? cards.slice(0, 3) : cards;

  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-forest">{greeting()}{p.nickname ? `, ${p.nickname}` : ''}</p>
          <h1 id="page-title" tabIndex={-1} className="font-display text-[2rem] font-bold leading-tight text-ink outline-none sm:text-[2.4rem]">{t('dash.welcome')}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-soft px-3 py-1 font-semibold text-forest"><Icon size={16} /> {situationLabel(p)}</span>
            {p.area && <span className="text-muted">{p.area}</span>}
            <button type="button" className="font-semibold text-forest underline underline-offset-2" onClick={() => go('settings', 'housing')}>Change</button>
          </div>
        </div>
      </header>

      {state.scenario && <ScenarioGuide />}

      <section aria-labelledby="alerts-h" className="grid grid-cols-1 gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="alerts-h" className="font-display text-xl font-semibold">{t('dash.alerts')}</h2>
          {active.length > 0 && <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-sm font-bold text-danger">{active.length}</span>}
        </div>
        <AlertSummaryBar />
        {active.slice(0, simplified ? 1 : 3).map((a) => <AlertCard key={a.id} alert={a} compact={simplified} />)}
      </section>

      <QuickActions />

      <section aria-label="Your home at a glance" className={cx('grid grid-cols-1 gap-4', simplified ? 'grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-3')}>
        {shown.map((c) => <DashCard key={c} id={c} />)}
      </section>

      {!simplified && state.settings.demoMode && state.sensors.length > 0 && <HomeStatusPanel compact />}
      {!simplified && state.settings.showSafety !== false && <SafetyPanel />}
      {!simplified && <ResourcesStrip />}
    </div>
  );
}

function ScenarioGuide() {
  const { state, update, go } = useStore();
  const sc = SCENARIOS.find((s) => s.id === state.scenario);
  if (!sc) return null;
  return (
    <section className="rounded-card border-2 border-forest bg-forest-soft p-4" aria-labelledby="guide-h">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-forest">Demo scenario {sc.letter}</p>
          <h2 id="guide-h" className="font-display text-lg font-semibold text-ink">{sc.title}</h2>
          <p className="text-sm text-muted">{sc.who}. All readings are simulated.</p>
        </div>
        <button type="button" aria-label="Close demo guide" className="grid grid-cols-1 h-10 w-10 shrink-0 place-items-center rounded-lg text-ink hover:bg-surface" onClick={() => update((s) => ({ ...s, scenario: null }))}>
          <X size={18} />
        </button>
      </div>
      <ol className="mt-3 grid gap-2">
        {sc.steps.map((st, i) => (
          <li key={i} className="flex items-start gap-3 rounded-xl bg-surface p-2.5">
            <span className="grid grid-cols-1 h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-sm font-bold text-forest-ink">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-ink">{st.text}</p>
              {st.hint && <p className="text-xs text-muted">{st.hint}</p>}
            </div>
            {st.view && (
              <Button size="sm" variant="ghost" onClick={() => go(st.view!)} aria-label={`Go to step ${i + 1}`}>Go <ArrowRight size={14} /></Button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function QuickActions() {
  const { state, go, t } = useStore();
  const snaps = utilitySnapshots(state).filter((s) => s.billed);
  const actions: { label: string; icon: ReactNode; onClick: () => void }[] = [];
  if (snaps.length) actions.push({ label: 'Estimate my bill', icon: <Calculator size={20} />, onClick: () => go('utilities') });
  actions.push({ label: state.profile.situation === 'dorm' ? 'New housing request' : 'Report an issue', icon: <Wrench size={20} />, onClick: () => go('maintenance', 'new') });
  actions.push({ label: 'Find help nearby', icon: <HeartHandshake size={20} />, onClick: () => go('resources') });
  if (state.sensors.length) actions.push({ label: 'Check home status', icon: <Activity size={20} />, onClick: () => go('home') });
  actions.push({ label: 'Accessibility', icon: <Accessibility size={20} />, onClick: () => go('settings', 'access') });
  return (
    <section aria-labelledby="qa-h">
      <h2 id="qa-h" className="mb-2 font-display text-xl font-semibold">{t('dash.quick')}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((a) => (
          <button key={a.label} type="button" onClick={a.onClick} className="flex min-h-[64px] items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-left font-semibold text-ink transition hover:border-forest hover:bg-forest-soft">
            <span className="grid grid-cols-1 h-9 w-9 shrink-0 place-items-center rounded-lg bg-sage-soft text-forest">{a.icon}</span>
            <span className="min-w-0 leading-tight">{a.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

const toneOf = (s: string): Tone => (STATUS_COPY[s as keyof typeof STATUS_COPY]?.tone ?? 'muted') as Tone;

function DashCard({ id }: { id: CardId }) {
  const { state, go } = useStore();
  const p = state.profile;
  const snaps = utilitySnapshots(state);
  const open = openIssues(state);
  const overdue = overdueFollowUps(state);
  const readings = currentReadings(state.sensors, state.events);

  switch (id) {
    case 'utility_budget':
    case 'personal_share': {
      const billed = snaps.filter((s) => s.billed && (s.utility === 'electricity' || s.utility === 'water'));
      const shareTotal = state.sharedExpenses.reduce((a, e) => a + e.myShare, 0);
      return (
        <Card>
          <CardTitle icon={id === 'personal_share' ? <Users size={20} /> : <Calculator size={20} />}>
            {id === 'personal_share' ? 'My share of utilities' : 'Utility budget'}
          </CardTitle>
          <ul className="grid grid-cols-1 gap-3">
            {billed.map((s) => {
              const r = s.result;
              const c = state.calc[s.utility];
              return (
                <li key={s.utility} className="rounded-xl bg-surface-2 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold">
                      {s.utility === 'electricity' ? <Zap size={16} /> : <Droplets size={16} />} {UTILITY_LABEL[s.utility]}
                    </span>
                    {r && <Pill tone={toneOf(r.status)}>{STATUS_COPY[r.status].label}</Pill>}
                  </div>
                  {r ? (
                    <>
                      <p className="mt-1 text-sm text-muted">
                        Projected {c.arrangement === 'shared' ? 'share' : 'bill'}: <strong className="text-ink tabular-nums">{money(r.yourPortion)}</strong>
                        {r.budget !== null && <> of <span className="tabular-nums">{money(r.budget)}</span></>}
                      </p>
                      {r.budget !== null && <BudgetBar pct={r.budgetUsedPct ?? 0} tone={toneOf(r.status)} />}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-muted">Add your usage to see an estimate.</p>
                  )}
                </li>
              );
            })}
          </ul>
          {id === 'personal_share' && (
            <p className="mt-3 text-sm text-muted">
              Other shared costs you entered: <strong className="text-ink">{money(shareTotal)}</strong>/month. Only your own share is stored.
            </p>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            <SourceBadge source="user_entered" />
            <Button size="sm" variant="ghost" onClick={() => go('utilities')}>Open calculator <ArrowRight size={14} /></Button>
          </div>
        </Card>
      );
    }
    case 'usage_insight':
    case 'housing_fees': {
      const included = (Object.keys(p.utilities) as (keyof typeof p.utilities)[]).filter((k) => p.utilities[k] === 'included');
      return (
        <Card>
          <CardTitle icon={id === 'housing_fees' ? <GraduationCap size={20} /> : <Zap size={20} />}>
            {id === 'housing_fees' ? 'Housing fees & utilities' : 'Utilities'}
          </CardTitle>
          <p className="text-ink">
            {included.length
              ? `${included.map((k) => UTILITY_LABEL[k]).join(', ')} ${included.length > 1 ? 'are' : 'is'} included in your ${p.situation === 'dorm' ? 'housing fees' : 'rent'}. There’s no separate bill to track.`
              : 'You told us you don’t pay utilities directly, so there’s no bill to track.'}
          </p>
          <p className="mt-2 text-sm text-muted">Curious what your usage would cost? The calculator can estimate it for information only.</p>
          <div className="mt-3"><Button size="sm" variant="ghost" onClick={() => go('utilities')}>Explore usage costs <ArrowRight size={14} /></Button></div>
        </Card>
      );
    }
    case 'energy': {
      const has = state.sensors.some((s) => s.kind === 'electric_meter');
      const series = dailySeries('electric_meter', state.events, 14);
      return (
        <Card>
          <CardTitle icon={<Zap size={20} />} action={has ? <SourceBadge source="simulated" /> : undefined}>Energy use</CardTitle>
          {has ? (
            <>
              <p className="text-sm text-muted">Last 14 days · today <strong className="text-ink">{series[series.length - 1].value} kWh</strong></p>
              <MiniLine data={series} summary={`Daily electricity use over 14 days, today ${series[series.length - 1].value} kilowatt hours.`} className="mt-2" />
            </>
          ) : (
            <p className="text-muted">Connect electricity usage data in My home to see daily use.</p>
          )}
          <div className="mt-2"><Button size="sm" variant="ghost" onClick={() => go('home')}>My home <ArrowRight size={14} /></Button></div>
        </Card>
      );
    }
    case 'water': {
      const w = readings.find((r) => r.kind === 'water_meter');
      const series = dailySeries('water_meter', state.events, 14);
      return (
        <Card className={cx(w?.level === 'alert' && 'border-danger')}>
          <CardTitle icon={<Droplets size={20} />} action={w ? <SourceBadge source="simulated" /> : undefined}>Water use</CardTitle>
          {w ? (
            <>
              <p className="text-sm text-muted">Today <strong className={cx('tabular-nums', w.level === 'alert' ? 'text-danger' : 'text-ink')}>{w.value} gal</strong> · {w.note}</p>
              <MiniLine data={series} summary={`Daily water use over 14 days, today ${w.value} gallons.`} className="mt-2" />
            </>
          ) : (
            <p className="text-muted">No water meter connected. Add one in My home, or simulate one in demo mode.</p>
          )}
          <div className="mt-2"><Button size="sm" variant="ghost" onClick={() => go('home')}>My home <ArrowRight size={14} /></Button></div>
        </Card>
      );
    }
    case 'maintenance': {
      const nextFollow = open.filter((i) => i.followUpDate).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))[0];
      return (
        <Card>
          <CardTitle icon={<Wrench size={20} />}>{p.situation === 'house_owner' ? 'Repairs & projects' : p.situation === 'dorm' ? 'Housing requests' : 'Maintenance'}</CardTitle>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tabular-nums">{open.length}</span>
            <span className="text-muted">open {open.length === 1 ? 'item' : 'items'}</span>
          </div>
          {open.slice(0, 3).map((i) => (
            <button key={i.id} type="button" onClick={() => go('maintenance', `issue:${i.id}`)} className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-left hover:bg-forest-soft">
              <span className="min-w-0 truncate font-semibold">{i.title}</span>
              <span className="shrink-0 text-xs font-semibold text-muted">{STATUS_LABEL[i.status]}</span>
            </button>
          ))}
          {nextFollow && <p className="mt-2 text-sm text-muted">Next follow-up: <strong className="text-ink">{fmtDate(nextFollow.followUpDate)}</strong></p>}
          <div className="mt-3"><Button size="sm" variant="ghost" onClick={() => go('maintenance', 'new')}>Add an issue <ArrowRight size={14} /></Button></div>
        </Card>
      );
    }
    case 'landlord_followups': {
      const comms = state.issues.flatMap((i) => i.history.filter((h) => h.type === 'communication').map((h) => ({ ...h, issue: i.title })));
      const last = comms.sort((a, b) => b.at.localeCompare(a.at))[0];
      return (
        <Card className={cx(overdue.length > 0 && 'border-amber')}>
          <CardTitle icon={<MessageSquare size={20} />}>Landlord follow-ups</CardTitle>
          {overdue.length ? (
            <Notice tone="amber" title={`${overdue.length} follow-up${overdue.length > 1 ? 's' : ''} due`}>
              {overdue.map((i) => <span key={i.id} className="block">{i.title}, due {fmtDate(i.followUpDate)}</span>)}
            </Notice>
          ) : (
            <p className="text-muted">No follow-ups due.</p>
          )}
          <p className="mt-2 text-sm text-muted">
            {last ? <>Last contact logged {fmtDate(last.communication?.date || last.at)} with {last.communication?.contact || PARTY_LABEL[p.maintenanceParty]}.</> : 'Log each call, text or email so you have a clear record.'}
          </p>
          <div className="mt-3"><Button size="sm" variant="ghost" onClick={() => go('maintenance')}>Open log <ArrowRight size={14} /></Button></div>
        </Card>
      );
    }
    case 'building': {
      const bIssues = open.filter((i) => i.locationScope === 'shared_building');
      const bReadings = readings.filter((r) => r.scope === 'building');
      return (
        <Card>
          <CardTitle icon={<Building size={20} />}>Building</CardTitle>
          <p className="text-sm text-muted">Shared systems are listed separately from your own unit.</p>
          <p className="mt-2 text-ink"><strong className="tabular-nums">{bIssues.length}</strong> open shared-building {bIssues.length === 1 ? 'issue' : 'issues'}</p>
          {bReadings.length > 0 ? (
            <ul className="mt-2 text-sm">{bReadings.map((r) => <li key={r.sensorId}>Building {r.kind.replace('_', ' ')}: <strong>{r.value} {r.unit}</strong></li>)}</ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No building-wide readings are shared with you.</p>
          )}
          <p className="mt-2 text-sm text-muted">Maintenance handled by: <strong className="text-ink">{PARTY_LABEL[p.maintenanceParty]}</strong></p>
        </Card>
      );
    }
    case 'essentials': {
      const quick = ['n-911', 'n-211', 's-food-1', 's-shelter-1', 's-cool-1'].map((rid) => RESOURCES.find((r) => r.id === rid)!);
      return (
        <Card className="md:col-span-2 xl:col-span-1">
          <CardTitle icon={<HeartHandshake size={20} />}>Essentials</CardTitle>
          <ul className="grid grid-cols-1 gap-2">
            {quick.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2">
                <span className="min-w-0">
                  <span className="block font-semibold">{r.name}</span>
                  <span className="block text-xs text-muted">{r.verification === 'sample' ? 'Sample listing' : r.hours}</span>
                </span>
                {r.phone && <span className="flex shrink-0 items-center gap-1 font-semibold tabular-nums text-forest"><Phone size={14} />{r.phone}</span>}
              </li>
            ))}
          </ul>
          <div className="mt-3"><Button size="sm" variant="ghost" onClick={() => go('resources')}>All resources <ArrowRight size={14} /></Button></div>
        </Card>
      );
    }
    case 'safety': {
      const alarm = readings.find((r) => r.kind === 'smoke_co');
      const test = state.reminders.find((r) => r.type === 'smoke_alarm' && r.enabled);
      return (
        <Card className={cx(alarm?.level === 'alert' && 'border-danger')}>
          <CardTitle icon={<AlarmSmoke size={20} />} action={alarm ? <SourceBadge source="simulated" /> : undefined}>Safety</CardTitle>
          {alarm ? (
            <p className="text-ink">Connected alarm: <strong className={alarm.level === 'alert' ? 'text-danger' : 'text-ok'}>{alarm.value}</strong></p>
          ) : (
            <p className="text-ink">{p.situation === 'temporary' || p.situation === 'dorm' ? 'Know where the nearest exits and alarms are where you stay.' : 'Your smoke and CO alarms aren’t connected. That’s fine. Their sirens still protect you.'}</p>
          )}
          <p className="mt-2 text-sm text-muted">If an alarm sounds or you smell gas, get outside first, then call 911.</p>
          {test ? <p className="mt-2 text-sm">Next alarm test: <strong>{fmtDate(test.date)}</strong></p> : null}
        </Card>
      );
    }
    case 'campus': {
      const recs = RESOURCES.filter((r) => r.category === 'campus');
      return (
        <Card>
          <CardTitle icon={<GraduationCap size={20} />}>Campus support</CardTitle>
          <ul className="grid grid-cols-1 gap-2">{recs.map((r) => <li key={r.id}><ResourceMini resource={r} /></li>)}</ul>
        </Card>
      );
    }
    case 'reminders': {
      const due = dueReminders(state);
      return (
        <Card>
          <CardTitle icon={<Bell size={20} />}>Reminders</CardTitle>
          {due.length ? (
            <ul className="grid grid-cols-1 gap-2">
              {due.slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                  <span className="min-w-0"><span className="block font-semibold">{r.title}</span><span className="text-xs text-muted">{REMINDER_LABEL[r.type]}</span></span>
                  <span className={cx('shrink-0 font-semibold', r.overdue ? 'text-amber' : 'text-muted')}>{r.overdue ? 'Overdue · ' : ''}{fmtDate(r.date)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">Nothing due in the next two weeks.</p>
          )}
          <div className="mt-3"><Button size="sm" variant="ghost" onClick={() => go('settings', 'reminders')}>Manage reminders <ArrowRight size={14} /></Button></div>
        </Card>
      );
    }
  }
}

export function BudgetBar({ pct, tone }: { pct: number; tone: Tone }) {
  const color = tone === 'danger' ? 'bg-danger' : tone === 'amber' ? 'bg-amber' : 'bg-ok';
  return (
    <div className="mt-2">
      <div className="relative h-2.5 overflow-hidden rounded-full bg-line" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Share of budget used by projection">
        <div className={cx('h-full rounded-full', color)} style={{ width: `${Math.min(pct, 100)}%` }} />
        <span className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: '90%' }} aria-hidden="true" />
      </div>
      <p className="mt-1 text-xs text-muted tabular-nums">{Math.round(pct)}% of budget{pct > 100 ? ` · ${Math.round(pct - 100)}% over` : ''}</p>
    </div>
  );
}

function ResourcesStrip() {
  const { state, go } = useStore();
  const recs = recommendations(state).slice(0, 3);
  const saved = state.savedResources.map((id) => RESOURCES.find((r) => r.id === id)).filter(Boolean).slice(0, 3);
  const viewed = state.viewedResources.map((id) => RESOURCES.find((r) => r.id === id)).filter(Boolean).filter((r) => !state.savedResources.includes(r!.id)).slice(0, 2);
  return (
    <section aria-labelledby="res-h" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardTitle id="res-h" icon={<HeartHandshake size={20} />}>Suggested for you</CardTitle>
        {recs.length ? (
          <ul className="grid grid-cols-1 gap-2">{recs.map((r) => <li key={r.resource.id}><ResourceMini resource={r.resource} reason={r.reasons[0]} /></li>)}</ul>
        ) : (
          <p className="text-muted">Suggestions appear here based on what you record: open repairs, budget warnings, or accessibility needs. Nothing is guessed about you.</p>
        )}
        <div className="mt-3"><Button size="sm" variant="ghost" onClick={() => go('resources')}>Browse all <ArrowRight size={14} /></Button></div>
      </Card>
      <Card>
        <CardTitle icon={<Bookmark size={20} />}>Saved & recently viewed</CardTitle>
        {saved.length + viewed.length ? (
          <ul className="grid grid-cols-1 gap-2">{[...saved, ...viewed].map((r) => <li key={r!.id}><ResourceMini resource={r!} /></li>)}</ul>
        ) : (
          <p className="text-muted">Save resources to find them here quickly.</p>
        )}
      </Card>
    </section>
  );
}

