"""Suara biola sederhana (aditif + vibrato, atau petikan untuk pizz.) untuk video tab."""
import json, sys, wave
import numpy as np

SR = 44100
ev = json.load(open(sys.argv[1]))
eighth, lead, dur = ev["eighth"], ev["LEAD"], ev["dur"]
out = np.zeros(int((dur + 2) * SR))
harm = [1.0, 0.55, 0.38, 0.25, 0.18, 0.12, 0.08, 0.05]

for e in ev["events"]:
    f0 = 440 * 2 ** ((e["m"] - 69) / 12)
    st = (e["s"] + lead) * eighth
    ln = e["d"] * eighth
    if e.get("pizz"):
        n = int(0.6 * SR)
        t = np.arange(n) / SR
        sig = sum(a * np.sin(2 * np.pi * k * f0 * t) * np.exp(-t * (5 + 3 * k))
                  for k, a in enumerate(harm, 1) if k * f0 < 9000)
        envl = np.minimum(1, t / 0.003) * 1.3
    else:
        n = int(ln * SR)
        t = np.arange(n) / SR
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.25) / 0.3, 0, 1)
        f = np.full(n, f0)
        if e.get("trill"):                      # trill: gantian nada asli dan nada atas tiap 0.075 detik
            f1 = 440 * 2 ** ((e["trill"] - 69) / 12)
            f = np.where((t // 0.075).astype(int) % 2 == 1, f1, f0)
            vib = np.ones(n)
        phase = 2 * np.pi * np.cumsum(f * vib) / SR
        sig = sum(a * np.sin(k * phase) for k, a in enumerate(harm, 1) if k * f0 < 9000)
        att, rel = int(min(0.06, ln / 4) * SR), int(min(0.08, ln / 4) * SR)
        envl = np.ones(n)
        envl[:att] = np.linspace(0, 1, att)
        envl[n - rel:] *= np.linspace(1, 0, rel)
        envl *= 1 - 0.15 * np.clip(t / max(ln, 1e-3), 0, 1)
    i0 = int(st * SR)
    out[i0:i0 + n] += sig * envl

out /= max(1e-9, np.abs(out).max()) / 0.8
pcm = (out * 32767).astype(np.int16)
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
