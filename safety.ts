// Simulated neighborhood safety feed for the prototype.
// Area-level only: rounded distance and direction, never a street address, a name or a person.
export type SafetyCategory = 'property' | 'traffic' | 'fire_ems' | 'utility' | 'police' | 'weather';

export interface SafetyIncident {
  id: string;
  category: SafetyCategory;
  title: string;
  detail: string;
  distanceMi: number;
  direction: string;
  hoursAgo: number;
  status: 'Active' | 'Update' | 'Cleared';
}

export const SAFETY_CATEGORY_LABEL: Record<SafetyCategory, string> = {
  property: 'Property',
  traffic: 'Traffic',
  fire_ems: 'Fire & medical',
  utility: 'Outages & roads',
  police: 'Police activity',
  weather: 'Weather',
};

export const SAFETY_INCIDENTS: SafetyIncident[] = [
  { id: 'si-1', category: 'utility', title: 'Power outage affecting several blocks', detail: 'Utility crews on site. Estimated restoration in about 3 hours.', distanceMi: 0.4, direction: 'NE', hoursAgo: 1, status: 'Active' },
  { id: 'si-2', category: 'traffic', title: 'Two-car crash, one lane blocked', detail: 'No serious injuries reported. Expect delays.', distanceMi: 0.7, direction: 'S', hoursAgo: 2, status: 'Update' },
  { id: 'si-3', category: 'property', title: 'Vehicle break-ins reported in a parking lot', detail: 'Several cars entered overnight. Keep valuables out of sight.', distanceMi: 0.5, direction: 'W', hoursAgo: 9, status: 'Cleared' },
  { id: 'si-4', category: 'fire_ems', title: 'Kitchen fire, contained', detail: 'Firefighters cleared the scene. No injuries reported.', distanceMi: 0.9, direction: 'N', hoursAgo: 14, status: 'Cleared' },
  { id: 'si-5', category: 'weather', title: 'Heat advisory this afternoon', detail: 'Cooling centers open 10am–8pm. Check on neighbors without air conditioning.', distanceMi: 0, direction: '', hoursAgo: 18, status: 'Active' },
  { id: 'si-6', category: 'police', title: 'Police activity, area now clear', detail: 'Officers responded to a reported dispute. No ongoing risk reported.', distanceMi: 0.8, direction: 'E', hoursAgo: 26, status: 'Cleared' },
  { id: 'si-7', category: 'property', title: 'Package thefts from porches', detail: 'Neighbors report missing deliveries. Consider pickup lockers.', distanceMi: 0.3, direction: 'SE', hoursAgo: 40, status: 'Cleared' },
  { id: 'si-8', category: 'utility', title: 'Street flooding near an underpass', detail: 'Road closed until water recedes. Don’t drive through standing water.', distanceMi: 1.1, direction: 'SW', hoursAgo: 52, status: 'Cleared' },
];

/** Simulated 7-day counts by category, with the 7 days before for comparison. */
export const SAFETY_WEEK: { category: SafetyCategory; thisWeek: number; lastWeek: number }[] = [
  { category: 'property', thisWeek: 6, lastWeek: 9 },
  { category: 'traffic', thisWeek: 4, lastWeek: 3 },
  { category: 'fire_ems', thisWeek: 2, lastWeek: 2 },
  { category: 'utility', thisWeek: 3, lastWeek: 1 },
];

export const OFFICIAL_SAFETY_LINKS = [
  {
    name: 'National Sex Offender Public Website (NSOPW)',
    url: 'https://www.nsopw.gov',
    note: 'Run by the U.S. Department of Justice with state, tribal and territorial registries. Searches every state at once.',
  },
  {
    name: 'Georgia Sex Offender Registry (GBI)',
    url: 'https://gbi.georgia.gov/georgia-sex-offender-registry',
    note: 'Georgia Bureau of Investigation’s official registry search.',
  },
];
