/** Verify live, annotated anatomy pages and the component documentation hierarchy. */
import { chromium, expect } from '@playwright/test';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
const base = process.env.STORYBOOK_URL || 'http://127.0.0.1:6006';
const directory = new URL('../src/stories/component-docs/generated/', import.meta.url);
const families = await Promise.all(
  (await readdir(directory))
    .filter((name) => name.endsWith('.json'))
    .map(async (name) => JSON.parse(await readFile(new URL(name, directory), 'utf8'))),
);
const index = await (await fetch(`${base}/index.json`)).json();
for (const family of families) {
  const entries = Object.values(index.entries).filter(
    (entry) => entry.title === family.title || entry.title.startsWith(`${family.title}/`),
  );
  if (entries[0]?.id !== `${family.id}-overview--docs`)
    throw new Error(`Overview is not first for ${family.id}`);
  if (entries.some((entry) => entry.title.endsWith('/Component Guidelines/Overview')))
    throw new Error(`Nested Overview remains for ${family.id}`);
}
if (Object.keys(index.entries).some((id) => id.startsWith('components-brand-aws-logos')))
  throw new Error('AWS logo showcase remains in the index');
const representatives = [
  'components-actions-button',
  'components-forms-field',
  'components-overlays-modal',
  'components-ai-streamingskeleton',
  'components-data-datagrid',
  'patterns-filterpanel',
];
const queue = families
  .filter(
    (family) =>
      !process.env.ANATOMY_FILTER || new RegExp(process.env.ANATOMY_FILTER).test(family.id),
  )
  .map(({ id }) => ({ id, theme: 'dark', layout: 'fundamental', width: 1440 }));
for (const id of representatives.filter((id) => families.some((family) => family.id === id))) {
  for (const [theme, layout, width] of [
    ['light', 'fundamental', 1440],
    ['light', 'fundamental-floating', 390],
    ['dark', 'fundamental-floating', 1440],
  ])
    queue.push({ id, theme, layout, width });
}
const total = queue.length;
const failures = [];
let completed = 0;
await mkdir('test-results/anatomy', { recursive: true });
const browser = await chromium.launch();
async function worker() {
  for (let job = queue.shift(); job; job = queue.shift()) {
    const { id, theme, layout, width } = job;
    const page = await browser.newPage({
      viewport: { width, height: 1100 },
      reducedMotion: 'reduce',
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.goto(
        `${base}/iframe.html?id=${id}-component-guidelines-anatomy--docs&viewMode=docs&globals=theme:${theme};layoutTheme:${layout}`,
      );
      await page.locator('.anatomy-marker').first().waitFor({ timeout: 45000 });
      await page.waitForFunction(
        () => {
          const count = document.querySelectorAll('.anatomy-marker').length;
          return count > 0 && count === document.querySelectorAll('.anatomy-legend li').length;
        },
        null,
        { timeout: 10000 },
      );
      const problems = await page.evaluate(() => {
        const frame = document.querySelector('.anatomy-stage iframe');
        const doc = frame.contentDocument;
        const definition = JSON.parse(
          doc.querySelector('[data-anatomy-definition]').dataset.anatomyDefinition,
        );
        return definition.parts.flatMap((part) => {
          const nodes = [...doc.querySelectorAll(part.selector)];
          const node = nodes.find((candidate) => {
            const box = candidate.getBoundingClientRect();
            return (
              box.width > 0 &&
              box.height > 0 &&
              doc.defaultView.getComputedStyle(candidate).visibility !== 'hidden'
            );
          });
          if (!node) return [`No visible target: ${part.name}`];
          const box = node.getBoundingClientRect();
          if (
            box.top < -2 ||
            box.left < -2 ||
            box.bottom > doc.defaultView.innerHeight + 2 ||
            box.right > doc.defaultView.innerWidth + 2
          )
            return [`Clipped target: ${part.name}`];
          return [];
        });
      });
      if (problems.length) throw new Error(problems.join('; '));
      await expect(
        page
          .locator('.component-docs-heading')
          .getByRole('link', { name: 'Overview', exact: true }),
      ).toHaveAttribute('href', `?path=/docs/${id}-overview--docs`);
      const marker = page.locator('.anatomy-marker').first();
      await marker.focus();
      await expect(page.getByRole('tooltip')).toBeVisible();
      await expect(page.getByRole('tooltip')).toContainText(
        (await marker.getAttribute('aria-label')).slice(3),
      );
      await marker.press('Enter');
      await expect(marker).toHaveAttribute('aria-pressed', 'true');
      await marker.press('Escape');
      await expect(page.getByRole('tooltip')).toHaveCount(0);
      await expect(marker).toHaveAttribute('aria-pressed', 'false');
      if (width === 390) {
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        );
        if (overflow) throw new Error('Mobile documentation overflows horizontally');
      }
      if (errors.length) throw new Error(errors.join('; '));
      if (representatives.includes(id))
        await page.screenshot({
          path: `test-results/anatomy/${id}-${theme}-${layout}-${width}.png`,
          fullPage: true,
        });
    } catch (error) {
      failures.push({ ...job, error: String(error) });
    } finally {
      await page.close();
      console.log(`${++completed}/${total} ${id} ${theme} ${layout} ${width}`);
    }
  }
}
await Promise.all([worker(), worker()]);
await browser.close();
await writeFile(
  'test-results/anatomy/report.json',
  JSON.stringify({ checked: completed, failures }, null, 2),
);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else
  console.log(
    `All ${completed} anatomy checks passed, including callouts, keyboard behavior, and navigation.`,
  );
