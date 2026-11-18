import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pages, render, route } from '../.ssr/entry-server.js';

const base = process.env.SITE_BASE || '/';
if (!base.startsWith('/') || !base.endsWith('/')) throw new Error('SITE_BASE must start and end with /.');
const site = process.env.SITE_URL ? new URL(process.env.SITE_URL.replace(/[/]*$/, '/')) : null;
const template = await readFile('dist/index.html', 'utf8');
if (!template.includes('<!--app-html-->')) throw new Error('Missing prerender placeholder.');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const absolute = path => site ? new URL(path.slice(base.length), site).href : '';
const urls = [];

async function writePage(page, destination) {
  const output = await render(page);
  const canonical = absolute(output.path);
  const socialImage = site ? absolute(base + 'social-preview.png') : base + 'social-preview.png';
  const other = { ...page, locale: page.locale === 'en' ? 'zh' : 'en' };
  const alternate = absolute(route(other));
  const head = '<meta name="description" content="' + escape(output.description) + '">' +
    '<meta property="og:title" content="' + escape(output.title) + '">' +
    '<meta property="og:description" content="' + escape(output.description) + '">' +
    '<meta property="og:type" content="website">' +
    '<meta property="og:image" content="' + escape(socialImage) + '">' +
    '<meta property="og:image:type" content="image/png">' +
    '<meta property="og:image:width" content="1200">' +
    '<meta property="og:image:height" content="630">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<meta name="twitter:image" content="' + escape(socialImage) + '">' +
    (site && page.kind !== 'missing' ? '<link rel="canonical" href="' + escape(canonical) + '">' +
      '<meta property="og:url" content="' + escape(canonical) + '">' +
      '<link rel="alternate" hreflang="' + (page.locale === 'en' ? 'zh-CN' : 'en') + '" href="' + escape(alternate) + '">' : '') +
    (page.kind === 'missing' ? '<meta name="robots" content="noindex">' : '');
  const html = template.replace('lang="en"', 'lang="' + (page.locale === 'zh' ? 'zh-CN' : 'en') + '"')
    .replace(/<title>.*?<[/]title>/, () => '<title>' + escape(output.title) + '</title>')
    .replace('<!--page-head-->', () => head).replace('<!--app-html-->', () => output.html)
    .replace('<!--page-data-->', () => '<script id="page-data" type="application/json">' + JSON.stringify(page) + '</script>');
  const file = destination || join('dist', output.path.slice(base.length), 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
  if (site && !destination) urls.push(canonical);
}
for (const page of pages) await writePage(page);
await writePage({ locale: 'en', kind: 'home' }, 'dist/index.html');
await writePage({ locale: 'en', kind: 'missing' }, 'dist/404.html');
if (site) {
  await writeFile('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map(url => '<url><loc>' + escape(url) + '</loc></url>').join('') + '</urlset>');
  await writeFile('dist/robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + new URL('sitemap.xml', site).href + '\n');
}
console.log('Prerendered ' + pages.length + ' bilingual pages plus root and 404.');
