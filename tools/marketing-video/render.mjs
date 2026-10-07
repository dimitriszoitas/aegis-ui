import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, basename } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const output = resolve('test-results/marketing-video');
const source = resolve('tools/marketing-video');
const artifacts = resolve('artifacts/marketing');
const stills = process.argv.includes('--stills');
const silent = process.argv.includes('--silent');
const width = 1920;
const height = 1080;
const fps = 30;
const duration = 30;
const encoder = process.env.AEGIS_FFMPEG || 'ffmpeg';
const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
await mkdir(`${output}/keyframes`, { recursive: true });
await mkdir(artifacts, { recursive: true });
const server = createServer(async (request, response) => {
  const route = new URL(request.url, 'http://localhost').pathname;
  const file = route.startsWith('/assets/')
    ? resolve(output, 'assets', basename(route))
    : resolve(source, route === '/' ? 'film.html' : basename(route));
  try {
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch {
    response.statusCode = 404;
    response.end('Not found');
  }
});
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(`http://127.0.0.1:${server.address().port}`);
await page.evaluate(() => window.filmReady);
try {
  if (stills) {
    const times = [1.3, 2.8, 4.8, 7.1, 9.0, 10.0, 10.4, 12.7, 16.2, 18.6, 21.7, 23.3, 26.4, 28.7];
    for (const time of times) {
      await page.evaluate((value) => window.renderFrame(value), time);
      await page.screenshot({
        path: `${output}/keyframes/${time.toFixed(1).padStart(4, '0')}.png`,
      });
    }
    console.log(`Saved ${times.length} full-resolution storyboard keyframes.`);
  } else {
    const destination = `${artifacts}/aegis-launch${silent ? '-silent' : ''}.mp4`;
    const args = [
      '-y',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      '-framerate',
      String(fps),
      '-i',
      'pipe:0',
    ];
    if (!silent) args.push('-i', `${output}/soundtrack.wav`);
    args.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p');
    if (!silent) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
    else args.push('-an');
    args.push(
      '-movflags',
      '+faststart',
      '-metadata',
      'title=Aegis — Built for technical minds',
      '-metadata',
      'comment=Original deterministic animation and original synthesized soundtrack.',
      destination,
    );
    const process = spawn(encoder, args, { stdio: ['pipe', 'ignore', 'pipe'] });
    let log = '';
    process.stderr.on('data', (chunk) => {
      log += chunk.toString();
    });
    const completed = once(process, 'close');
    for (let frame = 0; frame < fps * duration; frame++) {
      await page.evaluate((value) => window.renderFrame(value), frame / fps);
      const buffer = await page.screenshot({ type: 'jpeg', quality: 94 });
      if (!process.stdin.write(buffer)) await once(process.stdin, 'drain');
      if (frame % 90 === 0)
        console.log(`Rendered ${Math.round((frame / (fps * duration)) * 100)}% · ${frame / fps}s`);
    }
    process.stdin.end();
    const [exitCode] = await completed;
    await writeFile(`${output}/encode.log`, log);
    if (exitCode !== 0) throw new Error(`Encoder exited with ${exitCode}: ${log.slice(-2000)}`);
    await writeFile(
      `${output}/manifest.json`,
      JSON.stringify(
        {
          title: 'Aegis — Built for technical minds',
          duration,
          fps,
          width,
          height,
          frames: fps * duration,
          soundtrack: silent ? 'none' : 'Original synthesis; no third-party music',
          source: 'tools/marketing-video',
          errors,
          destination,
        },
        null,
        2,
      ),
    );
    await page.evaluate((value) => window.renderFrame(value), 7.1);
    await page.screenshot({ path: `${artifacts}/poster.jpg`, type: 'jpeg', quality: 95 });
    console.log(`Finished ${destination}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
} finally {
  await browser.close();
  server.close();
}
