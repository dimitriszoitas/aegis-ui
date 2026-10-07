/* Deterministic 30-second timeline. All motion is a pure function of time. */
const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const ease = (value) => 1 - Math.pow(1 - clamp(value), 3);
const smooth = (value) => {
  const v = clamp(value);
  return v * v * (3 - 2 * v);
};
const mix = (start, end, progress) => start + (end - start) * progress;
const element = (id) => document.getElementById(id);
const transform = (id, value) => {
  element(id).style.transform = value;
};
const reveal = (id, time, start, duration = 0.7, distance = 45) => {
  const progress = ease((time - start) / duration);
  element(id).style.opacity = progress;
  transform(id, `translate3d(0,${(1 - progress) * distance}px,0)`);
};
const scenes = [
  { id: 'intro', start: 0, end: 4.4, title: 'DESIGN SYSTEM / 001' },
  { id: 'overview', start: 3.65, end: 9.65, title: 'THE BIG PICTURE / 002' },
  { id: 'signals', start: 8.95, end: 15.3, title: 'CONNECTED CONTEXT / 003' },
  { id: 'intelligence', start: 14.6, end: 20.8, title: 'ASSISTANCE WITH INTENT / 004' },
  { id: 'engineering', start: 20.05, end: 25.4, title: 'BUILT IN CODE / 005' },
  { id: 'closing', start: 24.7, end: 30.1, title: 'MAKE IT YOURS / 006' },
];
const canvas = element('atmosphere');
const context = canvas.getContext('2d');
let seed = 6471;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const particles = Array.from({ length: 58 }, () => ({
  x: random() * 1920,
  y: random() * 1080,
  radius: random() * 1.25 + 0.4,
  speed: random() * 0.5 + 0.1,
  opacity: random() * 0.22 + 0.06,
}));

