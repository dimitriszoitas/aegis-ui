/** Verifies deterministic source extraction and optionally every live Storybook link. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toId } from 'storybook/internal/csf';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
execFileSync(process.execPath, ['scripts/generate-component-docs.mjs', '--check'], {
  stdio: 'inherit',
});
const directory = 'src/stories/component-docs/generated';
const families = fs
  .readdirSync(directory)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')));
const labels = [
  'Tokens Used',
  'Component Guidelines/Overview',
  'Component Guidelines/Anatomy',
  'Component Guidelines/Types',
  'Component Guidelines/Variants',
  'Component Guidelines/Intent & Emphasis',
  'Component Guidelines/States',
  'Component Guidelines/Sizes',
  'Component Guidelines/Usage & Content',
  'Component Guidelines/Accessibility',
  'Component Guidelines/API & Props',
  'Component Guidelines/Use cases/In Context',
];
const ids = new Set();
for (const family of families) {
  if (ids.has(family.id)) throw new Error(`Duplicate componentId: ${family.id}`);
  ids.add(family.id);
  const wrappers = fs
    .readdirSync(`src/stories/component-docs/pages/${family.id}`)
    .filter((file) => file.endsWith('.mdx'));
  if (wrappers.length !== 12)
    throw new Error(`${family.id} has ${wrappers.length} documentation pages instead of 12.`);
  if (!family.props.length)
    throw new Error(`${family.id} has no public props. Check component resolution.`);
  for (const file of family.sourceFiles)
    if (!fs.existsSync(file)) throw new Error(`Missing source: ${file}`);
}
const urlIndex = process.argv.indexOf('--storybook-url');
if (urlIndex !== -1) {
  const base = process.argv[urlIndex + 1];
  if (!base) throw new Error('Provide the local Storybook URL after --storybook-url.');
  const response = await fetch(`${base.replace(/\/$/, '')}/index.json`);
  if (!response.ok) throw new Error(`Storybook index returned ${response.status}.`);
  const index = await response.json();
  const missing = [];
  for (const family of families) {
    for (const story of family.stories) if (!index.entries[story.id]) missing.push(story.id);
    for (const label of labels) {
      const id = toId(`${family.title}/${label}`) + '--docs';
      if (!index.entries[id]) missing.push(id);
    }
  }
  if (missing.length) throw new Error(`Broken Storybook links:\n${missing.join('\n')}`);
  console.log('Every generated documentation page and story link resolves in the Storybook index.');
}
console.log(
  `Checked ${families.length} component families and ${families.length * 12} documentation pages.`,
);
