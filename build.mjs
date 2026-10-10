// Builds HomeBridge into one self-contained HTML file.
//   dist/homebridge.html  → artifact body (no doctype; the host wraps it)
//   dist/index.html       → standalone page for local use
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

fs.mkdirSync('dist', { recursive: true });
await build({
  entryPoints: ['src/main.tsx'], bundle: true, minify: true, format: 'iife', target: 'es2019',
  jsx: 'automatic', outfile: 'dist/app.js', define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'none',
});
execFileSync('./tw', ['-c', 'tailwind.config.js', '-i', 'src/styles.css', '-o', 'dist/app.css', '--minify'], { stdio: 'inherit' });

const js = fs.readFileSync('dist/app.js', 'utf8').replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync('dist/app.css', 'utf8');
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&display=swap">';
const body = `<title>HomeBridge</title>
<meta name="description" content="HomeBridge: smart housing and community support prototype">
${fonts}
<style>${css}</style>
<div id="root"></div>
<script>${js}</script>
`;
fs.writeFileSync('dist/homebridge.html', body);
fs.writeFileSync('dist/index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${body.replace('<div id="root">', '</head><body><div id="root">')}</body></html>`);
console.log(`Built dist/homebridge.html (${(body.length / 1024).toFixed(0)} KB)`);
