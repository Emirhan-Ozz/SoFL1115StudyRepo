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

if errors:
    print("\n".join("HATA: " + e for e in errors))
    sys.exit(1)

with open(os.path.join(ROOT, "assets", "data.js"), "w", encoding="utf8") as f:
    f.write("// build/make.py tarafından üretildi. Elle düzenleme: build/content.py\n")
    f.write("window.EXAMS = " + json.dumps(site, ensure_ascii=False, indent=1) + ";\n")
with open(os.path.join(ROOT, "audio-src", "scripts.json"), "w", encoding="utf8") as f:
    json.dump({"narrator": NARRATOR, "items": audio}, f, ensure_ascii=False, indent=1)
print("OK: assets/data.js, audio-src/scripts.json")
