# -*- coding: utf-8 -*-
"""MBP1104: soruları gerçek Python ile doğrular, akış diyagramı SVG'lerini çizer, python/data.js yazar.

Kullanım: python3 build/make_py.py
"""
import json
import os
import re
import subprocess
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "build"))
from py_content import EXAMS, FORMAT_NOTE, POINTS  # noqa: E402

RUNNER = r"""
import sys, json
_inp = json.loads(sys.argv[1])
def input(prompt=''):
    return _inp.pop(0)
exec(compile(sys.stdin.read(), '<kod>', 'exec'))
"""


def run(code, inp=()):
    r = subprocess.run([sys.executable, "-I", "-c", RUNNER, json.dumps(list(inp))], input=code,
                       capture_output=True, text=True, timeout=5)
    if r.returncode:
        return "HATA: " + r.stderr.strip().splitlines()[-1]
    return "\n".join(line.rstrip() for line in r.stdout.rstrip().splitlines())


def norm(s):
    s = s.lower().replace("ı", "i").replace("ç", "c").replace("ş", "s").replace("ğ", "g").replace("ü", "u").replace("ö", "o")
    return re.sub(r"\s+", "", s)


# ---------------------------------------------------------------- SVG
W, CX, SX, STEP = 460, 170, 360, 62
STROKE, FILL, TEXT, BLANK = "#aeb4bd", "#252930", "#e4e6ea", "#8fb3d9"


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def shape(kind, x, y, label):
    col = BLANK if re.fullmatch(r"\(\d\)", label) else TEXT
    fw = ' font-weight="600"' if col == BLANK else ""
    t = f'<text x="{x}" y="{y + 5}" text-anchor="middle" stroke="none" fill="{col}"{fw}>{esc(label)}</text>'
    w = max(110, 9 * len(label) + 30)
    if kind == "term":
        s = f'<ellipse cx="{x}" cy="{y}" rx="{max(50, w / 2 - 5)}" ry="18"/>'
        return s + t, 18
    if kind == "in":
        h, k = 18, 12
        s = f'<polygon points="{x - w/2 + k},{y - h} {x + w/2 + k},{y - h} {x + w/2 - k},{y + h} {x - w/2 - k},{y + h}"/>'
        return s + t, h
    if kind == "proc":
        return f'<rect x="{x - w/2}" y="{y - 18}" width="{w}" height="36"/>' + t, 18
    if kind == "out":  # yazdırma: alt kenarı dalgalı belge şekli
        h = 18
        s = (f'<path d="M{x - w/2},{y - h} H{x + w/2} V{y + h - 4} '
             f'Q{x + w/4},{y + h - 12} {x},{y + h - 4} T{x - w/2},{y + h - 4} Z"/>')
        return s + t, h - 4
    if kind == "dec":
        dw, dh = max(70, 5 * len(label) + 40), 30
        s = f'<polygon points="{x},{y - dh} {x + dw},{y} {x},{y + dh} {x - dw},{y}"/>'
        return s + t, dh
    raise ValueError(kind)


def arrow(pts):
    d = "M" + " L".join(f"{a},{b}" for a, b in pts)
    return f'<path d="{d}" fill="none" marker-end="url(#ah)"/>'


def lab(x, y, s):
    return f'<text x="{x}" y="{y}" font-size="12" stroke="none" fill="{STROKE}">{s}</text>'


