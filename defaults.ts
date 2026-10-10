import type { AppState, CalcInput, Reminder, SensorInstance, Settings } from '../types';
import { defaultProfile, sensorOptions, todayISO } from './personalize';

export const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 9)}`;

export function defaultCalc(utility: 'electricity' | 'water'): CalcInput {
  return utility === 'electricity'
    ? {
        utility, unit: 'kWh', mode: 'meter', previousReading: '18240', currentReading: '18702', usage: '',
        rate: '0.142', cycleDays: '30', daysElapsed: '14', fixedCharge: '10', taxPercent: '6',
        budget: '130', previousBill: '118', arrangement: 'direct', shareType: 'percent', sharePercent: '50', shareAmount: '',
        reductionPercent: 10,
      }
    : {
        utility, unit: 'gal', mode: 'usage', previousReading: '', currentReading: '', usage: '1900',
        rate: '0.012', cycleDays: '30', daysElapsed: '14', fixedCharge: '14', taxPercent: '0',
        budget: '70', previousBill: '58', arrangement: 'direct', shareType: 'percent', sharePercent: '50', shareAmount: '',
        reductionPercent: 10,
      };
}

export const defaultSettings: Settings = {
  textScale: 1, highContrast: false, reduceMotion: false, simplified: false, theme: 'system', language: 'en',
  demoMode: true, locationConsent: 'unasked',
};

export function addDays(n: number, from = new Date()) {
  return todayISO(new Date(from.getTime() + n * 86400000));
}

export function defaultReminders(): Reminder[] {
  return [
    { id: uid('rem'), type: 'smoke_alarm', title: 'Test smoke & CO alarms', date: addDays(5), repeat: 'monthly', enabled: true },
    { id: uid('rem'), type: 'safety', title: 'Check that exits and hallways are clear', date: addDays(12), repeat: 'monthly', enabled: true },
  ];
}

/** Sensible starter sensors for a profile (simulated). Residents who can't add devices get none. */
export function starterSensors(state: Pick<AppState, 'profile'>): SensorInstance[] {
  const { options } = sensorOptions(state.profile);
  const pick = options.filter((o) => o.install !== 'provided').slice(0, 4);
  return pick.map((o, i) => ({ id: `sim-${o.kind}-${i}`, kind: o.kind, scope: o.scope, source: 'simulated', status: 'online', name: '' }));
}

/** Keep the calculator's "how is it paid" setting in step with the housing profile. */
export function syncCalc(state: AppState): AppState {
  const calc = { ...state.calc };
  (['electricity', 'water'] as const).forEach((k) => {
    const a = state.profile.utilities[k];
    if (a === 'direct' || a === 'included' || a === 'shared') calc[k] = { ...calc[k], arrangement: a };
  });
  return { ...state, calc };
}

export function initialState(): AppState {
  const profile = defaultProfile('apartment');
  return {
    version: 1,
    onboarded: false,
    profile,
    settings: { ...defaultSettings },
    calc: { electricity: defaultCalc('electricity'), water: defaultCalc('water') },
    sharedExpenses: [],
    sensors: [],
    events: [],
    alerts: [],
    issues: [],
    reminders: defaultReminders(),
    savedResources: [],
    viewedResources: [],
    scenario: null,
  };
}
