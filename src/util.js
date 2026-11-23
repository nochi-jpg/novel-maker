'use strict';
/* ===== util ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  addKids(el, kids);
  return el;
}
function addKids(el, kids) {
  for (const c of kids) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) addKids(el, c);
    else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clone = o => JSON.parse(JSON.stringify(o));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = ms => new Promise(r => setTimeout(r, ms));
function fmtDate(t) {
  if (!t) return '';
  const d = new Date(t), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
/* ボタン（アイコン＋文字） */
function btn(icon, label, onclick, cls = '') {
  return h('button', { class: 'btn ' + cls, onclick }, icon ? ic(icon) : null, label ? h('span', null, label) : null);
}
/* トースト */
let toastTimer = 0;
function toast(msg, ms = 2400) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}
/* モーダル */
function openModal(dlg, opts = {}) {
  const m = h('div', { class: 'modal' }, dlg);
  if (opts.close) m.addEventListener('pointerdown', e => { if (e.target === m) closeModal(m); });
  $('#stage').appendChild(m);
  return m;
}
function closeModal(m) { if (m && m.parentNode) m.remove(); }
/* 確認ダイアログ：buttons=[{label,value,icon,cls}] */
function ask(msg, buttons, sub) {
  return new Promise(res => {
    let m;
    const row = h('div', { class: 'dlg-btns' }, buttons.map(b =>
      btn(b.icon, b.label, () => { closeModal(m); res(b.value); }, b.cls || '')));
    m = openModal(h('div', { class: 'dlg dlg-ask' },
      h('div', { class: 'dlg-msg' }, msg),
      sub ? h('div', { class: 'dlg-sub' }, sub) : null, row));
  });
}
const okAsk = (msg, sub) => ask(msg, [{ label: 'はい', value: true, icon: 'check' }, { label: 'いいえ', value: false, icon: 'x' }], sub);
/* ファイル選択 */
function pickFiles(accept, multiple = true) {
  return new Promise(res => {
    const i = h('input', { type: 'file', accept, style: 'display:none' });
    if (multiple) i.multiple = true;
    i.onchange = () => { res([...i.files]); i.remove(); };
    document.body.appendChild(i); i.click();
  });
}
function readAsDataURL(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}
function readAsText(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); });
}
function download(name, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
/* 画像の縮小：背景はJPEG、人物は透明を残す（WebP） */
function shrinkImage(dataURL, kind) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const maxW = kind === 'ch' ? 1000 : 1280, maxH = kind === 'ch' ? 1000 : 960;
      const s = Math.min(1, maxW / img.width, maxH / img.height);
      const w = Math.round(img.width * s), hh = Math.round(img.height * s);
      const c = document.createElement('canvas'); c.width = w; c.height = hh;
      const g = c.getContext('2d');
      if (kind !== 'ch') { g.fillStyle = '#fff'; g.fillRect(0, 0, w, hh); }
      g.drawImage(img, 0, 0, w, hh);
      let out = kind === 'ch' ? c.toDataURL('image/webp', 0.9) : c.toDataURL('image/jpeg', 0.85);
      if (kind === 'ch' && !out.startsWith('data:image/webp')) out = c.toDataURL('image/png');
      res({ data: out, w, h: hh });
    };
    img.onerror = rej; img.src = dataURL;
  });
}
const dataSize = d => Math.round((d.length - d.indexOf(',') - 1) * 0.75);
const fmtSize = b => b >= 1048576 ? (b / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB';
