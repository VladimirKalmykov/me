import { readFile, stat } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(project, 'dist');
const routes = ['', 'en'];
const external = /^(?:https?:|mailto:|tel:|data:)/i;

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

for (const route of routes) {
  const path = join(dist, route, 'index.html');
  const html = await readFile(path, 'utf8');
  const lang = route.startsWith('en') ? 'en' : 'ru';
  if (!html.startsWith('<!doctype html>')) throw new Error(`Missing doctype: ${route}`);
  if (!html.includes(`<html lang="${lang}">`)) throw new Error(`Wrong language: ${route}`);
  if (/\{\{[^}]+\}\}/.test(html)) throw new Error(`Unresolved variable: ${route}`);
  if (lang === 'en' && /[А-Яа-яЁё]/.test(html)) throw new Error(`Russian copy in ${route}`);
  if ((html.match(/data-skill-scene/g) || []).length !== 6) throw new Error(`Missing expertise sections: ${route}`);
  if ((html.match(/data-chapter=/g) || []).length !== 5) throw new Error(`Missing chronology chapters: ${route}`);
  if (!html.includes('href="https://t.me/xperier"') || !html.includes('mailto:vladimirkalmykov16@yandex.ru')) throw new Error(`Missing contact: ${route}`);
  if (!html.includes('href="https://www.linkedin.com/in/vladimirkalmykov/"')) throw new Error(`Missing LinkedIn: ${route}`);
  if (!html.includes('AST') || !html.includes('Data Matrix')) throw new Error(`Missing SmartPack case detail: ${route}`);
  if (!html.includes(lang === 'ru' ? '1 млрд' : '1 billion')) throw new Error(`Missing SmartPack outcome: ${route}`);
  const canonical = `https://vladimirkalmykov.github.io/me/${route ? route + '/' : ''}`;
  if (!html.includes(`<meta property="og:url" content="${canonical}">`)) throw new Error(`Wrong social URL: ${route}`);
  if (!html.includes('<meta property="og:type" content="website">')) throw new Error(`Wrong social type: ${route}`);
  if (!html.includes('<meta name="twitter:card" content="summary_large_image">')) throw new Error(`Missing large social card: ${route}`);
  const image = html.match(/<meta property="og:image" content="([^"]+)">/)?.[1];
  if (!image?.startsWith(`https://vladimirkalmykov.github.io/me/assets/og-${lang}.png?v=`)) throw new Error(`Wrong social image: ${route}`);
  const png = await readFile(join(dist, 'assets', `og-${lang}.png`));
  if (png.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630) {
    throw new Error(`Invalid social card: ${lang}`);
  }

  for (const [, address] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (external.test(address)) continue;
    if (address.startsWith('#')) {
      if (!html.includes(`id="${address.slice(1)}"`)) throw new Error(`Broken anchor ${address} in ${route}`);
      continue;
    }
    const clean = address.split(/[?#]/, 1)[0];
    const target = resolve(dirname(path), clean);
    if (!target.startsWith(dist)) throw new Error(`Link escapes dist: ${address} in ${route}`);
    const candidate = clean.endsWith('/') ? join(target, 'index.html') : target;
    if (!await exists(candidate)) throw new Error(`Missing link ${address} in ${route}`);
  }
  const role = route.includes('frontend') ? 'frontend' : route.includes('fullstack') ? 'fullstack' : null;
  for (const pdf of role ? [role] : ['frontend', 'fullstack']) {
    if (!html.includes(`pdf/${pdf}-${lang}.pdf`)) throw new Error(`Missing PDF ${pdf}/${lang} in ${route}`);
  }
  process.stdout.write(`Verified /${route ? route + '/' : ''}\n`);
}

for (const lang of ['ru', 'en']) {
  const alias = await readFile(join(dist, `resume-${lang}.pdf`));
  const frontend = await readFile(join(dist, 'pdf', `frontend-${lang}.pdf`));
  if (!alias.equals(frontend)) throw new Error(`Legacy PDF alias differs: ${lang}`);
}

for (const privatePath of ['resume.txt', 'PRODUCT.md', 'DESIGN.md', 'templates', 'content', 'prototype']) {
  if (await exists(join(dist, privatePath))) throw new Error(`Private source published: ${privatePath}`);
}
