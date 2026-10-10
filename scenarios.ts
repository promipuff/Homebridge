// Ready-made demo scenarios (Hacklanta section 9). Each builds a complete state and a guide.
import type { AppState, Issue, View } from '../types';
import { defaultCalc, defaultReminders, initialState, addDays, uid } from './defaults';
import { defaultProfile, todayISO } from './personalize';

export interface GuideStep {
  text: string;
  view?: View;
  hint?: string;
}

export interface Scenario {
  id: string;
  letter: string;
  title: string;
  who: string;
  build: (prev: AppState) => AppState;
  steps: GuideStep[];
}

const now = () => new Date().toISOString();

function issue(p: Partial<Issue> & Pick<Issue, 'category' | 'title'>): Issue {
  const created = p.createdAt ?? now();
  return {
    id: uid('iss'), description: '', firstObserved: todayISO(), severity: 'medium', location: '', locationScope: 'unit',
    reported: 'no', reportedDate: '', responsibleParty: 'unknown', status: 'documented', followUpDate: '', notes: '',
    checklist: {}, history: [{ id: uid('h'), at: created, type: 'created', text: 'Issue recorded' }], createdAt: created, updatedAt: created,
    ...p,
  };
}

/** Keep accessibility and language choices when switching scenarios; they belong to the person, not the scenario. */
const fresh = (prev: AppState): AppState => ({ ...initialState(), settings: { ...prev.settings, demoMode: true }, onboarded: true });

