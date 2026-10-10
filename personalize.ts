// Every rule that makes HomeBridge adapt to a living situation lives here,
// so the behavior is easy to audit and test (tests/personalize.test.ts).
import type {
  AppState, IssueStatus, LocationScope, MaintenanceParty, PayArrangement, Profile, SensorKind,
  SensorScope, Situation, UtilityKey,
} from '../types';

export const SITUATIONS: Situation[] = [
  'house_owner', 'house_renter', 'apartment', 'condo', 'shared', 'dorm', 'temporary', 'other',
];

export interface QuestionPlan {
  askTenure: boolean;
  fixedTenure: Profile['tenure'] | null;
  utilitiesMode: 'full' | 'fees' | 'optional';
  utilityKeys: UtilityKey[];
  payOptions: PayArrangement[];
  maintenanceOptions: MaintenanceParty[];
  askSensors: boolean;
  sensorOptions: Profile['sensorPermission'][];
  askOtherDescription: boolean;
}

export function questionPlan(s: Situation): QuestionPlan {
  const allPay: PayArrangement[] = ['direct', 'included', 'shared', 'not_applicable', 'unsure'];
  const base: QuestionPlan = {
    askTenure: true, fixedTenure: null, utilitiesMode: 'full',
    utilityKeys: ['electricity', 'water', 'gas', 'internet'], payOptions: allPay,
    maintenanceOptions: ['self', 'landlord', 'property_manager', 'other', 'unsure'],
    askSensors: true, sensorOptions: ['yes', 'portable', 'no', 'unsure'], askOtherDescription: false,
  };
  switch (s) {
    case 'house_owner':
      return { ...base, askTenure: false, fixedTenure: 'own', maintenanceOptions: ['self', 'other'] };
    case 'house_renter':
      return { ...base, askTenure: false, fixedTenure: 'rent', maintenanceOptions: ['landlord', 'property_manager', 'self', 'unsure'], sensorOptions: ['portable', 'yes', 'no', 'unsure'] };
    case 'apartment':
      return { ...base, maintenanceOptions: ['property_manager', 'landlord', 'association', 'self', 'unsure'] };
    case 'condo':
      return { ...base, maintenanceOptions: ['self', 'association', 'landlord', 'property_manager', 'unsure'] };
    case 'shared':
      return { ...base, maintenanceOptions: ['landlord', 'property_manager', 'self', 'other', 'unsure'], sensorOptions: ['portable', 'yes', 'no', 'unsure'] };
    case 'dorm':
      return {
        ...base, askTenure: false, fixedTenure: 'rent', utilitiesMode: 'fees', utilityKeys: ['electricity', 'water', 'internet'],
        payOptions: ['included', 'direct', 'shared', 'unsure'], maintenanceOptions: ['campus', 'property_manager', 'unsure'],
        askSensors: false,
      };
    case 'temporary':
      return {
        ...base, askTenure: false, fixedTenure: 'unsure', utilitiesMode: 'optional', utilityKeys: ['electricity', 'water', 'internet'],
        payOptions: ['not_applicable', 'direct', 'included', 'unsure'], maintenanceOptions: ['provider', 'other', 'unsure'],
        askSensors: false,
      };
    case 'other':
      return { ...base, askOtherDescription: true, maintenanceOptions: ['self', 'landlord', 'property_manager', 'association', 'campus', 'provider', 'other', 'unsure'] };
  }
}

