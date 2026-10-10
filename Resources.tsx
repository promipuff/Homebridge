import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import type { Resource, ResourceCategory } from '../types';
import { CATEGORY_LABEL, RESOURCES } from '../data/resources';
import { recommendations } from '../lib/derived';
import { Button, Card, Notice, PageHeader, SourceBadge, cx } from './ui';
import { Bookmark, BookmarkCheck, Clock, Copy, ExternalLink, Globe, Languages, MapPin, Phone, Search, ShieldCheck, Accessibility } from '../icons';

function useSave() {
  const { state, update, toast } = useStore();
  return {
    saved: (id: string) => state.savedResources.includes(id),
    toggle: (r: Resource) => {
      const on = state.savedResources.includes(r.id);
      update((s) => ({ ...s, savedResources: on ? s.savedResources.filter((x) => x !== r.id) : [r.id, ...s.savedResources] }));
      toast(on ? `Removed ${r.name} from saved.` : `Saved ${r.name}.`);
    },
  };
}

export function ResourceMini({ resource: r, reason }: { resource: Resource; reason?: string }) {
  const { go } = useStore();
  return (
    <button type="button" onClick={() => go('resources', `res:${r.id}`)} className="flex w-full items-start justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2 text-left hover:bg-forest-soft">
      <span className="min-w-0">
        <span className="block font-semibold text-ink">{r.name}</span>
        <span className="block text-xs text-muted">{reason ?? CATEGORY_LABEL[r.category]}{r.verification === 'sample' ? ' · Sample listing' : ''}</span>
      </span>
      {r.phone && <span className="flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums text-forest"><Phone size={14} />{r.phone}</span>}
    </button>
  );
}

