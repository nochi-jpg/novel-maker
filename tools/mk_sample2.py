"""サンプル2「犬クイズ（条件分岐サンプル）」を生成する（前の版の犬の写真をそのまま使う）"""
import json, pathlib
from samplelib import *
import samplelib as L

ROOT = pathlib.Path(__file__).resolve().parent.parent
OLD = json.load(open(ROOT / 'assets/works/sample2.json', encoding='utf-8'))
KEEP = {'title': 'mwultyy4vuyy60', 'q1': 'mwultyyurupvoy', 'q2': 'mwultyzkwb36dc', 'q3': 'mwultz08x3zoj4', 'res': 'mwultz0wrkdrwd', 'all': 'mwultz1e5eoh0z'}
media_list = [m for m in OLD['work']['media'] if m['id'] in KEEP.values()]
media = {k: OLD['media'][k] for k in KEEP.values()}
assert len(media) == 6

AI = 'c10'
def ai(p=0): return chs(l=ch(AI, p))
L.IDS.update({'Q1': 'mwujfhslw9cb03', 'Q2': 'mwujsh21rxap42', 'Q3': 'mwulqxbc849xqg', 'G': 'mwulsz0tkvhuuo',
              'E3': 'mwulybbwvf0rl6', 'E2': 'mwulz4kbxo96as', 'E1': 'mwulzfxaq5jax7', 'E0': 'mwulznl0q8eta9'})
L.IDS.update({k: ('mwdogq' + k.lower() * 8)[:14] for k in ['R1o', 'R1x', 'R2o', 'R2x', 'R3o', 'R3x']})
IDS = L.IDS

def ok_page(title):
    return [('【アイル】「ピンポン！　正解！」', {'ch': ai(3), 'se': 'S:pinpon', 'ef': [{'t': 'jump', 's': 0}]}), title]
def ng_page(title):
    return [('【アイル】「ブブー！　ざんねん！」', {'ch': ai(4), 'se': 'S:buzzer', 'ef': [{'t': 'shakeS'}]}), title]

B = []
B.append(block('Q1', 1, 0, [
    [('【アイル】「こんにちは！　犬が大好きなアイルです！」', {'bg': KEEP['q1'], 'ch': ai(3), 'bgm': 'M:tanoshii'})],
    [('【アイル】「今日は犬クイズを3問出すよ。何問正解できるかな？」', {'ch': ai(2)})],
    [('【アイル】「第1問！　犬の、においをかぎ分ける力は、', {'ch': ai(1), 'se': 'S:pikon'}),
     '人間とくらべてどのくらいといわれている？」'],
], choice(('人間と、だいたい同じくらい', 'R1x'), ('人間の、10倍くらい', 'R1x'), ('人間の、何千倍から1億倍ともいわれる', 'R1o'))))

EXP1 = [
    [('【アイル】「答えは「何千倍から1億倍ともいわれる」！」', {'ch': ai(2)})],
    ['【アイル】「犬の鼻のおくには、においを感じる細胞が',
     '人間よりずっとたくさんあるんだって」'],
    [('【アイル】「だから、警察犬や救助犬として、人の役に立っているんだよ」', {'ch': ai(3)})],
]
B.append(block('R1o', 2, 0, [ok_page('【アイル】「よく知ってるね！」'), *EXP1], nxt('Q2')))
B.append(block('R1x', 2, 1, [ng_page('【アイル】「おしい！」'), *EXP1], nxt('Q2')))

B.append(block('Q2', 3, 0, [
    [('【アイル】「第2問！」', {'bg': KEEP['q2'], 'ch': ai(0), 'se': 'S:pikon'})],
    [('【アイル】「犬がしっぽをふっているとき。', {'ch': ai(1)}),
     'それは、いつも「うれしい」という意味かな？」'],
], choice(('うん、いつもうれしい気持ち', 'R2x'), ('いいえ、きんちょうや、けいかいのときもある', 'R2o'), ('しっぽで、自分に風を送っている', 'R2x'))))

EXP2 = [
    [('【アイル】「答えは「きんちょうや、けいかいのときもある」！」', {'ch': ai(2)})],
    ['【アイル】「しっぽをふるのは、気持ちが高まっているサイン。',
     'うれしいときだけじゃないんだ」'],
    [('【アイル】「しっぽの高さや、耳の向きもいっしょに見ると、', {'ch': ai(1)}),
     '犬の本当の気持ちがわかりやすくなるよ」'],
]
B.append(block('R2o', 4, 0, [ok_page('【アイル】「犬の気持ち、よくわかってるね！」'), *EXP2], nxt('Q3')))
B.append(block('R2x', 4, 1, [ng_page('【アイル】「……ちなみに、せんぷうきではないよ！」'), *EXP2], nxt('Q3')))

