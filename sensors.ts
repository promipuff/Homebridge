// Simulated sensor layer. Every reading carries a sensor id, timestamp, unit, scope and source,
// matching the shape a real device integration would return (see ARCHITECTURE.md).
import type { Alert, SensorInstance, SensorKind, SimEvent, SimEventKind } from '../types';
import { SENSOR_INFO } from './personalize';

export interface Reading {
  sensorId: string;
  kind: SensorKind;
  value: number | string;
  unit: string;
  timestamp: string;
  source: SensorInstance['source'];
  scope: SensorInstance['scope'];
  status: SensorInstance['status'];
  level: 'normal' | 'watch' | 'alert';
  note: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
  flagged?: boolean;
}

/** Small deterministic PRNG so the demo looks the same on every reload. */
function rand(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const has = (events: SimEvent[], k: SimEventKind) => events.some((e) => e.kind === k);

export function currentReadings(sensors: SensorInstance[], events: SimEvent[], now = new Date()): Reading[] {
  const offlineId = has(events, 'sensor_offline') ? sensors[0]?.id : undefined;
  return sensors.map((s) => {
    const r = rand(s.id + now.toISOString().slice(0, 13));
    const status: Reading['status'] = s.id === offlineId ? 'offline' : s.status;
    const base = { sensorId: s.id, kind: s.kind, unit: SENSOR_INFO[s.kind].unit, timestamp: now.toISOString(), source: s.source, scope: s.scope, status };
    if (status === 'offline') return { ...base, value: '—', level: 'watch', note: 'No data received. Check the battery or connection.' } as Reading;
    switch (s.kind) {
      case 'temperature': {
        const v = has(events, 'heat') ? 87 + Math.round(r() * 2) : 70 + Math.round(r() * 4);
        return { ...base, value: v, level: v >= 85 ? 'alert' : v >= 80 ? 'watch' : 'normal', note: v >= 85 ? 'Too warm. Heat can be dangerous indoors.' : 'Comfortable range is about 68–78 °F.' };
      }
      case 'humidity': {
        const v = has(events, 'humidity_high') ? 74 + Math.round(r() * 3) : has(events, 'leak') ? 63 : 44 + Math.round(r() * 8);
        return { ...base, value: v, level: v >= 70 ? 'alert' : v >= 60 ? 'watch' : 'normal', note: 'A common indoor target is 30–50%. Above 60% for long periods can lead to mold.' };
      }
      case 'air_quality': {
        const v = has(events, 'air_poor') ? 58 + Math.round(r() * 6) : 6 + Math.round(r() * 5);
        return { ...base, value: v, level: v > 35 ? 'alert' : v > 12 ? 'watch' : 'normal', note: 'PM2.5 only. Lower is better.' };
      }
      case 'leak': {
        const wet = has(events, 'leak');
        return { ...base, value: wet ? 'Wet' : 'Dry', level: wet ? 'alert' : 'normal', note: wet ? 'Water detected at the sensor.' : 'No water at the sensor.' };
      }
      case 'smoke_co': {
        const alarm = has(events, 'co_alarm');
        return { ...base, value: alarm ? 'CO alarm' : 'OK', level: alarm ? 'alert' : 'normal', note: alarm ? 'The connected alarm reports carbon monoxide.' : 'Alarm reports normal. Test monthly with its button.' };
      }
      case 'electric_meter': {
        const v = Math.round(28 + r() * 10);
        return { ...base, value: v, unit: 'kWh today', level: 'normal', note: 'Usage so far today.' };
      }
      case 'water_meter': {
        const spike = has(events, 'water_spike') || has(events, 'leak');
        const v = spike ? 412 : Math.round(110 + r() * 40);
        return { ...base, value: v, unit: 'gal today', level: spike ? 'alert' : 'normal', note: spike ? 'About 3× your usual daily use, with flow through the night.' : 'Usage so far today.' };
      }
    }
  });
}

export function dailySeries(kind: 'electric_meter' | 'water_meter', events: SimEvent[], days = 14, now = new Date()): SeriesPoint[] {
  const r = rand(kind + 'series');
  const out: SeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    let v = kind === 'electric_meter' ? 30 + r() * 9 + (weekend ? 5 : 0) : 120 + r() * 35 + (weekend ? 25 : 0);
    let flagged = false;
    if (i === 0 && kind === 'water_meter' && (has(events, 'water_spike') || has(events, 'leak'))) {
      v = 412;
      flagged = true;
    }
    out.push({ label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: Math.round(v), flagged });
  }
  return out;
}

