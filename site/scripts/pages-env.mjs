import { appendFile } from 'node:fs/promises';

const [owner, repository] = (process.env.GITHUB_REPOSITORY || '').split('/');
if (!owner || !repository) throw new Error('GITHUB_REPOSITORY is required.');
const fallback = 'https://' + owner.toLowerCase() + '.github.io/' +
  (repository.toLowerCase() === owner.toLowerCase() + '.github.io' ? '' : repository + '/');
const site = new URL(process.env.SITE_URL || fallback);
if (site.protocol !== 'https:' || site.search || site.hash || site.username || site.password) {
  throw new Error('SITE_URL must be a public HTTPS URL without credentials, query, or fragment.');
}
if (!site.pathname.endsWith('/')) site.pathname += '/';
await appendFile(process.env.GITHUB_ENV, 'SITE_URL=' + site.href + '\nSITE_BASE=' + site.pathname + '\n');
console.log('Website URL: ' + site.href);
