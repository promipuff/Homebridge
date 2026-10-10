import type { ReactNode } from 'react';
import { useStore } from '../store';
import type { SensorInstance, SensorKind, SimEventKind } from '../types';
import { SENSOR_INFO, isRenter, sensorOptions } from '../lib/personalize';
import { EVENT_INFO, alertFor, currentReadings, dailySeries, hourlyTemperature, type Reading } from '../lib/sensors';
import { SENSOR_SCOPE_LABEL } from '../lib/labels';
import { uid } from '../lib/defaults';
import { AlertCard } from './Alerts';
import { BarChart, MiniLine } from './charts';
import { Button, Card, CardTitle, Notice, PageHeader, SourceBadge, Toggle, cx, fmtDate } from './ui';
import { Activity, AlarmSmoke, Droplet, Droplets, FlaskConical, Gauge, Plus, RotateCcw, Thermometer, Trash, Wind, WifiOff, Zap } from '../icons';

const KIND_ICON: Record<SensorKind, ReactNode> = {
  temperature: <Thermometer size={20} />, humidity: <Droplets size={20} />, air_quality: <Wind size={20} />, leak: <Droplet size={20} />,
  smoke_co: <AlarmSmoke size={20} />, electric_meter: <Zap size={20} />, water_meter: <Gauge size={20} />,
};