export function defaultProfile(s: Situation, prev?: Profile): Profile {
  const plan = questionPlan(s);
  const u = (v: PayArrangement): Record<UtilityKey, PayArrangement> => ({ electricity: v, water: v, gas: v, internet: v });
  const defaults: Record<Situation, Partial<Profile>> = {
    house_owner: { tenure: 'own', utilities: u('direct'), maintenanceParty: 'self', sensorPermission: 'yes' },
    house_renter: { tenure: 'rent', utilities: { electricity: 'direct', water: 'direct', gas: 'direct', internet: 'direct' }, maintenanceParty: 'landlord', sensorPermission: 'portable' },
    apartment: { tenure: 'rent', utilities: { electricity: 'direct', water: 'included', gas: 'not_applicable', internet: 'direct' }, maintenanceParty: 'property_manager', sensorPermission: 'portable' },
    condo: { tenure: 'own', utilities: { electricity: 'direct', water: 'included', gas: 'direct', internet: 'direct' }, maintenanceParty: 'self', sensorPermission: 'yes' },
    shared: { tenure: 'rent', utilities: u('shared'), maintenanceParty: 'landlord', sensorPermission: 'portable' },
    dorm: { tenure: 'rent', utilities: u('included'), maintenanceParty: 'campus', sensorPermission: 'no' },
    temporary: { tenure: 'unsure', utilities: u('not_applicable'), maintenanceParty: 'provider', sensorPermission: 'no' },
    other: { tenure: 'unsure', utilities: u('unsure'), maintenanceParty: 'unsure', sensorPermission: 'unsure' },
  };
  const d = defaults[s];
  return {
    situation: s,
    tenure: plan.fixedTenure ?? d.tenure ?? 'unsure',
    otherDescription: prev?.otherDescription ?? '',
    utilities: d.utilities!,
    maintenanceParty: d.maintenanceParty!,
    sensorPermission: plan.askSensors ? d.sensorPermission! : 'no',
    nickname: prev?.nickname ?? '',
    area: prev?.area ?? '',
  };
}

export const isRenter = (p: Profile) => p.tenure === 'rent' && p.situation !== 'dorm';
export const isOwner = (p: Profile) => p.tenure === 'own';

/** Utilities the resident pays for (fully or a share). Included/N/A utilities never produce a bill card. */
export function billedUtilities(p: Profile): UtilityKey[] {
  return (Object.keys(p.utilities) as UtilityKey[]).filter((k) => p.utilities[k] === 'direct' || p.utilities[k] === 'shared');
}

export function situationLabel(p: Profile): string {
  const tenure = p.tenure === 'own' ? 'Owner' : p.tenure === 'rent' ? 'Renter' : '';
  const map: Record<Situation, string> = {
    house_owner: 'House · Homeowner',
    house_renter: 'House · Renter',
    apartment: `Apartment${tenure ? ' · ' + tenure : ''}`,
    condo: `Condo / Townhouse${tenure ? ' · ' + tenure : ''}`,
    shared: 'Shared housing',
    dorm: 'Student housing',
    temporary: 'Temporary housing',
    other: p.otherDescription ? `Other · ${p.otherDescription}` : 'Other arrangement',
  };
  return map[p.situation];
}

// ---------------- Dashboard ----------------
export type CardId =
  | 'utility_budget'
  | 'usage_insight'
  | 'energy'
  | 'water'
  | 'maintenance'
  | 'landlord_followups'
  | 'building'
  | 'personal_share'
  | 'housing_fees'
  | 'essentials'
  | 'safety'
  | 'campus'
  | 'reminders';

export function dashboardCards(state: AppState): CardId[] {
  const p = state.profile;
  const billed = billedUtilities(p);
  const metered = billed.some((k) => k === 'electricity' || k === 'water');
  const hasSensors = state.sensors.length > 0;
  const cards: CardId[] = [];
  switch (p.situation) {
    case 'house_owner':
      if (metered) cards.push('utility_budget');
      cards.push('energy', 'water', 'maintenance');
      break;
    case 'house_renter':
      if (metered) cards.push('utility_budget');
      cards.push('maintenance', 'landlord_followups');
      break;
    case 'apartment':
      if (metered) cards.push('utility_budget');
      else cards.push('usage_insight');
      cards.push('maintenance', 'building');
      if (isRenter(p)) cards.push('landlord_followups');
      break;
    case 'condo':
      if (metered) cards.push('utility_budget');
      cards.push('maintenance', 'building');
      break;
    case 'shared':
      cards.push(metered ? 'personal_share' : 'usage_insight', 'maintenance');
      break;
    case 'dorm':
      cards.push(metered ? 'utility_budget' : 'housing_fees', 'maintenance', 'safety', 'campus');
      break;
    case 'temporary':
      cards.push('essentials', 'safety');
      if (metered) cards.push('utility_budget');
      cards.push('maintenance');
      break;
    case 'other':
      cards.push(metered ? 'utility_budget' : 'usage_insight', 'maintenance');
      break;
  }
  if (hasSensors && !cards.includes('energy') && state.sensors.some((s) => s.kind === 'electric_meter')) cards.push('energy');
  if (!cards.includes('safety')) cards.push('safety');
  cards.push('reminders');
  return Array.from(new Set(cards));
}

