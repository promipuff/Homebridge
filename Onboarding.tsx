import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppState, PayArrangement, Profile, Situation, UtilityKey } from '../types';
import { useStore } from '../store';
import { SITUATIONS, defaultProfile, questionPlan, sensorOptions } from '../lib/personalize';
import { PARTY_LABEL, PAY_LABEL, UTILITY_LABEL } from '../lib/labels';
import { sitKey } from '../lib/i18n';
import { starterSensors, syncCalc } from '../lib/defaults';
import { SCENARIOS } from '../lib/scenarios';
import { Button, ChoiceGroup, Notice, TextField, Toggle, cx } from './ui';
import {
  ArrowRight, BedDouble, Building, BuildingComplex, Check, ChevronLeft, CircleQuestionMark, GraduationCap, House, KeyRound, MapPin, Play, Users,
} from '../icons';
import { Logo } from './Logo';

export const SITUATION_ICON: Record<Situation, (p: { size?: number }) => ReactNode> = {
  house_owner: House, house_renter: KeyRound, apartment: BuildingComplex, condo: Building,
  shared: Users, dorm: GraduationCap, temporary: BedDouble, other: CircleQuestionMark,
};

/** Keep only sensors that still make sense for the new profile. Everything else in state is untouched. */
function applyProfile(state: AppState, profile: Profile, isNew: boolean): AppState {
  const allowed = sensorOptions(profile).options;
  let sensors = state.sensors.filter((s) => allowed.some((o) => o.kind === s.kind)).map((s) => {
    const opt = allowed.find((o) => o.kind === s.kind)!;
    return { ...s, scope: opt.scope };
  });
  const next = { ...state, profile, onboarded: true, scenario: isNew ? null : state.scenario };
  if (isNew && sensors.length === 0 && state.settings.demoMode) sensors = starterSensors(next);
  return syncCalc({ ...next, sensors });
}