function ResourceCard({ r, reasons, defaultOpen }: { r: Resource; reasons?: string[]; defaultOpen?: boolean }) {
  const { update, toast } = useStore();
  const { saved, toggle } = useSave();
  const [open, setOpen] = useState(!!defaultOpen);
  const isSaved = saved(r.id);
  const expand = () => {
    const next = !open;
    setOpen(next);
    if (next) update((s) => ({ ...s, viewedResources: [r.id, ...s.viewedResources.filter((x) => x !== r.id)].slice(0, 8) }));
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Phone number copied.');
    } catch {
      toast('Copy isn’t available here. Select the number to copy it.', 'warn');
    }
  };
  return (
    <Card as="article" id={`res-${r.id}`} className="grid grid-cols-1 gap-2" aria-labelledby={`rn-${r.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{CATEGORY_LABEL[r.category]}</p>
          <h3 id={`rn-${r.id}`} className="font-display text-lg font-semibold leading-snug text-ink">{r.name}</h3>
        </div>
        <Button size="sm" variant={isSaved ? 'primary' : 'secondary'} onClick={() => toggle(r)} aria-pressed={isSaved} aria-label={isSaved ? `Unsave ${r.name}` : `Save ${r.name}`}>
          {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />} {isSaved ? 'Saved' : 'Save'}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <SourceBadge source={r.verification === 'sample' ? 'sample' : 'national'} />
      </div>
      <p className="text-ink">{r.summary}</p>
      {reasons && reasons.length > 0 && (
        <p className="rounded-lg bg-forest-soft px-3 py-1.5 text-sm text-forest"><strong>Why you’re seeing this:</strong> {reasons.join(' ')}</p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        {r.phone && (
          <span className="flex items-center gap-1">
            <Phone size={14} /> <span className="select-all font-semibold tabular-nums text-ink">{r.phone}</span>
            {r.phone.length > 4 && <button type="button" onClick={() => copy(r.phone)} className="rounded p-1 text-forest hover:bg-surface-2" aria-label={`Copy ${r.phone}`}><Copy size={14} /></button>}
          </span>
        )}
        <span className="flex items-center gap-1"><Clock size={14} /> {r.hours}</span>
        <span className="flex items-center gap-1"><MapPin size={14} /> {r.area}</span>
      </div>
      <button type="button" onClick={expand} aria-expanded={open} className="justify-self-start text-sm font-semibold text-forest underline underline-offset-2">
        {open ? 'Hide details' : 'Eligibility, accessibility & link'}
      </button>
      {open && (
        <dl className="grid grid-cols-1 gap-2 rounded-xl bg-surface-2 p-3 text-sm">
          <div><dt className="font-semibold">Eligibility</dt><dd className="text-ink">{r.eligibility}</dd></div>
          {r.accessibility.length > 0 && <div><dt className="flex items-center gap-1 font-semibold"><Accessibility size={14} /> Accessibility</dt><dd>{r.accessibility.join(' · ')}</dd></div>}
          {r.languages.length > 0 && <div><dt className="flex items-center gap-1 font-semibold"><Languages size={14} /> Languages</dt><dd>{r.languages.join(', ')}</dd></div>}
          <div>
            <dt className="flex items-center gap-1 font-semibold"><ShieldCheck size={14} /> Verification</dt>
            <dd>{r.verification === 'sample' ? 'Sample listing for the prototype. This is not a real organization, phone number or link.' : 'Real public program or number. Link checked Oct 9, 2026. Local availability and eligibility are not verified by HomeBridge.'}</dd>
          </div>
          {r.website && (
            <div>
              <dt className="flex items-center gap-1 font-semibold"><Globe size={14} /> Website</dt>
              <dd>
                <a href={r.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all font-semibold text-forest underline">
                  {r.website.replace('https://', '')} <ExternalLink size={13} />
                </a>
                {r.verification === 'sample' && <span className="text-muted"> (placeholder)</span>}
              </dd>
            </div>
          )}
        </dl>
      )}
    </Card>
  );
}

export function ResourcesPage() {
  const { state, focusTarget, clearFocusTarget } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<ResourceCategory | 'all' | 'saved'>('all');
  const recs = useMemo(() => recommendations(state), [state]);
  const [target] = useState(() => (focusTarget?.startsWith('res:') ? focusTarget.slice(4) : null));
  useEffect(() => {
    if (!target) return;
    clearFocusTarget();
    const el = document.getElementById(`res-${target}`);
    if (el) { el.scrollIntoView({ block: 'center' }); el.querySelector('h3')?.setAttribute('tabindex', '-1'); (el.querySelector('h3') as HTMLElement | null)?.focus({ preventScroll: true }); }
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  const cats = useMemo(() => Array.from(new Set(RESOURCES.map((r) => r.category))), []);
  const filtered = RESOURCES.filter((r) => {
    if (cat === 'saved' && !state.savedResources.includes(r.id)) return false;
    if (cat !== 'all' && cat !== 'saved' && r.category !== cat) return false;
    if (!q.trim()) return true;
    const hay = `${r.name} ${r.summary} ${CATEGORY_LABEL[r.category]} ${r.area} ${r.tags.join(' ')} ${r.languages.join(' ')}`.toLowerCase();
    return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
  });
  const showRecs = !q && cat === 'all' && recs.length > 0;
  const recIds = new Set(recs.slice(0, 4).map((r) => r.resource.id));

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader eyebrow="Community Resource Center" title="Resources" intro="Food, shelter, housing help, utilities, repairs, accessibility and legal aid. Search, filter and save what you need." />
      <Notice title="Sample directory">
        Listings marked <strong>Sample listing</strong> are invented placeholders for this prototype. Five entries are real national programs or numbers ({'911, 211, LIHEAP, Weatherization Assistance, Lifeline'}). HomeBridge never decides who is eligible.
      </Notice>
      <div className="grid grid-cols-1 gap-3">
        <label htmlFor="res-search" className="sr-only">Search resources</label>
        <div className="flex min-h-[48px] items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:ring-2 focus-within:ring-focus">
          <Search size={18} className="text-muted" />
          <input id="res-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: “rent”, “food”, “Spanish”, “ramp”…" className="w-full bg-transparent py-2 outline-none" />
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by category">
          {(['all', 'saved', ...cats] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cat === c}
              onClick={() => setCat(c as typeof cat)}
              className={cx('min-h-[40px] shrink-0 whitespace-nowrap rounded-full border px-3 text-sm font-semibold', cat === c ? 'border-forest bg-forest text-forest-ink' : 'border-line bg-surface text-ink hover:bg-surface-2')}
            >
              {c === 'all' ? 'All' : c === 'saved' ? `Saved (${state.savedResources.length})` : CATEGORY_LABEL[c as ResourceCategory]}
            </button>
          ))}
        </div>
      </div>

      {showRecs && (
        <section aria-labelledby="rec-h" className="grid grid-cols-1 gap-3">
          <h2 id="rec-h" className="font-display text-xl font-semibold">Suggested for you</h2>
          <p className="-mt-2 text-sm text-muted">Based only on what you’ve recorded, like open repairs or a budget warning.</p>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {recs.slice(0, 4).map((r) => <ResourceCard key={r.resource.id} r={r.resource} reasons={r.reasons} defaultOpen={target === r.resource.id} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="all-h" className="grid grid-cols-1 gap-3">
        <h2 id="all-h" className="font-display text-xl font-semibold">
          {cat === 'saved' ? 'Saved resources' : showRecs ? 'All resources' : 'Results'} <span className="text-base font-normal text-muted" aria-live="polite">({filtered.filter((r) => !showRecs || !recIds.has(r.id)).length})</span>
        </h2>
        {filtered.length === 0 ? (
          <Card><p className="text-ink">{cat === 'saved' ? 'You haven’t saved anything yet.' : 'No matches. Try a shorter word or another category.'}</p></Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filtered.filter((r) => !showRecs || !recIds.has(r.id)).map((r) => <ResourceCard key={r.id} r={r} defaultOpen={target === r.id} />)}
          </div>
        )}
      </section>
    </div>
  );
}
