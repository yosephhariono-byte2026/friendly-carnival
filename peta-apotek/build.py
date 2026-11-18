#!/usr/bin/env python3
"""Olah data mentah (data/raw/*.json) menjadi:
  hasil/apotek_indonesia.csv
  hasil/apotek_indonesia.xlsx   (sheet: Apotek, Per Provinsi, Per Kab-Kota, Per Jaringan)
  hasil/apotek_indonesia.geojson
  hasil/apotek_indonesia.kml    (Google Earth / Google My Maps)
  hasil/peta_apotek.html        (peta interaktif, data tertanam, bisa dibuka offline)
"""
import csv
import glob
import json
import os
import re
from collections import Counter, defaultdict
from xml.sax.saxutils import escape

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "data", "raw")
OUT = os.path.join(HERE, "hasil")

# Jaringan apotek: (label, pola regex pada nama/brand)
JARINGAN = [
    ("Kimia Farma", r"kimia\s*farma"),
    ("K-24", r"\bk\s*-?\s*24\b"),
    ("Century", r"\bcentury\b"),
    ("Guardian", r"\bguardian\b"),
    ("Viva Generik", r"\bviva\b"),
    ("Roxy", r"\broxy\b"),
    ("Apotek Alba", r"\balba\b"),
    ("Apotek Pelita", r"\bpelita\b"),
    ("Watsons", r"\bwatsons\b"),
    ("Boots", r"\bboots\b"),
]


def jaringan(nama, brand):
    teks = f"{brand} {nama}".lower()
    for label, pola in JARINGAN:
        if re.search(pola, teks):
            return label
    if brand:
        return brand.strip()
    return "Independen/Lainnya"


def alamat(t):
    jalan = " ".join(x for x in [t.get("addr:street", ""), t.get("addr:housenumber", "")] if x)
    bagian = [jalan, t.get("addr:village", "") or t.get("addr:hamlet", ""),
              t.get("addr:subdistrict", "") or t.get("addr:district", ""),
              t.get("addr:city", ""), t.get("addr:postcode", "")]
    a = ", ".join(x for x in bagian if x)
    return a or t.get("addr:full", "")


def baca():
    rows, lihat = [], set()
    for path in sorted(glob.glob(os.path.join(RAW, "*.json"))):
        if os.path.basename(path).startswith("_"):
            continue
        for el in json.load(open(path)):
            key = f'{el["type"]}/{el["id"]}'
            if key in lihat:  # titik di perbatasan provinsi bisa muncul dua kali
                continue
            lihat.add(key)
            lat = el.get("lat") or el.get("center", {}).get("lat")
            lon = el.get("lon") or el.get("center", {}).get("lon")
            if lat is None:
                continue
            t = el.get("tags", {})
            nama = t.get("name") or t.get("name:id") or t.get("brand") or "(tanpa nama)"
            rows.append({
                "osm_id": key,
                "nama": nama.strip(),
                "jaringan": jaringan(nama, t.get("brand", "")),
                "provinsi": el.get("_provinsi", ""),
                "kab_kota": el.get("_kabkota", ""),
                "alamat": alamat(t),
                "telepon": t.get("phone") or t.get("contact:phone", ""),
                "jam_buka": t.get("opening_hours", ""),
                "lat": round(float(lat), 7),
                "lon": round(float(lon), 7),
                "link_gmaps": f"https://www.google.com/maps?q={float(lat):.7f},{float(lon):.7f}",
                "link_osm": f"https://www.openstreetmap.org/{key}",
            })
    rows.sort(key=lambda r: (r["provinsi"], r["kab_kota"], r["nama"].lower()))
    return rows


