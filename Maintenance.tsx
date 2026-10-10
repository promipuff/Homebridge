import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import type { Alert, HistoryEntry, Issue, IssueCategory, IssueStatus } from '../types';
import { STUDENT_CHECKLIST, isRenter, maintenanceWorkflow, todayISO, type Workflow } from '../lib/personalize';
import { ACCESSIBILITY_PRESETS, CATEGORY_LABEL, PARTY_LABEL, SCOPE_LABEL, SEVERITY_LABEL, STATUS_LABEL, STATUS_LABEL_PROJECT } from '../lib/labels';
import { uid } from '../lib/defaults';
import { recommendations } from '../lib/derived';
import { ResourceMini } from './Resources';
import { Button, Card, CardTitle, ChoiceGroup, Notice, PageHeader, Pill, SelectField, SourceBadge, TextArea, TextField, cx, fmtDate, type Tone } from './ui';
import { Calendar, Camera, Check, ChevronLeft, FileClock, MessageSquare, Pencil, Plus, Trash, Wrench } from '../icons';

const STATUS_TONE: Record<IssueStatus, Tone> = {
  documented: 'muted', reported: 'info', acknowledged: 'info', in_progress: 'forest', follow_up: 'amber', resolved: 'ok',
};
const SEV_TONE = { low: 'muted', medium: 'info', high: 'amber', urgent: 'danger' } as const;

export const statusLabel = (s: IssueStatus, wf: Workflow) => (wf.projectMode && STATUS_LABEL_PROJECT[s]) || STATUS_LABEL[s];

function blankIssue(wf: Workflow): Issue {
  const now = new Date().toISOString();
  return {
    id: uid('iss'), category: 'plumbing', title: '', description: '', firstObserved: todayISO(), severity: 'medium', location: '',
    locationScope: wf.scopes[0], reported: 'no', reportedDate: '', responsibleParty: wf.parties[0], status: 'documented', followUpDate: '',
    notes: '', checklist: {}, history: [], createdAt: now, updatedAt: now,
  };
}

function fromAlert(a: Alert, wf: Workflow): Issue {
  const base = blankIssue(wf);
  const cat: Partial<Record<Alert['kind'], IssueCategory>> = { water_spike: 'plumbing', leak: 'plumbing', humidity_high: 'moisture', heat: 'heating_cooling', air_poor: 'other' };
  return {
    ...base,
    category: cat[a.kind] ?? 'other',
    title: a.kind === 'water_spike' ? 'Possible leak: water use about 3× normal' : a.title,
    description: `${a.summary} (From a simulated HomeBridge alert on ${fmtDate(a.createdAt, true)}.)`,
    severity: a.severity === 'urgent' ? 'urgent' : 'high',
  };
}

