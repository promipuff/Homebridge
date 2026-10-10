import { useEffect, type ReactNode } from 'react';
import { useStore } from './store';
import type { View } from './types';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { HomePage } from './components/HomeStatus';
import { UtilitiesPage } from './components/Utilities';
import { MaintenancePage } from './components/Maintenance';
import { ResourcesPage } from './components/Resources';
import { SettingsPage } from './components/Settings';
import { Logo } from './components/Logo';
import { cx } from './components/ui';
import { situationLabel } from './lib/personalize';
import { Activity, Bell, Calculator, CircleAlert, CircleCheck, HeartHandshake, Info, LayoutDashboard, Settings, Wrench } from './icons';

const NAV: { view: View; key: string; icon: ReactNode }[] = [
  { view: 'dashboard', key: 'nav.dashboard', icon: <LayoutDashboard size={22} /> },
  { view: 'home', key: 'nav.home', icon: <Activity size={22} /> },
  { view: 'utilities', key: 'nav.utilities', icon: <Calculator size={22} /> },
  { view: 'maintenance', key: 'nav.maintenance', icon: <Wrench size={22} /> },
  { view: 'resources', key: 'nav.resources', icon: <HeartHandshake size={22} /> },
  { view: 'settings', key: 'nav.settings', icon: <Settings size={22} /> },
];

export function App() {
  const { state, view, go, t, toasts } = useStore();

  useEffect(() => {
    const el = document.getElementById('page-title');
    if (el && state.onboarded) el.focus({ preventScroll: true });
    document.title = state.onboarded ? `${t(`nav.${view}`)} · HomeBridge` : 'HomeBridge';
  }, [view, state.onboarded, t]);

  const toastRegion = (
    <div className="pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4" style={{ bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }} aria-live="polite" role="status">
      {toasts.map((tt) => (
        <div key={tt.id} className="toast pointer-events-auto flex max-w-md items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-bg shadow-lg">
          {tt.tone === 'warn' ? <CircleAlert size={18} /> : tt.tone === 'info' ? <Info size={18} /> : <CircleCheck size={18} />}
          {tt.text}
        </div>
      ))}
    </div>
  );

  if (!state.onboarded) {
    return (
      <>
        <a href="#main" className="skip-link">{t('skip')}</a>
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <Onboarding mode="new" />
        </main>
        {toastRegion}
      </>
    );
  }

  const activeAlerts = state.alerts.filter((a) => !a.acknowledged);
  const urgent = activeAlerts.some((a) => a.severity === 'urgent');

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a href="#main" className="skip-link">{t('skip')}</a>

      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r border-line bg-surface px-4 py-6 lg:flex" aria-label="Sidebar">
        <button type="button" onClick={() => go('dashboard')} className="self-start rounded-lg" aria-label="HomeBridge, go to dashboard"><Logo /></button>
        <nav aria-label="Main">
          <ul className="grid gap-1">
            {NAV.map((n) => (
              <li key={n.view}>
                <button
                  type="button"
                  onClick={() => go(n.view)}
                  aria-current={view === n.view ? 'page' : undefined}
                  className={cx('flex min-h-[46px] w-full items-center gap-3 rounded-xl px-3 font-semibold transition', view === n.view ? 'bg-forest text-forest-ink' : 'text-ink hover:bg-surface-2')}
                >
                  {n.icon}
                  {t(n.key)}
                  {n.view === 'dashboard' && activeAlerts.length > 0 && (
                    <span className={cx('ml-auto rounded-full px-2 text-xs font-bold', urgent ? 'bg-danger text-white' : 'bg-amber text-white')}>{activeAlerts.length}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto rounded-xl bg-surface-2 p-3 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Your home</p>
          <p className="font-semibold">{situationLabel(state.profile)}</p>
          <p className="mt-2 text-xs text-muted">Prototype · simulated data</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky z-30 flex items-center justify-between gap-3 border-b border-line bg-bg px-4 py-3 backdrop-blur lg:hidden" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
          <button type="button" onClick={() => go('dashboard')} className="rounded-lg" aria-label="HomeBridge, go to dashboard"><Logo /></button>
          <button type="button" onClick={() => go('dashboard')} className="relative grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface" aria-label={`${activeAlerts.length} active alerts`}>
            <Bell size={20} />
            {activeAlerts.length > 0 && <span className={cx('absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-xs font-bold text-white', urgent ? 'bg-danger' : 'bg-amber')}>{activeAlerts.length}</span>}
          </button>
        </header>

        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-12 lg:pt-8">
          {view === 'dashboard' && <Dashboard />}
          {view === 'home' && <HomePage />}
          {view === 'utilities' && <UtilitiesPage />}
          {view === 'maintenance' && <MaintenancePage />}
          {view === 'resources' && <ResourcesPage />}
          {view === 'settings' && <SettingsPage />}
        </main>

        <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <ul className="grid grid-cols-6">
            {NAV.map((n) => (
              <li key={n.view}>
                <button
                  type="button"
                  onClick={() => go(n.view)}
                  aria-current={view === n.view ? 'page' : undefined}
                  aria-label={t(n.key)}
                  className={cx('flex min-h-[60px] w-full flex-col items-center justify-center gap-0.5 px-0.5 text-[0.68rem] font-semibold leading-tight', view === n.view ? 'text-forest' : 'text-muted')}
                >
                  <span className={cx('grid h-8 w-12 place-items-center rounded-full', view === n.view && 'bg-forest-soft')}>{n.icon}</span>
                  <span className="max-w-full truncate">{t(n.view === 'maintenance' ? 'nav.maintenance.short' : n.key)}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {toastRegion}
    </div>
  );
}