function atmosphere(time) {
  context.fillStyle = '#080d0a';
  context.fillRect(0, 0, 1920, 1080);
  const glowX = 1300 + Math.sin(time * 0.16) * 350;
  const glowY = 470 + Math.cos(time * 0.21) * 220;
  const glow = context.createRadialGradient(glowX, glowY, 0, glowX, glowY, 1100);
  glow.addColorStop(0, '#24543445');
  glow.addColorStop(0.5, '#1839211c');
  glow.addColorStop(1, '#080d0a00');
  context.fillStyle = glow;
  context.fillRect(0, 0, 1920, 1080);
  context.strokeStyle = '#75b88b09';
  context.lineWidth = 1;
  const offset = (time * 4) % 96;
  for (let x = -96 + offset; x < 2016; x += 96) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 1080);
    context.stroke();
  }
  for (let y = -96 + offset; y < 1176; y += 96) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(1920, y);
    context.stroke();
  }
  for (const particle of particles) {
    const y = (particle.y - time * particle.speed * 8 + 10800) % 1080;
    context.fillStyle = `rgba(171,242,187,${particle.opacity})`;
    context.beginPath();
    context.arc(
      particle.x + Math.sin(time * 0.14 + particle.x) * 9,
      y,
      particle.radius,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  // One slow architectural trace provides depth without distracting flashes.
  const traceX = 1820 - ((time * 38) % 1720);
  const trace = context.createLinearGradient(traceX, 0, traceX, 1080);
  trace.addColorStop(0, '#a6ff8e00');
  trace.addColorStop(0.45, '#a6ff8e0b');
  trace.addColorStop(1, '#a6ff8e00');
  context.fillStyle = trace;
  context.fillRect(traceX, 0, 1, 1080);
}

window.renderFrame = function renderFrame(time) {
  time = clamp(time, 0, 30);
  atmosphere(time);
  for (const scene of scenes) {
    const incoming = smooth((time - scene.start) / 0.62);
    const outgoing = scene.id === 'closing' ? 1 : smooth((scene.end - time) / 0.6);
    element(scene.id).style.opacity = incoming * outgoing;
    element(scene.id).style.visibility =
      time >= scene.start && time <= scene.end ? 'visible' : 'hidden';
  }
  const current = [...scenes].reverse().find((scene) => time >= scene.start + 0.3) || scenes[0];
  element('chapter').textContent = current.title;
  element('timecode').textContent = `00:${String(Math.floor(time)).padStart(2, '0')} / 00:30`;

  const introCamera = smooth(time / 4.4);
  transform('intro', `translate3d(${-introCamera * 12}px,0,0) scale(${mix(1.04, 1, introCamera)})`);
  reveal('intro-label', time, 0.2, 0.75, 25);
  transform('intro-one', `translateY(${(1 - ease((time - 0.35) / 1.1)) * 180}px)`);
  transform('intro-two', `translateY(${(1 - ease((time - 0.7) / 1.15)) * 180}px)`);
  reveal('intro-bottom', time, 1.25, 1, 25);

  const overviewEntry = ease((time - 3.65) / 1.5);
  const overviewDrift = smooth((time - 4.8) / 4.85);
  const overviewPush = ease((time - 7.65) / 1.55);
  reveal('overview-copy', time, 3.9, 0.9, 36);
  transform(
    'hero-plane',
    `translate3d(${mix(160, -145, overviewEntry) - overviewDrift * 55 - overviewPush * 160}px,${mix(180, 37, overviewEntry) - overviewDrift * 28 - overviewPush * 190}px,${mix(-80, 130, overviewEntry)}px) rotateX(${mix(16, 6, overviewEntry)}deg) rotateY(${mix(-18, -7, overviewEntry)}deg) rotateZ(${mix(-4, -1, overviewEntry)}deg) scale(${mix(1.2, 1.01, overviewEntry) + overviewDrift * 0.025 + overviewPush * 0.68})`,
  );
  reveal('overview-caption', time, 5.1, 0.9, 25);
  const overviewCopyFade = 1 - smooth((time - 7.65) / 0.6);
  element('overview-copy').style.opacity = ease((time - 3.9) / 0.9) * overviewCopyFade;
  element('overview-caption').style.opacity = ease((time - 5.1) / 0.9) * overviewCopyFade;

  const signalsEntry = ease((time - 8.95) / 1.15);
  const signalsDrift = smooth((time - 10) / 5.3);
  reveal('signals-copy', time, 9.05, 0.8, 35);
  transform(
    'table-plane',
    `translate3d(${mix(200, -20, signalsEntry) - signalsDrift * 45}px,${mix(95, 0, signalsEntry)}px,${mix(110, -80, signalsEntry)}px) rotateX(9deg) rotateY(${mix(-10, -3, signalsEntry)}deg) scale(${mix(1.6, 1.02, signalsEntry)})`,
  );
  element('alert-plane').style.opacity = smooth((time - 10.2) / 0.7);
  transform(
    'alert-plane',
    `translate3d(${mix(95, 0, ease((time - 10.2) / 1.15)) - signalsDrift * 18}px,${mix(42, -23, ease((time - 10.2) / 1.15))}px,${mix(-20, 100, ease((time - 10.2) / 1.15))}px) rotateY(-2deg) scale(1.025)`,
  );
  document.querySelector('.scan-line').style.backgroundPosition =
    `${200 - (((time - 10.4) * 45) % 240)}% 0`;
  reveal('entity-chip', time, 10.1, 0.85, 40);
  reveal('tactic-chip', time, 10.45, 0.95, 55);
  reveal('signals-note', time, 10.8, 0.9, 20);

  const aiEntry = ease((time - 14.6) / 1.35);
  const aiDrift = smooth((time - 16) / 4.8);
  reveal('intelligence-copy', time, 14.8, 0.85, 30);
  transform(
    'assistant-plane',
    `translate3d(${mix(200, -32, aiEntry) - aiDrift * 20}px,${mix(170, 10, aiEntry) - aiDrift * 18}px,${mix(-480, 15, aiEntry)}px) rotateY(${mix(-32, -8, aiEntry)}deg) rotateZ(${mix(4, 1, aiEntry)}deg)`,
  );
  element('insight-plane').style.opacity = smooth((time - 15.7) / 0.8);
  transform(
    'insight-plane',
    `translate3d(${mix(-90, 0, ease((time - 15.7) / 1.3))}px,${mix(80, -14, ease((time - 15.7) / 1.3)) - aiDrift * 13}px,130px) rotateY(5deg) rotateZ(-2deg)`,
  );
  reveal('ai-orbit', time, 15.4, 0.9, 25);
  document.querySelector('.ai-star').style.transform = `rotate(${(time - 15) * 18}deg)`;

  const engineeringEntry = ease((time - 20.05) / 1.1);
  const engineeringDrift = smooth((time - 21.2) / 4.2);
  reveal('engineering-copy', time, 20.15, 0.85, 30);
  transform(
    'code-plane',
    `translate3d(${mix(-140, 0, engineeringEntry)}px,${mix(80, 0, engineeringEntry) - engineeringDrift * 9}px,${mix(-100, 30, engineeringEntry)}px) rotateY(${mix(12, 3, engineeringEntry)}deg) rotateZ(-0.7deg)`,
  );
  transform(
    'playground-plane',
    `translate3d(${mix(190, -10, engineeringEntry)}px,${mix(150, 0, engineeringEntry) - engineeringDrift * 14}px,${mix(-160, 55, engineeringEntry)}px) rotateY(${mix(-19, -6, engineeringEntry)}deg) rotateZ(1deg)`,
  );
  reveal('engineering-tags', time, 21.4, 0.8, 25);

  const closingEntry = ease((time - 24.8) / 1.2);
  element('closing-rule').style.transform = `scaleX(${ease((time - 24.75) / 1.4)})`;
  element('closing-copy').style.opacity = closingEntry;
  transform(
    'closing-copy',
    `translate3d(0,${(1 - closingEntry) * 55}px,0) scale(${mix(1.015, 1, closingEntry)})`,
  );
  document.querySelector('.closing-actions').style.opacity = smooth((time - 26.1) / 0.9);
};
window.filmReady = Promise.all([
  document.fonts.ready,
  ...Array.from(document.images, (image) => image.decode()),
]).then(() => window.renderFrame(0));
