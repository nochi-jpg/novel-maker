# チュートリアルを、全部の章で「本物のクリック」で最後まで進めるテスト
import asyncio, pathlib, sys, json
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'test' / 'out_tut'; OUT.mkdir(parents=True, exist_ok=True)
SETUP = (ROOT / 'test' / 'setup.js').read_text()
ONLY = sys.argv[1] if len(sys.argv) > 1 else None
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + str(ROOT / 'novel-maker-edu.html')); await pg.wait_for_timeout(1500)
        await pg.evaluate(SETUP)
        await pg.evaluate("SET.speed = SET_OPT.speed.vals.indexOf(0)")
        n = await pg.evaluate('TUT_CH.length')
        problems = []
        for ci in range(n):
            if ONLY and str(ci) != ONLY: continue
            await pg.evaluate('gotoTitle()'); await pg.wait_for_timeout(200)
            await pg.mouse.click(*await pg.evaluate("(()=>{const r=document.querySelector('.tt-tut').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()"))
            await pg.wait_for_timeout(300)
            btns = await pg.query_selector_all('.tut-ch'); await btns[ci].click(); await pg.wait_for_timeout(800)
            name = await pg.evaluate('TUT.ch.name'); total = await pg.evaluate('TUT.steps.length')
            guard = 0
            while True:
                guard += 1
                if guard > 400: problems.append((name, 'stuck at', await pg.evaluate('TUT.i'))); break
                if await pg.evaluate("!!document.querySelector('#tut .tut-ask')"):
                    await pg.screenshot(path=str(OUT / f'{ci:02d}_end.png')); break
                i = await pg.evaluate('TUT.i')
                await pg.wait_for_timeout(450)
                st = await pg.evaluate("""(()=>{const s=TUT.cur; if(!s) return null; const ts=tutTargets().map(tutRect).filter(Boolean);
                    const bx=tutRect(TUT.box), q=tutRect(TUT.quit), W=document.querySelector('#stage').offsetWidth;
                    const bad=[]; if(bx.x<0||bx.y<0||bx.x+bx.w>W+1||bx.y+bx.h>721) bad.push('box out');
                    ts.forEach(r=>{ if(inter(bx,r,0) && !(r.w>500||r.h>400)) bad.push('box covers target'); if(inter(q,r,0)) bad.push('quit covers target'); });
                    if(s.w!=='next' && !ts.length) bad.push('no target');
                    return {w: typeof s.w==='string'? s.w : 'fn', bad, n: ts.length}; })()""")
                if st is None: continue
                await pg.screenshot(path=str(OUT / f'{ci:02d}_{i:02d}.png'))
                if st['bad']: problems.append((name, i, st['bad']))
                ov = await pg.evaluate('__overflow()')
                if ov: problems.append((name, i, 'overflow', ov[:3]))
                if st['w'] == 'next':
                    await pg.click('#tut .tut-box .btn')
                else:
                    pt = await pg.evaluate("""(()=>{const t=tutTargets()[0]; const r=t.getBoundingClientRect();
                        // 中の押せる部分（スウォッチなど）を優先
                        const inner=t.matches('.sw-row')? t.querySelector('.sw:not(.on)') : null; const rr=(inner||t).getBoundingClientRect();
                        return [rr.x+rr.width/2, rr.y+rr.height/2]; })()""")
                    await pg.mouse.click(*pt)
                for _ in range(20):
                    await pg.wait_for_timeout(100)
                    if await pg.evaluate('TUT.i') != i or await pg.evaluate("!!document.querySelector('#tut .tut-ask')"): break
            # 本物のクリックで外側を押しても進まないこと（ブロック）を1回確認
            print(name, 'steps', total, 'ok')
            await pg.evaluate("document.querySelector('#tut .tut-ask') && document.querySelector('#tut .tut-ask').remove(); tutEnd()")
        works = await pg.evaluate('dbAll("works").then(a=>a.map(w=>w.title))')
        print('works in DB:', works)
        print('problems:', json.dumps(problems, ensure_ascii=False)[:3000])
        print('errors:', errs)
        await b.close()
asyncio.run(main())
