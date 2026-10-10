import { test } from 'node:test';
import assert from 'node:assert/strict';
import { billedUtilities, dashboardCards, defaultProfile, maintenanceWorkflow, questionPlan, resourceNeeds, sensorOptions } from '../src/lib/personalize';
import { initialState } from '../src/lib/defaults';
import { SCENARIOS } from '../src/lib/scenarios';
import { recommendations, worstStatus } from '../src/lib/derived';
import type { AppState, Situation } from '../src/types';

const stateFor = (s: Situation, patch: Partial<AppState> = {}): AppState => ({ ...initialState(), onboarded: true, profile: defaultProfile(s), ...patch });

test('each living situation gets a different dashboard', () => {
  const sets = (['house_owner', 'house_renter', 'apartment', 'shared', 'dorm', 'temporary'] as Situation[]).map((s) => dashboardCards(stateFor(s)).join(','));
  assert.equal(new Set(sets).size, sets.length);
});

test('utilities included in fees never produce a bill card', () => {
  const dorm = stateFor('dorm');
  assert.deepEqual(billedUtilities(dorm.profile), []);
  const cards = dashboardCards(dorm);
  assert.ok(!cards.includes('utility_budget'));
  assert.ok(cards.includes('housing_fees'));
  assert.ok(cards.includes('campus'));
});

test('temporary housing: no sensor question, no install options, essentials first', () => {
  assert.equal(questionPlan('temporary').askSensors, false);
  const s = stateFor('temporary');
  assert.equal(dashboardCards(s)[0], 'essentials');
  assert.ok(sensorOptions(s.profile).options.every((o) => o.install === 'provided' || o.install === 'portable'));
  assert.ok(maintenanceWorkflow(s.profile).optional);
});

test('renters get a communication log; homeowners get project mode', () => {
  assert.ok(maintenanceWorkflow(defaultProfile('house_renter')).communicationLog);
  assert.ok(maintenanceWorkflow(defaultProfile('house_owner')).projectMode);
  assert.ok(maintenanceWorkflow(defaultProfile('dorm')).studentChecklist);
  assert.ok(maintenanceWorkflow(defaultProfile('shared')).scopes.includes('common_area'));
  assert.ok(maintenanceWorkflow(defaultProfile('condo')).scopes.includes('shared_building'));
});

test('scenario A: apartment renter is projected over budget and gets utility assistance', () => {
  const s = SCENARIOS[0].build(initialState());
  assert.equal(worstStatus(s), 'over');
  const recs = recommendations(s);
  assert.ok(recs.some((r) => r.resource.tags.includes('utility_assistance')));
  assert.ok(!recs.some((r) => r.resource.tags.includes('weatherization') && r.resource.id === 'n-wap'), 'renter should not be pushed weatherization');
});

test('scenario C: student sees campus resources and no bill', () => {
  const s = SCENARIOS[2].build(initialState());
  assert.equal(worstStatus(s), null);
  assert.ok(recommendations(s).some((r) => r.resource.category === 'campus'));
});

test('scenario E: renter with overdue heating issue gets tenant-rights help', () => {
  const s = SCENARIOS[4].build(initialState());
  const tags = resourceNeeds(s, null).map((n) => n.tag);
  assert.ok(tags.includes('tenant_rights'));
  assert.ok(tags.includes('cooling_warming'));
});

test('recommendations never use housing type alone to suggest financial help', () => {
  for (const sit of ['house_owner', 'house_renter', 'apartment', 'shared', 'condo'] as Situation[]) {
    const s = stateFor(sit, { calc: { ...initialState().calc, electricity: { ...initialState().calc.electricity, budget: '' }, water: { ...initialState().calc.water, budget: '' } } });
    const tags = resourceNeeds(s, worstStatus(s)).map((n) => n.tag);
    assert.ok(!tags.includes('utility_assistance') && !tags.includes('rental_assistance'), `${sit} got financial help with no stated need`);
  }
});
