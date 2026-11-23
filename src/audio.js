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

const rnd = (a, b) => a + Math.random() * (b - a);
SE_LIST.push(
  ['cursor', 'カーソル', (d, t) => { tone(d, t, 1760, 0.05, { type: 'square', vol: 0.08 }); }],
  ['page', 'ページめくり', (d, t) => { noise(d, t, 0.28, { ft: 'bandpass', f: 3200, fto: 1200, q: 1.2, vol: 0.3, a: 0.04 }); }],
  ['beep', 'ピピッ', (d, t) => { tone(d, t, 2000, 0.07, { type: 'square', vol: 0.08 }); tone(d, t + 0.11, 2000, 0.07, { type: 'square', vol: 0.08 }); }],
  ['tsuuchi', '通知音', (d, t) => { tone(d, t, 1319, 0.14, { vol: 0.25 }); tone(d, t + 0.13, 1760, 0.35, { vol: 0.25, rev: 0.3 }); }],
  ['camera', 'カメラ', (d, t) => { noise(d, t, 0.05, { ft: 'highpass', f: 2500, vol: 0.6 }); noise(d, t + 0.09, 0.09, { ft: 'bandpass', f: 1500, vol: 0.4 }); }],
  ['kotsu', 'コツン', (d, t) => { tone(d, t, 900, 0.08, { type: 'triangle', to: 600, vol: 0.5 }); noise(d, t, 0.03, { ft: 'highpass', f: 3000, vol: 0.3 }); }],
  ['gaan', 'ガーン', (d, t) => { ['C4', 'F#4', 'C5', 'F#5'].forEach(n => tone(d, t, nf(n), 1.6, { type: 'sawtooth', vol: 0.07, lp: 1600, rev: 0.4 })); tone(d, t, 90, 1.2, { to: 40, vol: 0.5 }); }],
  ['doki', 'ドキッ', (d, t) => { tone(d, t, 70, 0.2, { to: 45, vol: 0.9 }); tone(d, t, 1200, 0.12, { vol: 0.12 }); }],
  ['hatena', 'はてな', (d, t) => { tone(d, t, 600, 0.18, { to: 1000, vol: 0.25 }); tone(d, t + 0.24, 1000, 0.3, { to: 1500, vol: 0.25, rev: 0.3 }); }],
  ['kyupiin', 'キュピーン', (d, t) => { tone(d, t, 1800, 0.35, { to: 4200, vol: 0.18, rev: 0.4 }); ['C7', 'G7'].forEach((n, i) => tone(d, t + 0.2 + i * 0.08, nf(n), 0.5, { vol: 0.08, rev: 0.6 })); }],
  ['zukoo', 'ズコー', (d, t) => { tone(d, t, 700, 0.6, { type: 'sawtooth', to: 80, vol: 0.12, lp: 2000 }); tone(d, t + 0.62, 120, 0.2, { to: 50, vol: 0.7 }); noise(d, t + 0.62, 0.15, { f: 600, vol: 0.4 }); }],
  ['shonbori', 'しょんぼり', (d, t) => { ['G4', 'F#4', 'F4', 'E4'].forEach((n, i) => tone(d, t + i * 0.32, nf(n), i === 3 ? 0.9 : 0.3, { type: 'triangle', vol: 0.3, vib: i === 3 })); }],
  ['wakuwaku', 'わくわく', (d, t) => { for (let k = 0; k < 2; k++) ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => tone(d, t + k * 0.45 + i * 0.06, nf(n), 0.12, { type: 'square', vol: 0.07 })); }],
  ['taiko', '太鼓', (d, t) => { for (const k of [0, 0.35]) { tone(d, t + k, 110, 0.5, { to: 55, vol: 0.9 }); noise(d, t + k, 0.25, { f: 300, vol: 0.4 }); } }],
  ['whistle', '笛', (d, t) => { tone(d, t, 2400, 0.9, { vol: 0.15, vib: 1, a: 0.02 }); noise(d, t, 0.9, { ft: 'bandpass', f: 2400, q: 4, vol: 0.05 }); }],
  ['gong', 'どら', (d, t) => { [110, 163, 247, 311, 432].forEach((f, i) => tone(d, t, f, 3.5, { vol: 0.22 / (i + 1), a: 0.01, r: 3, rev: 0.5 })); noise(d, t, 0.4, { f: 1200, vol: 0.2 }); }],
  ['kane', 'お寺の鐘', (d, t) => { [[98, 0.35], [99.4, 0.3], [196.6, 0.15], [266, 0.1], [402, 0.06]].forEach(([f, v]) => tone(d, t, f, 5, { vol: v, a: 0.01, r: 4.5, rev: 0.5 })); }],
  ['suzu', '鈴', (d, t) => { for (let i = 0; i < 7; i++) { const k = t + i * 0.07 + rnd(0, 0.03); tone(d, k, rnd(4000, 4600), 0.25, { vol: 0.07, rev: 0.4 }); noise(d, k, 0.05, { ft: 'bandpass', f: 6000, q: 6, vol: 0.2 }); } }],
  ['bell', 'ベル', (d, t) => { tone(d, t, 2093, 1.3, { vol: 0.2, rev: 0.5 }); tone(d, t, 5240, 0.6, { vol: 0.05 }); }],
  ['hakushu', '拍手', (d, t) => { for (let i = 0; i < 60; i++) noise(d, t + rnd(0, 2.4), 0.04, { ft: 'bandpass', f: rnd(900, 2200), q: 1.5, vol: rnd(0.1, 0.3) }); }],
  ['pistol', 'スタートの合図', (d, t) => { noise(d, t, 0.35, { ft: 'highpass', f: 700, vol: 0.9, rev: 0.4 }); tone(d, t, 220, 0.2, { to: 60, vol: 0.5 }); }],
  ['drumroll', 'ドラムロール', (d, t) => { for (let i = 0; i < 40; i++) noise(d, t + i * 0.05, 0.06, { ft: 'bandpass', f: 1800, vol: 0.08 + i * 0.006 }); noise(d, t + 2.05, 1.4, { ft: 'highpass', f: 3000, vol: 0.4, rev: 0.4 }); tone(d, t + 2.05, 150, 0.3, { to: 45, vol: 0.8 }); }],
  ['doa', 'ドアがひらく', (d, t) => { tone(d, t, 140, 1.0, { type: 'sawtooth', to: 230, vol: 0.1, lp: 900, vib: 1 }); noise(d, t + 1.0, 0.08, { f: 900, vol: 0.4 }); }],
  ['pen', 'えんぴつ', (d, t) => { for (let i = 0; i < 7; i++) noise(d, t + i * 0.13, 0.09, { ft: 'bandpass', f: rnd(3500, 5000), q: 3, vol: 0.25 }); }],
  ['kami', '紙をまるめる', (d, t) => { for (let i = 0; i < 26; i++) noise(d, t + rnd(0, 1.1), 0.03, { ft: 'bandpass', f: rnd(1500, 4500), q: 2, vol: rnd(0.1, 0.35) }); }],
  ['fumikiri', '踏切', (d, t) => { for (let i = 0; i < 8; i++) { const k = t + i * 0.45; tone(d, k, 750, 0.3, { type: 'triangle', vol: 0.25 }); tone(d, k, 1125, 0.3, { vol: 0.1 }); } }],
  ['siren', '救急車', (d, t) => { for (let i = 0; i < 6; i++) tone(d, t + i * 0.6, i % 2 ? 770 : 960, 0.6, { type: 'triangle', vol: 0.2, a: 0.02, r: 0.05, sus: 1 }); }],
  ['klaxon', 'クラクション', (d, t) => { for (const [k, du] of [[0, 0.18], [0.25, 0.5]]) [440, 554].forEach(f => tone(d, t + k, f, du, { type: 'sawtooth', vol: 0.08, lp: 2000, a: 0.01, r: 0.03 })); }],
  ['mezamashi', '目ざまし', (d, t) => { for (let r = 0; r < 2; r++) for (let i = 0; i < 14; i++) tone(d, t + r * 1.1 + i * 0.06, 2100, 0.04, { type: 'square', vol: 0.06, a: 0.002, r: 0.01 }); }],
  ['ame', '雨', (d, t) => { noise(d, t, 4, { f: 6000, vol: 0.22, a: 0.5, hold: 3.2 }); for (let i = 0; i < 40; i++) tone(d, t + rnd(0.2, 3.8), rnd(1800, 3200), 0.05, { to: 900, vol: 0.05 }); }],
  ['nami', '波', (d, t) => { for (const k of [0, 2.2]) { const n = noise(d, t + k, 2.4, { f: 300, vol: 0.45, a: 1.0, hold: 1.2 }); n.fl.frequency.linearRampToValueAtTime(1600, t + k + 1.1); n.fl.frequency.linearRampToValueAtTime(400, t + k + 2.4); } }],
  ['mushi', '虫の声', (d, t) => { for (let g = 0; g < 4; g++) for (let i = 0; i < 9; i++) tone(d, t + g * 0.8 + i * 0.045, 4200, 0.03, { vol: 0.08, a: 0.003, r: 0.01 }); }],
  ['takibi', 'たき火', (d, t) => { noise(d, t, 3.5, { f: 900, vol: 0.15, a: 0.4, hold: 2.8 }); for (let i = 0; i < 30; i++) noise(d, t + rnd(0, 3.3), 0.02, { ft: 'highpass', f: rnd(2000, 5000), vol: rnd(0.2, 0.5) }); }],
  ['kawa', '川', (d, t) => { noise(d, t, 3.6, { ft: 'bandpass', f: 1100, q: 0.6, vol: 0.3, a: 0.5, hold: 2.8 }); for (let i = 0; i < 25; i++) tone(d, t + rnd(0.2, 3.3), rnd(500, 1300), 0.06, { to: rnd(1400, 2200), vol: 0.05 }); }],
  ['kaeru', 'カエル', (d, t) => { for (const k of [0, 0.3, 0.9, 1.2]) tone(d, t + k, 170, 0.14, { type: 'square', to: 130, vol: 0.1, lp: 900 }); }],
  ['fukurou', 'フクロウ', (d, t) => { tone(d, t, 420, 0.45, { to: 380, vol: 0.25, rev: 0.5 }); tone(d, t + 0.75, 430, 0.7, { to: 370, vol: 0.25, rev: 0.5 }); }],
  ['punch', 'パンチ', (d, t) => { noise(d, t, 0.16, { f: 1500, vol: 0.9 }); tone(d, t, 170, 0.16, { to: 50, vol: 0.7 }); }],
  ['swing', '風を切る', (d, t) => { noise(d, t, 0.3, { ft: 'bandpass', f: 700, fto: 3200, q: 2, vol: 0.4, a: 0.08 }); }],
  ['dash', 'ダッシュ', (d, t) => { noise(d, t, 0.55, { ft: 'bandpass', f: 1800, fto: 400, q: 1.5, vol: 0.4, a: 0.02 }); for (let i = 0; i < 4; i++) noise(d, t + i * 0.09, 0.05, { f: 600, vol: 0.3 }); }],
  ['gachan', 'ガシャン', (d, t) => { noise(d, t, 0.5, { ft: 'highpass', f: 2000, vol: 0.6 }); for (let i = 0; i < 14; i++) tone(d, t + rnd(0.02, 0.7), rnd(2500, 6000), 0.15, { vol: 0.05 }); tone(d, t, 120, 0.15, { to: 60, vol: 0.4 }); }],
  ['bon', 'けむり', (d, t) => { noise(d, t, 0.9, { f: 900, fto: 150, vol: 0.7, rev: 0.3 }); tone(d, t, 220, 0.3, { to: 70, vol: 0.4 }); }],
  ['warp', 'ワープ', (d, t) => { tone(d, t, 300, 0.5, { to: 2400, vol: 0.15, vib: 1 }); tone(d, t + 0.5, 2400, 0.5, { to: 300, vol: 0.15, vib: 1, rev: 0.4 }); }],
  ['beam', 'ビーム', (d, t) => { tone(d, t, 1600, 0.55, { type: 'square', to: 300, vol: 0.08, vib: 1 }); tone(d, t, 3200, 0.55, { type: 'sawtooth', to: 700, vol: 0.04, lp: 4000 }); }],
  ['maho', 'まほう', (d, t) => { for (let i = 0; i < 14; i++) tone(d, t + i * 0.07, rnd(1500, 4000), 0.4, { vol: 0.07, rev: 0.7 }); noise(d, t, 1.0, { ft: 'highpass', f: 6000, vol: 0.08, a: 0.3 }); }]
);
const SE_CATS = [
  ['システム', 'kettei cancel pon cursor page beep tsuuchi camera seikai fuseikai kotsu'],
  ['気持ち', 'pikon bikkuri kirakira shinzou gaan doki hatena kyupiin zukoo shonbori wakuwaku'],
  ['学校・合図', 'chime fanfare taiko whistle gong kane suzu bell hakushu pistol drumroll'],
  ['生活', 'door ashioto tokei denwa doa pen kami fumikiri siren klaxon mezamashi'],
  ['自然', 'kaminari kaze mizu tori ame nami mushi takibi kawa kaeru fukurou'],
  ['アクション・ふしぎ', 'jump ochiru bakuhatsu punch swing dash gachan bon warp beam maho']
].map(([n, ids]) => [n, ids.split(' ').map(x => 'S:' + x)]);

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

