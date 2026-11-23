/* ===== 追加の効果音・BGM（11/24：2倍に） ===== */
const SE_ADD = {
  'システム': [
    ['kettei2', '決定2', (d, t) => { tone(d, t, 988, 0.06, { vol: 0.25 }); tone(d, t + 0.06, 1319, 0.16, { vol: 0.25, rev: 0.2 }); }],
    ['cancel2', 'キャンセル2', (d, t) => { tone(d, t, 660, 0.12, { type: 'triangle', to: 330, vol: 0.3 }); }],
    ['open', 'ひらく', (d, t) => { tone(d, t, 500, 0.16, { to: 1200, vol: 0.2 }); noise(d, t, 0.12, { ft: 'highpass', f: 3000, vol: 0.1 }); }],
    ['close', 'とじる', (d, t) => { tone(d, t, 1200, 0.16, { to: 500, vol: 0.2 }); }],
    ['coin', 'コイン', (d, t) => { tone(d, t, 988, 0.08, { type: 'square', vol: 0.1 }); tone(d, t + 0.08, 1319, 0.4, { type: 'square', vol: 0.1, r: 0.3 }); }],
    ['levelup', 'レベルアップ', (d, t) => { ['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'].forEach((n, i) => tone(d, t + i * 0.06, nf(n), i === 6 ? 0.6 : 0.1, { type: 'square', vol: 0.08, rev: 0.3 })); }],
    ['error', 'エラー', (d, t) => { for (const k of [0, 0.18]) tone(d, t + k, 220, 0.14, { type: 'square', vol: 0.12, lp: 1500 }); }],
    ['select', 'せんたく', (d, t) => { tone(d, t, 1047, 0.05, { type: 'triangle', vol: 0.3 }); tone(d, t + 0.05, 1568, 0.08, { type: 'triangle', vol: 0.25 }); }],
    ['type', 'タイプ音', (d, t) => { for (let i = 0; i < 8; i++) noise(d, t + i * 0.09 + rnd(0, 0.03), 0.03, { ft: 'bandpass', f: rnd(2500, 3500), q: 3, vol: 0.4 }); }],
    ['save', 'セーブ', (d, t) => { ['G5', 'C6', 'E6'].forEach((n, i) => tone(d, t + i * 0.1, nf(n), 0.3, { vol: 0.2, rev: 0.3 })); }],
    ['countdown', 'カウントダウン', (d, t) => { for (let i = 0; i < 3; i++) tone(d, t + i * 0.8, 880, 0.15, { type: 'square', vol: 0.1 }); tone(d, t + 2.4, 1760, 0.6, { type: 'square', vol: 0.1 }); }]
  ],
  '気持ち': [
    ['kirari', 'キラッ', (d, t) => { tone(d, t, 2637, 0.3, { vol: 0.12, rev: 0.5 }); tone(d, t + 0.05, 3520, 0.4, { vol: 0.08, rev: 0.6 }); }],
    ['ase', 'あせ', (d, t) => { for (let i = 0; i < 3; i++) tone(d, t + i * 0.12, 1800 - i * 200, 0.08, { to: 900, vol: 0.15 }); }],
    ['iraira', 'イライラ', (d, t) => { for (let i = 0; i < 10; i++) tone(d, t + i * 0.08, i % 2 ? 300 : 340, 0.07, { type: 'sawtooth', vol: 0.08, lp: 1200 }); }],
    ['fuwa', 'ふわっ', (d, t) => { tone(d, t, 600, 0.7, { to: 1400, vol: 0.18, a: 0.2, rev: 0.6 }); noise(d, t, 0.7, { ft: 'bandpass', f: 1500, fto: 4000, vol: 0.08, a: 0.3 }); }],
    ['jiin', 'ジーン', (d, t) => { ['C5', 'E5', 'G5', 'B5'].forEach(n => tone(d, t, nf(n), 2.2, { vol: 0.08, a: 0.4, r: 1.2, rev: 0.6 })); }],
    ['shiin', 'シーン', (d, t) => { tone(d, t, 6000, 2.0, { vol: 0.03, a: 0.3, r: 1.0 }); noise(d, t, 2.0, { ft: 'bandpass', f: 7000, q: 8, vol: 0.03, a: 0.3 }); }],
    ['ukiuki', 'うきうき', (d, t) => { ['C5', 'D5', 'E5', 'G5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(d, t + i * 0.09, nf(n), 0.12, { type: 'triangle', vol: 0.25 })); }],
    ['gakkari', 'がっかり', (d, t) => { tone(d, t, 500, 0.4, { type: 'triangle', to: 380, vol: 0.3 }); tone(d, t + 0.42, 380, 0.9, { type: 'triangle', to: 250, vol: 0.3, vib: 1 }); }],
    ['odoroki', 'おどろき（大）', (d, t) => { ['C4', 'C#4', 'G4', 'C5'].forEach(n => tone(d, t, nf(n), 0.6, { type: 'sawtooth', vol: 0.07, lp: 2500 })); noise(d, t, 0.2, { ft: 'highpass', f: 2000, vol: 0.4 }); tone(d, t, 100, 0.4, { to: 50, vol: 0.6 }); }],
    ['tokimeki', 'ときめき', (d, t) => { for (let i = 0; i < 2; i++) { const k = t + i * 0.5; tone(d, k, 80, 0.15, { to: 50, vol: 0.6 }); tone(d, k + 0.16, 70, 0.15, { to: 45, vol: 0.5 }); } ['E6', 'G6', 'B6'].forEach((n, i) => tone(d, t + i * 0.12, nf(n), 0.6, { vol: 0.06, rev: 0.6 })); }],
    ['pokan', 'ぽかん', (d, t) => { tone(d, t, 300, 0.12, { to: 600, vol: 0.3 }); tone(d, t + 0.4, 220, 0.4, { type: 'triangle', vol: 0.2 }); }]
  ],
  '学校・合図': [
    ['housou', '放送チャイム', (d, t) => { ['F5', 'A5', 'C6', 'F6'].forEach((n, i) => tone(d, t + i * 0.42, nf(n), 1.2, { vol: 0.2, rev: 0.5 })); }],
    ['hoissuru', 'ホイッスル（短く）', (d, t) => { tone(d, t, 2600, 0.3, { vol: 0.15, vib: 1, a: 0.01 }); noise(d, t, 0.3, { ft: 'bandpass', f: 2600, q: 4, vol: 0.06 }); }],
    ['shuuryou', '試合終了', (d, t) => { for (const [k, du] of [[0, 0.3], [0.4, 0.3], [0.8, 1.2]]) { tone(d, t + k, 2500, du, { vol: 0.15, vib: 1, a: 0.01 }); noise(d, t + k, du, { ft: 'bandpass', f: 2500, q: 4, vol: 0.06 }); } }],
    ['pinpon', 'ピンポン', (d, t) => { tone(d, t, 1319, 0.35, { vol: 0.25, rev: 0.3 }); tone(d, t + 0.3, 1047, 0.6, { vol: 0.25, rev: 0.4 }); }],
    ['buzzer', 'ブザー', (d, t) => { tone(d, t, 140, 0.9, { type: 'sawtooth', vol: 0.15, lp: 1500, a: 0.01, r: 0.05 }); }],
    ['kansei', '歓声', (d, t) => { noise(d, t, 3, { ft: 'bandpass', f: 1200, q: 0.8, vol: 0.4, a: 0.3, hold: 2 }); for (let i = 0; i < 25; i++) tone(d, t + rnd(0, 2.5), rnd(300, 700), 0.4, { type: 'sawtooth', to: rnd(500, 900), vol: 0.02, lp: 1500 }); }],
    ['piano', 'ピアノ（ジャーン）', (d, t) => { ['C3', 'G3', 'C4', 'E4', 'G4', 'C5'].forEach(n => tone(d, t, nf(n), 2.5, { type: 'triangle', vol: 0.12, a: 0.005, r: 2.2, rev: 0.4 })); }],
    ['castanet', 'カスタネット', (d, t) => { for (const k of [0, 0.15, 0.3, 0.6]) noise(d, t + k, 0.04, { ft: 'bandpass', f: 2800, q: 4, vol: 0.6 }); }],
    ['mokkin', '木琴', (d, t) => { ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(d, t + i * 0.12, nf(n), 0.25, { vol: 0.3, a: 0.002, r: 0.2 })); }],
    ['tekkin', '鉄琴', (d, t) => { ['G5', 'E6', 'C6', 'G6'].forEach((n, i) => { tone(d, t + i * 0.15, nf(n), 1.2, { vol: 0.15, rev: 0.5 }); tone(d, t + i * 0.15, nf(n) * 2.76, 0.4, { vol: 0.03 }); }); }],
    ['triangle', 'トライアングル', (d, t) => { [4200, 5300, 6900].forEach(f => tone(d, t, f, 2.0, { vol: 0.05, a: 0.002, r: 1.8, rev: 0.4 })); }]
  ],
  '生活': [
    ['interphone', 'インターホン', (d, t) => { tone(d, t, 1047, 0.5, { vol: 0.25, rev: 0.3 }); tone(d, t + 0.5, 831, 0.9, { vol: 0.25, rev: 0.3 }); }],
    ['jaguchi', 'じゃぐち', (d, t) => { noise(d, t, 2.0, { ft: 'bandpass', f: 2500, q: 0.7, vol: 0.3, a: 0.1, hold: 1.6 }); for (let i = 0; i < 15; i++) tone(d, t + rnd(0, 1.8), rnd(800, 1600), 0.05, { to: 2000, vol: 0.04 }); }],
    ['gutsugutsu', 'グツグツ', (d, t) => { for (let i = 0; i < 18; i++) tone(d, t + rnd(0, 2.2), rnd(150, 300), 0.12, { to: rnd(400, 600), vol: 0.15, lp: 800 }); }],
    ['houchou', '包丁', (d, t) => { for (let i = 0; i < 6; i++) { noise(d, t + i * 0.22, 0.05, { ft: 'bandpass', f: 2000, vol: 0.5 }); tone(d, t + i * 0.22, 200, 0.06, { to: 100, vol: 0.3 }); } }],
    ['kagi', 'かぎ', (d, t) => { noise(d, t, 0.06, { ft: 'highpass', f: 4000, vol: 0.4 }); noise(d, t + 0.18, 0.08, { ft: 'bandpass', f: 2500, q: 3, vol: 0.5 }); tone(d, t + 0.18, 1800, 0.08, { vol: 0.1 }); }],
    ['doashimaru', 'ドアがしまる', (d, t) => { noise(d, t, 0.25, { f: 600, vol: 0.7 }); tone(d, t, 90, 0.3, { to: 45, vol: 0.7 }); }],
    ['kuruma', '車が通る', (d, t) => { const n = noise(d, t, 2.5, { f: 400, vol: 0.4, a: 1.0, hold: 1.2 }); n.fl.frequency.linearRampToValueAtTime(1200, t + 1.2); n.fl.frequency.linearRampToValueAtTime(300, t + 2.5); tone(d, t, 90, 2.5, { type: 'sawtooth', to: 70, vol: 0.06, lp: 400, a: 1 }); }],
    ['densha', '電車', (d, t) => { for (let i = 0; i < 4; i++) for (const k of [0, 0.14]) { noise(d, t + i * 0.7 + k, 0.08, { f: 700, vol: 0.5 }); tone(d, t + i * 0.7 + k, 110, 0.08, { to: 70, vol: 0.3 }); } }],
    ['jitensha', '自転車のベル', (d, t) => { for (const k of [0, 0.22]) { tone(d, t + k, 2700, 0.5, { vol: 0.12, rev: 0.3 }); tone(d, t + k, 3400, 0.4, { vol: 0.06 }); } }],
    ['tsukue', 'つくえをたたく', (d, t) => { noise(d, t, 0.15, { f: 800, vol: 0.8 }); tone(d, t, 180, 0.15, { to: 90, vol: 0.6 }); }],
    ['kaidan', '階段', (d, t) => { for (let i = 0; i < 6; i++) { noise(d, t + i * 0.25, 0.08, { f: 500 + i * 80, vol: 0.4 }); tone(d, t + i * 0.25, 100 + i * 10, 0.08, { to: 60, vol: 0.3 }); } }]
  ],
  '自然': [
    ['semi', 'セミ', (d, t) => { for (let i = 0; i < 60; i++) tone(d, t + i * 0.05, 5200, 0.04, { type: 'sawtooth', vol: 0.03, lp: 7000, a: 0.005, r: 0.01 }); }],
    ['soyokaze', 'そよ風', (d, t) => { const n = noise(d, t, 3.5, { ft: 'bandpass', f: 1500, q: 1, vol: 0.18, a: 1.2, hold: 2.2 }); n.fl.frequency.linearRampToValueAtTime(2500, t + 1.8); }],
    ['ooame', '大雨', (d, t) => { noise(d, t, 4, { f: 4000, vol: 0.45, a: 0.4, hold: 3.3 }); noise(d, t, 4, { f: 300, vol: 0.2, a: 0.4, hold: 3.3 }); }],
    ['yuki', '雪をふむ', (d, t) => { for (let i = 0; i < 4; i++) noise(d, t + i * 0.45, 0.2, { ft: 'bandpass', f: 1800, q: 1.5, vol: 0.4, a: 0.05 }); }],
    ['karasu', 'カラス', (d, t) => { for (const k of [0, 0.5]) tone(d, t + k, 700, 0.35, { type: 'sawtooth', to: 500, vol: 0.1, lp: 1600, vib: 1 }); }],
    ['inu', '犬', (d, t) => { for (const k of [0, 0.3]) { tone(d, t + k, 600, 0.12, { type: 'sawtooth', to: 350, vol: 0.18, lp: 1800 }); noise(d, t + k, 0.1, { ft: 'bandpass', f: 1000, vol: 0.2 }); } }],
    ['neko', 'ねこ', (d, t) => { tone(d, t, 700, 0.7, { type: 'sawtooth', to: 900, slide: 0.3, vol: 0.08, lp: 2200, vib: 1, a: 0.08 }); }],
    ['kitsutsuki', 'キツツキ', (d, t) => { for (let i = 0; i < 12; i++) noise(d, t + i * 0.05, 0.03, { ft: 'bandpass', f: 1200, q: 3, vol: 0.5 }); }],
    ['jihibiki', '地ひびき', (d, t) => { tone(d, t, 45, 2.5, { vol: 0.7, a: 0.4 }); noise(d, t, 2.5, { f: 150, vol: 0.5, a: 0.4, hold: 1.5 }); }],
    ['mizushibuki', '水しぶき', (d, t) => { noise(d, t, 0.9, { f: 5000, fto: 800, vol: 0.6 }); for (let i = 0; i < 12; i++) tone(d, t + rnd(0.1, 0.9), rnd(1000, 2500), 0.06, { to: 3000, vol: 0.06 }); }],
    ['hachi', 'ハチ', (d, t) => { tone(d, t, 220, 2, { type: 'sawtooth', vol: 0.06, lp: 1500, vib: 1, a: 0.3 }); }]
  ],
  'アクション・ふしぎ': [
    ['ken', '剣', (d, t) => { noise(d, t, 0.2, { ft: 'bandpass', f: 1200, fto: 5000, vol: 0.4 }); tone(d, t + 0.18, 3000, 0.6, { vol: 0.1, rev: 0.4 }); tone(d, t + 0.18, 4400, 0.4, { vol: 0.05 }); }],
    ['kaifuku', '回復', (d, t) => { ['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6'].forEach((n, i) => tone(d, t + i * 0.09, nf(n), 0.5, { vol: 0.12, rev: 0.6 })); }],
    ['damage', 'ダメージ', (d, t) => { noise(d, t, 0.3, { f: 2000, fto: 300, vol: 0.7 }); tone(d, t, 300, 0.3, { type: 'square', to: 80, vol: 0.12 }); }],
    ['barrier', 'バリア', (d, t) => { tone(d, t, 400, 1.0, { type: 'sawtooth', to: 800, vol: 0.08, lp: 2500, vib: 1, rev: 0.5 }); tone(d, t, 1600, 1.0, { vol: 0.05, vib: 1 }); }],
    ['honoo', 'ほのお', (d, t) => { noise(d, t, 1.6, { f: 500, fto: 2500, vol: 0.6, a: 0.1, hold: 0.8 }); for (let i = 0; i < 12; i++) noise(d, t + rnd(0, 1.4), 0.03, { ft: 'highpass', f: 3000, vol: 0.3 }); }],
    ['koori', 'こおり', (d, t) => { for (let i = 0; i < 10; i++) tone(d, t + i * 0.05, rnd(3000, 6000), 0.3, { vol: 0.06, rev: 0.5 }); noise(d, t, 0.4, { ft: 'highpass', f: 5000, vol: 0.2 }); }],
    ['kieru', '消える', (d, t) => { tone(d, t, 1600, 0.8, { to: 200, vol: 0.12, vib: 1, rev: 0.6 }); noise(d, t, 0.8, { ft: 'highpass', f: 4000, fto: 8000, vol: 0.08, a: 0.1 }); }],
    ['ufo', 'UFO', (d, t) => { tone(d, t, 600, 2.4, { vol: 0.12, vib: 1, a: 0.2 }); tone(d, t, 900, 2.4, { type: 'triangle', vol: 0.05, vib: 1, a: 0.2 }); }],
    ['robot', 'ロボット', (d, t) => { for (let i = 0; i < 6; i++) tone(d, t + i * 0.12, rnd(300, 900), 0.1, { type: 'square', vol: 0.08, lp: 2000 }); noise(d, t + 0.75, 0.3, { ft: 'bandpass', f: 1500, vol: 0.2 }); }],
    ['hikaru', '光る', (d, t) => { tone(d, t, 800, 1.0, { to: 3200, vol: 0.1, rev: 0.6, a: 0.2 }); ['C7', 'E7', 'G7'].forEach((n, i) => tone(d, t + 0.5 + i * 0.08, nf(n), 0.6, { vol: 0.05, rev: 0.6 })); }],
    ['nageru', '投げる', (d, t) => { noise(d, t, 0.45, { ft: 'bandpass', f: 3000, fto: 600, q: 2, vol: 0.35, a: 0.02 }); }]
  ]
};
for (const [cat, list] of Object.entries(SE_ADD)) {
  const c = SE_CATS.find(x => x[0] === cat);
  for (const s of list) { SE_LIST.push(s); SE_MAP['S:' + s[0]] = s; c[1].push('S:' + s[0]); }
}
const BGM_ADD = {
  '明るい': [
    { id: 'sanpo', name: 'さんぽ', bpm: 108, lead: 'triangle', leadLp: 3000, bass: 'walk', pad: 0.03, arp: 0, drum: 'k...s...k...s...', chords: 'C Am Dm G C Am F G',
      mel: 'E5:4 G5:4 C6:4 G5:4|A5:4 E5:4 C5:8|D5:4 F5:4 A5:4 F5:4|G5:8 B5:8|C6:4 B5:4 A5:4 G5:4|E5:4 C5:4 A4:8|F5:4 A5:4 C6:4 A5:4|G5:12 -:4' },
    { id: 'picnic', name: 'ピクニック', bpm: 132, lead: 'square', leadLp: 2800, bass: 'bounce', pad: 0, arp: 0.04, drum: 'k.h.s.h.k.h.s.h.', chords: 'G D Em C G D C D',
      mel: 'B5:2 A5:2 G5:4 D5:4 G5:4|A5:2 B5:2 A5:4 F#5:8|G5:2 A5:2 B5:4 E6:4 B5:4|C6:4 B5:4 A5:4 G5:4|D6:4 B5:2 G5:2 D5:4 B5:4|A5:4 F#5:4 D5:8|E5:2 G5:2 C6:4 B5:4 A5:4|F#5:4 A5:4 D6:8' },
    { id: 'undoukai', name: '運動会', bpm: 152, lead: 'square', leadLp: 3000, bass: 'eighth', pad: 0, arp: 0, drum: 'k.hsk.hsk.hsk.hs', chords: 'C C F G C C F G',
      mel: 'C5:2 E5:2 G5:2 C6:2 G5:2 E5:2 C5:4|E5:2 G5:2 C6:2 E6:2 D6:8|F5:2 A5:2 C6:2 F6:2 E6:2 D6:2 C6:4|B5:2 C6:2 D6:2 B5:2 G5:8|C6:4 C6:4 G5:4 E5:4|C6:2 D6:2 E6:4 C6:8|A5:2 B5:2 C6:4 F6:4 E6:4|D6:4 C6:4 B5:4 G5:4' },
    { id: 'hare', name: '晴れの日', bpm: 118, lead: 'sine', leadLp: 3500, bass: 'walk', pad: 0.04, arp: 0.05, arpWave: 'triangle', drum: 'k.h.s.h.k.h.s.h.', chords: 'D Bm G A D Bm G A',
      mel: 'F#5:4 A5:4 D6:6 C#6:2|B5:4 F#5:4 D5:8|G5:4 B5:4 D6:4 B5:4|A5:8 E5:8|F#5:4 A5:4 D6:4 E6:4|F#6:4 D6:4 B5:8|G5:4 A5:4 B5:4 D6:4|C#6:8 A5:8' },
    { id: 'wafuu', name: '和風', bpm: 96, lead: 'triangle', leadLp: 3000, vib: 1, bass: 'long', pad: 0.03, arp: 0, drum: 'k.......k...s...', chords: 'Am Am Dm Em Am Am Dm E', rev: 0.4,
      mel: 'A4:4 B4:4 C5:4 E5:4|D5:4 C5:4 B4:8|A4:4 C5:4 D5:4 F5:4|E5:12 -:4|E5:4 F5:4 A5:4 B5:4|A5:4 F5:4 E5:8|D5:4 F5:4 E5:4 C5:4|B4:12 -:4' }
  ],
  'やさしい': [
    { id: 'ohirune', name: 'おひるね', bpm: 70, lead: 'sine', leadLp: 3000, vib: 1, bass: 'long', pad: 0.05, arp: 0.04, arpWave: 'sine', drum: '', chords: 'F Dm Bb C F Dm Bb C', rev: 0.5,
      mel: 'A5:8 G5:4 F5:4|D5:8 F5:8|Bb4:4 D5:4 F5:4 D5:4|C5:12 -:4|A5:4 C6:4 F6:8|D6:8 A5:8|Bb5:4 A5:4 G5:4 F5:4|G5:12 -:4' },
    { id: 'haru', name: '春', bpm: 104, lead: 'triangle', leadLp: 3200, bass: 'walk', pad: 0.04, arp: 0.04, arpWave: 'sine', drum: 'k.......s.......', chords: 'Fmaj7 G Em Am Fmaj7 G C C',
      mel: 'A5:4 C6:4 E6:4 C6:4|B5:4 D6:4 G5:8|G5:4 B5:4 E6:4 B5:4|C6:4 A5:4 E5:8|F5:4 A5:4 C6:4 E6:4|D6:4 B5:4 G5:4 D6:4|E6:8 C6:4 G5:4|C6:12 -:4' },
    { id: 'cafe', name: 'カフェ', bpm: 96, lead: 'sine', leadLp: 3500, bass: 'walk', pad: 0.05, arp: 0, drum: 'k...h.s.k.h.s.h.', chords: 'Dm7 G Cmaj7 Am7 Dm7 G Cmaj7 C', rev: 0.35,
      mel: 'F5:4 A5:4 C6:4 A5:2 G5:2|F5:4 D5:4 B4:8|E5:4 G5:4 B5:4 G5:2 E5:2|C5:8 A4:8|D5:2 F5:2 A5:4 C6:4 B5:4|B5:4 G5:4 D5:8|C5:4 E5:4 G5:4 B5:4|C6:12 -:4' },
    { id: 'tegami', name: '手紙', bpm: 76, lead: 'triangle', leadLp: 2600, vib: 1, bass: 'long', pad: 0.06, arp: 0.03, arpWave: 'sine', drum: '', chords: 'G D Em C G D C D', rev: 0.5,
      mel: 'D5:6 E5:2 G5:8|F#5:6 E5:2 D5:8|E5:4 G5:4 B5:6 A5:2|G5:8 E5:8|D5:4 G5:4 B5:4 D6:4|C6:4 A5:4 F#5:8|E5:4 G5:4 C6:6 B5:2|A5:12 -:4' },
    { id: 'akari', name: 'ともしび', bpm: 66, lead: 'sine', leadLp: 3000, vib: 1, bass: 'long', pad: 0.07, arp: 0.04, arpWave: 'triangle', drum: '', chords: 'Eb Bb Cm Ab Eb Bb Ab Bb', rev: 0.6,
      mel: 'G5:8 F5:4 Eb5:4|D5:8 F5:8|Eb5:4 G5:4 C6:8|C6:4 Bb5:4 Ab5:8|G5:4 Bb5:4 Eb6:8|D6:4 Bb5:4 F5:8|Ab5:4 C6:4 Eb6:4 C6:4|Bb5:12 -:4' }
  ],
  'かなしい・夜': [
    { id: 'wakare', name: 'わかれ', bpm: 68, lead: 'triangle', leadLp: 2400, vib: 1, bass: 'long', pad: 0.08, arp: 0, drum: '', chords: 'Em C G D Em C Am B', rev: 0.55,
      mel: 'B5:6 A5:2 G5:4 E5:4|E5:8 G5:8|D5:6 E5:2 G5:4 B5:4|A5:12 -:4|G5:6 F#5:2 E5:4 B4:4|C5:8 E5:8|A4:4 C5:4 E5:4 A5:4|F#5:12 -:4' },
    { id: 'amenohi', name: '雨の日', bpm: 72, lead: 'sine', leadLp: 2800, bass: 'long', pad: 0.06, arp: 0.05, arpWave: 'sine', drum: '', chords: 'Am Fmaj7 Dm Em Am Fmaj7 Dm E', rev: 0.55,
      mel: 'C6:4 B5:4 A5:4 E5:4|F5:8 A5:8|D5:4 F5:4 A5:4 C6:4|B5:12 -:4|E6:4 D6:4 C6:4 A5:4|A5:4 C6:4 F5:8|F5:4 E5:4 D5:4 F5:4|E5:12 -:4' },
    { id: 'hoshizora', name: '星空', bpm: 70, lead: 'sine', leadLp: 4000, vib: 1, bass: 'long', pad: 0.05, arp: 0.07, arpWave: 'sine', drum: '', chords: 'Cmaj7 Fmaj7 Cmaj7 G Am Fmaj7 Dm7 G', rev: 0.7,
      mel: 'G5:4 C6:4 E6:8|A5:4 C6:4 F6:8|E6:4 D6:4 C6:4 G5:4|D6:12 -:4|E6:4 C6:4 A5:4 E5:4|F5:4 A5:4 C6:8|D6:4 C6:4 A5:4 F5:4|G5:12 -:4' },
    { id: 'hitori', name: 'ひとり', bpm: 62, lead: 'triangle', leadLp: 2200, vib: 1, bass: 'long', pad: 0.06, arp: 0, drum: '', chords: 'Cm Ab Fm G Cm Ab Fm G', rev: 0.6,
      mel: 'G5:8 Eb5:8|C5:8 Eb5:4 Ab5:4|F5:8 Ab5:4 G5:4|D5:12 -:4|Eb5:6 F5:2 G5:4 C6:4|Ab5:8 Eb5:8|F5:4 Eb5:4 D5:4 C5:4|B4:12 -:4' }
  ],
  'ふしぎ・こわい': [
    { id: 'mayoimori', name: 'まよいの森', bpm: 84, lead: 'triangle', leadLp: 2600, bass: 'ost', pad: 0.04, arp: 0.05, arpWave: 'sine', drum: '....h.......h...', chords: 'Em D Em D C B Em Em', rev: 0.5,
      mel: 'E5:4 G5:4 B5:4 A5:4|F#5:8 D5:8|E5:4 B5:4 E6:4 D6:4|A5:12 -:4|G5:4 E5:4 C5:4 E5:4|D#5:8 F#5:8|B5:4 G5:4 E5:4 B4:4|E5:12 -:4' },
    { id: 'uchu', name: '宇宙', bpm: 80, lead: 'sine', leadLp: 5000, vib: 1, bass: 'long', pad: 0.06, arp: 0.06, arpWave: 'sine', drum: '', chords: 'C Bb C Bb Ab Bb C C', rev: 0.75,
      mel: 'G5:8 C6:8|D6:8 F6:8|E6:4 D6:4 C6:4 G5:4|F5:12 -:4|Eb6:8 C6:8|D6:4 F6:4 Bb5:8|C6:4 E6:4 G6:8|C6:12 -:4' },
    { id: 'yurei', name: 'ゆうれい', bpm: 64, lead: 'sine', leadLp: 2000, vib: 1, bass: 'long', pad: 0.05, arp: 0, drum: '', chords: 'Am Bb Am Bb Am Bb E E', rev: 0.75,
      mel: 'E5:8 F5:8|E5:4 D#5:4 E5:8|A5:8 Bb5:8|A5:12 -:4|C6:4 B5:4 A5:4 G#5:4|A5:8 Bb5:8|G#5:8 E5:8|B4:12 -:4' },
    { id: 'suiri', name: '推理', bpm: 112, lead: 'square', leadLp: 1800, bass: 'walk', pad: 0.03, arp: 0, drum: 'k...h...k.k.h...', chords: 'Am Am Dm E Am Am Dm E',
      mel: 'A5:2 -:2 E5:2 A5:2 C6:4 B5:4|A5:4 G#5:4 A5:8|D5:2 -:2 F5:2 A5:2 D6:4 C6:4|B5:8 G#5:8|C6:2 B5:2 A5:2 E5:2 C5:4 E5:4|A5:4 C6:4 E6:8|F6:4 E6:4 D6:4 C6:4|B5:12 -:4' },
    { id: 'kaidanbgm', name: '怪談', bpm: 58, lead: 'triangle', leadLp: 1500, bass: 'long', pad: 0.07, arp: 0, drum: 'k...............', chords: 'Dm Dm Eb Eb Dm Dm Eb A', rev: 0.65,
      mel: 'D5:12 -:4|F5:8 E5:8|Eb5:12 -:4|G5:8 F#5:8|D5:4 F5:4 A5:8|G#5:8 A5:8|Bb5:8 G5:8|A5:12 -:4' }
  ],
  'バトル・イベント': [
    { id: 'kessen', name: '決戦', bpm: 176, lead: 'sawtooth', leadLp: 2800, bass: 'eighth', pad: 0.03, arp: 0.03, drum: 'k.hsk.hsk.hsk.ss', chords: 'Em C D B Em C D B',
      mel: 'E5:2 B5:2 E6:2 B5:2 G5:2 B5:2 E6:4|C6:2 G5:2 E5:2 G5:2 C6:4 E6:4|D6:2 A5:2 F#5:2 A5:2 D6:4 F#6:4|D#6:4 B5:4 F#5:4 D#5:4|E6:4 D6:4 B5:4 G5:4|C6:2 D6:2 E6:4 G6:8|F#6:4 E6:4 D6:4 A5:4|B5:4 D#6:4 F#6:4 B6:4' },
    { id: 'pinch', name: 'ピンチ', bpm: 150, lead: 'square', leadLp: 2000, bass: 'ost', pad: 0, arp: 0.04, drum: 'k.k.s.k.k.k.s.k.', chords: 'Cm Db Cm Db Cm Db Bb B',
      mel: 'C5:2 C5:2 C5:2 Db5:2 C5:8|Ab5:4 G5:4 F5:8|C5:2 Eb5:2 G5:2 Ab5:2 G5:8|Db6:4 C6:4 Ab5:8|G5:2 G5:2 Ab5:2 G5:2 F5:4 Eb5:4|F5:4 Ab5:4 Db6:8|D6:4 Bb5:4 F5:8|B5:4 D#6:4 F#6:8' },
    { id: 'race', name: 'レース', bpm: 168, lead: 'square', leadLp: 3200, bass: 'eighth', pad: 0, arp: 0.04, drum: 'k.h.s.h.k.h.s.h.', chords: 'A F#m D E A F#m D E',
      mel: 'E5:2 A5:2 C#6:2 E6:2 C#6:2 A5:2 E5:4|F#5:2 A5:2 C#6:2 F#6:2 E6:8|D6:2 C#6:2 B5:2 A5:2 F#5:4 A5:4|B5:4 E6:4 G#5:8|A5:2 C#6:2 E6:4 A6:4 E6:4|F#6:4 C#6:4 A5:8|D6:4 F#6:4 A6:4 F#6:4|G#6:4 E6:4 B5:4 E6:4' },
    { id: 'tanken', name: '探検', bpm: 124, lead: 'triangle', leadLp: 3000, bass: 'walk', pad: 0.03, arp: 0.04, drum: 'k...s...k.k.s...', chords: 'Dm C Bb A Dm C Bb A',
      mel: 'D5:4 F5:4 A5:4 D6:4|C6:4 G5:4 E5:8|F5:4 Bb5:4 D6:4 Bb5:4|A5:8 C#6:8|D6:4 A5:4 F5:4 A5:4|G5:4 C6:4 E6:8|D6:4 Bb5:4 F5:4 D5:4|E5:8 A5:8' },
    { id: 'tachiagaru', name: '立ち上がる', bpm: 120, lead: 'square', leadLp: 3000, bass: 'bounce', pad: 0.04, arp: 0.03, drum: 'k.h.s.hkk.h.s.h.', chords: 'Am F C G Am F G G',
      mel: 'E5:4 A5:4 C6:6 B5:2|A5:4 F5:4 C5:8|C5:4 E5:4 G5:6 F5:2|E5:4 D5:4 B4:8|A5:4 C6:4 E6:6 D6:2|C6:4 A5:4 F5:8|G5:4 B5:4 D6:4 F6:4|G6:12 -:4' }
  ]
};
for (const [cat, list] of Object.entries(BGM_ADD)) {
  const c = BGM_CATS.find(x => x[0] === cat);
  for (const b of list) { BGM_LIST.push(b); BGM_MAP['M:' + b.id] = b; c[1].push('M:' + b.id); }
}