// ---------------- Sensors ----------------
export interface SensorOption {
  kind: SensorKind;
  scope: SensorScope;
  install: 'installed' | 'plug_in' | 'portable' | 'provided';
  note: string;
}

export const SENSOR_INFO: Record<SensorKind, { label: string; unit: string; detects: string; notDetect: string }> = {
  temperature: { label: 'Temperature sensor', unit: '°F', detects: 'Air temperature where the sensor sits.', notDetect: 'Does not detect fire, smoke or gas.' },
  humidity: { label: 'Humidity sensor', unit: '% RH', detects: 'Relative humidity of the air nearby.', notDetect: 'Does not detect mold or leaks directly. High humidity is a clue, not a diagnosis.' },
  air_quality: { label: 'Air-quality monitor (PM2.5)', unit: 'µg/m³', detects: 'Fine particles (PM2.5) in the air.', notDetect: 'Does not detect carbon monoxide, radon or natural gas.' },
  leak: { label: 'Water leak sensor', unit: 'wet / dry', detects: 'Water touching its contacts on the floor.', notDetect: 'Only detects water at its own spot. It cannot find hidden leaks in walls.' },
  smoke_co: { label: 'Smoke & CO alarm (connected)', unit: 'status', detects: 'Reports the status a connected smoke and carbon monoxide alarm sends.', notDetect: 'HomeBridge does not detect smoke or CO itself. Your alarm does. Always rely on the alarm’s own siren.' },
  electric_meter: { label: 'Electricity usage', unit: 'kWh', detects: 'Electricity used, from a smart meter or utility account data.', notDetect: 'Does not show which appliance used the power.' },
  water_meter: { label: 'Water usage', unit: 'gal', detects: 'Water used, from a smart water meter.', notDetect: 'Unusual use can suggest a leak, but cannot confirm one or show where it is.' },
};

export function sensorOptions(p: Profile): { options: SensorOption[]; guidance: string } {
  const portable = (kind: SensorKind, note: string): SensorOption => ({ kind, scope: 'personal', install: 'portable', note });
  const provided = (kind: SensorKind, note = 'Only if your housing provider shares these readings.'): SensorOption => ({ kind, scope: 'building', install: 'provided', note });
  const s = p.situation;

  if (s === 'dorm' || s === 'temporary' || p.sensorPermission === 'no') {
    return {
      guidance:
        s === 'dorm'
          ? 'Campus housing usually doesn’t allow residents to install devices. HomeBridge works fully without sensors. Ask your housing office before placing any device.'
          : s === 'temporary'
            ? 'You don’t need any device to use HomeBridge. Never install equipment where you’re staying. If staff share building readings, you can view them here.'
            : 'You said you can’t add devices. HomeBridge works fully without them, and you can log conditions by hand.',
      options: [
        provided('temperature'), provided('humidity'), provided('air_quality'),
        portable('temperature', 'A small battery thermometer you carry. Nothing is installed or plugged in.'),
      ],
    };
  }

  const unitScope: SensorScope = s === 'house_owner' ? 'whole_home' : s === 'shared' ? 'personal' : 'unit';
  if (p.sensorPermission === 'yes' && (s === 'house_owner' || isOwner(p))) {
    const opts: SensorOption[] = (['temperature', 'humidity', 'air_quality', 'leak', 'smoke_co', 'electric_meter', 'water_meter'] as SensorKind[]).map((kind) => ({
      kind, scope: unitScope, install: kind === 'smoke_co' || kind.endsWith('meter') ? 'installed' : 'plug_in',
      note: kind === 'smoke_co' ? 'Use alarms listed by a recognized testing lab, installed per the manufacturer.' : '',
    }));
    if (s === 'condo' || s === 'apartment') opts.push(provided('water_meter', 'Building-wide readings, if your association shares them.'));
    return { guidance: s === 'house_owner' ? 'You can set up a whole-home sensor kit. Choose what you have or plan to get.' : 'You own your unit, so unit-level sensors are up to you. Building systems belong to the building.', options: opts };
  }

  // Renters, shared housing, and anyone limited to portable devices
  const opts: SensorOption[] = [
    portable('temperature', 'Battery thermometer. No drilling or wiring.'),
    portable('humidity', 'Often combined with the thermometer.'),
    { kind: 'air_quality', scope: unitScope === 'whole_home' ? 'unit' : unitScope, install: 'plug_in', note: 'Plugs into an outlet. Take it with you when you move.' },
    { kind: 'leak', scope: unitScope === 'whole_home' ? 'unit' : unitScope, install: 'portable', note: 'Sits on the floor under a sink or water heater.' },
    { kind: 'electric_meter', scope: unitScope === 'whole_home' ? 'unit' : unitScope, install: 'provided', note: 'From your utility account data, if your utility offers it.' },
    { kind: 'smoke_co', scope: unitScope === 'whole_home' ? 'unit' : unitScope, install: 'provided', note: 'Only if your landlord installed connected alarms. Never remove or replace required alarms.' },
  ];
  if (s === 'apartment' || s === 'condo') opts.push(provided('temperature', 'Building or hallway readings shared by management.'));
  return {
    guidance:
      s === 'shared'
        ? 'Portable sensors are linked to your profile only. Housemates can’t see your readings in HomeBridge.'
        : 'Portable, removable sensors work best for renters. Check your lease before installing anything permanent.',
    options: opts,
  };
}

