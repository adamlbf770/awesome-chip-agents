import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const data = JSON.parse(await readFile('src/generated/catalog.json', 'utf8'));
const base = process.env.SITE_BASE || '/';
const socialImage = 'social-preview.png';
await access(join('dist', socialImage));
let count = 0;
for (const locale of ['en', 'zh']) {
  for (const resource of data.resources) {
    const path = join('dist', locale, 'resources', resource.id, 'index.html');
    const html = await readFile(path, 'utf8');
    assert.ok(html.includes('id="page-data"'), path + ': hydration data missing');
    assert.ok(html.includes('property="og:image"') && html.includes('name="twitter:card" content="summary_large_image"'), path + ': social preview metadata missing');
    assert.ok(html.includes(resource.name.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;')), path + ': resource not rendered');
    assert.ok(!html.includes('<!--app-html-->'), path + ': unrendered page');
    assert.ok(!html.includes('<!-- metadata'), path + ': editorial metadata leaked');
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1].split(/[?#]/)[0];
      if (href.startsWith(base) && !href.startsWith('//')) {
        await access(join('dist', href.slice(base.length), href.endsWith('/') ? 'index.html' : ''));
      }
    }
    count++;
  }
}
await access('dist/404.html');
console.log('Verified ' + count + ' resource pages, hydration data, and internal links.');