def svg(chart):
    parts, y = [], 40
    tops = []        # her ana-kolon düğümünün üst y'si
    prev_bottom = None
    i = 0
    for node in chart:
        kind, label = node[0], node[1]
        opt = node[2] if len(node) > 2 else {}
        if kind == "dec":
            y += 12
        if prev_bottom is not None:
            pass
        s, half = shape(kind, CX, y, label)
        tops.append(y - half)
        if prev_bottom is not None:
            parts.append(arrow([(CX, prev_bottom), (CX, y - half)]))
        parts.append(s)
        bottom = y + half
        if kind == "dec" and "yes" in opt:
            # E aşağı, H sağa; altta birleşir
            dw = max(70, 5 * len(label) + 40)
            yr = y + STEP + 14
            s1, h1 = shape(opt["yes"][0], CX, yr, opt["yes"][1])
            s2, h2 = shape(opt["no"][0], SX, yr, opt["no"][1])
            parts += [arrow([(CX, bottom), (CX, yr - h1)]), lab(CX + 6, bottom + 14, "E"), s1,
                      arrow([(CX + dw, y), (SX, y), (SX, yr - h2)]), lab(CX + dw + 6, y - 6, "H"), s2]
            yj = yr + STEP - 4
            parts += [f'<circle cx="{CX}" cy="{yj}" r="6"/>',
                      arrow([(CX, yr + h1), (CX, yj - 6)]),
                      arrow([(SX, yr + h2), (SX, yj), (CX + 6, yj)])]
            y, bottom = yj, yj + 6
        elif kind == "dec" and "back" in opt:
            dw = max(70, 5 * len(label) + 40)
            ty = tops[opt["back"]] + 18
            lx = 40
            parts += [arrow([(CX - dw, y), (lx, y), (lx, ty), (CX - 70, ty)]), lab(CX - dw - 16, y - 6, "E"),
                      lab(CX + 6, bottom + 14, "H")]
        prev_bottom = bottom
        y += STEP + (12 if kind == "dec" else 0)
        i += 1
    h = y - STEP + 40
    return (f'<svg viewBox="0 0 {W} {h}" width="{W}" xmlns="http://www.w3.org/2000/svg" class="flow" '
            f'font-family="system-ui, sans-serif" font-size="14">'
            f'<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">'
            f'<path d="M0,0 L10,5 L0,10 z" fill="{STROKE}"/></marker></defs>'
            f'<g stroke="{STROKE}" stroke-width="1.6" fill="{FILL}">' + "".join(parts) + "</g></svg>")


# ---------------------------------------------------------------- doğrulama
errors = []
out_exams = []
for ex in EXAMS:
    qs = ex["q"]
    kinds = [q["t"] for q in qs]
    if kinds != ["mc"] * 2 + ["fill"] * 4 + ["code"] * 3 + ["flow"]:
        errors.append(f"{ex['id']}: soru sırası/sayısı yanlış: {kinds}")
    for n, q in enumerate(qs, 1):
        tag = f"{ex['id']} S{n}"
        if q["t"] == "mc":
            if "code" in q:
                got = run(q["code"])
                if got != q["opts"][q["a"]]:
                    errors.append(f"{tag}: çıktı {got!r}, doğru şık {q['opts'][q['a']]!r}")
                for k, o in enumerate(q["opts"]):
                    if k != q["a"] and o == got:
                        errors.append(f"{tag}: yanlış şık da doğru çıktıyla aynı")
        elif q["t"] == "fill":
            if q["code"].count("____") != 1:
                errors.append(f"{tag}: tek boşluk olmalı")
            for a in q["ans"]:
                got = run(q["code"].replace("____", a), q.get("inp", []))
                if got != q["out"]:
                    errors.append(f"{tag}: '{a}' ile çıktı {got!r}, beklenen {q['out']!r}")
        elif q["t"] == "code":
            if len(q["sol"].splitlines()) > 5:
                errors.append(f"{tag}: çözüm 5 satırdan uzun")
            for t in q["tests"]:
                got = run(q["sol"], t["inp"])
                if got != t["out"]:
                    errors.append(f"{tag}: girdi {t['inp']} çıktı {got!r}, beklenen {t['out']!r}")
        elif q["t"] == "flow":
            nb = sum(1 for node in q["chart"] for x in [node[1]] + ([node[2]["yes"][1]] if len(node) > 2 and "yes" in node[2] else []) if re.fullmatch(r"\(\d\)", x))
            if nb != len(q["blanks"]) or nb != len(q["labels"]):
                errors.append(f"{tag}: boşluk sayısı tutmuyor")
            q["svg"] = svg(q["chart"])
            q["svgFull"] = svg(q["full"])
            q["blanks"] = [[norm(a) for a in b] for b in q["blanks"]]
            del q["chart"], q["full"]
    mcs = Counter("ABCD"[q["a"]] for q in qs if q["t"] == "mc")
    print(f"{ex['id']}: {dict(Counter(kinds))}  test cevapları {dict(mcs)}")
    out_exams.append(ex)

if errors:
    print("\n".join("HATA: " + e for e in errors))
    sys.exit(1)

os.makedirs(os.path.join(ROOT, "python"), exist_ok=True)
with open(os.path.join(ROOT, "python", "data.js"), "w", encoding="utf8") as f:
    f.write("// build/make_py.py tarafından üretildi. Elle düzenleme: build/py_content.py\n")
    f.write("window.PY = " + json.dumps({"note": FORMAT_NOTE, "points": POINTS, "exams": out_exams}, ensure_ascii=False, indent=1) + ";\n")
print("OK: tüm cevaplar Python ile doğrulandı -> python/data.js")
