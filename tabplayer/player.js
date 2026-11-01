// Mesin player tab biola. Halaman lagu mendefinisikan window.SONG_CONFIG lalu memuat file ini.
// SONG_CONFIG = {
//   kicker, title, subtitle,         // teks judul
//   barLen,                          // panjang birama dalam satuan 1/8 (12/8 = 12, 3/4 = 6)
//   beat,                            // jumlah 1/8 per ketukan tempo (♩. = 3, ♩ = 2)
//   tempo, px,                       // tempo bawaan, piksel per 1/8
//   sections: {bar: "label"},        // label 1-2 huruf = kotak (A, B), selain itu teks
//   pizz: [bar, ...],                // birama yang dipetik
//   bars: ["F4:1 G4:1 r4", ...]      // nada:durasi, r = istirahat, ~ = sambung ke token berikut
// }
(function () {
const S = window.SONG_CONFIG;
const BARS = S.bars, SECTIONS = S.sections || {}, BAR = S.barLen, PIZZ = new Set(S.pizz || []);

const STRINGS = [ { name:"E", midi:76 }, { name:"A", midi:69 }, { name:"D", midi:62 }, { name:"G", midi:55 } ];
const NAMES = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
function midiOf(p){ const m=p.match(/^([A-G])(#|b)?(\d)$/); if(!m) throw new Error("nada tidak dikenal: "+p);
  return 12*(+m[3]+1)+NAMES[m[1]]+(m[2]==="#"?1:m[2]==="b"?-1:0); }
// semitone dari senar kosong -> [jari, keterangan, tanda]
const FIRST = {0:[0,"senar kosong",""],1:[1,"jari 1 rendah","↓"],2:[1,"jari 1",""],3:[2,"jari 2 rendah","↓"],
  4:[2,"jari 2 tinggi","↑"],5:[3,"jari 3",""],7:[4,"jari 4",""]};
function placeNote(p, midi){
  for (let s=0;s<STRINGS.length;s++){
    const off=midi-STRINGS[s].midi;
    if (off<0||off>7) continue;
    if (off===7 && s<3) continue;                 // pakai senar kosong berikutnya, bukan jari 4
    let f;
    if (off===6) f = p.includes("b") ? [4,"jari 4 rendah","↓"] : [3,"jari 3 tinggi","↑"];
    else f = FIRST[off];
    return { string:s, off, finger:f[0], desc:f[1], mark:f[2], pos:"I" };
  }
  // di atas B5: posisi III di senar E (1=A, 2=B, 3=C, 4=D)
  const off = midi-76;
  const III = {8:[3,"jari 3"],9:[3,"jari 3 tinggi","↑"],10:[4,"jari 4"],11:[4,"jari 4 tinggi","↑"]};
  if (III[off]) return { string:0, off, finger:III[off][0], desc:III[off][1]+" (posisi III)", mark:III[off][2]||"", pos:"III" };
  throw new Error("nada di luar jangkauan: "+p);
}
const pretty = p => p.replace(/^([A-G])#/,"$1♯").replace(/^([A-G])b/,"$1♭");

const EVENTS=[]; let pos=0;
BARS.forEach((bar,i)=>{
  const barNo=i+1; let sum=0;
  for (const tok of bar.trim().split(/\s+/)){
    const cont=tok.startsWith("~"), t=tok.replace(/~/g,"");
    if (t[0]==="r"){ const d=+t.slice(1); pos+=d; sum+=d; continue; }
    const [p,ds]=t.split(":"), d=+ds;
    if (cont) EVENTS[EVENTS.length-1].dur+=d;
    else { const midi=midiOf(p); EVENTS.push({ start:pos, dur:d, pitch:p, midi, bar:barNo, pizz:PIZZ.has(barNo), ...placeNote(p,midi) }); }
    pos+=d; sum+=d;
  }
  if (sum!==BAR) throw new Error("Birama "+barNo+" berjumlah "+sum+", seharusnya "+BAR);
});
// Birama yang punya nada posisi III: nada senar E dari A ke atas ikut posisi III, supaya tidak bolak-balik geser.
const barsIII = new Set(EVENTS.filter(e=>e.pos==="III").map(e=>e.bar));
const III_LOW = {5:[1,"jari 1",""],6:[2,"jari 2 rendah","↓"],7:[2,"jari 2",""]};
for (const e of EVENTS) if (barsIII.has(e.bar) && e.string===0 && III_LOW[e.off]){
  const f=III_LOW[e.off]; Object.assign(e,{ finger:f[0], desc:f[1]+" (posisi III)", mark:f[2], pos:"III" }); }
const TOTAL = BARS.length*BAR;
window.SONG = { EVENTS, TOTAL };

// ---------------------------------------------------------------------------
const cv=document.getElementById("c"), g=cv.getContext("2d");
const C = { bg:"#0b0f16", panel:"#141b25", inner:"#0a0d13", line:"#2b3442", text:"#efe7da", accent:"#e9a656", circ:"#1b2230", circLine:"#3a4454" };
const PX=S.px||70, HEAD_X=400, LEFT=150, RIGHT=1830, TOP=318, BOTTOM=818, ROW_Y=[396,506,616,726], LEAD=2;
let tempo=S.tempo, EIGHTH_SEC=60/tempo/S.beat;
const totalSec = () => (TOTAL+LEAD)*EIGHTH_SEC;

function rr(x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
const fmt = s => { s=Math.max(0,Math.floor(s)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); };

function renderAt(sec){
  const u = sec/EIGHTH_SEC - LEAD;
  g.fillStyle=C.bg; g.fillRect(0,0,1920,1080);
  const grd=g.createRadialGradient(200,0,0,200,0,700); grd.addColorStop(0,"rgba(233,166,86,0.10)"); grd.addColorStop(1,"rgba(233,166,86,0)");
  g.fillStyle=grd; g.fillRect(0,0,1920,1080);
  g.textAlign="left"; g.textBaseline="alphabetic";
  g.fillStyle="#9fb4c4"; g.font="15px 'DejaVu Sans'"; g.save(); g.letterSpacing="4px"; g.fillText(S.kicker.toUpperCase(),72,66); g.restore();
  g.fillStyle=C.text; g.font="92px 'DejaVu Serif'"; g.fillText(S.title,72,162);
  g.fillStyle="#a6a196"; g.font="28px 'DejaVu Sans'"; g.fillText(S.subtitle,76,215);

  let cur=null, next=null;
  for (const e of EVENTS){ if (u>=e.start && u<e.start+e.dur) cur=e; if (e.start>u && !next) next=e; }
  const barNow = Math.min(BARS.length, Math.max(1, Math.floor(Math.max(0,u)/BAR)+1));
  rr(1468,48,380,220,24); g.fillStyle=C.panel; g.fill(); g.strokeStyle="#2a3443"; g.lineWidth=1.5; g.stroke();
  g.textAlign="center"; const show=cur||next;
  g.fillStyle="#9fb4c4"; g.font="15px 'DejaVu Sans'";
  g.fillText(show? "SENAR "+STRINGS[show.string].name+(show.pos==="III"?"  ·  POSISI III":"")+(show.pizz?"  ·  PIZZ.":"") : "",1658,88);
  g.fillStyle=cur? C.accent : "#5d6673"; g.font="130px 'DejaVu Serif'"; g.fillText(show? String(show.finger) : "–",1658,208);
  g.fillStyle="#a6a196"; g.font="17px 'DejaVu Sans'";
  g.fillText(show? `${pretty(show.pitch)}  ·  ${show.desc}  ·  Birama ${barNow}` : "",1658,240);
  g.textAlign="left";

  rr(48,292,1824,596,32); g.fillStyle=C.panel; g.fill(); g.strokeStyle="#222b38"; g.stroke();
  g.fillStyle=C.inner; g.fillRect(LEFT,TOP,RIGHT-LEFT,BOTTOM-TOP);
  g.font="22px 'DejaVu Sans'"; g.textAlign="center"; g.textBaseline="middle";
  STRINGS.forEach((s,i)=>{ g.fillStyle=cur&&cur.string===i? C.accent : "#b9c0ca"; g.fillText(s.name,98,ROW_Y[i]); });
  g.save(); g.beginPath(); g.rect(LEFT,TOP,RIGHT-LEFT,BOTTOM-TOP); g.clip();
  g.strokeStyle=C.line; g.lineWidth=1.2; ROW_Y.forEach(y=>{ g.beginPath(); g.moveTo(LEFT,y); g.lineTo(RIGHT,y); g.stroke(); });
  const xOf = t => HEAD_X+(t-u)*PX;
  for (let b=0;b<=BARS.length;b++){
    const x=xOf(b*BAR); if (x<LEFT-600||x>RIGHT+10) continue;
    g.strokeStyle="#262f3c"; g.lineWidth=1.5; g.beginPath(); g.moveTo(x,TOP); g.lineTo(x,BOTTOM); g.stroke();
    if (b<BARS.length){
      g.fillStyle="#8d96a3"; g.font="16px 'DejaVu Sans'"; g.textAlign="left"; g.fillText(String(b+1),x+16,337);
      const lab=SECTIONS[b+1];
      if (lab){ const lx=x+16+g.measureText(String(b+1)).width+14;
        if (lab.length<=2){ g.font="bold 16px 'DejaVu Sans'"; g.strokeStyle=C.accent; g.lineWidth=1.5; g.strokeRect(lx,325,26,24); g.fillStyle=C.accent; g.textAlign="center"; g.fillText(lab,lx+13,338); }
        else { g.fillStyle=C.accent; g.font="italic 17px 'DejaVu Sans'"; g.textAlign="left"; g.fillText(lab,lx,338); } }
    }
  }
  g.strokeStyle=C.accent; g.lineWidth=3; g.beginPath(); g.moveTo(HEAD_X,358); g.lineTo(HEAD_X,802); g.stroke();
  for (const e of EVENTS){
    const x0=xOf(e.start), x1=xOf(e.start+e.dur)-14; if (x1<LEFT-40||x0>RIGHT+40) continue;
    const on=e===cur, y=ROW_Y[e.string];
    if (x1>x0+20){ g.strokeStyle=on? C.accent : "#3c4656"; g.lineWidth=on?4:3; if (e.pizz) g.setLineDash([6,8]);
      g.beginPath(); g.moveTo(x0,y); g.lineTo(x1,y); g.stroke(); g.setLineDash([]); }
  }
  g.textAlign="center"; g.textBaseline="middle";
  for (const e of EVENTS){
    const x=xOf(e.start); if (x<LEFT-30||x>RIGHT+30) continue;
    const y=ROW_Y[e.string], on=e===cur, past=e.start+e.dur<=u;
    g.globalAlpha=past?0.35:1;
    if (on){ g.beginPath(); g.arc(x,y,27,0,Math.PI*2); g.fillStyle="rgba(233,166,86,0.25)"; g.fill(); }
    g.beginPath(); g.arc(x,y,20,0,Math.PI*2); g.fillStyle=on? C.accent : C.circ; g.fill();
    g.strokeStyle=on? "#f6c88d" : (e.pos==="III"? "#c98a45" : C.circLine); g.lineWidth=e.pos==="III"?2.5:1.5; g.stroke();
    g.fillStyle=on? "#2a1c08" : "#e7e1d6"; g.font="26px 'DejaVu Serif'"; g.fillText(String(e.finger),x,y+1);
    g.font="13px 'DejaVu Sans'"; g.fillStyle=on? "#2a1c08" : "#9aa3af";
    if (e.mark) g.fillText(e.mark,x+19,y-17);
    if (e.pos==="III"){ g.fillStyle=on? C.accent : "#c98a45"; g.font="bold 12px 'DejaVu Sans'"; g.fillText("III",x,y-32); }
    g.globalAlpha=1;
  }
  g.restore();
  g.fillStyle=C.accent; g.beginPath(); g.moveTo(HEAD_X-7,350); g.lineTo(HEAD_X+7,350); g.lineTo(HEAD_X,362); g.closePath(); g.fill();

  const T=totalSec(); g.textBaseline="middle"; g.textAlign="left"; g.fillStyle="#b9c0ca"; g.font="16px 'DejaVu Sans'";
  g.fillText(fmt(sec),72,846); g.textAlign="right"; g.fillText(fmt(T),1864,846);
  rr(150,846,1560,6,3); g.fillStyle="#2c3542"; g.fill();
  rr(150,846,Math.max(6,1560*Math.min(1,sec/T)),6,3); g.fillStyle=C.accent; g.fill();

  rr(72,918,1776,86,16); g.fillStyle=C.panel; g.fill(); g.strokeStyle="#222b38"; g.stroke();
  [["0","senar kosong"],["1","telunjuk"],["2","jari tengah"],["3","manis"],["4","kelingking"]].forEach((l,i)=>{
    const x=98+i*340; g.textAlign="left"; g.fillStyle=C.accent; g.font="42px 'DejaVu Serif'"; g.fillText(l[0],x,961);
    g.fillStyle="#b9c0ca"; g.font="22px 'DejaVu Sans'"; g.fillText(l[1],x+48,958); });
  g.fillStyle="#8d96a3"; g.font="17px 'DejaVu Sans'"; g.textAlign="left";
  const hasIII = EVENTS.some(e=>e.pos==="III");
  g.fillText(`Senar E di atas, G di bawah. ↓ jari agak mundur, ↑ jari agak maju.${hasIII?" III = geser ke posisi III.":""} Tempo ${tempo}. Ikuti angka yang menyala.`,72,1040);
}
window.renderAt=renderAt;
window.setTempo=bpm=>{ tempo=bpm; EIGHTH_SEC=60/bpm/S.beat; };
window.SONG_TIMING=()=>({ eighth:EIGHTH_SEC, LEAD });

// ---------------------------------------------------------------------------
const $=id=>document.getElementById(id);
let playing=false, t0=0, offset=0, actx=null, nodes=[];
const freq=m=>440*Math.pow(2,(m-69)/12);
function schedule(from){
  if (!$("sound").checked) return;
  actx=actx||new AudioContext(); const now=actx.currentTime;
  for (const e of EVENTS){
    const s=(e.start+LEAD)*EIGHTH_SEC-from, d=e.dur*EIGHTH_SEC; if (s+d<0) continue;
    const st=now+Math.max(0,s), en=now+s+d;
    const o=actx.createOscillator(), o2=actx.createOscillator(), gn=actx.createGain(), lp=actx.createBiquadFilter();
    o.type="sawtooth"; o2.type="triangle"; o.frequency.value=o2.frequency.value=freq(e.midi);
    lp.type="lowpass"; lp.frequency.value=2600;
    gn.gain.setValueAtTime(0,st);
    if (e.pizz){ gn.gain.linearRampToValueAtTime(0.16,st+0.005); gn.gain.exponentialRampToValueAtTime(0.001,st+0.45); }
    else { gn.gain.linearRampToValueAtTime(0.12,st+0.05); gn.gain.setValueAtTime(0.1,Math.max(st+0.06,en-0.06)); gn.gain.linearRampToValueAtTime(0,en); }
    o.connect(lp); o2.connect(lp); lp.connect(gn); gn.connect(actx.destination);
    o.start(st); o2.start(st); o.stop(en+0.5); o2.stop(en+0.5); nodes.push(o,o2);
  }
}
const stopAudio=()=>{ nodes.forEach(n=>{try{n.stop();}catch(_){}}); nodes=[]; };
function loop(){ if(!playing) return; const s=offset+(performance.now()-t0)/1000;
  if (s>=totalSec()){ playing=false; offset=0; $("play").textContent="Putar"; renderAt(totalSec()); return; }
  renderAt(s); requestAnimationFrame(loop); }
$("play").onclick=()=>{
  if (playing){ offset+=(performance.now()-t0)/1000; playing=false; stopAudio(); $("play").textContent="Putar"; return; }
  playing=true; t0=performance.now(); schedule(offset); $("play").textContent="Jeda"; loop(); };
$("restart").onclick=()=>{ stopAudio(); offset=0; t0=performance.now(); if (playing) schedule(0); renderAt(0); };
$("tempo").min=Math.round(S.tempo*0.4); $("tempo").max=S.tempo; $("tempo").value=S.tempo; $("tv").textContent=S.tempo;
$("tempo").oninput=ev=>{ if (playing) $("play").click(); const frac=offset/totalSec(); setTempo(+ev.target.value);
  offset=frac*totalSec(); $("tv").textContent=ev.target.value; renderAt(offset); };
if (location.search.includes("video")) document.body.classList.add("video");
if (document.fonts) document.fonts.ready.then(()=>renderAt(0));
renderAt(0);
})();
