/* ===== 音（Web Audio）：内蔵BGM・効果音は合成で鳴らす（素材ファイルなし） ===== */
const AU = { ctx: null, master: null, bgmG: null, seG: null, rev: null, bgm: null, bgmId: null, bufs: {} };
function auInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  const c = AU.ctx = new C();
  AU.master = c.createGain(); AU.master.gain.value = 0.8; AU.master.connect(c.destination);
  AU.bgmG = c.createGain(); AU.bgmG.connect(AU.master);
  AU.seG = c.createGain(); AU.seG.connect(AU.master);
  // 残響（ノイズから作るインパルス）
  const len = c.sampleRate * 1.8, ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  AU.rev = c.createConvolver(); AU.rev.buffer = ir;
  AU.revG = c.createGain(); AU.revG.gain.value = 0.35; AU.rev.connect(AU.revG); AU.revG.connect(AU.master);
  AU.noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const nd = AU.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  auVol();
}
function auVol() { if (!AU.ctx) return; AU.bgmG.gain.value = sv('bgm') * 0.55; AU.seG.gain.value = sv('se') * 0.8; }
const NOTE_I = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function nf(n) { // "C#5" -> Hz
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(n); if (!m) return 440;
  const midi = 12 * (+m[3] + 1) + NOTE_I[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
}
/* 音のもと */
function tone(dest, t, f, dur, o = {}) {
  const c = AU.ctx, osc = c.createOscillator(), g = c.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.slide || dur));
  if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + dur + 0.3); }
  const v = o.vol ?? 0.3, a = o.a ?? 0.005, r = o.r ?? Math.min(0.2, dur * 0.5);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a);
  if (o.sus != null) g.gain.linearRampToValueAtTime(v * o.sus, t + a + 0.08);
  g.gain.setValueAtTime(v * (o.sus ?? 1), t + Math.max(a, dur - r)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = osc;
  if (o.lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; fl.Q.value = o.q || 0.7; osc.connect(fl); node = fl; }
  node.connect(g); g.connect(dest);
  if (o.rev) { const s = c.createGain(); s.gain.value = o.rev; g.connect(s); s.connect(AU.rev); }
  osc.start(t); osc.stop(t + dur + 0.05);
}
function noise(dest, t, dur, o = {}) {
  const c = AU.ctx, s = c.createBufferSource(), g = c.createGain(), fl = c.createBiquadFilter();
  s.buffer = AU.noise; s.loop = true;
  fl.type = o.ft || 'lowpass'; fl.frequency.setValueAtTime(o.f || 2000, t); fl.Q.value = o.q || 0.8;
  if (o.fto) fl.frequency.exponentialRampToValueAtTime(o.fto, t + dur);
  const v = o.vol ?? 0.3, a = o.a ?? 0.002;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a);
  if (o.hold) g.gain.setValueAtTime(v, t + o.hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(dest);
  if (o.rev) { const r = c.createGain(); r.gain.value = o.rev; g.connect(r); r.connect(AU.rev); }
  s.start(t, Math.random()); s.stop(t + dur + 0.05);
  return { fl, g };
}
/* ---- 効果音 ---- */
const SE_LIST = [
  ['kettei', '決定', (d, t) => { tone(d, t, 1320, 0.07, { type: 'square', vol: 0.12 }); tone(d, t + 0.07, 1760, 0.12, { type: 'square', vol: 0.12 }); }],
  ['cancel', 'キャンセル', (d, t) => { tone(d, t, 880, 0.07, { type: 'square', vol: 0.12 }); tone(d, t + 0.07, 587, 0.14, { type: 'square', vol: 0.12 }); }],
  ['pikon', 'ひらめき', (d, t) => { tone(d, t, 1047, 0.1, { vol: 0.3 }); tone(d, t + 0.1, 1568, 0.5, { vol: 0.3, rev: 0.4 }); tone(d, t + 0.1, 3136, 0.4, { vol: 0.06 }); }],
  ['bikkuri', 'びっくり', (d, t) => { tone(d, t, 400, 0.12, { type: 'square', to: 1400, vol: 0.14 }); tone(d, t + 0.14, 400, 0.18, { type: 'square', to: 1800, vol: 0.14 }); }],
  ['door', 'ノック', (d, t) => { for (const k of [0, 0.2]) { noise(d, t + k, 0.12, { f: 900, vol: 0.5 }); tone(d, t + k, 140, 0.12, { to: 80, vol: 0.5 }); } }],
  ['ashioto', '足音', (d, t) => { for (let i = 0; i < 4; i++) { noise(d, t + i * 0.32, 0.1, { f: 500, vol: 0.4 }); tone(d, t + i * 0.32, 90, 0.08, { to: 60, vol: 0.3 }); } }],
  ['kaminari', '雷', (d, t) => { noise(d, t, 0.35, { ft: 'highpass', f: 1500, vol: 0.5 }); noise(d, t + 0.05, 2.8, { f: 900, fto: 80, vol: 0.7, hold: 0.4, rev: 0.4 }); tone(d, t + 0.05, 50, 2.2, { vol: 0.4 }); }],
  ['kaze', '風', (d, t) => {
    const n = noise(d, t, 3.2, { ft: 'bandpass', f: 500, q: 2, vol: 0.4, a: 0.8, hold: 2.2 });
    n.fl.frequency.linearRampToValueAtTime(1400, t + 1.2); n.fl.frequency.linearRampToValueAtTime(600, t + 2.2); n.fl.frequency.linearRampToValueAtTime(1100, t + 3.2);
  }],
  ['bakuhatsu', '爆発', (d, t) => { noise(d, t, 1.8, { f: 4000, fto: 90, vol: 0.8, rev: 0.3 }); tone(d, t, 90, 1.2, { to: 35, vol: 0.6 }); }],
  ['shinzou', '心臓の音', (d, t) => { for (let i = 0; i < 2; i++) { const k = t + i * 0.9; tone(d, k, 70, 0.18, { to: 45, vol: 0.8 }); tone(d, k + 0.22, 60, 0.2, { to: 40, vol: 0.6 }); } }],
  ['jump', 'ジャンプ', (d, t) => { tone(d, t, 300, 0.22, { type: 'square', to: 1000, vol: 0.12 }); }],
  ['ochiru', '落ちる', (d, t) => { tone(d, t, 1400, 0.8, { type: 'triangle', to: 150, vol: 0.3 }); }],
  ['kirakira', 'キラキラ', (d, t) => { ['C6', 'E6', 'G6', 'C7', 'E7', 'G7'].forEach((n, i) => tone(d, t + i * 0.07, nf(n), 0.5, { vol: 0.16, rev: 0.6 })); }],
  ['chime', '学校のチャイム', (d, t) => {
    ['E5', 'C5', 'D5', 'G4', '', 'G4', 'D5', 'E5', 'C5'].forEach((n, i) => { if (!n) return; const k = t + i * 0.62; tone(d, k, nf(n), 1.6, { vol: 0.25, rev: 0.5 }); tone(d, k, nf(n) * 2.76, 0.6, { vol: 0.04 }); });
  }],
  ['seikai', 'せいかい', (d, t) => { tone(d, t, 1319, 0.25, { vol: 0.3, rev: 0.3 }); tone(d, t + 0.22, 1047, 0.7, { vol: 0.3, rev: 0.4 }); }],
  ['fuseikai', 'ブッブー', (d, t) => { tone(d, t, 160, 0.25, { type: 'sawtooth', vol: 0.18, lp: 1200 }); tone(d, t + 0.32, 160, 0.45, { type: 'sawtooth', vol: 0.18, lp: 1200 }); }],
  ['fanfare', 'ファンファーレ', (d, t) => {
    [['C5', 0, 0.14], ['C5', 0.15, 0.14], ['C5', 0.3, 0.14], ['C5', 0.45, 0.4], ['Ab4', 0.9, 0.4], ['Bb4', 1.35, 0.4], ['C5', 1.8, 0.25], ['Bb4', 2.1, 0.15], ['C5', 2.3, 1.0]]
      .forEach(([n, k, du]) => { tone(d, t + k, nf(n), du, { type: 'square', vol: 0.1, lp: 3000, rev: 0.2 }); tone(d, t + k, nf(n) / 2, du, { type: 'triangle', vol: 0.15 }); });
  }],
  ['pon', 'ポン', (d, t) => { tone(d, t, 700, 0.15, { to: 350, vol: 0.4 }); }],
  ['mizu', '水てき', (d, t) => { tone(d, t, 1800, 0.12, { to: 700, vol: 0.3, rev: 0.5 }); tone(d, t + 0.4, 1600, 0.12, { to: 650, vol: 0.2, rev: 0.5 }); }],
  ['tori', '鳥', (d, t) => { for (let i = 0; i < 5; i++) tone(d, t + i * 0.14 + (i > 2 ? 0.3 : 0), 2600, 0.09, { to: 4200, vol: 0.12, rev: 0.3 }); }],
  ['tokei', '時計', (d, t) => { for (let i = 0; i < 6; i++) noise(d, t + i * 0.5, 0.04, { ft: 'highpass', f: (i % 2 ? 3000 : 4200), vol: 0.5 }); }],
  ['denwa', '電話', (d, t) => { for (let r = 0; r < 2; r++) for (let i = 0; i < 16; i++) tone(d, t + r * 1.4 + i * 0.05, i % 2 ? 1000 : 800, 0.05, { type: 'square', vol: 0.07, a: 0.002, r: 0.01 }); }]
];
const SE_MAP = Object.fromEntries(SE_LIST.map(s => ['S:' + s[0], s]));
/* ---- BGM（シーケンサー） ---- */
// lead: "音:長さ(16分)" をならべる。chords: 小節ごとのコード
const CHORD = { '': [0, 4, 7], m: [0, 3, 7], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], 7: [0, 4, 7, 10] };
function chordNotes(name, oct) { const m = /^([A-G][#b]?)(.*)$/.exec(name); const root = nf(m[1] + oct); return (CHORD[m[2]] || CHORD['']).map(s => root * Math.pow(2, s / 12)); }
const BGM_LIST = [
  { id: 'nichijou', name: '日常', bpm: 112, lead: 'square', leadLp: 2600, bass: 'walk', pad: 0.05, arp: 0, drum: 'k.h.s.h.k.h.s.h.', chords: 'C G Am F C G F G',
    mel: 'E5:4 G5:4 C6:4 G5:4|D5:4 G5:4 B5:6 -:2|C5:4 E5:4 A5:4 E5:4|F5:4 A5:4 C6:6 -:2|E5:2 F5:2 G5:4 E5:4 C5:4|D5:2 E5:2 F5:4 D5:4 B4:4|C5:4 A4:4 F5:4 A5:4|G5:8 D5:4 -:4' },
  { id: 'tanoshii', name: '楽しい', bpm: 144, lead: 'square', leadLp: 3200, bass: 'bounce', pad: 0, arp: 0.05, drum: 'k.h.s.hkk.h.s.h.', chords: 'F C Dm Bb F C Bb C',
    mel: 'A5:2 A5:2 C6:2 A5:2 F5:4 G5:2 A5:2|G5:2 G5:2 E5:2 C5:2 G5:4 -:4|F5:2 A5:2 D6:2 A5:2 F5:4 E5:2 D5:2|D5:2 F5:2 Bb5:4 A5:2 G5:2 F5:4|A5:2 C6:2 F6:4 C6:2 A5:2 F5:4|G5:2 C6:2 E6:4 D6:2 C6:2 G5:4|F5:2 G5:2 A5:2 Bb5:2 D6:4 C6:2 Bb5:2|A5:4 G5:4 C6:6 -:2' },
  { id: 'kanashii', name: 'かなしい', bpm: 72, lead: 'triangle', leadLp: 2000, vib: 1, bass: 'long', pad: 0.07, arp: 0, drum: '', chords: 'Am F C G Am F E E', rev: 0.5,
    mel: 'E5:6 D5:2 C5:4 B4:4|A4:8 C5:4 F5:4|E5:8 G5:4 E5:4|D5:12 -:4|E5:6 F5:2 E5:4 C5:4|A4:6 B4:2 C5:4 D5:4|B4:8 G#4:4 B4:4|G#4:12 -:4' },
  { id: 'fushigi', name: 'ふしぎ', bpm: 88, lead: 'sine', leadLp: 4000, bass: 'long', pad: 0.04, arp: 0.07, arpWave: 'sine', drum: '', chords: 'Fmaj7 G Em Am Fmaj7 G Em Am', rev: 0.6,
    mel: '-:4 A5:4 E6:6 -:2|D6:4 B5:4 G5:8|-:4 B5:4 G5:4 E6:4|C6:12 -:4|E6:4 C6:4 A5:4 F5:4|G5:4 B5:4 D6:8|E6:6 D6:2 B5:8|A5:12 -:4' },
  { id: 'kinchou', name: 'きんちょう', bpm: 120, lead: 'sawtooth', leadLp: 1400, bass: 'ost', pad: 0.05, arp: 0, drum: 'k.......k.....h.', chords: 'Em Em C B Em Em C B',
    mel: 'B4:8 C5:8|B4:4 A4:4 G4:8|E5:8 D5:4 C5:4|B4:12 D#5:4|E5:8 F#5:8|G5:4 F#5:4 E5:8|C5:4 E5:4 G5:8|F#5:8 D#5:8' },
  { id: 'battle', name: 'バトル', bpm: 160, lead: 'sawtooth', leadLp: 3000, bass: 'eighth', pad: 0, arp: 0.04, drum: 'k.h.s.hkk.hks.hs', chords: 'Dm Bb C Dm Dm Bb C A',
    mel: 'D5:2 D5:2 A5:2 D5:2 F5:2 A5:2 D6:4|C6:2 Bb5:2 A5:2 F5:2 D5:4 F5:4|E5:2 G5:2 C6:2 G5:2 E6:4 C6:4|D6:4 A5:4 F5:2 E5:2 D5:4|A5:4 F5:4 D6:4 A5:4|Bb5:4 D6:4 F6:6 -:2|G5:2 A5:2 Bb5:2 C6:2 E6:4 G6:4|A6:4 E6:4 C#6:4 A5:4' },
  { id: 'honobono', name: 'ほのぼの', bpm: 100, lead: 'triangle', leadLp: 3000, bass: 'walk', pad: 0.03, arp: 0, drum: 'k.......s.......', chords: 'G Em C D G C D G',
    mel: 'B4:4 D5:4 G5:6 F#5:2|E5:4 G5:4 B4:8|C5:4 E5:4 G5:4 E5:4|D5:4 F#5:4 A5:8|B5:4 A5:4 G5:4 D5:4|E5:4 G5:4 C6:6 B5:2|A5:4 F#5:4 D5:4 E5:2 F#5:2|G5:12 -:4' },
  { id: 'ending', name: 'エンディング', bpm: 76, lead: 'sine', leadLp: 3000, vib: 1, bass: 'long', pad: 0.08, arp: 0.04, arpWave: 'triangle', drum: '', chords: 'C G Am Em F C F G', rev: 0.6,
    mel: 'G5:6 E5:2 C5:8|D5:6 B4:2 G4:8|C5:4 E5:4 A5:8|G5:8 E5:8|F5:4 A5:4 C6:6 A5:2|G5:4 E5:4 C5:8|A5:4 G5:4 F5:4 A5:4|G5:12 -:4' }
];
const BGM_MAP = Object.fromEntries(BGM_LIST.map(b => ['M:' + b.id, b]));
function parseMel(s) {
  const ev = []; let pos = 0;
  for (const bar of s.split('|')) for (const tk of bar.trim().split(/\s+/)) {
    const [n, l] = tk.split(':'); const len = +l || 4;
    if (n !== '-') ev.push({ pos, len, f: nf(n) }); pos += len;
  }
  return { ev, len: pos };
}
function bgmPlayer(def) {
  const c = AU.ctx, out = c.createGain(); out.gain.value = 0; out.connect(AU.bgmG);
  const mel = parseMel(def.mel), chords = def.chords.split(' '), steps = chords.length * 16;
  const st = 60 / def.bpm / 4; // 16分音符の長さ
  let step = 0, next = c.currentTime + 0.1, alive = true;
  const rev = def.rev ?? 0.25;
  function sched(i, t) {
    const bar = Math.floor(i / 16), s = i % 16, ch = chords[bar];
    // メロディ
    for (const e of mel.ev) if (e.pos === i) tone(out, t, e.f, e.len * st * 0.95, { type: def.lead, vol: def.lead === 'sine' ? 0.22 : def.lead === 'triangle' ? 0.24 : 0.09, lp: def.leadLp, a: 0.01, r: 0.08, sus: 0.8, vib: def.vib, rev });
    // ベース
    const root = chordNotes(ch, 2)[0], fifth = root * 1.5;
    const bs = def.bass;
    if (bs === 'long' && s === 0) tone(out, t, root, 16 * st, { type: 'triangle', vol: 0.28, a: 0.05, r: 0.3 });
    if (bs === 'walk' && s % 4 === 0) tone(out, t, (s / 4) % 2 ? fifth : root, 3.6 * st, { type: 'triangle', vol: 0.3 });
    if (bs === 'eighth' && s % 2 === 0) tone(out, t, root, 1.8 * st, { type: 'sawtooth', vol: 0.12, lp: 700 });
    if (bs === 'bounce' && s % 2 === 0) tone(out, t, (s / 2) % 2 ? root * 2 : root, 1.6 * st, { type: 'triangle', vol: 0.3 });
    if (bs === 'ost' && s % 2 === 0) tone(out, t, s % 8 === 6 ? root * 2 : root, 1.6 * st, { type: 'square', vol: 0.07, lp: 600 });
    // パッド
    if (def.pad && s === 0) for (const f of chordNotes(ch, 4)) tone(out, t, f, 16 * st, { type: 'sawtooth', vol: def.pad * 0.35, lp: 1100, a: 0.25, r: 0.4, rev });
    // アルペジオ
    if (def.arp && s % 2 === 0) { const ns = chordNotes(ch, 5); tone(out, t, ns[(s / 2) % ns.length], 1.8 * st, { type: def.arpWave || 'square', vol: def.arp, lp: 3000, rev }); }
    // ドラム
    const dc = def.drum && def.drum[s];
    if (dc === 'k') tone(out, t, 150, 0.18, { to: 40, slide: 0.12, vol: 0.55 });
    if (dc === 's') noise(out, t, 0.16, { ft: 'bandpass', f: 1800, vol: 0.28 });
    if (dc === 'h' || (def.drum && s % 4 === 2 && dc !== 's')) noise(out, t, 0.04, { ft: 'highpass', f: 7000, vol: 0.12 });
  }
  const timer = setInterval(() => {
    if (!alive) return;
    while (next < c.currentTime + 0.25) { sched(step, next); step = (step + 1) % steps; next += st; }
  }, 40);
  out.gain.linearRampToValueAtTime(1, c.currentTime + 0.6);
  return { stop() { alive = false; clearInterval(timer); const t = c.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(0, t + 0.6); setTimeout(() => out.disconnect(), 3000); } };
}
/* 追加した音（ファイル） */
async function auBuffer(id) {
  if (AU.bufs[id]) return AU.bufs[id];
  const d = MEDIA[id]; if (!d) return null;
  const bin = atob(d.slice(d.indexOf(',') + 1)), arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  try { AU.bufs[id] = await AU.ctx.decodeAudioData(arr.buffer); } catch (e) { return null; }
  return AU.bufs[id];
}
async function playSE(id) {
  auInit(); if (!AU.ctx || !id) return;
  if (SE_MAP[id]) { SE_MAP[id][2](AU.seG, AU.ctx.currentTime + 0.02); return; }
  const b = await auBuffer(id); if (!b) return;
  const s = AU.ctx.createBufferSource(); s.buffer = b; s.connect(AU.seG); s.start();
}
async function playBGM(id) {
  auInit(); if (!AU.ctx) return;
  if (!id || id === 'stop') { stopBGM(); return; }
  if (AU.bgmId === id && AU.bgm) return;
  stopBGM(); AU.bgmId = id;
  if (BGM_MAP[id]) { AU.bgm = bgmPlayer(BGM_MAP[id]); return; }
  const b = await auBuffer(id); if (!b || AU.bgmId !== id) return;
  const c = AU.ctx, s = c.createBufferSource(), g = c.createGain();
  s.buffer = b; s.loop = true; g.gain.value = 0; g.gain.linearRampToValueAtTime(1, c.currentTime + 0.6);
  s.connect(g); g.connect(AU.bgmG); s.start();
  AU.bgm = { stop() { const t = c.currentTime; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.6); s.stop(t + 0.7); } };
}
function stopBGM() { if (AU.bgm) AU.bgm.stop(); AU.bgm = null; AU.bgmId = null; }
function soundName(w, id) {
  if (!id) return '';
  if (id === 'stop') return '止める';
  if (SE_MAP[id]) return SE_MAP[id][1];
  if (BGM_MAP[id]) return BGM_MAP[id].name;
  const m = w && w.media.find(x => x.id === id); return m ? m.name : '（消えた素材）';
}
