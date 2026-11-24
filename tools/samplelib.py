"""サンプル作品づくりの共通部品"""
import json, pathlib
def ch(c, p=0): return {'m': f'I:{c}_{p}', 's': 1, 'y': 0}
NONE = {'m': 'none'}
def chs(l=None, c=None, r=None):
    return {'0': l or NONE, '1': c or NONE, '2': r or NONE}

IDS = {}

def block(key, ep, slot, pages, end):
    lines, cues = [], {}
    for pi, page in enumerate(pages):
        if pi: lines.append('')
        spk = None
        for it in page:
            t, cue = (it, None) if isinstance(it, str) else it
            if t.startswith('【'): spk = t[:t.index('】') + 1]
            elif spk: t = spk + t
            if spk and t.endswith('」'): spk = None
            if cue: cues[str(len(lines))] = cue
            lines.append(t)
    e = {'type': 'next', 'to': None, 'choices': [], 'rules': [], 'else': None, 'name': ''}
    e.update(end)
    return {'id': IDS[key], 'ep': ep, 'slot': slot, 'text': '\n'.join(lines), 'cues': cues, 'end': e}

def nxt(k): return {'type': 'next', 'to': IDS[k]}
def choice(*cs): return {'type': 'choice', 'choices': [{'label': l, 'to': IDS[k]} for l, k in cs]}
def end(name): return {'type': 'end', 'name': name}


def save(name, work):
    out = pathlib.Path(__file__).resolve().parent.parent / 'assets/works' / name
    out.write_text(json.dumps({'app': 'novel-maker-edu', 'version': 1, 'work': work, 'media': {}}, ensure_ascii=False), encoding='utf-8')
    print('wrote', out, len(work['blocks']), 'blocks')
