// Partitur cetak (A4): not balok + angka jari + senar, dari SONG_CONFIG yang sama dengan video.
// Dimuat setelah player.js di halaman tanpa kanvas; dipakai oleh render_sheet.js.
(function () {
const S = window.SONG_CONFIG, { ITEMS, STRINGS } = window.SONG;
const BAR = S.barLen, NB = S.bars.length, SECTIONS = S.sections || {};
const PER = S.sheetBarsPerLine || (BAR >= 12 ? 3 : BAR <= 6 ? 5 : 4);
const W = 700, GAP = 8.6, Y0 = 46, YB = Y0 + 4 * GAP, H = YB + 56;
const MID = 34;                                   // B4, garis tengah
const yOf = st => YB - (st - 30) * GAP / 2;       // st 30 = E4 (garis bawah)
const INK = "#16181c";
const COL = ["#d23a33", "#1f70c4", "#3f8f22", "#d98a0b"];   // E A D G, sedikit lebih gelap untuk cetak
const SHARP = { F: 38, C: 35, G: 39, D: 36, A: 33, E: 37, B: 34 }, FLAT = { B: 34, E: 37, A: 33, D: 36, G: 32, C: 35, F: 31 };
const ACC = { "#": "♯", b: "♭", n: "♮" };
const f = n => +n.toFixed(2);

const line = (x1, y1, x2, y2, w = 1) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${INK}" stroke-width="${w}"/>`;
const text = (s, x, y, size, opt = "") => `<text x="${f(x)}" y="${f(y)}" font-size="${size}" ${opt}>${s}</text>`;
const glyph = (ch, x, y, size) => text(ch, x, y, size, `font-family="FreeSerif" fill="${INK}"`);

// jarak antar nada: semi-proporsional terhadap durasi, dengan ruang minimum untuk angka jari
function layout(bar) {
  const t0 = (bar - 1) * BAR, t1 = t0 + BAR;
  const its = ITEMS.filter(it => it.t >= t0 && it.t < t1);
  const onsets = [...new Set(its.map(it => it.t))].sort((a, c) => a - c);
  const hasAcc = t => its.some(it => it.t === t && it.acc);
  const wts = onsets.map((t, i) => 0.8 + Math.pow((onsets[i + 1] ?? t1) - t, 0.6) + (hasAcc(onsets[i + 1]) ? 0.45 : 0)
    + (/^#|^b/.test((its.find(it => it.t === t && it.first) || { ev: {} }).ev.label || "") ? 0.3 : 0));
  return { its, onsets, wts, sum: wts.reduce((a, c) => a + c, 0),
    padL: GAP * 1.6 + (hasAcc(t0) ? GAP * 1.2 : 0), padR: GAP * 0.9 };
}
let lastK = 0;

// --- satu sistem (baris) partitur
function system(firstBar, count, isFirst) {
  const out = [];
  // kepala baris: kunci G, tanda kunci, tanda birama
  let x = 4;
  out.push(glyph("\u{1D11E}", x, YB + GAP * 0.8, GAP * 5.9));
  x += GAP * 4.2;
  for (const k of S.keySig || []) {
    const st = (k[1] === "#" ? SHARP : FLAT)[k[0]];
    out.push(glyph(ACC[k[1]], x, yOf(st) + (k[1] === "#" ? GAP * 0.62 : GAP * 0.35), GAP * 2.3)); x += GAP * 1.05;
  }
  x += GAP * 0.6;
  if (isFirst) {
    const [tn, td] = (S.time || "4/4").split("/");
    const o = `font-family="FreeSerif" font-weight="bold" text-anchor="middle" fill="${INK}"`;
    out.push(text(tn, x + GAP, Y0 + 2 * GAP - 1, GAP * 2.75, o), text(td, x + GAP, YB - 1, GAP * 2.75, o));
    x += GAP * 3;
  }
  const head = x + GAP * 0.4;
  // baris angka jari turun kalau ada nada di bawah paranada (garis bantu)
  const lows = ITEMS.filter(it => it.kind === "note" && it.t >= (firstBar - 1) * BAR && it.t < (firstBar - 1 + count) * BAR).map(it => it.step);
  const FY = YB + Math.max(27, (30 - Math.min(30, ...lows)) * GAP / 2 + 17), h = FY + 29;
  // lebar birama mengikuti isinya; baris terakhir yang pendek tidak direnggangkan
  const L = Array.from({ length: count }, (_, b) => layout(firstBar + b));
  const pads = L.reduce((a, l) => a + l.padL + l.padR, 0), wsum = L.reduce((a, l) => a + l.sum, 0);
  let k = (W - 2 - head - pads) / wsum;
  if (count < PER && lastK) k = Math.min(k, lastK); else lastK = k;
  const barWs = L.map(l => l.padL + l.padR + l.sum * k);
  const endX = head + barWs.reduce((a, c) => a + c, 0);
  for (let i = 0; i < 5; i++) out.push(line(0, YB - i * GAP, endX, YB - i * GAP, 0.9));
  // nomor birama di awal baris
  out.push(text(firstBar, 2, Y0 - GAP * 1.6, 10, `font-family="DejaVu Serif" font-style="italic" fill="#666"`));

  let bx = head;
  for (let b = 0; b < count; b++) {
    if (b) bx += barWs[b - 1];
    const bar = firstBar + b, barW = barWs[b], lay = L[b], t0 = (bar - 1) * BAR, t1 = t0 + BAR;
    // garis birama (ganda sebelum bagian baru, penutup di akhir lagu)
    const nextSec = bar < NB && SECTIONS[bar + 1];
    if (bar === NB) { out.push(line(bx + barW - 5, Y0, bx + barW - 5, YB, 1), `<rect x="${f(bx + barW - 3)}" y="${Y0}" width="3" height="${4 * GAP}" fill="${INK}"/>`); }
    else if (nextSec) out.push(line(bx + barW - 3.5, Y0, bx + barW - 3.5, YB, 0.9), line(bx + barW, Y0, bx + barW, YB, 0.9));
    else out.push(line(bx + barW, Y0, bx + barW, YB, 1));
    // label bagian
    if (SECTIONS[bar]) {
      const s = SECTIONS[bar], w = 9 + s.length * 6.6, lx = b === 0 ? bx + 2 : bx + 4;
      out.push(`<rect x="${f(lx)}" y="${Y0 - 40}" width="${f(w)}" height="17" rx="2" fill="none" stroke="${INK}" stroke-width="1"/>`,
        text(s, lx + w / 2, Y0 - 27.5, 11.5, `font-family="DejaVu Sans" font-weight="bold" text-anchor="middle" fill="${INK}"`));
    }
    const its = lay.its, xAt = {}; let acc = bx + lay.padL;
    lay.onsets.forEach((t, i) => { xAt[t] = acc; acc += lay.wts[i] * k; });

    // kelompok balok (beam): not 1/8 dan 1/16 berturut-turut dalam satu ketukan
    const groups = []; let cur = null;
    for (const it of its) {
      const beat = Math.floor((it.t - t0) / S.beat);
      if (it.kind === "note" && it.d < 2) {
        if (cur && cur.beat === beat && cur.end === it.t) { cur.notes.push(it); cur.end = it.t + it.d; }
        else { cur = { beat, end: it.t + it.d, notes: [it] }; groups.push(cur); }
      } else cur = null;
    }
    const beamed = new Map();
    for (const g of groups) if (g.notes.length > 1) g.notes.forEach(n => beamed.set(n, g));

    for (const it of its) {
      const xc = it.whole ? bx + barW / 2 : xAt[it.t] + 5;
      if (it.kind === "rest") { out.push(rest(it, xc)); continue; }
      const y = yOf(it.step), e = it.ev;
      // garis bantu
      for (let st = 28; st >= it.step; st -= 2) out.push(line(xc - 8.5, yOf(st), xc + 8.5, yOf(st), 1));
      for (let st = 40; st <= it.step; st += 2) out.push(line(xc - 8.5, yOf(st), xc + 8.5, yOf(st), 1));
      if (it.acc) out.push(glyph(ACC[it.acc], xc - 14.5, y + GAP * (it.acc === "b" ? 0.3 : 0.55), GAP * 2.2));
      // kepala not
      const hollow = it.d >= 4;
      out.push(`<ellipse cx="${f(xc)}" cy="${f(y)}" rx="${hollow && it.d >= 8 ? 6 : 5.3}" ry="3.75" transform="rotate(-20 ${f(xc)} ${f(y)})" ` +
        (hollow ? `fill="none" stroke="${INK}" stroke-width="1.7"` : `fill="${INK}"`) + `/>`);
      if ([1.5, 3, 6, 12].includes(it.d)) out.push(`<circle cx="${f(xc + 10)}" cy="${f(y - (it.step % 2 === 0 ? GAP / 2 : 0))}" r="1.6" fill="${INK}"/>`);
      // tangkai + bendera (not tunggal)
      if (it.d < 8 && !beamed.has(it)) {
        const up = it.step < MID, sx = up ? xc + 4.9 : xc - 4.9;
        const len = Math.max(GAP * 3.5, Math.abs(y - yOf(MID)));
        const sy = up ? y - len : y + len;
        out.push(line(sx, y + (up ? -1 : 1), sx, sy, 1.1));
        for (let k = 0; k < (it.d < 1 ? 2 : it.d < 2 ? 1 : 0); k++) {
          const fy = sy + (up ? k * 6.5 : -k * 6.5);
          out.push(up
            ? `<path d="M${f(sx)} ${f(fy)} c1 6 9 9 7.5 19 c0 -6 -3.5 -10 -7.5 -12 z" fill="${INK}"/>`
            : `<path d="M${f(sx)} ${f(fy)} c1 -6 9 -9 7.5 -19 c0 6 -3.5 10 -7.5 12 z" fill="${INK}"/>`);
        }
      }
      // ikatan
      if (it.tie) {
        const nx = (xAt[it.t + it.d] ?? bx + barW + 8) + 5, up = it.step < MID, ty = y + (up ? 6 : -6), dy = up ? 6 : -6;
        out.push(`<path d="M${f(xc + 3)} ${f(ty)} Q${f((xc + nx) / 2)} ${f(ty + dy)} ${f(nx - 3)} ${f(ty)}" fill="none" stroke="${INK}" stroke-width="1.2"/>`);
      }
      // angka jari dan senar di bawah paranada
      if (it.first) {
        const c = COL[e.string];
        out.push(text(e.label, xc, FY, 13.5, `font-family="DejaVu Sans" font-weight="bold" text-anchor="middle" fill="${c}"`));
        out.push(text(STRINGS[e.string].name + (e.pos === "III" ? "·III" : ""), xc, FY + 13, 8.5, `font-family="DejaVu Sans" text-anchor="middle" fill="${c}" opacity=".85"`));
        if (e.pizz) out.push(text("pizz.", xc, FY + 24, 8, `font-family="DejaVu Serif" font-style="italic" text-anchor="middle" fill="#555"`));
      }
    }
    // balok
    for (const g of groups) {
      if (g.notes.length < 2) continue;
      const ns = g.notes, steps = ns.map(n => n.step);
      const up = Math.max(...steps) - MID < MID - Math.min(...steps);
      const xs = ns.map(n => xAt[n.t] + 5 + (up ? 4.9 : -4.9)), ys = ns.map(n => yOf(n.step));
      const L = GAP * 3.3;
      let ya = ys[0] + (up ? -L : L), yb = ys[ys.length - 1] + (up ? -L : L);
      const slope = Math.max(-GAP * 0.6, Math.min(GAP * 0.6, yb - ya)); yb = ya + slope;
      const beamY = x => ya + (yb - ya) * (x - xs[0]) / (xs[xs.length - 1] - xs[0]);
      // pastikan semua tangkai cukup panjang
      let shift = 0;
      ns.forEach((n, i) => { const d = up ? ys[i] - beamY(xs[i]) : beamY(xs[i]) - ys[i]; if (d < GAP * 2.6) shift = Math.max(shift, GAP * 2.6 - d); });
      ya += up ? -shift : shift; yb += up ? -shift : shift;
      ns.forEach((n, i) => out.push(line(xs[i], ys[i] + (up ? -1 : 1), xs[i], beamY(xs[i]), 1.1)));
      const th = up ? 4 : -4, x1 = xs[0] - 0.55, x2 = xs[xs.length - 1] + 0.55;
      const beam = (xa, xb, off) => `<path d="M${f(xa)} ${f(beamY(xa) + off)} L${f(xb)} ${f(beamY(xb) + off)} L${f(xb)} ${f(beamY(xb) + off + th)} L${f(xa)} ${f(beamY(xa) + off + th)} z" fill="${INK}"/>`;
      out.push(beam(x1, x2, 0));
      // balok kedua untuk not 1/16 (sambung ke tetangga 1/16, atau potongan pendek)
      const off2 = up ? 6.5 : -6.5, six = i => ns[i] && ns[i].d < 1;
      ns.forEach((n, i) => {
        if (!six(i)) return;
        if (six(i + 1)) out.push(beam(xs[i] - 0.55, xs[i + 1] + 0.55, off2));
        else if (!six(i - 1)) out.push(i + 1 < ns.length ? beam(xs[i] - 0.55, xs[i] + 7, off2) : beam(xs[i] - 7, xs[i] + 0.55, off2));
      });
    }
  }
  return `<svg class="sys" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" xmlns="http://www.w3.org/2000/svg">${out.join("")}</svg>`;
}

function rest(it, x) {
  const mid = Y0 + 2 * GAP;
  if (it.whole) return `<rect x="${f(x - 6)}" y="${f(Y0 + GAP)}" width="12" height="${f(GAP / 2)}" fill="${INK}"/>`;
  const dot = dy => `<circle cx="${f(x + 10)}" cy="${f(mid - dy)}" r="1.6" fill="${INK}"/>`;
  if (it.d >= 4) return `<rect x="${f(x - 6)}" y="${f(mid - GAP / 2)}" width="12" height="${f(GAP / 2)}" fill="${INK}"/>` + (it.d === 6 ? dot(GAP / 2) : "");
  if (it.d >= 2) return glyph("\u{1D13D}", x - 4.5, mid + GAP * 1.35, GAP * 3.6) + (it.d === 3 ? dot(GAP / 2) : "");
  return glyph("\u{1D13E}", x - 4, mid + GAP * 1.1, GAP * 3.6);
}

// --- halaman
const tempoMark = `${S.tempoText ? `<b>${S.tempoText}</b> ` : ""}<span class="nt">${S.beat === 3 ? "♩." : "♩"}</span> = ${S.tempo}`;
const usesIII = window.SONG.EVENTS.some(e => e.pos === "III");
const parts = [];
for (let b = 1; b <= NB; b += PER) parts.push(system(b, Math.min(PER, NB - b + 1), b === 1));
const sub = (S.subtitle || "").split("·").map(s => s.trim()).filter(s => s && s !== "tab biola");
document.body.innerHTML = `
<header>
  <div class="kicker">${S.kicker || ""}</div>
  <h1>${S.title}</h1>
  <div class="sub">${sub.join("  ·  ")}</div>
  ${S.credit ? `<div class="credit">${S.credit}</div>` : ""}
</header>
<div class="legend">
  ${["G", "D", "A", "E"].map((n, i) => `<span class="str" style="--c:${COL[3 - i]}"><i></i>${n}</span>`).join("")}
  <span class="key"><b>0</b> senar kosong &nbsp;·&nbsp; <b>1 2 3 4</b> jari &nbsp;·&nbsp; <b>#2</b> jari agak maju (tinggi) &nbsp;·&nbsp; <b>b2</b> jari agak mundur (rendah)${usesIII ? " &nbsp;·&nbsp; <b>III</b> posisi III" : ""}</span>
</div>
<div class="tempo">${tempoMark}</div>
${parts.join("\n")}`;
document.title = S.title + " Partitur Biola";
})();
