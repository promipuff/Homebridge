import { useEffect, useState } from 'react';
import { useStore } from '../store';
import type { Reminder, ReminderType } from '../types';
import { situationLabel, questionPlan } from '../lib/personalize';
import { PARTY_LABEL, PAY_LABEL, REMINDER_LABEL, UTILITY_LABEL } from '../lib/labels';
import { SCENARIOS } from '../lib/scenarios';
import { uid } from '../lib/defaults';
import { AreaPicker, LanguageSwitch, Onboarding, SITUATION_ICON, TextSizeControl } from './Onboarding';
import { Button, Card, CardTitle, ChoiceGroup, Notice, PageHeader, SelectField, TextField, Toggle, cx, fmtDate } from './ui';
import { Accessibility, Bell, House, Lock, Play, Plus, RotateCcw, Trash, Info } from '../icons';

export function SettingsPage() {
  const { state, update, t, focusTarget, clearFocusTarget, go, toast, resetAll } = useStore();
  const [editing, setEditing] = useState(false);
  const set = (patch: Partial<typeof state.settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const p = state.profile;
  const Icon = SITUATION_ICON[p.situation];
  const plan = questionPlan(p.situation);

  useEffect(() => {
    if (!focusTarget) return;
    if (focusTarget === 'housing') setEditing(false);
    document.getElementById(`sec-${focusTarget}`)?.scrollIntoView({ block: 'start' });
    clearFocusTarget();
  }, [focusTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  if (editing) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <Notice>Changing your living situation updates your dashboard, utilities, maintenance workflow and suggestions. Your saved issues, reminders and resources stay as they are.</Notice>
        <Onboarding mode="edit" onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader eyebrow="Settings" title={t('nav.settings')} intro="Your housing profile, accessibility, reminders and privacy." />

      <Card id="sec-housing" className="scroll-mt-24">
        <CardTitle icon={<House size={20} />}>{t('set.housing')}</CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid grid-cols-1 h-11 w-11 place-items-center rounded-xl bg-forest text-forest-ink"><Icon size={22} /></span>
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold">{situationLabel(p)}</p>
            <p className="text-sm text-muted">Maintenance: {PARTY_LABEL[p.maintenanceParty]}{plan.askSensors ? ` · Sensors: ${p.sensorPermission === 'yes' ? 'can install' : p.sensorPermission === 'portable' ? 'portable only' : p.sensorPermission === 'no' ? 'none' : 'not sure'}` : ''}</p>
          </div>
        </div>
        <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          {plan.utilityKeys.map((k) => <li key={k}><span className="text-muted">{UTILITY_LABEL[k]}:</span> <strong>{PAY_LABEL[p.utilities[k]]}</strong></li>)}
        </ul>
        <div className="mt-4"><Button variant="primary" onClick={() => setEditing(true)}>{t('set.change')}</Button></div>
      </Card>

      <Card id="sec-access" className="scroll-mt-24">
        <CardTitle icon={<Accessibility size={20} />}>{t('set.access')}</CardTitle>
        <div className="grid grid-cols-1 gap-5">
          <TextSizeControl />
          <div className="grid grid-cols-1 gap-3 divide-y divide-line">
            <Toggle label={t('set.contrast')} desc="Stronger borders and text. Works with light and dark appearance." checked={state.settings.highContrast} onChange={(v) => set({ highContrast: v })} />
            <div className="pt-3"><Toggle label={t('set.motion')} desc="Turns off transitions and animations." checked={state.settings.reduceMotion} onChange={(v) => set({ reduceMotion: v })} /></div>
            <div className="pt-3"><Toggle label={t('set.simple')} desc="Shows only alerts, quick actions and your three most important cards." checked={state.settings.simplified} onChange={(v) => set({ simplified: v })} /></div>
            <div className="pt-3"><Toggle label="Neighborhood safety panel" desc="Shows nearby incidents and links to official sex offender registries on the dashboard." checked={state.settings.showSafety !== false} onChange={(v) => set({ showSafety: v })} /></div>
          </div>
          <ChoiceGroup name="theme" legend={t('set.theme')} value={state.settings.theme} onChange={(v) => set({ theme: v })} options={[{ value: 'system', label: 'Match my device' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
          <div>
            <p className="mb-1 text-sm font-semibold">{t('set.language')}</p>
            <LanguageSwitch />
            <p className="mt-1 text-xs text-muted">Spanish covers navigation, setup and settings in this prototype.</p>
          </div>
          <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted">
            Every page works with a keyboard (Tab, Shift+Tab, Enter, Space) and a screen reader. Each page has a unique heading and labelled buttons so voice-control tools can say “click Report an issue”. HomeBridge never infers disability, age or other traits from your housing or sensor data.
          </p>
        </div>
      </Card>

      <Reminders />

      <Card id="sec-demo" className="scroll-mt-24">
        <CardTitle icon={<Play size={20} />}>Demo scenarios</CardTitle>
        <p className="mb-3 text-sm text-muted">Loading a scenario replaces your current HomeBridge data with example data. Accessibility settings are kept.</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {SCENARIOS.map((sc) => (
            <button key={sc.id} type="button" onClick={() => { update((s) => sc.build(s)); go('dashboard'); toast(`Scenario ${sc.letter} loaded.`); }} className="flex min-h-[44px] items-start gap-3 rounded-xl border border-line p-3 text-left hover:border-forest hover:bg-forest-soft">
              <span className="grid grid-cols-1 h-8 w-8 shrink-0 place-items-center rounded-lg bg-forest font-bold text-forest-ink">{sc.letter}</span>
              <span><span className="block font-semibold">{sc.title}</span><span className="text-sm text-muted">{sc.who}</span></span>
            </button>
          ))}
        </div>
      </Card>

      <Privacy onReset={() => { resetAll(); toast('All HomeBridge data on this device was cleared.'); }} />

      <Card id="sec-about">
        <CardTitle icon={<Info size={20} />}>About this prototype</CardTitle>
        <ul className="grid grid-cols-1 list-disc gap-1.5 pl-5 text-sm text-ink">
          <li>All sensor readings and alerts are simulated. No devices, utility accounts or outside services are connected.</li>
          <li>Bill estimates use a straight-line projection and don’t include tiered or time-of-use pricing, seasonal rates or provider-specific fees.</li>
          <li>Most resource listings are fictional samples. Real national programs are labelled; local availability isn’t verified.</li>
          <li>Data is stored only in this browser. There is no account, sync or backup.</li>
          <li>Spanish translation is partial. Read-aloud and location depend on browser support.</li>
          <li>HomeBridge doesn’t replace professional inspections, emergency services or legal advice.</li>
        </ul>
      </Card>
    </div>
  );
}

function Reminders() {
  const { state, update, toast } = useStore();
  const [d, setD] = useState<{ type: ReminderType; title: string; date: string; repeat: Reminder['repeat'] }>({ type: 'filter', title: '', date: '', repeat: 'none' });
  const [err, setErr] = useState<{ title?: string; date?: string }>({});
  const add = () => {
    const e: typeof err = {};
    if (!d.date) e.date = 'Choose a date.';
    setErr(e);
    if (Object.keys(e).length) return;
    const r: Reminder = { id: uid('rem'), type: d.type, title: d.title.trim() || REMINDER_LABEL[d.type], date: d.date, repeat: d.repeat, enabled: true };
    update((s) => ({ ...s, reminders: [...s.reminders, r] }));
    setD({ ...d, title: '', date: '' });
    toast('Reminder added.');
  };
  const sorted = [...state.reminders].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <Card id="sec-reminders" className="scroll-mt-24">
      <CardTitle icon={<Bell size={20} />}>Reminders</CardTitle>
      <p className="mb-3 text-sm text-muted">You choose every reminder. They appear on your dashboard when they’re due within two weeks.</p>
      {sorted.length > 0 && (
        <ul className="mb-4 grid gap-2">
          {sorted.map((r) => (
            <li key={r.id} className={cx('flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2', !r.enabled && 'opacity-60')}>
              <span className="min-w-0">
                <span className="block font-semibold">{r.title}</span>
                <span className="text-sm text-muted">{REMINDER_LABEL[r.type]} · {fmtDate(r.date)}{r.repeat !== 'none' ? ` · repeats ${r.repeat}` : ''}</span>
              </span>
              <span className="flex items-center gap-2">
                <Button size="sm" variant="ghost" aria-pressed={r.enabled} onClick={() => update((s) => ({ ...s, reminders: s.reminders.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)) }))}>{r.enabled ? 'Pause' : 'Resume'}</Button>
                <Button size="sm" variant="ghost" aria-label={`Delete reminder ${r.title}`} onClick={() => update((s) => ({ ...s, reminders: s.reminders.filter((x) => x.id !== r.id) }))}><Trash size={16} /></Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); add(); }} noValidate>
        <SelectField label="Type" value={d.type} onChange={(e) => setD({ ...d, type: e.target.value as ReminderType })} options={(Object.keys(REMINDER_LABEL) as ReminderType[]).map((k) => ({ value: k, label: REMINDER_LABEL[k] }))} />
        <TextField label="Title (optional)" value={d.title} placeholder={REMINDER_LABEL[d.type]} onChange={(e) => setD({ ...d, title: e.target.value })} />
        <TextField label="Date" type="date" value={d.date} error={err.date} onChange={(e) => setD({ ...d, date: e.target.value })} />
        <SelectField label="Repeat" value={d.repeat} onChange={(e) => setD({ ...d, repeat: e.target.value as Reminder['repeat'] })} options={[{ value: 'none', label: 'Does not repeat' }, { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Every 3 months' }, { value: 'yearly', label: 'Yearly' }]} />
        <div className="sm:col-span-2"><Button type="submit" variant="primary"><Plus size={18} /> Add reminder</Button></div>
      </form>
    </Card>
  );
}

function Privacy({ onReset }: { onReset: () => void }) {
  const { state, update, storageOk } = useStore();
  const [confirm, setConfirm] = useState(false);
  const consent = state.settings.locationConsent;
  return (
    <Card id="sec-privacy" className="scroll-mt-24">
      <CardTitle icon={<Lock size={20} />}>Privacy & data</CardTitle>
      <ul className="mb-4 grid list-disc gap-1.5 pl-5 text-sm text-ink">
        <li>Everything you enter stays in this browser on this device. Nothing is uploaded or published.</li>
        <li>HomeBridge stores only your area, never a street address. Device location is rounded to about 10 km.</li>
        <li>In shared housing, only your own share is stored. Housemates’ finances are never requested.</li>
        <li>There are no risk scores and no automated eligibility decisions.</li>
        <li>Labels show where data came from: <strong>Simulated</strong>, <strong>You entered</strong>, or <strong>Sample listing</strong>.</li>
      </ul>
      {!storageOk && <Notice tone="amber">This browser isn’t saving data right now (private mode or storage full). Your changes last only until you close the page.</Notice>}
      <div className="mb-4 grid gap-2">
        <p className="text-sm"><span className="text-muted">Location:</span> <strong>{consent === 'granted' ? 'Approximate location shared' : consent === 'denied' ? 'Not shared' : consent === 'manual' ? 'Typed by you' : 'Not set'}</strong></p>
        <AreaPicker value={state.profile.area} onChange={(area) => update((s) => ({ ...s, profile: { ...s.profile, area } }))} />
        {state.profile.area && <div><Button size="sm" variant="ghost" onClick={() => update((s) => ({ ...s, profile: { ...s.profile, area: '' }, settings: { ...s.settings, locationConsent: 'unasked' } }))}>Forget my area</Button></div>}
      </div>
      {!confirm ? (
        <Button variant="danger" onClick={() => setConfirm(true)}><RotateCcw size={18} /> Reset demo data</Button>
      ) : (
        <div className="grid grid-cols-1 gap-2 rounded-xl border border-danger bg-danger-soft p-3" role="group" aria-label="Confirm reset">
          <p className="font-semibold">Clear all HomeBridge data on this device and start over? This removes your profile, issues, reminders, saved resources and settings.</p>
          <div className="flex flex-wrap gap-2"><Button variant="danger" onClick={onReset}><Trash size={18} /> Yes, clear everything</Button><Button onClick={() => setConfirm(false)}>Cancel</Button></div>
        </div>
      )}
    </Card>
  );
}
