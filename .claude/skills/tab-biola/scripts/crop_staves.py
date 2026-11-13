"""Potong partitur (PDF/gambar) menjadi satu gambar per baris paranada, plus dua belahan yang diperbesar.

Pakai: python3 crop_staves.py <partitur.pdf|png> <folder-output>
Hasil: s00.png, s01.png, ... (satu baris penuh, dengan ruang untuk garis bantu)
       z000.png, z001.png, ... (belahan kiri/kanan tiap baris, untuk membaca not rendah/tinggi)
"""
import os, subprocess, sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

pages = []
if src.lower().endswith(".pdf"):
    subprocess.run(["pdftoppm", "-r", "400", "-png", src, os.path.join(out, "page")], check=True)
    pages = sorted(os.path.join(out, f) for f in os.listdir(out) if f.startswith("page") and f.endswith(".png"))
else:
    pages = [src]

n = 0
for p in pages:
    im = Image.open(p).convert("L")
    a = np.array(im) < 128
    H, W = a.shape
    rows = [y for y in range(H) if a[y].sum() > W * 0.5]      # garis paranada = baris gelap yang panjang
    lines = []
    for y in rows:
        if lines and y - lines[-1][-1] <= 2: lines[-1].append(y)
        else: lines.append([y])
    c = [sum(l) / len(l) for l in lines]
    for i in range(0, len(c) - 4, 5):
        s = c[i:i + 5]
        sp = (s[4] - s[0]) / 4
        crop = im.crop((0, int(s[0] - 5 * sp), W, int(s[4] + 5 * sp)))
        crop.save(os.path.join(out, f"s{n:02d}.png"))
        cw = crop.size[0]; x0 = int(cw * 0.11); half = (int(cw * 0.89) - x0) // 2
        for j in range(2):
            crop.crop((x0 + j * half - 20, 0, x0 + (j + 1) * half + 20, crop.size[1])).save(os.path.join(out, f"z{n:02d}{j}.png"))
        n += 1
print(f"{n} baris paranada -> {out}")