// ---------------- Maintenance workflows ----------------
export interface Workflow {
  title: string;
  intro: string;
  statuses: IssueStatus[];
  parties: (MaintenanceParty | 'unknown')[];
  scopes: LocationScope[];
  communicationLog: boolean;
  studentChecklist: boolean;
  projectMode: boolean;
  optional: boolean;
  reportedLabel: string;
  newLabel: string;
}

export const STUDENT_CHECKLIST = [
  'Wrote down the room number and exact spot',
  'Took a photo (if safe)',
  'Submitted the housing work order or told staff',
  'Saved the work-order or confirmation number',
  'Set a date to follow up',
];

export function maintenanceWorkflow(p: Profile): Workflow {
  const renterStatuses: IssueStatus[] = ['documented', 'reported', 'acknowledged', 'in_progress', 'follow_up', 'resolved'];
  const common = { communicationLog: false, studentChecklist: false, projectMode: false, optional: false };
  switch (p.situation) {
    case 'house_owner':
      return {
        ...common, projectMode: true, title: 'Home repairs', newLabel: 'Add repair or project',
        intro: 'Track repair projects, set priorities and keep a repair history for your home.',
        statuses: ['documented', 'in_progress', 'follow_up', 'resolved'],
        parties: ['self', 'other'], scopes: ['whole_home', 'outside', 'unknown'], reportedLabel: 'Contractor or service booked?',
      };
    case 'condo':
      return {
        ...common, communicationLog: true, title: 'Unit & building issues', newLabel: 'Report an issue',
        intro: 'Separate problems inside your unit from shared-building issues, and note who handles each one.',
        statuses: renterStatuses, parties: ['self', 'association', 'landlord', 'property_manager', 'unknown'],
        scopes: ['unit', 'shared_building', 'outside', 'unknown'], reportedLabel: 'Reported to the responsible party?',
      };
    case 'shared':
      return {
        ...common, communicationLog: true, title: 'Home issues', newLabel: 'Record an issue',
        intro: 'Log problems in your room or shared spaces. HomeBridge never assigns blame to a housemate.',
        statuses: renterStatuses, parties: ['landlord', 'property_manager', 'self', 'other', 'unknown'],
        scopes: ['private_room', 'common_area', 'shared_building', 'unknown'], reportedLabel: 'Reported to the landlord or manager?',
      };
    case 'dorm':
      return {
        ...common, studentChecklist: true, title: 'Housing requests', newLabel: 'New housing request',
        intro: 'A simple checklist for campus work orders, with report dates and status.',
        statuses: ['documented', 'reported', 'acknowledged', 'in_progress', 'follow_up', 'resolved'],
        parties: ['campus', 'property_manager', 'unknown'], scopes: ['private_room', 'common_area', 'shared_building', 'unknown'],
        reportedLabel: 'Work order submitted?',
      };
    case 'temporary':
      return {
        ...common, optional: true, title: 'Notes on conditions', newLabel: 'Note a problem',
        intro: 'Optional. Keep a private record of a problem if it helps you, and find support below. You don’t need to fix anything or contact a landlord.',
        statuses: ['documented', 'reported', 'resolved'], parties: ['provider', 'unknown'],
        scopes: ['private_room', 'common_area', 'unknown'], reportedLabel: 'Told staff?',
      };
    default: {
      const renter = isRenter(p);
      return {
        ...common, communicationLog: renter || p.maintenanceParty !== 'self', projectMode: p.tenure === 'own' && p.situation !== 'apartment',
        title: renter ? 'Maintenance requests' : 'Maintenance', newLabel: renter ? 'Document an issue' : 'Add an issue',
        intro: renter
          ? 'Document conditions, log every contact with your landlord or manager, and track follow-ups.'
          : 'Track issues in your home and who is handling them.',
        statuses: renterStatuses,
        parties: renter ? ['landlord', 'property_manager', 'self', 'unknown'] : ['self', 'association', 'property_manager', 'other', 'unknown'],
        scopes: p.situation === 'apartment' ? ['unit', 'shared_building', 'unknown'] : ['unit', 'outside', 'unknown'],
        reportedLabel: 'Reported to the landlord or manager?',
      };
    }
  }
}

