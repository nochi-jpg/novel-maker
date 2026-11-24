/* ===== さらに追加の効果音・BGM（11/24：効果音198・BGM72に） ===== */
const SE_ADD3 = {
  'システム': [
    ['okbtn', 'OKボタン', (d, t) => { tone(d, t, 784, 0.07, { type: 'triangle', vol: 0.3 }); tone(d, t + 0.07, 1175, 0.14, { type: 'triangle', vol: 0.28 }); }],
    ['menu', 'メニュー', (d, t) => { tone(d, t, 660, 0.05, { type: 'square', vol: 0.08 }); tone(d, t + 0.05, 880, 0.08, { type: 'square', vol: 0.08 }); }],
    ['tab', 'タブ切りかえ', (d, t) => { noise(d, t, 0.03, { ft: 'bandpass', f: 3000, q: 3, vol: 0.4 }); tone(d, t, 1400, 0.05, { vol: 0.12 }); }],
    ['kurukuru', 'くるくる', (d, t) => { for (let i = 0; i < 8; i++) tone(d, t + i * 0.05, i % 2 ? 1200 : 900, 0.05, { type: 'triangle', vol: 0.15 }); }],
    ['powerup', 'パワーアップ', (d, t) => { tone(d, t, 300, 0.6, { type: 'square', to: 1500, vol: 0.08, vib: 1 }); tone(d, t + 0.6, 1568, 0.3, { type: 'square', vol: 0.08, rev: 0.3 }); }],
    ['getitem', 'アイテムゲット', (d, t) => { ['G5', 'B5', 'D6', 'G6'].forEach((n, i) => tone(d, t + i * 0.08, nf(n), i === 3 ? 0.4 : 0.09, { type: 'square', vol: 0.08 })); }],
    ['lock', 'ロック', (d, t) => { noise(d, t, 0.05, { ft: 'bandpass', f: 1800, q: 4, vol: 0.5 }); tone(d, t, 400, 0.08, { type: 'square', vol: 0.1, lp: 1200 }); }],
    ['unlock', 'ロック解除', (d, t) => { noise(d, t, 0.05, { ft: 'bandpass', f: 2400, q: 4, vol: 0.5 }); tone(d, t + 0.06, 880, 0.12, { vol: 0.15 }); tone(d, t + 0.16, 1320, 0.2, { vol: 0.15 }); }],
    ['warning', 'けいこく', (d, t) => { for (let i = 0; i < 4; i++) tone(d, t + i * 0.3, i % 2 ? 620 : 880, 0.28, { type: 'square', vol: 0.08, lp: 2200 }); }],
    ['clear', 'クリア', (d, t) => { ['C5', 'E5', 'G5', 'C6', 'G5', 'C6'].forEach((n, i) => tone(d, t + i * 0.11, nf(n), i === 5 ? 0.8 : 0.12, { type: 'square', vol: 0.09, rev: 0.3 })); }],
    ['hint', 'ヒント', (d, t) => { tone(d, t, 1568, 0.12, { vol: 0.2 }); tone(d, t + 0.12, 2093, 0.3, { vol: 0.18, rev: 0.4 }); }]
  ],
  '気持ち': [
    ['yatta', 'やったー', (d, t) => { ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(d, t + i * 0.07, nf(n), 0.14, { type: 'triangle', vol: 0.3 })); tone(d, t + 0.3, nf('E6'), 0.5, { type: 'triangle', vol: 0.3, vib: 1 }); }],
    ['fufu', 'ふふっ', (d, t) => { for (const k of [0, 0.14]) tone(d, t + k, 900, 0.08, { to: 1100, vol: 0.2 }); }],
    ['mukatto', 'ムカッ', (d, t) => { tone(d, t, 200, 0.25, { type: 'sawtooth', to: 400, vol: 0.12, lp: 1500 }); noise(d, t + 0.2, 0.1, { f: 1200, vol: 0.3 }); }],
    ['zawazawa', 'ざわざわ', (d, t) => { for (let i = 0; i < 30; i++) tone(d, t + rnd(0, 2), rnd(200, 500), 0.25, { type: 'sawtooth', to: rnd(200, 500), vol: 0.02, lp: 900 }); }],
    ['pinto', 'ピンときた', (d, t) => { tone(d, t, 2093, 0.08, { vol: 0.2 }); tone(d, t + 0.08, 3136, 0.4, { vol: 0.15, rev: 0.4 }); }],
    ['nikoniko', 'にこにこ', (d, t) => { ['E5', 'G5', 'E5', 'C6'].forEach((n, i) => tone(d, t + i * 0.12, nf(n), 0.14, { vol: 0.2 })); }],
    ['dokidoki2', 'ドキドキ（速い）', (d, t) => { for (let i = 0; i < 6; i++) { const k = t + i * 0.32; tone(d, k, 75, 0.1, { to: 45, vol: 0.6 }); tone(d, k + 0.12, 65, 0.1, { to: 42, vol: 0.5 }); } }],
    ['ah', 'あっ', (d, t) => { tone(d, t, 600, 0.15, { type: 'triangle', to: 1000, vol: 0.3 }); }],
    ['hott', 'ほっ', (d, t) => { tone(d, t, 700, 0.6, { type: 'triangle', to: 450, vol: 0.25, a: 0.05 }); noise(d, t, 0.4, { ft: 'bandpass', f: 1200, vol: 0.06, a: 0.1 }); }],
    ['gyu', 'ぎゅっ', (d, t) => { tone(d, t, 300, 0.2, { type: 'sawtooth', to: 150, vol: 0.12, lp: 1200 }); noise(d, t, 0.15, { ft: 'bandpass', f: 600, vol: 0.2 }); }],
    ['puun', 'ぷーん（すねる）', (d, t) => { tone(d, t, 500, 0.6, { type: 'triangle', to: 420, vol: 0.25, vib: 1 }); }]
  ],
  '学校・合図': [
    ['kokuban', '黒板に書く', (d, t) => { for (let i = 0; i < 7; i++) noise(d, t + i * 0.12 + rnd(0, 0.03), 0.08, { ft: 'bandpass', f: rnd(3000, 4500), q: 2, vol: 0.3 }); }],
    ['recorder', 'リコーダー', (d, t) => { ['C5', 'D5', 'E5', 'F5', 'G5'].forEach((n, i) => tone(d, t + i * 0.22, nf(n), 0.22, { vol: 0.15, vib: 1, a: 0.03 })); }],
    ['harmonica', 'けんばんハーモニカ', (d, t) => { ['G4', 'E4', 'G4', 'C5'].forEach((n, i) => tone(d, t + i * 0.25, nf(n), 0.24, { type: 'sawtooth', vol: 0.06, lp: 2000, a: 0.02 })); }],
    ['cymbal', 'シンバル', (d, t) => { noise(d, t, 2.0, { ft: 'highpass', f: 5000, vol: 0.5, a: 0.002 }); }],
    ['snare', '小太鼓', (d, t) => { for (let i = 0; i < 10; i++) noise(d, t + i * 0.07, 0.06, { ft: 'bandpass', f: 2200, q: 0.8, vol: 0.5 * (0.5 + i / 20) }); }],
    ['yooidon', 'よーいドン', (d, t) => { tone(d, t, 660, 0.5, { type: 'triangle', vol: 0.2 }); noise(d, t + 0.8, 0.25, { f: 3000, vol: 0.9 }); tone(d, t + 0.8, 150, 0.2, { to: 60, vol: 0.6 }); }],
    ['housouend', '放送のおわり', (d, t) => { ['F6', 'C6', 'A5', 'F5'].forEach((n, i) => tone(d, t + i * 0.42, nf(n), 1.2, { vol: 0.2, rev: 0.5 })); }],
    ['hyoushigi', '拍子木', (d, t) => { for (const k of [0, 0.45]) noise(d, t + k, 0.05, { ft: 'bandpass', f: 1800, q: 6, vol: 0.9 }); }],
    ['metronome', 'メトロノーム', (d, t) => { for (let i = 0; i < 4; i++) noise(d, t + i * 0.5, 0.02, { ft: 'bandpass', f: i ? 2500 : 3500, q: 5, vol: 0.7 }); }],
    ['mic', 'マイクのキーン', (d, t) => { tone(d, t, 2800, 1.2, { vol: 0.06, a: 0.4, vib: 1 }); }],
    ['tebyoushi', '手びょうし', (d, t) => { for (const k of [0, 0.3, 0.6, 0.75, 0.9]) noise(d, t + k, 0.05, { ft: 'bandpass', f: 1500, q: 1, vol: 0.7 }); }]
  ],
  '生活': [
    ['kettle', 'やかん', (d, t) => { tone(d, t, 1800, 2.0, { to: 2400, vol: 0.05, a: 0.8, vib: 1 }); noise(d, t, 2.0, { ft: 'bandpass', f: 2500, q: 3, vol: 0.06, a: 0.8 }); }],
    ['renji', '電子レンジ', (d, t) => { for (let i = 0; i < 3; i++) tone(d, t + i * 0.35, 2000, 0.25, { type: 'square', vol: 0.06 }); }],
    ['hasami', 'はさみ', (d, t) => { for (const k of [0, 0.3]) { noise(d, t + k, 0.12, { ft: 'bandpass', f: 4000, fto: 2000, q: 2, vol: 0.4 }); noise(d, t + k + 0.12, 0.03, { ft: 'bandpass', f: 2500, q: 5, vol: 0.5 }); } }],
    ['fasuna', 'ファスナー', (d, t) => { const n = noise(d, t, 0.5, { ft: 'bandpass', f: 1500, q: 2, vol: 0.4 }); n.fl.frequency.linearRampToValueAtTime(4000, t + 0.5); }],
    ['shower', 'シャワー', (d, t) => { noise(d, t, 3, { ft: 'highpass', f: 2500, vol: 0.35, a: 0.2, hold: 2.5 }); }],
    ['vibe', 'スマホのバイブ', (d, t) => { for (const k of [0, 0.6]) tone(d, t + k, 150, 0.4, { type: 'sawtooth', vol: 0.12, lp: 400 }); }],
    ['busbell', 'バスのとまります', (d, t) => { tone(d, t, 1047, 0.4, { vol: 0.2, rev: 0.2 }); tone(d, t, 1319, 0.4, { vol: 0.12 }); }],
    ['switch', 'スイッチ', (d, t) => { noise(d, t, 0.03, { ft: 'bandpass', f: 2000, q: 4, vol: 0.7 }); }],
    ['fusuma', 'ふすま', (d, t) => { noise(d, t, 0.5, { ft: 'bandpass', f: 600, q: 1, vol: 0.4, a: 0.05 }); noise(d, t + 0.5, 0.06, { f: 500, vol: 0.5 }); }],
    ['sara', 'お皿', (d, t) => { tone(d, t, 2400, 0.4, { vol: 0.08, a: 0.002 }); tone(d, t, 3700, 0.3, { vol: 0.05 }); noise(d, t, 0.04, { ft: 'highpass', f: 3000, vol: 0.3 }); }],
    ['keyboard', 'キーボード', (d, t) => { for (let i = 0; i < 12; i++) noise(d, t + i * 0.07 + rnd(0, 0.03), 0.02, { ft: 'bandpass', f: rnd(1500, 2500), q: 3, vol: 0.4 }); }]
  ],
  '自然': [
    ['uguisu', 'うぐいす', (d, t) => { tone(d, t, 1400, 0.6, { vol: 0.12, a: 0.2 }); tone(d, t + 0.7, 2100, 0.15, { to: 2800, vol: 0.12 }); tone(d, t + 0.88, 2400, 0.4, { to: 1800, vol: 0.12 }); }],
    ['hato', 'ハト', (d, t) => { for (const k of [0, 0.5]) tone(d, t + k, 380, 0.35, { to: 300, vol: 0.15, vib: 1, lp: 900 }); }],
    ['niwatori', 'ニワトリ', (d, t) => { [[0, 0.12], [0.15, 0.12], [0.3, 0.12], [0.45, 0.6]].forEach(([k, du], i) => tone(d, t + k, i === 3 ? 900 : 700, du, { type: 'sawtooth', to: i === 3 ? 600 : 800, vol: 0.08, lp: 2200 })); }],
    ['ushi', 'ウシ', (d, t) => { tone(d, t, 140, 1.2, { type: 'sawtooth', to: 110, vol: 0.12, lp: 600, a: 0.1, vib: 1 }); }],
    ['hitsuji', 'ヒツジ', (d, t) => { tone(d, t, 450, 0.8, { type: 'sawtooth', vol: 0.08, lp: 1600, vib: 1, a: 0.05 }); }],
    ['kogarashi', '木枯らし', (d, t) => { const n = noise(d, t, 3, { ft: 'bandpass', f: 800, q: 4, vol: 0.25, a: 0.6, hold: 1.8 }); n.fl.frequency.linearRampToValueAtTime(1800, t + 1.5); n.fl.frequency.linearRampToValueAtTime(700, t + 3); }],
    ['arare', 'あられ', (d, t) => { for (let i = 0; i < 40; i++) noise(d, t + rnd(0, 2), 0.02, { ft: 'highpass', f: 3000, vol: 0.3 }); }],
    ['taki', '滝', (d, t) => { noise(d, t, 4, { f: 1200, vol: 0.5, a: 0.4, hold: 3.3 }); noise(d, t, 4, { f: 200, vol: 0.3, a: 0.4, hold: 3.3 }); }],
    ['kamome', 'カモメ', (d, t) => { for (const k of [0, 0.4]) tone(d, t + k, 1300, 0.3, { type: 'sawtooth', to: 1000, vol: 0.06, lp: 2500 }); }],
    ['suzume', 'スズメ', (d, t) => { for (let i = 0; i < 5; i++) tone(d, t + i * 0.13 + rnd(0, 0.03), rnd(3500, 4500), 0.05, { to: 3000, vol: 0.1 }); }],
    ['kazan', '火山', (d, t) => { tone(d, t, 50, 2.5, { vol: 0.7, a: 0.3 }); noise(d, t + 0.3, 2.2, { f: 600, fto: 200, vol: 0.7, a: 0.05 }); }]
  ],
  'アクション・ふしぎ': [
    ['kick', 'キック', (d, t) => { noise(d, t, 0.12, { ft: 'bandpass', f: 1500, fto: 400, vol: 0.5 }); tone(d, t + 0.1, 120, 0.18, { to: 50, vol: 0.8 }); }],
    ['shuriken', '手裏剣', (d, t) => { for (let i = 0; i < 6; i++) noise(d, t + i * 0.06, 0.05, { ft: 'bandpass', f: 4000 - i * 300, q: 3, vol: 0.4 }); noise(d, t + 0.4, 0.04, { ft: 'bandpass', f: 2500, q: 6, vol: 0.6 }); }],
    ['yumiya', '弓矢', (d, t) => { tone(d, t, 300, 0.15, { to: 150, vol: 0.3 }); noise(d, t + 0.05, 0.3, { ft: 'bandpass', f: 3000, fto: 1200, q: 2, vol: 0.3 }); noise(d, t + 0.4, 0.05, { f: 900, vol: 0.6 }); }],
    ['tate', '盾でふせぐ', (d, t) => { noise(d, t, 0.1, { f: 2500, vol: 0.6 }); tone(d, t, 800, 0.5, { type: 'square', to: 600, vol: 0.06, lp: 2000 }); tone(d, t, 1900, 0.4, { vol: 0.05 }); }],
    ['shoukan', 'しょうかん', (d, t) => { tone(d, t, 150, 1.2, { type: 'sawtooth', to: 600, vol: 0.1, lp: 1500, rev: 0.6 }); ['C5', 'G5', 'C6', 'G6'].forEach((n, i) => tone(d, t + 0.8 + i * 0.07, nf(n), 0.6, { vol: 0.08, rev: 0.6 })); }],
    ['henshin', 'へんしん', (d, t) => { for (let i = 0; i < 12; i++) tone(d, t + i * 0.06, 400 + i * 120, 0.08, { type: 'square', vol: 0.06 }); noise(d, t + 0.75, 0.4, { ft: 'highpass', f: 4000, vol: 0.3 }); }],
    ['inazuma', 'いなずま魔法', (d, t) => { noise(d, t, 0.6, { ft: 'highpass', f: 1500, vol: 0.7, a: 0.002 }); for (let i = 0; i < 6; i++) tone(d, t + rnd(0, 0.4), rnd(800, 3000), 0.05, { type: 'square', vol: 0.06 }); }],
    ['tokitomaru', '時間がとまる', (d, t) => { tone(d, t, 1200, 1.2, { to: 100, vol: 0.12, rev: 0.7 }); tone(d, t + 1.1, 3000, 0.8, { vol: 0.05, rev: 0.7 }); }],
    ['shunkan', 'しゅんかん移動', (d, t) => { tone(d, t, 2500, 0.15, { to: 400, vol: 0.12 }); tone(d, t + 0.2, 400, 0.15, { to: 2500, vol: 0.12 }); }],
    ['awa', 'あわ', (d, t) => { for (let i = 0; i < 10; i++) tone(d, t + i * 0.1 + rnd(0, 0.05), rnd(500, 900), 0.08, { to: rnd(1200, 1800), vol: 0.12 }); }],
    ['poyon', 'ぽよん', (d, t) => { tone(d, t, 300, 0.3, { to: 600, vol: 0.3, vib: 1 }); }]
  ]
};
for (const [cat, list] of Object.entries(SE_ADD3)) {
  const c = SE_CATS.find(x => x[0] === cat);
  for (const s of list) { SE_LIST.push(s); SE_MAP['S:' + s[0]] = s; c[1].push('S:' + s[0]); }
}
const BGM_ADD3 = {
  '明るい': [
    { id: 'natsuyasumi', name: '夏休み', bpm: 140, lead: 'square', leadLp: 3200, bass: 'bounce', pad: 0, arp: 0.04, drum: 'k.h.s.h.k.hks.h.', chords: 'F C Dm Bb F C Bb C',
      mel: 'A5:2 C6:2 F6:4 E6:4 C6:4|G5:4 C6:4 E6:8|F5:2 A5:2 D6:4 C6:4 A5:4|Bb5:4 D6:4 F6:8|A5:2 C6:2 F6:4 G6:4 F6:4|E6:4 C6:4 G5:8|D6:2 C6:2 Bb5:4 A5:4 G5:4|C6:12 -:4' },
    { id: 'ensoku', name: '遠足', bpm: 116, lead: 'triangle', leadLp: 3000, bass: 'walk', pad: 0.03, arp: 0.04, arpWave: 'triangle', drum: 'k...s...k...s...', chords: 'G C D G Em C D G',
      mel: 'D5:4 G5:4 B5:4 G5:4|E5:4 G5:4 C6:8|D5:4 F#5:4 A5:4 D6:4|B5:12 -:4|B5:4 G5:4 E5:4 G5:4|C6:4 B5:4 A5:4 G5:4|F#5:4 A5:4 D6:4 C6:4|B5:12 -:4' },
    { id: 'party', name: 'パーティー', bpm: 128, lead: 'square', leadLp: 3500, bass: 'eighth', pad: 0.03, arp: 0.05, drum: 'k.hsk.hsk.hsk.hs', chords: 'C Am F G C Am F G',
      mel: 'G5:2 G5:2 C6:4 E6:2 D6:2 C6:4|A5:2 A5:2 C6:4 E6:8|F5:2 A5:2 C6:4 F6:4 E6:4|D6:4 B5:4 G5:8|G5:2 G5:2 C6:4 E6:2 G6:2 E6:4|A6:4 E6:4 C6:8|F6:4 E6:4 D6:4 C6:4|B5:4 D6:4 G6:8' },
    { id: 'march', name: 'マーチ', bpm: 120, lead: 'square', leadLp: 3000, bass: 'bounce', pad: 0, arp: 0, drum: 'k.s.k.s.k.s.ksss', chords: 'Bb Bb F F Bb Eb F Bb',
      mel: 'F5:4 Bb5:4 D6:4 Bb5:4|F6:8 D6:8|C6:4 A5:4 F5:4 A5:4|C6:8 F6:8|D6:4 Bb5:4 F5:4 D6:4|Eb6:4 G6:4 Eb6:8|F6:4 Eb6:4 D6:4 C6:4|Bb5:12 -:4' },
    { id: 'hajimari', name: 'はじまりの朝', bpm: 100, lead: 'triangle', leadLp: 3500, bass: 'walk', pad: 0.05, arp: 0.05, arpWave: 'sine', drum: 'k.......s.......', chords: 'C G Am Em F C Dm G', rev: 0.35,
      mel: 'E5:4 G5:4 C6:8|D6:4 B5:4 G5:8|A5:4 C6:4 E6:8|G5:12 -:4|A5:4 C6:4 F6:8|E6:4 C6:4 G5:8|F5:4 A5:4 D6:4 C6:4|B5:12 -:4' }
  ],
  'やさしい': [
    { id: 'aki', name: '秋', bpm: 84, lead: 'sine', leadLp: 3000, vib: 1, bass: 'long', pad: 0.05, arp: 0.04, arpWave: 'triangle', drum: '', chords: 'Am Dm G C Fmaj7 Dm E Am', rev: 0.5,
      mel: 'E5:6 D5:2 C5:4 A4:4|F5:8 A5:8|G5:6 F5:2 E5:4 D5:4|E5:12 -:4|A5:6 G5:2 F5:4 E5:4|D5:8 F5:8|G#5:4 B5:4 E6:8|A5:12 -:4' },
    { id: 'yuuyake', name: '夕やけ空', bpm: 72, lead: 'triangle', leadLp: 2600, vib: 1, bass: 'long', pad: 0.06, arp: 0.03, arpWave: 'sine', drum: '', chords: 'D A Bm G D A G A', rev: 0.5,
      mel: 'F#5:8 E5:4 D5:4|E5:8 C#5:8|D5:4 F#5:4 B5:8|G5:12 -:4|A5:8 F#5:4 D5:4|E5:8 A5:8|B5:4 A5:4 G5:4 F#5:4|E5:12 -:4' },
    { id: 'tomodachi', name: 'ともだち', bpm: 104, lead: 'triangle', leadLp: 3200, bass: 'walk', pad: 0.04, arp: 0.04, arpWave: 'sine', drum: 'k...s...k...s...', chords: 'C Em F G C Em F C',
      mel: 'G5:4 E5:4 C5:4 E5:4|G5:4 B5:4 G5:8|A5:4 C6:4 A5:4 F5:4|D5:8 G5:8|E5:4 G5:4 C6:4 G5:4|B5:4 G5:4 E5:8|F5:4 A5:4 G5:4 E5:4|C5:12 -:4' },
    { id: 'kazoku', name: '家族', bpm: 76, lead: 'sine', leadLp: 3000, vib: 1, bass: 'long', pad: 0.06, arp: 0.04, arpWave: 'sine', drum: '', chords: 'F C Dm Bb F C Bb C', rev: 0.5,
      mel: 'C5:4 F5:4 A5:6 G5:2|E5:8 G5:8|D5:4 F5:4 A5:6 G5:2|F5:8 D5:8|C5:4 F5:4 C6:6 Bb5:2|A5:8 G5:8|F5:4 G5:4 A5:4 D6:4|C6:12 -:4' },
    { id: 'komichi', name: '森のこみち', bpm: 92, lead: 'triangle', leadLp: 3000, bass: 'walk', pad: 0.04, arp: 0.05, arpWave: 'triangle', drum: '....h.......h...', chords: 'G Em C D G Em C D', rev: 0.35,
      mel: 'B4:4 D5:4 G5:4 D5:4|E5:4 G5:4 B5:8|C5:4 E5:4 G5:4 E5:4|F#5:8 A5:8|G5:4 B5:4 D6:4 B5:4|G5:4 E5:4 B4:8|C5:4 E5:4 A5:4 G5:4|F#5:12 -:4' }
  ],
  'かなしい・夜': [
    { id: 'fuyu', name: '冬', bpm: 66, lead: 'sine', leadLp: 3500, vib: 1, bass: 'long', pad: 0.06, arp: 0.06, arpWave: 'sine', drum: '', chords: 'Dm Bb Gm A Dm Bb Gm A', rev: 0.65,
      mel: 'A5:8 F5:4 D5:4|D5:8 F5:8|G5:4 Bb5:4 D6:8|C#6:12 -:4|D6:8 A5:4 F5:4|F5:8 Bb5:8|Bb5:4 A5:4 G5:4 F5:4|E5:12 -:4' },
    { id: 'sayonara', name: 'さよなら', bpm: 70, lead: 'triangle', leadLp: 2400, vib: 1, bass: 'long', pad: 0.07, arp: 0, drum: '', chords: 'C G Am Em F C F G', rev: 0.55,
      mel: 'E5:6 D5:2 C5:8|D5:6 E5:2 G5:8|A5:4 G5:4 E5:4 C5:4|B4:12 -:4|A4:4 C5:4 F5:6 E5:2|E5:8 G5:8|F5:4 E5:4 D5:4 C5:4|D5:12 -:4' },
    { id: 'tsukiyo', name: '月夜', bpm: 64, lead: 'sine', leadLp: 4000, vib: 1, bass: 'long', pad: 0.05, arp: 0.06, arpWave: 'sine', drum: '', chords: 'Am7 Dm7 G Cmaj7 Fmaj7 Dm7 E7 Am', rev: 0.7,
      mel: 'E5:4 A5:4 C6:8|D6:4 C6:4 A5:8|B5:4 D6:4 G5:8|E6:12 -:4|C6:4 A5:4 F5:8|F5:4 A5:4 D6:8|D6:4 B5:4 G#5:8|A5:12 -:4' },
    { id: 'kaisou', name: '回想', bpm: 72, lead: 'triangle', leadLp: 2600, vib: 1, bass: 'long', pad: 0.07, arp: 0.04, arpWave: 'sine', drum: '', chords: 'Em Am D G C Am B Em', rev: 0.6,
      mel: 'B5:6 A5:2 G5:4 E5:4|E5:8 C6:8|A5:6 G5:2 F#5:4 D5:4|D5:8 B5:8|C6:4 B5:4 G5:4 E5:4|E5:4 A5:4 C6:8|B5:4 A5:4 F#5:4 D#5:4|E5:12 -:4' }
  ],
  'ふしぎ・こわい': [
    { id: 'majo', name: '魔女の家', bpm: 96, lead: 'square', leadLp: 1600, bass: 'ost', pad: 0.04, arp: 0.04, drum: 'k.....s.k.....s.', chords: 'Dm A Dm A Bb A Dm A', rev: 0.45,
      mel: 'D5:2 F5:2 A5:4 G#5:4 A5:4|C#5:8 E5:8|D5:2 F5:2 A5:4 D6:4 C#6:4|A5:12 -:4|Bb5:4 A5:4 G5:4 F5:4|E5:4 C#5:4 A4:8|D5:4 F5:4 A5:4 D6:4|C#6:12 -:4' },
    { id: 'meikyu', name: 'めいきゅう', bpm: 104, lead: 'triangle', leadLp: 2400, bass: 'ost', pad: 0.03, arp: 0.05, arpWave: 'triangle', drum: 'k...h...k.k.h...', chords: 'Cm Ab Cm Ab Fm G Cm G', rev: 0.4,
      mel: 'C5:4 Eb5:4 G5:4 F5:4|Eb5:4 C5:4 Ab4:8|C5:4 G5:4 C6:4 Bb5:4|Ab5:12 -:4|F5:4 Ab5:4 C6:4 Ab5:4|G5:4 B4:4 D5:8|Eb5:4 G5:4 C6:4 G5:4|D5:12 -:4' },
    { id: 'sabaku', name: 'さばく', bpm: 88, lead: 'sawtooth', leadLp: 1800, vib: 1, bass: 'long', pad: 0.04, arp: 0, drum: 'k..k..s.k..k..s.', chords: 'Em F Em F Em F Em Em', rev: 0.45,
      mel: 'E5:4 F5:4 G#5:4 A5:4|G#5:4 F5:4 E5:8|B5:4 C6:4 B5:4 A5:4|G#5:12 -:4|E5:2 F5:2 G#5:2 A5:2 B5:4 C6:4|B5:4 A5:4 F5:8|G#5:4 F5:4 E5:4 D5:4|E5:12 -:4' },
    { id: 'shinkai', name: '深海', bpm: 60, lead: 'sine', leadLp: 1800, vib: 1, bass: 'long', pad: 0.08, arp: 0.05, arpWave: 'sine', drum: '', chords: 'Cm Cm Ab Ab Fm Fm G G', rev: 0.8,
      mel: 'G4:8 C5:8|Eb5:12 -:4|Ab4:8 C5:8|Eb5:8 D5:8|F4:8 Ab4:8|C5:12 -:4|D5:8 B4:8|G4:12 -:4' },
    { id: 'kikai', name: '機械の国', bpm: 120, lead: 'square', leadLp: 2200, bass: 'eighth', pad: 0, arp: 0.06, drum: 'k.k.s...k.k.s.h.', chords: 'Am Am F G Am Am F E',
      mel: 'A5:2 A5:2 E5:2 A5:2 C6:2 A5:2 E5:4|A5:2 B5:2 C6:2 D6:2 E6:8|F6:2 E6:2 D6:2 C6:2 A5:4 C6:4|B5:4 D6:4 G5:8|A5:2 A5:2 E5:2 A5:2 C6:2 E6:2 A6:4|G6:4 E6:4 C6:8|F6:4 C6:4 A5:4 F5:4|G#5:4 B5:4 E6:8' }
  ],
  'バトル・イベント': [
    { id: 'tsuiseki', name: '追跡', bpm: 168, lead: 'sawtooth', leadLp: 2400, bass: 'eighth', pad: 0, arp: 0.04, drum: 'k.hsk.hsk.hsk.hs', chords: 'Dm Dm Bb C Dm Dm Bb A',
      mel: 'D5:2 F5:2 A5:2 D6:2 C6:2 A5:2 F5:4|D5:2 E5:2 F5:2 A5:2 G5:8|Bb5:2 A5:2 G5:2 F5:2 D5:4 F5:4|E5:4 G5:4 C6:8|D6:2 C6:2 A5:2 F5:2 D5:4 A5:4|F5:4 A5:4 D6:8|D6:4 C6:4 Bb5:4 G5:4|A5:4 C#6:4 E6:8' },
    { id: 'saishuu', name: '最終決戦', bpm: 184, lead: 'sawtooth', leadLp: 3000, bass: 'eighth', pad: 0.04, arp: 0.04, drum: 'kkhsk.hskkhsk.ss', chords: 'Cm Ab Bb G Cm Ab Bb G',
      mel: 'C5:2 G5:2 C6:2 G5:2 Eb6:4 D6:4|C6:2 Ab5:2 Eb5:2 Ab5:2 C6:8|D6:2 Bb5:2 F5:2 Bb5:2 D6:4 F6:4|D6:4 B5:4 G5:8|G6:4 F6:4 Eb6:4 C6:4|Ab5:2 C6:2 Eb6:4 Ab6:8|F6:4 D6:4 Bb5:4 F6:4|G6:4 D6:4 B5:4 G5:4' },
    { id: 'shiren', name: '試練', bpm: 132, lead: 'square', leadLp: 2400, bass: 'ost', pad: 0.03, arp: 0.04, drum: 'k...s.k.k...s...', chords: 'Gm Eb F D Gm Eb F D',
      mel: 'G5:4 Bb5:4 D6:4 Bb5:4|G5:4 Eb5:4 Bb4:8|A5:4 C6:4 F6:4 C6:4|F#5:8 A5:8|D6:4 G6:4 F6:4 D6:4|Eb6:4 Bb5:4 G5:8|F5:4 A5:4 C6:4 F6:4|F#6:12 -:4' },
    { id: 'taikai', name: '大会', bpm: 144, lead: 'square', leadLp: 3200, bass: 'bounce', pad: 0.03, arp: 0.04, drum: 'k.h.s.hkk.h.s.h.', chords: 'E C#m A B E C#m A B',
      mel: 'B5:2 G#5:2 E5:4 B5:4 E6:4|C#6:4 G#5:4 E5:8|A5:2 C#6:2 E6:4 C#6:4 A5:4|B5:4 D#6:4 F#6:8|E6:4 B5:4 G#5:4 B5:4|C#6:4 E6:4 G#6:8|A6:4 F#6:4 E6:4 C#6:4|D#6:4 F#6:4 B6:8' },
    { id: 'gaisen', name: '凱旋', bpm: 112, lead: 'square', leadLp: 3500, bass: 'bounce', pad: 0.05, arp: 0.03, drum: 'k.s.k.s.k.s.ksss', chords: 'D G A D Bm G A D', rev: 0.3,
      mel: 'D5:4 F#5:4 A5:4 D6:4|B5:4 G5:4 D6:8|C#6:4 A5:4 E5:4 C#6:4|D6:12 -:4|B5:4 D6:4 F#6:4 D6:4|G6:4 D6:4 B5:8|A5:4 C#6:4 E6:4 G6:4|F#6:12 -:4' }
  ]
};
for (const [cat, list] of Object.entries(BGM_ADD3)) {
  const c = BGM_CATS.find(x => x[0] === cat);
  for (const b of list) { BGM_LIST.push(b); BGM_MAP['M:' + b.id] = b; c[1].push('M:' + b.id); }
}
