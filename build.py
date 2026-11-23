"""src/ と assets/ をまとめて、配る用の1ファイル novel-maker-edu.html を作る"""
import pathlib, base64, json
root = pathlib.Path(__file__).parent
src = root / 'src'
order = ['util.js', 'icons.js', 'db.js', 'audio.js', 'fx.js', 'layout.js', 'check.js', 'player.js', 'editor.js', 'app.js']
b64 = lambda p, mime: f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()
BG = [('bg01', '夜の森'), ('bg02', '学校（夕方）'), ('bg03', '学校（昼）'), ('bg04', '子ども部屋'), ('bg05', '夜の住宅街'), ('bg06', '住宅街（昼）'),
      ('bg07', '教室'), ('bg08', '教室（朝）'), ('bg09', '黒板'), ('bg10', 'ろうか（ドア）'), ('bg11', '教室のかべ'),
      ('bg12', '真っ黒'), ('bg13', '真っ赤'), ('bg14', '真っ白')]
CH = [('c01', '熊谷 はる'), ('c02', '清川 きらら'), ('c03', '渋谷 一郎'), ('c04', '早乙女 京子'), ('c05', '村田 園'), ('c06', '押江 若人'),
      ('c07', '音美 泉'), ('c08', '幸崎 流'), ('c09', '坂東 健'), ('c10', '夢川 愛瑠'), ('c11', '江洲 広'), ('c12', '黒井 華'), ('mise', '見瀬先 祥子'), ('shop', '見瀬先 祥子（お店）')]
POSE = ['ふつう', 'かんがえる', 'てをだす', 'うれしい', 'くやしい']
bg = [{'id': 'I:' + i, 'name': n, 'data': b64(root / 'assets/bg' / (i + '.jpg'), 'image/jpeg')} for i, n in BG]
chars, ch = [], []
for c, n in CH:
    ps = sorted((root / 'assets/ch').glob(c + '_*.webp'))
    chars.append({'c': c, 'name': n})
    for p in ps:
        k = int(p.stem.split('_')[1])
        ch.append({'id': 'I:' + p.stem, 'c': c, 'name': n + '（' + POSE[k] + '）', 'pose': POSE[k], 'data': b64(p, 'image/webp')})
samples = ('/*NM-SAMPLES{*/\nconst SAMPLE_BG=' + json.dumps(bg, ensure_ascii=False) + ';\nconst SAMPLE_CH=' + json.dumps(ch, ensure_ascii=False) +
           ';\nconst SAMPLE_CHARS=' + json.dumps(chars, ensure_ascii=False) + ';\nconst LOGO_SRC=' + json.dumps(b64(root / 'assets/logo.png', 'image/png')) + ';\n/*}NM-SAMPLES*/\n')
html = (src / 'index.html').read_text(encoding='utf-8')
import re
css = (src / 'style.css').read_text(encoding='utf-8')
# 画面の文字の大きさ：物語の文字（再生画面の本文など）以外の font-size を --uis でかける
KEEP = ('pwin', 'pname', 'pch', 'pend-t', 'pend-s', 'ptitle-t', 'ptitle-a', 'wk-pn', 'wk-pw', 'nchoice', 'prow', 'pmark', 'pbar')
def scale(m):
    sel, body = m.group(1), m.group(2)
    if any(k in sel for k in KEEP): return m.group(0)
    return sel + '{' + re.sub(r'font-size:(\d+)px', r'font-size:calc(\1px*var(--uis,1))', body) + '}'
css = re.sub(r'([^{}]+)\{([^{}]*)\}', scale, css)
yc = (root / 'vendor/yomogi/400.css').read_text(encoding='utf-8')
yc = re.sub(r"src: url\(\./files/([^)]+\.woff2)\) format\('woff2'\), url\([^)]+\) format\('woff'\);",
            lambda m: "src: url(" + b64(root / 'vendor/yomogi' / m.group(1), 'font/woff2') + ") format('woff2');", yc)
css = yc + '\n' + (root / 'vendor/sakura.min.css').read_text(encoding='utf-8') + '\n' + css
vendor = '\n'.join((root / 'vendor' / f).read_text(encoding='utf-8') for f in ['tsparticles.bundle.min.js', 'sakura.min.js'])
js = '\n'.join((src / f).read_text(encoding='utf-8') for f in order)
out = html.replace('/*CSS*/', css).replace('/*VENDOR*/', vendor).replace('/*SAMPLES*/', samples).replace('/*JS*/', js)
(root / 'novel-maker-edu.html').write_text(out, encoding='utf-8')
print('built', len(out.encode('utf-8')), 'bytes')
