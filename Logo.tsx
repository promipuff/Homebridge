export function LogoMark({ size = 36 }: { size?: number }) {
  // A roofline resting on a bridge arch: home, connected.
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="11" fill="var(--forest)" />
      <path d="M9 19.5 20 10l11 9.5" fill="none" stroke="var(--forest-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 31h24" stroke="var(--forest-ink)" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 31v-5.5a8 8 0 0 1 16 0V31" fill="none" stroke="var(--sage)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="font-display text-xl font-bold tracking-tight text-ink">
          Home<span className="text-forest">Bridge</span>
        </span>
      )}
    </span>
  );
}
