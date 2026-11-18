#!/usr/bin/env python3
"""Ambil data apotek Jabodetabek dari OpenStreetMap (Overpass API).

Wilayah: semua kota/kabupaten di DKI Jakarta, plus Kota & Kab. Bogor, Kota Depok,
Kota & Kab. Bekasi (Jawa Barat), Kota & Kab. Tangerang, Kota Tangerang Selatan (Banten).

Hasil mentah: data/raw/jabodetabek.json

Pakai:  python3 fetch_osm.py                      # ambil langsung dari Overpass
        python3 fetch_osm.py --dari-file data.json   # olah file ekspor overpass-turbo.eu
"""
import json
import os
import sys
import time

import requests

API = "https://overpass-api.de/api/interpreter"
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "data", "raw")
UA = "peta-apotek-indonesia/1.0 (pemetaan apotek, skrip pribadi)"

QUERY = """[out:json][timeout:900];
area["ISO3166-2"~"^ID-(JK|JB|BT)$"]["admin_level"="4"]->.prov;
rel(area.prov)["boundary"="administrative"]["admin_level"="5"]
  ["name"~"Jakarta|Seribu|Bogor|Depok|Bekasi|Tangerang",i];
map_to_area->.kabs;
foreach.kabs->.k(
  .k out tags;
  (nwr(area.k)["amenity"="pharmacy"]; nwr(area.k)["healthcare"="pharmacy"];);
  out center tags;
);"""


def provinsi_dari_kab(nama):
    n = nama.lower()
    if "jakarta" in n or "seribu" in n:
        return "DKI Jakarta"
    if "tangerang" in n:
        return "Banten"
    return "Jawa Barat"


def overpass(query, coba=6):
    for i in range(coba):
        try:
            r = requests.post(API, data={"data": query}, headers={"User-Agent": UA}, timeout=1000)
            if r.status_code == 200:
                return r.json()
            print(f"  HTTP {r.status_code}, coba lagi...", file=sys.stderr)
        except (requests.RequestException, ValueError) as e:
            print(f"  galat: {e}, coba lagi...", file=sys.stderr)
        time.sleep(15 * (i + 1))
    raise RuntimeError("Overpass gagal setelah beberapa kali percobaan")


def tulis_query():
    with open(os.path.join(HERE, "query_overpass_turbo.txt"), "w") as f:
        f.write(QUERY + "\n")


def main():
    os.makedirs(RAW, exist_ok=True)
    t0 = time.time()
    hasil, lihat, per_kab = [], set(), {}
    kab = ""
    if "--dari-file" in sys.argv:
        data = json.load(open(sys.argv[sys.argv.index("--dari-file") + 1]))
    else:
        data = overpass(QUERY)
    for el in data["elements"]:
        if el["type"] == "area":
            t = el.get("tags", {})
            kab = t.get("name:id") or t.get("name", "")
            per_kab.setdefault(kab, 0)
            continue
        key = f'{el["type"]}/{el["id"]}'
        if key in lihat:  # titik di perbatasan bisa masuk dua wilayah
            continue
        lihat.add(key)
        el["_kabkota"] = kab
        el["_provinsi"] = provinsi_dari_kab(kab)
        hasil.append(el)
        per_kab[kab] += 1
    with open(os.path.join(RAW, "jabodetabek.json"), "w") as f:
        json.dump(hasil, f, ensure_ascii=False)
    print(f"{len(hasil)} apotek dari {len(per_kab)} kota/kabupaten ({time.time() - t0:.0f} dtk)")
    for k, n in sorted(per_kab.items()):
        print(f"  {k}: {n}")


if __name__ == "__main__":
    if "--tulis-query" in sys.argv:
        tulis_query()
    else:
        main()
