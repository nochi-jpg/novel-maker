"""サンプル1「おかしのとびら（選択肢サンプル）」を生成する"""
from samplelib import *
import samplelib as L

MS = 'mise'
L.IDS.update({k: ('mwtfg0of' + k.lower() * 6)[:14] for k in ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'F', 'X', 'S', 'K']})
L.IDS.update({'Q1': 'mwtfg0ofhjrgko'})
IDS = L.IDS
def ms(p=0): return chs(c=ch(MS, p))

# 正解のとびら（0=A, 1=B）と、もらえるおかし
ANS = [0, 0, 1, 0, 1, 0, 1, 0]
SWEETS = ['クッキー', 'チョコレート', 'ラムネ', 'グミ', 'マカロン', 'ドーナツ', 'プリン', 'ショートケーキ']
REACT = [
    None,
    ('【見瀬先さん】「正解！　はい、{s}をどうぞ」', 'S:seikai', 3, []),
    ('【見瀬先さん】「また正解！　{s}をどうぞ！」', 'S:seikai', 3, [{'t': 'jump', 's': 1}]),
    ('【見瀬先さん】「3回連続！　なかなかやるね。{s}をどうぞ」', 'S:getitem', 3, [{'t': 'jump', 's': 1}]),
    ('【見瀬先さん】「4回連続！？　{s}をどうぞ！」', 'S:yatta', 3, [{'t': 'confetti'}]),
    ('【見瀬先さん】「5回連続……！　{s}をどうぞ」', 'S:kirakira', 2, [{'t': 'zoom'}]),
    ('【見瀬先さん】「6回連続……。{s}を、どうぞ……」', 'S:kirari', 1, []),
    ('【見瀬先さん】「な、7回連続……。{s}、です……」', 'S:ase', 4, [{'t': 'shiver', 's': 1}]),
]
COMMENT = [
    None,
    '【見瀬先さん】「2択に2回続けて当たる確率は、4分の1。まだまだ、これからだよ」',
    '【見瀬先さん】「3回続けて当たる確率は、8分の1。ちょっと運がいいね」',
    '【見瀬先さん】「確率は16分の1。クラスに1人いるかどうか、だね」',
    '【見瀬先さん】「32分の1！　お店で見たのは、ひさしぶりだよ」',
    '【見瀬先さん】「64分の1……。きみ、ひょっとして、すごい人？」',
    '【見瀬先さん】「128分の1……。……ふーん」',
    '【見瀬先さん】「次で8回目。……ふふっ、さあ、どうぞ」',
]
BLK = []
for n in range(8):
    key = f'Q{n + 1}'
    nxt_ok = f'Q{n + 2}' if n < 7 else 'F'
    pages = []
    if n == 0:
        pages += [
            [('いらっしゃいませ！　おかしの店「とびら堂」へようこそ。', {'bg': 'I:bg41', 'ch': ms(3), 'bgm': 'M:tanoshii', 'se': 'S:interphone'})],
            [('【見瀬先さん】「今日は特別な運試し、「おかしのとびら」をやってるよ」', {'ch': ms(2)})],
            ['【見瀬先さん】「AとB、ふたつのとびらのうち、どちらかが当たり。',
             '当たりのとびらを開けると、おかしがもらえるんだ」'],
            [('【見瀬先さん】「8回連続で当たったら……すごいことが起きるかも？」', {'ch': ms(1), 'se': 'S:pikon'})],
            [('【見瀬先さん】「では1つ目のとびら。どっちにする？」', {'ch': ms(0)})],
        ]
    else:
        line, se, pose, ef = REACT[n]
        pages += [
            [(line.format(s=SWEETS[n - 1]), {'ch': ms(pose), 'se': se, **({'ef': ef} if ef else {})})],
            [COMMENT[n]],
            [(f'【見瀬先さん】「では{n + 1}つ目のとびら。どっちにする？」', {'ch': ms(0 if n < 6 else 1)})],
        ]
        if n == 5: pages[0][0][1]['bgm'] = 'M:nazo'
    ok, ng = ('Aのとびら', nxt_ok), ('Bのとびら', 'X')
    if ANS[n] == 1: ok, ng = ('Bのとびら', nxt_ok), ('Aのとびら', 'X')
    BLK.append(block(key, n + 1, 0, pages, choice(*(sorted([ok, ng])))))

