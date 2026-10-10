import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import type { DataSource } from '../types';
import { CircleAlert, CircleCheck, FlaskConical, Info, Pencil, TriangleAlert, Wifi } from '../icons';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function Card({ children, className, as: As = 'section', ...rest }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' | 'li' } & Record<string, unknown>) {
  return (
    <As className={cx('rounded-card border border-line bg-surface p-4 sm:p-5', className)} {...rest}>
      {children}
    </As>
  );
}

export function CardTitle({ icon, children, action, id }: { icon?: ReactNode; children: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <h2 id={id} className="flex items-center gap-2 font-display text-lg font-semibold leading-tight text-ink">
        {icon && <span className="text-forest">{icon}</span>}
        <span>{children}</span>
      </h2>
      {action}
    </div>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({ variant = 'secondary', className, children, size = 'md', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' }) {
  const styles: Record<BtnVariant, string> = {
    primary: 'bg-forest text-forest-ink border-forest hover:brightness-110',
    secondary: 'bg-surface text-ink border-line hover:bg-surface-2',
    ghost: 'bg-transparent text-forest border-transparent hover:bg-forest-soft',
    danger: 'bg-danger text-white border-danger hover:brightness-110',
  };
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        size === 'md' ? 'min-h-[44px] px-4 text-[0.95rem]' : 'min-h-[36px] px-3 text-sm',
        styles[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

const SOURCE_META: Record<DataSource | 'sample' | 'national', { label: string; cls: string; icon: ReactNode }> = {
  simulated: { label: 'Simulated', cls: 'bg-info-soft text-info', icon: <FlaskConical size={13} /> },
  user_entered: { label: 'You entered', cls: 'bg-sage-soft text-forest', icon: <Pencil size={13} /> },
  live: { label: 'Live', cls: 'bg-ok-soft text-ok', icon: <Wifi size={13} /> },
  sample: { label: 'Sample listing', cls: 'bg-info-soft text-info', icon: <FlaskConical size={13} /> },
  national: { label: 'Real national program', cls: 'bg-ok-soft text-ok', icon: <CircleCheck size={13} /> },
};

export function SourceBadge({ source }: { source: DataSource | 'sample' | 'national' }) {
  const m = SOURCE_META[source];
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', m.cls)}>
      {m.icon}
      {m.label}
    </span>
  );
}

export type Tone = 'ok' | 'amber' | 'danger' | 'muted' | 'info' | 'forest';
export function Pill({ tone, children, icon }: { tone: Tone; children: ReactNode; icon?: ReactNode }) {
  const cls: Record<Tone, string> = {
    ok: 'bg-ok-soft text-ok border-ok',
    amber: 'bg-amber-soft text-amber border-amber',
    danger: 'bg-danger-soft text-danger border-danger',
    muted: 'bg-surface-2 text-muted border-line',
    info: 'bg-info-soft text-info border-info',
    forest: 'bg-forest-soft text-forest border-forest',
  };
  const defaultIcon: Partial<Record<Tone, ReactNode>> = {
    ok: <CircleCheck size={14} />, amber: <TriangleAlert size={14} />, danger: <CircleAlert size={14} />, info: <Info size={14} />,
  };
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-sm font-semibold', cls[tone])}>
      {icon ?? defaultIcon[tone]}
      {children}
    </span>
  );
}

interface FieldBase {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function TextField({ label, hint, error, className, suffix, prefix, id: idProp, ...rest }: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = idProp ?? auto;
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cx('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
      {hint && <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>}
      <div className={cx('flex min-h-[44px] items-center rounded-xl border bg-surface px-3 focus-within:ring-2 focus-within:ring-focus', error ? 'border-danger' : 'border-line')}>
        {prefix && <span className="mr-1 text-muted" aria-hidden="true">{prefix}</span>}
        <input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className="w-full min-w-0 bg-transparent py-2 text-ink outline-none placeholder:text-muted" {...rest} />
        {suffix && <span className="ml-2 whitespace-nowrap text-sm text-muted" aria-hidden="true">{suffix}</span>}
      </div>
      {error && (
        <p id={`${id}-err`} className="flex items-start gap-1 text-sm font-semibold text-danger">
          <CircleAlert size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export function TextArea({ label, hint, error, className, id: idProp, ...rest }: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className={cx('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
      {hint && <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>}
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined}
        className={cx('min-h-[88px] rounded-xl border bg-surface px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-focus', error ? 'border-danger' : 'border-line')}
        {...rest}
      />
      {error && <p id={`${id}-err`} className="text-sm font-semibold text-danger">{error}</p>}
    </div>
  );
}

export function SelectField({ label, hint, error, className, options, id: idProp, ...rest }: FieldBase & SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className={cx('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
      {hint && <p id={`${id}-hint`} className="text-xs text-muted">{hint}</p>}
      <select
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        aria-invalid={error ? true : undefined}
        className={cx('min-h-[44px] rounded-xl border bg-surface px-3 text-ink outline-none focus:ring-2 focus:ring-focus', error ? 'border-danger' : 'border-line')}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-sm font-semibold text-danger">{error}</p>}
    </div>
  );
}

/** Radio group drawn as tappable chips. Native radios keep keyboard and screen-reader behavior. */
export function ChoiceGroup<T extends string>({ legend, hint, value, onChange, options, name, columns = false }: {
  legend: string; hint?: string; value: T; onChange: (v: T) => void; options: { value: T; label: string; desc?: string }[]; name: string; columns?: boolean;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 text-sm font-semibold text-ink">{legend}</legend>
      {hint && <p className="mb-2 text-xs text-muted">{hint}</p>}
      <div className={cx('flex gap-2', columns ? 'flex-col' : 'flex-wrap')}>
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={cx(
                'flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[0.95rem] transition focus-within:ring-2 focus-within:ring-focus',
                checked ? 'border-forest bg-forest-soft font-semibold text-forest' : 'border-line bg-surface text-ink hover:bg-surface-2',
              )}
            >
              <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} className="sr-only" />
              <span aria-hidden="true" className={cx('grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', checked ? 'border-forest' : 'border-muted')}>
                {checked && <span className="h-2 w-2 rounded-full bg-forest" />}
              </span>
              <span className="min-w-0">
                {o.label}
                {o.desc && <span className="block text-xs font-normal text-muted">{o.desc}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Toggle({ label, desc, checked, onChange, id: idProp }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; id?: string }) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="font-semibold text-ink">{label}</label>
        {desc && <p id={`${id}-d`} className="text-sm text-muted">{desc}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={desc ? `${id}-d` : undefined}
        onClick={() => onChange(!checked)}
        className={cx('relative h-8 w-14 shrink-0 rounded-full border-2 transition', checked ? 'border-forest bg-forest' : 'border-muted bg-surface-2')}
      >
        <span className={cx('absolute top-0.5 h-6 w-6 rounded-full bg-surface shadow transition-all', checked ? 'left-[26px]' : 'left-0.5')} />
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  );
}

export function Notice({ tone = 'info', children, title }: { tone?: 'info' | 'amber' | 'danger' | 'ok'; children: ReactNode; title?: string }) {
  const cls = { info: 'border-info bg-info-soft', amber: 'border-amber bg-amber-soft', danger: 'border-danger bg-danger-soft', ok: 'border-ok bg-ok-soft' }[tone];
  const ic = { info: <Info size={18} />, amber: <TriangleAlert size={18} />, danger: <CircleAlert size={18} />, ok: <CircleCheck size={18} /> }[tone];
  const txt = { info: 'text-info', amber: 'text-amber', danger: 'text-danger', ok: 'text-ok' }[tone];
  return (
    <div className={cx('flex gap-3 rounded-xl border-l-4 p-3 text-sm text-ink', cls)} role={tone === 'danger' ? 'alert' : undefined}>
      <span className={cx('mt-0.5 shrink-0', txt)}>{ic}</span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-ink">{children}</div>
      </div>
    </div>
  );
}

export function PageHeader({ title, intro, children, eyebrow }: { title: string; intro?: ReactNode; children?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-forest">{eyebrow}</p>}
        <h1 tabIndex={-1} id="page-title" className="font-display text-[1.75rem] font-bold leading-tight text-ink outline-none sm:text-[2rem]" style={{ textWrap: 'balance' }}>
          {title}
        </h1>
        {intro && <p className="mt-1 text-[0.98rem] text-muted">{intro}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone }) {
  const color = tone === 'danger' ? 'text-danger' : tone === 'amber' ? 'text-amber' : tone === 'ok' ? 'text-ok' : 'text-ink';
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={cx('font-display text-2xl font-bold tabular-nums', color)}>{value}</p>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  );
}

export function fmtDate(iso: string, withTime = false) {
  if (!iso) return '';
  const d = iso.length === 10 ? new Date(iso + 'T12:00:00') : new Date(iso);
  return withTime
    ? d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