export function hourlyTemperature(events: SimEvent[], now = new Date()): SeriesPoint[] {
  const r = rand('temp24');
  const out: SeriesPoint[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600000);
    const h = d.getHours();
    let v = 69 + 3 * Math.sin(((h - 9) / 24) * Math.PI * 2) + r() * 1.2;
    if (has(events, 'heat') && i < 5) v = 80 + (5 - i) * 1.5;
    out.push({ label: d.toLocaleTimeString('en-US', { hour: 'numeric' }), value: Math.round(v * 10) / 10, flagged: v >= 85 });
  }
  return out;
}

export const EVENT_INFO: Record<SimEventKind, { label: string; needs: SensorKind[]; button: string }> = {
  water_spike: { label: 'Unusual water use', needs: ['water_meter'], button: 'Simulate unusual water use' },
  leak: { label: 'Leak sensor wet', needs: ['leak'], button: 'Simulate a leak at a sensor' },
  humidity_high: { label: 'High humidity', needs: ['humidity'], button: 'Simulate high humidity' },
  heat: { label: 'High indoor temperature', needs: ['temperature'], button: 'Simulate high indoor heat' },
  air_poor: { label: 'Poor air quality', needs: ['air_quality'], button: 'Simulate poor air quality' },
  co_alarm: { label: 'CO alarm reported', needs: ['smoke_co'], button: 'Simulate a CO alarm report' },
  sensor_offline: { label: 'Sensor offline', needs: [], button: 'Simulate a sensor going offline' },
};

export function alertFor(kind: SimEventKind, sensorId: string | undefined, renter: boolean, id: string, at: string): Alert {
  const tell = renter ? 'Report it to your landlord or manager in writing and log it in Maintenance.' : 'Log it in Maintenance so you have a record.';
  const map: Record<SimEventKind, Omit<Alert, 'id' | 'createdAt' | 'source' | 'acknowledged' | 'kind' | 'sensorId'>> = {
    water_spike: {
      severity: 'warning', title: 'Water use is about 3× higher than usual',
      summary: 'Water kept flowing overnight. This can mean a running toilet, a dripping fixture or a hidden leak. It can’t tell where.',
      steps: ['Check toilets, faucets and the water heater for running or dripping water.', 'If no fixture is on, read the water meter, wait 30 minutes without using water, and read it again. Any change suggests a leak.', tell],
    },
    leak: {
      severity: 'urgent', title: 'Water detected at a leak sensor',
      summary: 'The sensor’s contacts are wet. Look at that spot now.',
      steps: ['If water is near outlets or cords, stay away and switch off power only if it is safe to reach the breaker.', 'If you know where it is and it is safe, close the fixture’s shut-off valve.', tell],
    },
    humidity_high: {
      severity: 'warning', title: 'Humidity has been above 70%',
      summary: 'Long periods of high humidity can lead to mold and musty smells.',
      steps: ['Run a bathroom or kitchen fan, or open a window if the air outside is drier.', 'Look for water stains or dampness near the sensor.', tell],
    },
    heat: {
      severity: 'urgent', title: 'Indoor temperature is above 85 °F',
      summary: 'High indoor heat can be dangerous, especially overnight.',
      steps: ['Move to the coolest room, drink water, and use fans if air conditioning is not working.', 'If the heat continues, go to a cooling center. See Resources.', 'If someone feels faint, confused or very ill, call 911.', tell],
    },
    air_poor: {
      severity: 'warning', title: 'Fine-particle (PM2.5) level is high',
      summary: 'Smoke from cooking, candles or outdoor wildfire smoke can raise PM2.5.',
      steps: ['Run the range hood or a fan that vents outside.', 'If outdoor air is smoky, keep windows closed.', 'This monitor does not measure carbon monoxide or gas.'],
    },
    co_alarm: {
      severity: 'urgent', title: 'Your connected alarm reports carbon monoxide',
      summary: 'Treat a CO alarm as an emergency. Don’t wait to confirm it in the app.',
      steps: ['Get everyone, including pets, outside to fresh air now.', 'Call 911 from outside.', 'Don’t go back in until responders say it is safe.'],
    },
    sensor_offline: {
      severity: 'info', title: 'A sensor stopped reporting',
      summary: 'HomeBridge hasn’t received data from one of your sensors.',
      steps: ['Check the battery or that it is plugged in.', 'Move it closer to your Wi-Fi hub.'],
    },
  };
  return { ...map[kind], id, kind, sensorId, createdAt: at, source: 'simulated', acknowledged: false };
}
