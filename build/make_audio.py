# -*- coding: utf-8 -*-
"""audio-src/scripts.json -> audio/*.mp3 (edge-tts + ffmpeg).

GitHub Actions'ta çalışır. Elle: pip install edge-tts && python build/make_audio.py
Metni değişmeyen dosyalar yeniden üretilmez (audio/manifest.json içindeki özet).
Gerçek sınav gibi: giriş, okuma süresi, metin, "Now listen again", metin tekrar.
"""
import asyncio
import hashlib
import json
import os
import subprocess
import sys
import tempfile

import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RATE = "-8%"          # A1 seviyesi: biraz yavaş
FALLBACK = {"m": "en-US-GuyNeural", "f": "en-US-JennyNeural"}


async def tts(text, voice, path):
    for v in (voice, FALLBACK["m" if any(x in voice for x in ("Ryan", "Thomas", "Guy", "Christopher", "Prabhat", "Connor")) else "f"]):
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, v, rate=RATE).save(path)
                if os.path.getsize(path) > 0:
                    return
            except Exception as e:  # ağ hatası ya da ses yok
                print(f"  ! {v} deneme {attempt+1}: {e}", file=sys.stderr)
                await asyncio.sleep(2)
    raise RuntimeError(f"TTS başarısız: {text[:40]}")


def ff(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


async def build(item, narrator, tmp):
    parts = []
    n = [0]

    async def say(text, voice):
        n[0] += 1
        mp3 = os.path.join(tmp, f"p{n[0]}.mp3")
        wav = os.path.join(tmp, f"p{n[0]}.wav")
        await tts(text, voice, mp3)
        ff("-i", mp3, "-ar", "24000", "-ac", "1", wav)
        parts.append(wav)

    def gap(sec):
        n[0] += 1
        wav = os.path.join(tmp, f"s{n[0]}.wav")
        ff("-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", str(sec), wav)
        parts.append(wav)

    async def body():
        prev = None
        for spk, text in item["script"]:
            if item["kind"] == "speakers":
                gap(1.5)
                await say(spk.replace("Speaker", "Speaker") + ".", narrator)
                gap(0.8)
            elif prev is not None:
                gap(0.45)
            await say(text, item["voices"][spk])
            prev = spk

    await say(item["intro"], narrator)
    await say("You will hear it twice. You have twenty seconds to read the questions.", narrator)
    gap(20)
    await body()
    gap(4)
    await say("Now listen again.", narrator)
    gap(1.5)
    await body()
    gap(2)
    await say("That is the end of this section.", narrator)

    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w") as f:
        f.writelines(f"file '{p}'\n" for p in parts)
    out = os.path.join(ROOT, item["file"])
    ff("-f", "concat", "-safe", "0", "-i", lst, "-ac", "1", "-b:a", "64k", out)


async def main():
    data = json.load(open(os.path.join(ROOT, "audio-src", "scripts.json"), encoding="utf8"))
    man_path = os.path.join(ROOT, "audio", "manifest.json")
    manifest = json.load(open(man_path)) if os.path.exists(man_path) else {}
    changed = 0
    for item in data["items"]:
        key = hashlib.sha1(json.dumps([item, data["narrator"], RATE], sort_keys=True).encode()).hexdigest()
        out = os.path.join(ROOT, item["file"])
        if manifest.get(item["file"]) == key and os.path.exists(out):
            print("aynı:", item["file"])
            continue
        print("üretiliyor:", item["file"])
        with tempfile.TemporaryDirectory() as tmp:
            await build(item, data["narrator"], tmp)
        manifest[item["file"]] = key
        changed += 1
    with open(man_path, "w") as f:
        json.dump(manifest, f, indent=1, sort_keys=True)
    print(f"{changed} dosya üretildi.")


asyncio.run(main())
