/* ===== 見る（再生） ===== */
const P = { w: null, b: null, pages: [], pi: 0, entry: null, hist: [], typing: null, auto: false, skip: false, hidden: false, test: false, onBack: null, read: new Set(), waiting: null, panel: null };
function hexRgb(hx) { const n = parseInt(hx.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(hx, to, k) { const a = hexRgb(hx), b = hexRgb(to); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
function themeVars(el, th) {
  const [r, g, b] = hexRgb(th.ui);
  el.style.setProperty('--wui', th.ui);
  el.style.setProperty('--wui-d', mix(th.ui, '#000000', 0.35));
  el.style.setProperty('--wui-l', mix(th.ui, '#ffffff', 0.45));
  el.style.setProperty('--wui-p', mix(th.ui, '#ffffff', 0.85));
  el.style.setProperty('--wtx', th.tx);
  el.style.setProperty('--wwin', `rgba(${r},${g},${b},${sv('alpha')})`);
}
const stageWOf = w => w.ratio === '4:3' ? 960 : 1280;
async function playWork(w, opts = {}) {
  auInit(); stopBGM();
  Object.assign(P, { w, b: null, pages: [], pi: 0, entry: emptyVis(), hist: [], auto: false, skip: false, hidden: false, test: !!opts.test, onBack: opts.onBack, panel: null });
  if (opts.loadMedia !== false) await loadMediaFor(w);
  const rd = await dbGet('saves', w.id + ':read'); P.read = new Set(rd || []);
  setStageW(stageWOf(w));
  buildPlayer();
  showScreen('play');
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
  const scr = $('#scr-play'); scr.innerHTML = ''; scr.className = 'screen show';
  themeVars(scr, P.w.theme || DEF_THEME);
  const W = stageWOf(P.w), m = winMetrics(W);
  scr.style.width = W + 'px';
  const pv = h('div', { class: 'pv', id: 'pv' },
    h('div', { class: 'lay lay-bg', id: 'lay-bg' }),
    h('div', { class: 'lay', id: 'lay-c0' }), h('div', { class: 'lay', id: 'lay-c1' }), h('div', { class: 'lay', id: 'lay-c2' }),
    h('div', { class: 'flash', id: 'flash' }));
  const win = h('div', { class: 'pwin', id: 'pwin', style: `left:${m.x}px;width:${m.w}px;height:${m.h}px;top:${m.y}px;padding:${WIN_PAD_Y}px ${WIN_PAD_X}px;font-size:${m.fs}px;line-height:${LH}` },
    h('div', { class: 'ptext', id: 'ptext' }));
  const name = h('div', { class: 'pname', id: 'pname', style: `left:${m.x + 16}px;top:${m.y - 44}px` });
  const mark = h('div', { class: 'pmark', id: 'pmark', style: `left:${m.x}px;width:${m.w}px;top:${m.y + m.h + 6}px` },
    h('span', { id: 'pnum' }), h('span', { class: 'tri', id: 'ptri' }, '▼'));
  const bw = W === 960 ? 106 : 132, gap = W === 960 ? 6 : 12;
  const bar = h('div', { class: 'pbar', id: 'pbar' });
  const defs = [['back', 'もどる', () => playerBack()], ['prev', 'まえ', () => prevPage()], ['skip', 'スキップ', () => toggleSkip()], ['auto', 'オート', () => toggleAuto()],
    ['save', 'セーブ', () => saveLoadPanel('save')], ['load', 'ロード', () => saveLoadPanel('load')], ['eyeoff', 'かくす', () => setHidden(true)], ['gear', '設定', () => openSettings()]];
  defs.forEach(([icn, lb, fn], i) => {
    const x = i === defs.length - 1 ? W - 20 - bw : 20 + i * (bw + gap);
    const b = btn(icn, lb, e => { e.stopPropagation(); auInit(); fn(); }, 'pb' + (W === 960 ? ' narrow' : ''));
    b.style.cssText = `left:${x}px;width:${bw}px`; b.id = 'pb-' + icn; bar.appendChild(b);
  });
  const ch = h('div', { class: 'pchoices', id: 'pchoices', style: `top:84px;height:${m.y - 100}px` });
  scr.append(pv, name, win, mark, bar, ch);
  scr.onpointerdown = e => { if (e.button === 2) return; if (e.target.closest('button,.modal,.ppanel')) return; auInit(); clickAdvance(); };
  scr.oncontextmenu = e => { e.preventDefault(); if (!P.panel) setHidden(!P.hidden); };
}
function playerKey(e) {
  if ($('.modal')) return;
  const k = e.key;
  if (P.hidden) { if (k === 'Enter' || k === 'Escape' || k === ' ' || k === 'h' || k === 'H') { e.preventDefault(); setHidden(false); } return; }
  const chs = $$('#pchoices button');
  if (chs.length && /^[1-3]$/.test(k)) { const b = chs[+k - 1]; if (b) b.click(); return; }
  if (k === 'Enter' || k === ' ' || k === 'ArrowRight') { e.preventDefault(); clickAdvance(); }
  else if (k === 'ArrowLeft') prevPage();
  else if (k === 'h' || k === 'H') setHidden(true);
}
function setHidden(v) { P.hidden = v; $('#scr-play').classList.toggle('hid', v); }
function clickAdvance() {
  if (P.hidden) { setHidden(false); return; }
  if (P.panel) return;
  if (P.skip) { toggleSkip(false); return; }
  if ($('#pchoices').children.length) return;
  advance();
}
function setStageW(W) { STAGE.w = W; fitStage(); }
/* ---- 作品のタイトル画面 ---- */
async function showWorkTitle() {
  stopBGM(); clearPanel();
  const w = P.w, bm = await dbGet('saves', w.id + ':bm');
  const img = w.titleImg && MEDIA[w.titleImg];
  const p = h('div', { class: 'ppanel ptitle' },
    img ? h('img', { class: 'ptitle-img', src: img }) : null,
    h('div', { class: 'ptitle-box' },
      h('div', { class: 'ptitle-t' }, w.title),
      w.author ? h('div', { class: 'ptitle-a' }, 'さく：' + w.author) : null,
      h('div', { class: 'ptitle-btns' },
        btn('play', 'はじめから', () => { clearPanel(); restart(); }),
        btn('book', 'つづきから', () => { clearPanel(); loadState(bm); }, bm && w.blocks[bm.b] ? '' : 'dis'),
        btn('load', 'ロード', () => saveLoadPanel('load')))),
    btn('back', 'もどる', () => playerBack(), 'tl pb'), btn('gear', '設定', () => openSettings(), 'tr pb'));
  if (!(bm && w.blocks[bm.b])) p.querySelectorAll('.dis').forEach(b => b.disabled = true);
  showPanel(p);
}
function showPanel(p) { clearPanel(); P.panel = p; $('#scr-play').appendChild(p); }
function clearPanel() { if (P.panel) P.panel.remove(); P.panel = null; }
function restart() {
  P.hist = []; stopBGM(); clearPanel();
  enterBlock(startBlock(P.w).id, emptyVis(), 0);
}
/* ---- ブロックとページ ---- */
function enterBlock(bid, entry, li = 0, pushHist = true) {
  P.b = bid; P.entry = clone(entry);
  if (pushHist) P.hist.push({ b: bid });
  P.pages = paginate(P.w.blocks[bid], stageWOf(P.w), P.w.opts.name);
  showPage(li ? pageOfLine(P.pages, li) : 0);
}
function curBlock() { return P.w.blocks[P.b]; }
function showPage(pi, instant) {
  stopTyping(); clearChoices();
  P.pi = pi; const page = P.pages[pi], blk = curBlock(), firstLi = page.rows[0].li;
  const vis = visUntil(blk, P.entry, firstLi, true);
  renderVis(vis);
  if (vis.bgm !== AU.bgmId) playBGM(vis.bgm);
  const nm = $('#pname'); nm.textContent = page.name; nm.style.display = P.w.opts.name && page.name ? 'block' : 'none';
  $('#pnum').textContent = `${pi + 1} / ${P.pages.length}`;
  $('#ptri').style.visibility = 'hidden';
  $('#pb-prev').disabled = pi === 0;
  if (!P.test) dbPut('saves', { b: P.b, li: firstLi, entry: P.entry, hist: P.hist, date: Date.now() }, P.w.id + ':bm');
  typePage(page, instant || P.skip || sv('speed') === 0);
}
function renderVis(vis) {
  const fade = P.skip ? 80 : 420;
  setLayer($('#lay-bg'), vis.bg, vis.bg && MEDIA[vis.bg], null, fade);
  for (let s = 0; s < 3; s++) {
    const c = vis.ch[s];
    setLayer($('#lay-c' + s), c && c.m, c && MEDIA[c.m], c, fade, s);
  }
}
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
function lineFx(li) {
  const c = curBlock().cues[li]; if (!c) return;
  if (c.bgm) playBGM(c.bgm === 'stop' ? null : c.bgm);
  if (P.skip) return;
  if (c.se) playSE(c.se);
  if (c.fx) flash(c.fx);
}
function flash(n) {
  const f = $('#flash'); if (!f) return;
  f.style.animation = 'none'; void f.offsetWidth; f.style.animation = `flash .24s ease-out ${n}`;
}
function typePage(page, instant) {
  const box = $('#ptext'); box.innerHTML = '';
  const rows = page.rows.map(r => { const d = h('div', { class: 'prow' }); box.appendChild(d); return { el: d, r, chars: [...r.t] }; });
  const done = () => {
    P.typing = null; $('#ptri').style.visibility = 'visible';
    let ch = false; for (const r of page.rows) { const k = P.b + ':' + r.li; if (!P.read.has(k)) { P.read.add(k); ch = true; } }
    if (ch) saveRead();
    afterPage();
  };
  if (instant) {
    rows.forEach(x => { x.el.textContent = x.r.t; if (x.r.first) lineFx(x.r.li); });
    done(); return;
  }
  let ri = 0, ci = 0;
  const t = { timer: 0, finish() { clearTimeout(t.timer); for (let i = ri; i < rows.length; i++) { if (rows[i].r.first && (i > ri || ci === 0)) lineFx(rows[i].r.li); rows[i].el.textContent = rows[i].r.t; } done(); } };
  P.typing = t;
  const step = () => {
    while (ri < rows.length && ci >= rows[ri].chars.length) { if (rows[ri].chars.length === 0 && rows[ri].r.first) lineFx(rows[ri].r.li); ri++; ci = 0; }
    if (ri >= rows.length) { done(); return; }
    const x = rows[ri]; if (ci === 0 && x.r.first) lineFx(x.r.li);
    x.el.textContent += x.chars[ci++];
    t.timer = setTimeout(step, sv('speed'));
  };
  step();
}
let _readT = 0;
function saveRead() { clearTimeout(_readT); _readT = setTimeout(() => dbPut('saves', [...P.read], P.w.id + ':read'), 500); }
function stopTyping() { if (P.typing) { clearTimeout(P.typing.timer); P.typing = null; } clearTimeout(P.waiting); }
function afterPage() {
  clearTimeout(P.waiting);
  const last = P.pi === P.pages.length - 1, e = curBlock().end;
  if (last && e.type === 'choice') { showChoices(); if (P.skip) toggleSkip(false); return; }
  if (P.skip) {
    const nextRead = nextPageRead();
    if (!nextRead) { toggleSkip(false); toast('ここから先はまだ読んでいません'); return; }
    P.waiting = setTimeout(advance, 70); return;
  }
  if (P.auto) P.waiting = setTimeout(() => { if (P.auto && !P.typing && !P.panel) advance(); }, sv('wait'));
}
function nextPageRead() {
  if (P.pi < P.pages.length - 1) return P.pages[P.pi + 1].rows.every(r => P.read.has(P.b + ':' + r.li));
  return false; // ブロックの終わりではスキップを止める
}
function advance() {
  if (P.panel) return;
  if (P.typing) { P.typing.finish(); return; }
  if (P.pi < P.pages.length - 1) { showPage(P.pi + 1); return; }
  blockEnd();
}
function prevPage() { if (P.pi > 0 && !P.panel) { toggleAuto(false); toggleSkip(false); showPage(P.pi - 1, true); } }
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
  const box = $('#pchoices'); if (box.children.length) return;
  toggleAuto(false);
  curBlock().end.choices.forEach((c, i) => {
    box.appendChild(btn(null, c.label || ('選択肢' + CHOICE_ABC[i]), e => { e.stopPropagation(); playSE('S:kettei'); choose(i); }, 'pch'));
  });
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
function toggleAuto(v) { P.auto = v ?? !P.auto; if (P.auto) P.skip = false; updBar(); if (P.auto && !P.typing && !P.panel && !$('#pchoices').children.length) afterPage(); }
function toggleSkip(v) {
  P.skip = v ?? !P.skip; if (P.skip) P.auto = false; updBar();
  if (P.skip) { if (P.typing) P.typing.finish(); else afterPage(); }
}
function updBar() { const a = $('#pb-auto'), s = $('#pb-skip'); if (a) a.classList.toggle('on', P.auto); if (s) s.classList.toggle('on', P.skip); }
function playerBack() {
  stopTyping(); stopBGM(); toggleAuto(false); P.skip = false; clearPanel();
  setStageW(1280);
  if (P.onBack) P.onBack(); else gotoSelect('view');
}
function curState() {
  const page = P.pages[P.pi];
  return { b: P.b, li: page.rows[0].li, entry: clone(P.entry), hist: clone(P.hist), date: Date.now(), snip: page.rows.map(r => r.t).join('').slice(0, 30), label: blockLabel(P.w, curBlock()) };
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
  const li = P.pages.length ? P.pages[P.pi].rows[0].li : 0;
  const keep = { panel: P.panel };
  P.panel = null;
  buildPlayer();
  if (keep.panel) { P.panel = keep.panel; $('#scr-play').appendChild(keep.panel); }
  if (P.b) { P.pages = paginate(curBlock(), stageWOf(P.w), P.w.opts.name); showPage(pageOfLine(P.pages, li), true); }
}