export const SCENARIOS: Scenario[] = [
  {
    id: 'A', letter: 'A', title: 'Apartment renter with a high electric bill', who: 'Apartment · renting · electricity billed separately',
    build: (prev) => {
      const s = fresh(prev);
      s.profile = { ...defaultProfile('apartment'), tenure: 'rent', utilities: { electricity: 'direct', water: 'included', gas: 'not_applicable', internet: 'direct' }, nickname: 'Jordan', area: 'Westside' };
      s.calc.electricity = { ...defaultCalc('electricity'), previousReading: '18240', currentReading: '18902', daysElapsed: '18', budget: '130', previousBill: '150', reductionPercent: 10 };
      s.calc.water = { ...defaultCalc('water'), arrangement: 'included' };
      s.sensors = [
        { id: 'sim-temperature-a', kind: 'temperature', scope: 'personal', source: 'simulated', status: 'online', name: 'Bedroom thermometer' },
        { id: 'sim-electric-a', kind: 'electric_meter', scope: 'unit', source: 'simulated', status: 'online', name: 'Utility account data' },
      ];
      s.scenario = 'A';
      return s;
    },
    steps: [
      { text: 'Profile is set: Apartment, renting, electricity billed separately.', view: 'settings' },
      { text: 'Open Utilities. Usage and a $130 monthly budget are filled in.', view: 'utilities' },
      { text: 'See the projected bill and the “Projected to exceed budget” status.', view: 'utilities' },
      { text: 'Change the budget to 190, then 200, and watch the status change.', view: 'utilities', hint: 'Type in the Budget field' },
      { text: 'Scroll to conservation tips and the utility assistance listed below them.', view: 'utilities' },
    ],
  },
  {
    id: 'B', letter: 'B', title: 'Homeowner with a possible water leak', who: 'House · homeowner · whole-home sensors',
    build: (prev) => {
      const s = fresh(prev);
      s.profile = { ...defaultProfile('house_owner'), nickname: 'Dana', area: 'Eastside' };
      s.calc.electricity = { ...defaultCalc('electricity'), budget: '180' };
      s.sensors = [
        { id: 'sim-water-b', kind: 'water_meter', scope: 'whole_home', source: 'simulated', status: 'online', name: 'Smart water meter' },
        { id: 'sim-leak-b', kind: 'leak', scope: 'whole_home', source: 'simulated', status: 'online', name: 'Under kitchen sink' },
        { id: 'sim-electric-b', kind: 'electric_meter', scope: 'whole_home', source: 'simulated', status: 'online', name: 'Smart electric meter' },
        { id: 'sim-temperature-b', kind: 'temperature', scope: 'whole_home', source: 'simulated', status: 'online', name: 'Hallway' },
        { id: 'sim-humidity-b', kind: 'humidity', scope: 'whole_home', source: 'simulated', status: 'online', name: 'Basement' },
        { id: 'sim-smoke-b', kind: 'smoke_co', scope: 'whole_home', source: 'simulated', status: 'online', name: 'Hallway alarm' },
      ];
      s.issues = [issue({ category: 'appliance', title: 'Replace dryer vent hose', status: 'resolved', locationScope: 'whole_home', location: 'Laundry room', responsibleParty: 'self', severity: 'low', createdAt: new Date(Date.now() - 40 * 86400000).toISOString() })];
      s.scenario = 'B';
      return s;
    },
    steps: [
      { text: 'Open My home. Six simulated whole-home sensors are online.', view: 'home' },
      { text: 'Press “Simulate unusual water use”.', view: 'home', hint: 'In the Simulate an event panel' },
      { text: 'An alert appears with what to check first.', view: 'home' },
      { text: 'Press “Create maintenance record” on the alert. The form is prefilled.', view: 'home' },
      { text: 'Save it, then see repair resources recommended for the open issue.', view: 'resources' },
    ],
  },
  {
    id: 'C', letter: 'C', title: 'Student in campus housing', who: 'Dorm · utilities included in housing fees',
    build: (prev) => {
      const s = fresh(prev);
      s.profile = { ...defaultProfile('dorm'), nickname: 'Sam', area: 'Campus' };
      s.calc.electricity = { ...defaultCalc('electricity'), arrangement: 'included' };
      s.calc.water = { ...defaultCalc('water'), arrangement: 'included' };
      s.scenario = 'C';
      return s;
    },
    steps: [
      { text: 'The dashboard shows conditions, safety, maintenance and campus support. No made-up utility bill.', view: 'dashboard' },
      { text: 'Open Maintenance and start a new housing request.', view: 'maintenance' },
      { text: 'Use the student checklist and save the request.', view: 'maintenance' },
      { text: 'Open Resources. Campus and community listings are recommended.', view: 'resources' },
    ],
  },
  {
    id: 'D', letter: 'D', title: 'Shared housing with accessibility needs', who: 'Shared housing · pays an agreed 40% share',
    build: (prev) => {
      const s = fresh(prev);
      s.profile = { ...defaultProfile('shared'), utilities: { electricity: 'shared', water: 'shared', gas: 'shared', internet: 'shared' }, nickname: 'Alex', area: 'Midtown' };
      s.calc.electricity = { ...defaultCalc('electricity'), arrangement: 'shared', shareType: 'percent', sharePercent: '40', budget: '60' };
      s.calc.water = { ...defaultCalc('water'), arrangement: 'shared', shareType: 'amount', shareAmount: '22', budget: '25' };
      s.sharedExpenses = [{ id: uid('se'), label: 'Internet (my agreed share)', myShare: 20, dueDay: '15' }];
      s.sensors = [{ id: 'sim-temperature-d', kind: 'temperature', scope: 'personal', source: 'simulated', status: 'online', name: 'My room' }];
      s.scenario = 'D';
      return s;
    },
    steps: [
      { text: 'Open Utilities. Electricity is a 40% share; water is a fixed agreed amount. Housemates’ amounts are never asked for.', view: 'utilities' },
      { text: 'Open Settings and increase text size or turn on high contrast.', view: 'settings' },
      { text: 'In Maintenance, record an accessibility barrier (presets are offered).', view: 'maintenance' },
      { text: 'Open Resources to see modification and disability support programs.', view: 'resources' },
    ],
  },
  {
    id: 'E', letter: 'E', title: 'Renter with an unresolved repair', who: 'House · renting · heating problem reported',
    build: (prev) => {
      const s = fresh(prev);
      s.profile = { ...defaultProfile('house_renter'), nickname: 'Morgan', area: 'Southside' };
      const created = new Date(Date.now() - 16 * 86400000).toISOString();
      const reported = addDays(-15);
      s.issues = [
        issue({
          category: 'heating_cooling', title: 'Heat not working in back bedrooms', severity: 'high', location: 'Back bedrooms', locationScope: 'unit',
          description: 'Radiators in both back bedrooms stay cold. Front of house is fine.', firstObserved: addDays(-17), reported: 'yes', reportedDate: reported,
          responsibleParty: 'landlord', status: 'follow_up', followUpDate: addDays(-2), createdAt: created,
          history: [
            { id: uid('h'), at: created, type: 'created', text: 'Issue recorded' },
            { id: uid('h'), at: new Date(Date.now() - 15 * 86400000).toISOString(), type: 'communication', text: 'Texted landlord with photos of the thermostat and cold radiators.', communication: { method: 'Text message', contact: 'Landlord', date: reported } },
            { id: uid('h'), at: new Date(Date.now() - 9 * 86400000).toISOString(), type: 'status', status: 'acknowledged', text: 'Landlord replied that a technician would come “next week.”' },
            { id: uid('h'), at: new Date(Date.now() - 2 * 86400000).toISOString(), type: 'status', status: 'follow_up', text: 'No technician visit yet. Follow-up date passed.' },
          ],
        }),
      ];
      s.reminders = [...defaultReminders(), { id: uid('rem'), type: 'maintenance', title: 'Follow up with landlord about heat', date: todayISO(), repeat: 'none', enabled: true }];
      s.scenario = 'E';
      return s;
    },
    steps: [
      { text: 'Open Maintenance. A heating issue is overdue for follow-up.', view: 'maintenance' },
      { text: 'Open the issue and log a new landlord contact with today’s date.', view: 'maintenance' },
      { text: 'Set a new follow-up date or change the status.', view: 'maintenance' },
      { text: 'Open Resources for tenant-rights and repair help.', view: 'resources' },
    ],
  },
];
