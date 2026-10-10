import { useState, type ReactNode } from 'react';
import { useStore } from '../store';
import { OFFICIAL_SAFETY_LINKS, SAFETY_CATEGORY_LABEL, SAFETY_INCIDENTS, SAFETY_WEEK, type SafetyCategory } from '../data/safety';
import { Button, Card, CardTitle, Pill, SourceBadge, cx } from './ui';
import { CloudRain, ExternalLink, EyeOff, Flame, MapPin, Car, ShieldAlert, Siren, Tag, ZapOff } from '../icons';

const ICON: Record<SafetyCategory, ReactNode> = {
  property: <Tag size={18} />,
  traffic: <Car size={18} />,
  fire_ems: <Flame size={18} />,
  utility: <ZapOff size={18} />,
  police: <Siren size={18} />,
  weather: <CloudRain size={18} />,
};

const ago = (h: number) => (h < 1 ? 'Just now' : h < 24 ? `${h} hr ago` : `${Math.round(h / 24)} day${Math.round(h / 24) > 1 ? 's' : ''} ago`);

export function SafetyPanel() {
  const { state, update, go, toast } = useStore();
  const [filter, setFilter] = useState<SafetyCategory | 'all'>('all');
  const [showAll, setShowAll] = useState(false);
  const area = state.profile.area;
  const items = SAFETY_INCIDENTS.filter((i) => filter === 'all' || i.category === filter);
  const shown = showAll ? items : items.slice(0, 4);
  const active = SAFETY_INCIDENTS.filter((i) => i.status !== 'Cleared').length;

  const hide = () => {
    update((s) => ({ ...s, settings: { ...s.settings, showSafety: false } }));
    toast('Safety panel hidden. Turn it back on in Settings.');
  };

  return (
    <Card as="section" aria-labelledby="safety-h">
      <CardTitle
        id="safety-h"
        icon={<ShieldAlert size={20} />}
        action={<SourceBadge source="simulated" />}
      >
        Neighborhood safety
      </CardTitle>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1"><MapPin size={14} /> {area ? `Within about 1 mile of ${area}` : 'No area set'}</span>
        {!area && <button type="button" className="font-semibold text-forest underline underline-offset-2" onClick={() => go('settings', 'privacy')}>Set your area</button>}
        <span>· {active} active now</span>
      </div>

      <ul className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Incidents in the last 7 days">
        {SAFETY_WEEK.map((w) => {
          const diff = w.thisWeek - w.lastWeek;
          return (
            <li key={w.category} className="rounded-xl bg-surface-2 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted"><span className="text-forest">{ICON[w.category]}</span>{SAFETY_CATEGORY_LABEL[w.category]}</p>
              <p className="font-display text-2xl font-bold tabular-nums text-ink">{w.thisWeek}</p>
              <p className="text-xs text-muted">{diff === 0 ? 'Same as last week' : `${Math.abs(diff)} ${diff > 0 ? 'more' : 'fewer'} than last week`}</p>
            </li>
          );
        })}
      </ul>

      <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter incidents">
        {(['all', 'property', 'traffic', 'fire_ems', 'utility', 'police', 'weather'] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={filter === c}
            onClick={() => setFilter(c)}
            className={cx('min-h-[36px] shrink-0 whitespace-nowrap rounded-full border px-3 text-sm font-semibold', filter === c ? 'border-forest bg-forest text-forest-ink' : 'border-line bg-surface text-ink hover:bg-surface-2')}
          >
            {c === 'all' ? 'All' : SAFETY_CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <ul className="grid gap-2" aria-live="polite">
        {shown.length === 0 && <li className="text-sm text-muted">No recent incidents in this category.</li>}
        {shown.map((i) => (
          <li key={i.id} className="flex items-start gap-3 rounded-xl border border-line p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sage-soft text-forest">{ICON[i.category]}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold text-ink">{i.title}</p>
                <Pill tone={i.status === 'Cleared' ? 'muted' : i.status === 'Active' ? 'amber' : 'info'} icon={<span />}>{i.status}</Pill>
              </div>
              <p className="text-sm text-ink">{i.detail}</p>
              <p className="mt-0.5 text-xs text-muted">
                {i.distanceMi ? `About ${i.distanceMi} mi ${i.direction}` : 'Area-wide'} · {ago(i.hoursAgo)} · {SAFETY_CATEGORY_LABEL[i.category]}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {items.length > 4 && (
        <div className="mt-2"><Button size="sm" variant="ghost" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer' : `Show all ${items.length}`}</Button></div>
      )}

      <div className="mt-4 rounded-xl bg-surface-2 p-3 text-sm">
        <p className="font-semibold text-ink">Sex offender registries</p>
        <p className="mt-1 text-muted">
          HomeBridge links to the official registries instead of showing people’s names, photos or addresses. Registries can be out of date, so check the official site and use it for awareness and safety planning only.
        </p>
        <ul className="mt-2 grid gap-2">
          {OFFICIAL_SAFETY_LINKS.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-forest underline underline-offset-2">
                {l.name} <ExternalLink size={13} />
              </a>
              <span className="block text-xs text-muted">{l.note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <p className="min-w-0 flex-1">
          Incidents are simulated for the demo. Locations are rounded to distance and direction; no names or addresses are shown. In an emergency, call 911.
        </p>
        <Button size="sm" variant="ghost" onClick={hide}><EyeOff size={16} /> Hide panel</Button>
      </div>
    </Card>
  );
}