def tulis_excel(df, path):
    per_prov = (df.groupby("provinsi").agg(jumlah_apotek=("osm_id", "count"),
                                           jumlah_kab_kota=("kab_kota", lambda s: s[s != ""].nunique()))
                .sort_values("jumlah_apotek", ascending=False).reset_index())
    per_kab = (df.groupby(["provinsi", "kab_kota"]).size().rename("jumlah_apotek")
               .reset_index().sort_values(["provinsi", "jumlah_apotek"], ascending=[True, False]))
    per_kab["kab_kota"] = per_kab["kab_kota"].replace("", "(tidak terpetakan)")
    pivot = pd.crosstab(df["provinsi"], df["jaringan"])
    utama = [j for j, _ in JARINGAN if j in pivot.columns] + ["Independen/Lainnya"]
    lain = [c for c in pivot.columns if c not in utama]
    if lain:
        pivot["Brand lain"] = pivot[lain].sum(axis=1)
    pivot = pivot[[c for c in utama if c in pivot.columns] + (["Brand lain"] if lain else [])]
    pivot["Total"] = pivot.sum(axis=1)
    pivot = pivot.sort_values("Total", ascending=False)

    with pd.ExcelWriter(path, engine="openpyxl") as xw:
        df.to_excel(xw, sheet_name="Apotek", index=False)
        per_prov.to_excel(xw, sheet_name="Per Provinsi", index=False)
        per_kab.to_excel(xw, sheet_name="Per Kab-Kota", index=False)
        pivot.to_excel(xw, sheet_name="Per Jaringan")
        for ws in xw.book.worksheets:
            ws.freeze_panes = "B2" if ws.title == "Per Jaringan" else "A2"
            ws.auto_filter.ref = ws.dimensions
            for col in ws.columns:
                w = max(len(str(c.value or "")) for c in list(col)[:500])
                ws.column_dimensions[col[0].column_letter].width = min(max(10, w + 2), 50)


def tulis_geojson(rows, path):
    fitur = [{"type": "Feature",
              "geometry": {"type": "Point", "coordinates": [r["lon"], r["lat"]]},
              "properties": {k: v for k, v in r.items() if k not in ("lat", "lon")}} for r in rows]
    json.dump({"type": "FeatureCollection", "features": fitur}, open(path, "w"), ensure_ascii=False)


def tulis_kml(rows, path):
    per_prov = defaultdict(list)
    for r in rows:
        per_prov[r["provinsi"] or "Lainnya"].append(r)
    with open(path, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>'
                "<name>Apotek Indonesia (OpenStreetMap)</name>\n")
        for prov in sorted(per_prov):
            f.write(f"<Folder><name>{escape(prov)} ({len(per_prov[prov])})</name>\n")
            for r in per_prov[prov]:
                desk = "<br>".join(escape(x) for x in [r["jaringan"], r["kab_kota"], r["alamat"], r["telepon"],
                                                       r["jam_buka"]] if x)
                f.write(f"<Placemark><name>{escape(r['nama'])}</name><description><![CDATA[{desk}]]></description>"
                        f"<Point><coordinates>{r['lon']},{r['lat']},0</coordinates></Point></Placemark>\n")
            f.write("</Folder>\n")
        f.write("</Document></kml>\n")


def tulis_html(rows, path):
    # Data ringkas: [lat, lon, nama, idx_jaringan, idx_prov, kab, alamat, telp, osm_id]
    jar = sorted({r["jaringan"] for r in rows}, key=lambda j: (-sum(1 for r in rows if r["jaringan"] == j), j))
    prov = sorted({r["provinsi"] for r in rows})
    ji, pi = {j: i for i, j in enumerate(jar)}, {p: i for i, p in enumerate(prov)}
    data = [[r["lat"], r["lon"], r["nama"], ji[r["jaringan"]], pi[r["provinsi"]], r["kab_kota"],
             r["alamat"], r["telepon"], r["osm_id"]] for r in rows]
    tpl = open(os.path.join(HERE, "peta_template.html"), encoding="utf-8").read()
    payload = json.dumps({"jar": jar, "prov": prov, "d": data}, ensure_ascii=False, separators=(",", ":"))
    payload = payload.replace("</", "<\\/")
    open(path, "w", encoding="utf-8").write(tpl.replace("/*__DATA__*/null", payload))


def main():
    os.makedirs(OUT, exist_ok=True)
    rows = baca()
    df = pd.DataFrame(rows)
    df.to_csv(os.path.join(OUT, "apotek_indonesia.csv"), index=False, quoting=csv.QUOTE_MINIMAL)
    tulis_excel(df, os.path.join(OUT, "apotek_indonesia.xlsx"))
    tulis_geojson(rows, os.path.join(OUT, "apotek_indonesia.geojson"))
    tulis_kml(rows, os.path.join(OUT, "apotek_indonesia.kml"))
    tulis_html(rows, os.path.join(OUT, "peta_apotek.html"))

    print(f"Total apotek: {len(rows)}")
    print(f"Tanpa nama: {sum(r['nama'] == '(tanpa nama)' for r in rows)}")
    print(f"Tanpa kab/kota: {sum(not r['kab_kota'] for r in rows)}")
    print(f"Ada alamat: {sum(bool(r['alamat']) for r in rows)}")
    print("Per jaringan:", Counter(r["jaringan"] for r in rows).most_common(12))


if __name__ == "__main__":
    main()
