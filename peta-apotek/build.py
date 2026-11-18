#!/usr/bin/env python3
"""Olah data mentah (data/raw/jabodetabek.json) menjadi:
  hasil/apotek_jabodetabek.csv
  hasil/apotek_jabodetabek.xlsx   (sheet: Apotek, Per Kab-Kota, Per Jaringan)
"""
import json
import os
import re
from collections import Counter

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "data", "raw", "jabodetabek.json")
OUT = os.path.join(HERE, "hasil")

# Jaringan apotek: (label, pola regex pada nama/brand)
JARINGAN = [
    ("Kimia Farma", r"kimia\s*farma"),
    ("K-24", r"\bk\s*-?\s*24\b"),
    ("Century", r"\bcentury\b"),
    ("Guardian", r"\bguardian\b"),
    ("Viva Generik", r"\bviva\b"),
    ("Roxy", r"\broxy\b"),
    ("Watsons", r"\bwatsons\b"),
    ("Boots", r"\bboots\b"),
]
LAIN = "Independen/Lainnya"


def jaringan(nama, brand):
    teks = f"{brand} {nama}".lower()
    for label, pola in JARINGAN:
        if re.search(pola, teks):
            return label
    # Pakai tag brand hanya kalau memang terdengar seperti apotek (ada salah input, mis. merek hotel)
    if re.search(r"apot|farma|pharm", brand.lower()):
        return brand.strip()
    return LAIN


def alamat(t):
    jalan = " ".join(x for x in [t.get("addr:street", ""), t.get("addr:housenumber", "")] if x)
    bagian = [jalan, t.get("addr:village", "") or t.get("addr:hamlet", ""),
              t.get("addr:subdistrict", "") or t.get("addr:district", ""),
              t.get("addr:city", ""), t.get("addr:postcode", "")]
    return ", ".join(x for x in bagian if x) or t.get("addr:full", "")


def kategori(nama, jar):
    n = nama.lower()
    if jar != LAIN and jar in {j for j, _ in JARINGAN}:
        return "Apotek (jaringan)"
    if re.search(r"\bapot(e|i)k\b|\bfarma\b|\bpharma", n):
        return "Apotek"
    if re.search(r"toko obat|\bherbal\b", n):
        return "Toko obat / herbal"
    return "Perlu dicek"


def tandai_duplikat(df, jarak_m=60):
    """Tandai titik dengan nama mirip yang berjarak < jarak_m (kemungkinan dicatat dua kali)."""
    import math
    kunci = df["nama"].str.lower().str.replace(r"\bapoti?k\b|\bapotek\b|[^a-z0-9 ]", "", regex=True)
    kunci = kunci.str.split().str.join(" ")
    hasil = [""] * len(df)
    lat, lon = df["latitude"].tolist(), df["longitude"].tolist()
    for i in range(len(df)):
        for j in range(i + 1, len(df)):
            if not kunci[i] or kunci[i] != kunci[j]:
                continue
            dy = (lat[i] - lat[j]) * 111320
            dx = (lon[i] - lon[j]) * 111320 * math.cos(math.radians(lat[i]))
            if math.hypot(dx, dy) < jarak_m:
                hasil[i] = hasil[i] or df["osm_id"][j]
                hasil[j] = hasil[j] or df["osm_id"][i]
    return hasil


def baca():
    rows = []
    for el in json.load(open(RAW)):
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        if lat is None:
            continue
        t = el.get("tags", {})
        nama = (t.get("name") or t.get("name:id") or t.get("brand") or "(tanpa nama)").strip()
        key = f'{el["type"]}/{el["id"]}'
        rows.append({
            "nama": nama,
            "jaringan": (jar := jaringan(nama, t.get("brand", ""))),
            "kategori": kategori(nama, jar),
            "kab_kota": el.get("_kabkota", ""),
            "provinsi": el.get("_provinsi", ""),
            "alamat": alamat(t),
            "telepon": t.get("phone") or t.get("contact:phone", ""),
            "jam_buka": t.get("opening_hours", ""),
            "latitude": round(float(lat), 7),
            "longitude": round(float(lon), 7),
            "link_google_maps": f"https://www.google.com/maps?q={float(lat):.7f},{float(lon):.7f}",
            "osm_id": key,
        })
    rows.sort(key=lambda r: (r["provinsi"], r["kab_kota"], r["nama"].lower()))
    df = pd.DataFrame(rows)
    df["kemungkinan_duplikat_dengan"] = tandai_duplikat(df)
    return df


def tulis_excel(df, path):
    # Rekap per kab/kota dengan kolom per jaringan
    pivot = pd.crosstab([df["provinsi"], df["kab_kota"]], df["jaringan"])
    utama = [j for j, _ in JARINGAN if j in pivot.columns]
    lain = [c for c in pivot.columns if c not in utama and c != LAIN]
    if lain:
        pivot["Brand lain"] = pivot[lain].sum(axis=1)
    kolom = utama + (["Brand lain"] if lain else []) + ([LAIN] if LAIN in pivot.columns else [])
    per_kab = pivot[kolom]
    per_kab.insert(0, "Total", per_kab.sum(axis=1))
    per_kab = per_kab.sort_values("Total", ascending=False).reset_index()
    total = {"provinsi": "TOTAL", "kab_kota": ""} | {c: per_kab[c].sum() for c in per_kab.columns[2:]}
    per_kab = pd.concat([per_kab, pd.DataFrame([total])], ignore_index=True)

    per_jar = df["jaringan"].value_counts().rename_axis("jaringan").reset_index(name="jumlah_apotek")

    with pd.ExcelWriter(path, engine="openpyxl") as xw:
        df.to_excel(xw, sheet_name="Apotek", index=False)
        per_kab.to_excel(xw, sheet_name="Per Kab-Kota", index=False)
        per_jar.to_excel(xw, sheet_name="Per Jaringan", index=False)
        for ws in xw.book.worksheets:
            ws.freeze_panes = "A2"
            ws.auto_filter.ref = ws.dimensions
            for col in ws.columns:
                w = max(len(str(c.value or "")) for c in list(col)[:500])
                ws.column_dimensions[col[0].column_letter].width = min(max(10, w + 2), 50)
        # link Google Maps bisa diklik
        ws = xw.book["Apotek"]
        ci = list(df.columns).index("link_google_maps") + 1
        for row in ws.iter_rows(min_row=2, min_col=ci, max_col=ci):
            c = row[0]
            if c.value:
                c.hyperlink = c.value
                c.style = "Hyperlink"


def main():
    os.makedirs(OUT, exist_ok=True)
    df = baca()
    # utf-8-sig supaya huruf non-ASCII terbaca benar saat CSV dibuka di Excel
    df.to_csv(os.path.join(OUT, "apotek_jabodetabek.csv"), index=False, encoding="utf-8-sig")
    tulis_excel(df, os.path.join(OUT, "apotek_jabodetabek.xlsx"))

    print(f"Total apotek: {len(df)}")
    print(f"Tanpa nama: {(df['nama'] == '(tanpa nama)').sum()}")
    print(f"Ada alamat: {(df['alamat'] != '').sum()}")
    print(f"Ada telepon: {(df['telepon'] != '').sum()}")
    print("Per kategori:", df["kategori"].value_counts().to_dict())
    print(f"Kemungkinan duplikat: {(df['kemungkinan_duplikat_dengan'] != '').sum()}")
    print("Per kab/kota:", df["kab_kota"].value_counts().to_dict())
    print("Per jaringan:", Counter(df["jaringan"]).most_common(12))


if __name__ == "__main__":
    main()
