import asyncio, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'test' / 'out2'; OUT.mkdir(parents=True, exist_ok=True)
SETUP = (ROOT / 'test' / 'setup.js').read_text()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width': 1366, 'height': 768})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await pg.goto('file://' + str(ROOT / 'novel-maker-edu.html')); await pg.wait_for_timeout(500)
        await pg.evaluate(SETUP)
        n = [0]
        async def shot(name):
            n[0] += 1
            await pg.wait_for_timeout(250)
            await pg.screenshot(path=str(OUT / f'{n[0]:02d}_{name}.png'))
            bad = await pg.evaluate('__overflow()')
            if bad: print(name, 'OVERFLOW', bad[:6])
        B = lambda name, exact=True: pg.get_by_role('button', name=name, exact=exact)
        async def click(name, exact=True, nth=0):
            await B(name, exact).nth(nth).click()
        async def scr():
            await pg.wait_for_timeout(400)
            return await pg.evaluate("[...document.querySelectorAll('.screen')].find(s=>s.classList.contains('show')).id")
        await shot('title')
        await click('作る'); print('after 作る:', await scr())
        await pg.locator('.card-new').click(); await shot('wizard')
        await pg.locator('.dlg-wz2 input').first.fill('ためしのお話')
        await click('使う')
        await pg.locator('.dlg-wz2').get_by_role('button', name='作る', exact=True).click()
        print('after wizard:', await scr()); await shot('map')
        await pg.locator('.card-empty').first.click(); await shot('map_added')
        await pg.locator('.bcard').first.click()
        await click('選択肢を出す'); await shot('choice')
        await pg.locator('.tgt').first.click(); await shot('pick')
        await pg.locator('.bcard.pickable').first.click(); await shot('picked')
        # ステップ移動
        await pg.locator('.step', has_text='文章を書く').click(); print('tab:', await pg.evaluate('E.tab'))
        await pg.locator('.ta').fill('【たろう】きょうは森へ行こう。\nどこへ行こうかな。\n\n森の入り口に着いた。')
        await shot('text')
        await pg.locator('.step', has_text='絵と音').click(); print('tab:', await pg.evaluate('E.tab')); await shot('fx0')
        await click('この行に入れる'); print('guide:', await pg.locator('.g-msg').text_content())
        await pg.locator('.ln').first.click()
        await pg.locator('.lcard.folder').first.click(); await shot('fx_sample_bg')
        await pg.locator('.lcard').nth(1).click(); await click('この行に入れる'); await shot('fx_bg_set')
        await click('人物'); await pg.locator('.lcard.folder').first.click(); await shot('fx_chars')
        await pg.locator('.lcard.folder').nth(1).click(); await pg.locator('.lcard').nth(3).click()
        await click('中央に入れる'); await shot('fx_ch_set')
        await click('効果音'); await pg.locator('.lcard.folder').first.click(); await pg.locator('.lcard.folder').nth(4).click(); await shot('fx_se_cat')
        await pg.locator('.lcard').nth(2).click(); await click('この行に入れる'); await shot('fx_se_set')
        await click('BGM'); await pg.locator('.lcard.folder').first.click(); await shot('fx_bgm')
        await click('エフェクト'); await shot('fx_ef_root')
        await pg.locator('.lcard.folder').first.click(); await pg.locator('.lcard').nth(2).click(); await shot('fx_ef_once')
        await click('この行に入れる')
        await click('上へ'); await pg.locator('.lcard.folder').nth(2).click(); await pg.locator('.lcard').nth(1).click(); await click('この行に入れる'); await shot('fx_ef_set')
        await click('BGM'); await click('整理'); await shot('manager')
        await click('新しいフォルダ'); await pg.locator('.dlg-ask input').fill('森の絵'); await pg.locator('.dlg-ask').get_by_role('button', name='OK').click(); await shot('manager_folder')
        await pg.locator('.dlg-mg').get_by_role('button', name='とじる').click()
        await pg.locator('.step', has_text='しあげ・送る').click(); await shot('work')
        await click('手書き風'); await shot('work_tegaki')
        await pg.locator('.step', has_text='お話をつなぐ').click(); print('tab:', await pg.evaluate('E.tab'))
        await click('ためす'); print('after ためす:', await scr()); await pg.wait_for_timeout(600); await shot('play_title')
        await click('はじめから'); await pg.wait_for_timeout(1500); await shot('play')
        await pg.locator('#scr-play').get_by_role('button', name='もどる').click(); print('after play もどる:', await scr(), await pg.evaluate('E.tab'))
        await click('設定'); await shot('settings')
        await click('小'); await click('とじる'); await shot('uifs_small')
        await click('設定'); await click('中'); await click('とじる')
        await click('もどる'); print('after editor もどる:', await scr()); await shot('select')
        await click('もどる'); print('after select もどる:', await scr())
        # サウンドノベル型
        await pg.evaluate('''(async()=>{ const w=newWork({title:'ノベル', long:true, branch:true, flag:false, title_:false, mode:'novel'});
          const b1=startBlock(w); b1.text='夜の森は、しんとしていた。\\n遠くでフクロウが鳴いている。\\nぼくは、どちらへ進むか考えた。';
          b1.cues[0]={bg:'I:bg01',weather:'snow'}; b1.cues[1]={ef:[{t:'shakeS'}]};
          const a=newBlock(2,0); a.text='川へ向かった。'; w.blocks[a.id]=a; const c=newBlock(2,1); c.text='山へ向かった。'; w.blocks[c.id]=c;
          b1.end={type:'choice',to:null,choices:[{label:'川へ行く',to:a.id},{label:'山へ行く',to:c.id}],rules:[],else:null,name:''};
          await saveWork(w); playWork(w,{test:true,onBack:()=>gotoTitle()}); })()''')
        await pg.wait_for_timeout(1200); await shot('novel1')
        for i in range(4): await pg.mouse.click(1100, 640); await pg.wait_for_timeout(500)
        await shot('novel_choice')
        await pg.locator('.nchoice').nth(1).click(); await pg.wait_for_timeout(900); await shot('novel_after')
        await pg.evaluate("gotoTitle()")
        # マップのスクロール（エピソード9まで）
        await pg.evaluate('''(async()=>{ const w=newWork({title:'長いお話', long:true, branch:true}); let prev=startBlock(w);
          for(let e=2;e<=9;e++){ const b=newBlock(e,0); b.text='エピソード'+e; w.blocks[b.id]=b; prev.end.type='next'; prev.end.to=b.id; prev=b; }
          await saveWork(w); APP.mode='make'; openEditor(w); })()''')
        await pg.wait_for_timeout(800); await shot('map_scroll0')
        await pg.mouse.move(400, 300); await pg.mouse.wheel(0, 900); await pg.wait_for_timeout(400); await shot('map_scroll1')
        print('errors:', errs[:8])
        await b.close()
asyncio.run(main())
