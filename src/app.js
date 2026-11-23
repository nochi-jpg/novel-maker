/* ===== 画面の切りかえ・タイトル・作品えらび・設定 ===== */
const STAGE = { w: 1280 };
const APP = { key: null, mode: 'view', page: 0 };
function fitStage() {
  const st = $('#stage'), W = STAGE.w, H = 720;
  const s = Math.min(innerWidth / W, innerHeight / H);
  st.style.width = W + 'px';
  st.style.transform = `translate(${(innerWidth - W * s) / 2}px,${(innerHeight - H * s) / 2}px) scale(${s})`;
}
function showScreen(name) {
  $$('.screen').forEach(s => s.classList.toggle('show', s.id === 'scr-' + name));
  $$('.modal').forEach(m => m.remove());
  APP.key = null;
}
/* ---- タイトル ---- */
function gotoTitle() {
  setStageW(1280); stopBGM();
  const s = $('#scr-title'); s.innerHTML = '';
  s.append(
    h('div', { class: 'tt-logo' }, 'ノベルゲームメーカー'),
    h('div', { class: 'tt-sub' }, 'きょういく版'),
    h('div', { class: 'tt-btns' },
      btn('book', '見る', () => gotoSelect('view'), 'big'),
      btn('text', '作る', () => gotoSelect('make'), 'big'),
      btn('load', 'もらった作品を読みこむ', () => importDialog(), 'big')),
    btn('gear', '設定', () => openSettings(), 'tr'));
  showScreen('title');
}
async function importDialog() {
  const fs = await pickFiles('.json,application/json');
  let last = null;
  for (const f of fs) { const w = await importFile(f); if (w) last = w; }
  if (last && $('#scr-select').classList.contains('show')) gotoSelect(APP.mode, APP.page);
  return last;
}
/* ---- 作品えらび ---- */
async function gotoSelect(mode, page = 0) {
  setStageW(1280); stopBGM();
  APP.mode = mode; APP.page = page;
  const works = (await dbAll('works')).sort((a, b) => b.updated - a.updated);
  const items = mode === 'make' ? ['new', ...works] : works;
  const per = 6, pages = Math.max(1, Math.ceil(items.length / per)); page = clamp(page, 0, pages - 1); APP.page = page;
  const s = $('#scr-select'); s.innerHTML = '';
  s.append(btn('back', 'もどる', () => gotoTitle(), 'tl'),
    h('div', { class: 'sc-title' }, mode === 'make' ? '作る作品をえらぶ' : '見る作品をえらぶ'),
    btn('gear', '設定', () => openSettings(), 'tr'));
  const grid = h('div', { class: 'cards' });
  items.slice(page * per, page * per + per).forEach(w => {
    if (w === 'new') { grid.appendChild(h('button', { class: 'card card-new', onclick: () => newWorkDialog() }, ic('plus', 56), h('div', null, '新しく作る'))); return; }
    const nb = Object.keys(w.blocks).length;
    const card = h('div', { class: 'card', onclick: () => openWork(w) },
      h('div', { class: 'card-t' }, w.title || 'むだい'),
      h('div', { class: 'card-a' }, w.author ? 'さく：' + w.author : 'さく：（なし）'),
      h('div', { class: 'tags' },
        w.recv ? h('span', { class: 'tag recv' }, 'もらった') : null,
        h('span', { class: 'tag' }, w.ratio),
        h('span', { class: 'tag' }, 'ブロック ' + nb),
        w.editable ? null : h('span', { class: 'tag lock' }, ic('lock', 16), '改造だめ')),
      h('div', { class: 'card-d' }, '更新 ' + fmtDate(w.updated)),
      h('div', { class: 'card-btns' },
        btn('down', '書き出す', e => { e.stopPropagation(); exportWork(w); }, 'sm'),
        mode === 'make' ? btn('trash', '消す', async e => {
          e.stopPropagation();
          if (await okAsk('「' + w.title + '」を消しますか？', 'もとにもどせません')) { await deleteWork(w); gotoSelect(mode, page); }
        }, 'sm') : null));
    if (mode === 'make' && !w.editable) card.classList.add('locked');
    grid.appendChild(card);
  });
  if (!items.length) grid.appendChild(h('div', { class: 'empty-msg' }, 'まだ作品がありません。「作る」で作るか、もらった作品を読みこんでください。'));
  s.append(grid, h('div', { class: 'pager' },
    btn('prev', '前へ', () => gotoSelect(mode, page - 1), page > 0 ? '' : 'dis'),
    h('div', { class: 'pg-n' }, `${page + 1} / ${pages}`),
    btn('next', '次へ', () => gotoSelect(mode, page + 1), page < pages - 1 ? '' : 'dis'),
    btn('load', '読みこむ', () => importDialog())));
  $$('.dis', s).forEach(b => b.disabled = true);
  showScreen('select');
}
async function openWork(w) {
  if (APP.mode === 'make') {
    if (!w.editable) { toast('この作品は、作者が「改造だめ」にしています'); return; }
    openEditor(w);
  } else playWork(w, { onBack: () => gotoSelect('view', APP.page) });
}
/* ---- 新しく作る ---- */
function newWorkDialog() {
  const o = { title: '', author: '', title_: true, long: true, branch: true, flag: false, ratio: '16:9' };
  let m;
  const ti = h('input', { class: 'inp', maxlength: 30, placeholder: '作品のタイトル' });
  const au = h('input', { class: 'inp', maxlength: 16, placeholder: '作者名（ニックネームでもOK）' });
  const rows = h('div', { class: 'wz-rows' });
  const choice = (key, label, opts) => {
    const r = h('div', { class: 'wz-row' }, h('div', { class: 'wz-l' }, label));
    const bs = opts.map(([v, lb, icn]) => { const b = btn(icn, lb, () => { o[key] = v; draw(); }, 'opt'); b._v = v; r.appendChild(b); return b; });
    r._upd = () => { bs.forEach(b => { b.classList.toggle('on', o[key] === b._v); }); };
    r._key = key; return r;
  };
  const r0 = choice('title_', 'タイトル画面', [[true, 'つける', 'check'], [false, 'つけない', 'x']]);
  const r1 = choice('long', 'シナリオの長さ', [[true, '長いシナリオ', 'map'], [false, '1話完結', 'text']]);
  const r2 = choice('branch', '選択肢で分岐', [[true, 'する', 'branch'], [false, 'しない', 'arrow']]);
  const r3 = choice('flag', 'イベントフラグ', [[true, '使う', 'flag'], [false, '使わない', 'x']]);
  const r4 = choice('ratio', '画面の形', [['16:9', '16:9（横長）', 'image'], ['4:3', '4:3', 'image']]);
  function draw() {
    if (!o.long) { o.branch = false; o.flag = false; }
    if (!o.branch) o.flag = false;
    [r0, r1, r2, r3, r4].forEach(r => r._upd());
    r2.classList.toggle('off', !o.long); r3.classList.toggle('off', !o.branch);
    $$('button', r2).forEach(b => b.disabled = !o.long); $$('button', r3).forEach(b => b.disabled = !o.branch);
  }
  rows.append(h('div', { class: 'wz-row' }, h('div', { class: 'wz-l' }, 'タイトル'), ti),
    h('div', { class: 'wz-row' }, h('div', { class: 'wz-l' }, '作者名'), au), r0, r1, r2, r3, r4);
  draw();
  m = openModal(h('div', { class: 'dlg dlg-wz' }, h('div', { class: 'dlg-title' }, '新しく作る'), rows,
    h('div', { class: 'dlg-btns' },
      btn('check', '作る', async () => {
        o.title = ti.value.trim() || 'むだい'; o.author = au.value.trim();
        const w = newWork(o); await saveWork(w); closeModal(m); openEditor(w);
      }),
      btn('x', 'やめる', () => closeModal(m)))));
  setTimeout(() => ti.focus(), 50);
}
/* ---- 設定 ---- */
function openSettings() {
  let m, tab = 0;
  const body = h('div', { class: 'set-body' });
  const tabs = h('div', { class: 'set-tabs' });
  const T = [['sliders', '表示・再生', ['speed', 'size', 'width', 'alpha', 'wait']], ['sound', '音・データ', ['bgm', 'se']]];
  function draw() {
    tabs.innerHTML = ''; body.innerHTML = '';
    T.forEach((t, i) => tabs.appendChild(btn(t[0], t[1], () => { tab = i; draw(); }, 'opt' + (i === tab ? ' on' : ''))));
    for (const k of T[tab][2]) {
      const d = SET_OPT[k];
      body.appendChild(h('div', { class: 'set-row' }, h('div', { class: 'set-l' }, d.label),
        d.names.map((n, i) => btn(null, n, () => { SET[k] = i; saveSet(); auVol(); draw(); settingsChanged(k); }, 'opt' + (SET[k] === i ? ' on' : '')))));
    }
    if (tab === 1) {
      const cur = curOpenWork();
      body.appendChild(h('div', { class: 'set-row set-data' },
        btn('home', 'タイトルへ', async () => { closeModal(m); if (P.typing) stopTyping(); gotoTitle(); }),
        btn('down', '作品を書き出す', () => { if (cur) exportWork(cur); }, cur ? '' : 'dis'),
        btn('load', '作品を読みこむ', async () => { closeModal(m); await importDialog(); })));
      $$('.dis', body).forEach(b => b.disabled = true);
      body.appendChild(h('div', { class: 'set-note' }, '内蔵のBGM・効果音は、このアプリが自分で作っている音です（素材ファイルは使っていません）。'));
    }
  }
  draw();
  m = openModal(h('div', { class: 'dlg dlg-set' }, h('div', { class: 'dlg-title' }, '設定'), tabs, body,
    h('div', { class: 'dlg-btns' }, btn('x', 'とじる', () => closeModal(m)))), { close: true });
}
function curOpenWork() {
  if ($('#scr-play').classList.contains('show')) return P.w;
  if ($('#scr-edit').classList.contains('show')) return E.w;
  return null;
}
function settingsChanged(k) {
  if (['size', 'width', 'alpha'].includes(k)) {
    if ($('#scr-play').classList.contains('show')) playerRelayout();
    if ($('#scr-edit').classList.contains('show')) editorRefresh();
  }
}
/* ---- 起動 ---- */
window.addEventListener('resize', fitStage);
window.addEventListener('keydown', e => {
  if (e.target.matches && e.target.matches('input,textarea,select')) { if (e.key === 'Escape') e.target.blur(); return; }
  if (e.key === 'Escape') { const ms = $$('.modal'); if (ms.length) { ms[ms.length - 1].remove(); return; } }
  if (APP.key) APP.key(e);
});
window.addEventListener('pointerdown', () => auInit(), { capture: true });
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', async e => {
  e.preventDefault();
  if (e.defaultPrevented && e._handled) return;
  const fs = [...(e.dataTransfer?.files || [])];
  if ($('#scr-edit').classList.contains('show')) return; // 作る画面は素材として受けとる
  const js = fs.filter(f => /\.json$/i.test(f.name));
  for (const f of js) await importFile(f);
  if (js.length && $('#scr-select').classList.contains('show')) gotoSelect(APP.mode, APP.page);
});
window.addEventListener('DOMContentLoaded', () => { fitStage(); gotoTitle(); });
