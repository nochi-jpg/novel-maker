/* ===== 保存（IndexedDB）と作品データ ===== */
const DB_NAME = window.VIEW_WORK ? 'novelmaker-view' : 'novelmaker-edu', APP_ID = 'novel-maker-edu', FILE_VER = 1;
let _db = null;
function dbOpen() {
  if (_db) return Promise.resolve(_db);
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains('works')) d.createObjectStore('works', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('media')) d.createObjectStore('media', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('saves')) d.createObjectStore('saves');
    };
    r.onsuccess = () => { _db = r.result; res(_db); };
    r.onerror = () => rej(r.error);
  });
}
async function dbReq(store, mode, fn) {
  const d = await dbOpen();
  return new Promise((res, rej) => {
    const tx = d.transaction(store, mode), st = tx.objectStore(store);
    const r = fn(st);
    tx.oncomplete = () => res(r && 'result' in r ? r.result : undefined);
    tx.onerror = () => rej(tx.error);
  });
}
const dbGet = (s, k) => dbReq(s, 'readonly', st => st.get(k));
const dbPut = (s, v, k) => dbReq(s, 'readwrite', st => k === undefined ? st.put(v) : st.put(v, k));
const dbDel = (s, k) => dbReq(s, 'readwrite', st => st.delete(k));
const dbAll = s => dbReq(s, 'readonly', st => st.getAll());
const dbKeys = s => dbReq(s, 'readonly', st => st.getAllKeys());