function ReadingTile({ r, name }: { r: Reading; name: string }) {
  const tone = r.status === 'offline' ? 'border-line' : r.level === 'alert' ? 'border-danger' : r.level === 'watch' ? 'border-amber' : 'border-line';
  const levelText = r.status === 'offline' ? 'Offline' : r.level === 'alert' ? 'Alert' : r.level === 'watch' ? 'Watch' : 'Normal';
  const levelCls = r.status === 'offline' ? 'text-muted' : r.level === 'alert' ? 'text-danger' : r.level === 'watch' ? 'text-amber' : 'text-ok';
  return (
    <li className={cx('flex min-w-0 flex-col gap-1 rounded-xl border-2 bg-surface p-3', tone)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-ink">
          <span className="text-forest">{r.status === 'offline' ? <WifiOff size={18} /> : KIND_ICON[r.kind]}</span>
          <span className="truncate">{name || SENSOR_INFO[r.kind].label}</span>
        </span>
        <span className={cx('text-xs font-bold uppercase', levelCls)}>{levelText}</span>
      </div>
      <p className="font-display text-2xl font-bold tabular-nums text-ink">
        {r.value}
        <span className="ml-1 text-sm font-normal text-muted">{typeof r.value === 'number' ? r.unit : ''}</span>
      </p>
      <p className="text-xs text-muted">{r.note}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-xs text-muted">
        <SourceBadge source={r.source} />
        <span>{SENSOR_SCOPE_LABEL[r.scope]}</span>
        <span>· {fmtDate(r.timestamp, true)}</span>
      </div>
    </li>
  );
}

export function HomeStatusPanel({ compact = false }: { compact?: boolean }) {
  const { state, go } = useStore();
  const readings = currentReadings(state.sensors, state.events);
  const names = Object.fromEntries(state.sensors.map((s) => [s.id, s.name]));
  const own = readings.filter((r) => r.scope !== 'building');
  const building = readings.filter((r) => r.scope === 'building');
  return (
    <Card>
      <CardTitle icon={<Activity size={20} />} action={compact ? <Button size="sm" variant="ghost" onClick={() => go('home')}>Details</Button> : undefined}>
        Home status
      </CardTitle>
      {readings.length === 0 ? (
        <p className="text-muted">No sensors added. HomeBridge works without them.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {own.length > 0 && (
            <div>
              {building.length > 0 && <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted">Your {state.profile.situation === 'shared' ? 'space' : 'unit'}</h3>}
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{own.map((r) => <ReadingTile key={r.sensorId} r={r} name={names[r.sensorId]} />)}</ul>
            </div>
          )}
          {building.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted">Building-wide (shared by management)</h3>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{building.map((r) => <ReadingTile key={r.sensorId} r={r} name={names[r.sensorId]} />)}</ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function HomePage() {
  const { state, update, toast } = useStore();
  const p = state.profile;
  const { options, guidance } = sensorOptions(p);
  const demo = state.settings.demoMode;
  const kinds = new Set(state.sensors.map((s) => s.kind));

  const addSensor = (o: (typeof options)[number]) => {
    const s: SensorInstance = { id: uid('sim-' + o.kind), kind: o.kind, scope: o.scope, source: 'simulated', status: 'online', name: '' };
    update((st) => ({ ...st, sensors: [...st.sensors, s] }));
    toast(`${SENSOR_INFO[o.kind].label} added (simulated).`);
  };
  const removeSensor = (id: string) => update((st) => ({ ...st, sensors: st.sensors.filter((s) => s.id !== id) }));

  const simulate = (kind: SimEventKind) => {
    const needs = EVENT_INFO[kind].needs;
    const sensor = state.sensors.find((s) => needs.includes(s.kind)) ?? state.sensors[0];
    const at = new Date().toISOString();
    update((st) => ({
      ...st,
      events: [...st.events.filter((e) => e.kind !== kind), { id: uid('ev'), kind, at }],
      alerts: [alertFor(kind, sensor?.id, isRenter(st.profile), uid('al'), at), ...st.alerts],
    }));
    toast(`Simulated: ${EVENT_INFO[kind].label}. An alert was created.`, 'info');
  };
  const clearEvents = () => {
    update((st) => ({ ...st, events: [], alerts: st.alerts.map((a) => (a.source === 'simulated' ? { ...a, acknowledged: true } : a)) }));
    toast('Simulated readings back to normal.');
  };

  const electric = kinds.has('electric_meter');
  const water = kinds.has('water_meter');
  const temp = kinds.has('temperature');
  const eSeries = dailySeries('electric_meter', state.events);
  const wSeries = dailySeries('water_meter', state.events);
  const tSeries = hourlyTemperature(state.events);
  const alerts = state.alerts.filter((a) => a.source === 'simulated').slice(0, 6);

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader eyebrow="Smart home & IoT" title="My home" intro={guidance}>
        <SourceBadge source="simulated" />
      </PageHeader>

      <Notice title="About this data">
        All readings here are <strong>simulated</strong> for the prototype. No real devices are connected. Each reading shows its source, scope and time so live data can replace it later.
      </Notice>

      <Card>
        <Toggle
          label="Demo mode (simulated readings)"
          desc="Turn off to see how HomeBridge looks with no sensors at all."
          checked={demo}
          onChange={(v) => update((s) => ({ ...s, settings: { ...s.settings, demoMode: v } }))}
        />
      </Card>

      {demo && <HomeStatusPanel />}

      {demo && (electric || water || temp) && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-label="Usage charts">
          {electric && (
            <Card>
              <CardTitle icon={<Zap size={20} />} action={<SourceBadge source="simulated" />}>Electricity, last 14 days</CardTitle>
              <BarChart data={eSeries} unit="kWh" summary={`Daily electricity over 14 days ranged from ${Math.min(...eSeries.map((d) => d.value))} to ${Math.max(...eSeries.map((d) => d.value))} kWh.`} />
            </Card>
          )}
          {water && (
            <Card>
              <CardTitle icon={<Gauge size={20} />} action={<SourceBadge source="simulated" />}>Water, last 14 days</CardTitle>
              <BarChart data={wSeries} unit="gal" summary={`Daily water use over 14 days. Today is ${wSeries[wSeries.length - 1].value} gallons${wSeries[wSeries.length - 1].flagged ? ', which is unusually high' : ''}.`} />
            </Card>
          )}
          {temp && (
            <Card>
              <CardTitle icon={<Thermometer size={20} />} action={<SourceBadge source="simulated" />}>Indoor temperature, last 24 hours</CardTitle>
              <MiniLine data={tSeries} height={120} threshold={85} summary={`Indoor temperature over the last 24 hours, now ${tSeries[tSeries.length - 1].value} degrees Fahrenheit. Dashed line marks 85 degrees.`} />
              <p className="mt-2 text-sm text-muted">Now {tSeries[tSeries.length - 1].value} °F. Dashed line marks 85 °F.</p>
            </Card>
          )}
        </section>
      )}

      {demo && (
        <Card>
          <CardTitle icon={<FlaskConical size={20} />} action={state.events.length > 0 ? <Button size="sm" onClick={clearEvents}><RotateCcw size={16} /> Back to normal</Button> : undefined}>
            Simulate an event
          </CardTitle>
          <p className="mb-3 text-sm text-muted">Each button creates a simulated reading and an alert, so you can see how HomeBridge responds.</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(EVENT_INFO) as SimEventKind[]).map((k) => {
              const info = EVENT_INFO[k];
              const ok = info.needs.length === 0 ? state.sensors.length > 0 : info.needs.some((n) => kinds.has(n));
              const addable = options.find((o) => info.needs.includes(o.kind) && o.install !== 'provided');
              const active = state.events.some((e) => e.kind === k);
              return (
                <div key={k} className="flex flex-col gap-1">
                  <Button onClick={() => simulate(k)} disabled={!ok} className="justify-start text-left" aria-pressed={active}>
                    {active ? '● ' : ''}{info.button}
                  </Button>
                  {!ok && (
                    <p className="text-xs text-muted">
                      Needs a {info.needs.length ? SENSOR_INFO[info.needs[0]].label.toLowerCase() : 'sensor'}.
                      {addable && <> <button type="button" className="font-semibold text-forest underline" onClick={() => addSensor(addable)}>Add a simulated one</button></>}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {alerts.length > 0 && (
        <section className="grid grid-cols-1 gap-3" aria-labelledby="recent-h">
          <h2 id="recent-h" className="font-display text-xl font-semibold">Recent events</h2>
          {alerts.map((a) => <AlertCard key={a.id} alert={a} />)}
        </section>
      )}

      <Card>
        <CardTitle icon={<Activity size={20} />}>My sensors</CardTitle>
        {state.sensors.length ? (
          <ul className="mb-4 grid gap-2">
            {state.sensors.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="text-forest">{KIND_ICON[s.kind]}</span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{s.name || SENSOR_INFO[s.kind].label}</span>
                    <span className="block text-xs text-muted">{SENSOR_SCOPE_LABEL[s.scope]} · id {s.id}</span>
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <SourceBadge source={s.source} />
                  <Button size="sm" variant="ghost" onClick={() => removeSensor(s.id)} aria-label={`Remove ${s.name || SENSOR_INFO[s.kind].label}`}><Trash size={16} /></Button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-muted">No sensors yet. You don’t need any to use HomeBridge.</p>
        )}
        <h3 className="mb-2 font-semibold">Options that fit your home</h3>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {options.map((o, i) => {
            const info = SENSOR_INFO[o.kind];
            const added = state.sensors.some((s) => s.kind === o.kind && s.scope === o.scope);
            return (
              <li key={i} className="flex flex-col gap-1 rounded-xl border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-semibold"><span className="text-forest">{KIND_ICON[o.kind]}</span>{info.label}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">
                    {o.install === 'provided' ? 'Provided by others' : o.install === 'portable' ? 'Portable' : o.install === 'plug_in' ? 'Plug-in' : 'Installed'}
                  </span>
                </div>
                <p className="text-sm text-ink"><strong>Detects:</strong> {info.detects}</p>
                <p className="text-sm text-muted"><strong>Does not:</strong> {info.notDetect}</p>
                {o.note && <p className="text-sm text-muted">{o.note}</p>}
                <p className="text-xs text-muted">Scope: {SENSOR_SCOPE_LABEL[o.scope]}</p>
                <div className="mt-1">
                  <Button size="sm" onClick={() => addSensor(o)} disabled={added || !demo}>
                    <Plus size={16} /> {added ? 'Added' : o.install === 'provided' ? 'Show shared readings (simulated)' : 'Add simulated sensor'}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
