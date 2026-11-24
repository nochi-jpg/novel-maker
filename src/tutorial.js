/* ===== チュートリアル（実際の画面を操作しながら覚える） =====
   ・光らせた場所と「やめる」以外の入力はうけつけない
   ・練習用の作品は保存しない（w.tut = true の作品は saveWork で保存されない）
   ・文字の入力はいらない（文章や選択肢の言葉は、こちらで入れておく） */
const TUT = { on: false, ch: null, i: 0, steps: [], layer: null, clicked: false, clicks: 0, paused: false, cur: null, raf: 0, hole: null, box: null };
const TUT_KEY = 'app:tut';
const tq = (sel, root) => (root || document).querySelector(sel);
const tqa = (sel, root) => [...(root || document).querySelectorAll(sel)];
/* 文字で探す（ボタンなど） */
const byText = (sel, text, exact = true) => tqa(sel).find(el => { const t = el.textContent.replace(/\s+/g, ''); return exact ? t === text : t.includes(text); }) || null;
const cardOf = bid => tq(`.bcard[data-bid="${bid}"]`);
const shown = id => { const s = tq('#scr-' + id); return !!(s && s.classList.contains('show')); };

/* ---------- 練習用の作品 ---------- */
const TXT = {
  a: '【ゆい】おはよう！　今日から新しい学校だね。\n【けん】うん、ちょっとドキドキするよ。\n\n二人は、校門の前で立ち止まった。\n大きな桜の木が、風にゆれている。\n\n【ゆい】さあ、行こう！',
  b: '教室に入ると、みんながこちらを見た。\n【先生】今日から仲間になる、ゆいさんです。\n\n【ゆい】よろしくおねがいします！',
  fork: '森の中で、道が二つに分かれていた。\n右の道は明るく、左の道は少し暗い。\n\nどちらへ進もうか。',
  right: '右の道を進むと、花畑に出た。\nきれいな花が、一面にさいている。',
  left: '左の道を進むと、小さな小屋があった。\n中から、あたたかい光がもれている。'
};
function tutWork(o = {}) {
  const w = newWork({ title: 'チュートリアルの作品', author: 'チュートリアル', title_: !!o.title, long: true, branch: !!o.branch, flag: !!o.flag, mode: 'window', ratio: '16:9' });
  w.tut = true; w.opts.name = o.name !== false; w.opts.endList = false;
  return w;
}
function tb(w, ep, slot, text, end) {
  const b = ep === 1 && slot === 0 ? startBlock(w) : newBlock(ep, slot);
  b.text = text || ''; if (end) Object.assign(b.end, end);
  w.blocks[b.id] = b; return b;
}
async function tutOpen(w, tab, extra) {
  await openEditor(w);
  if (extra) extra();
  E.tab = tab; editorRefresh();
}

/* ---------- 台本の部品 ---------- */
// t: 説明（敬語）　s: 光らせる場所（関数、いくつでも）　w: 'next' | 'click' | 進む条件の関数　do: 始めにすること
const S = (t, s, o = {}) => ({ t, s: s ? [].concat(s) : [], w: 'next', ...o });
const C = (t, s, until, o = {}) => ({ t, s: [].concat(s), w: until || 'click', ...o });
const el = sel => () => tq(sel);
const txt = (sel, text, exact) => () => byText(sel, text, exact);
const step = k => () => byText('.step', k, false);
const tabBtn = k => () => byText('.kind-tabs .btn', k);
const lcard = name => () => tqa('.lcard').find(x => { const n = tq('.lc-n', x); return n && n.textContent.replace(/（\d+）$/, '') === name; }) || null;
const BACK = () => tq('.ed-head .btn.tl');
const TRY = () => byText('.ed-head .btn', 'ためす');
const playTry = () => [C('「ためす」を押して、読む画面で見てみましょう。', TRY, () => shown('play'))];
const backFromPlay = () => C('読む画面の「もどる」を押すと、作る画面にもどります。', el('#pb-back'), () => shown('edit'));
// 読む画面で、ウインドウを押して進める
const tAdvance = (t, n = 3) => C(t, el('#pwin'), () => TUT.clicks >= n, { count: true });
// マップのカードが見えるように横スクロールする
function mapShow(bid) {
  const c = cardOf(bid), sc = tq('.map-scroll'); if (!c || !sc) return;
  const x = c.offsetLeft;
  if (x < sc.scrollLeft + 10 || x + c.offsetWidth > sc.scrollLeft + sc.clientWidth - 10) {
    sc.scrollTo({ left: Math.max(0, x - 120), behavior: 'smooth' });
  }
}