BGM_LIST.push(
  { id: 'asa', name: '朝', bpm: 120, lead: 'square', leadLp: 3000, bass: 'walk', pad: 0.03, arp: 0.03, drum: 'k.h.s.h.k.h.s.h.', chords: 'C Em F G Am Em F G',
    mel: 'G5:2 E5:2 C5:2 E5:2 G5:4 C6:4|B5:2 G5:2 E5:2 G5:2 B5:4 -:4|A5:2 F5:2 C5:2 F5:2 A5:4 C6:4|B5:4 D6:4 G5:8|C6:2 B5:2 A5:2 E5:2 C5:4 E5:4|G5:4 B5:4 E5:8|F5:2 A5:2 C6:2 A5:2 F5:4 A5:4|G5:4 F5:2 E5:2 D5:8' },
  { id: 'gakkou', name: '学校', bpm: 128, lead: 'square', leadLp: 2600, bass: 'bounce', pad: 0, arp: 0, drum: 'k...s...k.k.s...', chords: 'F Bb C F F Bb C F',
    mel: 'C5:4 F5:4 A5:4 F5:4|D5:4 F5:4 Bb5:8|C6:4 A5:4 G5:4 E5:4|F5:12 -:4|A5:2 A5:2 A5:4 G5:2 F5:2 G5:4|Bb5:4 A5:4 G5:4 D5:4|C5:4 E5:4 G5:4 Bb5:4|A5:4 C6:4 F5:8' },
  { id: 'odekake', name: 'おでかけ', bpm: 136, lead: 'triangle', leadLp: 3200, bass: 'bounce', pad: 0, arp: 0.05, drum: 'k.h.s.hkk.h.s.h.', chords: 'G C D G Em C D G',
    mel: 'D5:2 G5:2 B5:2 D6:2 B5:4 G5:4|E5:2 G5:2 C6:2 E6:2 C6:8|F#5:2 A5:2 D6:4 C6:2 B5:2 A5:4|G5:8 B4:4 D5:4|E5:2 G5:2 B5:4 A5:2 G5:2 E5:4|C5:4 E5:4 G5:4 C6:4|D6:2 C6:2 B5:2 A5:2 F#5:4 A5:4|G5:12 -:4' },
  { id: 'omatsuri', name: 'おまつり', bpm: 140, lead: 'square', leadLp: 2400, bass: 'eighth', pad: 0, arp: 0, drum: 'k.k.s.k.k.k.s.k.', chords: 'D D G D D G A D',
    mel: 'A5:4 B5:2 A5:2 F#5:4 E5:4|D5:4 E5:4 F#5:8|B5:4 A5:2 B5:2 D6:4 B5:4|A5:12 -:4|D6:2 D6:2 B5:4 A5:2 B5:2 A5:4|F#5:4 E5:4 D5:8|B4:4 D5:4 E5:4 A5:4|D5:12 -:4' },
  { id: 'yasashii', name: 'やさしい', bpm: 84, lead: 'triangle', leadLp: 2600, vib: 1, bass: 'long', pad: 0.05, arp: 0.03, arpWave: 'sine', drum: '', chords: 'D A Bm G D A G A', rev: 0.45,
    mel: 'F#5:6 E5:2 D5:8|E5:6 C#5:2 A4:8|D5:4 F#5:4 B5:6 A5:2|G5:8 D5:8|F#5:4 A5:4 D6:6 C#6:2|E5:4 A5:4 C#6:8|B5:4 G5:4 D5:4 B4:4|C#5:4 E5:4 A5:8' },
  { id: 'yugata', name: '夕方', bpm: 76, lead: 'sine', leadLp: 3000, vib: 1, bass: 'long', pad: 0.07, arp: 0, drum: '', chords: 'Bb F Gm Eb Bb F Eb F', rev: 0.55,
    mel: 'D5:6 C5:2 Bb4:8|C5:6 A4:2 F4:8|Bb4:4 D5:4 G5:8|G5:4 F5:4 Eb5:8|F5:6 D5:2 Bb5:8|A5:6 F5:2 C5:8|Eb5:4 G5:4 Bb5:4 G5:4|F5:12 -:4' },
  { id: 'yoru', name: '夜', bpm: 66, lead: 'sine', leadLp: 3000, bass: 'long', pad: 0.05, arp: 0.05, arpWave: 'sine', drum: '', chords: 'Am Em F C Am Em F E', rev: 0.6,
    mel: '-:4 E5:4 A5:8|G5:8 E5:8|F5:4 A5:4 C6:8|G5:12 -:4|E5:4 A5:4 B5:4 C6:4|B5:8 G5:8|A5:4 F5:4 C5:8|B4:12 -:4' },
  { id: 'omoide', name: '思い出', bpm: 80, lead: 'triangle', leadLp: 3000, bass: 'long', pad: 0.05, arp: 0.05, arpWave: 'triangle', drum: '', chords: 'Fmaj7 Em7 Dm7 G Fmaj7 Em7 Dm7 C', rev: 0.5,
    mel: 'A5:6 G5:2 E5:8|G5:6 E5:2 D5:8|F5:4 E5:4 D5:4 C5:4|D5:12 -:4|A5:4 C6:4 E6:8|D6:4 B5:4 G5:8|F5:4 A5:4 D6:4 C6:4|C6:12 -:4' },
  { id: 'namida', name: 'なみだ', bpm: 64, lead: 'sine', leadLp: 2600, vib: 1, bass: 'long', pad: 0.08, arp: 0, drum: '', chords: 'Dm Bb F A Dm Bb Gm A', rev: 0.6,
    mel: 'A5:6 G5:2 F5:4 E5:4|D5:8 F5:8|C5:6 D5:2 F5:4 A5:4|E5:12 -:4|F5:6 E5:2 D5:4 A4:4|Bb4:8 D5:8|G5:6 F5:2 E5:4 D5:4|C#5:12 -:4' },
  { id: 'nazo', name: 'なぞ', bpm: 96, lead: 'sine', leadLp: 3000, bass: 'ost', pad: 0.03, arp: 0.05, arpWave: 'sine', drum: '....h.......h...', chords: 'Dm Dm Bb A Dm Dm Bb A', rev: 0.4,
    mel: 'D5:2 F5:2 A5:2 G#5:2 A5:8|-:4 F5:2 E5:2 D5:8|Bb4:2 D5:2 F5:2 E5:2 D5:8|C#5:8 E5:8|D6:2 C6:2 A5:2 G#5:2 A5:8|-:4 F5:2 G5:2 A5:8|Bb5:4 A5:4 G5:4 F5:4|E5:12 -:4' },
  { id: 'yume', name: '夢の中', bpm: 72, lead: 'sine', leadLp: 4000, vib: 1, bass: 'long', pad: 0.05, arp: 0.06, arpWave: 'sine', drum: '', chords: 'C D C D Ab Bb Ab Bb', rev: 0.7,
    mel: 'E6:6 D6:2 C6:8|F#5:8 A#5:8|G#5:6 F#5:2 E5:8|D5:12 -:4|C6:4 D6:4 E6:8|F#6:8 E6:8|D6:4 C6:4 A#5:4 G#5:4|C6:12 -:4' },
  { id: 'kowai', name: 'こわい', bpm: 70, lead: 'sawtooth', leadLp: 900, bass: 'long', pad: 0.06, arp: 0, drum: 'k...............', chords: 'Cm Cm Ab G Cm Cm Ab G', rev: 0.6,
    mel: 'C5:8 Eb5:4 D5:4|C5:4 B4:4 C5:8|Ab4:8 C5:4 Eb5:4|D5:12 B4:4|G5:8 F#5:8|F5:4 Eb5:4 D5:8|C5:4 Eb5:4 Ab5:8|G5:12 -:4' },
  { id: 'oikakekko', name: 'おいかけっこ', bpm: 172, lead: 'square', leadLp: 2800, bass: 'eighth', pad: 0, arp: 0, drum: 'k.hsk.hsk.hsk.hs', chords: 'Am F G E Am F G E',
    mel: 'A5:2 E5:2 A5:2 B5:2 C6:2 B5:2 A5:2 E5:2|F5:2 A5:2 C6:2 A5:2 F5:4 A5:4|G5:2 B5:2 D6:2 B5:2 G5:4 D5:4|E5:2 G#5:2 B5:2 E6:2 D6:4 B5:4|A5:2 C6:2 E6:2 C6:2 A5:4 E5:4|F5:2 C6:2 A5:2 F5:2 C5:4 F5:4|G5:2 A5:2 B5:2 C6:2 D6:4 B5:4|E6:4 B5:4 G#5:4 E5:4' },
  { id: 'boss', name: 'ボス戦', bpm: 168, lead: 'sawtooth', leadLp: 2600, bass: 'eighth', pad: 0.03, arp: 0.03, drum: 'k.hsk.hsk.ksk.ss', chords: 'Cm Cm Ab Bb Cm Cm Ab G',
    mel: 'C5:2 C5:2 G5:2 C5:2 Eb5:2 G5:2 C6:4|Bb5:2 G5:2 Eb5:2 C5:2 G4:4 C5:4|Ab5:2 C6:2 Eb6:4 D6:2 C6:2 Ab5:4|Bb5:4 D6:4 F6:4 D6:4|G5:4 Eb6:4 D6:4 C6:4|Bb5:2 C6:2 D6:2 Eb6:2 G6:8|F6:4 Eb6:4 C6:4 Ab5:4|G5:4 B5:4 D6:4 G6:4' },
  { id: 'shouri', name: '勝利', bpm: 130, lead: 'square', leadLp: 3200, bass: 'bounce', pad: 0.03, arp: 0, drum: 'k.h.s.h.k.h.s.h.', chords: 'C F G C C F G C',
    mel: 'G5:2 G5:2 G5:2 C6:10|A5:2 A5:2 A5:2 F6:10|D6:4 E6:2 F6:2 G6:4 B5:4|C6:12 -:4|E6:4 D6:4 C6:4 G5:4|A5:4 C6:4 F6:8|G6:4 F6:4 D6:4 B5:4|C6:12 -:4' },
  { id: 'komikaru', name: 'コミカル', bpm: 150, lead: 'square', leadLp: 2400, bass: 'bounce', pad: 0, arp: 0, drum: 'k..sk..sk..sk.s.', chords: 'Bb Gm Eb F Bb Gm Eb F',
    mel: 'F5:1 -:1 D5:1 -:1 Bb4:2 -:2 F5:2 G5:2 F5:4|G5:1 -:1 Bb5:1 -:1 D6:2 -:2 Bb5:2 G5:2 D5:4|Eb5:2 G5:2 Bb5:2 G5:2 Eb5:4 -:4|F5:2 A5:2 C6:2 A5:2 F5:4 -:4|Bb5:1 -:1 Bb5:1 -:1 A5:2 G5:2 F5:4 D5:4|G5:2 Bb5:2 D6:4 C6:2 Bb5:2 G5:4|Eb5:4 G5:4 C6:4 Bb5:4|A5:2 C6:2 F6:4 -:8' }
);
const BGM_CATS = [
  ['明るい', 'nichijou tanoshii asa gakkou odekake omatsuri'],
  ['やさしい', 'honobono yasashii yugata omoide'],
  ['かなしい・夜', 'kanashii yoru namida ending'],
  ['ふしぎ・こわい', 'fushigi nazo yume kowai kinchou'],
  ['バトル・イベント', 'battle oikakekko boss shouri komikaru']
].map(([n, ids]) => [n, ids.split(' ').map(x => 'M:' + x)]);

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
