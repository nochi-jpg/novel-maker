/* ===== エフェクト（tsParticles・Sakura.js・CSS） ===== */
const FX_COLORS = ['#ff5a5a', '#ffd43b', '#69db7c', '#4dabf7', '#da77f2', '#ffa94d', '#ffffff'];
const PARTICLE_OPTS = {
  snow: { particles: { number: { value: 140, density: { enable: true } }, color: { value: '#ffffff' }, shape: { type: 'circle' }, opacity: { value: { min: 0.5, max: 0.95 } }, size: { value: { min: 1.5, max: 5 } },
    move: { enable: true, direction: 'bottom', speed: { min: 0.6, max: 2 }, straight: false, outModes: 'out' }, wobble: { enable: true, distance: 10, speed: 10 } } },
  rain: { particles: { number: { value: 220, density: { enable: true } }, color: { value: '#cfe3ff' }, shape: { type: 'line' }, stroke: { width: 1.4, color: { value: '#cfe3ff' } },
    opacity: { value: { min: 0.35, max: 0.75 } }, size: { value: { min: 12, max: 22 } }, rotate: { value: 15 },
    move: { enable: true, direction: 'bottom', angle: { value: 6, offset: 0 }, speed: { min: 28, max: 40 }, straight: true, outModes: 'out' } } },
  sparkle: { particles: { number: { value: 70, density: { enable: true } }, color: { value: ['#fff7c2', '#ffffff', '#ffe066'] }, shape: { type: 'star' },
    opacity: { value: { min: 0.1, max: 1 }, animation: { enable: true, speed: 1.6, sync: false } }, size: { value: { min: 2, max: 6 } },
    twinkle: { particles: { enable: true, frequency: 0.08, opacity: 1, color: { value: '#ffffff' } } },
    move: { enable: true, speed: 0.4, direction: 'top', outModes: 'out' } } },
  confetti: { particles: { number: { value: 0 }, color: { value: FX_COLORS }, shape: { type: ['square', 'circle'] }, opacity: { value: 1 }, size: { value: { min: 4, max: 8 } },
    life: { duration: { value: 4 }, count: 1 }, rotate: { value: { min: 0, max: 360 }, animation: { enable: true, speed: 30 } },
    roll: { enable: true, darken: { enable: true, value: 25 }, speed: { min: 15, max: 25 } }, tilt: { enable: true, value: { min: 0, max: 360 }, animation: { enable: true, speed: 30 } },
    wobble: { enable: true, distance: 30, speed: { min: -15, max: 15 } },
    move: { enable: true, gravity: { enable: true, acceleration: 9.81 }, speed: { min: 20, max: 45 }, decay: 0.08, direction: 'top', outModes: { default: 'destroy', top: 'none' } } },
    emitters: [{ position: { x: 20, y: 100 }, life: { count: 1, duration: 0.25 }, rate: { quantity: 30, delay: 0.05 }, direction: 'top-right' },
      { position: { x: 80, y: 100 }, life: { count: 1, duration: 0.25 }, rate: { quantity: 30, delay: 0.05 }, direction: 'top-left' }] },
  fireworks: { particles: { number: { value: 0 }, color: { value: '#ffffff' }, shape: { type: 'line' }, stroke: { width: 1, color: { value: '#ffe8a3' } }, life: { count: 1 },
    size: { value: { min: 0.1, max: 30 }, animation: { enable: true, sync: true, speed: 90, startValue: 'max', destroy: 'min' } }, rotate: { path: true },
    move: { enable: true, gravity: { enable: true, acceleration: 15, inverse: true, maxSpeed: 100 }, speed: { min: 10, max: 20 }, outModes: { default: 'destroy', top: 'none' } },
    destroy: { mode: 'split', split: { count: 1, factor: { value: 1 / 3 }, rate: { value: 90 }, particles: {
      stroke: { width: 0 }, color: { value: FX_COLORS }, number: { value: 0 }, shape: { type: 'circle' }, size: { value: { min: 1.5, max: 3 } },
      opacity: { value: { min: 0.1, max: 1 }, animation: { enable: true, speed: 0.7, sync: false, startValue: 'max', destroy: 'min' } },
      life: { count: 1, duration: { value: { min: 1, max: 2 } } },
      move: { enable: true, gravity: { enable: true, acceleration: 9.81 }, decay: 0.1, speed: { min: 10, max: 25 }, direction: 'outside', outModes: 'destroy' } } } } },
    emitters: { direction: 'top', life: { count: 6, duration: 0.1, delay: 0.5 }, rate: { delay: 0.15, quantity: 1 }, size: { width: 80, height: 0 }, position: { y: 100, x: 50 } } }
};
let _pid = 0, _tspReady = null;
async function particlesIn(el, kind) {
  if (!window.tsParticles) return null;
  if (!_tspReady) _tspReady = window.loadFull ? loadFull(tsParticles) : Promise.resolve();
  await _tspReady;
  if (!el.id) el.id = 'tsp' + (++_pid);
  const o = Object.assign({ fullScreen: { enable: false }, background: { color: 'transparent' }, detectRetina: true, fpsLimit: 60 }, clone(PARTICLE_OPTS[kind]));
  try { return await tsParticles.load({ id: el.id, options: o }); } catch (e) { return null; }
}
/* 続く天気：el に1つだけ */
async function setWeather(el, kind) {
  if (el._kind === kind) return;
  if (el._ps) { try { el._ps.destroy(); } catch (e) {} el._ps = null; }
  if (el._sakura) { try { el._sakura.stop(true); } catch (e) {} el._sakura = null; }
  el.innerHTML = ''; el._kind = kind || null;
  if (!kind) return;
  const box = h('div', { style: 'position:absolute;inset:0' }); el.appendChild(box);
  if (kind === 'sakura') {
    box.id = 'skr' + (++_pid);
    if (window.Sakura) el._sakura = new Sakura('#' + box.id, { fallSpeed: 1.2, maxSize: 16, minSize: 9, delay: 260 });
  } else el._ps = await particlesIn(box, kind);
}
/* 一回だけのつぶ（紙ふぶき・花火） */
async function burst(el, kind, ms) {
  const box = h('div', { style: 'position:absolute;inset:0;pointer-events:none' }); el.appendChild(box);
  const ps = await particlesIn(box, kind);
  setTimeout(() => { try { ps && ps.destroy(); } catch (e) {} box.remove(); }, ms);
}
/* エフェクトの一覧 */
const EF_ONCE = [
  ['flashW', '白く光る', 'zap'], ['flashR', '赤く光る', 'zap'], ['thunder', '雷', 'zap'], ['shakeS', '画面ゆれ（小）', 'loop'], ['shakeL', '画面ゆれ（大）', 'loop'],
  ['black', '暗転', 'eyeoff'], ['white', 'ホワイトアウト', 'eye'], ['zoom', 'ズーム', 'plus'], ['jump', '人物がはねる', 'user'], ['shiver', '人物がふるえる', 'user'],
  ['confetti', '紙ふぶき', 'star'], ['fireworks', '花火', 'star']];
const EF_TONE = [['sepia', 'セピア（思い出）'], ['mono', 'モノクロ'], ['night', '夜'], ['evening', '夕方'], ['none', '色合いを解除']];
const EF_WEATHER = [['rain', '雨'], ['snow', '雪'], ['sakura', '桜'], ['sparkle', 'キラキラ'], ['none', '天気を解除']];
const EF_NAME = Object.fromEntries([...EF_ONCE.map(x => ['E:' + x[0], x[1]]), ...EF_TONE.map(x => ['T:' + x[0], x[1]]), ...EF_WEATHER.map(x => ['W:' + x[0], x[1]])]);
const TONE_FILTER = { sepia: 'sepia(.85) contrast(.95)', mono: 'grayscale(1)', night: 'brightness(.55) saturate(.8) hue-rotate(195deg) saturate(1.1)', evening: 'sepia(.35) saturate(1.5) hue-rotate(-12deg) brightness(.95)' };
function toneCss(t) { return t && TONE_FILTER[t] ? TONE_FILTER[t] : 'none'; }
