#!/usr/bin/env python3
"""Ambil data apotek se-Indonesia dari OpenStreetMap (Overpass API).

Alur:
  1. Ambil daftar provinsi (admin_level=4) di Indonesia.
  2. Untuk tiap provinsi: ambil semua apotek (amenity=pharmacy / healthcare=pharmacy),
     lalu beri label kabupaten/kota (admin_level=5) lewat query foreach.
  3. Simpan mentah ke data/raw/<provinsi>.json (bisa dilanjut kalau terputus).

Pakai:  python3 fetch_osm.py            # semua provinsi, lewati yang sudah ada
        python3 fetch_osm.py --ulang     # ambil ulang semuanya
"""
import json
import os
import re
import sys
import time

import requests

API = "https://overpass-api.de/api/interpreter"
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "data", "raw")
UA = "peta-apotek-indonesia/1.0 (pemetaan apotek, skrip pribadi)"

FILTER = '["amenity"="pharmacy"]'
FILTER2 = '["healthcare"="pharmacy"]'


def overpass(query, coba=6):
    for i in range(coba):
        try:
            r = requests.post(API, data={"data": query}, headers={"User-Agent": UA}, timeout=600)
            if r.status_code == 200:
                return r.json()
            print(f"  HTTP {r.status_code}, coba lagi...", file=sys.stderr)
        except (requests.RequestException, ValueError) as e:
            print(f"  galat: {e}, coba lagi...", file=sys.stderr)
        time.sleep(15 * (i + 1))
    raise RuntimeError("Overpass gagal setelah beberapa kali percobaan")


def provinsi():
    q = """[out:json][timeout:180];
area["ISO3166-1"="ID"]["admin_level"="2"]->.id;
rel(area.id)["boundary"="administrative"]["admin_level"="4"];
out tags;"""
    out = []
    for el in overpass(q)["elements"]:
        t = el.get("tags", {})
        nama = t.get("name:id") or t.get("name")
        if not nama:
            continue
        out.append({"rel": el["id"], "nama": nama, "kode": t.get("ISO3166-2", "")})
    return sorted(out, key=lambda p: p["nama"])


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def ambil_provinsi(p):
    aid = 3600000000 + p["rel"]
    # Semua apotek di provinsi
    q_all = f"""[out:json][timeout:600];
area({aid})->.p;
(nwr(area.p){FILTER}; nwr(area.p){FILTER2};);
out center tags;"""
    # Label kabupaten/kota: keluarkan area kab lalu apotek di dalamnya, berurutan
    q_kab = f"""[out:json][timeout:900];
area({aid})->.p;
rel(area.p)["boundary"="administrative"]["admin_level"="5"];
map_to_area->.kabs;
foreach.kabs->.k(
  .k out tags;
  (nwr(area.k){FILTER}; nwr(area.k){FILTER2};);
  out ids;
);"""
    semua = overpass(q_all)["elements"]
    time.sleep(5)
    kab_of = {}
    kab_now = ""
    for el in overpass(q_kab)["elements"]:
        if el["type"] == "area":
            t = el.get("tags", {})
            kab_now = t.get("name:id") or t.get("name", "")
        else:
            kab_of.setdefault(f'{el["type"]}/{el["id"]}', kab_now)
    for el in semua:
        el["_kabkota"] = kab_of.get(f'{el["type"]}/{el["id"]}', "")
        el["_provinsi"] = p["nama"]
    return semua


def main():
    ulang = "--ulang" in sys.argv
    os.makedirs(RAW, exist_ok=True)
    daftar = provinsi()
    print(f"{len(daftar)} provinsi ditemukan")
    with open(os.path.join(RAW, "_provinsi.json"), "w") as f:
        json.dump(daftar, f, ensure_ascii=False, indent=1)
    for i, p in enumerate(daftar, 1):
        path = os.path.join(RAW, slug(p["nama"]) + ".json")
        if os.path.exists(path) and not ulang:
            print(f"[{i}/{len(daftar)}] {p['nama']}: sudah ada, lewati")
            continue
        t0 = time.time()
        data = ambil_provinsi(p)
        with open(path, "w") as f:
            json.dump(data, f, ensure_ascii=False)
        print(f"[{i}/{len(daftar)}] {p['nama']}: {len(data)} apotek ({time.time() - t0:.0f} dtk)")
        time.sleep(5)


if __name__ == "__main__":
    main()
