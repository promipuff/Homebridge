// End-to-end walkthrough of the Hacklanta demo requirements in a real browser.
// Usage: node tests/e2e.mjs <path-to-dist/index.html> <screenshot-dir>
import { chromium } from 'playwright';
import path from 'node:path';

const file = 'file://' + path.resolve(process.argv[2] ?? 'dist/index.html');
const shots = process.argv[3] ?? 'shots';
const browser = await chromium.launch();
const errors = [];
const results = [];
const check = (name, ok, extra = '') => { results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  · ' + extra : ''}`); };

async function newPage(viewport = { width: 1280, height: 900 }, scheme = 'light') {
  const ctx = await browser.newContext({ viewport, colorScheme: scheme });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(file);
  return page;
}
const nav = (page, name) => page.getByRole('navigation', { name: 'Main' }).first().getByRole('button', { name, exact: true }).click();

// 1. Onboarding: apartment → rent → electricity direct
{
  const page = await newPage();
  check('Onboarding question shown', await page.getByRole('heading', { name: 'Where do you call home?' }).isVisible());
  await page.screenshot({ path: `${shots}/01-onboarding.png`, fullPage: true });
  await page.getByText('Apartment', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  check('Tenure question for apartment', await page.getByText('Do you own or rent your living space?').isVisible());
  await page.getByText('I rent', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('What should we call you?').fill('Riley');
  await page.getByRole('button', { name: 'Go to my dashboard' }).click();
  check('Dashboard personalized', await page.getByText('Apartment · Renter').first().isVisible());
  check('Building card for apartment', await page.getByRole('heading', { name: 'Building' }).isVisible());
  await page.screenshot({ path: `${shots}/02-dashboard-apartment.png`, fullPage: true });

  // Utility calculator: change budget, status updates
  await nav(page, 'Utilities');
  const budget = page.getByLabel('My budget for this bill');
  await budget.fill('100');
  const s1 = await page.locator('[aria-live="polite"]').filter({ hasText: /budget|track/i }).first().innerText();
  await budget.fill('400');
  const s2 = await page.locator('[aria-live="polite"]').filter({ hasText: /budget|track/i }).first().innerText();
  check('Budget status updates', /exceed/i.test(s1) && /On track/i.test(s2), `${s1} → ${s2}`);
  await page.getByLabel('Days elapsed so far').fill('0');
  check('Validation error shown for 0 days', await page.getByText(/Fix 1 field/).isVisible());
  await page.getByLabel('Days elapsed so far').fill('14');
  await page.screenshot({ path: `${shots}/03-utilities.png`, fullPage: true });

  // Settings: change living situation keeps issues
  await nav(page, 'Maintenance');
  await page.getByRole('button', { name: /Document an issue|Report an issue|Add an issue/ }).first().click();
  await page.getByLabel('Short title').fill('Bathroom fan broken');
  await page.getByRole('button', { name: 'Save issue' }).click();
  check('Maintenance issue created', await page.getByRole('heading', { name: 'Bathroom fan broken' }).isVisible());
  await page.getByLabel('New status').selectOption('acknowledged');
  await page.getByRole('button', { name: 'Update status' }).click();
  check('Status updated in history', await page.getByText('Status: Acknowledged').isVisible());
  await page.getByLabel('What was said').fill('Called the office; they will send someone Monday.');
  await page.getByRole('button', { name: 'Log contact' }).click();
  check('Contact logged', await page.getByText('Called the office; they will send someone Monday.').isVisible());

  await nav(page, 'Settings');
  await page.getByRole('button', { name: 'Change living situation' }).click();
  await page.getByText('Dorm / Student housing', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  check('Dorm asks about fees', await page.getByText('Are utilities included in your housing fees?').isVisible());
  check('Dorm skips sensor question', !(await page.getByText('Can you add smart-home sensors?').isVisible()));
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  check('Dorm dashboard shows fees card, not bill', await page.getByRole('heading', { name: 'Housing fees & utilities' }).isVisible() && !(await page.getByRole('heading', { name: 'Utility budget' }).isVisible()));
  await nav(page, 'Maintenance');
  check('Issue kept after profile change', await page.getByText('Bathroom fan broken').isVisible());

  // Accessibility settings
  await nav(page, 'Settings');
  await page.getByText('Largest', { exact: true }).click();
  await page.getByRole('switch', { name: 'High contrast' }).click();
  const fs = await page.evaluate(() => document.documentElement.style.fontSize + ' ' + document.documentElement.className);
  check('Text size and high contrast applied', fs.includes('150%') && fs.includes('hc'), fs);
  await page.screenshot({ path: `${shots}/04-settings-hc.png`, fullPage: true });

  // Reset
  await page.getByRole('button', { name: 'Reset demo data' }).click();
  await page.getByRole('button', { name: 'Yes, clear everything' }).click();
  check('Reset returns to onboarding', await page.getByRole('heading', { name: 'Where do you call home?' }).isVisible());
  await page.context().close();
}

// 2. Scenario B: homeowner leak → alert → maintenance → resources
{
  const page = await newPage();
  await page.getByRole('button', { name: /Homeowner with a possible water leak/ }).click();
  await nav(page, 'My home');
  await page.getByRole('button', { name: 'Simulate unusual water use' }).click();
  check('IoT alert raised', await page.getByRole('heading', { name: 'Water use is about 3× higher than usual' }).first().isVisible());
  await page.screenshot({ path: `${shots}/05-home-iot.png`, fullPage: true });
  await page.getByRole('button', { name: 'Create maintenance record' }).first().click();
  check('Form prefilled from alert', (await page.getByLabel('Short title').inputValue()).includes('Possible leak'));
  await page.getByRole('button', { name: 'Save issue' }).click();
  check('Repair help suggested', await page.getByRole('heading', { name: 'Help with this' }).isVisible());
  await nav(page, 'Resources');
  check('Recommendations with reasons', await page.getByText('Why you’re seeing this:').first().isVisible());
  await page.getByLabel('Search resources').fill('legal');
  await page.getByRole('button', { name: /^Save Housing Legal Aid Clinic/ }).click();
  await page.getByLabel('Search resources').fill('');
  await page.getByRole('button', { name: /^Saved \(1\)/ }).click();
  check('Search and save resource', await page.getByRole('heading', { name: 'Housing Legal Aid Clinic' }).isVisible());
  await page.screenshot({ path: `${shots}/06-resources.png`, fullPage: true });
  await page.context().close();
}

// 3. Scenarios A, C, D, E load and render; mobile + dark
for (const [label, name] of [['A', /Apartment renter with a high electric bill/], ['C', /Student in campus housing/], ['D', /Shared housing with accessibility needs/], ['E', /Renter with an unresolved repair/]]) {
  const page = await newPage({ width: 390, height: 844 }, label === 'C' || label === 'E' ? 'dark' : 'light');
  await page.getByRole('button', { name }).click();
  check(`Scenario ${label} loads`, await page.getByText(`Demo scenario ${label}`).isVisible());
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(`Scenario ${label} no horizontal scroll at 390px`, !overflow);
  await page.screenshot({ path: `${shots}/10-scenario-${label}-mobile.png`, fullPage: true });
  if (label === 'A') {
    await nav(page, 'Utilities');
    check('A: projected to exceed', await page.getByText('Projected to exceed budget').first().isVisible());
    const overflowU = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check('A: utilities no horizontal scroll', !overflowU);
    await page.screenshot({ path: `${shots}/11-A-utilities-mobile.png`, fullPage: true });
  }
  if (label === 'D') {
    await nav(page, 'Maintenance');
    await page.getByRole('button', { name: /Record an issue/ }).first().click();
    await page.getByLabel('Issue category').selectOption('accessibility');
    await page.getByRole('button', { name: 'Entrance has steps and no ramp' }).click();
    await page.getByRole('button', { name: 'Save issue' }).click();
    await nav(page, 'Resources');
    check('D: modification resources suggested', await page.getByRole('heading', { name: 'Ramps & Rails Modification Program' }).first().isVisible());
  }
  if (label === 'E') {
    await nav(page, 'Maintenance');
    check('E: overdue follow-up visible', await page.getByText(/Follow-up due/).first().isVisible());
    await page.screenshot({ path: `${shots}/12-E-maintenance-dark.png`, fullPage: true });
  }
  await page.context().close();
}

// 4. Desktop dark dashboard for visual check
{
  const page = await newPage({ width: 1280, height: 900 }, 'dark');
  await page.getByRole('button', { name: /Homeowner with a possible water leak/ }).click();
  await page.screenshot({ path: `${shots}/20-dashboard-dark.png`, fullPage: true });
  await page.context().close();
}

await browser.close();
console.log(results.join('\n'));
console.log(`\n${results.filter((r) => r.startsWith('PASS')).length}/${results.length} passed`);
console.log(errors.length ? `Console errors:\n${[...new Set(errors)].join('\n')}` : 'No console errors');