BLK.append(block('F', 9, 0, [
    [('【見瀬先さん】「……8回連続、正解。ショートケーキをどうぞ」', {'ch': ms(1), 'se': 'S:kirakira', 'bgm': 'stop'})],
    [('【見瀬先さん】「2択に8回続けて当たる確率は、256分の1」', {'ef': [{'t': 'zoom'}], 'se': 'S:shiin'}),
     '【見瀬先さん】「これは、学校全体で1人いるかどうか、だよ」'],
    [('【見瀬先さん】「ねえ。ひとつ聞いてもいい？」', {'ch': ms(3), 'bgm': 'M:kinchou'})],
    [('【見瀬先さん】「もしかして……はずれたら、セーブしたところから', {'ch': ms(1)}),
     'やり直してない？」'],
    ['【見瀬先さん】「おこったりしないよ。正直に教えてほしいな」'],
], choice(('うん……実はちょっとだけ', 'S'), ('してないよ！　本当に運だよ！', 'K'))))

BLK.append(block('X', 9, 1, [
    [('ガチャリ。とびらを開けると……', {'bgm': 'stop', 'se': 'S:doashimaru'})],
    [('中には、からっぽのおかし箱がひとつ。', {'se': 'S:buzzer', 'ch': ms(4), 'ef': [{'t': 'shakeS'}]})],
    [('【見瀬先さん】「あちゃー、はずれ！　ざんねん！」', {'bgm': 'M:honobono'})],
    [('【見瀬先さん】「でも、2択の運試しは、だれにでもチャンスがあるよ」', {'ch': ms(3)}),
     '【見瀬先さん】「またいつでも、ちょうせんしに来てね」'],
], end('ざんねんエンド')))

BLK.append(block('S', 10, 0, [
    [('【見瀬先さん】「あははっ、正直でよろしい！」', {'ch': ms(3), 'se': 'S:fufu', 'bgm': 'M:honobono', 'ef': [{'t': 'jump', 's': 1}]})],
    [('【見瀬先さん】「ゲームなら、セーブしてやり直せるよね。', {'ch': ms(2)}),
     '【見瀬先さん】「でも、本当の毎日には、セーブもロードもないんだ」'],
    [('【見瀬先さん】「だからこそ、正直に言えたのは、すごく大事なこと」', {'ch': ms(0)})],
    [('【見瀬先さん】「はい、正直者へのおまけ。特製クッキーの詰め合わせ！」', {'ch': ms(3), 'se': 'S:getitem', 'ef': [{'t': 'confetti'}], 'bgm': 'M:ending'})],
], end('しょうじきものエンド')))

BLK.append(block('K', 10, 1, [
    [('【見瀬先さん】「本当に？　……そっか！」', {'ch': ms(2), 'bgm': 'M:tanoshii'})],
    [('【見瀬先さん】「じゃあ、きみは256人に1人の、強運の持ち主だ！」', {'ch': ms(3), 'se': 'S:levelup', 'ef': [{'t': 'fireworks'}], 'weather': 'sparkle'})],
    ['【見瀬先さん】「とびら堂の「強運認定証」をどうぞ！」'],
    [('【見瀬先さん】「……もし、ちょっとだけやり直してたなら、', {'ch': ms(1), 'weather': 'none', 'bgm': 'M:ending'}),
     '次は、自分の運だけでいどんでみてね。ふふっ」'],
], end('強運エンド')))

save('sample1.json', {
    'app': 'novel-maker-edu', 'ver': 1, 'id': 'mwtfg0ofunilnz', 'title': 'おかしのとびら（選択肢サンプル）',
    'author': 'K.nom', 'editable': True, 'ratio': '16:9',
    'opts': {'title': True, 'long': True, 'branch': True, 'flag': False, 'name': True, 'mode': 'window', 'endList': True},
    'theme': {'ui': '#b0476a', 'win': '#4a1f33', 'tx': '#ffffff', 'ch': '#e8678f', 'alpha': 0, 'font': 'gothic'},
    'titleImg': None, 'media': [], 'folders': {'bg': [], 'ch': [], 'se': [], 'bgm': []},
    'created': 1795448105583, 'updated': 1795700000000,
    'tscr': {'bg': 'I:bg41', 'ch': {'1': ch(MS, 3)}, 'showT': True, 'showA': True, 'tpos': 'top', 'bpos': 'row', 'theme': None},
    'blocks': {b['id']: b for b in BLK},
})
