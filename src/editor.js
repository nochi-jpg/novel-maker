/* ===== 作る（エディタ） ===== */
const E = { w: null, tab: 'map', bid: null, mapPage: 0, pick: null, li: null, linePage: 0, libKind: 'bg', libPage: 0, libSel: null, chSlot: 1, medKind: 'bg', medPage: 0, medSel: null, chk: null, entryCache: {} };
const KIND_NAME = { bg: '背景', ch: '人物', se: '効果音', bgm: 'BGM' };
const KIND_ICON = { bg: 'image', ch: 'user', se: 'bell', bgm: 'music' };
function pos(el, x, y, w, hh) { el.style.left = x + 'px'; el.style.top = y + 'px'; if (w != null) el.style.width = w + 'px'; if (hh != null) el.style.height = hh + 'px'; el.classList.add('abs'); return el; }
async function openEditor(w) {
  E.w = w; E.pick = null; E.li = null; E.linePage = 0; E.libSel = null; E.medSel = null; E.mapPage = 0;
  await loadMediaFor(w);
  E.bid = startBlock(w).id;
  E.tab = w.opts.long ? 'map' : 'text';
  setStageW(1280);
  showScreen('edit');
  APP.key = editorKey;
  editorRefresh();
}
function editorKey(e) {
  if ($('.modal')) return;
  if (e.key === 'Escape' && E.pick) { E.pick = null; editorRefresh(); }
}
let _dirtyT = 0;
function markDirty(redraw) {
  E.chk = null; E.entryCache = {};
  clearTimeout(_dirtyT); _dirtyT = setTimeout(() => saveWork(E.w), 800);
  if (redraw) editorRefresh();
}
async function flushSave() { clearTimeout(_dirtyT); await saveWork(E.w); }
const curB = () => E.w.blocks[E.bid] || startBlock(E.w);
function editorRefresh() {
  const s = $('#scr-edit'); s.innerHTML = '';
  if (!E.w.blocks[E.bid]) E.bid = startBlock(E.w).id;
  // 上のバー
  s.appendChild(btn('back', 'もどる', async () => { stopBGM(); await flushSave(); gotoSelect('make', APP.page); }, 'tl'));
  const tabs = [['map', 'マップ', 'map'], ['text', '本文', 'text'], ['fx', '演出', 'wand'], ['media', '素材', 'box'], ['work', '作品', 'sliders']].filter(t => t[0] !== 'map' || E.w.opts.long);
  const tw = 140, x0 = 160;
  tabs.forEach(([k, lb, icn], i) => s.appendChild(pos(btn(icn, lb, () => { stopBGM(); E.pick = null; E.tab = k; editorRefresh(); }, 'tab' + (E.tab === k ? ' on' : '')), x0 + i * (tw + 8), 14, tw, 52)));
  s.appendChild(pos(btn('play', 'ためす', async () => { await flushSave(); playWork(E.w, { test: true, loadMedia: false, onBack: () => { showScreen('edit'); APP.key = editorKey; editorRefresh(); } }); }), 1000, 14, 120, 52));
  s.appendChild(btn('gear', '設定', () => openSettings(), 'tr'));
  const body = h('div', { class: 'ed-body' }); s.appendChild(body);
  ({ map: renderMap, text: renderText, fx: renderFx, media: renderMedia, work: renderWorkTab })[E.tab](body);
}
/* ---------- マップ ---------- */
const MAP = { colW: 170, gap: 60, cardH: 150, rowGap: 18, x0: 20, y0: 96, per: 4 };
function slotsOf(ep) { return ep === 1 ? 1 : (E.w.opts.branch ? 3 : 1); }
function cardXY(ep, slot) {
  const col = (ep - 1) % MAP.per;
  return [MAP.x0 + col * (MAP.colW + MAP.gap), MAP.y0 + 44 + slot * (MAP.cardH + MAP.rowGap)];
}
function renderMap(body) {
  const w = E.w;
  if (!E.chk) E.chk = analyze(w);
  const chk = E.chk, totalEp = maxEp(w) + 1, pages = Math.ceil(totalEp / MAP.per);
  E.mapPage = clamp(E.mapPage, 0, pages - 1);
  const ep0 = E.mapPage * MAP.per + 1, eps = [];
  for (let e = ep0; e < ep0 + MAP.per; e++) eps.push(e);
  const onPage = b => b.ep >= ep0 && b.ep < ep0 + MAP.per;
  // 線
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'map-svg'); svg.setAttribute('width', 1280); svg.setAttribute('height', 720);
  svg.innerHTML = '<defs>' + ['#ffd257', '#74c0fc', '#8ce99a', '#ffffff', '#ffa94d', '#adb5bd'].map((c, i) => `<marker id="ar${i}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('') + '</defs>';
  const COL = { A: 0, B: 1, C: 2, next: 3, rule: 4, else: 5 }, COLS = ['#ffd257', '#74c0fc', '#8ce99a', '#ffffff', '#ffa94d', '#adb5bd'];
  let paths = '';
  for (const b of Object.values(w.blocks)) {
    if (!onPage(b)) continue;
    const [x, y] = cardXY(b.ep, b.slot), ex = exitsOf(b).filter(e => e.to && w.blocks[e.to]);
    ex.forEach((e, i) => {
      const ci = e.kind === 'choice' ? COL[CHOICE_ABC[e.choice]] : COL[e.kind];
      const sx = x + MAP.colW, sy = y + MAP.cardH / 2 + (i - (ex.length - 1) / 2) * 22;
      const t = w.blocks[e.to], dash = (e.kind === 'rule' || e.kind === 'else') ? 'stroke-dasharray="7 5"' : '';
      const label = e.kind === 'choice' ? CHOICE_ABC[e.choice] : e.kind === 'rule' ? String(e.rule + 1) : e.kind === 'else' ? '他' : '';
      if (onPage(t)) {
        const [tx, ty] = cardXY(t.ep, t.slot);
        let d;
        if (t.ep > b.ep) { const ey = ty + MAP.cardH / 2; d = `M${sx} ${sy} C${sx + 40} ${sy},${tx - 40} ${ey},${tx} ${ey}`; }
        else { const cx = tx + MAP.colW / 2; d = `M${sx} ${sy} C${sx + 50} ${sy},${sx + 50} ${Math.min(sy, ty) - 70},${(sx + cx) / 2} ${Math.min(sy, ty) - 70} S${cx} ${ty - 40},${cx} ${ty}`; }
        paths += `<path d="${d}" fill="none" stroke="${COLS[ci]}" stroke-width="3" ${dash} marker-end="url(#ar${ci})"/>`;
      } else {
        paths += `<path d="M${sx} ${sy} L${sx + 26} ${sy}" stroke="${COLS[ci]}" stroke-width="3" ${dash} marker-end="url(#ar${ci})"/>`;
        paths += `<text x="${sx + 30}" y="${sy + 5}" fill="${COLS[ci]}" font-size="14" class="svgt">${blockLabel(w, t)}</text>`;
      }
      if (label) paths += `<text x="${sx + 4}" y="${sy - 5}" fill="${COLS[ci]}" font-size="13" font-weight="bold" class="svgt">${label}</text>`;
    });
  }
  svg.innerHTML += paths;
  body.appendChild(svg);
  // 列とカード
  for (const ep of eps) {
    const [cx] = cardXY(ep, 0);
    body.appendChild(pos(h('div', { class: 'ep-head' + (ep > totalEp ? ' dim' : '') }, 'エピソード ' + ep), cx, MAP.y0, MAP.colW, 36));
    if (ep > totalEp) continue;
    for (let sl = 0; sl < slotsOf(ep); sl++) {
      const b = blockAt(w, ep, sl), [x, y] = cardXY(ep, sl);
      if (b) body.appendChild(pos(blockCard(b, chk), x, y, MAP.colW, MAP.cardH));
      else {
        const can = ep > 1 || !Object.keys(w.blocks).length;
        const em = h('button', { class: 'card-empty' + (E.pick ? ' pickable' : ''), onclick: () => addBlock(ep, sl) }, ic('plus', 28), h('div', null, E.pick ? 'ここに作ってつなぐ' : 'ブロックを作る'));
        if (!can) em.disabled = true;
        body.appendChild(pos(em, x, y, MAP.colW, MAP.cardH));
      }
    }
  }
  // 下の段
  const bar = h('div', { class: 'map-bar' });
  if (E.pick) bar.append(h('div', { class: 'pick-msg' }, ic('link'), '行き先のブロックをクリックしてください'), btn('x', 'やめる', () => { E.pick = null; editorRefresh(); }, 'sm'));
  else {
    bar.append(btn('prev', '前へ', () => { E.mapPage--; editorRefresh(); }, 'sm' + (E.mapPage > 0 ? '' : ' dis')),
      h('div', { class: 'pg-n sm' }, `${E.mapPage + 1} / ${pages}`),
      btn('next', '次へ', () => { E.mapPage++; editorRefresh(); }, 'sm' + (E.mapPage < pages - 1 ? '' : ' dis')),
      h('div', { class: 'chk-sum' + (chk.count ? ' bad' : '') }, chk.count ? ic('warn') : ic('check'), chk.limited ? 'ルートが多すぎて全部はチェックできません' : chk.count ? `問題が ${chk.count} こあります（アイコンをクリック）` : '問題はありません'));
  }
  body.appendChild(pos(bar, 20, 646, 860, 52));
  $$('.dis', bar).forEach(b => b.disabled = true);
  body.appendChild(pos(blockPanel(), 900, 90, 360, 616));
}
function endSummary(b) {
  const e = b.end, w = E.w, lb = id => id && w.blocks[id] ? blockLabel(w, w.blocks[id]) : '？';
  if (e.type === 'next') return ['arrow', '次へ ' + lb(e.to)];
  if (e.type === 'choice') return ['branch', `選択肢 ${e.choices.length}つ`];
  if (e.type === 'cond') return ['cond', `条件 ${e.rules.length}つ`];
  return ['end', e.name || 'おわり'];
}
function blockCard(b, chk) {
  const w = E.w, iss = chk.issues[b.id] || [], [ei, et] = endSummary(b);
  const types = [...new Set(iss.map(x => x.type))];
  const card = h('div', { class: 'bcard' + (b.id === E.bid ? ' sel' : '') + (E.pick ? (E.pick.from === b.id ? ' nopick' : ' pickable') : ''), onclick: () => {
    if (E.pick) { if (E.pick.from === b.id) { toast('自分自身にはつなげません'); return; } E.pick.set(b.id); E.pick = null; markDirty(true); return; }
    E.bid = b.id; editorRefresh();
  } },
    h('div', { class: 'bc-top' }, h('div', { class: 'bc-l' }, blockLabel(w, b)),
      h('div', { class: 'bc-iss' }, types.slice(0, 4).map(t => h('button', { class: 'iss', style: `color:${ISSUE[t].color}`, title: ISSUE[t].name, onclick: e => {
        e.stopPropagation(); toast(ISSUE[t].name + '：' + iss.filter(x => x.type === t).map(x => x.msg).join('／'), 4200);
      } }, ic(ISSUE[t].icon))))),
    h('div', { class: 'bc-txt' }, b.text.trim() ? b.text.replace(/\n+/g, ' ').slice(0, 40) : '（本文なし）'),
    h('div', { class: 'bc-end' }, ic(ei), h('span', null, et)));
  return card;
}
function addBlock(ep, slot) {
  const w = E.w;
  if (blockAt(w, ep, slot)) return;
  const b = newBlock(ep, slot); w.blocks[b.id] = b;
  if (E.pick) { E.pick.set(b.id); E.pick = null; }
  else if (!w.opts.branch) { // 分岐しないときは前のエピソードと自動でつなぐ
    const p = blockAt(w, ep - 1, 0);
    if (p && (p.end.type === 'end' || (p.end.type === 'next' && !p.end.to)) && !p.end.name) { p.end.type = 'next'; p.end.to = b.id; }
  }
  E.bid = b.id; markDirty(true);
}
async function removeBlock(b) {
  const w = E.w;
  if (b.ep === 1) { toast('最初のブロックは消せません'); return; }
  if (!(await okAsk(`ブロック ${blockLabel(w, b)} を消しますか？`, '本文と演出も消えます。もとにもどせません'))) return;
  delete w.blocks[b.id];
  for (const x of Object.values(w.blocks)) {
    const e = x.end;
    if (e.to === b.id) e.to = null; if (e.else === b.id) e.else = null;
    e.choices.forEach(c => { if (c.to === b.id) c.to = null; });
    e.rules.forEach(r => { if (r.to === b.id) r.to = null; r.groups = r.groups.map(g => g.filter(a => a.b !== b.id)); });
  }
  E.bid = startBlock(w).id; markDirty(true);
}
function targetBtn(cur, set, wdt) {
  const w = E.w, b = cur && w.blocks[cur];
  const bt = btn(b ? 'arrow' : 'link', b ? blockLabel(w, b) : 'えらぶ', () => { E.pick = { from: E.bid, set }; editorRefresh(); }, 'sm tgt' + (b ? '' : ' none'));
  bt.style.width = (wdt || 120) + 'px';
  return bt;
}
function blockPanel() {
  const w = E.w, b = curB(), e = b.end, p = h('div', { class: 'panel bpanel' });
  p.append(h('div', { class: 'bp-head' }, h('div', { class: 'bp-l' }, 'ブロック ' + blockLabel(w, b)),
    b.ep > 1 ? btn('trash', '消す', () => removeBlock(b), 'sm') : null));
  p.append(h('div', { class: 'bp-row' }, btn('text', '本文を書く', () => { E.tab = 'text'; editorRefresh(); }, 'sm w160'), btn('wand', '演出', () => { E.tab = 'fx'; editorRefresh(); }, 'sm w160')));
  p.append(h('div', { class: 'bp-cap' }, 'このブロックのおわり方'));
  const types = [['next', '次へ', 'arrow', true], ['choice', '選択肢', 'branch', w.opts.branch], ['cond', '条件', 'cond', w.opts.flag], ['end', 'おわり', 'end', true]];
  const grid = h('div', { class: 'bp-grid' });
  types.forEach(([t, lb, icn, ok]) => {
    const bt = btn(icn, lb, () => { if (t === 'cond' && !e.rules.length) e.rules.push({ groups: [[]], to: null }); e.type = t; markDirty(true); }, 'sm opt w160' + (e.type === t ? ' on' : ''));
    if (!ok) bt.disabled = true; grid.appendChild(bt);
  });
  p.append(grid);
  const d = h('div', { class: 'bp-detail' }); p.append(d);
  if (e.type === 'next') d.append(h('div', { class: 'bp-line' }, h('div', { class: 'bp-k' }, '行き先'), targetBtn(e.to, id => { e.to = id; }, 200)));
  if (e.type === 'choice') {
    d.append(h('div', { class: 'bp-line' }, h('div', { class: 'bp-k' }, '選択肢の数'),
      [2, 3].map(n => btn(null, n + 'つ', () => { while (e.choices.length < n) e.choices.push({ label: '', to: null }); e.choices.length = n; markDirty(true); }, 'sm opt w96' + (e.choices.length === n ? ' on' : '')))));
    e.choices.forEach((c, i) => {
      const inp = h('input', { class: 'inp sm', maxlength: 24, value: c.label, placeholder: '選択肢' + CHOICE_ABC[i] + 'の文字' });
      inp.oninput = () => { c.label = inp.value; markDirty(); };
      d.append(h('div', { class: 'bp-line' }, h('div', { class: 'bp-k abc c' + i }, CHOICE_ABC[i]), inp, targetBtn(c.to, id => { c.to = id; }, 96)));
    });
  }
  if (e.type === 'cond') {
    e.rules.forEach((r, i) => {
      d.append(h('div', { class: 'bp-rule' },
        h('button', { class: 'rule-txt', onclick: () => editRule(b, i) }, h('b', null, '条件' + (i + 1) + '　'), ruleText(w, r)),
        targetBtn(r.to, id => { r.to = id; }, 96)));
    });
    const add = btn('plus', '条件をふやす', () => { e.rules.push({ groups: [[]], to: null }); markDirty(true); editRule(b, e.rules.length - 1); }, 'sm'); add.style.width = '328px';
    if (e.rules.length >= 3) add.disabled = true;
    d.append(h('div', { class: 'bp-line' }, add));
    d.append(h('div', { class: 'bp-line' }, h('div', { class: 'bp-k wide' }, 'どれにも当てはまらないとき'), targetBtn(e.else, id => { e.else = id; }, 96)));
  }
  if (e.type === 'end') {
    const inp = h('input', { class: 'inp sm', maxlength: 16, value: e.name, placeholder: '例：グッドエンド（なくてもOK）' });
    inp.oninput = () => { e.name = inp.value; markDirty(); };
    d.append(h('div', { class: 'bp-cap' }, 'エンディングの名前'), h('div', { class: 'bp-line' }, inp));
  }
  const iss = (E.chk && E.chk.issues[b.id]) || [];
  p.append(h('div', { class: 'bp-iss' + (iss.length ? ' bad' : '') }, iss.length ? [ic(ISSUE[iss[0].type].icon), iss[0].msg + (iss.length > 1 ? `（ほか${iss.length - 1}こ）` : '')] : [ic('check'), 'このブロックに問題はありません']));
  return p;
}
/* 条件の編集 */
function editRule(b, ri) {
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
        r.groups.length > 1 ? btn('x', null, () => { r.groups.splice(gi, 1); draw(); }, 'xs') : null));
      g.forEach((a, ai) => {
        if (ai > 0) col.appendChild(h('div', { class: 'and-lab' }, 'かつ'));
        const isC = a.t === 'chose' || a.t === 'notchose';
        const bl = (isC ? chBlocks : blocks).map(x => [x.id, 'ブロック ' + blockLabel(w, x)]);
        if (!bl.length) bl.push(['', '（選択肢のブロックがない）']);
        if (!bl.some(x => x[0] === a.b)) a.b = bl[0][0];
        const tb = w.blocks[a.b];
        const cl = tb ? tb.end.choices.map((c, i) => [String(i), CHOICE_ABC[i] + (c.label ? '：' + c.label : '')]) : [['0', 'A']];
        col.appendChild(h('div', { class: 'atom' },
          h('div', { class: 'atom-r' }, sel(KINDS, a.t, v => { a.t = v; draw(); }, 250), btn('x', null, () => { g.splice(ai, 1); draw(); }, 'xs')),
          h('div', { class: 'atom-r' }, sel(bl, a.b, v => { a.b = v; a.c = 0; draw(); }, isC ? 140 : 296), isC ? sel(cl, String(a.c || 0), v => { a.c = +v; }, 150) : null)));
      });
      const add = btn('plus', 'かつ', () => { g.push({ t: chBlocks.length ? 'chose' : 'pass', b: (chBlocks[0] || blocks[0]).id, c: 0 }); draw(); }, 'sm w160');
      if (g.length >= 3) add.disabled = true;
      col.appendChild(add);
      cols.appendChild(col);
    });
    if (r.groups.length < 3) cols.appendChild(h('div', { class: 'or-add' }, btn('plus', 'または', () => { r.groups.push([]); draw(); }, 'sm w160')));
  }
  draw();
  m = openModal(h('div', { class: 'dlg dlg-rule' },
    h('div', { class: 'dlg-title' }, `ブロック ${blockLabel(w, b)} の 条件${ri + 1}：当てはまったら → ${r.to && w.blocks[r.to] ? blockLabel(w, w.blocks[r.to]) : '（行き先はマップでえらぶ）'}`),
    cols,
    h('div', { class: 'dlg-btns' },
      btn('check', 'OK', () => { r.groups = r.groups.filter(g => g.length || r.groups.length === 1); b.end.rules[ri] = r; closeModal(m); markDirty(true); }),
      btn('trash', 'この条件を消す', async () => { closeModal(m); b.end.rules.splice(ri, 1); if (!b.end.rules.length) b.end.type = 'end'; markDirty(true); }),
      btn('x', 'やめる', () => closeModal(m)))));
}
/* ---------- ブロックの切りかえ ---------- */
function blockNav(x, y, wdt) {
  const w = E.w, list = blocksSorted(w), i = list.findIndex(b => b.id === E.bid);
  const box = h('div', { class: 'bnav' },
    btn('prev', null, () => { E.bid = list[i - 1].id; E.li = null; E.linePage = 0; editorRefresh(); }, 'sm sq' + (i > 0 ? '' : ' dis')),
    h('div', { class: 'bnav-l' }, w.opts.long ? 'ブロック ' + blockLabel(w, curB()) : '本文'),
    btn('next', null, () => { E.bid = list[i + 1].id; E.li = null; E.linePage = 0; editorRefresh(); }, 'sm sq' + (i < list.length - 1 ? '' : ' dis')));
  $$('.dis', box).forEach(b => b.disabled = true);
  return pos(box, x, y, wdt, 44);
}
/* ---------- 本文 ---------- */
function renderText(body) {
  const w = E.w, b = curB();
  body.appendChild(blockNav(20, 96, 360));
  body.appendChild(pos(h('div', { class: 'hint' }, '空いた行でページが変わります。' + (w.opts.name ? '名前は【たろう】こんにちは のように書きます。' : '')), 400, 96, 860, 44));
  const ta = h('textarea', { class: 'ta', spellcheck: 'false', placeholder: 'ここにお話を書いたり、はりつけたりします。' });
  ta.value = b.text;
  const info = h('div', { class: 'hint' });
  const upd = () => { const n = b.text.split('\n').filter(x => x.trim()).length, pg = paginate(b, stageWOf(w), w.opts.name).length; info.textContent = `${n}行・${pg}ページ（いまの文字の大きさで）`; };
  ta.oninput = () => { shiftCues(b, b.text, ta.value); b.text = ta.value; markDirty(); upd(); };
  body.appendChild(pos(ta, 20, 150, 1240, 480));
  body.appendChild(pos(info, 20, 646, 800, 52));
  body.appendChild(pos(btn('wand', '演出へ', () => { E.tab = 'fx'; editorRefresh(); }), 1100, 646, 160, 52));
  upd(); upd();
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
/* ---------- 演出 ---------- */
function libItems(kind) {
  const user = E.w.media.filter(m => m.kind === kind).map(m => ({ id: m.id, name: m.name, user: true }));
  if (kind === 'se') return [...SE_LIST.map(s => ({ id: 'S:' + s[0], name: s[1] })), ...user];
  if (kind === 'bgm') return [...BGM_LIST.map(s => ({ id: 'M:' + s.id, name: s.name })), ...user];
  return user;
}
function blockEntry(bid) { if (!E.entryCache[bid]) E.entryCache[bid] = entryVisFor(E.w, bid).vis; return E.entryCache[bid]; }
function renderFx(body) {
  const w = E.w, b = curB();
  // 左：素材
  const kinds = ['bg', 'ch', 'se', 'bgm'];
  kinds.forEach((k, i) => body.appendChild(pos(btn(KIND_ICON[k], KIND_NAME[k], () => { stopBGM(); E.libKind = k; E.libPage = 0; E.libSel = null; editorRefresh(); }, 'sm tight opt' + (E.libKind === k ? ' on' : '')), 20 + i * 97, 96, 89, 44)));
  const items = libItems(E.libKind), per = 6, pages = Math.max(1, Math.ceil(items.length / per));
  E.libPage = clamp(E.libPage, 0, pages - 1);
  const lib = pos(h('div', { class: 'lib' }), 20, 150, 380, 396);
  items.slice(E.libPage * per, E.libPage * per + per).forEach((it, i) => {
    const el = libCard(it, E.libKind);
    lib.appendChild(pos(el, (i % 2) * 194, Math.floor(i / 2) * 134, 186, 124));
  });
  if (!items.length) lib.appendChild(h('div', { class: 'lib-empty' }, KIND_NAME[E.libKind] + 'の素材がありません。', h('br'), '画像ファイルをここにドロップするか、下のボタンで追加します。'));
  lib.ondragover = e => e.preventDefault();
  lib.ondrop = e => { e.preventDefault(); e.stopPropagation(); addMediaFiles([...e.dataTransfer.files], E.libKind); };
  body.appendChild(lib);
  body.appendChild(pager(20, 556, 380, E.libPage, pages, p => { E.libPage = p; editorRefresh(); }));
  const act = h('div', { class: 'row' });
  const need = () => { if (E.li == null) { toast('先に、まん中の行をえらんでください'); return false; } if (!E.libSel) { toast('先に、左の素材をえらんでください'); return false; } return true; };
  if (E.libKind === 'bg') act.append(btn('image', 'この行の背景にする', () => need() && setCue(E.li, c => { c.bg = E.libSel; }), 'sm w380'));
  if (E.libKind === 'ch') ['左', '中央', '右'].forEach((n, s) => act.append(btn(null, n + 'に出す', () => need() && placeCh(E.li, s, E.libSel), 'sm w122')));
  if (E.libKind === 'se') act.append(btn('bell', 'この行で鳴らす', () => need() && setCue(E.li, c => { c.se = E.libSel; }), 'sm w380'));
  if (E.libKind === 'bgm') act.append(btn('music', 'この行から流す', () => need() && setCue(E.li, c => { c.bgm = E.libSel; }), 'sm w380'));
  body.appendChild(pos(act, 20, 610, 380, 44));
  body.appendChild(pos(btn('up', 'ファイルから追加', async () => addMediaFiles(await pickFiles(E.libKind === 'se' || E.libKind === 'bgm' ? 'audio/*' : 'image/*'), E.libKind), 'sm'), 20, 662, 380, 44));
  // まん中：行
  body.appendChild(blockNav(416, 96, 384));
  const pages2 = paginate(b, stageWOf(w), w.opts.name);
  const lines = b.text.split('\n').map((t, li) => ({ t, li })).filter(x => x.t.trim());
  const lp = 8, lpages = Math.max(1, Math.ceil(lines.length / lp));
  if (E.li != null && E.linePage == null) E.linePage = 0;
  E.linePage = clamp(E.linePage, 0, lpages - 1);
  const list = pos(h('div', { class: 'lines' }), 416, 150, 384, 474);
  lines.slice(E.linePage * lp, E.linePage * lp + lp).forEach((x, i) => {
    const c = b.cues[x.li] || {}, pg = pageOfLine(pages2, x.li) + 1;
    const tags = h('div', { class: 'ln-tags' },
      c.bg ? ic('image') : null, c.ch ? ic('user') : null, c.se ? ic('bell') : null, c.bgm ? ic(c.bgm === 'stop' ? 'stop' : 'music') : null, c.fx ? ic('zap') : null);
    const row = h('div', { class: 'ln' + (E.li === x.li ? ' sel' : ''), onclick: () => { E.li = x.li; editorRefresh(); } },
      h('div', { class: 'ln-k' }, h('div', null, `${x.li + 1}行 p${pg}`), tags),
      h('div', { class: 'ln-t' }, x.t));
    row.ondragover = e => { e.preventDefault(); row.classList.add('over'); };
    row.ondragleave = () => row.classList.remove('over');
    row.ondrop = async e => {
      e.preventDefault(); e.stopPropagation(); row.classList.remove('over'); E.li = x.li;
      const id = e.dataTransfer.getData('text/nm-media');
      if (id) { assignToLine(x.li, id, E.libKind); return; }
      const fs = [...e.dataTransfer.files]; if (!fs.length) return;
      const ids = await addMediaFiles(fs, E.libKind, true); if (ids[0]) assignToLine(x.li, ids[0], E.libKind);
    };
    list.appendChild(pos(row, 0, i * 60, 384, 54));
  });
  if (!lines.length) list.appendChild(h('div', { class: 'lib-empty' }, '本文がまだありません。「本文」タブで書いてください。'));
  body.appendChild(list);
  body.appendChild(pager(416, 640, 384, E.linePage, lpages, p => { E.linePage = p; editorRefresh(); }));
  // 右：プレビューと操作
  renderFxRight(body, b, pages2);
}
function pager(x, y, wdt, page, pages, go) {
  const r = h('div', { class: 'pager2' },
    btn('prev', '前へ', () => go(page - 1), 'sm' + (page > 0 ? '' : ' dis')),
    h('div', { class: 'pg-n sm' }, `${page + 1} / ${pages}`),
    btn('next', '次へ', () => go(page + 1), 'sm' + (page < pages - 1 ? '' : ' dis')));
  $$('.dis', r).forEach(b => b.disabled = true);
  return pos(r, x, y, wdt, 44);
}
function libCard(it, kind) {
  const isImg = kind === 'bg' || kind === 'ch';
  const el = h('div', { class: 'lcard' + (E.libSel === it.id ? ' sel' : ''), draggable: 'true', onclick: () => {
    E.libSel = it.id;
    if (kind === 'se') playSE(it.id);
    if (kind === 'bgm') { if (AU.bgmId === it.id) stopBGM(); else playBGM(it.id); }
    editorRefresh();
  } },
    isImg ? h('img', { class: 'lc-img' + (kind === 'ch' ? ' ch' : ''), src: MEDIA[it.id] || '', draggable: 'false' }) : h('div', { class: 'lc-ic' }, ic(kind === 'se' ? 'bell' : (AU.bgmId === it.id ? 'stop' : 'music'), 40)),
    h('div', { class: 'lc-n' }, it.name),
    !isImg && !it.user ? h('div', { class: 'lc-tag' }, '内蔵') : null);
  el.ondragstart = e => { E.libSel = it.id; e.dataTransfer.setData('text/nm-media', it.id); };
  return el;
}
function setCue(li, fn) {
  const b = curB(), c = b.cues[li] = b.cues[li] || {};
  fn(c);
  if (c.ch) { for (const s in c.ch) if (!c.ch[s]) delete c.ch[s]; if (!Object.keys(c.ch).length) delete c.ch; }
  for (const k of Object.keys(c)) if (c[k] == null || c[k] === 0) delete c[k];
  if (!Object.keys(c).length) delete b.cues[li];
  markDirty(true); return true;
}
function visAtLine(li) { return visUntil(curB(), blockEntry(curB().id), li, true); }
function placeCh(li, s, id) {
  const cur = visAtLine(li).ch[s];
  return setCue(li, c => { c.ch = c.ch || {}; c.ch[s] = { m: id, s: cur ? cur.s : 1, y: cur ? cur.y : 0 }; });
}
function assignToLine(li, id, kind) {
  if (kind === 'bg') setCue(li, c => { c.bg = id; });
  else if (kind === 'ch') placeCh(li, E.chSlot, id);
  else if (kind === 'se') setCue(li, c => { c.se = id; });
  else if (kind === 'bgm') setCue(li, c => { c.bgm = id; });
}
function renderFxRight(body, b, pages2) {
  const w = E.w, X = 816, W = 444, li = E.li;
  // プレビュー
  const pw = w.ratio === '4:3' ? 333 : 444, pv = pos(h('div', { class: 'prev' }), X + (W - pw) / 2, 96, pw, 250);
  const vis = li != null ? visAtLine(li) : blockEntry(b.id);
  if (vis.bg && MEDIA[vis.bg]) pv.appendChild(h('img', { class: 'bgimg', src: MEDIA[vis.bg] }));
  vis.ch.forEach((c, s) => {
    if (!c || !MEDIA[c.m]) return;
    pv.appendChild(h('img', { class: 'chimg', src: MEDIA[c.m], style: `left:${CH_X[s]}%;height:${86 * c.s}%;bottom:${c.y * 30 * 250 / 720}px` }));
  });
  if (li != null && E.chSlot != null) pv.appendChild(h('div', { class: 'slot-mark', style: `left:${CH_X[E.chSlot]}%` }, ['左', '中央', '右'][E.chSlot]));
  body.appendChild(pv);
  const c = (li != null && b.cues[li]) || {};
  const nm = id => id ? (w.media.find(m => m.id === id) || { name: '？' }).name : '−';
  const chTxt = ['左', '中', '右'].map((n, s) => n + ' ' + (vis.ch[s] ? nm(vis.ch[s].m) : '−')).join('・');
  const info = pos(h('div', { class: 'fx-info' },
    h('div', null, li == null ? '行をえらんでください' : `${li + 1}行目・${pageOfLine(pages2, li) + 1}ページ目　背景：${vis.bg ? nm(vis.bg) : 'なし'}`),
    h('div', null, '人物：' + chTxt),
    h('div', null, `効果音：${c.se ? soundName(w, c.se) : '−'}　BGM：${c.bgm ? soundName(w, c.bgm) : (vis.bgm ? soundName(w, vis.bgm) + '（つづき）' : '−')}　明滅：${c.fx ? c.fx + '回' : 'なし'}`)), X, 352, W, 60);
  body.appendChild(info);
  const rowY = [414, 460, 506, 552, 598], lab = (t, y) => body.appendChild(pos(h('div', { class: 'fx-lab' }, t), X, y, 60, 40));
  const row = (y, bs, bw) => { const r = pos(h('div', { class: 'row' }), X + 64, y, 380, 40); bs.forEach(b2 => { b2.style.width = bw + 'px'; r.appendChild(b2); }); body.appendChild(r); return r; };
  const L = fn => () => { if (li == null) { toast('先に、まん中の行をえらんでください'); return; } fn(); };
  lab('背景', rowY[0]);
  row(rowY[0], [btn(null, 'なしにする', L(() => setCue(li, x => { x.bg = 'none'; })), 'xs2'), btn(null, '指定を消す', L(() => setCue(li, x => { delete x.bg; })), 'xs2')], 187);
  lab('人物', rowY[1]);
  row(rowY[1], ['左', '中央', '右'].map((n, s) => btn(null, n, () => { E.chSlot = s; editorRefresh(); }, 'xs2 opt' + (E.chSlot === s ? ' on' : ''))), 122);
  lab('調整', rowY[2]);
  const adj = (fn) => L(() => {
    const s = E.chSlot, cur = visAtLine(li).ch[s];
    if (!cur) { toast('その位置に人物がいません'); return; }
    setCue(li, x => { x.ch = x.ch || {}; const v = x.ch[s] && x.ch[s].m !== 'none' ? x.ch[s] : { m: cur.m, s: cur.s, y: cur.y }; fn(v); x.ch[s] = v; });
  });
  row(rowY[2], [btn(null, '退場', L(() => setCue(li, x => { x.ch = x.ch || {}; x.ch[E.chSlot] = { m: 'none' }; })), 'xs2'),
    btn(null, 'けす', L(() => setCue(li, x => { if (x.ch) delete x.ch[E.chSlot]; })), 'xs2'),
    btn(null, '小', adj(v => { v.s = Math.max(0.5, +(v.s - 0.1).toFixed(1)); }), 'xs2'),
    btn(null, '大', adj(v => { v.s = Math.min(1.6, +(v.s + 0.1).toFixed(1)); }), 'xs2'),
    btn(null, '上', adj(v => { v.y = Math.min(8, v.y + 1); }), 'xs2'),
    btn(null, '下', adj(v => { v.y = Math.max(-8, v.y - 1); }), 'xs2')], 58);
  lab('音', rowY[3]);
  row(rowY[3], [btn(null, '効果音を消す', L(() => setCue(li, x => { delete x.se; })), 'xs2'), btn(null, 'BGMを止める', L(() => setCue(li, x => { x.bgm = 'stop'; })), 'xs2'), btn(null, 'BGM指定を消す', L(() => setCue(li, x => { delete x.bgm; })), 'xs2')], 122);
  lab('明滅', rowY[4]);
  row(rowY[4], ['なし', 1, 2, 3, 4, 5].map((n, i) => btn(null, String(n), L(() => setCue(li, x => { x.fx = i || null; })), 'xs2 opt' + ((c.fx || 0) === i && li != null ? ' on' : ''))), 58);
  body.appendChild(pos(btn('play', 'この行から見る', L(async () => { await flushSave(); playWork(w, { test: true, loadMedia: false, bid: b.id, li, onBack: () => { showScreen('edit'); APP.key = editorKey; editorRefresh(); } }); }), 'xs2'), X, 646, W, 40));
}
/* ---------- 素材 ---------- */
async function addMediaFiles(files, kind, quiet) {
  const ids = [];
  for (const f of files) {
    let k = kind, data;
    if (/^video\//.test(f.type)) { toast('動画は使えません'); continue; }
    if (/^image\//.test(f.type)) {
      if (k !== 'bg' && k !== 'ch') k = 'bg';
      try { data = (await shrinkImage(await readAsDataURL(f), k)).data; } catch (e) { toast('画像を読みこめませんでした：' + f.name); continue; }
    } else if (/^audio\//.test(f.type) || /\.(mp3|wav|ogg|m4a)$/i.test(f.name)) {
      if (k !== 'se' && k !== 'bgm') k = 'se';
      if (f.size > 3 * 1048576) { toast('音のファイルは3MBまでです：' + f.name); continue; }
      data = await readAsDataURL(f);
    } else { toast('使えないファイルです：' + f.name); continue; }
    const id = uid(), name = f.name.replace(/\.[^.]+$/, '').slice(0, 20);
    await dbPut('media', { id, wid: E.w.id, data });
    MEDIA[id] = data; E.w.media.push({ id, kind: k, name, size: dataSize(data) }); ids.push(id);
    if (k === kind) E.libSel = id;
  }
  if (ids.length) { if (!quiet) toast(ids.length + 'この素材を追加しました'); markDirty(true); }
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
  E.medSel = null; E.libSel = null; markDirty(true);
}
function renderMedia(body) {
  const w = E.w;
  ['bg', 'ch', 'se', 'bgm'].forEach((k, i) => body.appendChild(pos(btn(KIND_ICON[k], KIND_NAME[k] + '（' + w.media.filter(m => m.kind === k).length + '）', () => { stopBGM(); E.medKind = k; E.medPage = 0; E.medSel = null; editorRefresh(); }, 'sm opt' + (E.medKind === k ? ' on' : '')), 20 + i * 162, 96, 154, 44)));
  const items = w.media.filter(m => m.kind === E.medKind), per = 8, pages = Math.max(1, Math.ceil(items.length / per));
  E.medPage = clamp(E.medPage, 0, pages - 1);
  const grid = pos(h('div', { class: 'lib' }), 20, 150, 860, 420);
  grid.ondragover = e => e.preventDefault();
  grid.ondrop = e => { e.preventDefault(); e.stopPropagation(); addMediaFiles([...e.dataTransfer.files], E.medKind); };
  items.slice(E.medPage * per, E.medPage * per + per).forEach((m, i) => {
    const isImg = m.kind === 'bg' || m.kind === 'ch', u = usageOf(m.id);
    const card = h('div', { class: 'mcard' + (E.medSel === m.id ? ' sel' : ''), onclick: () => { E.medSel = m.id; editorRefresh(); } },
      isImg ? h('img', { class: 'lc-img' + (m.kind === 'ch' ? ' ch' : ''), src: MEDIA[m.id] || '' }) : h('div', { class: 'lc-ic' }, ic(KIND_ICON[m.kind], 48)),
      h('div', { class: 'lc-n' }, m.name), h('div', { class: 'mc-u' + (u ? '' : ' no') }, u ? `${u}か所で使用` : '使っていない'));
    grid.appendChild(pos(card, (i % 4) * 220, Math.floor(i / 4) * 210, 200, 200));
  });
  if (!items.length) grid.appendChild(h('div', { class: 'lib-empty' }, KIND_NAME[E.medKind] + 'の素材はまだありません。ファイルをここにドロップしても追加できます。' + (E.medKind === 'se' || E.medKind === 'bgm' ? '（内蔵の音は「演出」タブでえらべます）' : '')));
  body.appendChild(grid);
  body.appendChild(pager(20, 586, 420, E.medPage, pages, p => { E.medPage = p; editorRefresh(); }));
  body.appendChild(pos(btn('up', 'ファイルから追加', async () => addMediaFiles(await pickFiles(E.medKind === 'se' || E.medKind === 'bgm' ? 'audio/*' : 'image/*'), E.medKind), 'sm'), 20, 646, 300, 44));
  body.appendChild(pos(btn('trash', '使っていない素材を消す', async () => {
    const un = w.media.filter(m => !usageOf(m.id)).map(m => m.id);
    if (!un.length) { toast('使っていない素材はありません'); return; }
    if (await okAsk(`使っていない素材 ${un.length}こ を消しますか？`, 'もとにもどせません')) removeMedia(un);
  }, 'sm'), 336, 646, 300, 44));
  const total = w.media.reduce((a, m) => a + (m.size || 0), 0);
  body.appendChild(pos(h('div', { class: 'hint' }, '素材の合計 ' + fmtSize(total)), 652, 646, 228, 44));
  // 右
  const p = pos(h('div', { class: 'panel mpanel' }), 900, 90, 360, 616);
  const m = items.find(x => x.id === E.medSel);
  if (!m) p.appendChild(h('div', { class: 'lib-empty' }, '素材をえらぶと、名前の変更や削除ができます。'));
  else {
    const isImg = m.kind === 'bg' || m.kind === 'ch';
    p.append(isImg ? h('div', { class: 'mp-prev' }, h('img', { src: MEDIA[m.id] })) : h('div', { class: 'mp-prev' }, ic(KIND_ICON[m.kind], 64)));
    const inp = h('input', { class: 'inp sm', maxlength: 20, value: m.name }); inp.oninput = () => { m.name = inp.value; markDirty(); };
    p.append(h('div', { class: 'bp-cap' }, '名前'), inp,
      h('div', { class: 'mp-info' }, `${usageOf(m.id)}か所で使用・${fmtSize(m.size || 0)}`),
      !isImg ? btn('play', '試聴する', () => m.kind === 'se' ? playSE(m.id) : (AU.bgmId === m.id ? stopBGM() : playBGM(m.id)), 'sm w320') : null,
      btn('trash', 'この素材を消す', async () => { if (await okAsk('「' + m.name + '」を消しますか？', '使っている行の指定も消えます')) removeMedia([m.id]); }, 'sm w320'));
  }
  body.appendChild(p);
}
/* ---------- 作品の設定 ---------- */
const UI_COLORS = ['#1e3a7b', '#16224a', '#1f6b4a', '#9b2335', '#5b2a86', '#6b4423', '#2b2b2b', '#c2255c'];
const TX_COLORS = ['#ffffff', '#fff6d8', '#cfe8ff', '#ffe066', '#ffc9dc', '#c3fae8', '#dddddd', '#1a1a1a'];
function renderWorkTab(body) {
  const w = E.w;
  const L = h('div', { class: 'wk-col' }), R = h('div', { class: 'wk-col' });
  const row = (label, ...kids) => h('div', { class: 'wk-row' }, h('div', { class: 'wk-l' }, label), ...kids);
  const opt = (cur, list, on) => list.map(([v, lb]) => btn(null, lb, () => on(v), 'sm opt w140' + (cur === v ? ' on' : '')));
  const ti = h('input', { class: 'inp sm', maxlength: 30, value: w.title }); ti.oninput = () => { w.title = ti.value; markDirty(); };
  const au = h('input', { class: 'inp sm', maxlength: 16, value: w.author }); au.oninput = () => { w.author = au.value; markDirty(); };
  const bgs = [null, ...w.media.filter(m => m.kind === 'bg').map(m => m.id)];
  const ti2 = bgs.indexOf(w.titleImg);
  L.append(row('タイトル', ti), row('作者名', au),
    row('改造', ...opt(w.editable, [[true, 'OK'], [false, 'だめ']], v => { w.editable = v; markDirty(true); })),
    row('画面の形', ...opt(w.ratio, [['16:9', '16:9'], ['4:3', '4:3']], v => { w.ratio = v; markDirty(true); })),
    row('タイトル画面', ...opt(w.opts.title, [[true, 'つける'], [false, 'つけない']], v => { w.opts.title = v; markDirty(true); })),
    row('タイトル画像', btn('prev', null, () => { w.titleImg = bgs[(ti2 - 1 + bgs.length) % bgs.length]; markDirty(true); }, 'sm sq'),
      h('div', { class: 'wk-val' }, w.titleImg ? (w.media.find(m => m.id === w.titleImg) || {}).name : 'なし'),
      btn('next', null, () => { w.titleImg = bgs[(ti2 + 1) % bgs.length]; markDirty(true); }, 'sm sq')),
    row('名前欄', ...opt(w.opts.name, [[true, 'オン'], [false, 'オフ']], v => { w.opts.name = v; markDirty(true); })),
    h('div', { class: 'wk-row' }, btn('down', 'この作品を書き出す（Teamsで送る用）', async () => { await flushSave(); exportWork(w); }, 'sm w440')));
  const usedChoice = Object.values(w.blocks).some(b => b.end.type === 'choice' || b.end.type === 'cond') || Object.values(w.blocks).some(b => b.slot > 0);
  const usedCond = Object.values(w.blocks).some(b => b.end.type === 'cond');
  R.append(
    row('シナリオ', ...opt(w.opts.long, [[true, '長い'], [false, '1話完結']], v => {
      if (!v && Object.keys(w.blocks).length > 1) { toast('ブロックが2つ以上あるので、1話完結にはできません'); return; }
      w.opts.long = v; if (!v) { w.opts.branch = false; w.opts.flag = false; } E.tab = 'work'; markDirty(true);
    })),
    row('分岐', ...opt(w.opts.branch, [[true, 'する'], [false, 'しない']], v => {
      if (v && !w.opts.long) { toast('1話完結では分岐できません'); return; }
      if (!v && usedChoice) { toast('選択肢・条件・2つ目のブロックを使っているので「しない」にできません'); return; }
      w.opts.branch = v; if (!v) w.opts.flag = false; markDirty(true);
    })),
    row('イベントフラグ', ...opt(w.opts.flag, [[true, '使う'], [false, '使わない']], v => {
      if (v && !w.opts.branch) { toast('分岐「する」のときだけ使えます'); return; }
      if (!v && usedCond) { toast('条件を使っているので「使わない」にできません'); return; }
      w.opts.flag = v; markDirty(true);
    })),
    row('UIの色', h('div', { class: 'sw-row' }, UI_COLORS.map(c => h('button', { class: 'sw' + (w.theme.ui === c ? ' on' : ''), style: `background:${c}`, onclick: () => { w.theme.ui = c; markDirty(true); } })), colorInp(w.theme.ui, v => { w.theme.ui = v; markDirty(true); }))),
    row('文字の色', h('div', { class: 'sw-row' }, TX_COLORS.map(c => h('button', { class: 'sw' + (w.theme.tx === c ? ' on' : ''), style: `background:${c}`, onclick: () => { w.theme.tx = c; markDirty(true); } })), colorInp(w.theme.tx, v => { w.theme.tx = v; markDirty(true); }))));
  const pv = h('div', { class: 'wk-prev' },
    w.opts.name ? h('div', { class: 'wk-pn' }, 'たろう') : null,
    h('div', { class: 'wk-pw' }, 'これは見本の文章です。', h('br'), '色を変えると、ここに反映されます。'));
  themeVars(pv, w.theme);
  R.append(h('div', { class: 'wk-row' }, h('div', { class: 'wk-l' }, '見本'), pv));
  body.appendChild(pos(L, 20, 96, 620, 600));
  body.appendChild(pos(R, 660, 96, 600, 600));
}
function colorInp(val, on) {
  const i = h('input', { type: 'color', class: 'cpick', value: val, title: '自由に色をえらぶ' });
  i.onchange = () => on(i.value); return i;
}
/* 作る画面へのファイルのドロップ */
document.addEventListener('drop', e => {
  if (!$('#scr-edit').classList.contains('show') || !e.dataTransfer || !e.dataTransfer.files.length) return;
  const fs = [...e.dataTransfer.files];
  const kind = E.tab === 'fx' ? E.libKind : E.tab === 'media' ? E.medKind : (/^audio\//.test(fs[0].type) ? 'se' : 'bg');
  addMediaFiles(fs, kind);
});
