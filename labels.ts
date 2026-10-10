import type {
  IssueCategory, IssueStatus, LocationScope, MaintenanceParty, PayArrangement, ReminderType, SensorScope, Severity, UtilityKey,
} from '../types';

export const UTILITY_LABEL: Record<UtilityKey, string> = {
  electricity: 'Electricity', water: 'Water', gas: 'Gas or heating fuel', internet: 'Internet',
};

export const PAY_LABEL: Record<PayArrangement, string> = {
  direct: 'I pay it directly',
  included: 'Included in rent or fees',
  shared: 'I pay a share',
  not_applicable: 'Not applicable to me',
  unsure: 'Not sure',
};

export const PARTY_LABEL: Record<MaintenanceParty | 'unknown', string> = {
  self: 'Me',
  landlord: 'Landlord',
  property_manager: 'Property manager',
  association: 'HOA or condo association',
  campus: 'Campus housing',
  provider: 'Housing provider or staff',
  other: 'Someone else',
  unsure: 'Not sure',
  unknown: 'Not known yet',
};

export const CATEGORY_LABEL: Record<IssueCategory, string> = {
  plumbing: 'Plumbing leak',
  electrical: 'Electrical problem',
  heating_cooling: 'Heating or cooling',
  moisture: 'Excess moisture or mold',
  pests: 'Pests',
  appliance: 'Broken appliance',
  structural: 'Structural concern',
  accessibility: 'Accessibility barrier',
  shared_space: 'Shared-space problem',
  other: 'Other housing issue',
};

export const STATUS_LABEL: Record<IssueStatus, string> = {
  documented: 'Not reported yet',
  reported: 'Reported',
  acknowledged: 'Acknowledged',
  in_progress: 'In progress',
  resolved: 'Resolved',
  follow_up: 'Follow-up needed',
};

export const STATUS_LABEL_PROJECT: Partial<Record<IssueStatus, string>> = { documented: 'Planned' };

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: 'Low · cosmetic or minor',
  medium: 'Medium · needs fixing soon',
  high: 'High · affects daily living',
  urgent: 'Urgent · safety risk',
};

export const SCOPE_LABEL: Record<LocationScope, string> = {
  whole_home: 'Inside the home',
  unit: 'Inside my unit',
  shared_building: 'Shared building area',
  private_room: 'My room',
  common_area: 'Shared common area',
  outside: 'Outside / exterior',
  unknown: 'Not sure',
};

export const SENSOR_SCOPE_LABEL: Record<SensorScope, string> = {
  whole_home: 'Whole home',
  unit: 'My unit',
  building: 'Building-wide',
  personal: 'Personal (private to you)',
};

export const REMINDER_LABEL: Record<ReminderType, string> = {
  safety: 'Home safety check',
  maintenance: 'Maintenance follow-up',
  smoke_alarm: 'Test smoke & CO alarms',
  filter: 'Replace air filter',
  utility_due: 'Utility bill due',
  other: 'Other',
};

export const ACCESSIBILITY_PRESETS = [
  'Entrance has steps and no ramp',
  'Doorway too narrow for a mobility device',
  'Controls (thermostat, panel, outlets) hard to reach',
  'Lighting too dim in halls or stairs',
  'Bathroom lacks grab bars or step-free shower',
];
