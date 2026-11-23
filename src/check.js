/* ===== フラグ判定と矛盾チェック ===== */
// atom: {t:'chose'|'notchose'|'pass'|'notpass', b:blockId, c:0-2}
// rule: {groups:[[atom,...],...], to}  groups は「または」、group の中は「かつ」
function atomTrue(a, has) {
  if (a.t === 'pass') return has('p:' + a.b);
  if (a.t === 'notpass') return !has('p:' + a.b);
  if (a.t === 'chose') return has('c:' + a.b + ':' + a.c);
  if (a.t === 'notchose') return !has('c:' + a.b + ':' + a.c);
  return false;
}
function ruleTrue(r, has) { return r.groups.some(g => g.length && g.every(a => atomTrue(a, has))); }
function histHas(hist) {
  const s = new Set();
  for (const e of hist) { s.add('p:' + e.b); if (e.c != null) s.add('c:' + e.b + ':' + e.c); }
  return k => s.has(k);
}
function atomText(w, a) {
  const b = w.blocks[a.b], lb = b ? blockLabel(w, b) : '？';
  if (a.t === 'pass') return `${lb}を通った`;
  if (a.t === 'notpass') return `${lb}を通っていない`;
  const ch = b && b.end.choices[a.c], nm = CHOICE_ABC[a.c] + (ch && ch.label ? `「${ch.label}」` : '');
  return a.t === 'chose' ? `${lb}で${nm}を選んだ` : `${lb}で${nm}を選んでいない`;
}
function ruleText(w, r) {
  if (!r.groups.length || !r.groups.some(g => g.length)) return '（条件がありません）';
  return r.groups.filter(g => g.length).map(g => g.map(a => atomText(w, a)).join(' かつ ')).join(' または ');
}
const ISSUE = {
  stuck: { icon: 'x', color: '#ff6b6b', name: '進行不能' },
  never: { icon: 'warn', color: '#ffa94d', name: '成り立たない条件' },
  unreach: { icon: 'eyeoff', color: '#adb5bd', name: '到達不能' },
  loop: { icon: 'loop', color: '#c084fc', name: 'おわらない' },
  empty: { icon: 'pencil', color: '#ffd43b', name: '未完成' }
};
function analyze(w) {
  const issues = {}; // bid -> [{type,msg}]
  const add = (b, type, msg) => (issues[b] = issues[b] || []).push({ type, msg });
  const blocks = w.blocks, start = startBlock(w);
  // ---- 見ただけでわかる問題 ----
  for (const b of Object.values(blocks)) {
    if (!b.text.trim()) add(b.id, 'empty', '本文がありません');
    const e = b.end, ok = id => id && blocks[id];
    if (e.type === 'next' && !ok(e.to)) add(b.id, 'stuck', '「次へ」の行き先が決まっていません');
    if (e.type === 'choice') e.choices.forEach((c, i) => {
      if (!ok(c.to)) add(b.id, 'stuck', `選択肢${CHOICE_ABC[i]}の行き先が決まっていません`);
      if (!c.label.trim()) add(b.id, 'empty', `選択肢${CHOICE_ABC[i]}の文字がありません`);
    });
    if (e.type === 'cond') {
      e.rules.forEach((r, i) => {
        if (!ok(r.to)) add(b.id, 'stuck', `条件${i + 1}の行き先が決まっていません`);
        if (!r.groups.some(g => g.length)) add(b.id, 'empty', `条件${i + 1}の中身がありません`);
      });
    }
  }
  // ---- ルートを全部たどる ----
  const used = new Set();
  for (const b of Object.values(blocks)) if (b.end.type === 'cond') for (const r of b.end.rules) for (const g of r.groups) for (const a of g)
    used.add(a.t.includes('pass') ? 'p:' + a.b : 'c:' + a.b + ':' + a.c);
  const keys = [...used], idx = Object.fromEntries(keys.map((k, i) => [k, i]));
  const LIMIT = 60000;
  const states = new Map(), succ = [], term = [], fired = {}, reach = new Set();
  const enc = (b, f) => b + '|' + f.join('');
  const q = [];
  function visit(bid, f) {
    const nf = f.slice(); if (idx['p:' + bid] != null) nf[idx['p:' + bid]] = 1;
    const k = enc(bid, nf);
    if (states.has(k)) return states.get(k);
    const n = states.size; states.set(k, n); succ[n] = []; q.push([n, bid, nf]); return n;
  }
  let limited = false;
  if (start) visit(start.id, new Array(keys.length).fill(0));
  while (q.length) {
    if (states.size > LIMIT) { limited = true; break; }
    const [n, bid, f] = q.shift(); const b = blocks[bid]; reach.add(bid);
    const has = k => idx[k] != null ? !!f[idx[k]] : false;
    const e = b.end, go = (to, ff = f) => { if (to && blocks[to]) succ[n].push(visit(to, ff)); else term[n] = 'stuck'; };
    if (e.type === 'end') term[n] = 'end';
    else if (e.type === 'next') go(e.to);
    else if (e.type === 'choice') e.choices.forEach((c, i) => { const ff = f.slice(); const k = 'c:' + bid + ':' + i; if (idx[k] != null) ff[idx[k]] = 1; go(c.to, ff); });
    else if (e.type === 'cond') {
      let hit = -1;
      for (let i = 0; i < e.rules.length; i++) if (ruleTrue(e.rules[i], has)) { hit = i; break; }
      (fired[bid] = fired[bid] || new Set()).add(hit);
      go(hit >= 0 ? e.rules[hit].to : e.else);
    }
  }
  const elseUsed = {};
  for (const b of Object.values(blocks)) if (b.end.type === 'cond') {
    const used = limited || (fired[b.id] && fired[b.id].has(-1));
    elseUsed[b.id] = !!used;
    if (used && !(b.end.else && blocks[b.end.else])) add(b.id, 'stuck', 'どの条件にも当てはまらないルートがあります。「どれにも当てはまらない」の行き先を決めてください');
  }
  if (!limited) {
    for (const b of Object.values(blocks)) {
      if (!reach.has(b.id)) { add(b.id, 'unreach', 'どのルートからもたどり着けません'); continue; }
      if (b.end.type === 'cond') b.end.rules.forEach((r, i) => {
        if (r.groups.some(g => g.length) && !(fired[b.id] && fired[b.id].has(i))) add(b.id, 'never', `条件${i + 1}は、どのルートでも成り立ちません（前の条件に先に当てはまる場合もふくむ）`);
      });
    }
    // おわり（またはとちゅうで止まる所）にたどり着けない状態
    const N = states.size, pred = Array.from({ length: N }, () => []);
    for (let i = 0; i < N; i++) for (const j of succ[i] || []) pred[j].push(i);
    const ok = new Uint8Array(N), st = [];
    for (let i = 0; i < N; i++) if (term[i]) { ok[i] = 1; st.push(i); }
    while (st.length) { const i = st.pop(); for (const p of pred[i]) if (!ok[p]) { ok[p] = 1; st.push(p); } }
    const loopB = new Set();
    for (const [k, i] of states) if (!ok[i]) loopB.add(k.split('|')[0]);
    for (const bid of loopB) add(bid, 'loop', 'ここから先、おわりにたどり着けないルートがあります（ぐるぐる回ります）');
  }
  let count = 0; for (const k in issues) count += issues[k].length;
  return { issues, count, limited, reach, elseUsed };
}
