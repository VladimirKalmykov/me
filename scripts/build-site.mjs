import { readFile, writeFile, copyFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { profiles } from '../content/profiles.mjs';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(project, 'dist');
const template = await readFile(join(project, 'templates/portfolio.html'), 'utf8');
const assetVersion = createHash('sha256')
  .update(await readFile(join(project, 'css/portfolio.css')))
  .digest('hex')
  .slice(0, 10);
const scriptVersion = createHash('sha256')
  .update(await readFile(join(project, 'js/portfolio.js')))
  .digest('hex')
  .slice(0, 10);
const siteBase = 'https://vladimirkalmykov.github.io/me/';
const socialVersions = Object.fromEntries(await Promise.all(['ru', 'en'].map(async (lang) => [
  lang,
  createHash('sha256').update(await readFile(join(project, `assets/og-${lang}.png`))).digest('hex').slice(0, 10)
])));
const translations = {
  ru: JSON.parse(await readFile(join(project, 'content/ru.json'), 'utf8')),
  en: JSON.parse(await readFile(join(project, 'content/en.json'), 'utf8'))
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function route(profile, lang) {
  const parts = [];
  if (lang === 'en') parts.push('en');
  if (profile !== 'general') parts.push(profile);
  return parts.join('/');
}

function href(root, profile, lang) {
  const destination = route(profile, lang);
  return root + (destination ? destination + '/' : '');
}

function pdfLinks(root, profile, lang) {
  const roles = profile === 'general' ? ['frontend', 'fullstack'] : [profile];
  return roles.map((role) => {
    const label = role === 'frontend' ? 'Frontend Tech Lead' : 'Fullstack Developer';
    const filename = `Vladimir-Kalmykov-${role === 'frontend' ? 'Frontend' : 'Fullstack'}-${lang}.pdf`;
    return `<a href="${root}pdf/${role}-${lang}.pdf" download="${filename}">${label} <span aria-hidden="true">↓</span></a>`;
  }).join('');
}

function page(profile, lang) {
  const directory = route(profile, lang);
  const root = '../'.repeat(directory ? directory.split('/').length : 0) || './';
  const otherLang = lang === 'ru' ? 'en' : 'ru';
  const copy = profiles[profile][lang];
  const dictionary = { ...translations[lang] };
  dictionary.t125 = lang === 'ru' ? 'Инженерное портфолио · 2026' : 'Engineering portfolio · 2026';
  const values = {
    ...dictionary,
    lang,
    root,
    assetVersion,
    scriptVersion,
    ogLocale: lang === 'ru' ? 'ru_RU' : 'en_US',
    siteName: lang === 'ru' ? 'Владимир Калмыков' : 'Vladimir Kalmykov',
    pageUrl: siteBase + directory + (directory ? '/' : ''),
    socialImage: `${siteBase}assets/og-${lang}.png?v=${socialVersions[lang]}`,
    socialImageAlt: lang === 'ru' ? 'Владимир Калмыков — инженерное портфолио' : 'Vladimir Kalmykov — engineering portfolio',
    title: copy.title,
    description: copy.description,
    profileRole: copy.role,
    profileThesis: copy.thesis,
    profileLead: copy.lead,
    profileBody: copy.body,
    ruHref: href(root, profile, 'ru'),
    enHref: href(root, profile, 'en'),
    languageHref: href(root, profile, otherLang),
    languageLabel: lang === 'ru' ? 'Switch to English' : 'Switch to Russian',
    otherLang,
    otherLangUpper: otherLang.toUpperCase(),
    pdfLinks: pdfLinks(root, profile, lang)
  };
  const raw = new Set(['pdfLinks']);
  const rendered = template.replace(/\{\{([a-zA-Z0-9]+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Missing template variable: ${key} (${lang}/${profile})`);
    return raw.has(key) ? values[key] : escapeHtml(values[key]);
  });
  if (/\{\{[^}]+\}\}/.test(rendered)) throw new Error(`Unresolved token in ${directory || 'root'}`);
  if (lang === 'en' && /[А-Яа-яЁё]/.test(rendered)) throw new Error(`Russian text in English page: ${directory}`);
  return { directory, rendered };
}

async function put(relative, contents) {
  const target = join(project, relative);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents);
}

async function stage(relative, source) {
  const target = join(output, relative);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(join(project, source), target);
}

if (!output.startsWith(project + sep)) throw new Error('Refusing to clear a directory outside the project');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const profile of ['general']) {
  for (const lang of ['ru', 'en']) {
    const { directory, rendered } = page(profile, lang);
    const relative = join(directory, 'index.html');
    await put(relative, rendered.replace('<!doctype html>', '<!doctype html>\n<!-- Generated from templates/portfolio.html; edit the template and content files. -->'));
    await mkdir(dirname(join(output, relative)), { recursive: true });
    await writeFile(join(output, relative), rendered);
    process.stdout.write(`Built ${relative}\n`);
  }
}

for (const [target, source] of [
  ['css/portfolio.css', 'css/portfolio.css'],
  ['css/portfolio-tokens.css', 'css/portfolio-tokens.css'],
  ['js/portfolio.js', 'js/portfolio.js'],
  ['js/hero-background.js', 'js/hero-background.js'],
  ['vendor/threejs.min.js', 'vendor/threejs.min.js'],
  ['vendor/gsap-3.15.0.min.js', 'vendor/gsap-3.15.0.min.js'],
  ['vendor/README.md', 'vendor/README.md'],
  ['favicon.svg', 'favicon.svg'],
  ['assets/avatar.webp', 'assets/avatar.webp'],
  ['assets/avatar-square.webp', 'assets/avatar-square.webp'],
  ['assets/og-ru.png', 'assets/og-ru.png'],
  ['assets/og-en.png', 'assets/og-en.png'],
  ['assets/fonts/Geologica-variable.ttf', 'assets/fonts/Geologica-variable.ttf'],
  ['assets/fonts/Geologica-OFL.txt', 'assets/fonts/Geologica-OFL.txt']
]) await stage(target, source);

for (const role of ['frontend', 'fullstack']) {
  for (const lang of ['ru', 'en']) {
    const filename = `${role}-${lang}.pdf`;
    const source = join(project, 'output/pdf', filename);
    await mkdir(join(project, 'pdf'), { recursive: true });
    await copyFile(source, join(project, 'pdf', filename));
    await stage('pdf/' + filename, 'pdf/' + filename);
  }
}

for (const lang of ['ru', 'en']) {
  const filename = `resume-${lang}.pdf`;
  await copyFile(join(project, 'output/pdf', `frontend-${lang}.pdf`), join(project, filename));
  await stage(filename, filename);
}
await writeFile(join(output, '.nojekyll'), '');
