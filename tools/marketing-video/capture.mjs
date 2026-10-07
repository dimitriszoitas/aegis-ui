import { chromium, expect } from '@playwright/test';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = process.env.AEGIS_URL || 'http://127.0.0.1:5173';
const destination = resolve('test-results/marketing-video/assets');
await mkdir(destination, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1800, height: 1100 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const errors = [];
const assets = {};
page.on('pageerror', (error) => errors.push(error.message));
async function capture(name, target) {
  await expect(target).toBeVisible();
  await target.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  const bounds = await target.boundingBox();
  const image = await target.screenshot({
    path: `${destination}/${name}.png`,
    animations: 'disabled',
    caret: 'hide',
    // Element captures scroll independently of sticky site chrome.
    style: '.marketing-header, .marketing-skip { visibility: hidden !important; }',
  });
  assets[name] = {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20),
    cssWidth: bounds.width,
    cssHeight: bounds.height,
  };
}
try {
  await page.goto(base);
  const workflow = page.getByRole('region', { name: 'Interactive Aegis investigation example' });
  await expect(workflow).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const darkSwitch = workflow.getByRole('switch', { name: 'Dark preview' });
  if ((await darkSwitch.getAttribute('aria-checked')) !== 'true') await darkSwitch.click();
  await workflow.getByRole('tab', { name: 'Alert queue', exact: true }).click();
  await expect(workflow.getByRole('list', { name: 'Sample detection queue' })).toBeVisible();
  await capture('hero', workflow);
  await workflow.getByRole('tab', { name: 'AI review', exact: true }).click();
  const insight = workflow.locator('.marketing-showcase-review .aegis-ai-card');
  await expect(
    insight.getByText('One host. A possible connection.', { exact: true }),
  ).toBeVisible();
  await capture('insight', insight);
  const playground = page.locator('.marketing-token-preview');
  await playground
    .getByRole('group', { name: 'Token preview theme' })
    .getByRole('button', { name: 'Dark', exact: true })
    .click();
  await playground.getByRole('combobox', { name: 'Card spacing' }).selectOption('default');
  await expect(playground).toHaveAttribute('data-theme', 'dark');
  await capture('playground', playground);
  const consoleUrl = new URL(base);
  consoleUrl.search = '?view=console';
  consoleUrl.hash = '';
  await page.goto(consoleUrl.href);
  await page.locator('.aegis-console-summary').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page
        .locator('.aegis-console-histogram .recharts-responsive-container')
        .evaluate((element) =>
          Math.abs(
            Number(element.querySelector('svg').getAttribute('width')) - element.clientWidth,
          ),
        ),
    )
    .toBeLessThan(2);
  await page.screenshot({
    path: `${destination}/console.png`,
    animations: 'disabled',
    caret: 'hide',
  });
  await capture('summary', page.locator('.aegis-console-summary'));
  await capture('table', page.locator('.aegis-grid-viewport'));
  const row = page
    .locator('.aegis-grid-row')
    .filter({ hasText: 'PowerShell launched by Office on DC-ATH-02' });
  await capture('alert-row', row.first());
  await page.getByRole('button', { name: 'Open AI panel', exact: true }).click();
  await page.getByRole('button', { name: 'Explain attached evidence', exact: true }).click();
  await page
    .locator('.aegis-ai-message[aria-label="Aegis assistant response"][data-status="complete"]')
    .waitFor({ timeout: 30000 })
    .catch(async () => {
      await page
        .getByRole('button', { name: /Regenerate/ })
        .first()
        .waitFor({ timeout: 30000 });
    });
  await page.locator('.aegis-ai-transcript').evaluate((element) => {
    element.scrollTop = 0;
  });
  await capture('assistant', page.locator('.aegis-ai-panel'));
  for (const weight of [400, 500, 600, 700])
    await copyFile(
      resolve(`node_modules/@fontsource/figtree/files/figtree-latin-${weight}-normal.woff2`),
      `${destination}/figtree-${weight}.woff2`,
    );
  await copyFile(
    resolve('node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2'),
    `${destination}/mono.woff2`,
  );
  await copyFile(resolve('public/aegis-mark.svg'), `${destination}/mark.svg`);
  await writeFile(
    resolve('test-results/marketing-video/capture.json'),
    JSON.stringify(
      { base, viewport: { width: 1800, height: 1100 }, scale: 2, assets, errors },
      null,
      2,
    ),
  );
  console.log(
    'Captured workflow hero, AI review, token playground, console, summary, table and assistant layers.',
  );
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  await browser.close();
}
