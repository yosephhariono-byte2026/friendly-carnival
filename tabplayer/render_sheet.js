// Render partitur biola (not balok + angka jari) ke PDF A4.
// Pakai: node tabplayer/render_sheet.js <folder-lagu>/index.html <output.pdf> [preview.png]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');

const PAGE = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3]), PNG = process.argv[4];
const CSS = `
@page { size: A4; margin: 13mm 14mm 16mm; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #fff; color: #16181c; font-family: "DejaVu Sans", sans-serif; }
body { width: 700px; margin: 0 auto; }
header { text-align: center; margin: 4px 0 10px; }
.kicker { font-size: 11px; letter-spacing: .22em; text-transform: uppercase; color: #777; }
h1 { font: 34px/1.15 "DejaVu Serif", serif; margin: 4px 0 4px; letter-spacing: .01em; }
.sub { font-size: 12.5px; color: #444; }
.credit { font-size: 10.5px; color: #777; margin-top: 3px; font-style: italic; }
.legend { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px; font-size: 10px; color: #444;
  border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 6px 2px; margin-bottom: 8px; }
.str { display: inline-flex; align-items: center; gap: 4px; font-weight: bold; color: var(--c); font-size: 11px; }
.str i { width: 9px; height: 9px; border-radius: 50%; border: 2px solid var(--c); }
.key { margin-left: 6px; } .key b { color: #16181c; }
.tempo { font: 13px "DejaVu Serif", serif; margin: 2px 0 -6px 2px; }
.tempo .nt { font-family: FreeSerif; font-size: 16px; }
svg.sys { display: block; break-inside: avoid; margin-bottom: 2px; }
`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + PAGE + '?video');
  const cfg = await p.evaluate(() => window.SONG_CONFIG);
  if (errs.length) throw new Error(errs.join('\n'));

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sheet-'));
  const html = path.join(tmp, 'sheet.html');
  fs.writeFileSync(html, `<!doctype html><html lang="id"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<script>window.SONG_CONFIG=${JSON.stringify(cfg)};</script>
<script src="file://${path.join(__dirname, 'player.js')}"></script>
<script src="file://${path.join(__dirname, 'sheet.js')}"></script></body></html>`);
  const q = await b.newPage({ viewport: { width: 794, height: 1123 } });
  q.on('pageerror', e => errs.push(e.message));
  await q.goto('file://' + html);
  await q.evaluate(() => document.fonts.ready);
  if (errs.length) throw new Error(errs.join('\n'));
  const foot = `<div style="width:100%;font:8px 'DejaVu Sans';color:#888;padding:0 14mm;display:flex;justify-content:space-between">
    <span>${cfg.title} · partitur biola dengan angka jari</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  await q.pdf({ path: OUT, format: 'A4', printBackground: true, displayHeaderFooter: true,
    headerTemplate: '<span></span>', footerTemplate: foot, margin: { top: '13mm', bottom: '16mm', left: '14mm', right: '14mm' } });
  if (PNG) { await q.setViewportSize({ width: 760, height: 1123 }); await q.screenshot({ path: PNG, fullPage: true }); }
  await b.close();
  console.log('selesai:', OUT);
})();
