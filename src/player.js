/* ===== 見る（再生） ===== */
const P = { w: null, b: null, pages: [], pi: 0, si: 0, entry: null, hist: [], typing: null, auto: false, skip: false, hidden: false, test: false, onBack: null, read: new Set(), waiting: null, panel: null, chSel: 0 };
const ALPHAS = [0.92, 0.78, 0.6, 0.4];
const ALPHA_NAMES = ['こい', 'ふつう', 'うすい', 'すけすけ'];
function hexRgb(hx) { const n = parseInt(hx.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(hx, to, k) { const a = hexRgb(hx), b = hexRgb(to); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
function fullTheme(th) { th = th || DEF_THEME; return { ui: th.ui, win: th.win || th.ui, tx: th.tx, ch: th.ch || th.ui, alpha: th.alpha ?? 1 }; }
function themeVars(el, th0) {
  const th = fullTheme(th0), a = ALPHAS[clamp(th.alpha, 0, 3)];
  const rgba = (hx, al) => { const [r, g, b] = hexRgb(hx); return `rgba(${r},${g},${b},${al})`; };
  el.style.setProperty('--wui', th.ui);
  el.style.setProperty('--wui-d', mix(th.ui, '#000000', 0.35));
  el.style.setProperty('--wui-l', mix(th.ui, '#ffffff', 0.45));
  el.style.setProperty('--wui-p', mix(th.win, '#ffffff', 0.85));
  el.style.setProperty('--wtx', th.tx);
  el.style.setProperty('--wwinc', th.win);
  el.style.setProperty('--wwin-l', mix(th.win, '#ffffff', 0.45));
  el.style.setProperty('--wwin', rgba(th.win, a));
  el.style.setProperty('--wch', rgba(th.ch, a));
  el.style.setProperty('--wch-l', mix(th.ch, '#ffffff', 0.45));
}
const stageWOf = w => w.ratio === '4:3' ? 960 : 1280;
const isNovel = () => P.w && P.w.opts.mode === 'novel';
async function playWork(w, opts = {}) {
  auInit(); stopBGM();
  Object.assign(P, { w, b: null, pages: [], pi: 0, si: 0, entry: emptyVis(), hist: [], auto: false, skip: false, hidden: false, test: !!opts.test, onBack: opts.onBack, panel: null });
  fixWork(w);
  if (opts.loadMedia !== false) await loadMediaFor(w);
  const rd = await dbGet('saves', w.id + ':read'); P.read = new Set(rd || []);
  setStageW(stageWOf(w));
  showScreen('play');
  buildPlayer();
  APP.key = playerKey;
  if (opts.bid) { const e = entryVisFor(w, opts.bid); P.hist = e.hist; enterBlock(opts.bid, e.vis, opts.li || 0); return; }
  if (w.opts.title) { showWorkTitle(); return; }
  const bm = await dbGet('saves', w.id + ':bm');
  if (bm && w.blocks[bm.b]) {
    const r = await ask('つづきから読みますか？', [{ label: 'つづきから', value: 1, icon: 'play' }, { label: 'はじめから', value: 0, icon: 'refresh' }]);
    if (r) { loadState(bm); return; }
  }
  restart();
}
function buildPlayer() {
  const scr = $('#scr-play'); scr.innerHTML = ''; scr.classList.add('show');
  const st = $('#stage'); st.classList.add('playing'); themeVars(st, P.w.theme);
  const W = stageWOf(P.w);
  scr.style.width = W + 'px';
  const pvis = h('div', { class: 'pvis', id: 'pvis' },
    h('div', { class: 'lay lay-bg', id: 'lay-bg' }),
    h('div', { class: 'lay', id: 'lay-c0' }), h('div', { class: 'lay', id: 'lay-c1' }), h('div', { class: 'lay', id: 'lay-c2' }));
  const pv = h('div', { class: 'pv', id: 'pv' }, pvis,
    h('div', { class: 'lay', id: 'lay-w' }), h('div', { class: 'lay', id: 'lay-fx' }),
    h('div', { class: 'flash', id: 'flash' }), h('div', { class: 'fade', id: 'fade' }));
  scr.appendChild(pv);
  if (isNovel()) {
    const m = novelMetrics(W);
    scr.append(h('div', { class: 'pwin pnovel', id: 'pwin', style: `left:${m.x}px;width:${m.w}px;height:${m.h}px;top:${m.y}px;padding:${NOVEL.pad}px;font-size:${m.fs}px;line-height:${NOVEL.lh}` },
      h('div', { class: 'ptext', id: 'ptext' })),
      h('div', { class: 'pmark', id: 'pmark', style: `left:${m.x}px;width:${m.w - 24}px;top:${m.y + m.h - 40}px` }, h('span', { id: 'pnum' }), h('span', { class: 'tri', id: 'ptri' }, '▼')),
      h('div', { class: 'pname', id: 'pname' }));
  } else {
    const m = winMetrics(W);
    scr.append(h('div', { class: 'pname', id: 'pname', style: `left:${m.x + 16}px;top:${m.y - 44}px` }),
      h('div', { class: 'pwin', id: 'pwin', style: `left:${m.x}px;width:${m.w}px;height:${m.h}px;top:${m.y}px;padding:${WIN_PAD_Y}px ${WIN_PAD_X}px;font-size:${m.fs}px;line-height:${LH}` }, h('div', { class: 'ptext', id: 'ptext' })),
      h('div', { class: 'pmark', id: 'pmark', style: `left:${m.x}px;width:${m.w}px;top:${m.y + m.h + 6}px` }, h('span', { id: 'pnum' }), h('span', { class: 'tri', id: 'ptri' }, '▼')));
  }
  const bw = W === 960 ? 106 : 132, gap = W === 960 ? 6 : 12;
  const bar = h('div', { class: 'pbar', id: 'pbar' });
  const defs = [['back', 'もどる', () => playerBack()], ['prev', 'まえ', () => prevPage()], ['skip', 'スキップ', () => toggleSkip()], ['auto', 'オート', () => toggleAuto()],
    ['save', 'セーブ', () => saveLoadPanel('save')], ['load', 'ロード', () => saveLoadPanel('load')], ['eyeoff', 'かくす', () => setHidden(true)], ['gear', '設定', () => openSettings()]];
  defs.forEach(([icn, lb, fn], i) => {
    const x = i === defs.length - 1 ? W - 20 - bw : 20 + i * (bw + gap);
    const b = btn(icn, lb, e => { e.stopPropagation(); auInit(); fn(); }, 'pb' + (W === 960 ? ' narrow' : ''));
    b.style.cssText = `left:${x}px;width:${bw}px`; b.id = 'pb-' + icn; bar.appendChild(b);
  });
  if (isNovel()) bar.classList.add('novelbar');
  const wm = winMetrics(W);
  scr.append(bar, h('div', { class: 'pchoices', id: 'pchoices', style: `top:84px;height:${wm.y - 100}px` }));
  scr.onpointerdown = e => { if (e.button === 2) return; if (e.target.closest('button,.modal,.ppanel,.nchoice')) return; auInit(); clickAdvance(); };
  scr.oncontextmenu = e => { e.preventDefault(); if (!P.panel) setHidden(!P.hidden); };
}
function playerKey(e) {
  if ($('.modal')) return;
  const k = e.key;
  if (P.hidden) { if (k === 'Enter' || k === 'Escape' || k === ' ' || k === 'h' || k === 'H') { e.preventDefault(); setHidden(false); } return; }
  const nch = $$('#ptext .nchoice');
  if (nch.length) {
    if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); P.chSel = (P.chSel + (k === 'ArrowDown' ? 1 : nch.length - 1)) % nch.length; markNChoice(); return; }
    if (k === 'Enter' || k === ' ') { e.preventDefault(); nch[P.chSel].click(); return; }
    if (/^[1-3]$/.test(k) && nch[+k - 1]) { nch[+k - 1].click(); return; }
    return;
  }
  const chs = $$('#pchoices button');
  if (chs.length && /^[1-3]$/.test(k)) { const b = chs[+k - 1]; if (b) b.click(); return; }
  if (k === 'Enter' || k === ' ' || k === 'ArrowRight') { e.preventDefault(); clickAdvance(); }
  else if (k === 'ArrowLeft') prevPage();
  else if (k === 'h' || k === 'H') setHidden(true);
}
function setHidden(v) { P.hidden = v; $('#scr-play').classList.toggle('hid', v); }
function choicesShown() { return $('#pchoices').children.length || $$('#ptext .nchoice').length; }
function clickAdvance() {
  if (P.hidden) { setHidden(false); return; }
  if (P.panel) return;
  if (P.skip) { toggleSkip(false); return; }
  if (choicesShown()) return;
  advance();
}
function setStageW(W) { STAGE.w = W; fitStage(); }
/* ---- 作品のタイトル画面 ---- */
async function showWorkTitle() {
  stopBGM(); clearPanel(); clearWeather();
  const w = P.w, bm = await dbGet('saves', w.id + ':bm');
  const img = mediaSrc(w.titleImg);
  const okBm = bm && w.blocks[bm.b];
  const p = h('div', { class: 'ppanel ptitle' },
    img ? h('img', { class: 'ptitle-img', src: img }) : null,
    h('div', { class: 'ptitle-box' },
      h('div', { class: 'ptitle-t' }, w.title),
      w.author ? h('div', { class: 'ptitle-a' }, 'さく：' + w.author) : null,
      h('div', { class: 'ptitle-btns' },
        btn('play', 'はじめから', () => { clearPanel(); restart(); }),
        okBm ? btn('book', 'つづきから', () => { clearPanel(); loadState(bm); }) : btnOff('book', 'つづきから', 'まだ、しおりがありません'),
        btn('load', 'ロード', () => saveLoadPanel('load')))),
    btn('back', 'もどる', () => playerBack(), 'tl pb'), btn('gear', '設定', () => openSettings(), 'tr pb'));
  showPanel(p);
}
function showPanel(p) { clearPanel(); P.panel = p; $('#scr-play').appendChild(p); }
function clearPanel() { if (P.panel) P.panel.remove(); P.panel = null; }
function restart() {
  P.hist = []; stopBGM(); clearPanel();
  enterBlock(startBlock(P.w).id, emptyVis(), 0);
}
/* ---- ブロック・ページ・ステップ ---- */
function enterBlock(bid, entry, li = 0, pushHist = true) {
  P.b = bid; P.entry = clone(entry);
  if (pushHist) P.hist.push({ b: bid });
  P.pages = paginateW(P.w, P.w.blocks[bid]);
  if (!li) { showPage(0); return; }
  const pi = pageOfLine(P.pages, li), si = Math.max(0, P.pages[pi].steps.findIndex(s => s.rows.some(r => r.li >= li)));
  showPage(pi, true, si);
}
function curBlock() { return P.w.blocks[P.b]; }
function curStepLi() { const pg = P.pages[P.pi]; return pg.steps[P.si].rows[0].li; }
/* ページを開く。upto まで（サウンドノベル）一気に出す */
function showPage(pi, instant, upto = 0) {
  stopTyping(); clearChoices();
  P.pi = pi; const page = P.pages[pi], blk = curBlock();
  const vis = visUntil(blk, P.entry, page.steps[upto].rows[0].li, true);
  renderVis(vis);
  if (vis.bgm !== AU.bgmId) playBGM(vis.bgm);
  const nm = $('#pname'); nm.textContent = page.name; nm.style.display = !isNovel() && P.w.opts.name && page.name ? 'block' : 'none';
  $('#pnum').textContent = `${pi + 1} / ${P.pages.length}`;
  $('#pb-prev').disabled = pi === 0;
  $('#ptext').innerHTML = '';
  for (let s = 0; s < upto; s++) { P.si = s; typeStep(page.steps[s], true, true); }
  P.si = upto;
  typeStep(page.steps[upto], instant || P.skip || sv('speed') === 0);
}
function saveBookmark() { if (!P.test && P.b) dbPut('saves', { b: P.b, li: curStepLi(), entry: P.entry, hist: P.hist, date: Date.now() }, P.w.id + ':bm'); }
function renderVis(vis) {
  const fade = P.skip ? 80 : 420;
  setLayer($('#lay-bg'), vis.bg, mediaSrc(vis.bg), null, fade);
  for (let s = 0; s < 3; s++) { const c = vis.ch[s]; setLayer($('#lay-c' + s), c && c.m, c && mediaSrc(c.m), c, fade, s); }
  P.tone = vis.tone; $('#pvis').style.filter = toneCss(vis.tone);
  setWeather($('#lay-w'), vis.weather);
}
function clearWeather() { const l = $('#lay-w'); if (l) setWeather(l, null); }
const CH_X = [22, 50, 78];
function setLayer(el, key, src, c, fade, slot) {
  const cur = el._cur;
  const style = img => { if (c) { img.className = 'chimg'; img.style.left = CH_X[slot] + '%'; img.style.height = (86 * (c.s || 1)) + '%'; img.style.bottom = ((c.y || 0) * 30) + 'px'; } };
  if (cur && cur._key === key) { style(cur); return; }
  if (cur) { const o = cur; o.style.transition = `opacity ${fade}ms`; o.style.opacity = 0; setTimeout(() => o.remove(), fade + 30); el._cur = null; }
  if (!key || !src) return;
  const img = h('img', { src, class: c ? 'chimg' : 'bgimg' }); img._key = key; style(img);
  img.style.opacity = 0; el.appendChild(img); el._cur = img;
  void img.offsetWidth; img.style.transition = `opacity ${fade}ms`; img.style.opacity = 1;
}
/* 行が出はじめたときにおきること */
function lineFx(li) {
  const c = curBlock().cues[li]; if (!c) return;
  if (c.bgm) playBGM(c.bgm === 'stop' ? null : c.bgm);
  if (c.tone) { const t = c.tone === 'none' ? null : c.tone; $('#pvis').style.filter = toneCss(t); }
  if (c.weather) setWeather($('#lay-w'), c.weather === 'none' ? null : c.weather);
  if (P.skip) return;
  if (c.se) playSE(c.se);
  if (c.fx) flash(c.fx, '#ffffff');
  for (const e of c.ef || []) runEffect(e);
}
function anim(el, name, ms) { if (!el) return; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = `${name} ${ms}ms ease-out`; }
function runEffect(e) {
  const pv = $('#pv');
  switch (e.t) {
    case 'flashW': flash(e.n || 1, '#ffffff'); break;
    case 'flashR': flash(e.n || 2, '#ff2a2a'); break;
    case 'thunder': flash(2, '#ffffff'); anim(pv, 'shakeL', 600); playSE('S:kaminari'); break;
    case 'shakeS': anim(pv, 'shakeS', 500); break;
    case 'shakeL': anim(pv, 'shakeL', 700); break;
    case 'black': case 'white': { const f = $('#fade'); f.style.background = e.t === 'black' ? '#000' : '#fff'; anim(f, 'fadeio', 1500); break; }
    case 'zoom': anim($('#pvis'), 'zoomio', 900); break;
    case 'jump': anim($('#lay-c' + (e.s ?? 1)), 'jump', 700); break;
    case 'shiver': anim($('#lay-c' + (e.s ?? 1)), 'shiver', 700); break;
    case 'confetti': burst($('#lay-fx'), 'confetti', 5500); break;
    case 'fireworks': burst($('#lay-fx'), 'fireworks', 6500); break;
  }
}
function flash(n, color) {
  const f = $('#flash'); if (!f) return;
  f.style.background = color || '#fff';
  f.style.animation = 'none'; void f.offsetWidth; f.style.animation = `flash .24s ease-out ${n}`;
}
/* 1ステップ分の行を出す（ウインドウ型は書きかえ、サウンドノベル型は下に足す） */
function typeStep(step, instant, quiet) {
  const box = $('#ptext');
  if (!isNovel()) box.innerHTML = '';
  const rows = step.rows.map(r => { const d = h('div', { class: 'prow' }); box.appendChild(d); return { el: d, r, chars: [...r.t] }; });
  $('#ptri').style.visibility = 'hidden';
  const done = () => {
    P.typing = null;
    let ch = false; for (const r of step.rows) { const k = P.b + ':' + r.li; if (!P.read.has(k)) { P.read.add(k); ch = true; } }
    if (ch) saveRead();
    if (quiet) return;
    $('#ptri').style.visibility = 'visible';
    saveBookmark();
    afterStep();
  };
  if (instant) { rows.forEach(x => { x.el.textContent = x.r.t; if (x.r.first && !quiet) lineFx(x.r.li); }); done(); return; }
  let ri = 0, ci = 0;
  const t = { timer: 0, finish() { clearTimeout(t.timer); for (let i = ri; i < rows.length; i++) { if (rows[i].r.first && (i > ri || ci === 0)) lineFx(rows[i].r.li); rows[i].el.textContent = rows[i].r.t; } done(); } };
  P.typing = t;
  const stepFn = () => {
    while (ri < rows.length && ci >= rows[ri].chars.length) { if (rows[ri].chars.length === 0 && rows[ri].r.first) lineFx(rows[ri].r.li); ri++; ci = 0; }
    if (ri >= rows.length) { done(); return; }
    const x = rows[ri]; if (ci === 0 && x.r.first) lineFx(x.r.li);
    x.el.textContent += x.chars[ci++];
    t.timer = setTimeout(stepFn, sv('speed'));
  };
  stepFn();
}
let _readT = 0;
function saveRead() { clearTimeout(_readT); _readT = setTimeout(() => dbPut('saves', [...P.read], P.w.id + ':read'), 500); }
function stopTyping() { if (P.typing) { clearTimeout(P.typing.timer); P.typing = null; } clearTimeout(P.waiting); }
function atBlockEnd() { return P.pi === P.pages.length - 1 && P.si === P.pages[P.pi].steps.length - 1; }
function afterStep() {
  clearTimeout(P.waiting);
  if (atBlockEnd() && curBlock().end.type === 'choice') { showChoices(); if (P.skip) toggleSkip(false); return; }
  if (P.skip) {
    if (!nextStepRead()) { toggleSkip(false); toast('ここから先はまだ読んでいません'); return; }
    P.waiting = setTimeout(advance, 70); return;
  }
  if (P.auto) P.waiting = setTimeout(() => { if (P.auto && !P.typing && !P.panel) advance(); }, sv('wait'));
}
function nextStepRead() {
  const pg = P.pages[P.pi];
  const nx = P.si < pg.steps.length - 1 ? pg.steps[P.si + 1] : P.pi < P.pages.length - 1 ? P.pages[P.pi + 1].steps[0] : null;
  return !!nx && nx.rows.every(r => P.read.has(P.b + ':' + r.li));
}
function advance() {
  if (P.panel) return;
  if (P.typing) { P.typing.finish(); return; }
  const pg = P.pages[P.pi];
  if (P.si < pg.steps.length - 1) { P.si++; typeStep(pg.steps[P.si], P.skip || sv('speed') === 0); return; }
  if (P.pi < P.pages.length - 1) { showPage(P.pi + 1); return; }
  blockEnd();
}
function prevPage() {
  if (P.pi > 0 && !P.panel) { toggleAuto(false); toggleSkip(false); const pi = P.pi - 1; showPage(pi, true, P.pages[pi].steps.length - 1); }
}
function blockEnd() {
  const e = curBlock().end;
  if (e.type === 'next') return goTo(e.to);
  if (e.type === 'choice') return showChoices();
  if (e.type === 'cond') {
    const has = histHas(P.hist);
    for (const r of e.rules) if (ruleTrue(r, has)) return goTo(r.to);
    return goTo(e.else);
  }
  endPanel(e.name);
}
function goTo(bid) {
  if (!bid || !P.w.blocks[bid]) { endPanel(null, true); return; }
  const v = visEnd(curBlock(), P.entry);
  enterBlock(bid, v, 0);
}
function showChoices() {
  if (choicesShown()) return;
  toggleAuto(false);
  const chs = curBlock().end.choices;
  if (isNovel()) {
    // サウンドノベル型：本文の続きに、ふつうの文字で選択肢をならべる
    const box = $('#ptext'), m = novelMetrics(stageWOf(P.w));
    const used = box.querySelectorAll('.prow').length;
    if (used + chs.length + 1 > m.rows) box.innerHTML = '';
    box.appendChild(h('div', { class: 'prow nspace' }));
    P.chSel = 0;
    chs.forEach((c, i) => {
      const d = h('div', { class: 'prow nchoice', onclick: e => { e.stopPropagation(); chooseNovel(i); } }, h('span', { class: 'nmark' }, '▶'), c.label || ('選択肢' + CHOICE_ABC[i]));
      d.onmouseenter = () => { P.chSel = i; markNChoice(); };
      box.appendChild(d);
    });
    markNChoice();
    $('#ptri').style.visibility = 'hidden';
    return;
  }
  const box = $('#pchoices');
  chs.forEach((c, i) => box.appendChild(btn(null, c.label || ('選択肢' + CHOICE_ABC[i]), e => { e.stopPropagation(); playSE('S:kettei'); choose(i); }, 'pch')));
}
function markNChoice() { $$('#ptext .nchoice').forEach((d, i) => d.classList.toggle('on', i === P.chSel)); }
function chooseNovel(i) {
  const ds = $$('#ptext .nchoice'); if (!ds.length) return;
  playSE('S:kettei');
  ds.forEach((d, k) => { if (k !== i) d.remove(); else { d.classList.add('picked'); d.onclick = null; } });
  setTimeout(() => choose(i), 450);
}
function clearChoices() { const b = $('#pchoices'); if (b) b.innerHTML = ''; }
function choose(i) {
  const last = P.hist[P.hist.length - 1]; if (last) last.c = i;
  clearChoices();
  goTo(curBlock().end.choices[i].to);
}
function endPanel(name, stuck) {
  toggleAuto(false); toggleSkip(false);
  if (!P.test) dbDel('saves', P.w.id + ':bm');
  const p = h('div', { class: 'ppanel pend' }, h('div', { class: 'dlg' },
    h('div', { class: 'pend-t' }, stuck ? 'ここで止まりました' : 'おしまい'),
    h('div', { class: 'pend-s' }, stuck ? '行き先が決まっていません（作る画面でつなげてください）' : (name ? 'エンディング：' + name : '　')),
    h('div', { class: 'dlg-btns' },
      btn('refresh', 'はじめから', () => { clearPanel(); P.w.opts.title ? showWorkTitle() : restart(); }),
      btn('back', P.test ? '作る画面へ' : '作品えらびへ', () => playerBack()))));
  showPanel(p);
}
function toggleAuto(v) { P.auto = v ?? !P.auto; if (P.auto) P.skip = false; updBar(); if (P.auto && !P.typing && !P.panel && !choicesShown()) afterStep(); }
function toggleSkip(v) {
  P.skip = v ?? !P.skip; if (P.skip) P.auto = false; updBar();
  if (P.skip) { if (P.typing) P.typing.finish(); else afterStep(); }
}
function updBar() { const a = $('#pb-auto'), s = $('#pb-skip'); if (a) a.classList.toggle('on', P.auto); if (s) s.classList.toggle('on', P.skip); }
function playerBack() {
  stopTyping(); stopBGM(); toggleAuto(false); P.skip = false; clearPanel(); clearWeather();
  $('#stage').classList.remove('playing');
  setStageW(1280);
  if (P.onBack) P.onBack(); else gotoSelect('view');
}
function curState() {
  const page = P.pages[P.pi];
  return { b: P.b, li: curStepLi(), entry: clone(P.entry), hist: clone(P.hist), date: Date.now(), snip: page.steps[P.si].rows.map(r => r.t).join('').slice(0, 30), label: blockLabel(P.w, curBlock()) };
}
function loadState(s) {
  clearPanel(); stopBGM(); toggleAuto(false); toggleSkip(false);
  P.hist = clone(s.hist);
  enterBlock(s.b, s.entry, s.li, false);
}
/* セーブ・ロード（6つ） */
async function saveLoadPanel(mode) {
  toggleAuto(false); toggleSkip(false);
  const slots = [];
  for (let i = 1; i <= 6; i++) slots.push(await dbGet('saves', P.w.id + ':s' + i));
  let m;
  const grid = h('div', { class: 'slgrid' }, slots.map((s, i) => {
    const valid = s && P.w.blocks[s.b];
    const card = h('button', { class: 'slot' + (valid ? '' : ' emp'), onclick: async () => {
      if (mode === 'save') {
        if (!P.b) { toast('まだ読み始めていません'); return; }
        if (valid && !(await okAsk(`セーブ${i + 1}にうわがきしますか？`))) return;
        await dbPut('saves', curState(), P.w.id + ':s' + (i + 1)); closeModal(m); toast(`セーブ${i + 1}にセーブしました`);
      } else {
        if (!valid) return;
        closeModal(m); loadState(s);
      }
    } },
      h('div', { class: 'slot-n' }, 'セーブ ' + (i + 1)),
      valid ? [h('div', { class: 'slot-b' }, 'ブロック ' + s.label + '　' + fmtDate(s.date)), h('div', { class: 'slot-s' }, s.snip || '')] : h('div', { class: 'slot-b' }, 'あき'));
    if (mode === 'load' && !valid) card.disabled = true;
    return card;
  }));
  m = openModal(h('div', { class: 'dlg dlg-sl' },
    h('div', { class: 'dlg-title' }, mode === 'save' ? 'セーブする場所をえらんでください' : 'ロードするデータをえらんでください'),
    grid, h('div', { class: 'dlg-btns' }, btn('x', 'とじる', () => closeModal(m)))), { close: true });
}
function playerRelayout() {
  if (!P.w || !$('#scr-play').classList.contains('show')) return;
  const li = P.pages.length ? curStepLi() : 0;
  const keep = P.panel; P.panel = null;
  buildPlayer();
  if (keep) { P.panel = keep; $('#scr-play').appendChild(keep); }
  if (P.b) {
    P.pages = paginateW(P.w, curBlock());
    const pi = pageOfLine(P.pages, li), si = Math.max(0, P.pages[pi].steps.findIndex(s => s.rows.some(r => r.li >= li)));
    showPage(pi, true, si);
  }
}