B.append(block('Q3', 5, 0, [
    [('【アイル】「いよいよ最後の問題！」', {'bg': KEEP['q3'], 'ch': ai(0), 'se': 'S:pikon', 'bgm': 'M:kinchou'})],
    [('【アイル】「犬の目は、信号の「赤」と「緑」を', {'ch': ai(1)}),
     '見分けるのが、とくい？　にがて？」'],
], choice(('人間よりとくい', 'R3x'), ('にがて。青や黄色を中心に見ている', 'R3o'), ('色はまったく見えない。白黒の世界', 'R3x'))))

EXP3 = [
    [('【アイル】「答えは「にがて。青や黄色を中心に見ている」！」', {'ch': ai(2), 'bgm': 'M:tanoshii'})],
    ['【アイル】「白黒の世界だと思われがちだけど、',
     'じつは、青や黄色はちゃんと見えているんだよ」'],
    [('【アイル】「そのかわり、動くものを見つける力は、人間よりすぐれているんだ」', {'ch': ai(3)})],
]
B.append(block('R3o', 6, 0, [ok_page('【アイル】「すごい、正解！」'), *EXP3], nxt('G')))
B.append(block('R3x', 6, 1, [ng_page('【アイル】「これは、ひっかけ問題だったかも！」'), *EXP3], nxt('G')))

def P(k): return {'t': 'pass', 'b': IDS[k]}
B.append(block('G', 7, 0, [
    [('【アイル】「全部の問題がおわったよ！」', {'bg': KEEP['res'], 'ch': ai(3), 'bgm': 'stop'})],
    [('【アイル】「さて、きみは何問正解できたかな……？」', {'ch': ai(1), 'se': 'S:countdown'})],
], {'type': 'cond', 'rules': [
    {'groups': [[P('R1o'), P('R2o'), P('R3o')]], 'to': IDS['E3']},
    {'groups': [[P('R1o'), P('R2o')], [P('R1o'), P('R3o')], [P('R2o'), P('R3o')]], 'to': IDS['E2']},
    {'groups': [[P('R1o')], [P('R2o')], [P('R3o')]], 'to': IDS['E1']},
], 'else': IDS['E0']}))

B.append(block('E3', 8, 0, [
    [('【アイル】「全問正解！！　きみは、犬はかせだ！」', {'bg': KEEP['all'], 'ch': ai(3), 'se': 'S:kansei', 'ef': [{'t': 'fireworks'}], 'bgm': 'M:ending'})],
    [('【アイル】「今度、犬に会ったら、しっぽや耳もよーく見てみてね！」', {'ch': ai(2)})],
], end('犬はかせ')))
B.append(block('E2', 8, 1, [
    [('【アイル】「2問正解！　犬にけっこうくわしいね！」', {'ch': ai(3), 'se': 'S:seikai', 'ef': [{'t': 'confetti'}], 'bgm': 'M:ending'})],
    [('【アイル】「あと1問で、犬はかせ。もう一度ちょうせんしてみる？」', {'ch': ai(2)})],
], end('犬なかよし')))
B.append(block('E1', 8, 2, [
    [('【アイル】「1問正解！　犬のこと、少しくわしくなったね」', {'ch': ai(0), 'se': 'S:hott', 'bgm': 'M:ending'})],
    [('【アイル】「答えの説明を思い出して、もう一回やってみよう！」', {'ch': ai(2)})],
], end('犬みならい')))
B.append(block('E0', 9, 0, [
    [('【アイル】「0問正解……。でも大丈夫！」', {'ch': ai(4), 'se': 'S:gakkari', 'bgm': 'M:honobono'})],
    [('【アイル】「知らなかったことを知れたのが、いちばん大事。', {'ch': ai(3)}),
     'きみは、これから犬はかせになれるよ！」'],
], end('これから犬はかせ')))

save('sample2.json', {
    'app': 'novel-maker-edu', 'ver': 1, 'id': 'mwujfhsl1f2b07', 'title': '犬クイズ（条件分岐サンプル）',
    'author': 'K.nom', 'editable': True, 'ratio': '16:9',
    'opts': {'title': True, 'long': True, 'branch': True, 'flag': True, 'name': True, 'mode': 'window', 'endList': True},
    'theme': {'ui': '#6b4423', 'win': '#3a2a1a', 'tx': '#ffffff', 'ch': '#a8743f', 'alpha': 0, 'font': 'gothic'},
    'titleImg': None, 'media': media_list, 'folders': {'bg': [], 'ch': [], 'se': [], 'bgm': []},
    'created': 1795500000000, 'updated': 1795700000000,
    'tscr': {'bg': KEEP['title'], 'ch': {}, 'showT': False, 'showA': True, 'tpos': 'bottom', 'bpos': 'right', 'theme': {'ui': '#6b4423', 'win': '#3a2a1a', 'tx': '#ffffff', 'alpha': 0}},
    'blocks': {b['id']: b for b in B},
})
p = ROOT / 'assets/works/sample2.json'
d = json.load(open(p, encoding='utf-8')); d['media'] = media
p.write_text(json.dumps(d, ensure_ascii=False), encoding='utf-8')
print('media', len(media))
