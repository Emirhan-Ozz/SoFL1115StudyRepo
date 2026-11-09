# -*- coding: utf-8 -*-
"""content.py -> assets/data.js + audio-src/scripts.json, ve yapı kontrolleri.

Kullanım: python3 build/make.py
"""
import json
import os
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "build"))
from content import EXAMS, NARRATOR  # noqa: E402
from vocab import VOCAB  # noqa: E402
import re

errors = []


def check(cond, msg):
    if not cond:
        errors.append(msg)


site, audio = [], []
for ex in EXAMS:
    eid = ex["id"]
    L = ex["listening"]
    secs = L["sections"]
    check(len(secs) == 2, f"{eid}: 2 dinleme bölümü olmalı")
    check(len(secs[0]["questions"]) == 10, f"{eid}: Section 1 = 10 soru")
    check(len(secs[1]["questions"]) == 5, f"{eid}: Section 2 = 5 soru")
    check(len(ex["reading"]) == 4, f"{eid}: 4 okuma metni")
    for i, t in enumerate(ex["reading"]):
        check(len(t["questions"]) == 5, f"{eid}: metin {i+1} = 5 soru")
        for q in t["questions"]:
            check((len(q["opts"]) == 2) == (i < 2), f"{eid}: metin {i+1} soru tipi (1-2 D/Y, 3-4 abc)")
    allq = [q for s in secs for q in s["questions"]] + [q for t in ex["reading"] for q in t["questions"]]
    for q in allq:
        check(0 <= q["a"] < len(q["opts"]), f"{eid}: geçersiz cevap: {q['q']}")
        check(q.get("exp"), f"{eid}: açıklama yok: {q['q']}")
    tfc = Counter(q["opts"][q["a"]] for q in allq if len(q["opts"]) == 2)
    mcc = Counter("abc"[q["a"]] for q in allq if len(q["opts"]) == 3)
    print(f"{eid:9} D/Y {dict(tfc)}  abc {dict(sorted(mcc.items()))}")

    out = json.loads(json.dumps(ex))
    for si, s in enumerate(out["listening"]["sections"]):
        if "script" in s:
            s["audio"] = f"audio/{eid}-s{si+1}.mp3"
            audio.append({
                "file": f"audio/{eid}-s{si+1}.mp3",
                "kind": "dialog" if si == 0 else "speakers",
                "intro": s["intro"],
                "voices": s["voices"],
                "script": s["script"],
            })
            # site için sesler gereksiz, cinsiyet ipucu yeterli
            s["gender"] = {k: ("m" if any(x in v for x in ("Ryan", "Thomas", "Guy", "Christopher", "Prabhat", "Connor")) else "f") for k, v in s["voices"].items()}
            del s["voices"]
    site.append(out)


# ---- kelimeler ----
corpus = {}
for ex in EXAMS:
    parts = []
    for s in ex["listening"]["sections"]:
        parts += [s["instr"]] + [t for _, t in s.get("script", [])] + [q["q"] + " " + " ".join(q["opts"]) for q in s["questions"]]
    for t in ex["reading"]:
        parts += t["body"] + [q["q"] + " " + " ".join(q["opts"]) for q in t["questions"]]
    w = ex["writing"]
    parts += [w["model"]] + [r[1] for r in w["info"]]
    corpus[ex["id"]] = re.sub(r"\s+", " ", " ".join(parts)).lower().replace("’", "'")
vocab_out = []
for gid, title, block in VOCAB:
    kind, items = "w", []
    for line in block.strip().splitlines():
        line = line.strip()
        if line in ("[kelime]", "[tabir]"):
            kind = "w" if line == "[kelime]" else "p"
            continue
        en, tr = [x.strip() for x in line.split(" = ", 1)]
        items.append([en, tr, kind])
        if gid in corpus:
            m = re.match(r"(.*?)\s*\((.*)\)$", en)
            forms = [m.group(1), m.group(2)] if m else [en]
            if not any(f.lower().rstrip(".?") in corpus[gid] for f in forms):
                print(f"UYARI: '{en}' {gid} metninde yok")
    seen = Counter(i[0].lower() for i in items)
    for k, v in seen.items():
        if v > 1:
            print(f"UYARI: '{k}' {gid} içinde {v} kez")
    vocab_out.append({"id": gid, "title": title, "items": items})
print("kelime:", sum(len(g["items"]) for g in vocab_out))

if errors:
    print("\n".join("HATA: " + e for e in errors))
    sys.exit(1)

with open(os.path.join(ROOT, "assets", "data.js"), "w", encoding="utf8") as f:
    f.write("// build/make.py tarafından üretildi. Elle düzenleme: build/content.py\n")
    f.write("window.EXAMS = " + json.dumps(site, ensure_ascii=False, indent=1) + ";\n")
    f.write("window.VOCAB = " + json.dumps(vocab_out, ensure_ascii=False) + ";\n")
with open(os.path.join(ROOT, "audio-src", "scripts.json"), "w", encoding="utf8") as f:
    json.dump({"narrator": NARRATOR, "items": audio}, f, ensure_ascii=False, indent=1)
print("OK: assets/data.js, audio-src/scripts.json")

# ---- önbellek kırıcı: html'lerdeki yerel js/css bağlantılarına ?v=<özet> ekle ----
import hashlib
for rel in ("index.html", "python/index.html"):
    idx = os.path.join(ROOT, rel)
    if not os.path.exists(idx):
        continue
    base = os.path.dirname(idx)
    html = open(idx, encoding="utf8").read()
    def _v(m):
        f = os.path.normpath(os.path.join(base, m.group(2)))
        h = hashlib.sha1(open(f, "rb").read()).hexdigest()[:8]
        return f'{m.group(1)}="{m.group(2)}?v={h}"'
    html = re.sub(r'(src|href)="((?!http)[\w./-]+\.(?:js|css))(?:\?v=\w+)?"', _v, html)
    open(idx, "w", encoding="utf8").write(html)
print("html sürüm etiketleri güncellendi")
