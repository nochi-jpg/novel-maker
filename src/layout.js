/* ===== ページ分け ===== */
const F_UI = '"BIZ UDPGothic","BIZ UDPゴシック","Noto Sans CJK JP","Noto Sans JP",sans-serif';
const F_TX = '"UD デジタル 教科書体 NK-R","UD Digi Kyokasho NK-R","UD デジタル 教科書体 N-R","BIZ UDPGothic","BIZ UDPゴシック","Noto Sans CJK JP",sans-serif';
const NG_HEAD = '、。，．・：；？！」』）】〕〉》ーぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ…‥ヽヾゝゞ々';
const LINES_PER_PAGE = 4, LH = 1.5, WIN_PAD_X = 34, WIN_PAD_Y = 22;
let _mctx = null;
function winMetrics(stageW) {
  const fs = sv('size'), mx = Math.round(stageW * sv('width'));
  const w = stageW - mx * 2, hgt = Math.round(fs * LH * LINES_PER_PAGE + WIN_PAD_Y * 2);
  return { fs, x: mx, w, h: hgt, inner: w - WIN_PAD_X * 2, y: 720 - 46 - hgt };
}
function parseName(line, useName) {
  if (!useName) return { name: '', t: line };
  const m = /^【([^】]{1,12})】(.*)$/.exec(line);
  return m ? { name: m[1], t: m[2] } : { name: '', t: line };
}
function wrapLine(text, maxW, fs) {
  if (!_mctx) _mctx = document.createElement('canvas').getContext('2d');
  _mctx.font = `${fs}px ${F_TX}`;
  const rows = []; let cur = '', cw = 0;
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i], w = _mctx.measureText(ch).width;
    if (cw + w > maxW && cur) {
      if (NG_HEAD.includes(ch)) { cur += ch; cw += w; continue; } // ぶら下げ
      rows.push(cur); cur = ''; cw = 0;
    }
    cur += ch; cw += w;
  }
  if (cur || !rows.length) rows.push(cur);
  return rows;
}
/* pages: [{name, rows:[{li, t, first}]}] */
function paginate(block, stageW, useName) {
  const m = winMetrics(stageW), lines = (block.text || '').split('\n'), pages = [];
  let cur = null;
  const flush = () => { if (cur && cur.rows.length) pages.push(cur); cur = null; };
  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];
    if (!raw.trim()) { flush(); continue; }
    const c = block.cues[li], { name, t } = parseName(raw, useName);
    if (c && (c.bg || c.ch)) flush();
    if (cur && useName && cur.name !== name) flush();
    const rows = wrapLine(t, m.inner, m.fs);
    rows.forEach((rt, k) => {
      if (!cur) cur = { name, rows: [] };
      cur.rows.push({ li, t: rt, first: k === 0 });
      if (cur.rows.length >= LINES_PER_PAGE) flush();
    });
  }
  flush();
  if (!pages.length) pages.push({ name: '', rows: [{ li: 0, t: '', first: true }] });
  return pages;
}
function pageOfLine(pages, li) {
  for (let i = 0; i < pages.length; i++) if (pages[i].rows.some(r => r.li === li)) return i;
  for (let i = 0; i < pages.length; i++) if (pages[i].rows[0].li > li) return i;
  return pages.length - 1;
}
/* 見た目の状態：bg, ch[3], bgm */
const emptyVis = () => ({ bg: null, ch: [null, null, null], bgm: null });
function applyCue(vis, c, withSound = true) {
  if (!c) return;
  if (c.bg) vis.bg = c.bg === 'none' ? null : c.bg;
  if (c.ch) for (const s in c.ch) { const x = c.ch[s]; vis.ch[s] = (!x.m || x.m === 'none') ? null : { m: x.m, s: x.s ?? 1, y: x.y ?? 0 }; }
  if (withSound && c.bgm) vis.bgm = c.bgm === 'stop' ? null : c.bgm;
}
function visUntil(block, entry, li, inclusive = true) {
  const v = clone(entry);
  for (const k of Object.keys(block.cues).map(Number).sort((a, b) => a - b)) {
    if (k < li || (inclusive && k === li)) applyCue(v, block.cues[k]);
  }
  return v;
}
function visEnd(block, entry) { return visUntil(block, entry, 1e9); }
/* スタートからそのブロックまでの道すじ（条件は無視して最短） */
function pathTo(w, target) {
  const s = startBlock(w); if (!s) return null;
  const prev = { [s.id]: null }, q = [s.id];
  while (q.length) {
    const id = q.shift(); if (id === target) break;
    for (const n of exitsOf(w.blocks[id])) if (n.to && w.blocks[n.to] && !(n.to in prev)) { prev[n.to] = { id, choice: n.choice }; q.push(n.to); }
  }
  if (!(target in prev)) return null;
  const ids = []; let cur = target;
  while (cur) { ids.unshift(cur); cur = prev[cur] ? prev[cur].id : null; }
  // c はそのブロックで選んだ選択肢
  return ids.map((id, i) => ({ b: id, c: i < ids.length - 1 ? prev[ids[i + 1]].choice : undefined }));
}
function exitsOf(b) {
  if (!b) return [];
  const e = b.end;
  if (e.type === 'next') return [{ to: e.to, kind: 'next' }];
  if (e.type === 'choice') return e.choices.map((c, i) => ({ to: c.to, kind: 'choice', choice: i }));
  if (e.type === 'cond') return [...e.rules.map((r, i) => ({ to: r.to, kind: 'rule', rule: i })), { to: e.else, kind: 'else' }];
  return [];
}
function entryVisFor(w, bid) {
  const p = pathTo(w, bid); let v = emptyVis();
  if (!p) return { vis: v, hist: [{ b: bid }] };
  for (let i = 0; i < p.length - 1; i++) v = visEnd(w.blocks[p[i].b], v);
  return { vis: v, hist: p.slice(0, -1).map(x => ({ b: x.b, c: x.c })) };
}
