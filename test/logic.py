import asyncio, pathlib, json
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': 1280, 'height': 720}, accept_downloads=True)
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await pg.goto('file://' + str(ROOT / 'novel-maker-edu.html')); await pg.wait_for_timeout(300)
        await pg.evaluate((ROOT / 'test' / 'setup.js').read_text())
        r = await pg.evaluate("""async () => {
          const out = {};
          const w = newWork({title:'T', long:true, branch:true, flag:true, title_:false});
          const add=(ep,sl,t)=>{const b=newBlock(ep,sl);b.text=t;w.blocks[b.id]=b;return b;};
          const b1=startBlock(w); b1.text='はじめ';
          const a=add(2,0,'A'), bb=add(2,1,'B'), m=add(3,0,'M'), g=add(4,0,'G'), n=add(4,1,'N');
          b1.end={type:'choice',to:null,choices:[{label:'a',to:a.id},{label:'b',to:bb.id}],rules:[],else:null,name:''};
          a.end.type='next';a.end.to=m.id; bb.end.type='next'; bb.end.to=m.id;
          m.end.type='cond'; m.end.rules=[{groups:[[{t:'chose',b:b1.id,c:0}]],to:g.id}]; m.end.else=n.id;
          g.end.name='good'; n.end.name='normal';
          let c = analyze(w); out.clean = c.count;
          // 矛盾：A を選んだ かつ B を通った
          m.end.rules.push({groups:[[{t:'pass',b:a.id},{t:'pass',b:bb.id}]],to:g.id});
          c = analyze(w); out.never = (c.issues[m.id]||[]).map(x=>x.type);
          m.end.rules.pop();
          // ループ：N → 3 に戻る（条件で抜けられない）
          n.end.type='next'; n.end.to=m.id; c = analyze(w); out.loop = (c.issues[n.id]||[]).map(x=>x.type);
          n.end.type='end';
          await saveWork(w);
          // 再生：A を選ぶ → good
          await playWork(w,{test:true,onBack:()=>{}}); await sleep(200);
          advance(); await sleep(50); advance(); await sleep(50);
          out.choices = $$('#pchoices button').length;
          choose(0); for (let i=0;i<8;i++){ advance(); await sleep(30); }
          out.endA = $('.pend-s') && $('.pend-s').textContent;
          clearPanel(); restart(); await sleep(50); advance(); advance(); choose(1);
          for (let i=0;i<8;i++){ advance(); await sleep(30); }
          out.endB = $('.pend-s') && $('.pend-s').textContent;
          // セーブ・ロード
          clearPanel(); restart(); advance(); advance(); choose(1); advance();
          await dbPut('saves', curState(), w.id+':s1');
          const s1 = await dbGet('saves', w.id+':s1');
          clearPanel(); restart(); loadState(s1); out.loaded = P.b===s1.b && P.hist.length===s1.hist.length;
          for (let i=0;i<8;i++){ advance(); await sleep(30); }
          out.endLoad = $('.pend-s') && $('.pend-s').textContent;
          // cue のずれ
          const blk={text:'a\\nb\\nc', cues:{1:{se:'S:pon'},2:{fx:1}}};
          shiftCues(blk,'a\\nb\\nc','a\\nx\\ny\\nb\\nc'); out.shift = Object.keys(blk.cues).join(',');
          // 書き出し→読みこみ（別の作品に）
          const media = {}; const json = JSON.stringify({app:APP_ID,version:1,work:w,media});
          const f = new File([json],'t.json');
          setTimeout(()=>{ const bs=$$('.modal .btn'); bs[1] && bs[1].click(); }, 300);
          const w2 = await importFile(f); out.importNew = !!w2 && w2.id !== w.id && Object.keys(w2.blocks).length===6;
          // ページ分け（長い行）
          const lb = {text:'あ'.repeat(200), cues:{}}; out.pages = paginate(lb,1280,false).length;
          // 内蔵の音
          auInit(); for (const s of SE_LIST) playSE('S:'+s[0]); for (const m of BGM_LIST){ playBGM('M:'+m.id); await sleep(120);} stopBGM();
          out.sounds = SE_LIST.length + '/' + BGM_LIST.length;
          return out;
        }""")
        print(json.dumps(r, ensure_ascii=False, indent=1)); print('errors', errs[:8])
        await b.close()
asyncio.run(main())
