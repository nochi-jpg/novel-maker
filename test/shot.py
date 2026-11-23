import sys, asyncio, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'test' / 'out'; OUT.mkdir(parents=True, exist_ok=True)
SETUP = (ROOT / 'test' / 'setup.js').read_text(encoding='utf-8')
async def main(steps):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + str(ROOT / 'novel-maker-edu.html'))
        await pg.wait_for_timeout(400)
        await pg.evaluate(SETUP)
        for name, js, wait in steps:
            if js: await pg.evaluate(js)
            await pg.wait_for_timeout(wait)
            await pg.screenshot(path=str(OUT / (name + '.png')))
            # はみ出しチェック：ステージ外・親からはみ出す文字
            bad = await pg.evaluate("window.__overflow ? window.__overflow() : []")
            if bad: print(name, 'OVERFLOW', bad[:8])
        print('errors:', errs[:10])
        await b.close()
steps = eval((ROOT / 'test' / sys.argv[1]).read_text(encoding='utf-8'))
asyncio.run(main(steps))