/* ---------- 章 ---------- */
const TUT_CH = [
  /* ===== 初級 ===== */
  { lv: 0, n: 1, name: 'プロジェクトの始め方と設定', async setup() { gotoTitle(); }, steps: () => [
    S('ようこそ。ここでは、ノベルゲームメーカーの使い方を、実際の画面を動かしながら説明します。<br>文字を入力する必要はありません。<b>光っているところ</b>を押して進めてください。'),
    S('このアプリでは、次の4つの段階でお話を作ります。<br><b>1 お話をつなぐ → 2 文章を書く → 3 絵と音 → 4 しあげ・送る</b><br>まずは、新しい作品を作ってみましょう。'),
    C('「作る」を押してください。', txt('#scr-title .btn', '作る'), () => shown('select')),
    C('「新しく作る」を押してください。', el('.card-new'), () => !!tq('.dlg-wz2')),
    S('作品の名前と作者名は、こちらで入れておきました。<br>作者名はニックネームでもかまいません。友だちに送ると、相手の画面にも出ます。', [() => tqa('.wz2-row')[0], () => tqa('.wz2-row')[1]]),
    C('<b>タイトル画面</b>：お話の最初に、タイトルと「はじめから」などのボタンを出すかを決めます。<br>「つける」を押してください。右に図の説明が出ます。', txt('.wz2-row .btn', 'つける'), null, { do: () => byText('.wz2-l', 'タイトル画面').parentNode.click() }),
    C('<b>シナリオの長さ</b>：お話をいくつかのブロックに分けて、線でつなぐのが「長いシナリオ」です。<br>「長いシナリオ」を押してください。', txt('.wz2-row .btn', '長いシナリオ'), null, { do: () => byText('.wz2-l', 'シナリオの長さ').parentNode.click() }),
    C('<b>選択肢で分岐</b>：とちゅうで選択肢を出して、お話を分けられるようにします。<br>「する」を押してください。', txt('.wz2-row .btn', 'する'), null, { do: () => byText('.wz2-l', '選択肢で分岐').parentNode.click() }),
    S('<b>イベントフラグ</b>：前にえらんだ答えによって、あとの行き先を変えるしくみです。<br>なれてから使うのがおすすめなので、今は「使わない」のままにします。', () => byText('.wz2-l', 'イベントフラグ').parentNode, { do: () => byText('.wz2-l', 'イベントフラグ').parentNode.click() }),
    C('<b>文章の出し方</b>：画面の下のまどに出す「ウインドウ」と、画面全体に出す「サウンドノベル」があります。<br>「ウインドウ」を押してください。', txt('.wz2-row .btn', 'ウインドウ'), null, { do: () => byText('.wz2-l', '文章の出し方').parentNode.click() }),
    S('<b>画面の形</b>：ふつうは「16:9（横長）」です。<br>ここで決めたことは、あとから「しあげ・送る」でいつでも変えられます。', () => byText('.wz2-l', '画面の形').parentNode, { do: () => byText('.wz2-l', '画面の形').parentNode.click() }),
    C('「作る」を押してください。', () => byText('.wz-btns .btn', '作る'), () => shown('edit')),
    S('作品ができて、作る画面になりました。<br>上にならんでいるのが<b>4つの段階</b>です。いまいる段階が、色で光っています。', el('.steps')),
    S('ここは「お話をつなぐ」画面です。お話を<b>ブロック</b>に分けて、線でつないでいきます。', el('.map-scroll')),
    S('右のパネルでは、えらんだブロックの設定をします。', el('#scr-edit .panel')),
    S('下の<b>案内バー</b>には、次にすることが出ます。こまったときは、ここを見てください。', el('#guide')),
    S('作品は自動で保存されます（チュートリアルの作品は保存されません）。<br>これで、この章はおわりです。')
  ] },
  { lv: 0, n: 2, name: 'メニュー画面と行き来のしかた', async setup() {
    const w = tutWork(); const a = tb(w, 1, 0, TXT.a); const b = tb(w, 2, 0, TXT.b); a.end.type = 'next'; a.end.to = b.id;
    await tutOpen(w, 'map');
  }, steps: () => [
    S('この章では、作る画面の<b>行き来のしかた</b>を覚えます。<br>上の4つの段階は、押すとその画面へ移動できます。', el('.steps')),
    C('「2 文章を書く」を押してください。', step('文章を書く'), () => E.tab === 'text'),
    C('次は「3 絵と音」を押してください。', step('絵と音'), () => E.tab === 'fx'),
    C('「4 しあげ・送る」を押してください。', step('しあげ・送る'), () => E.tab === 'work'),
    C('左上の「もどる」を押すと、<b>1つ前の段階</b>にもどります。押してください。', BACK, () => E.tab === 'fx'),
    C('となりの<b>家のボタン</b>を押すと、いっきに「1 お話をつなぐ」へもどれます。押してください。', () => tqa('.ed-head .btn').find(b => b.title === 'お話をつなぐ画面へ'), () => E.tab === 'map'),
    S('「お話をつなぐ」の画面で「もどる」を押すと、作品えらびの画面にもどります。', BACK),
    S('「ためす」を押すと、いつでも読む画面でためせます。', TRY),
    S('「設定」では、ボタンの文字の大きさや、音の大きさを変えられます。', () => tq('.ed-head .btn.tr')),
    S('ブロックのパネルにも「文章を書く」「絵と音をつける」のボタンがあり、ここからも移動できます。', [txt('#scr-edit .panel .btn', '文章を書く'), txt('#scr-edit .panel .btn', '絵と音をつける')]),
    S('これで、この章はおわりです。')
  ] },
  { lv: 0, n: 3, name: 'ブロックの始め方と、文章の書き方', async setup() {
    const w = tutWork(); tb(w, 1, 0, TXT.a); TUT.w = w;
    await tutOpen(w, 'map');
  }, steps: () => [
    S('お話は<b>ブロック</b>に分けて書きます。これはエピソード1のブロックです。<br>文章は、こちらで入れておきました。', () => cardOf(startBlock(E.w).id)),
    C('となりの「ここに作る」を押すと、新しいブロックができます。押してください。', el('.card-empty'), () => Object.keys(E.w.blocks).length >= 2),
    S('新しいブロックができて、1から線でつながりました。<br>このブロックの文章も、こちらで入れておきました。', () => cardOf(blockAt(E.w, 2, 0).id), { do: () => { blockAt(E.w, 2, 0).text = TXT.b; markDirty(true); } }),
    C('右のパネルの「文章を書く」を押してください。', txt('#scr-edit .panel .btn', '文章を書く'), () => E.tab === 'text'),
    S('ここに文章を書きます。キーボードで打つほか、ほかのアプリで書いた文章をはりつけることもできます。<br>いまは「ブロック 2」の文章が出ています。', el('.ta'), { do: () => { const t = tq('.ta'); if (t) t.blur(); } }),
    S('【ゆい】のように、<b>【　】で名前をかこむ</b>と、読む画面の名前の欄に名前が出ます。', el('.ta')),
    S('<b>空いた行</b>を入れると、そこでページが変わります。1ページには4行まで入ります。<br>右に、書き方のヒントがあります。', [el('.ta'), () => tqa('#scr-edit .panel')[1]]),
    S('下には、いまの行の数とページの数が出ます。', () => tq('#scr-edit .panel .hint')),
    C('上の「‹」で、前のブロックの文章に切りかえられます。押してください。', () => tq('.bnav .btn'), () => E.bid === startBlock(E.w).id),
    ...playTry(),
    tAdvance('メッセージのウインドウを押すと、文章が進みます。<b>3回</b>押してみましょう。'),
    backFromPlay(),
    S('これで、この章はおわりです。')
  ] },
  { lv: 0, n: 4, name: '絵や音楽を入れる', async setup() {
    const w = tutWork(); tb(w, 1, 0, TXT.a);
    await tutOpen(w, 'fx', () => { E.libKind = 'bg'; E.libPath = []; E.libPage = 0; E.libSel = null; E.li = null; E.chSlot = 1; });
  }, steps: () => [
    S('「絵と音」の画面では、<b>行ごと</b>に背景・人物・音をつけます。<br>① 行をえらぶ → ② 入れるものをえらぶ → ③ たしかめる の順に進みます。', () => tqa('#scr-edit .panel').slice(0, 3)),
    C('まず、<b>1行目</b>を押してください。', () => tqa('.ln')[0], () => E.li === 0),
    S('入れるものの種類は、このタブで切りかえます。いまは「背景」です。', el('.kind-tabs')),
    C('「サンプルデータ」のフォルダを押してください。', lcard('サンプルデータ'), () => E.libPath[0] === '@sample'),
    C('背景は、場所の種類ごとにフォルダに分かれています。「学校」を押してください。', lcard('学校'), () => E.libPath[1] === '@g:学校'),
    C('「学校（昼）」を押してください。', lcard('学校（昼）'), () => E.libSel === 'I:bg03'),
    C('「この行に入れる」を押してください。', txt('.btn', 'この行に入れる'), () => !!(curB().cues[0] || {}).bg),
    S('1行目の左に、<b>背景のマーク</b>が付きました。右の「③ たしかめる」にも絵が出ています。', [() => tq('.ln .ln-tags'), () => tqa('#scr-edit .panel')[2]]),
    C('次は人物です。「人物」のタブを押してください。', tabBtn('人物'), () => E.libKind === 'ch'),
    C('「サンプルデータ」のフォルダを押してください。', lcard('サンプルデータ'), () => E.libPath[0] === '@sample'),
    C('「清川 きらら」のフォルダを押してください。', lcard('清川 きらら'), () => E.libPath.length === 2),
    C('表情を1つ、押してください。', () => tqa('.lcard')[0], () => !!E.libSel),
    C('人物を置く場所をえらびます。「中央」を押してください。', txt('#scr-edit .btn', '中央'), () => E.chSlot === 1),
    C('「中央に入れる」を押してください。', txt('.btn', '中央に入れる'), () => !!(curB().cues[0] || {}).ch),
    S('1行目の左に、<b>人物のマーク</b>も付きました。', () => tq('.ln .ln-tags')),
    C('次は音楽です。「BGM」のタブを押してください。', tabBtn('BGM'), () => E.libKind === 'bgm'),
    C('「内蔵の音」のフォルダを押してください。', lcard('内蔵の音'), () => E.libPath[0] === '@builtin'),
    C('「明るい」のフォルダを押してください。', lcard('明るい'), () => E.libPath.length === 2),
    C('「朝」を押してください。曲が流れます（もう一度押すと止まります）。', lcard('朝'), () => E.libSel === 'M:asa'),
    C('「この行に入れる」を押してください。', txt('.btn', 'この行に入れる'), () => (curB().cues[0] || {}).bgm === 'M:asa'),
    S('<b>音楽のマーク</b>が付きました。BGMは、次のBGMを入れるか「止める」まで流れつづけます。', () => tq('.ln .ln-tags'), { do: () => stopBGM() }),
    C('次は効果音です。<b>2行目</b>を押してください。', () => tqa('.ln')[1], () => E.li === 1),
    C('「効果音」のタブを押してください。', tabBtn('効果音'), () => E.libKind === 'se'),
    C('「内蔵の音」のフォルダを押してください。', lcard('内蔵の音'), () => E.libPath[0] === '@builtin'),
    C('「気持ち」のフォルダを押してください。', lcard('気持ち'), () => E.libPath.length === 2),
    C('「びっくり」を押してください。音が鳴ります。', lcard('びっくり'), () => E.libSel === 'S:bikkuri'),
    C('「この行に入れる」を押してください。', txt('.btn', 'この行に入れる'), () => !!(curB().cues[1] || {}).se),
    S('2行目の左に、<b>効果音のマーク</b>が付きました。', () => tqa('.ln .ln-tags')[1]),
    S('「③ たしかめる」では、えらんだ行の画面を見られます。<br>パソコンの画像を、ここに<b>直接ドラッグ＆ドロップ</b>して入れることもできます。', () => tqa('#scr-edit .panel')[2]),
    S('これで、この章はおわりです。', null, { do: () => stopBGM() })
  ] },
  { lv: 0, n: 5, name: 'タイトル画面を作ろう', async setup() {
    const w = tutWork({ title: true }); tb(w, 1, 0, TXT.a);
    await tutOpen(w, 'work');
  }, steps: () => [
    S('タイトル画面は「4 しあげ・送る」で作ります。<br>「タイトル画面」が「つける」になっているときに作れます。', () => byText('.wk-l', 'タイトル画面').parentNode),
    C('「タイトル画面を作る」を押してください。', txt('.btn', 'タイトル画面を作る'), () => E.tab === 'title'),
    S('左が<b>見本</b>です。読む画面のタイトルと同じ見た目になります。', el('.tprev')),
    C('背景を入れます。「サンプルデータ」のフォルダを押してください。', lcard('サンプルデータ'), () => E.libPath[0] === '@sample'),
    C('「学校」のフォルダを押してください。', lcard('学校'), () => E.libPath[1] === '@g:学校'),
    C('「学校（夕方）」を押してください。', lcard('学校（夕方）'), () => E.libSel === 'I:bg02'),
    C('「背景に入れる」を押してください。', txt('.btn', '背景に入れる'), () => !!E.w.tscr.bg),
    C('「人物」のタブを押してください。', tabBtn('人物'), () => E.ttab === 'ch'),
    C('「サンプルデータ」のフォルダを押してください。', lcard('サンプルデータ'), () => E.libPath[0] === '@sample'),
    C('「熊谷 はる」のフォルダを押してください。', lcard('熊谷 はる'), () => E.libPath.length === 2),
    C('表情を1つ、押してください。', () => tqa('.lcard')[0], () => !!E.libSel),
    C('「右」を押してください。', txt('#scr-edit .btn', '右'), () => E.chSlot === 2),
    C('「右に入れる」を押してください。', txt('.btn', '右に入れる'), () => !!E.w.tscr.ch[2]),
    S('左下の一覧で、人物の大きさや高さを変えたり、はずしたりできます。', el('.tlist')),
    C('「文字」のタブを押してください。', tabBtn('文字'), () => E.ttab === 'text'),
    S('タイトルの文字を出すかどうかも決められます。<br>絵の中にタイトルがかいてあるときは「出さない」にします。', () => byText('.wk-l', 'タイトルの文字').parentNode),
    C('文字の位置を変えます。「上」を押してください。', txt('.tcol .btn', '上'), () => E.w.tscr.tpos === 'top'),
    C('「ボタン」のタブを押してください。', tabBtn('ボタン'), () => E.ttab === 'btn'),
    C('「右下にたてならび」を押してください。', () => tqa('.bpos')[1], () => E.w.tscr.bpos === 'right'),
    C('「色」のタブを押してください。', tabBtn('色'), () => E.ttab === 'color'),
    C('ボタンの色を変えます。好きな色を1つ押してください。', () => tq('.tcol .sw-row'), () => !!E.w.tscr.theme),
    S('「読む画面と同じ色にもどす」で、いつでも元の色にもどせます。', txt('.btn', '読む画面と同じ色にもどす')),
    C('「もどる」を押して、「しあげ・送る」にもどりましょう。', BACK, () => E.tab === 'work'),
    S('これで、この章はおわりです。')
  ] },
  { lv: 0, n: 6, name: '画面のレイアウトを考えよう', async setup() {
    const w = tutWork(); const a = tb(w, 1, 0, TXT.a); a.cues = { 0: { bg: 'I:bg07', ch: { 1: { m: 'I:c02_0', s: 1, y: 0 } } } };
    await tutOpen(w, 'work');
  }, steps: () => [
    S('読む画面の見た目は「4 しあげ・送る」で決めます。', [() => byText('.wk-l', '文章の出し方').parentNode, () => tqa('#scr-edit .panel')[1]]),
    C('文章の出し方を「サウンドノベル」にしてみます。押してください。', txt('.wk-row .btn', 'サウンドノベル'), () => E.w.opts.mode === 'novel'),
    ...playTry(),
    S('サウンドノベルでは、画面全体に文章が重なって出ます。本を読むような感じになります。', el('#pwin')),
    backFromPlay(),
    C('「ウインドウ」にもどします。押してください。', txt('.wk-row .btn', 'ウインドウ'), () => E.w.opts.mode === 'window'),
    C('<b>文字の形</b>を変えます。「手書き風」を押してください。', txt('.wk-row .btn', '手書き風'), () => E.w.theme.font === 'tegaki'),
    C('<b>ウインドウの色</b>を変えます。好きな色を1つ押してください。', () => byText('.wk-l', 'ウインドウの色').parentNode.querySelector('.sw-row'), null),
    C('<b>透明度</b>を変えます。「すけすけ」を押してください。', txt('.wk-row .btn', 'すけすけ'), () => E.w.theme.alpha === 3),
    S('下の見本に、色や文字の形が反映されます。', el('.wk-prev')),
    ...playTry(),
    S('ウインドウの色・文字の形・透明度が変わりました。', el('#pwin')),
    backFromPlay(),
    S('これで、この章はおわりです。')
  ] },
  { lv: 0, n: 7, name: '書き出しのしかた', async setup() {
    const w = tutWork(); tb(w, 1, 0, TXT.a);
    await tutOpen(w, 'work');
  }, steps: () => [
    S('できた作品は、ここから<b>書き出し</b>て、友だちに送ります。', () => tqa('#scr-edit .panel')[2]),
    S('「作品を書き出す」を押すと、2つの形からえらべます。<br>（チュートリアルでは、押さずに説明だけします）', txt('.btn', '作品を書き出す')),
    S('<b>作品ファイル（JSON）</b>：友だちのノベルゲームメーカーで「読みこむ」と、読んだり、改造したりできます。<br>Teamsなどで送るときは、こちらがおすすめです。', txt('.btn', '作品を書き出す')),
    S('<b>見るだけのHTML</b>：ダブルクリックするだけで読める、1つのファイルになります。<br>セーブやエンディングリストも使えます。（パソコンの横画面用です）', txt('.btn', '作品を書き出す')),
    S('もらった作品ファイルは、タイトル画面の「もらった作品を読みこむ」か、作品えらびの「読みこむ」で入れられます。'),
    S('作者名の欄の下にある「改造」を「だめ」にすると、もらった人は読むことはできますが、改造はできなくなります。', () => byText('.wk-l', '改造').parentNode),
    S('これで、初級はおわりです。おつかれさまでした。')
  ] },
  /* ===== 中級 ===== */
  { lv: 1, n: 1, name: '選択肢でお話を分ける', async setup() {
    const w = tutWork({ branch: true });
    const a = tb(w, 1, 0, TXT.fork); const r = tb(w, 2, 0, TXT.right, { type: 'end', name: '花畑エンド' }); const l = tb(w, 2, 1, TXT.left, { type: 'end', name: '小屋エンド' });
    TUT.ids = { a: a.id, r: r.id, l: l.id };
    await tutOpen(w, 'map', () => { E.bid = a.id; });
  }, steps: () => [
    S('このお話は、1のあとで2つに分かれます。<br>2のブロックは、こちらで作っておきました。', () => tqa('.bcard')),
    C('1のブロックが読みおわったら、選択肢を出すようにします。「選択肢を出す」を押してください。', txt('#scr-edit .panel .btn', '選択肢を出す'), () => E.w.blocks[TUT.ids.a].end.type === 'choice'),
    S('選択肢の言葉は、こちらで入れておきました。', () => tqa('#scr-edit .panel .bp-line').slice(1, 3),
      { do: () => { const e = E.w.blocks[TUT.ids.a].end; e.choices[0].label = '右の道へ行く'; e.choices[1].label = '左の道へ行く'; markDirty(true); } }),
    C('選択肢Aの行き先を決めます。Aの「えらぶ」を押してください。', () => tqa('#scr-edit .panel .tgt')[0], () => !!E.pick),
    C('マップで、行き先のブロックを押します。<b>2の上のブロック</b>を押してください。', () => cardOf(TUT.ids.r), () => E.w.blocks[TUT.ids.a].end.choices[0].to === TUT.ids.r),
    C('選択肢Bの「えらぶ」を押してください。', () => tqa('#scr-edit .panel .tgt')[1], () => !!E.pick),
    C('<b>2の下のブロック</b>を押してください。', () => cardOf(TUT.ids.l), () => E.w.blocks[TUT.ids.a].end.choices[1].to === TUT.ids.l),
    S('マップに線が2本引かれ、<b>A</b>と<b>B</b>の印が付きました。', el('.map-scroll')),
    ...playTry(),
    tAdvance('ウインドウを押して、選択肢が出るまで進めてください。', 2),
    C('選択肢が出ました。「右の道へ行く」を押してください。', () => byText('#pchoices button', '右の道へ行く', false), () => P.b === TUT.ids.r),
    C('ウインドウを押して、最後まで進めてください。', el('#pwin'), () => !!tq('.pend')),
    S('「おわりにする」のブロックまで来ると、お話がおしまいになります。<br>ブロックに付けたエンディングの名前も出ます。', el('.pend .dlg')),
    C('「作る画面へ」を押してください。', txt('.pend .btn', '作る画面へ'), () => shown('edit')),
    S('分かれたお話を、もう一度1つにつなぐこともできます。<br>これで、中級はおわりです。')
  ] },
  /* ===== 上級 ===== */
  { lv: 2, n: 1, name: '前の答えで行き先を変える', async setup() {
    const w = tutWork({ branch: true, flag: true });
    const a = tb(w, 1, 0, TXT.fork), r = tb(w, 2, 0, TXT.right), l = tb(w, 2, 1, TXT.left), m = tb(w, 3, 0, 'その夜、ふしぎな夢を見た。\n夢の中で、だれかが話しかけてくる。');
    const g1 = tb(w, 4, 0, '「花をありがとう」\n花の精が、ほほえんだ。', { type: 'end', name: '花の精エンド' }), g2 = tb(w, 4, 1, '「よく来たね」\n小屋のおばあさんが、ほほえんだ。', { type: 'end', name: 'おばあさんエンド' });
    a.end.type = 'choice'; a.end.choices = [{ label: '右の道へ行く', to: r.id }, { label: '左の道へ行く', to: l.id }];
    r.end.type = 'next'; r.end.to = m.id; l.end.type = 'next'; l.end.to = m.id;
    TUT.ids = { a: a.id, m: m.id, g1: g1.id, g2: g2.id };
    await tutOpen(w, 'map', () => { E.bid = m.id; E.mapScroll = 230; });
  }, steps: () => [
    S('このお話は、1で分かれたあと、3で1つにもどります。<br>3のあとは、<b>1でどちらを選んだか</b>によって行き先を変えます。', () => tqa('.bcard')),
    C('3のブロックがえらばれています。「条件で分ける」を押してください。', txt('#scr-edit .panel .btn', '条件で分ける'), () => E.w.blocks[TUT.ids.m].end.type === 'cond'),
    C('「条件1」を押すと、条件の中身を決められます。押してください。', el('.rule-txt'), () => !!tq('.dlg-rule')),
    C('「かつ」を押すと、しらべることを足せます。押してください。', txt('.dlg-rule .btn', 'かつ'), () => !!tq('.dlg-rule .atom')),
    S('「選択肢を選んだ」「ブロック 1」「A：右の道へ行く」になっています。<br>これで「<b>1で右の道をえらんだとき</b>」という条件になります。ここは、リストから切りかえることもできます。', el('.dlg-rule .atom')),
    C('「OK」を押してください。', txt('.dlg-rule .btn', 'OK'), () => !tq('.dlg-rule')),
    C('条件1の行き先を決めます。条件1の「えらぶ」を押してください。', () => tq('#scr-edit .panel .bp-rule .tgt'), () => !!E.pick),
    C('<b>4の上のブロック</b>を押してください。', () => cardOf(TUT.ids.g1), () => E.w.blocks[TUT.ids.m].end.rules[0].to === TUT.ids.g1, { do: () => mapShow(TUT.ids.g1) }),
    S('<b>どれにも当てはまらない</b>：どの条件にも当てはまらなかったときの行き先です。<br>今回は「左の道をえらんだとき」がこれに当たります。', () => byText('.bp-k', 'どれにも当てはまらない').parentNode),
    C('「どれにも当てはまらない」の行き先ボタンを押してください。', () => byText('.bp-k', 'どれにも当てはまらない').parentNode.querySelector('.tgt'), () => !!E.pick),
    C('<b>4の下のブロック</b>を押してください。', () => cardOf(TUT.ids.g2), () => E.w.blocks[TUT.ids.m].end.else === TUT.ids.g2),
    S('条件の線は<b>点線</b>で、番号が付きます。「他」は、どれにも当てはまらないときの線です。', el('.map-scroll')),
    S('これで、この章はおわりです。')
  ] },
  { lv: 2, n: 2, name: '「かつ」「または」でフラグを管理', async setup() {
    const w = tutWork({ branch: true, flag: true });
    const a = tb(w, 1, 0, '洞くつの入り口に着いた。\n中は、まっくらだ。'), b = tb(w, 2, 0, '奥へ進むと、また道が分かれていた。'), c = tb(w, 3, 0, 'その先に、大きなとびらがあった。');
    const g1 = tb(w, 4, 0, 'とびらが光り、宝物があらわれた！', { type: 'end', name: '宝物エンド' }), g2 = tb(w, 4, 1, 'とびらは、びくともしなかった。', { type: 'end', name: 'ふつうのエンド' });
    a.end.type = 'choice'; a.end.choices = [{ label: 'ランプをつける', to: b.id }, { label: 'そのまま進む', to: b.id }];
    b.end.type = 'choice'; b.end.choices = [{ label: '右へ行く', to: c.id }, { label: '左へ行く', to: c.id }];
    TUT.ids = { a: a.id, b: b.id, c: c.id, g1: g1.id, g2: g2.id };
    await tutOpen(w, 'map', () => { E.bid = c.id; E.mapScroll = 230; });
  }, steps: () => [
    S('このお話では、1と2で選択肢が出ます。<br>「1でランプをつけた」<b>かつ</b>「2で右へ行った」人だけ、宝物のエンディングにします。', () => tqa('.bcard')),
    C('3のブロックで、「条件で分ける」を押してください。', txt('#scr-edit .panel .btn', '条件で分ける'), () => E.w.blocks[TUT.ids.c].end.type === 'cond'),
    C('「条件1」を押してください。', el('.rule-txt'), () => !!tq('.dlg-rule')),
    C('「かつ」を押してください。1つ目の条件が入ります。', txt('.dlg-rule .btn', 'かつ'), () => tqa('.dlg-rule .atom').length === 1),
    S('1つ目は「1でランプをつけた（A）」になっています。', el('.dlg-rule .atom')),
    C('もう一度「かつ」を押してください。2つ目の条件が入ります。', txt('.dlg-rule .btn', 'かつ'), () => tqa('.dlg-rule .atom').length === 2),
    S('2つ目は、こちらで「<b>ブロック 2</b>」の「<b>A：右へ行く</b>」に切りかえました。', () => tqa('.dlg-rule .atom')[1], { do: () => {
      const s = tqa('.dlg-rule .atom')[1].querySelectorAll('select')[1]; s.value = TUT.ids.b; s.dispatchEvent(new Event('change'));
    } }),
    S('間の「<b>かつ</b>」は、<b>両方に当てはまるときだけ</b>という意味です。', el('.dlg-rule .and-lab')),
    S('「<b>または</b>」を押すと、べつのパターンを足せます。<br>パターンのどれか1つに当てはまれば、この条件に当てはまったことになります。', txt('.dlg-rule .btn', 'または')),
    S('「選択肢を選んでいない」「ブロックを通った」「ブロックを通っていない」もえらべます。<br>これらを組み合わせて、<b>フラグ</b>（前のできごとの記録）として使います。', () => tqa('.dlg-rule .atom select')[0]),
    C('「OK」を押してください。', txt('.dlg-rule .btn', 'OK'), () => !tq('.dlg-rule')),
    C('条件1の「えらぶ」を押してください。', () => tq('#scr-edit .panel .bp-rule .tgt'), () => !!E.pick),
    C('<b>4の上のブロック（宝物エンド）</b>を押してください。', () => cardOf(TUT.ids.g1), () => E.w.blocks[TUT.ids.c].end.rules[0].to === TUT.ids.g1, { do: () => mapShow(TUT.ids.g1) }),
    C('「どれにも当てはまらない」の行き先ボタンを押してください。', () => byText('.bp-k', 'どれにも当てはまらない').parentNode.querySelector('.tgt'), () => !!E.pick),
    C('<b>4の下のブロック</b>を押してください。', () => cardOf(TUT.ids.g2), () => E.w.blocks[TUT.ids.c].end.else === TUT.ids.g2),
    S('条件は8つまで作れます。条件は<b>上から順に</b>しらべて、さいしょに当てはまったものの行き先へ進みます。<br>順番は、条件の画面の「上へ」「下へ」で入れかえられます。', () => tq('#scr-edit .panel .bp-rule')),
    S('これで、この章はおわりです。')
  ] },
  { lv: 2, n: 3, name: 'エラー表示について', async setup() {
    const w = tutWork({ branch: true, flag: true });
    const a = tb(w, 1, 0, TXT.fork), r = tb(w, 2, 0, TXT.right), l = tb(w, 2, 1, TXT.left, { type: 'end', name: '小屋エンド' }), m = tb(w, 3, 0, '気がつくと、また森の入り口にいた。');
    a.end.type = 'choice'; a.end.choices = [{ label: '右の道へ行く', to: r.id }, { label: '左の道へ行く', to: null }];
    r.end.type = 'next'; r.end.to = m.id; m.end.type = 'next'; m.end.to = r.id;
    TUT.ids = { a: a.id, r: r.id, l: l.id, m: m.id };
    await tutOpen(w, 'map', () => { E.bid = a.id; });
  }, steps: () => [
    S('この作品には、わざと<b>問題</b>を入れておきました。<br>問題があると、マップの下に数が出ます。', el('.chk-sum')),
    S('問題があるブロックには、アイコンが付きます。<br>' + Object.values(ISSUE).map(x => `<span class="tut-iss" style="color:${x.color === '#adb5bd' ? '#868e96' : x.color}">${ic(x.icon, 18).outerHTML}${x.name}</span>`).join('　'), () => tqa('.bcard .bc-iss').filter(x => x.children.length)),
    C('1のブロックのアイコンを押すと、問題の中身が見られます。押してください。', () => tq(`.bcard[data-bid="${TUT.ids.a}"] .iss`), () => !!tq('.iss-list')),
    S('選択肢Bの行き先が決まっていないので、Bをえらぶと話が止まってしまいます。', () => tq('.iss-list').closest('.dlg')),
    C('「わかった」を押してください。', txt('.btn', 'わかった'), () => !tq('.iss-list')),
    C('直してみましょう。選択肢Bの「えらぶ」を押してください。', () => tqa('#scr-edit .panel .tgt')[1], () => !!E.pick),
    C('<b>2の下のブロック</b>を押してください。', () => cardOf(TUT.ids.l), () => E.w.blocks[TUT.ids.a].end.choices[1].to === TUT.ids.l),
    S('問題がへりました。2の下のブロックにも行けるようになったので、「到達不能」も消えました。', el('.chk-sum')),
    S('のこりは「<b>おわらない</b>」です。2の上と3が、おたがいにつながっていて、お話がおわりません。', () => [cardOf(TUT.ids.r), cardOf(TUT.ids.m)]),
    C('3のブロックを押してください。', () => cardOf(TUT.ids.m), () => E.bid === TUT.ids.m, { do: () => mapShow(TUT.ids.m) }),
    C('「おわりにする」を押してください。', txt('#scr-edit .panel .btn', 'おわりにする'), () => E.w.blocks[TUT.ids.m].end.type === 'end'),
    S('問題がなくなりました。<br>問題があっても書き出しはできますが、送る前に直しておくと安心です。', el('.chk-sum')),
    S('これで、上級はおわりです。すべての章、おつかれさまでした。')
  ] }
];
const TUT_LV = ['初級', '中級', '上級'];
const TUT_LV_SUB = ['1つのお話を書けるようになる', '選択肢で分かれるお話を書く', '条件で分かれるお話を書く'];
const chKey = c => c.lv + '-' + c.n;

