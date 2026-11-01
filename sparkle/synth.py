"""Suara biola sederhana (aditif + vibrato) untuk video tab."""
import json, sys, wave
import numpy as np

SR = 44100
ev = json.load(open(sys.argv[1]))
eighth, lead, dur = ev["eighth"], ev["LEAD"], ev["dur"]
out = np.zeros(int((dur + 1) * SR))
harm = [1.0, 0.55, 0.38, 0.25, 0.18, 0.12, 0.08, 0.05]

for e in ev["events"]:
    f0 = 440 * 2 ** ((e["m"] - 69) / 12)
    st = (e["s"] + lead) * eighth
    ln = e["d"] * eighth
    n = int(ln * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.25) / 0.3, 0, 1)
    phase = 2 * np.pi * f0 * np.cumsum(vib) / SR
    sig = sum(a * np.sin(k * phase) for k, a in enumerate(harm, 1) if k * f0 < 9000)
    att, rel = min(0.06, ln / 4), min(0.08, ln / 4)
    envl = np.ones(n)
    envl[: int(att * SR)] = np.linspace(0, 1, int(att * SR))
    r = int(rel * SR)
    envl[n - r:] *= np.linspace(1, 0, r)
    envl *= 1 - 0.15 * np.clip(t / max(ln, 1e-3), 0, 1)
    i0 = int(st * SR)
    out[i0:i0 + n] += sig * envl

out /= max(1e-9, np.abs(out).max()) / 0.8
pcm = (out * 32767).astype(np.int16)
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
