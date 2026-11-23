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
    h('img', { class: 'tt-logo', src: LOGO_SRC, alt: 'ノベルメーカー' }),
    h('div', { class: 'tt-btns' },
      btn('book', '見る', () => gotoSelect('view'), 'big'),
      btn('text', '作る', () => gotoSelect('make'), 'big pri'),
      btn('load', 'もらった作品を読みこむ', () => importDialog(), 'big')),
    btn('gear', '設定', () => openSettings(), 'tr'),
    h('div', { class: 'tt-ver' }, 'きょういく版 v0.2'));
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
        }, 'sm dng') : null));
    if (mode === 'make' && !w.editable) card.classList.add('locked');
    grid.appendChild(card);
  });
  if (!items.length) grid.appendChild(h('div', { class: 'empty-msg' }, 'まだ作品がありません。「作る」で作るか、もらった作品を読みこんでください。'));
  s.append(grid, h('div', { class: 'pager' },
    page > 0 ? btn('prev', '前へ', () => gotoSelect(mode, page - 1)) : btnOff('prev', '前へ', '最初のページです'),
    h('div', { class: 'pg-n' }, `${page + 1} / ${pages}`),
    page < pages - 1 ? btn('next', '次へ', () => gotoSelect(mode, page + 1)) : btnOff('next', '次へ', '最後のページです'),
    btn('load', '読みこむ', () => importDialog())));
  showScreen('select');
}
async function openWork(w) {
  if (APP.mode === 'make') {
    if (!w.editable) { toast('この作品は、作者が「改造だめ」にしています'); return; }
    openEditor(w);
  } else playWork(w, { onBack: () => gotoSelect('view', APP.page) });
}
/* ---- 新しく作る（左：質問、右：図つきの説明） ---- */
const SVGW = (inner) => `<svg viewBox="0 0 470 250" width="470" height="250" font-family="BIZ UDPGothic, sans-serif">${inner}</svg>`;
const box = (x, y, w, hh, t, fill = '#fff', stroke = '#1e3a7b', tc = '#1e3a7b', fs = 16) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/><text x="${x + w / 2}" y="${y + hh / 2 + fs / 3}" text-anchor="middle" font-size="${fs}" font-weight="bold" fill="${tc}">${t}</text>`;
const arr = (x1, y1, x2, y2, c = '#f08c00') => `<path d="M${x1} ${y1} C${(x1 + x2) / 2} ${y1},${(x1 + x2) / 2} ${y2},${x2} ${y2}" fill="none" stroke="${c}" stroke-width="3" marker-end="url(#wa)"/>`;
const DEFS = '<defs><marker id="wa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#f08c00"/></marker></defs>';
const screen = (x, y, w, hh, inner) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="8" fill="#9cc6e8" stroke="#1e3a7b" stroke-width="2.5"/><rect x="${x}" y="${y + hh * 0.62}" width="${w}" height="${hh * 0.38}" rx="0" fill="#7fb069"/>${inner}`;
const WZ_HELP = {
  title: ['タイトルと作者名', 'お話の名前と、作った人の名前です。作者名はニックネームでもかまいません。友だちに送ると、相手の画面にも出ます。',
    SVGW(screen(85, 20, 300, 170, `<rect x="135" y="85" width="200" height="44" rx="8" fill="#1e3a7bcc"/><text x="235" y="114" text-anchor="middle" font-size="20" fill="#fff" font-weight="bold">森のふしぎな冒険</text><text x="235" y="150" text-anchor="middle" font-size="14" fill="#1e2a4a">さく：たろう</text>`) + '<text x="235" y="230" text-anchor="middle" font-size="16" fill="#5a6a90">タイトル画面や作品えらびに出ます</text>')],
  title_: ['タイトル画面', '「つける」と、お話の最初にタイトル画面が出て、「はじめから」「つづきから」「ロード」をえらべます。「つけない」と、すぐにお話が始まります。',
    SVGW(DEFS + screen(20, 40, 190, 120, `<rect x="55" y="75" width="120" height="30" rx="6" fill="#1e3a7bcc"/><text x="115" y="96" text-anchor="middle" font-size="14" fill="#fff">タイトル</text><rect x="60" y="120" width="110" height="22" rx="5" fill="#fff" stroke="#1e3a7b"/><text x="115" y="136" text-anchor="middle" font-size="12" fill="#1e3a7b">はじめから</text>`) + arr(215, 100, 255, 100) + screen(260, 40, 190, 120, `<rect x="270" y="125" width="170" height="28" rx="6" fill="#1e3a7bcc"/><text x="355" y="144" text-anchor="middle" font-size="12" fill="#fff">お話が始まる</text>`) + '<text x="235" y="200" text-anchor="middle" font-size="16" fill="#5a6a90">タイトル画面　→　お話</text>')],
  long: ['シナリオの長さ', '「1話完結」は1つの文章だけの短いお話です。「長いシナリオ」は、お話をいくつかのブロックに分けて、マップでつなげます。分岐したいときは「長いシナリオ」をえらびます。',
    SVGW(DEFS + '<text x="110" y="30" text-anchor="middle" font-size="17" font-weight="bold" fill="#1e3a7b">1話完結</text>' + box(45, 60, 130, 120, 'お話', '#fff3e0', '#f08c00', '#c46d00', 20) +
      '<text x="340" y="30" text-anchor="middle" font-size="17" font-weight="bold" fill="#1e3a7b">長いシナリオ</text>' + box(240, 95, 56, 50, '1') + arr(298, 120, 314, 120) + box(316, 95, 56, 50, '2') + arr(374, 120, 390, 120) + box(392, 95, 56, 50, '3') + '<text x="340" y="190" text-anchor="middle" font-size="14" fill="#5a6a90">ブロックを線でつなぐ</text>')],
  branch: ['選択肢で分岐', '「する」と、お話のとちゅうで選択肢を出して、えらんだ答えで話を分けられます。1つのエピソードに置けるブロックは3つまで。分かれた話をまた1つにもどすこともできます。',
    SVGW(DEFS + box(20, 100, 80, 50, '1') + arr(102, 115, 170, 50) + arr(102, 125, 170, 125) + arr(102, 135, 170, 200) + box(172, 25, 90, 50, '2-1', '#fff9db', '#e0a800', '#946200') + box(172, 100, 90, 50, '2-2', '#e7f5ff', '#1c7ed6', '#1864ab') + box(172, 175, 90, 50, '2-3', '#ebfbee', '#2f9e44', '#2b8a3e') +
      arr(264, 50, 360, 115) + arr(264, 125, 360, 125) + box(362, 100, 90, 50, '3') + '<text x="315" y="210" text-anchor="middle" font-size="13" fill="#5a6a90">2-3は「おわり」</text>')],
  flag: ['イベントフラグ', '前にどの選択肢をえらんだか、どのブロックを通ったかで、あとの行き先を変えられます。たとえば「2-1でAをえらんでいたら、7-3へ」のようにできます。むずかしいので、なれてから使うのがおすすめです。',
    SVGW(DEFS + box(10, 30, 110, 46, '2-1：A', '#fff9db', '#e0a800', '#946200') + '<text x="65" y="98" text-anchor="middle" font-size="13" fill="#5a6a90">ここでAをえらぶ</text>' + arr(122, 53, 170, 120, '#e0a800') +
      box(172, 98, 120, 50, '6：条件', '#fff4e6', '#e8590c', '#e8590c') + arr(294, 112, 348, 60) + arr(294, 134, 348, 190) + box(350, 35, 110, 46, '7-3') + box(350, 168, 110, 46, '7-1') +
      '<text x="405" y="25" text-anchor="middle" font-size="12" fill="#c46d00">Aをえらんでいた</text><text x="405" y="234" text-anchor="middle" font-size="12" fill="#5a6a90">それ以外</text>')],
  mode: ['文章の出し方', '「ウインドウ」は、画面の下のまどに文章が出ます（絵がよく見えます）。「サウンドノベル」は、画面全体に文章を重ねて出します（かまいたちの夜のような本を読む感じ）。選択肢も文章の続きに出ます。',
    SVGW(screen(15, 30, 210, 130, `<rect x="25" y="118" width="190" height="34" rx="5" fill="#1e3a7bcc"/><rect x="35" y="128" width="120" height="5" fill="#fff"/><rect x="35" y="139" width="90" height="5" fill="#fff"/>`) + '<text x="120" y="190" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e3a7b">ウインドウ</text>' +
      screen(245, 30, 210, 130, `<rect x="255" y="38" width="190" height="114" rx="5" fill="#000a"/>` + [0, 1, 2, 3, 4].map(i => `<rect x="268" y="${50 + i * 14}" width="${i === 4 ? 90 : 160}" height="5" fill="#fff"/>`).join('') + `<text x="268" y="134" font-size="11" fill="#ffd257">▶ 川へ行く</text><text x="280" y="147" font-size="11" fill="#fff">山へ行く</text>`) + '<text x="350" y="190" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e3a7b">サウンドノベル</text>')],
  ratio: ['画面の形', '読むときの画面の形です。ふつうは「16:9（横長）」。昔のゲームのような形にしたいときは「4:3」をえらびます。あとで変えることもできます。',
    SVGW('<rect x="20" y="50" width="240" height="135" rx="8" fill="#e3eaf8" stroke="#1e3a7b" stroke-width="3"/><text x="140" y="125" text-anchor="middle" font-size="24" font-weight="bold" fill="#1e3a7b">16:9</text><rect x="290" y="50" width="160" height="120" rx="8" fill="#fff3e0" stroke="#f08c00" stroke-width="3"/><text x="370" y="118" text-anchor="middle" font-size="24" font-weight="bold" fill="#c46d00">4:3</text>')]
};
function newWorkDialog() {
  const o = { title: '', author: '', title_: true, long: true, branch: true, flag: false, mode: 'window', ratio: '16:9' };
  let m, cur = 'title';
  const ti = h('input', { class: 'inp sm', maxlength: 30, placeholder: '作品のタイトル' });
  const au = h('input', { class: 'inp sm', maxlength: 16, placeholder: '作者名（ニックネームでもOK）' });
  const right = h('div', { class: 'wz-right' });
  const left = h('div', { class: 'wz-left' }, h('div', { class: 'dlg-title' }, '新しく作る'));
  const rows = [];
  const showHelp = k => { cur = k; const [t, d, svg] = WZ_HELP[k]; right.innerHTML = ''; right.append(h('div', { class: 'ex-t' }, t), h('div', { class: 'ex-d' }, d), h('div', { html: svg })); rows.forEach(r => r.classList.toggle('cur', r._help === k)); };
  const mk = (label, help, ...kids) => { const r = h('div', { class: 'wz2-row' }, h('div', { class: 'wz2-l' }, label), ...kids); r._help = help; r.onmouseenter = () => showHelp(help); r.onclick = () => showHelp(help); rows.push(r); left.appendChild(r); return r; };
  const choice = (key, label, opts) => {
    const r = mk(label, key, ...opts.map(([v, lb, icn]) => { const b = btn(icn, lb, () => { o[key] = v; draw(); }); b._v = v; return b; }));
    r._upd = () => $$('.btn', r).forEach(b => { b.classList.toggle('on', o[key] === b._v); });
    r._key = key; return r;
  };
  ti.onfocus = () => showHelp('title'); au.onfocus = () => showHelp('title');
  mk('タイトル', 'title', ti); mk('作者名', 'title', au);
  const rs = [choice('title_', 'タイトル画面', [[true, 'つける', 'check'], [false, 'つけない', 'x']]),
    choice('long', 'シナリオの長さ', [[true, '長いシナリオ', 'map'], [false, '1話完結', 'text']]),
    choice('branch', '選択肢で分岐', [[true, 'する', 'branch'], [false, 'しない', 'arrow']]),
    choice('flag', 'イベントフラグ', [[true, '使う', 'flag'], [false, '使わない', 'x']]),
    choice('mode', '文章の出し方', [['window', 'ウインドウ', 'text'], ['novel', 'サウンドノベル', 'book']]),
    choice('ratio', '画面の形', [['16:9', '16:9（横長）', 'image'], ['4:3', '4:3', 'image']])];
  function draw() {
    if (!o.long) { o.branch = false; o.flag = false; }
    if (!o.branch) o.flag = false;
    rs.forEach(r => r._upd());
    const [, , r2, r3] = rs;
    r2.classList.toggle('dim', !o.long); r3.classList.toggle('dim', !o.branch);
    $$('.btn', r2).forEach(b => b.disabled = !o.long); $$('.btn', r3).forEach(b => b.disabled = !o.branch);
  }
  draw(); showHelp('title');
  m = openModal(h('div', { class: 'dlg dlg-wz2' }, left, right,
    h('div', { class: 'wz-btns' },
      btn('check', '作る', async () => {
        o.title = ti.value.trim() || 'むだい'; o.author = au.value.trim();
        const w = newWork(o); await saveWork(w); closeModal(m); openEditor(w);
      }, 'pri'),
      btn('x', 'やめる', () => closeModal(m)))));
  setTimeout(() => ti.focus(), 50);
}
/* ---- 設定 ---- */
function openSettings() {
  let m, tab = 0;
  const body = h('div', { class: 'set-body' });
  const tabs = h('div', { class: 'set-tabs' });
  const T = [['sliders', '表示・再生', ['speed', 'size', 'width', 'wait', 'uifs']], ['sound', '音・データ', ['bgm', 'se']]];
  function draw() {
    tabs.innerHTML = ''; body.innerHTML = '';
    T.forEach((t, i) => tabs.appendChild(btn(t[0], t[1], () => { tab = i; draw(); }, i === tab ? 'on' : '')));
    for (const k of T[tab][2]) {
      const d = SET_OPT[k];
      body.appendChild(h('div', { class: 'set-row' }, h('div', { class: 'set-l' }, d.label),
        d.names.map((n, i) => btn(SET[k] === i ? 'check' : null, n, () => { SET[k] = i; saveSet(); auVol(); draw(); settingsChanged(k); }, SET[k] === i ? 'on' : ''))));
    }
    if (tab === 1) {
      const cur = curOpenWork();
      body.appendChild(h('div', { class: 'set-row set-data' },
        btn('home', 'タイトルへ', async () => { closeModal(m); if (P.typing) stopTyping(); gotoTitle(); }),
        cur ? btn('down', '作品を書き出す', () => exportWork(cur)) : btnOff('down', '作品を書き出す', '作品を開いているときに使えます'),
        btn('load', '作品を読みこむ', async () => { closeModal(m); await importDialog(); })));
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
  if (k === 'uifs') { applyUis(); if ($('#scr-edit').classList.contains('show')) editorRefresh(); }
  if (['size', 'width'].includes(k)) {
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
function applyUis() { $('#stage').style.setProperty('--uis', sv('uifs')); }
window.addEventListener('DOMContentLoaded', () => { applyUis(); fitStage(); gotoTitle(); });
