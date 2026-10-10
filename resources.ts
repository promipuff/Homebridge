// Resource directory for the prototype.
// "sample" entries are invented placeholders: names, phone numbers (555-01xx is reserved for fiction)
// and example.org links are NOT real organizations. "national_program" entries are real public
// programs or numbers, listed only as starting points; local availability is not verified here.
import type { Resource, ResourceCategory } from '../types';

export const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  food: 'Food banks & pantries',
  shelter: 'Emergency shelter',
  affordable_housing: 'Affordable housing',
  rental_assistance: 'Rental assistance',
  utility_assistance: 'Utility assistance',
  repair_weatherization: 'Home repair & weatherization',
  cooling_warming: 'Cooling & warming centers',
  transportation: 'Accessible transportation',
  disability: 'Disability support',
  internet: 'Internet access',
  legal: 'Tenant advocacy & legal aid',
  community: 'Community support',
  campus: 'Campus & student support',
  emergency: 'Emergency',
};

const S = (r: Omit<Resource, 'verification' | 'languages'> & { languages?: string[] }): Resource => ({
  languages: ['English'],
  ...r,
  verification: 'sample',
});

export const RESOURCES: Resource[] = [
  // Real, national starting points
  {
    id: 'n-911', name: 'Emergency services (911)', category: 'emergency', verification: 'national_program',
    summary: 'For fire, smoke, carbon monoxide alarms sounding, gas smell, or anyone in danger. Leave the building first, then call.',
    eligibility: 'Anyone.', hours: '24 hours', phone: '911', website: '', area: 'Nationwide (US)',
    accessibility: ['Text-to-911 in many areas', 'TTY'], languages: ['Interpreters available'], tags: ['emergency', 'essentials'],
  },
  {
    id: 'n-211', name: '211 helpline', category: 'community', verification: 'national_program',
    summary: 'Free, confidential referrals to local help with housing, utilities, food and more.',
    eligibility: 'Anyone.', hours: 'Varies by region; many lines are 24 hours', phone: '211', website: 'https://www.211.org', area: 'Most of the US',
    accessibility: ['Phone, text and web options in many regions'], languages: ['Many languages via interpreters'],
    tags: ['essentials', 'utility_assistance', 'housing_search', 'tenant_rights', 'home_repair', 'disability_support', 'cooling_warming', 'campus'],
  },
  {
    id: 'n-liheap', name: 'LIHEAP (Low Income Home Energy Assistance Program)', category: 'utility_assistance', verification: 'national_program',
    summary: 'Federal program that helps eligible households with heating and cooling bills. Applications go through local agencies.',
    eligibility: 'Set by each state. The program decides eligibility, not HomeBridge.', hours: 'Seasonal in many states',
    phone: '', website: 'https://www.acf.hhs.gov/ocs/programs/liheap', area: 'All US states',
    accessibility: [], languages: [], tags: ['utility_assistance'],
  },
  {
    id: 'n-wap', name: 'Weatherization Assistance Program', category: 'repair_weatherization', verification: 'national_program',
    summary: 'U.S. Department of Energy program that funds energy-saving home improvements through local providers.',
    eligibility: 'Set by each state. Renters may need landlord permission.', hours: 'Varies by provider',
    phone: '', website: 'https://www.energy.gov/scep/wap/weatherization-assistance-program', area: 'All US states',
    accessibility: [], languages: [], tags: ['weatherization', 'home_repair', 'conservation'],
  },
  {
    id: 'n-lifeline', name: 'Lifeline (phone & internet discount)', category: 'internet', verification: 'national_program',
    summary: 'FCC program that lowers the monthly cost of phone or internet service for eligible households.',
    eligibility: 'Set by the FCC. The program decides eligibility.', hours: 'Online', phone: '', website: 'https://www.fcc.gov/lifeline-consumers',
    area: 'Nationwide (US)', accessibility: [], languages: [], tags: ['internet', 'essentials'],
  },

  // Sample listings (fictional)
  S({ id: 's-food-1', name: 'Riverside Neighborhood Pantry', category: 'food', summary: 'Weekly groceries and fresh produce. No appointment needed.', eligibility: 'Open to all residents of the service area.', hours: 'Tue & Thu 10am–2pm, Sat 9am–12pm', phone: '(404) 555-0101', website: 'https://example.org/riverside-pantry', area: 'Westside', accessibility: ['Step-free entrance', 'Seating while waiting'], languages: ['English', 'Spanish'], tags: ['essentials', 'food'] }),
  S({ id: 's-food-2', name: 'Community Meal Hall', category: 'food', summary: 'Hot dinner served every evening.', eligibility: 'Everyone welcome.', hours: 'Daily 5pm–7pm', phone: '(404) 555-0102', website: 'https://example.org/meal-hall', area: 'Downtown', accessibility: ['Elevator', 'Accessible restroom'], tags: ['essentials', 'food'] }),
  S({ id: 's-shelter-1', name: 'Harbor House Emergency Shelter', category: 'shelter', summary: 'Overnight beds, showers and storage lockers.', eligibility: 'Adults 18+. Call ahead for bed availability.', hours: 'Intake 4pm–9pm', phone: '(404) 555-0111', website: 'https://example.org/harbor-house', area: 'Downtown', accessibility: ['Ground-floor beds', 'Service animals welcome'], languages: ['English', 'Spanish'], tags: ['essentials', 'shelter'] }),
  S({ id: 's-shelter-2', name: 'Family Bridge Shelter', category: 'shelter', summary: 'Private rooms for families with children.', eligibility: 'Families with minor children.', hours: 'Intake by phone 24 hours', phone: '(404) 555-0112', website: 'https://example.org/family-bridge', area: 'Eastside', accessibility: ['Accessible room available on request'], tags: ['essentials', 'shelter', 'housing_search'] }),
  S({ id: 's-house-1', name: 'Open Door Housing Navigation', category: 'affordable_housing', summary: 'Help searching for affordable units and preparing applications.', eligibility: 'Open to anyone looking for housing.', hours: 'Mon–Fri 9am–5pm', phone: '(404) 555-0121', website: 'https://example.org/open-door', area: 'Citywide', accessibility: ['Phone and video appointments'], languages: ['English', 'Spanish', 'Vietnamese'], tags: ['housing_search', 'essentials'] }),
  S({ id: 's-rent-1', name: 'Neighbor-to-Neighbor Rent Relief Fund', category: 'rental_assistance', summary: 'One-time help with past-due rent, paid directly to the landlord.', eligibility: 'Renters with a past-due notice. The fund decides eligibility.', hours: 'Applications reviewed weekly', phone: '(404) 555-0131', website: 'https://example.org/rent-relief', area: 'Metro area', accessibility: ['Paper or online application'], tags: ['rental_assistance', 'tenant_rights'] }),
  S({ id: 's-util-1', name: 'Warm Homes Utility Help Desk', category: 'utility_assistance', summary: 'Helps households apply for bill assistance and set up payment plans with utilities.', eligibility: 'Residential customers. The program decides eligibility.', hours: 'Mon–Thu 8:30am–4:30pm', phone: '(404) 555-0141', website: 'https://example.org/warm-homes', area: 'Metro area', accessibility: ['Home visits for people who can’t travel'], languages: ['English', 'Spanish'], tags: ['utility_assistance'] }),
  S({ id: 's-util-2', name: 'Power Down Energy Coaching', category: 'utility_assistance', summary: 'Free 30-minute call to go over your bill and find ways to use less energy.', eligibility: 'Anyone.', hours: 'By appointment', phone: '(404) 555-0142', website: 'https://example.org/power-down', area: 'Citywide', accessibility: ['Phone appointments'], tags: ['utility_assistance', 'conservation'] }),
  S({ id: 's-repair-1', name: 'Safe at Home Repair Program', category: 'repair_weatherization', summary: 'Critical repairs for homeowners: roofs, plumbing, heating and safety fixes.', eligibility: 'Owner-occupied homes. The program decides eligibility.', hours: 'Mon–Fri 9am–4pm', phone: '(404) 555-0151', website: 'https://example.org/safe-at-home', area: 'Metro area', accessibility: ['Accessibility modifications included'], tags: ['home_repair', 'weatherization', 'home_modification'] }),
  S({ id: 's-repair-2', name: 'Fix-It Clinic (volunteer)', category: 'repair_weatherization', summary: 'Volunteers show you how to handle small repairs like dripping faucets and running toilets.', eligibility: 'Anyone. Renters should check their lease before doing repairs.', hours: 'First Saturday, 10am–1pm', phone: '(404) 555-0152', website: 'https://example.org/fix-it', area: 'Library branch, Midtown', accessibility: ['Step-free entrance'], tags: ['repair_guidance', 'home_repair'] }),
  S({ id: 's-cool-1', name: 'Library Cooling & Warming Center', category: 'cooling_warming', summary: 'Open as a cooling or warming center during heat and cold advisories.', eligibility: 'Anyone.', hours: 'During advisories, 10am–8pm', phone: '(404) 555-0161', website: 'https://example.org/library-center', area: 'Several branches', accessibility: ['Step-free', 'Seating', 'Water available'], tags: ['cooling_warming', 'essentials'] }),
  S({ id: 's-trans-1', name: 'Ride Ready Paratransit Info Line', category: 'transportation', summary: 'Explains how to apply for door-to-door accessible rides.', eligibility: 'People whose disability limits use of fixed-route transit. The transit agency decides eligibility.', hours: 'Mon–Fri 8am–5pm', phone: '(404) 555-0171', website: 'https://example.org/ride-ready', area: 'Transit service area', accessibility: ['TTY', 'Large-print forms'], tags: ['disability_support', 'transportation', 'essentials'] }),
  S({ id: 's-dis-1', name: 'Independent Living Resource Center', category: 'disability', summary: 'Peer support, benefits counseling and help requesting home modifications.', eligibility: 'People with disabilities and their families.', hours: 'Mon–Fri 9am–5pm', phone: '(404) 555-0181', website: 'https://example.org/ilrc', area: 'Metro area', accessibility: ['ASL by appointment', 'Accessible building'], languages: ['English', 'ASL'], tags: ['disability_support', 'home_modification'] }),
  S({ id: 's-dis-2', name: 'Ramps & Rails Modification Program', category: 'disability', summary: 'Grab bars, ramps and doorway changes. Renters get help writing a modification request to their landlord.', eligibility: 'Homeowners and renters with landlord approval. The program decides eligibility.', hours: 'Mon–Fri 9am–3pm', phone: '(404) 555-0182', website: 'https://example.org/ramps-rails', area: 'Metro area', accessibility: ['Home assessments'], tags: ['home_modification', 'disability_support'] }),
  S({ id: 's-net-1', name: 'Digital Connect Hub', category: 'internet', summary: 'Help signing up for low-cost internet, plus free computer lab time.', eligibility: 'Anyone.', hours: 'Mon–Sat 10am–6pm', phone: '(404) 555-0191', website: 'https://example.org/digital-connect', area: 'Community center, Southside', accessibility: ['Screen readers on lab computers'], languages: ['English', 'Spanish'], tags: ['internet', 'essentials', 'campus'] }),
  S({ id: 's-legal-1', name: 'Tenant Rights Hotline', category: 'legal', summary: 'Explains repair requests, notices and what to do when a landlord doesn’t respond.', eligibility: 'Renters. General information, not legal advice.', hours: 'Mon–Fri 10am–4pm', phone: '(404) 555-0198', website: 'https://example.org/tenant-hotline', area: 'Statewide', accessibility: ['Phone and email'], languages: ['English', 'Spanish', 'Korean'], tags: ['tenant_rights', 'repair_guidance'] }),
  S({ id: 's-legal-2', name: 'Housing Legal Aid Clinic', category: 'legal', summary: 'Free consultations with housing attorneys for repair disputes and eviction notices.', eligibility: 'Income limits may apply. The clinic decides eligibility.', hours: 'Wed 1pm–6pm walk-in', phone: '(404) 555-0199', website: 'https://example.org/legal-aid-clinic', area: 'Downtown', accessibility: ['Elevator', 'Interpreters on request'], tags: ['tenant_rights'] }),
  S({ id: 's-comm-1', name: 'Block by Block Neighbors Network', category: 'community', summary: 'Volunteer check-ins, errand help and neighborhood events.', eligibility: 'Anyone.', hours: 'Varies', phone: '(404) 555-0107', website: 'https://example.org/block-by-block', area: 'Several neighborhoods', accessibility: ['Phone check-ins'], tags: ['community', 'essentials'] }),
  S({ id: 's-campus-1', name: 'Campus Housing Office (sample)', category: 'campus', summary: 'Where to submit work orders, ask about room temperature, and request housing accommodations.', eligibility: 'Students in campus housing.', hours: 'Mon–Fri 8am–5pm; after-hours maintenance line', phone: '(404) 555-0114', website: 'https://example.org/campus-housing', area: 'Campus', accessibility: ['Accommodation requests through disability services'], tags: ['campus'] }),
  S({ id: 's-campus-2', name: 'Student Basic Needs Center (sample)', category: 'campus', summary: 'Food pantry, emergency grants and help with housing problems for students.', eligibility: 'Enrolled students.', hours: 'Mon–Fri 10am–6pm', phone: '(404) 555-0115', website: 'https://example.org/basic-needs', area: 'Student center', accessibility: ['Step-free', 'Private intake room'], languages: ['English', 'Spanish'], tags: ['campus', 'essentials', 'food'] }),
  S({ id: 's-campus-3', name: 'Student Accessibility Services (sample)', category: 'campus', summary: 'Housing accommodations such as accessible rooms, visual alarms and adjusted layouts.', eligibility: 'Students who request accommodations.', hours: 'Mon–Fri 9am–5pm', phone: '(404) 555-0116', website: 'https://example.org/accessibility-services', area: 'Campus', accessibility: ['ASL by appointment'], tags: ['campus', 'disability_support', 'home_modification'] }),
];

export const CONSERVATION_TIPS: Record<'electricity' | 'water', { tip: string; detail: string }[]> = {
  electricity: [
    { tip: 'Raise the cooling setpoint a few degrees', detail: 'Cooling is often the largest summer use. Fans use far less power than air conditioning.' },
    { tip: 'Run full loads in cold water', detail: 'Most of a washer’s energy goes to heating water.' },
    { tip: 'Unplug or switch off idle electronics', detail: 'TVs, game consoles and chargers draw power while off.' },
    { tip: 'Ask about budget billing or payment plans', detail: 'Many utilities can spread costs evenly across months.' },
  ],
  water: [
    { tip: 'Check for a running toilet', detail: 'A few drops of food coloring in the tank that show up in the bowl mean a leak.' },
    { tip: 'Fix dripping faucets', detail: 'Renters: report drips to your landlord or manager rather than repairing them yourself.' },
    { tip: 'Shorten showers by a few minutes', detail: 'Showers are one of the largest indoor water uses.' },
    { tip: 'Run the dishwasher only when full', detail: 'A full dishwasher usually uses less water than washing by hand.' },
  ],
};