export function Onboarding({ mode = 'new', onDone }: { mode?: 'new' | 'edit'; onDone?: () => void }) {
  const { state, update, t, toast, go } = useStore();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [draft, setDraft] = useState<Profile>(state.profile);
  const [descError, setDescError] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { headingRef.current?.focus(); }, [step]);

  const plan = questionPlan(draft.situation);
  const pick = (s: Situation) => {
    if (s === draft.situation && (mode === 'edit' || state.onboarded)) return;
    setDraft(defaultProfile(s, draft));
  };
  const setU = (k: UtilityKey, v: PayArrangement) => setDraft({ ...draft, utilities: { ...draft.utilities, [k]: v } });

  const next = () => {
    if (step === 1 && plan.askOtherDescription && !draft.otherDescription.trim()) {
      setDescError('Add a few words so HomeBridge can label your home. For example: “RV”, “living with family”.');
      return;
    }
    setDescError('');
    setStep((s) => (s + 1) as 0 | 1 | 2);
  };

  const finish = () => {
    update((s) => applyProfile(s, draft, mode === 'new'));
    toast(mode === 'edit' ? 'Living situation updated. Your other records are unchanged.' : 'Your dashboard is ready.');
    go('dashboard');
    onDone?.();
  };

  const loadScenario = (id: string) => {
    const sc = SCENARIOS.find((x) => x.id === id)!;
    update((s) => sc.build(s));
    go('dashboard');
    toast(`Scenario ${sc.letter} loaded: ${sc.title}`);
    onDone?.();
  };

  const stepTitle = [t('onb.title'), t('onb.q.title'), t('onb.p.title')][step];
  const stepSub = [t('onb.sub'), t('onb.q.sub'), t('onb.p.sub')][step];

  return (
    <div className={cx(mode === 'new' && 'min-h-full')}>
      {mode === 'new' && (
        <div className="mb-6 flex items-center justify-between gap-3">
          <Logo />
          <LanguageSwitch />
        </div>
      )}
      <ol className="mb-4 flex items-center gap-2 text-sm" aria-label="Setup progress">
        {[t('onb.title'), t('onb.q.title'), t('onb.p.title')].map((label, i) => (
          <li key={i} className="flex items-center gap-2" aria-current={i === step ? 'step' : undefined}>
            <span className={cx('grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-bold', i < step ? 'border-forest bg-forest text-forest-ink' : i === step ? 'border-forest text-forest' : 'border-line text-muted')}>
              {i < step ? <Check size={14} /> : i + 1}
            </span>
            <span className={cx('hidden sm:inline', i === step ? 'font-semibold text-ink' : 'text-muted')}>{label}</span>
            {i < 2 && <span className="h-px w-6 bg-line" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <h1 ref={headingRef} tabIndex={-1} className="font-display text-[2rem] font-bold leading-tight text-ink outline-none sm:text-[2.4rem]" style={{ textWrap: 'balance' }}>
        {stepTitle}
      </h1>
      <p className="mt-2 max-w-2xl text-muted">{stepSub}</p>

      {step === 0 && (
        <>
          <fieldset className="mt-6">
            <legend className="sr-only">{t('onb.title')}</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SITUATIONS.map((s) => {
                const Icon = SITUATION_ICON[s];
                const checked = draft.situation === s;
                return (
                  <label
                    key={s}
                    className={cx(
                      'group relative flex cursor-pointer flex-col gap-2 rounded-card border-2 p-4 transition focus-within:ring-2 focus-within:ring-focus focus-within:ring-offset-2 focus-within:ring-offset-bg',
                      checked ? 'border-forest bg-forest-soft' : 'border-line bg-surface hover:border-sage',
                    )}
                  >
                    <input type="radio" name="situation" value={s} checked={checked} onChange={() => pick(s)} className="sr-only" />
                    <span className={cx('grid h-11 w-11 place-items-center rounded-xl', checked ? 'bg-forest text-forest-ink' : 'bg-sage-soft text-forest')}>
                      <Icon size={22} />
                    </span>
                    <span className="font-display text-lg font-semibold leading-snug text-ink">{t(sitKey(s))}</span>
                    <span className="text-sm text-muted">{t(sitKey(s) + '.d')}</span>
                    {checked && (
                      <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-forest text-forest-ink" aria-hidden="true">
                        <Check size={14} />
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={next}>
              {t('onb.next')} <ArrowRight size={18} />
            </Button>
            {mode === 'edit' && <Button variant="ghost" onClick={onDone}>Cancel</Button>}
          </div>
          {mode === 'new' && (
            <section className="mt-10 border-t border-line pt-6" aria-labelledby="demo-h">
              <h2 id="demo-h" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <Play size={18} /> {t('onb.demo')}
              </h2>
              <p className="mb-3 text-sm text-muted">Each scenario loads a complete example home with simulated data and a step-by-step guide.</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                {SCENARIOS.map((sc) => (
                  <button key={sc.id} type="button" onClick={() => loadScenario(sc.id)} className="flex min-h-[44px] items-start gap-3 rounded-xl border border-line bg-surface p-3 text-left hover:border-forest hover:bg-forest-soft">
                    <span className="grid grid-cols-1 h-8 w-8 shrink-0 place-items-center rounded-lg bg-forest font-display font-bold text-forest-ink">{sc.letter}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{sc.title}</span>
                      <span className="block text-sm text-muted">{sc.who}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {step === 1 && (
        <div className="mt-6 grid max-w-3xl gap-6">
          {plan.askOtherDescription && (
            <TextField
              label="How would you describe where you live?"
              hint="Required for this option. A few words is enough."
              value={draft.otherDescription}
              maxLength={60}
              error={descError}
              onChange={(e) => setDraft({ ...draft, otherDescription: e.target.value })}
            />
          )}
          {plan.askTenure && (
            <ChoiceGroup
              name="tenure"
              legend="Do you own or rent your living space?"
              value={draft.tenure}
              onChange={(v) => setDraft({ ...draft, tenure: v })}
              options={[{ value: 'rent', label: 'I rent' }, { value: 'own', label: 'I own' }, { value: 'unsure', label: 'Not sure / other' }]}
            />
          )}
          <fieldset className="min-w-0">
            <legend className="mb-1 text-sm font-semibold text-ink">
              {plan.utilitiesMode === 'fees'
                ? 'Are utilities included in your housing fees?'
                : plan.utilitiesMode === 'optional'
                  ? 'Do you pay for any utilities yourself? (optional)'
                  : 'Which utilities do you pay, and how?'}
            </legend>
            <p className="mb-3 text-xs text-muted">
              {plan.utilitiesMode === 'optional'
                ? 'Most people in temporary housing don’t. If you don’t, HomeBridge won’t show any bills.'
                : 'Choose “I pay a share” if you split a bill. You’ll enter only your own share later.'}
            </p>
            <div className="grid grid-cols-1 gap-3">
              {plan.utilityKeys.map((k) => (
                <div key={k} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold text-ink" id={`u-${k}`}>{UTILITY_LABEL[k]}</span>
                  <select
                    aria-labelledby={`u-${k}`}
                    value={draft.utilities[k]}
                    onChange={(e) => setU(k, e.target.value as PayArrangement)}
                    className="min-h-[44px] rounded-xl border border-line bg-surface px-3 text-ink focus:ring-2 focus:ring-focus sm:w-64"
                  >
                    {plan.payOptions.map((o) => <option key={o} value={o}>{PAY_LABEL[o]}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </fieldset>
          <ChoiceGroup
            name="maint"
            legend="Who handles maintenance and repairs?"
            value={draft.maintenanceParty}
            onChange={(v) => setDraft({ ...draft, maintenanceParty: v })}
            options={plan.maintenanceOptions.map((o) => ({ value: o, label: PARTY_LABEL[o] }))}
          />
          {plan.askSensors ? (
            <ChoiceGroup
              name="sensors"
              legend="Can you add smart-home sensors?"
              hint="Sensors are optional. HomeBridge works fully without them."
              columns
              value={draft.sensorPermission}
              onChange={(v) => setDraft({ ...draft, sensorPermission: v })}
              options={[
                { value: 'yes', label: 'Yes, I can install devices', desc: 'For example, you own the home or have permission.' },
                { value: 'portable', label: 'Only portable, removable devices', desc: 'Nothing drilled, wired or permanent.' },
                { value: 'no', label: 'No devices', desc: 'You can still log conditions by hand.' },
                { value: 'unsure', label: 'Not sure yet', desc: 'We’ll suggest portable options only.' },
              ]}
            />
          ) : (
            <Notice title="No devices needed">
              {draft.situation === 'dorm'
                ? 'Campus housing usually doesn’t allow installed devices. HomeBridge works without them, and you can always ask your housing office.'
                : 'You won’t be asked to install anything. HomeBridge focuses on resources, safety and optional notes.'}
            </Notice>
          )}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setStep(0)}><ChevronLeft size={18} /> {t('onb.back')}</Button>
            <Button variant="primary" onClick={next}>{t('onb.next')} <ArrowRight size={18} /></Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 grid max-w-2xl gap-6">
          <TextField label="What should we call you?" hint="Optional. Shown only in your welcome message." value={draft.nickname} maxLength={30} autoComplete="nickname" onChange={(e) => setDraft({ ...draft, nickname: e.target.value })} />
          <AreaPicker value={draft.area} onChange={(area) => setDraft({ ...draft, area })} />
          {mode === 'new' && <QuickAccess />}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setStep(1)}><ChevronLeft size={18} /> {t('onb.back')}</Button>
            <Button variant="primary" onClick={finish}>{mode === 'edit' ? t('onb.save') : t('onb.finish')} <ArrowRight size={18} /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAccess() {
  const { state, update, t } = useStore();
  const set = (patch: Partial<AppState['settings']>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  return (
    <section className="rounded-card border border-line bg-surface p-4" aria-labelledby="qa-h">
      <h2 id="qa-h" className="mb-2 font-display text-lg font-semibold">{t('set.access')}</h2>
      <TextSizeControl />
      <div className="mt-2 grid gap-1">
        <Toggle label={t('set.contrast')} checked={state.settings.highContrast} onChange={(v) => set({ highContrast: v })} />
      </div>
    </section>
  );
}

export function TextSizeControl() {
  const { state, update, t } = useStore();
  const sizes = [
    { v: 1, l: 'Default' }, { v: 1.15, l: 'Large' }, { v: 1.3, l: 'Larger' }, { v: 1.5, l: 'Largest' },
  ];
  return (
    <ChoiceGroup
      name="textsize"
      legend={t('set.textsize')}
      value={String(state.settings.textScale)}
      onChange={(v) => update((s) => ({ ...s, settings: { ...s.settings, textScale: Number(v) } }))}
      options={sizes.map((s) => ({ value: String(s.v), label: s.l }))}
    />
  );
}

export function LanguageSwitch() {
  const { state, update } = useStore();
  return (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1" role="group" aria-label="Language / Idioma">
      {(['en', 'es'] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={state.settings.language === l}
          onClick={() => update((s) => ({ ...s, settings: { ...s.settings, language: l } }))}
          className={cx('min-h-[36px] rounded-lg px-3 text-sm font-semibold', state.settings.language === l ? 'bg-forest text-forest-ink' : 'text-ink hover:bg-surface-2')}
        >
          {l === 'en' ? 'English' : 'Español'}
        </button>
      ))}
    </div>
  );
}

/** Manual area entry first; device location only after an explicit, in-page consent step. */
export function AreaPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { state, update } = useStore();
  const [asking, setAsking] = useState(false);
  const [msg, setMsg] = useState('');
  const setConsent = (c: AppState['settings']['locationConsent']) => update((s) => ({ ...s, settings: { ...s.settings, locationConsent: c } }));

  const allow = () => {
    setAsking(false);
    if (!('geolocation' in navigator)) {
      setMsg('Location isn’t available in this browser. Type your area instead.');
      setConsent('manual');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Round to ~10 km so no exact location is ever stored.
        onChange(`Near ${pos.coords.latitude.toFixed(1)}, ${pos.coords.longitude.toFixed(1)}`);
        setConsent('granted');
        setMsg('Approximate area set. Only a rounded location is saved.');
      },
      () => {
        setConsent('denied');
        setMsg('Location wasn’t shared. That’s fine. Type a neighborhood, city or ZIP instead.');
      },
      { timeout: 8000, maximumAge: 600000 },
    );
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      <TextField
        label="Your area"
        hint="Optional. A neighborhood, city or ZIP code helps sort resources. Never enter your street address."
        value={value}
        maxLength={40}
        onChange={(e) => { onChange(e.target.value); if (state.settings.locationConsent === 'unasked') setConsent('manual'); }}
      />
      {!asking ? (
        <div>
          <Button size="sm" variant="ghost" onClick={() => setAsking(true)}><MapPin size={16} /> Use my location instead</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-surface-2 p-3 text-sm" role="dialog" aria-label="Location permission">
          <p className="font-semibold text-ink">Share your approximate location?</p>
          <p className="mt-1 text-muted">HomeBridge uses it only to sort resources near you. It rounds the location to about 10 km and keeps it on this device. Your browser will ask you too.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={allow}>Allow approximate location</Button>
            <Button size="sm" onClick={() => { setAsking(false); setConsent('manual'); }}>No, I’ll type it</Button>
          </div>
        </div>
      )}
      {msg && <p className="text-sm text-muted" role="status">{msg}</p>}
    </div>
  );
}
