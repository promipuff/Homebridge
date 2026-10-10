import type { Alert } from '../types';
import { useStore } from '../store';
import { Button, SourceBadge, cx, fmtDate } from './ui';
import { CircleAlert, Info, TriangleAlert, Volume2, Wrench, Check } from '../icons';

const SEV = {
  urgent: { label: 'Urgent', stripe: 'bg-danger', text: 'text-danger', icon: <CircleAlert size={20} />, soft: 'bg-danger-soft' },
  warning: { label: 'Needs attention', stripe: 'bg-amber', text: 'text-amber', icon: <TriangleAlert size={20} />, soft: 'bg-amber-soft' },
  info: { label: 'For your information', stripe: 'bg-info', text: 'text-info', icon: <Info size={20} />, soft: 'bg-info-soft' },
} as const;

export function alertSummaryText(alerts: Alert[]) {
  const active = alerts.filter((a) => !a.acknowledged);
  if (!active.length) return 'You have no active alerts.';
  const urgent = active.filter((a) => a.severity === 'urgent').length;
  return `You have ${active.length} active alert${active.length > 1 ? 's' : ''}${urgent ? `, ${urgent} urgent` : ''}. ` +
    active.map((a) => `${SEV[a.severity].label}: ${a.title}. ${a.steps[0]}`).join(' ');
}

export function speak(text: string): boolean {
  try {
    if (!('speechSynthesis' in window)) return false;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    return true;
  } catch {
    return false;
  }
}

export function AlertCard({ alert, compact = false }: { alert: Alert; compact?: boolean }) {
  const { update, go, toast, state } = useStore();
  const s = SEV[alert.severity];
  const linked = alert.linkedIssueId && state.issues.find((i) => i.id === alert.linkedIssueId);
  const ack = () => {
    update((st) => ({ ...st, alerts: st.alerts.map((a) => (a.id === alert.id ? { ...a, acknowledged: true } : a)) }));
    toast('Alert marked as handled.');
  };
  return (
    <article className={cx('relative overflow-hidden rounded-card border border-line bg-surface', alert.acknowledged && 'opacity-70')} aria-labelledby={`al-${alert.id}`}>
      <span className={cx('absolute inset-y-0 left-0 w-1.5', s.stripe)} aria-hidden="true" />
      <div className="p-4 pl-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className={cx('mt-0.5 shrink-0', s.text)}>{s.icon}</span>
            <div className="min-w-0">
              <p className={cx('text-xs font-bold uppercase tracking-wider', s.text)}>{s.label}{alert.acknowledged ? ' · handled' : ''}</p>
              <h3 id={`al-${alert.id}`} className="font-display text-lg font-semibold leading-snug text-ink">{alert.title}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SourceBadge source={alert.source} />
            <span className="text-xs text-muted">{fmtDate(alert.createdAt, true)}</span>
          </div>
        </div>
        <p className="mt-2 text-ink">{alert.summary}</p>
        {!compact && (
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink">
            {alert.steps.map((st, i) => <li key={i}>{st}</li>)}
          </ol>
        )}
        {!alert.acknowledged && (
          <div className="mt-3 flex flex-wrap gap-2">
            {alert.kind !== 'sensor_offline' && alert.kind !== 'co_alarm' && (
              linked ? (
                <Button size="sm" onClick={() => go('maintenance', `issue:${linked.id}`)}><Wrench size={16} /> View maintenance record</Button>
              ) : (
                <Button size="sm" variant="primary" onClick={() => go('maintenance', `new-from-alert:${alert.id}`)}><Wrench size={16} /> Create maintenance record</Button>
              )
            )}
            <Button size="sm" variant="ghost" onClick={ack}><Check size={16} /> Mark as handled</Button>
          </div>
        )}
      </div>
    </article>
  );
}

export function AlertSummaryBar() {
  const { state, toast } = useStore();
  const text = alertSummaryText(state.alerts);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
      <p className="min-w-0 text-ink" aria-live="polite">{text.split('. ')[0].replace(/\.$/, '')}.</p>
      <Button size="sm" variant="ghost" onClick={() => { if (!speak(text)) toast('Read-aloud isn’t available in this browser.', 'warn'); }}>
        <Volume2 size={16} /> Read alerts aloud
      </Button>
    </div>
  );
}