/* ---- 作品データ ---- */
const DEF_THEME = { ui: '#1e3a7b', win: '#1e3a7b', tx: '#ffffff', ch: '#1e3a7b', alpha: 1 };
function newBlock(ep, slot) {
  return { id: uid(), ep, slot, text: '', cues: {}, end: { type: 'end', to: null, choices: [{ label: '', to: null }, { label: '', to: null }], rules: [], else: null, name: '' } };
}
function newWork(o) {
  const w = {
    app: APP_ID, ver: FILE_VER, id: uid(), title: o.title || 'むだい', author: o.author || '', editable: true,
    ratio: o.ratio || '16:9', opts: { title: !!o.title_, long: !!o.long, branch: !!o.branch, flag: !!o.flag, name: false, mode: o.mode || 'window' },
    theme: clone(DEF_THEME), titleImg: null, blocks: {}, media: [], folders: { bg: [], ch: [], se: [], bgm: [] }, created: Date.now(), updated: Date.now()
  };
  const b = newBlock(1, 0); w.blocks[b.id] = b;
  return w;
}
function startBlock(w) { return Object.values(w.blocks).find(b => b.ep === 1 && b.slot === 0) || Object.values(w.blocks)[0]; }
function blocksSorted(w) { return Object.values(w.blocks).sort((a, b) => a.ep - b.ep || a.slot - b.slot); }
function blockAt(w, ep, slot) { return Object.values(w.blocks).find(b => b.ep === ep && b.slot === slot); }
function blockLabel(w, b) {
  if (!b) return '?';
  if (!w.opts.long) return '本文';
  if (b.ep === 1) return '1';
  const n = Object.values(w.blocks).filter(x => x.ep === b.ep).length;
  return (n === 1 && b.slot === 0) ? String(b.ep) : `${b.ep}-${b.slot + 1}`;
}
const CHOICE_ABC = ['A', 'B', 'C'];
function maxEp(w) { return Math.max(1, ...Object.values(w.blocks).map(b => b.ep)); }
/* 素材 */
const SAMPLE_MAP = {};
for (const x of [...SAMPLE_BG, ...SAMPLE_CH]) SAMPLE_MAP[x.id] = x;
function mediaSrc(id) { return id ? (SAMPLE_MAP[id] ? SAMPLE_MAP[id].data : MEDIA[id]) : null; }
function mediaName(w, id) {
  if (!id) return '';
  if (id === 'none') return 'なし';
  if (SAMPLE_MAP[id]) return SAMPLE_MAP[id].name;
  if (id === 'stop' || SE_MAP[id] || BGM_MAP[id]) return soundName(w, id);
  const m = w && w.media.find(x => x.id === id); return m ? m.name : '（消えた素材）';
}
function fixWork(w) {
  w.folders = w.folders || {}; for (const k of ['bg', 'ch', 'se', 'bgm']) w.folders[k] = w.folders[k] || [];
  for (const m of w.media) if (m.folder == null) m.folder = '';
  w.opts.mode = w.opts.mode || 'window';
  if (w.opts.endList == null) w.opts.endList = true;
  w.theme = Object.assign({}, DEF_THEME, { win: w.theme.ui, ch: w.theme.ui }, w.theme);
  return w;
}
const MEDIA = {}; // id -> dataURL（いま開いている作品の分）
async function loadMediaFor(w) {
  for (const k in MEDIA) delete MEDIA[k];
  for (const m of w.media) { const r = await dbGet('media', m.id); if (r) MEDIA[m.id] = r.data; }
}
async function saveWork(w) { w.updated = Date.now(); await dbPut('works', w); }
async function deleteWork(w) {
  for (const m of w.media) await dbDel('media', m.id);
  const keys = await dbKeys('saves');
  for (const k of keys) if (String(k).startsWith(w.id + ':')) await dbDel('saves', k);
  await dbDel('works', w.id);
}
/* 書き出し */
async function exportWork(w) {
  const media = {};
  for (const m of w.media) { const r = await dbGet('media', m.id); if (r) media[m.id] = r.data; }
  const out = clone(w); delete out.recv;
  const json = JSON.stringify({ app: APP_ID, version: FILE_VER, work: out, media });
  const name = (w.title || 'sakuhin').replace(/[\\/:*?"<>|]/g, '_') + '.json';
  download(name, json);
  toast('「' + name + '」を書き出しました');
}
/* 書き出し：形をえらぶ */
async function exportDialog(w) {
  const r = await ask('どの形で書き出しますか？', [
    { label: '作品ファイル（JSON）', value: 'json', icon: 'down' },
    { label: '見るだけのHTML', value: 'html', icon: 'play' },
    { label: 'やめる', value: null, icon: 'x' }],
    '作品ファイル：友だちのアプリに読みこんで、読んだり改造したりできます。\n見るだけのHTML：ダブルクリックするだけで読めます（パソコンの横画面用）。');
  if (r === 'json') await exportWork(w);
  else if (r === 'html') await exportViewer(w);
}
/* 見るだけのHTML：アプリの読む部分＋作品＋素材を1本にまとめる */
async function exportViewer(w) {
  if (!PAGE_SRC) { toast('ここでは書き出せません'); return; }
  toast('見るだけのHTMLを作っています…');
  const media = {};
  for (const m of w.media) { const r = await dbGet('media', m.id); if (r) media[m.id] = r.data; }
  const out = clone(w); delete out.recv;
  const used = new Set((JSON.stringify(out).match(/"I:[^"]+"/g) || []).map(s => s.slice(1, -1)));
  const B = '/*NM-SAMPLES' + '{*/', Z = '/*}' + 'NM-SAMPLES*/';
  const a = PAGE_SRC.indexOf(B), z = PAGE_SRC.indexOf(Z, a);
  if (a < 0 || z < 0) { toast('書き出しに失敗しました'); return; }
  const js = v => JSON.stringify(v).replace(/<\//g, '<\\/').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const mid = B + '\nwindow.VIEW_WORK=' + js({ work: out, media }) + ';\nconst SAMPLE_BG=' + js(SAMPLE_BG.filter(x => used.has(x.id))) +
    ';\nconst SAMPLE_CH=' + js(SAMPLE_CH.filter(x => used.has(x.id))) + ';\nconst SAMPLE_CHARS=' + js(SAMPLE_CHARS) + ';\nconst LOGO_SRC="";\n';
  let html = PAGE_SRC.slice(0, a) + mid + PAGE_SRC.slice(z);
  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  html = html.replace(/<title>[^<]*<\/title>/, '<title>' + esc(w.title || 'むだい') + '</title>');
  const name = (w.title || 'sakuhin').replace(/[\\/:*?"<>|]/g, '_') + '.html';
  download(name, html, 'text/html');
  toast('「' + name + '」を書き出しました（' + (html.length / 1048576).toFixed(1) + 'MB）');
}
/* 見るだけのHTMLをひらいたとき */
async function bootView() {
  const { work: w, media } = window.VIEW_WORK;
  fixWork(w);
  for (const id in media) await dbPut('media', { id, wid: w.id, data: media[id] });
  await dbPut('works', w);
  playWork(w, { view: true });
}
/* 読みこみ */
async function importFile(file) {
  let obj;
  try { obj = JSON.parse(await readAsText(file)); } catch (e) { toast('読みこめませんでした（作品ファイルではありません）'); return null; }
  if (!obj || obj.app !== APP_ID || !obj.work || !obj.work.blocks) { toast('このアプリの作品ファイルではありません'); return null; }
  const w = obj.work, media = obj.media || {};
  const old = await dbGet('works', w.id);
  if (old) {
    const r = await ask('同じ作品がすでにあります。どうしますか？', [
      { label: 'うわがき', value: 'over', icon: 'refresh' },
      { label: '別の作品にする', value: 'new', icon: 'copy' },
      { label: 'やめる', value: 'no', icon: 'x' }], '「' + old.title + '」');
    if (r === 'no') return null;
    if (r === 'over') await deleteWork(old);
    else {
      // 別の作品として入れる：作品idと素材idを付けかえる
      const map = {};
      w.id = uid();
      for (const m of w.media) { const n = uid(); map[m.id] = n; media[n] = media[m.id]; delete media[m.id]; m.id = n; }
      const re = v => (v && map[v]) ? map[v] : v;
      w.titleImg = re(w.titleImg);
      for (const b of Object.values(w.blocks)) for (const li in b.cues) {
        const c = b.cues[li];
        if (c.bg) c.bg = re(c.bg); if (c.se) c.se = re(c.se); if (c.bgm) c.bgm = re(c.bgm);
        if (c.ch) for (const s in c.ch) c.ch[s].m = re(c.ch[s].m);
      }
    }
  }
  w.recv = true; fixWork(w);
  for (const m of w.media) if (media[m.id]) await dbPut('media', { id: m.id, wid: w.id, data: media[m.id] });
  await dbPut('works', w);
  toast('「' + w.title + '」を読みこみました');
  return w;
}
/* 設定（端末ごと） */
const SET_DEF = { speed: 1, size: 1, width: 1, alpha: 1, wait: 1, bgm: 1, se: 1, uifs: 1 };
const SET_OPT = {
  speed: { label: '文字送りの速さ', names: ['おそい', 'ふつう', 'はやい', 'いっき'], vals: [60, 30, 12, 0] },
  size: { label: '文字の大きさ', names: ['小', '中', '大'], vals: [28, 34, 40] },
  width: { label: 'ウインドウの横はば', names: ['せまい', 'ふつう', 'ひろい'], vals: [0.12, 0.03125, 0.01] },
  alpha: { label: 'ウインドウのこさ', names: ['こい', 'ふつう', 'うすい', 'とてもうすい'], vals: [0.92, 0.78, 0.6, 0.4] },
  wait: { label: 'オートの待ち時間', names: ['みじかい', 'ふつう', 'ながい'], vals: [800, 1600, 2800] },
  uifs: { label: '画面の文字の大きさ', names: ['小', '中', '大'], vals: [0.8, 0.9, 1] },
  bgm: { label: 'BGMの音量', names: ['大', '中', '小', 'なし'], vals: [1, 0.6, 0.3, 0] },
  se: { label: '効果音の音量', names: ['大', '中', '小', 'なし'], vals: [1, 0.6, 0.3, 0] }
};
let SET = Object.assign({}, SET_DEF);
try { Object.assign(SET, JSON.parse(localStorage.getItem('nme_set') || '{}')); } catch (e) {}
const sv = k => SET_OPT[k].vals[clamp(SET[k], 0, SET_OPT[k].vals.length - 1)];
function saveSet() { try { localStorage.setItem('nme_set', JSON.stringify(SET)); } catch (e) {} }
