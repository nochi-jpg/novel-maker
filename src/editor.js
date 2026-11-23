/* ===== 作る（エディタ） ===== */
const E = { w: null, tab: 'map', bid: null, mapPage: 0, pick: null, li: null, linePage: 0, libKind: 'bg', libPath: [], libPage: 0, libSel: null, chSlot: 1, chk: null, entryCache: {}, guideMsg: null };
const KIND_NAME = { bg: '背景', ch: '人物', se: '効果音', bgm: 'BGM', ef: 'エフェクト' };
const KIND_ICON = { bg: 'image', ch: 'user', se: 'bell', bgm: 'music', ef: 'zap' };
const SLOT_NAME = ['左', '中央', '右'];
function pin(parent, el, x, y, w, hh) {
  el.style.position = 'absolute'; el.style.left = x + 'px'; el.style.top = y + 'px';
  if (w != null) el.style.width = w + 'px'; if (hh != null) el.style.height = hh + 'px';
  parent.appendChild(el); return el;
}
async function openEditor(w) {
  fixWork(w);
  Object.assign(E, { w, pick: null, li: null, linePage: 0, libSel: null, libPath: [], libPage: 0, mapPage: 0, mapScroll: 0, chk: null, entryCache: {}, guideMsg: null });
  await loadMediaFor(w);
  E.bid = startBlock(w).id;
  E.tab = w.opts.long ? 'map' : 'text';
  setStageW(1280);
  showScreen('edit');
  APP.key = editorKey;
  editorRefresh();
}
function backToEditor() { setStageW(1280); showScreen('edit'); APP.key = editorKey; editorRefresh(); }
function editorKey(e) {
  if ($('.modal')) return;
  if (e.key === 'Escape' && E.pick) { E.pick = null; E.guideMsg = null; editorRefresh(); }
}
let _dirtyT = 0;
function markDirty(redraw) {
  E.chk = null; E.entryCache = {};
  clearTimeout(_dirtyT); _dirtyT = setTimeout(() => saveWork(E.w), 800);
  if (redraw) editorRefresh();
}
async function flushSave() { clearTimeout(_dirtyT); await saveWork(E.w); }
const curB = () => E.w.blocks[E.bid] || startBlock(E.w);
function stepsOf(w) {
  const s = [['text', '文章を書く'], ['fx', '絵と音'], ['work', 'しあげ・送る']];
  return w.opts.long ? [['map', 'お話をつなぐ'], ...s] : s;
}
function goStep(k) { stopBGM(); E.pick = null; E.guideMsg = null; E.tab = k; editorRefresh(); }
/* 案内バー */
function guide(msg, warn) {
  const g = $('#guide'); if (!g) { toast(msg); return; }
  E.guideMsg = { msg, warn };
  g.classList.toggle('warn', !!warn);
  $('.g-msg', g).textContent = msg;
  clearTimeout(guide._t);
  if (warn) guide._t = setTimeout(() => { E.guideMsg = null; const gg = $('#guide'); if (gg) { gg.classList.remove('warn'); $('.g-msg', gg).textContent = defaultGuide(); } }, 4000);
}
function defaultGuide() {
  if (E.pick) return '行き先にしたいブロックをクリックしてください（空いたマスなら、新しく作ってつなぎます）';
  if (E.tab === 'map') return 'ブロックをえらんで、右で「読みおわったら どうする？」を決めよう';
  if (E.tab === 'text') return 'お話を書いたり、はりつけたりしよう。空いた行でページが変わります';
  if (E.tab === 'fx') {
    if (E.li == null) return '① 左の「行」をえらぼう';
    if (!E.libSel) return '② まん中で、入れたい背景・人物・音をえらぼう';
    return '「この行に入れる」をおそう（③で、たしかめられます）';
  }
  return '作品の名前や色を決めて、できたら「作品ファイルを書き出す」で友だちに送ろう';
}
function editorRefresh() {
  const s = $('#scr-edit'); s.innerHTML = '';
  const w = E.w;
  if (!w.blocks[E.bid]) E.bid = startBlock(w).id;
  if (E.tab === 'map' && !w.opts.long) E.tab = 'text';
  // 上のバー
  const head = h('div', { class: 'ed-head' });
  // もどる：1つ前のステップへ（最初のステップなら作品えらびへ）。家：最初のステップ（お話をつなぐ）へ
  const steps0 = stepsOf(w), si = steps0.findIndex(x => x[0] === E.tab);
  head.appendChild(btn('back', 'もどる', async () => {
    if (si > 0) { goStep(steps0[si - 1][0]); return; }
    stopBGM(); await flushSave(); gotoSelect('make', APP.page);
  }, 'tl'));
  const home = si > 0 ? btn('home', null, () => goStep(steps0[0][0])) : btnOff('home', null, w.opts.long ? 'いま「お話をつなぐ」の画面です' : 'いま最初の画面です');
  home.title = w.opts.long ? 'お話をつなぐ画面へ' : '最初の画面へ';
  pin(head, home, 144, 12, 48, 48);
  const steps = h('div', { class: 'steps' });
  stepsOf(w).forEach(([k, lb], i) => {
    if (i) steps.appendChild(h('span', { class: 'step-ar' }, ic('next')));
    steps.appendChild(h('button', { class: 'step' + (E.tab === k ? ' now' : ''), onclick: () => { if (E.tab !== k) goStep(k); } },
      h('span', { class: 'no' }, String(i + 1)), lb));
  });
  head.appendChild(steps);
  const tr = btn('play', 'ためす', async () => { stopBGM(); await flushSave(); playWork(w, { test: true, loadMedia: false, onBack: backToEditor }); }, 'pri');
  pin(head, tr, 1004, 12, 128, 48);
  head.appendChild(btn('gear', '設定', () => openSettings(), 'tr'));
  s.appendChild(head);
  const body = h('div', { class: 'ed-body' });
  s.appendChild(body);
  ({ map: renderMap, text: renderText, fx: renderFx, work: renderWorkTab })[E.tab](body);
  // 案内バー
  const gm = E.guideMsg;
  const g = h('div', { class: 'guide' + (gm && gm.warn ? ' warn' : ''), id: 'guide' }, ic('info'), h('div', { class: 'g-msg' }, gm ? gm.msg : defaultGuide()),
    E.pick ? btn('x', 'やめる', () => { E.pick = null; E.guideMsg = null; editorRefresh(); }, 'xs') : null,
    h('div', { class: 'g-work' }, '作品：' + (w.title || 'むだい')));
  s.appendChild(g);
}
/* ---------- 1 お話をつなぐ（マップ） ---------- */
const MAP = { colW: 165, gap: 60, cardH: 150, rowGap: 12, x0: 12, y0: 4 };
function slotsOf(ep) { return ep === 1 ? 1 : (E.w.opts.branch ? 3 : 1); }
function cardXY(ep, slot) { return [MAP.x0 + (ep - 1) * (MAP.colW + MAP.gap), MAP.y0 + 40 + slot * (MAP.cardH + MAP.rowGap)]; }
const LINE_COLS = ['#e0a800', '#1c7ed6', '#2f9e44', '#1e3a7b', '#e8590c', '#868e96'];
function renderMap(body) {
  const w = E.w;
  if (!E.chk) E.chk = analyze(w);
  const chk = E.chk, totalEp = maxEp(w) + 1;
  const innerW = Math.max(840, MAP.x0 * 2 + totalEp * (MAP.colW + MAP.gap) - MAP.gap + 24);
  const sc = pin(body, h('div', { class: 'map-scroll' }), 16, 8, 840, 540);
  const inner = h('div', { class: 'map-inner', style: `width:${innerW}px;height:522px` });
  sc.appendChild(inner);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'map-svg'); svg.setAttribute('width', innerW); svg.setAttribute('height', 522);
  let html = '<defs>' + LINE_COLS.map((c, i) => `<marker id="ar${i}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('') + '</defs>';
  for (const b of Object.values(w.blocks)) {
    const [x, y] = cardXY(b.ep, b.slot), ex = exitsOf(b).filter(e => e.to && w.blocks[e.to]);
    ex.forEach((e, i) => {
      const ci = e.kind === 'choice' ? e.choice : e.kind === 'next' ? 3 : e.kind === 'rule' ? 4 : 5;
      const sx = x + MAP.colW, sy = y + MAP.cardH / 2 + (i - (ex.length - 1) / 2) * 22;
      const t = w.blocks[e.to], dash = (e.kind === 'rule' || e.kind === 'else') ? 'stroke-dasharray="7 5"' : '';
      const label = e.kind === 'choice' ? CHOICE_ABC[e.choice] : e.kind === 'rule' ? String(e.rule + 1) : e.kind === 'else' ? '他' : '';
      const [tx, ty] = cardXY(t.ep, t.slot);
      let d;
      if (t.ep > b.ep) { const ey = ty + MAP.cardH / 2; d = `M${sx} ${sy} C${sx + 40} ${sy},${tx - 40} ${ey},${tx} ${ey}`; }
      else { const cx = tx + MAP.colW / 2, top = Math.max(4, Math.min(sy, ty) - 30); d = `M${sx} ${sy} C${sx + 50} ${sy},${sx + 50} ${top},${(sx + cx) / 2} ${top} S${cx} ${ty - 30},${cx} ${ty}`; }
      html += `<path d="${d}" fill="none" stroke="${LINE_COLS[ci]}" stroke-width="3" ${dash} marker-end="url(#ar${ci})"/>`;
      if (label) html += `<text x="${sx + 4}" y="${sy - 5}" fill="${LINE_COLS[ci]}" font-size="14" font-weight="bold" class="svgt">${label}</text>`;
    });
  }
  svg.innerHTML = html;
  inner.appendChild(svg);
  for (let ep = 1; ep <= totalEp; ep++) {
    const [cx] = cardXY(ep, 0);
    pin(inner, h('div', { class: 'ep-head' }, 'エピソード ' + ep), cx, MAP.y0, MAP.colW, 32);
    for (let sl = 0; sl < slotsOf(ep); sl++) {
      const b = blockAt(w, ep, sl), [x, y] = cardXY(ep, sl);
      if (b) pin(inner, blockCard(b, chk), x, y, MAP.colW, MAP.cardH);
      else pin(inner, h('button', { class: 'card-empty' + (E.pick ? ' pickable' : ''), onclick: () => addBlock(ep, sl) }, ic('plus', 28), h('div', null, E.pick ? 'ここに作ってつなぐ' : 'ここに作る')), x, y, MAP.colW, MAP.cardH);
    }
  }
  // スクロール：位置を覚える。たてのホイールでも横に動く
  sc.scrollLeft = E.mapScroll || 0;
  sc.onscroll = () => { E.mapScroll = sc.scrollLeft; };
  sc.onwheel = e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { sc.scrollLeft += e.deltaY; e.preventDefault(); } };
  const bar = h('div', { class: 'map-bar' },
    h('div', { class: 'hint', style: 'display:flex;align-items:center;gap:6px;font-weight:bold' }, ic('arrow'), `エピソード ${totalEp}まで（横にスクロールできます）`),
    h('div', { class: 'chk-sum' + (chk.count ? ' bad' : '') }, ic(chk.count ? 'warn' : 'check'),
      chk.limited ? 'ルートが多すぎて全部はチェックできません' : chk.count ? `問題が ${chk.count} こ（カードのアイコンをクリック）` : '問題はありません'));
  pin(body, bar, 16, 554, 840, 40);
  body.appendChild(blockPanel());
}
function endSummary(b) {
  const e = b.end, w = E.w, lb = id => id && w.blocks[id] ? blockLabel(w, w.blocks[id]) : '？';
  if (e.type === 'next') return ['next', 'arrow', '次へ ' + lb(e.to)];
  if (e.type === 'choice') return ['choice', 'branch', `選択肢 ${e.choices.length}つ`];
  if (e.type === 'cond') return ['cond', 'cond', `条件 ${e.rules.length}つ`];
  return ['end', 'end', e.name || 'おわり'];
}
function blockCard(b, chk) {
  const w = E.w, iss = chk.issues[b.id] || [], [ec, ei, et] = endSummary(b);
  const types = [...new Set(iss.map(x => x.type))];
  return h('div', { class: 'bcard' + (b.id === E.bid && !E.pick ? ' sel' : '') + (E.pick ? (E.pick.from === b.id ? ' nopick' : ' pickable') : ''), onclick: () => {
    if (E.pick) { if (E.pick.from === b.id) { guide('自分自身にはつなげません', true); return; } E.pick.set(b.id); E.pick = null; E.guideMsg = null; markDirty(true); return; }
    E.bid = b.id; E.li = null; E.linePage = 0; editorRefresh();
  } },
    h('div', { class: 'bc-top' }, h('div', { class: 'bc-l' }, blockLabel(w, b)),
      h('div', { class: 'bc-iss' }, types.slice(0, 4).map(t => h('button', { class: 'iss', style: `color:${ISSUE[t].color === '#adb5bd' ? '#868e96' : ISSUE[t].color}`, title: ISSUE[t].name, onclick: e => {
        e.stopPropagation(); showIssues(b);
      } }, ic(ISSUE[t].icon))))),
    h('div', { class: 'bc-txt' }, b.text.trim() ? b.text.replace(/\n+/g, ' ').slice(0, 40) : '（まだ文章がありません）'),
    h('div', { class: 'bc-end ' + ec }, ic(ei), h('span', null, et)));
}
function addBlock(ep, slot) {
  const w = E.w;
  if (blockAt(w, ep, slot)) return;
  const b = newBlock(ep, slot); w.blocks[b.id] = b;
  if (E.pick) { E.pick.set(b.id); E.pick = null; E.guideMsg = null; }
  else if (!w.opts.branch) {
    const p = blockAt(w, ep - 1, 0);
    if (p && (p.end.type === 'end' || (p.end.type === 'next' && !p.end.to)) && !p.end.name) { p.end.type = 'next'; p.end.to = b.id; }
  }
  E.bid = b.id; markDirty(true);
}
async function removeBlock(b) {
  const w = E.w;
  if (!(await okAsk(`ブロック ${blockLabel(w, b)} を消しますか？`, '文章と絵・音の指定も消えます。もとにもどせません'))) return;
  delete w.blocks[b.id];
  for (const x of Object.values(w.blocks)) {
    const e = x.end;
    if (e.to === b.id) e.to = null; if (e.else === b.id) e.else = null;
    e.choices.forEach(c => { if (c.to === b.id) c.to = null; });
    e.rules.forEach(r => { if (r.to === b.id) r.to = null; r.groups = r.groups.map(g => g.filter(a => a.b !== b.id)); });
  }
  E.bid = startBlock(w).id; markDirty(true);
}
/* ブロックの問題を、全文で一覧にする */
function showIssues(b) {
  const w = E.w, iss = (E.chk && E.chk.issues[b.id]) || [], per = 4, pages = Math.max(1, Math.ceil(iss.length / per));
  let m, pg = 0;
  const list = h('div', { class: 'iss-list' }), nav = h('div', { class: 'dlg-btns' });
  const draw = () => {
    list.innerHTML = ''; nav.innerHTML = '';
    iss.slice(pg * per, pg * per + per).forEach(x => list.appendChild(h('div', { class: 'iss-row' },
      h('span', { class: 'iss-ic', style: `color:${ISSUE[x.type].color === '#adb5bd' ? '#868e96' : ISSUE[x.type].color}` }, ic(ISSUE[x.type].icon)),
      h('div', null, h('div', { class: 'iss-name' }, ISSUE[x.type].name), h('div', { class: 'iss-msg' }, x.msg)))));
    if (pages > 1) nav.append(pg > 0 ? btn('prev', '前へ', () => { pg--; draw(); }) : btnOff('prev', '前へ', '最初のページです'), h('div', { class: 'pg-n' }, `${pg + 1} / ${pages}`), pg < pages - 1 ? btn('next', '次へ', () => { pg++; draw(); }) : btnOff('next', '次へ', '最後のページです'));
    nav.appendChild(btn('check', 'わかった', () => closeModal(m), 'pri'));
  };
  draw();
  m = openModal(h('div', { class: 'dlg', style: 'width:760px' }, h('div', { class: 'dlg-title' }, `ブロック ${blockLabel(w, b)} の問題（${iss.length}こ）`), list, nav), { close: true });
}
function targetBtn(cur, set, wdt) {
  const w = E.w, b = cur && w.blocks[cur];
  const bt = h('button', { class: 'btn sm tgt', style: `width:${wdt}px`, onclick: () => { E.pick = { from: E.bid, set }; E.guideMsg = null; editorRefresh(); } },
    ic(b ? 'arrow' : 'link'), h('span', { class: 'tg-l' }, b ? blockLabel(w, b) + '　' + (b.text.trim().split('\n')[0] || '') : (wdt < 150 ? 'えらぶ' : '行き先をえらぶ')));
  if (!b) bt.style.borderStyle = 'dashed';
  return bt;
}
function blockPanel() {
  // 右の設定パネル：8px 単位で配置（x=16、はば 360）
  const w = E.w, b = curB(), e = b.end, X = 16, W = 360;
  const p = h('div', { class: 'panel' }); p.style.cssText = 'left:872px;top:8px;width:392px;height:584px';
  pin(p, h('div', { class: 'p-h' }, 'ブロック ' + blockLabel(w, b) + ' の設定'), X, 12, W, 32);
  const iss = (E.chk && E.chk.issues[b.id]) || [];
  pin(p, h('div', { class: 'iss-bar' + (iss.length ? ' bad' : '') }, ic(iss.length ? ISSUE[iss[0].type].icon : 'check'),
    h('span', { class: 'iss-bar-t' }, iss.length ? `問題が ${iss.length} こあります` : '問題はありません'),
    iss.length ? btn('info', 'くわしく', () => showIssues(b), 'xs') : null), X, 52, W, 40);
  pin(p, btn('text', '文章を書く', () => goStep('text'), 'sm'), X, 104, 176, 42);
  pin(p, btn('wand', '絵と音をつける', () => goStep('fx'), 'sm'), X + 184, 104, 176, 42);
  pin(p, h('div', { class: 'p-cap' }, '読みおわったら どうする？'), X, 160, W, 24);
  const grid = h('div', { class: 'opt-grid' });
  const types = [['next', '次へ進む', 'arrow', null], ['choice', '選択肢を出す', 'branch', w.opts.branch ? null : '「しあげ・送る」で分岐を「する」にすると使えます'],
    ['cond', '条件で分ける', 'cond', w.opts.flag ? null : '「しあげ・送る」でイベントフラグを「使う」にすると使えます'], ['end', 'おわりにする', 'end', null]];
  types.forEach(([t, lb, icn, off]) => {
    const bt = off ? btnOff(icn, lb, off, 'sm') : btn(e.type === t ? 'check' : icn, lb, () => { if (t === 'cond' && !e.rules.length) e.rules.push({ groups: [[]], to: null }); e.type = t; markDirty(true); }, 'sm' + (e.type === t ? ' on' : ''));
    grid.appendChild(bt);
  });
  pin(p, grid, X, 188, W, 92);
  const Y = 296; // ここから下が、おわり方ごとの設定
  if (e.type === 'next') {
    pin(p, h('div', { class: 'bp-line' }, h('div', { class: 'bp-k' }, '行き先'), targetBtn(e.to, id => { e.to = id; }, 272)), X, Y, W, 42);
  }
  if (e.type === 'choice') {
    const cnt = h('div', { class: 'bp-line' }, h('div', { class: 'bp-k mid' }, '選択肢の数'),
      [2, 3].map(n => btn(e.choices.length === n ? 'check' : null, n + 'つ', () => { while (e.choices.length < n) e.choices.push({ label: '', to: null }); e.choices.length = n; markDirty(true); }, 'sm' + (e.choices.length === n ? ' on' : ''))));
    $$('.btn', cnt).forEach(x => x.style.width = '124px');
    pin(p, cnt, X, Y, W, 42);
    e.choices.forEach((c, i) => {
      const inp = h('input', { class: 'inp sm', maxlength: 24, value: c.label, placeholder: '選択肢' + CHOICE_ABC[i] + 'の文字' });
      inp.oninput = () => { c.label = inp.value; markDirty(); };
      pin(p, h('div', { class: 'bp-line' }, h('div', { class: 'abc c' + i }, CHOICE_ABC[i]), inp, targetBtn(c.to, id => { c.to = id; }, 112)), X, Y + 50 + i * 50, W, 42);
    });
  }
  if (e.type === 'cond') {
    const per = 3, pages = Math.max(1, Math.ceil(e.rules.length / per));
    if (E.condBid !== b.id) { E.condBid = b.id; E.condPage = 0; }
    E.condPage = clamp(E.condPage || 0, 0, pages - 1);
    e.rules.slice(E.condPage * per, E.condPage * per + per).forEach((r, k) => {
      const i = E.condPage * per + k;
      pin(p, h('div', { class: 'bp-rule' },
        h('button', { class: 'rule-txt', onclick: () => editRule(b, i) }, h('b', null, '条件' + (i + 1) + '　'), ruleText(w, r)),
        targetBtn(r.to, id => { r.to = id; }, 104)), X, Y + k * 46, W, 40);
    });
    const y = Y + per * 46;
    const addB = e.rules.length < MAX_RULES
      ? btn('plus', '条件をふやす', () => { e.rules.push({ groups: [[]], to: null }); E.condPage = Math.floor((e.rules.length - 1) / per); markDirty(true); editRule(b, e.rules.length - 1); }, 'xs')
      : btnOff('plus', '条件をふやす', `条件は${MAX_RULES}つまでです`, 'xs');
    addB.style.width = '190px';
    const nav = h('div', { class: 'cond-nav' }, addB,
      E.condPage > 0 ? btn('prev', null, () => { E.condPage--; editorRefresh(); }, 'xs') : btnOff('prev', null, '最初のページです', 'xs'),
      h('div', { class: 'cond-pg' }, `${E.condPage + 1} / ${pages}`),
      E.condPage < pages - 1 ? btn('next', null, () => { E.condPage++; editorRefresh(); }, 'xs') : btnOff('next', null, '最後のページです', 'xs'));
    pin(p, nav, X, y, W, 34);
    const need = !E.chk || E.chk.elseUsed[b.id] !== false, has = !!(e.else && w.blocks[e.else]);
    const eb = targetBtn(e.else, id => { e.else = id; }, has ? 112 : 152);
    if (!need && !e.else) { eb.querySelector('.tg-l').textContent = 'なくてOK'; eb.classList.add('okbtn'); eb.title = 'どのルートも条件のどれかに当てはまるので、行き先はなくても大丈夫です'; }
    const clr = has ? btn('x', null, () => { e.else = null; markDirty(true); guide(need ? '行き先を消しました（どれにも当てはまらないルートがあるので、問題として表示されます）' : '行き先を消しました'); }, 'sm dng') : null;
    if (clr) { clr.style.width = '32px'; clr.style.padding = '0'; clr.title = '行き先を消す'; }
    pin(p, h('div', { class: 'bp-line' }, h('div', { class: 'bp-k wide' }, 'どれにも当てはまらない'), eb, clr), X, y + 42, W, 42);
  }
  if (e.type === 'end') {
    const inp = h('input', { class: 'inp sm', maxlength: 16, value: e.name, placeholder: '例：グッドエンド（なくてもOK）' });
    inp.oninput = () => { e.name = inp.value; markDirty(); };
    pin(p, h('div', { class: 'p-cap' }, 'エンディングの名前'), X, Y, W, 24);
    pin(p, inp, X, Y + 28, W, 42);
    pin(p, h('div', { class: 'hint' }, 'ここでお話がおしまいになります。'), X, Y + 78, W, 24);
  }
  pin(p, h('div', { class: 'bp-sep' }), X, 520, W, 2);
  pin(p, b.ep > 1 ? btn('trash', 'このブロックを消す', () => removeBlock(b), 'sm dng') : btnOff('trash', 'このブロックを消す', '最初のブロックは消せません', 'sm'), X + W - 200, 530, 200, 42);
  return p;
}
const MAX_RULES = 8;
/* 条件の編集 */
function editRule(b, ri, after) {
  const w = E.w, r = clone(b.end.rules[ri]);
  if (!r.groups.length) r.groups.push([]);
  let m;
  const blocks = blocksSorted(w), chBlocks = blocks.filter(x => x.end.type === 'choice');
  const KINDS = [['chose', '選択肢を選んだ'], ['notchose', '選択肢を選んでいない'], ['pass', 'ブロックを通った'], ['notpass', 'ブロックを通っていない']];
  const cols = h('div', { class: 'rule-cols' });
  function sel(opts, val, on, wdt) {
    const s = h('select', { class: 'sel', style: `width:${wdt}px` }, opts.map(([v, t]) => { const o = h('option', { value: v }, t); if (v === val) o.selected = true; return o; }));
    s.onchange = () => on(s.value); return s;
  }
  function draw() {
    cols.innerHTML = '';
    r.groups.forEach((g, gi) => {
      if (gi > 0) cols.appendChild(h('div', { class: 'or-lab' }, 'または'));
      const col = h('div', { class: 'rule-col' }, h('div', { class: 'rc-head' }, 'パターン ' + (gi + 1),
        r.groups.length > 1 ? btn('x', null, () => { r.groups.splice(gi, 1); draw(); }, 'xs dng') : null));
      g.forEach((a, ai) => {
        if (ai > 0) col.appendChild(h('div', { class: 'and-lab' }, 'かつ'));
        const isC = a.t === 'chose' || a.t === 'notchose';
        const bl = (isC ? chBlocks : blocks).map(x => [x.id, 'ブロック ' + blockLabel(w, x)]);
        if (!bl.length) bl.push(['', '（選択肢のブロックがない）']);
        if (!bl.some(x => x[0] === a.b)) a.b = bl[0][0];
        const tb = w.blocks[a.b];
        const cl = tb ? tb.end.choices.map((c, i) => [String(i), CHOICE_ABC[i] + (c.label ? '：' + c.label : '')]) : [['0', 'A']];
        col.appendChild(h('div', { class: 'atom' },
          h('div', { class: 'atom-r' }, sel(KINDS, a.t, v => { a.t = v; draw(); }, 250), btn('x', null, () => { g.splice(ai, 1); draw(); }, 'xs dng')),
          h('div', { class: 'atom-r' }, sel(bl, a.b, v => { a.b = v; a.c = 0; draw(); }, isC ? 140 : 296), isC ? sel(cl, String(a.c || 0), v => { a.c = +v; }, 150) : null)));
      });
      col.appendChild(g.length < 3 ? btn('plus', 'かつ', () => { g.push({ t: chBlocks.length ? 'chose' : 'pass', b: (chBlocks[0] || blocks[0]).id, c: 0 }); draw(); }, 'sm')
        : btnOff('plus', 'かつ', '「かつ」は3つまでです', 'sm'));
      col.lastChild.style.width = '160px';
      cols.appendChild(col);
    });
    if (r.groups.length < 3) { const a = btn('plus', 'または', () => { r.groups.push([]); draw(); }, 'sm'); a.style.width = '160px'; cols.appendChild(h('div', { class: 'or-add' }, a)); }
  }
  draw();
  m = openModal(h('div', { class: 'dlg dlg-rule' },
    h('div', { class: 'dlg-title' }, `ブロック ${blockLabel(w, b)} の 条件${ri + 1}：当てはまったら ${r.to && w.blocks[r.to] ? blockLabel(w, w.blocks[r.to]) + ' へ' : '（行き先はマップでえらぶ）'}`),
    cols,
    h('div', { class: 'dlg-btns' },
      btn('check', 'OK', () => { r.groups = r.groups.filter(g => g.length || r.groups.length === 1); b.end.rules[ri] = r; closeModal(m); markDirty(true); if (after) after(); }, 'pri'),
      ri > 0 ? btn('arrowup', '上へ', () => { const rs = b.end.rules; rs[ri] = r; [rs[ri - 1], rs[ri]] = [rs[ri], rs[ri - 1]]; E.condPage = Math.floor((ri - 1) / 3); closeModal(m); markDirty(true); guide(`条件${ri + 1}を、条件${ri}にしました（先に調べます）`); }) : btnOff('arrowup', '上へ', 'いちばん先に調べる条件です'),
      ri < b.end.rules.length - 1 ? btn('arrowdown', '下へ', () => { const rs = b.end.rules; rs[ri] = r; [rs[ri + 1], rs[ri]] = [rs[ri], rs[ri + 1]]; E.condPage = Math.floor((ri + 1) / 3); closeModal(m); markDirty(true); guide(`条件${ri + 1}を、条件${ri + 2}にしました（あとで調べます）`); }) : btnOff('arrowdown', '下へ', 'いちばんあとに調べる条件です'),
      btn('trash', 'この条件を消す', () => { closeModal(m); b.end.rules.splice(ri, 1); markDirty(true); if (after) after(); }, 'dng'),
      btn('x', 'やめる', () => closeModal(m)))));
}
/* ---------- ブロックの切りかえ ---------- */
function blockNav(label) {
  const w = E.w, list = blocksSorted(w), i = list.findIndex(b => b.id === E.bid);
  const go = d => { E.bid = list[i + d].id; E.li = null; E.linePage = 0; editorRefresh(); };
  return h('div', { class: 'bnav' },
    i > 0 ? btn('prev', null, () => go(-1), 'sm') : btnOff('prev', null, 'これが最初のブロックです', 'sm'),
    h('div', { class: 'bnav-l' }, (w.opts.long ? 'ブロック ' + blockLabel(w, curB()) : '') + label),
    i < list.length - 1 ? btn('next', null, () => go(1), 'sm') : btnOff('next', null, 'これが最後のブロックです', 'sm'));
}
/* ---------- 2 文章を書く ---------- */
function renderText(body) {
  const w = E.w, b = curB();
  const L = h('div', { class: 'panel' }); L.style.cssText = 'left:16px;top:8px;width:840px;height:584px';
  pin(L, blockNav(w.opts.long ? ' の文章' : '文章'), 12, 10, 812, 42);
  const ta = h('textarea', { class: 'ta', spellcheck: 'false', placeholder: 'ここにお話を書いたり、はりつけたりします。' });
  ta.value = b.text;
  const info = h('div', { class: 'hint', style: 'font-weight:bold' });
  const upd = () => { const n = b.text.split('\n').filter(x => x.trim()).length, pg = paginateW(w, b).length; info.textContent = `${n}行・${pg}ページ（いまの文字の大きさで）`; };
  ta.oninput = () => { shiftCues(b, b.text, ta.value); b.text = ta.value; markDirty(); upd(); };
  pin(L, ta, 12, 60, 812, 470);
  pin(L, info, 12, 540, 600, 30);
  body.appendChild(L);
  const R = h('div', { class: 'panel' }); R.style.cssText = 'left:872px;top:8px;width:392px;height:584px';
  pin(R, h('div', { class: 'p-h' }, ic('info'), '書き方'), 14, 10, 360, 32);
  const tips = ['空いた行を入れると、ページが変わります。', '1ページに4行まで入ります。長い文は、自動で次のページに続きます。',
    w.opts.name ? '【たろう】こんにちは と書くと、名前の欄に「たろう」が出ます。' : '名前の欄を使いたいときは「しあげ・送る」でオンにします。',
    '絵や音は「絵と音」で、行ごとにつけます。'];
  pin(R, h('div', { class: 'hint', style: 'color:var(--tx);font-size:17px' }, tips.map(t => h('div', { style: 'margin-bottom:12px;display:flex;gap:6px' }, h('span', { style: 'color:var(--pri-d)' }, '●'), h('span', null, t)))), 14, 52, 360, 380);
  pin(R, btn('next', '次は 絵と音をつける', () => goStep('fx'), 'pri'), 14, 520, 360, 52);
  body.appendChild(R);
  upd(); setTimeout(() => ta.focus(), 30);
}
function shiftCues(b, oldT, newT) {
  const a = oldT.split('\n'), n = newT.split('\n'); if (a.length === n.length) return;
  let p = 0; while (p < a.length && p < n.length && a[p] === n[p]) p++;
  let s = 0; while (s < a.length - p && s < n.length - p && a[a.length - 1 - s] === n[n.length - 1 - s]) s++;
  const d = n.length - a.length, out = {};
  for (const k in b.cues) {
    const i = +k;
    if (i < p) out[i] = b.cues[k];
    else if (i >= a.length - s) out[i + d] = b.cues[k];
    else if (i < n.length - s) out[i] = b.cues[k];
  }
  b.cues = out;
}
/* ---------- 素材ライブラリ（フォルダ） ---------- */
const EF_FOLDERS = { '@once': '一回だけ', '@tone': '色合い（続く）', '@weather': '天気（続く）' };
const PATH_NAME = k => EF_FOLDERS[k] ? EF_FOLDERS[k] : k === '@sample' ? 'サンプルデータ' : k === '@builtin' ? '内蔵の音' : k.startsWith('@c:') ? (SAMPLE_CHARS.find(c => c.c === k.slice(3)) || {}).name
  : k.startsWith('@cat:') ? ((E.libKind === 'se' ? SE_CATS : BGM_CATS)[+k.slice(5)] || [])[0] : k;
function libEntries(kind, path) {
  const w = E.w, user = w.media.filter(m => m.kind === kind);
  const item = (id, name, src, tag) => ({ type: 'item', id, name, src, tag });
  const folder = (key, name, count, thumb) => ({ type: 'folder', key, name, count, thumb });
  if (kind === 'ef') {
    if (!path.length) return [folder('@once', '一回だけ', EF_ONCE.length), folder('@tone', '色合い（続く）', EF_TONE.length), folder('@weather', '天気（続く）', EF_WEATHER.length)];
    if (path[0] === '@once') return EF_ONCE.map(x => ({ ...item('E:' + x[0], x[1], null), icon: x[2] }));
    if (path[0] === '@tone') return EF_TONE.map(x => ({ ...item('T:' + x[0], x[1], null), icon: x[0] === 'none' ? 'x' : 'palette' }));
    return EF_WEATHER.map(x => ({ ...item('W:' + x[0], x[1], null), icon: x[0] === 'none' ? 'x' : 'star' }));
  }
  const img = kind === 'bg' || kind === 'ch';
  if (!path.length) {
    const out = [];
    if (kind === 'bg') out.push(folder('@sample', 'サンプルデータ', SAMPLE_BG.length));
    if (kind === 'ch') out.push(folder('@sample', 'サンプルデータ', SAMPLE_CHARS.length));
    if (!img) out.push(folder('@builtin', '内蔵の音', kind === 'se' ? SE_LIST.length : BGM_LIST.length));
    for (const f of w.folders[kind]) out.push(folder(f, f, user.filter(m => m.folder === f).length));
    for (const m of user.filter(m => !m.folder)) out.push(item(m.id, m.name, img ? MEDIA[m.id] : null));
    return out;
  }
  const [k0, k1] = path;
  if (k0 === '@sample' && kind === 'bg') return SAMPLE_BG.map(x => item(x.id, x.name, x.data, 'サンプル'));
  if (k0 === '@sample' && kind === 'ch' && !k1) return SAMPLE_CHARS.map(c => { const f = SAMPLE_CH.filter(x => x.c === c.c); return folder('@c:' + c.c, c.name, f.length, f[0].data); });
  if (k0 === '@sample' && kind === 'ch') return SAMPLE_CH.filter(x => x.c === k1.slice(3)).map(x => item(x.id, x.pose, x.data, 'サンプル'));
  if (k0 === '@builtin' && !k1) return (kind === 'se' ? SE_CATS : BGM_CATS).map(([n, ids], i) => folder('@cat:' + i, n, ids.length));
  if (k0 === '@builtin') return ((kind === 'se' ? SE_CATS : BGM_CATS)[+k1.slice(5)] || [, []])[1].map(id => item(id, soundName(w, id), null, '内蔵'));
  return user.filter(m => m.folder === k0).map(m => item(m.id, m.name, img ? MEDIA[m.id] : null));
}
function libCard(en, kind, onOpen) {
  const isImg = kind === 'bg' || kind === 'ch';
  if (en.type === 'folder') {
    return h('div', { class: 'lcard folder', onclick: () => onOpen(en.key) },
      en.thumb ? h('img', { class: 'lc-img ch', src: en.thumb, draggable: 'false' }) : h('div', { class: 'lc-ic' }, ic('folder', 46)),
      h('div', { class: 'lc-n' }, en.name + '（' + en.count + '）'));
  }
  const el = h('div', { class: 'lcard' + (E.libSel === en.id ? ' sel' : ''), draggable: 'true', onclick: () => {
    E.libSel = en.id; E.guideMsg = null;
    if (kind === 'se') playSE(en.id);
    if (kind === 'bgm') { if (AU.bgmId === en.id) stopBGM(); else playBGM(en.id); }
    editorRefresh();
    if (kind === 'ef') setTimeout(() => previewEffect(en.id), 30);
  } },
    isImg ? h('img', { class: 'lc-img' + (kind === 'ch' ? ' ch' : ''), src: en.src || '', draggable: 'false' }) : h('div', { class: 'lc-ic' }, ic(en.icon || (kind === 'se' ? 'bell' : (AU.bgmId === en.id ? 'stop' : 'music')), 38)),
    h('div', { class: 'lc-n' }, en.name), en.tag ? h('div', { class: 'lc-tag' }, en.tag) : null);
  el.ondragstart = e => { E.libSel = en.id; e.dataTransfer.setData('text/nm-media', en.id); };
  return el;
}
/* ---------- 3 絵と音 ---------- */
function blockEntry(bid) { if (!E.entryCache[bid]) E.entryCache[bid] = entryVisFor(E.w, bid).vis; return E.entryCache[bid]; }
function visAtLine(li) { return visUntil(curB(), blockEntry(curB().id), li, true); }
function renderFx(body) {
  const w = E.w, b = curB();
  const pages2 = paginateW(w, b);
  const focus = E.li == null ? 1 : !E.libSel ? 2 : 3;
  const P1 = h('div', { class: 'panel' + (focus === 1 ? ' focus' : '') }); P1.style.cssText = 'left:16px;top:8px;width:400px;height:584px';
  pin(P1, h('div', { class: 'p-h' }, h('span', { class: 'n' }, '1'), '行をえらぶ'), 12, 10, 372, 32);
  pin(P1, blockNav(''), 12, 48, 372, 42);
  const lines = b.text.split('\n').map((t, li) => ({ t, li })).filter(x => x.t.trim());
  const lp = 8, lpages = Math.max(1, Math.ceil(lines.length / lp));
  E.linePage = clamp(E.linePage, 0, lpages - 1);
  lines.slice(E.linePage * lp, E.linePage * lp + lp).forEach((x, i) => {
    const c = b.cues[x.li] || {}, pg = pageOfLine(pages2, x.li) + 1;
    const tags = h('div', { class: 'ln-tags' }, c.bg ? ic('image') : null, c.ch ? ic('user') : null, c.se ? ic('bell') : null, c.bgm ? ic(c.bgm === 'stop' ? 'stop' : 'music') : null, (c.fx || c.ef || c.tone || c.weather) ? ic('zap') : null);
    const row = h('div', { class: 'ln' + (E.li === x.li ? ' sel' : ''), onclick: () => { E.li = x.li; E.evPage = 0; E.guideMsg = null; editorRefresh(); } },
      h('div', { class: 'ln-k' }, h('div', null, `${x.li + 1}行 p${pg}`), tags), h('div', { class: 'ln-t' }, x.t));
    row.ondragover = e => { e.preventDefault(); row.classList.add('over'); };
    row.ondragleave = () => row.classList.remove('over');
    row.ondrop = e => { e.preventDefault(); e.stopPropagation(); row.classList.remove('over'); dropToLine(x.li, e); };
    pin(P1, row, 12, 98 + i * 54, 372, 48);
  });
  if (!lines.length) pin(P1, h('div', { class: 'lib-empty' }, 'まだ文章がありません。', h('br'), '「文章を書く」で書いてから、ここに来てね。'), 12, 98, 372, 120);
  pin(P1, pager(E.linePage, lpages, p => { E.linePage = p; editorRefresh(); }), 12, 534, 372, 40);
  body.appendChild(P1);
  const P2 = h('div', { class: 'panel' + (focus === 2 ? ' focus' : '') }); P2.style.cssText = 'left:428px;top:8px;width:400px;height:584px';
  pin(P2, h('div', { class: 'p-h' }, h('span', { class: 'n' }, '2'), '入れるものをえらぶ'), 12, 10, 372, 32);
  const TW = { bg: 64, ch: 64, se: 76, bgm: 64, ef: 80 };
  const tabs = h('div', { class: 'kind-tabs' }, ['bg', 'ch', 'se', 'bgm', 'ef'].map(k => { const t = btn(null, KIND_NAME[k], () => { stopBGM(); E.libKind = k; E.libPath = []; E.libPage = 0; E.libSel = null; editorRefresh(); }, 'sm kt' + (E.libKind === k ? ' on' : '')); t.style.flex = 'none'; t.style.width = TW[k] + 'px'; return t; }));
  pin(P2, tabs, 12, 48, 372, 42);
  const fbar = h('div', { class: 'fbar' },
    E.libPath.length ? btn('folderup', '上へ', () => { E.libPath.pop(); E.libPage = 0; editorRefresh(); }, 'xs') : null,
    h('div', { class: 'fpath' }, ic('folder'), E.libPath.length ? E.libPath.map(PATH_NAME).join(' › ') : KIND_NAME[E.libKind] + 'のはじめ'),
    E.libKind === 'ef' ? null : btn('up', '追加', async () => addMediaFiles(await pickFiles(E.libKind === 'se' || E.libKind === 'bgm' ? 'audio/*' : 'image/*'), E.libKind), 'xs'),
    E.libKind === 'ef' ? null : btn('box', '整理', () => openManager(E.libKind), 'xs'));
  pin(P2, fbar, 12, 96, 372, 36);
  const items = libEntries(E.libKind, E.libPath), per = 6, pages = Math.max(1, Math.ceil(items.length / per));
  E.libPage = clamp(E.libPage, 0, pages - 1);
  const grid = pin(P2, h('div', null), 12, 138, 372, 330);
  items.slice(E.libPage * per, E.libPage * per + per).forEach((en, i) =>
    pin(grid, libCard(en, E.libKind, k => { E.libPath.push(k); E.libPage = 0; editorRefresh(); }), (i % 2) * 190, Math.floor(i / 2) * 112, 182, 104));
  if (!items.length) grid.appendChild(h('div', { class: 'lib-empty' }, 'このフォルダは空です。画像や音のファイルをここにドロップするか、「追加」で入れられます。'));
  grid.ondragover = e => e.preventDefault();
  grid.ondrop = e => { e.preventDefault(); e.stopPropagation(); addMediaFiles([...e.dataTransfer.files], E.libKind); };
  pin(P2, pager(E.libPage, pages, p => { E.libPage = p; editorRefresh(); }), 12, 474, 372, 40);
  const canPut = E.li != null && E.libSel && libKindOf(E.libSel) === E.libKind;
  const why = E.li == null ? '先に ① で行をえらんでください' : '先に、入れたいものをえらんでください';
  const needSlot = E.libKind === 'ch' || (E.libKind === 'ef' && /^E:(jump|shiver)$/.test(E.libSel || ''));
  if (needSlot) {
    const pos3 = h('div', { class: 'row', style: 'gap:4px' }, SLOT_NAME.map((n, s) => btn(null, n, () => { E.chSlot = s; editorRefresh(); }, 'sm' + (E.chSlot === s ? ' on' : ''))));
    $$('.btn', pos3).forEach(x => x.style.width = '58px');
    pin(P2, pos3, 12, 524, 182, 50);
    pin(P2, canPut ? btn('check', SLOT_NAME[E.chSlot] + 'に入れる', () => { assignToLine(E.li, E.libSel, E.libKind); guide(`${E.li + 1}行目の${SLOT_NAME[E.chSlot]}に「${mediaNameX(E.libSel)}」を入れました`); }, 'pri') : btnOff('check', SLOT_NAME[E.chSlot] + 'に入れる', why), 200, 524, 184, 50);
  } else {
    pin(P2, canPut ? btn('check', 'この行に入れる', () => { assignToLine(E.li, E.libSel, E.libKind); guide(`${E.li + 1}行目に「${mediaNameX(E.libSel)}」を入れました`); }, 'pri') : btnOff('check', 'この行に入れる', why), 12, 524, 372, 50);
  }
  body.appendChild(P2);
  renderFxCheck(body, b, pages2, focus === 3);
}
function mediaNameX(id) { return EF_NAME[id] || mediaName(E.w, id); }
function libKindOf(id) {
  if (!id) return null;
  if (/^[ETW]:/.test(id)) return 'ef';
  if (SE_MAP[id]) return 'se'; if (BGM_MAP[id]) return 'bgm';
  if (SAMPLE_MAP[id]) return id.startsWith('I:bg') ? 'bg' : 'ch';
  const m = E.w.media.find(x => x.id === id); return m ? m.kind : null;
}
function pager(page, pages, go) {
  const r = h('div', { class: 'pager2' },
    page > 0 ? btn('prev', '前へ', () => go(page - 1), 'sm') : btnOff('prev', '前へ', '最初のページです', 'sm'),
    h('div', { class: 'pg-n' }, `${page + 1} / ${pages}`),
    page < pages - 1 ? btn('next', '次へ', () => go(page + 1), 'sm') : btnOff('next', '次へ', '最後のページです', 'sm'));
  $$('.btn', r).forEach(b => b.style.width = '120px');
  return r;
}
function setCue(li, fn) {
  const b = curB(), c = b.cues[li] = b.cues[li] || {};
  fn(c);
  if (c.ch) { for (const s in c.ch) if (!c.ch[s]) delete c.ch[s]; if (!Object.keys(c.ch).length) delete c.ch; }
  for (const k of Object.keys(c)) if (c[k] == null || c[k] === 0 || (Array.isArray(c[k]) && !c[k].length)) delete c[k];
  if (!Object.keys(c).length) delete b.cues[li];
  markDirty(true); return true;
}
function placeCh(li, s, id) {
  const cur = visAtLine(li).ch[s];
  return setCue(li, c => { c.ch = c.ch || {}; c.ch[s] = { m: id, s: cur ? cur.s : 1, y: cur ? cur.y : 0 }; });
}
/* 行へ直接ドロップ（素材ボックスの中身でも、パソコンのファイルでも）。背景か人物かは今のタブで決める */
async function dropToLine(li, e) {
  if (li == null) { guide('先に ① で行をえらんでください', true); return; }
  let id = e.dataTransfer.getData('text/nm-media');
  if (!id) {
    const fs = [...e.dataTransfer.files]; if (!fs.length) return;
    id = (await addMediaFiles(fs.slice(0, 1), E.libKind, true))[0]; if (!id) return;
  }
  const kind = libKindOf(id); if (!kind) return;
  E.li = li;
  assignToLine(li, id, kind);
  guide(`${li + 1}行目${kind === 'ch' ? 'の' + SLOT_NAME[E.chSlot] : ''}に${KIND_NAME[kind]}「${mediaNameX(id)}」を入れました`);
}
function assignToLine(li, id, kind) {
  if (kind === 'bg') setCue(li, c => { c.bg = id; });
  else if (kind === 'ch') placeCh(li, E.chSlot, id);
  else if (kind === 'se') setCue(li, c => { c.se = id; });
  else if (kind === 'bgm') setCue(li, c => { c.bgm = id; });
  else if (kind === 'ef') setCue(li, c => {
    const [k, t] = id.split(':');
    if (k === 'T') c.tone = t;
    else if (k === 'W') c.weather = t;
    else if (t === 'flashW') c.fx = Math.min(5, (c.fx || 0) + 1);
    else c.ef = (c.ef || []).filter(e => e.t !== t).concat([/^(jump|shiver)$/.test(t) ? { t, s: E.chSlot } : { t }]);
  });
}
/* えらんだエフェクトを③のプレビューでためす */
function previewEffect(id) {
  const pv = $('.prev'); if (!pv) return;
  const [k, t] = id.split(':');
  if (k === 'T') { pv.querySelectorAll('img').forEach(i => i.style.filter = toneCss(t === 'none' ? null : t)); return; }
  if (k === 'W') { let l = pv.querySelector('.pv-w'); if (!l) { l = h('div', { class: 'pv-w', style: 'position:absolute;inset:0' }); pv.appendChild(l); } setWeather(l, t === 'none' ? null : t); return; }
  let ov = pv.querySelector('.pv-ov'); if (!ov) { ov = h('div', { class: 'pv-ov', style: 'position:absolute;inset:0;opacity:0;pointer-events:none' }); pv.appendChild(ov); }
  const a = (el, n, ms) => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = `${n} ${ms}ms ease-out`; };
  if (t === 'flashW' || t === 'flashR' || t === 'thunder') { ov.style.background = t === 'flashR' ? '#ff2a2a' : '#fff'; ov.style.animation = 'none'; void ov.offsetWidth; ov.style.animation = 'flash .24s ease-out 2'; }
  if (t === 'thunder') playSE('S:kaminari');
  if (t === 'shakeS' || t === 'shakeL' || t === 'thunder') a(pv, t === 'shakeS' ? 'shakeS' : 'shakeL', 600);
  if (t === 'black' || t === 'white') { ov.style.background = t === 'black' ? '#000' : '#fff'; a(ov, 'fadeio', 1500); }
  if (t === 'zoom') a(pv, 'zoomio', 900);
  if (t === 'jump' || t === 'shiver') { const im = pv.querySelectorAll('.chimg')[0]; if (im) a(im, t, 700); }
  if (t === 'confetti' || t === 'fireworks') burst(pv, t, 5000);
}
function renderFxCheck(body, b, pages2, focus) {
  const w = E.w, li = E.li;
  const P3 = h('div', { class: 'panel' + (focus ? ' focus' : '') }); P3.style.cssText = 'left:840px;top:8px;width:424px;height:584px';
  P3.ondragover = e => { e.preventDefault(); P3.classList.add('over'); };
  P3.ondragleave = e => { if (!P3.contains(e.relatedTarget)) P3.classList.remove('over'); };
  P3.ondrop = e => { e.preventDefault(); e.stopPropagation(); P3.classList.remove('over'); dropToLine(li, e); };
  pin(P3, h('div', { class: 'p-h' }, h('span', { class: 'n' }, '3'), 'たしかめる', h('span', { class: 'p-hint' }, ic('down', 16), 'ここにドロップで、この行に入る')), 12, 10, 396, 32);
  const pw = w.ratio === '4:3' ? 264 : 352, pv = pin(P3, h('div', { class: 'prev' }), 12 + (396 - pw) / 2, 46, pw, 198);
  const vis = li != null ? visAtLine(li) : blockEntry(b.id);
  if (vis.bg && mediaSrc(vis.bg)) pv.appendChild(h('img', { class: 'bgimg', src: mediaSrc(vis.bg) }));
  vis.ch.forEach((c, s) => { if (c && mediaSrc(c.m)) pv.appendChild(h('img', { class: 'chimg', src: mediaSrc(c.m), style: `left:${CH_X[s]}%;height:${86 * c.s}%;bottom:${c.y * 30 * 198 / 720}px` })); });
  if (vis.tone) pv.querySelectorAll('img').forEach(i => i.style.filter = toneCss(vis.tone));
  if (vis.weather) pv.appendChild(h('div', { class: 'ptag' }, '天気：' + EF_NAME['W:' + vis.weather]));
  if (li == null) { pin(P3, h('div', { class: 'lib-empty' }, '① で行をえらぶと、その行の画面と、その行でおきることが出ます。'), 12, 252, 396, 100); body.appendChild(P3); return; }
  pin(P3, h('div', { class: 'p-cap' }, `${li + 1}行目でおきること`, h('span', { style: 'font-size:13px;color:var(--pri-d);margin-left:6px' }, '（オレンジ＝この行）')), 12, 250, 396, 24);
  const list = pin(P3, h('div', null), 12, 276, 396, 252);
  const c = b.cues[li] || {}, nm = id => mediaName(w, id), rows = [];
  const ev = (k, v, here, ...bs) => rows.push(h('div', { class: 'ev' }, h('div', { class: 'ev-k' }, k), h('div', { class: 'ev-v' + (here ? ' here' : ''), title: v }, v), ...bs));
  const X = (lb, fn, cls = '') => btn(null, lb, fn, 'xs ' + cls);
  if (c.bg) ev('背景', c.bg === 'none' ? 'なし' : nm(c.bg), true, X('はずす', () => setCue(li, x => { delete x.bg; }), 'dng'));
  else if (vis.bg) ev('背景', nm(vis.bg) + '（前から）', false, X('なしにする', () => setCue(li, x => { x.bg = 'none'; })));
  else ev('背景', 'なし', false);
  for (let s = 0; s < 3; s++) {
    const cc = c.ch && c.ch[s], cur = vis.ch[s];
    const adj = fn => () => setCue(li, x => { x.ch = x.ch || {}; const v = x.ch[s] && x.ch[s].m !== 'none' ? x.ch[s] : { m: cur.m, s: cur.s, y: cur.y }; fn(v); x.ch[s] = v; });
    const tools = () => [X('小', adj(v => { v.s = Math.max(0.5, +(v.s - 0.1).toFixed(1)); })), X('大', adj(v => { v.s = Math.min(1.6, +(v.s + 0.1).toFixed(1)); })),
      X('上', adj(v => { v.y = Math.min(8, v.y + 1); })), X('下', adj(v => { v.y = Math.max(-8, v.y - 1); }))];
    if (cc && cc.m === 'none') ev('人物' + SLOT_NAME[s], '退場', true, X('はずす', () => setCue(li, x => { delete x.ch[s]; }), 'dng'));
    else if (cc) ev('人物' + SLOT_NAME[s], nm(cc.m), true, ...tools(), X('はずす', () => setCue(li, x => { delete x.ch[s]; }), 'dng'));
    else if (cur) ev('人物' + SLOT_NAME[s], nm(cur.m) + '（前から）', false, ...tools(), X('退場', () => setCue(li, x => { x.ch = x.ch || {}; x.ch[s] = { m: 'none' }; })));
  }
  if (c.se) ev('効果音', nm(c.se), true, X('▶', () => playSE(c.se)), X('はずす', () => setCue(li, x => { delete x.se; }), 'dng'));
  if (c.bgm) ev('BGM', c.bgm === 'stop' ? '止める' : nm(c.bgm), true, X('はずす', () => setCue(li, x => { delete x.bgm; }), 'dng'));
  else if (vis.bgm) ev('BGM', nm(vis.bgm) + '（前から）', false, X('止める', () => setCue(li, x => { x.bgm = 'stop'; })));
  ev('白く光る', c.fx ? c.fx + '回' : 'なし', !!c.fx,
    (c.fx || 0) > 0 ? X('−', () => setCue(li, x => { x.fx = (x.fx || 0) - 1 || null; })) : btnOff(null, '−', 'もう明滅しない設定です', 'xs'),
    (c.fx || 0) < 5 ? X('＋', () => setCue(li, x => { x.fx = (x.fx || 0) + 1; })) : btnOff(null, '＋', '明滅は5回までです', 'xs'));
  for (const e of c.ef || []) ev('エフェクト', EF_NAME['E:' + e.t] + (e.s != null ? `（${SLOT_NAME[e.s]}）` : ''), true, X('▶', () => previewEffect('E:' + e.t)), X('はずす', () => setCue(li, x => { x.ef = x.ef.filter(y => y.t !== e.t); }), 'dng'));
  if (c.tone) ev('色合い', EF_NAME['T:' + c.tone], true, X('はずす', () => setCue(li, x => { delete x.tone; }), 'dng'));
  else if (vis.tone) ev('色合い', EF_NAME['T:' + vis.tone] + '（前から）', false, X('解除', () => setCue(li, x => { x.tone = 'none'; })));
  if (c.weather) ev('天気', EF_NAME['W:' + c.weather], true, X('はずす', () => setCue(li, x => { delete x.weather; }), 'dng'));
  else if (vis.weather) ev('天気', EF_NAME['W:' + vis.weather] + '（前から）', false, X('解除', () => setCue(li, x => { x.weather = 'none'; })));
  const per = rows.length > 7 ? 6 : 7, pages = Math.ceil(rows.length / per);
  E.evPage = clamp(E.evPage || 0, 0, pages - 1);
  rows.slice(E.evPage * per, E.evPage * per + per).forEach(r => list.appendChild(r));
  if (pages > 1) list.appendChild(h('div', { class: 'ev-more' }, `${E.evPage + 1} / ${pages}`,
    E.evPage > 0 ? btn('prev', null, () => { E.evPage--; editorRefresh(); }, 'xs') : btnOff('prev', null, '最初のページです', 'xs'),
    E.evPage < pages - 1 ? btn('next', null, () => { E.evPage++; editorRefresh(); }, 'xs') : btnOff('next', null, '最後のページです', 'xs')));
  $$('.ev .btn, .ev-more .btn', list).forEach(x => { if (x.textContent.length <= 1) x.style.width = '34px'; });
  pin(P3, btn('play', 'この行から見る', async () => { stopBGM(); await flushSave(); playWork(w, { test: true, loadMedia: false, bid: b.id, li, onBack: backToEditor }); }, 'sm'), 12, 534, 396, 40);
  body.appendChild(P3);
}
/* ---------- 素材の追加・整理 ---------- */
async function addMediaFiles(files, kind, quiet) {
  const ids = [];
  const folder = E.libPath.length === 1 && !E.libPath[0].startsWith('@') ? E.libPath[0] : '';
  for (const f of files) {
    let k = kind, data;
    if (/^video\//.test(f.type)) { guide('動画は使えません', true); continue; }
    if (/^image\//.test(f.type)) {
      if (k !== 'bg' && k !== 'ch') k = 'bg';
      try { data = (await shrinkImage(await readAsDataURL(f), k)).data; } catch (e) { guide('画像を読みこめませんでした：' + f.name, true); continue; }
    } else if (/^audio\//.test(f.type) || /\.(mp3|wav|ogg|m4a)$/i.test(f.name)) {
      if (k !== 'se' && k !== 'bgm') k = 'se';
      if (f.size > 3 * 1048576) { guide('音のファイルは3MBまでです：' + f.name, true); continue; }
      data = await readAsDataURL(f);
    } else { guide('使えないファイルです：' + f.name, true); continue; }
    const id = uid(), name = f.name.replace(/\.[^.]+$/, '').slice(0, 20);
    await dbPut('media', { id, wid: E.w.id, data });
    MEDIA[id] = data; E.w.media.push({ id, kind: k, name, size: dataSize(data), folder: k === kind ? folder : '' }); ids.push(id);
    if (k === kind) E.libSel = id;
  }
  if (ids.length) { if (!quiet) guide(ids.length + 'この素材を追加しました'); markDirty(true); if ($('.dlg-mg')) drawManager(); }
  return ids;
}
function usageOf(id) {
  let n = 0; const w = E.w;
  for (const b of Object.values(w.blocks)) for (const li in b.cues) {
    const c = b.cues[li];
    if (c.bg === id || c.se === id || c.bgm === id) n++;
    if (c.ch) for (const s in c.ch) if (c.ch[s].m === id) n++;
  }
  if (w.titleImg === id) n++;
  return n;
}
async function removeMedia(ids) {
  const w = E.w, set = new Set(ids);
  for (const b of Object.values(w.blocks)) for (const li of Object.keys(b.cues)) {
    const c = b.cues[li];
    if (set.has(c.bg)) delete c.bg; if (set.has(c.se)) delete c.se; if (set.has(c.bgm)) delete c.bgm;
    if (c.ch) { for (const s in c.ch) if (set.has(c.ch[s].m)) delete c.ch[s]; if (!Object.keys(c.ch).length) delete c.ch; }
    if (!Object.keys(c).length) delete b.cues[li];
  }
  if (set.has(w.titleImg)) w.titleImg = null;
  w.media = w.media.filter(m => !set.has(m.id));
  for (const id of ids) { await dbDel('media', id); delete MEDIA[id]; delete AU.bufs[id]; }
  if (set.has(E.libSel)) E.libSel = null;
  markDirty(true);
}
/* 素材の整理（フォルダ分け） */
const MG = { kind: 'bg', folder: '', page: 0, sel: null, fpage: 0 };
function openManager(kind) {
  Object.assign(MG, { kind, folder: '', page: 0, sel: null, fpage: 0 });
  MG.modal = openModal(h('div', { class: 'dlg dlg-mg' }), { close: false });
  drawManager();
}
function drawManager() {
  const w = E.w, d = $('.dlg-mg'); if (!d) return;
  d.innerHTML = '';
  const close = () => { closeModal(MG.modal); editorRefresh(); };
  pin(d, h('div', { class: 'dlg-title' }, '素材の整理（自分で入れた素材）'), 24, 18, 700, 32);
  pin(d, btn('x', 'とじる', close, 'sm'), 1036, 14, 120, 42);
  pin(d, h('div', { class: 'kind-tabs' }, ['bg', 'ch', 'se', 'bgm'].map(k => btn(KIND_ICON[k], KIND_NAME[k], () => { Object.assign(MG, { kind: k, folder: '', page: 0, sel: null, fpage: 0 }); drawManager(); }, 'sm' + (MG.kind === k ? ' on' : '')))), 24, 64, 560, 42);
  const fl = ['', ...w.folders[MG.kind]], fper = 7, fpages = Math.max(1, Math.ceil(fl.length / fper));
  MG.fpage = clamp(MG.fpage, 0, fpages - 1);
  pin(d, h('div', { class: 'p-cap' }, 'フォルダ'), 24, 118, 260, 24);
  fl.slice(MG.fpage * fper, MG.fpage * fper + fper).forEach((f, i) => {
    const n = w.media.filter(m => m.kind === MG.kind && m.folder === f).length;
    const b = btn('folder', (f || 'フォルダなし') + '（' + n + '）', () => { MG.folder = f; MG.page = 0; MG.sel = null; drawManager(); }, 'sm' + (MG.folder === f ? ' on' : ''));
    b.style.justifyContent = 'flex-start';
    pin(d, b, 24, 146 + i * 48, 260, 42);
  });
  pin(d, pagerSmall(MG.fpage, fpages, p => { MG.fpage = p; drawManager(); }), 24, 498, 260, 40);
  pin(d, btn('plus', '新しいフォルダ', async () => {
    const n = await askText('新しいフォルダの名前'); if (!n) return;
    if (n.startsWith('@') || w.folders[MG.kind].includes(n)) { toast('その名前は使えません'); return; }
    w.folders[MG.kind].push(n); MG.folder = n; markDirty(); drawManager();
  }, 'sm'), 24, 546, 260, 42);
  const fsel = MG.folder;
  pin(d, fsel ? btn('pencil', '名前を変える', async () => {
    const n = await askText('フォルダの新しい名前', fsel); if (!n || n === fsel) return;
    if (n.startsWith('@') || w.folders[MG.kind].includes(n)) { toast('その名前は使えません'); return; }
    w.folders[MG.kind] = w.folders[MG.kind].map(x => x === fsel ? n : x);
    w.media.forEach(m => { if (m.kind === MG.kind && m.folder === fsel) m.folder = n; }); MG.folder = n; markDirty(); drawManager();
  }, 'xs') : btnOff('pencil', '名前を変える', '「フォルダなし」の名前は変えられません', 'xs'), 24, 596, 126, 34);
  pin(d, fsel ? btn('trash', '消す', async () => {
    if (!(await okAsk(`フォルダ「${fsel}」を消しますか？`, '中の素材は消えずに「フォルダなし」に移ります'))) return;
    w.folders[MG.kind] = w.folders[MG.kind].filter(x => x !== fsel);
    w.media.forEach(m => { if (m.kind === MG.kind && m.folder === fsel) m.folder = ''; }); MG.folder = ''; markDirty(); drawManager();
  }, 'xs dng') : btnOff('trash', '消す', '「フォルダなし」は消せません', 'xs'), 158, 596, 126, 34);
  const items = w.media.filter(m => m.kind === MG.kind && m.folder === MG.folder), per = 12, pages = Math.max(1, Math.ceil(items.length / per));
  MG.page = clamp(MG.page, 0, pages - 1);
  pin(d, h('div', { class: 'p-cap' }, (MG.folder || 'フォルダなし') + ' の素材'), 304, 118, 560, 24);
  const isImg = MG.kind === 'bg' || MG.kind === 'ch';
  items.slice(MG.page * per, MG.page * per + per).forEach((m, i) => {
    const el = h('div', { class: 'lcard' + (MG.sel === m.id ? ' sel' : ''), onclick: () => { MG.sel = m.id; drawManager(); } },
      isImg ? h('img', { class: 'lc-img' + (m.kind === 'ch' ? ' ch' : ''), src: MEDIA[m.id] || '' }) : h('div', { class: 'lc-ic' }, ic(KIND_ICON[m.kind], 36)),
      h('div', { class: 'lc-n' }, m.name));
    pin(d, el, 304 + (i % 4) * 142, 146 + Math.floor(i / 4) * 116, 134, 108);
  });
  if (!items.length) pin(d, h('div', { class: 'lib-empty' }, 'ここには素材がありません。「ファイルから追加」で入れられます（サンプルと内蔵の音は、整理しなくても使えます）。'), 304, 146, 560, 100);
  pin(d, pagerSmall(MG.page, pages, p => { MG.page = p; drawManager(); }), 304, 498, 560, 40);
  pin(d, btn('up', 'ファイルから追加', async () => {
    const fs = await pickFiles(isImg ? 'image/*' : 'audio/*'); const save = E.libPath; E.libPath = MG.folder ? [MG.folder] : [];
    await addMediaFiles(fs, MG.kind); E.libPath = save;
  }, 'sm'), 304, 546, 272, 42);
  pin(d, btn('trash', '使っていない素材を消す', async () => {
    const un = w.media.filter(m => !usageOf(m.id)).map(m => m.id);
    if (!un.length) { toast('使っていない素材はありません'); return; }
    if (await okAsk(`使っていない素材 ${un.length}こ を消しますか？`, 'もとにもどせません')) { await removeMedia(un); drawManager(); }
  }, 'sm dng'), 592, 546, 272, 42);
  const m = items.find(x => x.id === MG.sel);
  const R = pin(d, h('div', { class: 'panel', style: 'background:var(--bg)' }), 880, 118, 276, 470);
  if (!m) R.appendChild(h('div', { class: 'lib-empty' }, '素材をえらぶと、名前を変えたり、フォルダを移したり、消したりできます。'));
  else {
    pin(R, isImg ? h('img', { src: MEDIA[m.id], style: 'object-fit:contain;background:#fff;border-radius:8px' }) : h('div', { class: 'lc-ic', style: 'position:static;height:100%' }, ic(KIND_ICON[m.kind], 56)), 12, 12, 248, 140);
    pin(R, h('div', { class: 'p-cap' }, '名前'), 12, 160, 248, 22);
    const inp = h('input', { class: 'inp sm', maxlength: 20, value: m.name }); inp.oninput = () => { m.name = inp.value; markDirty(); };
    pin(R, inp, 12, 184, 248, 42);
    pin(R, h('div', { class: 'p-cap' }, 'フォルダを移す'), 12, 234, 248, 22);
    const s = h('select', { class: 'sel' }, ['', ...w.folders[MG.kind]].map(f => { const o = h('option', { value: f }, f || 'フォルダなし'); if (f === m.folder) o.selected = true; return o; }));
    s.onchange = () => { m.folder = s.value; markDirty(); drawManager(); };
    pin(R, s, 12, 258, 248, 40);
    pin(R, h('div', { class: 'hint' }, `${usageOf(m.id)}か所で使っています・${fmtSize(m.size || 0)}`), 12, 306, 248, 24);
    if (!isImg) pin(R, btn('play', '試聴', () => m.kind === 'se' ? playSE(m.id) : (AU.bgmId === m.id ? stopBGM() : playBGM(m.id)), 'sm'), 12, 340, 248, 42);
    pin(R, btn('trash', 'この素材を消す', async () => { if (await okAsk('「' + m.name + '」を消しますか？', '使っている行の指定も消えます')) { await removeMedia([m.id]); MG.sel = null; drawManager(); } }, 'sm dng'), 12, 412, 248, 42);
  }
}
function pagerSmall(page, pages, go) {
  const r = h('div', { class: 'pager2' },
    page > 0 ? btn('prev', null, () => go(page - 1), 'sm') : btnOff('prev', null, '最初のページです', 'sm'),
    h('div', { class: 'pg-n' }, `${page + 1} / ${pages}`),
    page < pages - 1 ? btn('next', null, () => go(page + 1), 'sm') : btnOff('next', null, '最後のページです', 'sm'));
  $$('.btn', r).forEach(b => b.style.width = '60px');
  return r;
}
/* ---------- 4 しあげ・送る ---------- */
const UI_COLORS = ['#1e3a7b', '#16224a', '#1f6b4a', '#9b2335', '#5b2a86', '#6b4423', '#2b2b2b', '#c2255c'];
const WIN_COLORS = ['#1e3a7b', '#0b1020', '#1f3b2f', '#3b1020', '#2e1a47', '#3a2a1a', '#ffffff', '#fff4e0'];
const TX_COLORS = ['#ffffff', '#fff6d8', '#cfe8ff', '#ffe066', '#ffc9dc', '#c3fae8', '#3a3a3a', '#1a1a1a'];
const THEMES = [
  ['こい青', { ui: '#1e3a7b', win: '#1e3a7b', tx: '#ffffff', ch: '#1e3a7b' }], ['よる', { ui: '#2b2b2b', win: '#0b1020', tx: '#ffffff', ch: '#16224a' }],
  ['もり', { ui: '#1f6b4a', win: '#1f3b2f', tx: '#fff6d8', ch: '#1f6b4a' }], ['さくら', { ui: '#c2255c', win: '#ffffff', tx: '#3a3a3a', ch: '#c2255c' }],
  ['ゆうやけ', { ui: '#9b2335', win: '#3b1020', tx: '#ffe066', ch: '#9b2335' }], ['ふしぎ', { ui: '#5b2a86', win: '#2e1a47', tx: '#cfe8ff', ch: '#5b2a86' }],
  ['こもれび', { ui: '#6b4423', win: '#fff4e0', tx: '#3a3a3a', ch: '#6b4423' }], ['ノート', { ui: '#16224a', win: '#ffffff', tx: '#1a1a1a', ch: '#1e3a7b' }]];
function renderWorkTab(body) {
  const w = E.w, th = w.theme;
  const row = (label, ...kids) => h('div', { class: 'wk-row', style: 'height:40px' }, h('div', { class: 'wk-l' }, label), ...kids);
  const opt = (cur, list, on) => list.map(([v, lb, off]) => off && cur !== v ? btnOff(null, lb, off, 'sm') : btn(cur === v ? 'check' : null, lb, () => { if (cur !== v) on(v); }, 'sm' + (cur === v ? ' on' : '')));
  const usedBranch = Object.values(w.blocks).some(b => b.end.type === 'choice' || b.end.type === 'cond' || b.slot > 0);
  const usedCond = Object.values(w.blocks).some(b => b.end.type === 'cond');
  const L = h('div', { class: 'panel' }); L.style.cssText = 'left:16px;top:8px;width:620px;height:584px';
  const ti = h('input', { class: 'inp sm', maxlength: 30, value: w.title, style: 'width:420px' }); ti.oninput = () => { w.title = ti.value; markDirty(); $('.g-work').textContent = '作品：' + (w.title || 'むだい'); };
  const au = h('input', { class: 'inp sm', maxlength: 16, value: w.author, style: 'width:420px' }); au.oninput = () => { w.author = au.value; markDirty(); };
  const bgs = [null, ...SAMPLE_BG.map(x => x.id), ...w.media.filter(m => m.kind === 'bg').map(m => m.id)], ti2 = Math.max(0, bgs.indexOf(w.titleImg));
  const col = h('div', null,
    h('div', { class: 'p-h' }, '作品のじょうほう'),
    row('タイトル', ti), row('作者名', au),
    row('改造', ...opt(w.editable, [[true, 'OK'], [false, 'だめ']], v => { w.editable = v; markDirty(true); })),
    h('div', { class: 'p-h', style: 'margin-top:2px' }, 'しくみ'),
    row('シナリオ', ...opt(w.opts.long, [[true, '長い'], [false, '1話完結', Object.keys(w.blocks).length > 1 ? 'ブロックが2つ以上あるので、1話完結にはできません' : null]], v => { w.opts.long = v; if (!v) { w.opts.branch = false; w.opts.flag = false; } markDirty(true); })),
    row('分岐', ...opt(w.opts.branch, [[true, 'する', w.opts.long ? null : '1話完結では分岐できません'], [false, 'しない', usedBranch ? '選択肢・条件・2つ目のブロックを使っているので「しない」にできません' : null]], v => { w.opts.branch = v; if (!v) w.opts.flag = false; markDirty(true); })),
    row('イベントフラグ', ...opt(w.opts.flag, [[true, '使う', w.opts.branch ? null : '分岐を「する」にすると使えます'], [false, '使わない', usedCond ? '条件を使っているので「使わない」にできません' : null]], v => { w.opts.flag = v; markDirty(true); })),
    row('文章の出し方', ...opt(w.opts.mode, [['window', 'ウインドウ'], ['novel', 'サウンドノベル']], v => { w.opts.mode = v; markDirty(true); })),
    row('名前の欄', ...opt(w.opts.name, [[true, 'オン', w.opts.mode === 'novel' ? 'サウンドノベルタイプでは名前の欄は使いません' : null], [false, 'オフ']], v => { w.opts.name = v; markDirty(true); })),
    row('タイトル画面', ...opt(w.opts.title, [[true, 'つける'], [false, 'つけない']], v => { w.opts.title = v; markDirty(true); })),
    row('タイトルの絵', btn('prev', null, () => { w.titleImg = bgs[(ti2 - 1 + bgs.length) % bgs.length]; markDirty(true); }, 'sm'),
      h('div', { class: 'wk-val' }, w.titleImg ? mediaName(w, w.titleImg) : 'なし'),
      btn('next', null, () => { w.titleImg = bgs[(ti2 + 1) % bgs.length]; markDirty(true); }, 'sm')),
    row('画面の形', ...opt(w.ratio, [['16:9', '16:9'], ['4:3', '4:3']], v => { w.ratio = v; markDirty(true); })),
    row('エンディング一覧', ...opt(w.opts.endList !== false, [[true, '見せる'], [false, '見せない']], v => { w.opts.endList = v; markDirty(true); })));
  $$('.wk-row .btn', col).forEach(b => { b.style.width = b.textContent ? '160px' : '50px'; });
  pin(L, col, 14, 8, 590, 570);
  body.appendChild(L);
  // 右上：見た目
  const R1 = h('div', { class: 'panel' }); R1.style.cssText = 'left:648px;top:8px;width:616px;height:474px';
  const setT = (k, v) => { th[k] = v; markDirty(true); };
  const sw = (cur, list, on) => h('div', { class: 'sw-row' }, list.map(c => h('button', { class: 'sw' + (cur === c ? ' on' : ''), style: `background:${c}`, onclick: () => on(c) })), colorInp(cur, on));
  pin(R1, h('div', { class: 'p-h' }, '見た目（読む画面の色）'), 14, 8, 580, 32);
  pin(R1, row('テーマ', h('div', { class: 'sw-row' }, THEMES.map(([n, t]) => h('button', { class: 'theme-chip' + (th.ui === t.ui && th.win === t.win && th.tx === t.tx && th.ch === t.ch ? ' on' : ''), title: n,
    onclick: () => { Object.assign(th, t); markDirty(true); } }, h('span', { style: `background:${t.ui}` }), h('span', { style: `background:${t.win}` }), h('span', { style: `background:${t.tx}` }))))), 14, 42, 580, 46);
  pin(R1, row('ボタンの色', sw(th.ui, UI_COLORS, v => setT('ui', v))), 14, 88, 580, 46);
  pin(R1, row('ウインドウの色', sw(th.win, WIN_COLORS, v => setT('win', v))), 14, 134, 580, 46);
  pin(R1, row('文字の色', sw(th.tx, TX_COLORS, v => setT('tx', v))), 14, 180, 580, 46);
  pin(R1, row('選択肢の色', sw(th.ch, UI_COLORS, v => setT('ch', v))), 14, 226, 580, 46);
  const al = row('透明度', ...ALPHA_NAMES.map((n, i) => btn(th.alpha === i ? 'check' : null, n, () => setT('alpha', i), 'sm' + (th.alpha === i ? ' on' : ''))));
  $$('.btn', al).forEach(b => b.style.width = '104px');
  pin(R1, al, 14, 272, 580, 46);
  const fr = row('文字の形', ...Object.entries(FONTS).map(([k, [n, fam]]) => { const b = btn((th.font || 'kyokasho') === k ? 'check' : null, n, () => setT('font', k), 'sm' + ((th.font || 'kyokasho') === k ? ' on' : '')); b.style.fontFamily = fam; return b; }));
  $$('.btn', fr).forEach(b => b.style.width = '104px');
  pin(R1, fr, 14, 318, 580, 46);
  const pv = h('div', { class: 'wk-prev', style: 'width:580px;height:96px;padding:10px;display:flex;gap:10px;align-items:center' },
    h('div', { class: 'wk-pw', style: 'flex:1;height:74px' }, 'これは見本の文章です。', h('br'), '色や文字の形が反映されます。'),
    h('div', { style: 'display:flex;flex-direction:column;gap:6px;width:150px' },
      h('div', { style: 'height:34px;border-radius:8px;background:var(--wch);border:2px solid var(--wch-l);color:var(--wtx);display:flex;align-items:center;justify-content:center;font-family:var(--pfont);font-size:16px' }, '選択肢'),
      h('div', { style: 'height:34px;border-radius:8px;background:var(--wui);border:2px solid var(--wui-l);color:var(--wtx);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:bold' }, 'ボタン')));
  pv.style.backgroundImage = `url(${SAMPLE_BG[6].data})`; pv.style.backgroundSize = 'cover'; pv.style.backgroundPosition = 'center';
  themeVars(pv, th);
  pin(R1, pv, 14, 366, 580, 96);
  body.appendChild(R1);
  // 右下：送る
  const R2 = h('div', { class: 'panel focus' }); R2.style.cssText = 'left:648px;top:492px;width:616px;height:100px';
  if (!E.chk) E.chk = analyze(w);
  pin(R2, h('div', { class: 'p-h' }, h('span', { class: 'n' }, ic('down', 18)), '友だちに送る'), 14, 6, 300, 32);
  pin(R2, h('div', { class: 'bp-iss' + (E.chk.count ? ' bad' : '') }, ic(E.chk.count ? 'warn' : 'check'),
    E.chk.count ? `問題が ${E.chk.count} こ（送ることはできます）` : 'お話のつながりは大丈夫です'), 14, 44, 330, 24);
  if (E.chk.count && w.opts.long) pin(R2, btn('map', 'マップ', () => goStep('map'), 'xs'), 14, 68, 100, 26);
  pin(R2, btn('down', '作品ファイルを書き出す', async () => { await flushSave(); exportWork(w); }, 'pri'), 354, 14, 244, 68);
  body.appendChild(R2);
}
function colorInp(val, on) {
  const i = h('input', { type: 'color', class: 'cpick', value: val, title: '自由に色をえらぶ' });
  i.onchange = () => on(i.value); return i;
}
/* 作る画面へのファイルのドロップ */
document.addEventListener('drop', e => {
  if (!$('#scr-edit').classList.contains('show') || !e.dataTransfer || !e.dataTransfer.files.length) return;
  const fs = [...e.dataTransfer.files];
  const kind = E.tab === 'fx' ? E.libKind : (/^audio\//.test(fs[0].type) ? 'se' : 'bg');
  addMediaFiles(fs, kind);
});