export function MaintenancePage() {
  const { state, focusTarget, clearFocusTarget } = useStore();
  const wf = maintenanceWorkflow(state.profile);
  const [mode, setMode] = useState<{ kind: 'list' } | { kind: 'form'; issue: Issue; isNew: boolean; alertId?: string } | { kind: 'detail'; id: string }>({ kind: 'list' });
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');

  useEffect(() => {
    if (!focusTarget) return;
    if (focusTarget === 'new') setMode({ kind: 'form', issue: blankIssue(wf), isNew: true });
    else if (focusTarget.startsWith('new-from-alert:')) {
      const a = state.alerts.find((x) => x.id === focusTarget.split(':')[1]);
      if (a) setMode({ kind: 'form', issue: fromAlert(a, wf), isNew: true, alertId: a.id });
    } else if (focusTarget.startsWith('issue:')) setMode({ kind: 'detail', id: focusTarget.split(':')[1] });
    clearFocusTarget();
  }, [focusTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { document.getElementById(mode.kind === 'list' ? 'page-title' : 'sub-title')?.focus(); }, [mode.kind]);

  if (mode.kind === 'form') return <IssueForm wf={wf} initial={mode.issue} isNew={mode.isNew} alertId={mode.alertId} onDone={(id) => setMode(id ? { kind: 'detail', id } : { kind: 'list' })} />;
  if (mode.kind === 'detail') {
    const issue = state.issues.find((i) => i.id === mode.id);
    if (issue) return <IssueDetail wf={wf} issue={issue} onBack={() => setMode({ kind: 'list' })} onEdit={() => setMode({ kind: 'form', issue, isNew: false })} />;
  }

  const list = state.issues
    .filter((i) => (filter === 'all' ? true : filter === 'open' ? i.status !== 'resolved' : i.status === 'resolved'))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const today = todayISO();

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader eyebrow="Housing conditions" title={wf.title} intro={wf.intro}>
        <Button variant="primary" onClick={() => setMode({ kind: 'form', issue: blankIssue(wf), isNew: true })}><Plus size={18} /> {wf.newLabel}</Button>
      </PageHeader>
      {wf.optional && (
        <Notice title="This is optional">Keep notes only if they help you. You can find support in Resources at any time.</Notice>
      )}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter issues">
        {(['open', 'resolved', 'all'] as const).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cx('min-h-[40px] rounded-full border px-4 text-sm font-semibold', filter === f ? 'border-forest bg-forest text-forest-ink' : 'border-line bg-surface text-ink')}>
            {f === 'open' ? 'Open' : f === 'resolved' ? 'Resolved' : 'All'} ({state.issues.filter((i) => (f === 'all' ? true : f === 'open' ? i.status !== 'resolved' : i.status === 'resolved')).length})
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Card>
          <p className="text-ink">{filter === 'resolved' ? 'No resolved items yet.' : 'Nothing open right now.'}</p>
          <p className="mt-1 text-sm text-muted">Use “{wf.newLabel}” to record a problem with the date, location, a photo and who’s responsible.</p>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {list.map((i) => {
            const overdue = i.status !== 'resolved' && i.followUpDate && i.followUpDate <= today;
            return (
              <li key={i.id}>
                <button type="button" onClick={() => setMode({ kind: 'detail', id: i.id })} className={cx('grid w-full gap-2 rounded-card border bg-surface p-4 text-left transition hover:border-forest', overdue ? 'border-amber' : 'border-line')}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-wider text-muted">{CATEGORY_LABEL[i.category]} · {SCOPE_LABEL[i.locationScope]}</span>
                      <span className="block font-display text-lg font-semibold text-ink">{i.title || CATEGORY_LABEL[i.category]}</span>
                    </span>
                    <span className="flex flex-wrap gap-2">
                      <Pill tone={SEV_TONE[i.severity]} icon={<span />}>{i.severity[0].toUpperCase() + i.severity.slice(1)}</Pill>
                      <Pill tone={STATUS_TONE[i.status]}>{statusLabel(i.status, wf)}</Pill>
                    </span>
                  </div>
                  <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                    <span>First noticed {fmtDate(i.firstObserved)}</span>
                    {i.reported === 'yes' && i.reportedDate && <span>Reported {fmtDate(i.reportedDate)}</span>}
                    {i.followUpDate && <span className={cx(overdue && 'font-semibold text-amber')}>{overdue ? 'Follow-up due ' : 'Follow up '}{fmtDate(i.followUpDate)}</span>}
                    <span>{i.history.length} updates</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Disclaimer />
    </div>
  );
}

function Disclaimer() {
  return (
    <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted">
      HomeBridge helps you keep records. It does not replace professional inspections, emergency services or legal advice. For fire, gas smells, sparking or carbon monoxide, leave and call 911.
    </p>
  );
}

function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode'));
      img.onload = () => {
        const scale = Math.min(1, 900 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function IssueForm({ wf, initial, isNew, alertId, onDone }: { wf: Workflow; initial: Issue; isNew: boolean; alertId?: string; onDone: (id?: string) => void }) {
  const { update, toast, state } = useStore();
  const [d, setD] = useState<Issue>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (patch: Partial<Issue>) => setD((x) => ({ ...x, ...patch }));
  const categories = (Object.keys(CATEGORY_LABEL) as IssueCategory[]).filter((c) => c !== 'shared_space' || wf.scopes.some((s) => s === 'common_area' || s === 'shared_building'));

  const onPhoto = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { setErrors((e) => ({ ...e, photo: 'Choose an image file (JPG or PNG).' })); return; }
    try {
      set({ photo: await resizePhoto(f) });
      setErrors(({ photo: _p, ...rest }) => rest);
    } catch {
      setErrors((e) => ({ ...e, photo: 'That image couldn’t be read. Try another photo.' }));
    }
  };

  const save = () => {
    const e: Record<string, string> = {};
    if (!d.title.trim()) e.title = 'Give the issue a short title, like “Kitchen sink leaking”.';
    if (!d.firstObserved) e.firstObserved = 'Enter the date you first noticed it.';
    else if (d.firstObserved > todayISO()) e.firstObserved = 'The date can’t be in the future.';
    if (d.reported === 'yes' && d.reportedDate && d.reportedDate < d.firstObserved) e.reportedDate = 'The report date is before the date you noticed the issue.';
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById('form-errors')?.focus();
      return;
    }
    const now = new Date().toISOString();
    let status = d.status;
    if (isNew && d.reported === 'yes' && status === 'documented' && wf.statuses.includes('reported')) status = 'reported';
    const history: HistoryEntry[] = isNew
      ? [{ id: uid('h'), at: now, type: 'created', text: alertId ? 'Created from a simulated alert' : 'Issue recorded' },
         ...(d.reported === 'yes' && d.reportedDate ? [{ id: uid('h'), at: now, type: 'communication' as const, text: `Reported to ${PARTY_LABEL[d.responsibleParty]}`, communication: { method: 'Not specified', contact: PARTY_LABEL[d.responsibleParty], date: d.reportedDate } }] : [])]
      : [...d.history, { id: uid('h'), at: now, type: 'edit', text: 'Details updated' }];
    const saved: Issue = { ...d, status, history, updatedAt: now };
    update((s) => ({
      ...s,
      issues: isNew ? [saved, ...s.issues] : s.issues.map((i) => (i.id === saved.id ? saved : i)),
      alerts: alertId ? s.alerts.map((a) => (a.id === alertId ? { ...a, linkedIssueId: saved.id } : a)) : s.alerts,
    }));
    toast(isNew ? 'Issue saved.' : 'Changes saved.');
    onDone(saved.id);
  };

  const errList = Object.values(errors);
  return (
    <div className="grid grid-cols-1 max-w-3xl gap-5">
      <div>
        <Button variant="ghost" size="sm" onClick={() => onDone(isNew ? undefined : d.id)}><ChevronLeft size={16} /> Back</Button>
        <h1 id="sub-title" tabIndex={-1} className="mt-2 font-display text-[1.75rem] font-bold text-ink outline-none">{isNew ? wf.newLabel : 'Edit issue'}</h1>
        {alertId && <p className="mt-1 text-sm text-muted">Prefilled from the alert. Check the details before saving.</p>}
        {state.profile.situation === 'shared' && <p className="mt-1 text-sm text-muted">Describe the problem, not a person. Responsibility is only what you know for sure.</p>}
      </div>
      {errList.length > 0 && (
        <div id="form-errors" tabIndex={-1} role="alert" className="rounded-xl border border-danger bg-danger-soft p-3 text-sm outline-none">
          <p className="font-semibold text-danger">Please fix {errList.length === 1 ? 'this' : 'these'} before saving:</p>
          <ul className="mt-1 list-disc pl-5">{errList.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}
      <form className="grid grid-cols-1 gap-5" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <Card className="grid grid-cols-1 gap-4">
          <SelectField id="f-cat" label="Issue category" value={d.category} onChange={(e) => set({ category: e.target.value as IssueCategory })} options={categories.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))} />
          {d.category === 'accessibility' && (
            <div>
              <p className="mb-2 text-sm font-semibold">Common barriers (tap to use)</p>
              <div className="flex flex-wrap gap-2">
                {ACCESSIBILITY_PRESETS.map((pr) => (
                  <button key={pr} type="button" onClick={() => set({ title: pr })} className={cx('min-h-[40px] rounded-full border px-3 text-sm', d.title === pr ? 'border-forest bg-forest-soft font-semibold text-forest' : 'border-line bg-surface')}>{pr}</button>
                ))}
              </div>
              {(isRenter(state.profile) || ['shared', 'dorm', 'temporary'].includes(state.profile.situation)) && (
                <p className="mt-2 text-sm text-muted">You don’t have to change the property yourself. Recording it helps when asking the owner or housing provider for a reasonable modification.</p>
              )}
            </div>
          )}
          <TextField id="f-title" label="Short title" value={d.title} maxLength={80} error={errors.title} onChange={(e) => set({ title: e.target.value })} required />
          <TextArea id="f-desc" label="Description" hint="What you see, hear or smell, and how it affects daily life." value={d.description} onChange={(e) => set({ description: e.target.value })} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField id="f-date" type="date" label="Date first noticed" value={d.firstObserved} max={todayISO()} error={errors.firstObserved} onChange={(e) => set({ firstObserved: e.target.value })} />
            <SelectField id="f-sev" label="Severity" value={d.severity} onChange={(e) => set({ severity: e.target.value as Issue['severity'] })} options={(Object.keys(SEVERITY_LABEL) as Issue['severity'][]).map((s) => ({ value: s, label: SEVERITY_LABEL[s] }))} />
          </div>
          {d.severity === 'urgent' && <Notice tone="danger" title="Safety first">If there’s fire, sparking, a gas smell or a CO alarm, leave and call 911. Record it here afterward.</Notice>}
        </Card>

        <Card className="grid grid-cols-1 gap-4">
          <ChoiceGroup name="scope" legend="Where is it?" value={d.locationScope} onChange={(v) => set({ locationScope: v })} options={wf.scopes.map((s) => ({ value: s, label: SCOPE_LABEL[s] }))} />
          <TextField id="f-loc" label="Spot in the home" hint="General area only, like “bathroom” or “2nd-floor hallway”." value={d.location} maxLength={60} onChange={(e) => set({ location: e.target.value })} />
          <div>
            <p className="mb-1 text-sm font-semibold">Photo (optional)</p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 font-semibold focus-within:ring-2 focus-within:ring-focus hover:bg-surface-2">
                <Camera size={18} /> {d.photo ? 'Replace photo' : 'Add photo'}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
              </label>
              {d.photo && (
                <>
                  <img src={d.photo} alt="Photo of the issue" className="h-20 w-28 rounded-lg border border-line object-cover" />
                  <Button size="sm" variant="ghost" onClick={() => set({ photo: undefined })}>Remove</Button>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">Photos are resized and kept only on this device.</p>
            {errors.photo && <p className="text-sm font-semibold text-danger">{errors.photo}</p>}
          </div>
        </Card>

        <Card className="grid grid-cols-1 gap-4">
          <ChoiceGroup
            name="reported"
            legend={wf.reportedLabel}
            value={d.reported}
            onChange={(v) => set({ reported: v })}
            options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'Not yet' }, { value: 'not_needed', label: wf.projectMode ? 'Doing it myself' : 'Not needed' }]}
          />
          {d.reported === 'yes' && <TextField id="f-rdate" type="date" label="Date reported" value={d.reportedDate} max={todayISO()} error={errors.reportedDate} onChange={(e) => set({ reportedDate: e.target.value })} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField id="f-party" label="Responsible party (if known)" value={d.responsibleParty} onChange={(e) => set({ responsibleParty: e.target.value as Issue['responsibleParty'] })} options={wf.parties.map((p) => ({ value: p, label: PARTY_LABEL[p] }))} />
            <SelectField id="f-status" label="Status" value={d.status} onChange={(e) => set({ status: e.target.value as IssueStatus })} options={wf.statuses.map((s) => ({ value: s, label: statusLabel(s, wf) }))} />
          </div>
          <TextField id="f-follow" type="date" label="Follow-up date (optional)" hint="When to check back if nothing has happened." value={d.followUpDate} onChange={(e) => set({ followUpDate: e.target.value })} />
          {wf.studentChecklist && (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Work-order checklist</legend>
              <div className="grid grid-cols-1 gap-2">
                {STUDENT_CHECKLIST.map((c) => (
                  <label key={c} className="flex min-h-[40px] items-center gap-3 rounded-lg bg-surface-2 px-3">
                    <input type="checkbox" className="h-5 w-5 accent-[var(--forest)]" checked={!!d.checklist[c]} onChange={(e) => set({ checklist: { ...d.checklist, [c]: e.target.checked } })} />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <TextArea id="f-notes" label="Notes" value={d.notes} onChange={(e) => set({ notes: e.target.value })} />
        </Card>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary"><Check size={18} /> {isNew ? 'Save issue' : 'Save changes'}</Button>
          <Button onClick={() => onDone(isNew ? undefined : d.id)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

function IssueDetail({ wf, issue, onBack, onEdit }: { wf: Workflow; issue: Issue; onBack: () => void; onEdit: () => void }) {
  const { state, update, toast, go } = useStore();
  const [newStatus, setNewStatus] = useState<IssueStatus>(issue.status);
  const [statusNote, setStatusNote] = useState('');
  const [comm, setComm] = useState({ date: todayISO(), method: 'Phone call', contact: PARTY_LABEL[issue.responsibleParty] ?? '', summary: '' });
  const [commErr, setCommErr] = useState('');
  const [note, setNote] = useState('');
  const [follow, setFollow] = useState(issue.followUpDate);
  const [confirmDel, setConfirmDel] = useState(false);

  const patch = (fn: (i: Issue) => Issue, msg: string) => {
    update((s) => ({ ...s, issues: s.issues.map((i) => (i.id === issue.id ? { ...fn(i), updatedAt: new Date().toISOString() } : i)) }));
    toast(msg);
  };
  const entry = (e: Omit<HistoryEntry, 'id' | 'at'>): HistoryEntry => ({ id: uid('h'), at: new Date().toISOString(), ...e });

  const changeStatus = () => {
    if (newStatus === issue.status && !statusNote.trim()) return;
    patch((i) => ({ ...i, status: newStatus, history: [...i.history, entry({ type: 'status', status: newStatus, text: `Status: ${statusLabel(newStatus, wf)}${statusNote.trim() ? `. ${statusNote.trim()}` : ''}` })] }), 'Status updated.');
    setStatusNote('');
  };
  const logComm = () => {
    if (!comm.date) return setCommErr('Enter the date of the contact.');
    if (comm.date > todayISO()) return setCommErr('The contact date can’t be in the future.');
    setCommErr('');
    patch((i) => ({
      ...i,
      reported: 'yes',
      reportedDate: i.reportedDate || comm.date,
      status: i.status === 'documented' ? 'reported' : i.status,
      history: [...i.history, entry({ type: 'communication', text: comm.summary.trim() || `${comm.method} with ${comm.contact || 'responsible party'}`, communication: { method: comm.method, contact: comm.contact, date: comm.date } })],
    }), 'Contact logged.');
    setComm({ ...comm, summary: '' });
  };
  const saveFollow = () => {
    patch((i) => ({ ...i, followUpDate: follow, history: [...i.history, entry({ type: 'followup', text: follow ? `Follow-up set for ${fmtDate(follow)}` : 'Follow-up date cleared' })] }), follow ? 'Follow-up date set.' : 'Follow-up cleared.');
    if (follow) {
      update((s) => ({ ...s, reminders: [...s.reminders.filter((r) => r.title !== `Follow up: ${issue.title}`), { id: uid('rem'), type: 'maintenance', title: `Follow up: ${issue.title}`, date: follow, repeat: 'none', enabled: true }] }));
    }
  };
  const addNote = () => {
    if (!note.trim()) return;
    patch((i) => ({ ...i, history: [...i.history, entry({ type: 'note', text: note.trim() })] }), 'Note added.');
    setNote('');
  };
  const del = () => {
    update((s) => ({ ...s, issues: s.issues.filter((i) => i.id !== issue.id), alerts: s.alerts.map((a) => (a.linkedIssueId === issue.id ? { ...a, linkedIssueId: undefined } : a)) }));
    toast('Issue deleted.');
    onBack();
  };

  const recs = useMemo(() => recommendations(state).slice(0, 4), [state]);
  const overdue = issue.status !== 'resolved' && issue.followUpDate && issue.followUpDate <= todayISO();
  const history = [...issue.history].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="grid grid-cols-1 gap-5">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft size={16} /> All issues</Button>
        <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted">{CATEGORY_LABEL[issue.category]} · {SCOPE_LABEL[issue.locationScope]}{issue.location ? ` · ${issue.location}` : ''}</p>
        <h1 id="sub-title" tabIndex={-1} className="font-display text-[1.75rem] font-bold leading-tight text-ink outline-none">{issue.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Pill tone={STATUS_TONE[issue.status]}>{statusLabel(issue.status, wf)}</Pill>
          <Pill tone={SEV_TONE[issue.severity]} icon={<span />}>{SEVERITY_LABEL[issue.severity]}</Pill>
          <SourceBadge source="user_entered" />
          <Button size="sm" variant="ghost" onClick={onEdit}><Pencil size={16} /> Edit details</Button>
        </div>
      </div>
      {overdue && <Notice tone="amber" title="Follow-up date has passed">It was due {fmtDate(issue.followUpDate)}. Log your next contact or set a new date.</Notice>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="grid grid-cols-1 content-start gap-5">
          <Card>
            <CardTitle icon={<Wrench size={20} />}>Details</CardTitle>
            {issue.description && <p className="mb-3 whitespace-pre-wrap text-ink">{issue.description}</p>}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">First noticed</dt><dd className="font-semibold">{fmtDate(issue.firstObserved)}</dd></div>
              <div><dt className="text-muted">{wf.reportedLabel}</dt><dd className="font-semibold">{issue.reported === 'yes' ? `Yes${issue.reportedDate ? `, ${fmtDate(issue.reportedDate)}` : ''}` : issue.reported === 'no' ? 'Not yet' : 'Not needed'}</dd></div>
              <div><dt className="text-muted">Responsible party</dt><dd className="font-semibold">{PARTY_LABEL[issue.responsibleParty]}</dd></div>
              <div><dt className="text-muted">Follow-up</dt><dd className="font-semibold">{issue.followUpDate ? fmtDate(issue.followUpDate) : 'None set'}</dd></div>
            </dl>
            {issue.notes && <p className="mt-3 text-sm text-muted">Notes: {issue.notes}</p>}
            {issue.photo && <img src={issue.photo} alt={`Photo of ${issue.title}`} className="mt-3 max-h-64 rounded-xl border border-line object-contain" />}
            {wf.studentChecklist && (
              <ul className="mt-3 grid gap-1 text-sm">
                {STUDENT_CHECKLIST.map((c) => (
                  <li key={c} className="flex items-center gap-2">
                    <button type="button" role="checkbox" aria-checked={!!issue.checklist[c]} onClick={() => patch((i) => ({ ...i, checklist: { ...i.checklist, [c]: !i.checklist[c] } }), 'Checklist updated.')} className={cx('grid h-6 w-6 place-items-center rounded border-2', issue.checklist[c] ? 'border-forest bg-forest text-forest-ink' : 'border-muted')}>
                      {issue.checklist[c] && <Check size={14} />}
                    </button>
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle icon={<FileClock size={20} />}>History</CardTitle>
            <ol className="relative grid gap-4 border-l-2 border-line pl-5">
              {history.map((h) => (
                <li key={h.id} className="relative">
                  <span className={cx('absolute -left-[27px] top-1 grid h-3.5 w-3.5 rounded-full border-2 border-surface', h.type === 'communication' ? 'bg-info' : h.type === 'status' ? 'bg-forest' : 'bg-sage')} aria-hidden="true" />
                  <p className="text-xs text-muted">{fmtDate(h.at, true)} · {h.type === 'communication' ? 'Contact' : h.type === 'status' ? 'Status change' : h.type === 'followup' ? 'Follow-up' : h.type === 'note' ? 'Note' : h.type === 'edit' ? 'Edit' : 'Created'}</p>
                  <p className="text-ink">{h.text}</p>
                  {h.communication && <p className="text-sm text-muted">{h.communication.method} with {h.communication.contact || 'responsible party'} on {fmtDate(h.communication.date)}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="grid grid-cols-1 content-start gap-5">
          <Card>
            <CardTitle>Update status</CardTitle>
            <div className="grid grid-cols-1 gap-3">
              <SelectField label="New status" value={newStatus} onChange={(e) => setNewStatus(e.target.value as IssueStatus)} options={wf.statuses.map((s) => ({ value: s, label: statusLabel(s, wf) }))} />
              <TextField label="What changed? (optional)" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
              <Button variant="primary" onClick={changeStatus}>Update status</Button>
            </div>
          </Card>

          {(wf.communicationLog || wf.studentChecklist || wf.optional) && (
            <Card>
              <CardTitle icon={<MessageSquare size={20} />}>{wf.studentChecklist ? 'Log contact with housing' : wf.optional ? 'Log contact with staff' : 'Log a contact'}</CardTitle>
              <form className="grid grid-cols-1 gap-3" onSubmit={(e) => { e.preventDefault(); logComm(); }} noValidate>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <TextField type="date" label="Date" value={comm.date} max={todayISO()} error={commErr} onChange={(e) => setComm({ ...comm, date: e.target.value })} />
                  <SelectField label="How" value={comm.method} onChange={(e) => setComm({ ...comm, method: e.target.value })} options={['Phone call', 'Text message', 'Email', 'Online portal', 'Letter', 'In person'].map((m) => ({ value: m, label: m }))} />
                </div>
                <TextField label="With" value={comm.contact} onChange={(e) => setComm({ ...comm, contact: e.target.value })} />
                <TextArea label="What was said" value={comm.summary} onChange={(e) => setComm({ ...comm, summary: e.target.value })} />
                <Button type="submit"><MessageSquare size={18} /> Log contact</Button>
              </form>
            </Card>
          )}

          <Card>
            <CardTitle icon={<Calendar size={20} />}>Follow-up</CardTitle>
            <div className="grid grid-cols-1 gap-3">
              <TextField type="date" label="Follow-up date" value={follow} onChange={(e) => setFollow(e.target.value)} hint="A reminder is added to your dashboard." />
              <Button onClick={saveFollow}>Save follow-up</Button>
            </div>
          </Card>

          <Card>
            <CardTitle>Add a note</CardTitle>
            <div className="grid grid-cols-1 gap-3">
              <TextArea label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button onClick={addNote}>Add note</Button>
            </div>
          </Card>

          {recs.length > 0 && (
            <Card>
              <CardTitle>Help with this</CardTitle>
              <ul className="grid grid-cols-1 gap-2">{recs.map((r) => <li key={r.resource.id}><ResourceMini resource={r.resource} reason={r.reasons[0]} /></li>)}</ul>
              <div className="mt-2"><Button size="sm" variant="ghost" onClick={() => go('resources')}>All resources</Button></div>
            </Card>
          )}

          <div className="rounded-card border border-line p-4">
            {!confirmDel ? (
              <Button variant="ghost" className="text-danger" onClick={() => setConfirmDel(true)}><Trash size={16} /> Delete this issue</Button>
            ) : (
              <div className="grid grid-cols-1 gap-2" role="group" aria-label="Confirm delete">
                <p className="font-semibold">Delete “{issue.title}” and its history? This can’t be undone.</p>
                <div className="flex gap-2"><Button variant="danger" onClick={del}>Delete</Button><Button onClick={() => setConfirmDel(false)}>Keep it</Button></div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
