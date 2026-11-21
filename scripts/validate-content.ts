/**
 * Validates bundled content. Fails (exit 1) on schema errors, unknown swap ids, duplicate ids,
 * forbidden wording, or unregistered article files.
 *
 *   npm run validate-content            # dev: counts and PENDING are warnings
 *   npm run validate-content -- --release   # release: full counts and zero PENDING required
 *
 * Set ALLOW_UNREVIEWED_CONTENT=true to allow PENDING items in a release run (dev builds only).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { validateContent } from '../src/content/validate';

const root = join(__dirname, '..', 'src', 'content');
const readJson = (path: string): unknown => JSON.parse(readFileSync(join(root, path), 'utf8'));

const release = process.argv.includes('--release');
const allowUnreviewed = process.env.ALLOW_UNREVIEWED_CONTENT === 'true';

const articleFiles = readdirSync(join(root, 'articles')).filter(f => f.endsWith('.json'));
const indexSource = readFileSync(join(root, 'index.ts'), 'utf8');
const unregistered = articleFiles.filter(f => !indexSource.includes(`./articles/${f}`));

const result = validateContent(
  {
    foods: readJson('foods.json'),
    plans: {
      fattyLiver: readJson('plans/fattyLiver.json'),
      uricAcid: readJson('plans/uricAcid.json'),
      both: readJson('plans/both.json'),
    },
    tips: {
      fattyLiver: readJson('tips/fattyLiver.json'),
      uricAcid: readJson('tips/uricAcid.json'),
    },
    articles: articleFiles.map(f => readJson(`articles/${f}`)),
  },
  { release, allowUnreviewed },
);

for (const file of unregistered) {
  result.errors.push(`articles/${file} is not imported in src/content/index.ts`);
}

result.warnings.forEach(w => console.warn(`warn  ${w}`));
result.errors.forEach(e => console.error(`error ${e}`));
console.warn(
  `content: ${result.errors.length} errors, ${result.warnings.length} warnings, ` +
    `${result.pendingCount} PENDING (${release ? 'release' : 'dev'} mode)`,
);
process.exit(result.errors.length > 0 ? 1 : 0);
