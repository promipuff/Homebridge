// Generates src/icons.tsx from the Lucide SVG sources (ISC license).
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2];
const OUT = process.argv[3];
const names = [
  'house', 'building', 'building-complex', 'users', 'graduation-cap', 'bed-double', 'circle-question-mark', 'key-round',
  'layout-dashboard', 'calculator', 'wrench', 'activity', 'thermometer', 'droplets', 'droplet', 'wind',
  'flame', 'alarm-smoke', 'triangle-alert', 'bell', 'map-pin', 'search', 'bookmark', 'bookmark-check',
  'settings', 'accessibility', 'type', 'contrast', 'languages', 'trash', 'rotate-ccw', 'plus', 'check',
  'x', 'chevron-right', 'chevron-left', 'phone', 'globe', 'clock', 'shield-check', 'info', 'camera',
  'calendar', 'message-square', 'zap', 'gauge', 'wifi-off', 'wifi', 'list-checks', 'play', 'volume-2',
  'sun', 'moon', 'monitor', 'pencil', 'external-link', 'circle-check', 'circle-alert', 'funnel', 'leaf',
  'piggy-bank', 'utensils', 'bus', 'scale', 'heart-handshake', 'plug', 'refresh-cw', 'file-text',
  'file-clock', 'sliders-horizontal', 'user', 'arrow-right', 'copy', 'lock', 'door-open', 'lightbulb', 'bath',
  'menu', 'house-plus', 'warehouse', 'snowflake', 'cloud', 'tag', 'eye', 'square-pen', 'flask-conical', 'car', 'siren', 'shield-alert', 'construction', 'cloud-rain', 'zap-off', 'eye-off',
];

const toPascal = (s) => s.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
let out = `// AUTO-GENERATED from Lucide icons (https://lucide.dev, ISC license). Do not edit by hand.\n`;
out += `import type { SVGProps } from 'react';\n\n`;
out += `export type IconProps = SVGProps<SVGSVGElement> & { size?: number; label?: string };\n\n`;
out += `function make(body: string) {\n  return function Icon({ size = 20, label, ...rest }: IconProps) {\n    return (\n      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false" {...rest} dangerouslySetInnerHTML={{ __html: body }} />\n    );\n  };\n}\n\n`;
const missing = [];
for (const n of names) {
  const f = path.join(SRC, `${n}.svg`);
  if (!fs.existsSync(f)) { missing.push(n); continue; }
  const svg = fs.readFileSync(f, 'utf8');
  const body = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*\n\s*/g, '');
  out += `export const ${toPascal(n)} = make(${JSON.stringify(body)});\n`;
}
fs.writeFileSync(OUT, out);
if (missing.length) { console.error('Missing icons:', missing.join(', ')); process.exit(1); }
console.log(`Wrote ${names.length} icons`);
