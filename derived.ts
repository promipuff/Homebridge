import type { AppState, MeteredUtility, Resource } from '../types';
import { calculate, type CalcResult } from './calc';
import { billedUtilities, resourceNeeds, todayISO } from './personalize';
import { RESOURCES } from '../data/resources';

export interface UtilitySnapshot {
  utility: MeteredUtility;
  result: CalcResult | null;
  billed: boolean;
}

export function utilitySnapshots(state: AppState): UtilitySnapshot[] {
  const billed = billedUtilities(state.profile);
  return (['electricity', 'water'] as MeteredUtility[]).map((u) => ({
    utility: u,
    billed: billed.includes(u),
    result: calculate(state.calc[u]).result,
  }));
}

/** Worst budget status among utilities the resident actually pays. */
export function worstStatus(state: AppState): 'over' | 'approaching' | 'on_track' | null {
  const statuses = utilitySnapshots(state).filter((s) => s.billed && s.result).map((s) => s.result!.status);
  if (statuses.includes('over')) return 'over';
  if (statuses.includes('approaching')) return 'approaching';
  if (statuses.includes('on_track')) return 'on_track';
  return null;
}

export interface Recommended {
  resource: Resource;
  reasons: string[];
}

export function recommendations(state: AppState): Recommended[] {
  const needs = resourceNeeds(state, worstStatus(state));
  const out = new Map<string, Recommended>();
  for (const n of needs) {
    for (const r of RESOURCES) {
      if (r.tags.includes(n.tag)) {
        const cur = out.get(r.id) ?? { resource: r, reasons: [] };
        if (!cur.reasons.includes(n.reason)) cur.reasons.push(n.reason);
        out.set(r.id, cur);
      }
    }
  }
  // Rank by number of matching needs, with national programs after local listings of equal rank.
  return [...out.values()].sort((a, b) => b.reasons.length - a.reasons.length || (a.resource.verification === 'sample' ? -1 : 1));
}

export function openIssues(state: AppState) {
  return state.issues.filter((i) => i.status !== 'resolved');
}

export function overdueFollowUps(state: AppState) {
  const today = todayISO();
  return openIssues(state).filter((i) => i.followUpDate && i.followUpDate <= today);
}

export function dueReminders(state: AppState, withinDays = 14) {
  const today = todayISO();
  const limit = todayISO(new Date(Date.now() + withinDays * 86400000));
  return state.reminders.filter((r) => r.enabled && r.date <= limit).sort((a, b) => a.date.localeCompare(b.date)).map((r) => ({ ...r, overdue: r.date < today }));
}