/* ---------- 章えらび ---------- */
async function gotoTutorial() {
  setStageW(1280); stopBGM();
  const s = tq('#scr-tut');
  s.innerHTML = '';
  const done = (await dbGet('saves', TUT_KEY)) || [];
  s.append(btn('back', 'もどる', () => gotoTitle(), 'tl'), h('div', { class: 'sc-title' }, 'チュートリアル'),
    h('div', { class: 'tut-lead' }, 'じっさいの画面を動かしながら、使い方を覚えます。どの章からでも始められます。'));
  const cols = h('div', { class: 'tut-cols' });
  TUT_LV.forEach((lv, li) => {
    const col = h('div', { class: 'tut-col lv' + li }, h('div', { class: 'tut-lv' }, lv), h('div', { class: 'tut-lv-s' }, TUT_LV_SUB[li]));
    TUT_CH.filter(c => c.lv === li).forEach(c => {
      const ok = done.includes(chKey(c));
      col.appendChild(h('button', { class: 'tut-ch' + (ok ? ' done' : ''), onclick: () => tutStart(c) },
        h('span', { class: 'tut-no' }, String(c.n)), h('span', { class: 'tut-nm' }, c.name), ok ? h('span', { class: 'tut-done' }, ic('check', 16), '済') : null));
    });
    cols.appendChild(col);
  });
  s.appendChild(cols);
  showScreen('tut');
}