// ---------------- Resource recommendations ----------------
export interface Recommendation {
  tag: string;
  reason: string;
}

/** Needs come only from what the resident selected or entered. Never from income, race, age or disability inference. */
export function resourceNeeds(state: AppState, projectedStatus: 'over' | 'approaching' | 'on_track' | null): Recommendation[] {
  const p = state.profile;
  const open = state.issues.filter((i) => i.status !== 'resolved');
  const needs: Recommendation[] = [];
  const add = (tag: string, reason: string) => { if (!needs.some((n) => n.tag === tag)) needs.push({ tag, reason }); };

  const waterIssue = open.find((i) => i.category === 'plumbing' || i.category === 'moisture');
  const heatIssue = open.find((i) => i.category === 'heating_cooling');
  const access = open.find((i) => i.category === 'accessibility');

  if (waterIssue && isRenter(p)) {
    add('tenant_rights', `You have an open ${waterIssue.category === 'plumbing' ? 'plumbing' : 'moisture'} issue in a rental.`);
    add('repair_guidance', 'Repair guidance for the open water issue.');
  }
  if (waterIssue && !isRenter(p) && p.situation !== 'dorm' && p.situation !== 'temporary') add('home_repair', 'You have an open water issue to repair.');
  if (heatIssue) {
    if (isRenter(p)) add('tenant_rights', 'You have an open heating or cooling issue in a rental.');
    add('cooling_warming', 'A heating or cooling problem is open.');
    if (isOwner(p)) add('home_repair', 'Heating or cooling repair help.');
  }
  if (access) {
    add('home_modification', 'You recorded an accessibility barrier.');
    add('disability_support', 'Support services for the barrier you recorded.');
    if (isRenter(p) || p.situation === 'shared' || p.situation === 'dorm') add('tenant_rights', 'Renters can ask for reasonable modifications. These groups explain how.');
  }
  if (projectedStatus === 'over' || projectedStatus === 'approaching') {
    add('utility_assistance', `Your projected utility amount is ${projectedStatus === 'over' ? 'over' : 'close to'} the budget you set.`);
    if (isOwner(p)) add('weatherization', 'Weatherization can lower energy use in a home you own.');
  }
  const overdue = open.find((i) => i.followUpDate && i.followUpDate < todayISO());
  if (overdue && isRenter(p)) add('tenant_rights', 'A follow-up date on one of your issues has passed.');
  if (state.alerts.some((a) => !a.acknowledged && a.kind === 'heat')) add('cooling_warming', 'A high indoor temperature alert is active.');
  if (p.situation === 'dorm') add('campus', 'You live in student housing.');
  if (p.situation === 'temporary') {
    add('essentials', 'You are in temporary housing.');
    add('housing_search', 'Help finding longer-term housing.');
  }
  return needs;
}

/** Local calendar date as YYYY-MM-DD. */
export const todayISO = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
