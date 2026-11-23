"""src/ をまとめて、配る用の1ファイル novel-maker-edu.html を作る"""
import pathlib
root = pathlib.Path(__file__).parent
src = root / 'src'
order = ['util.js', 'icons.js', 'db.js', 'audio.js', 'layout.js', 'check.js', 'player.js', 'editor.js', 'app.js']
html = (src / 'index.html').read_text(encoding='utf-8')
css = (src / 'style.css').read_text(encoding='utf-8')
js = '\n'.join((src / f).read_text(encoding='utf-8') for f in order)
out = html.replace('/*CSS*/', css).replace('/*JS*/', js)
(root / 'novel-maker-edu.html').write_text(out, encoding='utf-8')
print('built', len(out.encode('utf-8')), 'bytes')