/* ---------- 実行 ---------- */
const TUT_EVENTS = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'keydown', 'keypress', 'keyup', 'wheel', 'dragstart', 'drop', 'beforeinput', 'input', 'touchstart', 'change'];
function tutTargets() { const st = TUT.cur; if (!st) return []; return st.s.map(f => { try { return f(); } catch (e) { return null; } }).flat().filter(Boolean); }
function tutGuard(e) {
  if (!TUT.on || !e.isTrusted) return;
  const t = e.target;
  if (TUT.layer && t instanceof Node && (t.closest && t.closest('#tut .tut-ui'))) return; // チュートリアル自身のボタン
  const st = TUT.cur;
  const ok = !TUT.paused && st && st.w !== 'next' && TUT.ready && t instanceof Node && tutTargets().some(x => x === t || x.contains(t));
  if (ok && !/^key/.test(e.type) && e.type !== 'wheel') {
    if (e.type === 'pointerdown') TUT.clicks++;
    if (e.type === 'click') TUT.clicked = true;
    return;
  }
  if (e.type === 'change' || e.type === 'input') return; // うけつけたクリックの結果はとめない
  e.stopPropagation(); e.stopImmediatePropagation(); e.preventDefault();
  if (e.type === 'pointerdown' && TUT.layer) { const r = tq('.tut-rings', TUT.layer); if (r) { r.classList.remove('nudge'); void r.offsetWidth; r.classList.add('nudge'); } }
}
async function tutStart(c) {
  Object.assign(TUT, { on: true, ch: c, i: 0, clicked: false, clicks: 0, paused: false, cur: null, ready: false, hole: null, ids: {} });
  if (!TUT.layer) {
    TUT_EVENTS.forEach(ev => window.addEventListener(ev, tutGuard, { capture: true, passive: false }));
    TUT.layer = h('div', { id: 'tut' });
    TUT.layer.innerHTML = '<svg class="tut-dim"><defs><mask id="tutmask"><rect width="100%" height="100%" fill="#fff"/><g class="tut-holes"></g></mask></defs><rect class="tut-shade" width="100%" height="100%" mask="url(#tutmask)"/><g class="tut-rings"></g></svg>';
    TUT.arrow = h('div', { class: 'tut-arrow' }, ic('pointer', 44));
    TUT.box = h('div', { class: 'tut-box tut-ui' });
    TUT.quit = btn('x', 'やめる', () => tutAskQuit(), 'tut-quit tut-ui dng');
    TUT.layer.append(TUT.arrow, TUT.box, TUT.quit);
  }
  tq('#stage').appendChild(TUT.layer);
  TUT.layer.style.display = '';
  TUT.layer.classList.remove('done');
  await c.setup();
  TUT.steps = c.steps();
  cancelAnimationFrame(TUT.raf); TUT.raf = requestAnimationFrame(tutFrame);
  tutGo(0);
}
function tutGo(i) {
  TUT.i = i; const st = TUT.steps[i];
  if (!st) { tutFinish(); return; }
  TUT.cur = st; TUT.ready = false; TUT.clicked = false; TUT.clicks = 0;
  try { if (st.do) st.do(); } catch (e) { console.warn(e); }
  const box = TUT.box; box.innerHTML = '';
  box.append(h('div', { class: 'tut-head' }, h('span', null, `${TUT_LV[TUT.ch.lv]} ${TUT.ch.n}　${TUT.ch.name}`), h('span', { class: 'tut-pg' }, `${i + 1} / ${TUT.steps.length}`)),
    h('div', { class: 'tut-txt', html: st.t }),
    h('div', { class: 'tut-foot' }, st.w === 'next' ? btn('next', i === TUT.steps.length - 1 ? 'おわる' : '次へ', () => tutGo(i + 1), 'pri tut-ui')
      : h('div', { class: 'tut-hint' }, ic('arrow', 18), st.count ? '光っているところを押してください' : '光っているところを押してください')));
  box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
  setTimeout(() => { if (TUT.cur === st) TUT.ready = true; }, 250);
}
function tutRect(el) {
  const st = tq('#stage'), sr = st.getBoundingClientRect(), k = sr.width / st.offsetWidth, r = el.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  return { x: (r.left - sr.left) / k, y: (r.top - sr.top) / k, w: r.width / k, h: r.height / k };
}
const inter = (a, b, m = 0) => a && b && a.x < b.x + b.w + m && b.x < a.x + a.w + m && a.y < b.y + b.h + m && b.y < a.y + a.h + m;
function tutFrame() {
  if (!TUT.on) return;
  TUT.raf = requestAnimationFrame(tutFrame);
  const st = TUT.cur; if (!st || !TUT.layer) return;
  const W = tq('#stage').offsetWidth, H = 720;
  const rs = tutTargets().map(tutRect).filter(Boolean).map(r => ({ x: r.x - 6, y: r.y - 6, w: r.w + 12, h: r.h + 12 }));
  // 穴と光る枠（なめらかに動かす）
  if (!TUT.hole || TUT.hole.length !== rs.length) TUT.hole = rs.map(r => ({ ...r }));
  TUT.hole.forEach((c, i) => { for (const k of ['x', 'y', 'w', 'h']) c[k] += (rs[i][k] - c[k]) * 0.3; });
  const holes = tq('.tut-holes', TUT.layer), rings = tq('.tut-rings', TUT.layer);
  const sig = TUT.hole.map(r => [r.x, r.y, r.w, r.h].map(v => v.toFixed(1)).join(',')).join(';');
  if (sig !== TUT.sig) {
    TUT.sig = sig;
    holes.innerHTML = TUT.hole.map(r => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="10" fill="#000"/>`).join('');
    rings.innerHTML = TUT.hole.map(r => `<rect class="tut-ring" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="10"/>`).join('');
  }
  TUT.layer.classList.toggle('free', !rs.length);
  // まとめた範囲
  const U = rs.length ? rs.reduce((a, r) => ({ x: Math.min(a.x, r.x), y: Math.min(a.y, r.y), w: Math.max(a.x + a.w, r.x + r.w) - Math.min(a.x, r.x), h: Math.max(a.y + a.h, r.y + r.h) - Math.min(a.y, r.y) }), { ...rs[0] }) : null;
  // 「やめる」：左下。じゃまなら別の角へ
  const qw = 124, qh = 44, qs = [[12, H - qh - 10], [W - qw - 12, H - qh - 10], [12, 10], [W - qw - 12, 10]].map(([x, y]) => ({ x, y, w: qw, h: qh }));
  const q = qs.find(c => !rs.some(r => inter(c, r, 6))) || qs[0];
  TUT.quit.style.left = q.x + 'px'; TUT.quit.style.top = q.y + 'px';
  // 説明の箱：操作する場所・やめると重ならない場所へ
  const box = TUT.box, bw = box.offsetWidth, bh = box.offsetHeight, M = 10;
  const clx = v => Math.max(M, Math.min(W - bw - M, v)), cly = v => Math.max(M, Math.min(H - bh - M, v));
  const ov = (a, b, m) => { const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w + m) - Math.max(a.x, b.x - m)), y = Math.max(0, Math.min(a.y + a.h, b.y + b.h + m) - Math.max(a.y, b.y - m)); return x * y; };
  let cands = [];
  if (U) {
    const cx = U.x + U.w / 2 - bw / 2, cy = U.y + U.h / 2 - bh / 2;
    cands = [{ x: cx, y: U.y + U.h + 18 }, { x: cx, y: U.y - bh - 18 }, { x: U.x + U.w + 18, y: cy }, { x: U.x - bw - 18, y: cy }];
  }
  cands.push({ x: (W - bw) / 2, y: (H - bh) / 2 }, { x: W - bw - M, y: H - bh - 56 }, { x: M, y: H - bh - 56 }, { x: W - bw - M, y: 80 }, { x: M, y: 80 }, { x: (W - bw) / 2, y: H - bh - 56 }, { x: (W - bw) / 2, y: 80 });
  let pick = null, best = Infinity;
  for (const c0 of cands) {
    const c = { x: clx(c0.x), y: cly(c0.y), w: bw, h: bh };
    const score = rs.reduce((a, r) => a + ov(c, r, 8), 0) + ov(c, q, 6) * 100;
    if (score < best - 1) { best = score; pick = c; }
    if (score === 0) break;
  }
  if (Math.abs((parseFloat(box.style.left) || 0) - pick.x) > 1) box.style.left = pick.x + 'px';
  if (Math.abs((parseFloat(box.style.top) || 0) - pick.y) > 1) box.style.top = pick.y + 'px';
  if (document.scrollingElement && document.scrollingElement.scrollTop) document.scrollingElement.scrollTop = 0;
  const stg = tq('#stage'); if (stg.scrollTop || stg.scrollLeft) { stg.scrollTop = 0; stg.scrollLeft = 0; }
  // 押す場所を指す矢印
  const ar = TUT.arrow;
  if (U && st.w !== 'next' && TUT.ready) {
    const r0 = rs[0], up = r0.y < 70;
    ar.style.display = ''; ar.classList.toggle('up', up);
    ar.style.left = (r0.x + r0.w / 2 - 22) + 'px'; ar.style.top = (up ? r0.y + r0.h + 4 : r0.y - 52) + 'px';
  } else ar.style.display = 'none';
  // 進む条件
  if (TUT.ready && !TUT.paused && st.w !== 'next') {
    let ok = false;
    try { ok = typeof st.w === 'function' ? st.w() : TUT.clicked; } catch (e) { ok = false; }
    if (ok) { TUT.ready = false; setTimeout(() => { if (TUT.cur === st) tutGo(TUT.i + 1); }, 350); }
  }
}
function tutAskQuit() {
  if (TUT.paused) return;
  TUT.paused = true;
  const m = h('div', { class: 'tut-ask tut-ui' }, h('div', { class: 'dlg' }, h('div', { class: 'dlg-title' }, 'チュートリアルをやめて、タイトルにもどりますか？'),
    h('div', { class: 'dlg-btns' }, btn('check', 'はい', () => { m.remove(); tutEnd(); gotoTitle(); }, 'pri'), btn('x', 'いいえ', () => { m.remove(); TUT.paused = false; }))));
  TUT.layer.appendChild(m);
}
async function tutFinish() {
  const done = (await dbGet('saves', TUT_KEY)) || [];
  if (!done.includes(chKey(TUT.ch))) { done.push(chKey(TUT.ch)); await dbPut('saves', done, TUT_KEY); }
  const idx = TUT_CH.indexOf(TUT.ch), next = TUT_CH[idx + 1];
  TUT.cur = null; TUT.paused = true;
  const m = h('div', { class: 'tut-ask tut-ui' }, h('div', { class: 'dlg' }, h('div', { class: 'dlg-title' }, `「${TUT.ch.name}」はおわりです`),
    h('div', { class: 'dlg-msg' }, next ? `次は「${TUT_LV[next.lv]} ${next.n}　${next.name}」です。` : 'すべての章がおわりました。おつかれさまでした。'),
    h('div', { class: 'dlg-btns' },
      next ? btn('next', '次の章へ', () => { m.remove(); tutEnd(); tutStart(next); }, 'pri') : null,
      btn('log', '章えらびへ', () => { m.remove(); tutEnd(); gotoTutorial(); }, next ? '' : 'pri'))));
  TUT.layer.appendChild(m);
}
function tutEnd() {
  TUT.on = false; TUT.cur = null; TUT.paused = false;
  cancelAnimationFrame(TUT.raf);
  stopBGM(); if (typeof toggleAuto === 'function' && P && P.w) { toggleAuto(false); toggleSkip(false); }
  tqa('.modal').forEach(m => m.remove());
  if (TUT.layer) { TUT.layer.style.display = 'none'; tqa('.tut-ask', TUT.layer).forEach(x => x.remove()); }
}
