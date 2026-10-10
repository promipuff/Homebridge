// Core domain types for HomeBridge.

export type Situation =
  | 'house_owner'
  | 'house_renter'
  | 'apartment'
  | 'condo'
  | 'shared'
  | 'dorm'
  | 'temporary'
  | 'other';

export type Tenure = 'own' | 'rent' | 'unsure';
export type UtilityKey = 'electricity' | 'water' | 'gas' | 'internet';
/** How a utility reaches the resident. "included" means bundled into rent or housing fees. */
export type PayArrangement = 'direct' | 'included' | 'shared' | 'not_applicable' | 'unsure';
export type MaintenanceParty =
  | 'self'
  | 'landlord'
  | 'property_manager'
  | 'association'
  | 'campus'
  | 'provider'
  | 'other'
  | 'unsure';
export type SensorPermission = 'yes' | 'portable' | 'no' | 'unsure';

export interface Profile {
  situation: Situation;
  tenure: Tenure;
  otherDescription: string;
  utilities: Record<UtilityKey, PayArrangement>;
  maintenanceParty: MaintenanceParty;
  sensorPermission: SensorPermission;
  nickname: string;
  /** Free-text area (neighborhood, ZIP or city). Never an exact address. */
  area: string;
}

// ---------- Utility calculator ----------
export type MeteredUtility = 'electricity' | 'water';
export type UsageUnit = 'kWh' | 'gal' | 'CCF';

export interface CalcInput {
  utility: MeteredUtility;
  unit: UsageUnit;
  mode: 'meter' | 'usage';
  previousReading: string;
  currentReading: string;
  usage: string;
  rate: string;
  cycleDays: string;
  daysElapsed: string;
  fixedCharge: string;
  taxPercent: string;
  budget: string;
  previousBill: string;
  arrangement: 'direct' | 'included' | 'shared';
  shareType: 'percent' | 'amount';
  sharePercent: string;
  shareAmount: string;
  reductionPercent: number;
}

export interface SharedExpense {
  id: string;
  label: string;
  /** Only the user's own agreed amount is stored. Housemates' amounts are never collected. */
  myShare: number;
  dueDay: string;
}

// ---------- Sensors ----------
export type SensorKind =
  | 'temperature'
  | 'humidity'
  | 'air_quality'
  | 'leak'
  | 'smoke_co'
  | 'electric_meter'
  | 'water_meter';

export type SensorScope = 'whole_home' | 'unit' | 'building' | 'personal';
export type DataSource = 'simulated' | 'user_entered' | 'live';

export interface SensorInstance {
  id: string;
  kind: SensorKind;
  scope: SensorScope;
  source: DataSource;
  status: 'online' | 'offline';
  name: string;
}

export type SimEventKind =
  | 'leak'
  | 'water_spike'
  | 'humidity_high'
  | 'heat'
  | 'air_poor'
  | 'co_alarm'
  | 'sensor_offline';

export interface SimEvent {
  id: string;
  kind: SimEventKind;
  at: string;
}

export interface Alert {
  id: string;
  kind: SimEventKind;
  severity: 'urgent' | 'warning' | 'info';
  title: string;
  summary: string;
  steps: string[];
  createdAt: string;
  source: DataSource;
  sensorId?: string;
  acknowledged: boolean;
  linkedIssueId?: string;
}

// ---------- Maintenance ----------
export type IssueCategory =
  | 'plumbing'
  | 'electrical'
  | 'heating_cooling'
  | 'moisture'
  | 'pests'
  | 'appliance'
  | 'structural'
  | 'accessibility'
  | 'shared_space'
  | 'other';

export type Severity = 'low' | 'medium' | 'high' | 'urgent';
export type IssueStatus =
  | 'documented'
  | 'reported'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'follow_up';
export type LocationScope =
  | 'whole_home'
  | 'unit'
  | 'shared_building'
  | 'private_room'
  | 'common_area'
  | 'outside'
  | 'unknown';

export interface HistoryEntry {
  id: string;
  at: string;
  type: 'created' | 'status' | 'note' | 'communication' | 'followup' | 'edit';
  text: string;
  status?: IssueStatus;
  communication?: { method: string; contact: string; date: string };
}

export interface Issue {
  id: string;
  category: IssueCategory;
  title: string;
  description: string;
  firstObserved: string;
  severity: Severity;
  location: string;
  locationScope: LocationScope;
  photo?: string;
  reported: 'yes' | 'no' | 'not_needed';
  reportedDate: string;
  responsibleParty: MaintenanceParty | 'unknown';
  status: IssueStatus;
  followUpDate: string;
  notes: string;
  checklist: Record<string, boolean>;
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

// ---------- Reminders ----------
export type ReminderType = 'safety' | 'maintenance' | 'smoke_alarm' | 'filter' | 'utility_due' | 'other';
export interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  date: string;
  repeat: 'none' | 'monthly' | 'quarterly' | 'yearly';
  enabled: boolean;
}

// ---------- Resources ----------
export type ResourceCategory =
  | 'food'
  | 'shelter'
  | 'affordable_housing'
  | 'rental_assistance'
  | 'utility_assistance'
  | 'repair_weatherization'
  | 'cooling_warming'
  | 'transportation'
  | 'disability'
  | 'internet'
  | 'legal'
  | 'community'
  | 'campus'
  | 'emergency';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  summary: string;
  eligibility: string;
  hours: string;
  phone: string;
  website: string;
  area: string;
  accessibility: string[];
  languages: string[];
  verification: 'sample' | 'national_program';
  tags: string[];
}

// ---------- Settings ----------
export interface Settings {
  textScale: number;
  highContrast: boolean;
  reduceMotion: boolean;
  simplified: boolean;
  theme: 'system' | 'light' | 'dark';
  language: 'en' | 'es';
  demoMode: boolean;
  showSafety?: boolean;
  locationConsent: 'unasked' | 'granted' | 'denied' | 'manual';
}

export type View = 'dashboard' | 'home' | 'utilities' | 'maintenance' | 'resources' | 'settings';

export interface AppState {
  version: 1;
  onboarded: boolean;
  profile: Profile;
  settings: Settings;
  calc: Record<MeteredUtility, CalcInput>;
  sharedExpenses: SharedExpense[];
  sensors: SensorInstance[];
  events: SimEvent[];
  alerts: Alert[];
  issues: Issue[];
  reminders: Reminder[];
  savedResources: string[];
  viewedResources: string[];
  scenario: string | null;
}
