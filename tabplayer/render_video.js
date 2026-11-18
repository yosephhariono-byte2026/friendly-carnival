// Render halaman lagu menjadi MP4 (720p, 30fps) dengan suara biola sintetis.
// Pakai: node tabplayer/render_video.js <folder-lagu>/index.html <output.mp4> [tempo]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const PAGE = path.resolve(process.argv[2]);
const OUT = path.resolve(process.argv[3]);
const FPS = 30;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + PAGE + '?video');
  await p.waitForTimeout(300);
  if (errs.length) throw new Error(errs.join('\n'));
  if (process.argv[4]) await p.evaluate(t => setTempo(t), +process.argv[4]);
  const info = await p.evaluate(() => ({
    events: SONG.EVENTS.map(e => ({ s: e.start, d: e.dur, m: e.midi, pizz: e.pizz, trill: e.trill })),
    total: SONG.TOTAL, ...SONG_TIMING() }));
  const dur = (info.total + info.LEAD) * info.eighth;

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tab-'));
  const wav = path.join(tmp, 'a.wav');
  fs.writeFileSync(path.join(tmp, 'ev.json'), JSON.stringify({ ...info, dur }));
  execFileSync('python3', [path.join(__dirname, 'synth.py'), path.join(tmp, 'ev.json'), wav], { stdio: 'inherit' });

  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', wav, '-vf', 'scale=1280:720', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });

  const frames = Math.ceil(dur * FPS);
  for (let i = 0; i < frames; i++) {
    const url = await p.evaluate(t => { renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', 0.92); }, i / FPS);
    if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 600 === 0) console.log(`frame ${i}/${frames}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await b.close();
  console.log('selesai:', OUT);
})();
