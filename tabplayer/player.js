// Mesin player tab biola. Halaman lagu mendefinisikan window.SONG_CONFIG lalu memuat file ini.
// SONG_CONFIG = {
//   kicker, title, subtitle,         // teks judul
//   barLen,                          // panjang birama dalam satuan 1/8 (12/8 = 12, 3/4 = 6)
//   beat,                            // jumlah 1/8 per ketukan tempo (♩. = 3, ♩ = 2)
//   tempo,                           // tempo bawaan
//   time: "12/8", keySig: ["F#", ...] // birama dan tanda kunci untuk not balok
//   sections: {bar: "label"},        // label birama (A, B, pizz., ...)
//   pizz: [bar, ...],                // birama yang dipetik
//   bars: ["F4:1 G4:1 r4", ...]      // nada:durasi, r = istirahat, ~ = sambung ke token sebelumnya
// }
(function () {
const S = window.SONG_CONFIG;
const BARS = S.bars, SECTIONS = S.sections || {}, BAR = S.barLen, PIZZ = new Set(S.pizz || []);

// Urutan senar: 0=E, 1=A, 2=D, 3=G. Di layar (kiri ke kanan) G D A E.
const STRINGS = [ { name:"E", midi:76, color:"#ef4a43" }, { name:"A", midi:69, color:"#3b9cf2" },
                  { name:"D", midi:62, color:"#7cc444" }, { name:"G", midi:55, color:"#f4a62a" } ];
const NAMES = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const LETTERS = "CDEFGAB";
function parsePitch(p){ const m=p.match(/^([A-G])(#|b)?(\d)$/); if(!m) throw new Error("nada tidak dikenal: "+p); return m; }
function midiOf(p){ const m=parsePitch(p); return 12*(+m[3]+1)+NAMES[m[1]]+(m[2]==="#"?1:m[2]==="b"?-1:0); }

// semitone dari senar kosong (posisi I) -> [jari, label, keterangan]
const FIRST = {0:[0,"0","senar kosong"],1:[1,"b1","jari 1 rendah"],2:[1,"1","jari 1"],3:[2,"b2","jari 2 rendah"],
  4:[2,"#2","jari 2 tinggi"],5:[3,"3","jari 3"],7:[4,"4","jari 4"]};
function placeNote(p, midi){
  for (let s=0;s<STRINGS.length;s++){
    const off=midi-STRINGS[s].midi;
    if (off<0||off>7) continue;
    if (off===7 && s<3) continue;                 // pakai senar kosong berikutnya, bukan jari 4
    const f = off===6 ? (p.includes("b") ? [4,"b4","jari 4 rendah"] : [3,"#3","jari 3 tinggi"]) : FIRST[off];
    return { string:s, off, finger:f[0], label:f[1], desc:f[2], pos:"I" };
  }
  // di atas B5: posisi III di senar E (1=A, 2=B, 3=C, 4=D)
  const off = midi-76;
  const III = {8:[3,"3","jari 3"],9:[3,"#3","jari 3 tinggi"],10:[4,"4","jari 4"],11:[4,"#4","jari 4 tinggi"]};
  if (III[off]) return { string:0, off, finger:III[off][0], label:III[off][1], desc:III[off][2]+", posisi III", pos:"III" };
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
const III_LOW = {5:[1,"1","jari 1"],6:[2,"b2","jari 2 rendah"],7:[2,"2","jari 2"]};
for (const e of EVENTS) if (barsIII.has(e.bar) && e.string===0 && III_LOW[e.off]){
  const f=III_LOW[e.off]; Object.assign(e,{ finger:f[0], label:f[1], desc:f[2]+", posisi III", pos:"III" }); }
const TOTAL = BARS.length*BAR;
window.SONG = { EVENTS, TOTAL };

// ---------------------------------------------------------------------------
// Not balok: pecah nada di garis birama dan ke nilai not standar, plus tanda istirahat
// ---------------------------------------------------------------------------
const STD = [12,8,6,4,3,2,1];
const split = d => { const out=[]; for (const v of STD) while (d>=v){ out.push(v); d-=v; } return out; };
const stepOf = p => { const m=parsePitch(p); return (+m[3])*7+LETTERS.indexOf(m[1]); };
const KEY = {}; (S.keySig||[]).forEach(k=>KEY[k[0]]=k[1]);
const ITEMS=[];   // {t, d, kind:"note"|"rest", ...}
for (const e of EVENTS){
  const pieces=[]; let t=e.start, left=e.dur;
  while (left>0){ const barEnd=(Math.floor(t/BAR)+1)*BAR, seg=Math.min(left,barEnd-t);
    for (const v of split(seg)){ pieces.push({t,d:v}); t+=v; } left-=seg; }
  pieces.forEach((pc,i)=>ITEMS.push({ ...pc, kind:"note", ev:e, step:stepOf(e.pitch), first:i===0, tie:i<pieces.length-1 }));
}
// istirahat
for (let b=0;b<BARS.length;b++){
  const s=b*BAR, en=s+BAR;
  const notes=ITEMS.filter(it=>it.kind==="note"&&it.t>=s&&it.t<en).sort((a,b)=>a.t-b.t);
  if (!notes.length){ ITEMS.push({t:s,d:BAR,kind:"rest",whole:true}); continue; }
  let t=s;
  for (const n of notes.concat([{t:en,d:0}])){ if (n.t>t) for (const v of split(n.t-t)){ ITEMS.push({t,d:v,kind:"rest"}); t+=v; } t=Math.max(t,n.t+n.d); }
}
ITEMS.sort((a,b)=>a.t-b.t);
// tanda aksidental per birama
{ let mem={}, bar=-1;
  for (const it of ITEMS){ if (it.kind!=="note"||!it.first) continue;
    const b=Math.floor(it.t/BAR); if (b!==bar){ mem={}; bar=b; }
    const m=parsePitch(it.ev.pitch), L=m[1]+m[3], acc=m[2]||"";
    const expect = L in mem ? mem[L] : (KEY[m[1]]||"");
    if (acc!==expect){ it.acc = acc||"n"; mem[L]=acc; }
  } }

// ---------------------------------------------------------------------------
// Gambar
// ---------------------------------------------------------------------------
const cv=document.getElementById("c"), g=cv.getContext("2d");
const LEAD=4;
let tempo=S.tempo, EIGHTH_SEC=60/tempo/S.beat;
const totalSec = () => (TOTAL+LEAD)*EIGHTH_SEC;
const fmt = s => { s=Math.max(0,Math.floor(s)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); };
const lane = e => 3-e.string;
const ell = (x,y,rx,ry) => { g.beginPath(); g.ellipse(x,y,Math.max(0.1,rx),Math.max(0.1,ry),0,0,Math.PI*2); };
function hexA(hex,a){ const n=parseInt(hex.slice(1),16); return `rgba(${n>>16},${(n>>8)&255},${n&255},${a})`; }

// -- layout
const HDR=92, MID_B=742, SEP=12, STAFF_T=MID_B+SEP, STAFF_B=1004;
const HW_R=1240, FB_L=HW_R+SEP;

// -- jalur 3D
const CX=620, HIT_Y=672, LANE_X=[185,475,765,1055], V=-300, S_TOP=(HDR-V)/(HIT_Y-V), LOOK=2.4;
const zOf = dtSec => dtSec/LOOK*(1/S_TOP-1);
const sOf = dtSec => 1/(1+zOf(Math.max(0,dtSec)));
const py = s => V+(HIT_Y-V)*s;
const px = (l,s) => CX+(LANE_X[l]-CX)*s;

function drawHighway(u, cur){
  g.save(); g.beginPath(); g.rect(0,HDR,HW_R,MID_B-HDR); g.clip();
  g.fillStyle="#0c0c0d"; g.fillRect(0,HDR,HW_R,MID_B-HDR);
  // papan
  const sB=(MID_B+20-V)/(HIT_Y-V), L0=15, R0=1225;
  g.beginPath(); g.moveTo(CX+(L0-CX)*S_TOP,HDR); g.lineTo(CX+(R0-CX)*S_TOP,HDR); g.lineTo(CX+(R0-CX)*sB,MID_B+20); g.lineTo(CX+(L0-CX)*sB,MID_B+20); g.closePath();
  const wood=g.createLinearGradient(0,HDR,0,MID_B); wood.addColorStop(0,"#1f1c18"); wood.addColorStop(1,"#3a352d");
  g.fillStyle=wood; g.fill();
  // serat kayu
  g.strokeStyle="rgba(0,0,0,0.25)"; g.lineWidth=1;
  for (let i=0;i<=40;i++){ const xb=L0+(R0-L0)*i/40; g.beginPath(); g.moveTo(CX+(xb-CX)*S_TOP,HDR); g.lineTo(CX+(xb-CX)*sB,MID_B+20); g.stroke(); }
  // garis ketukan bergerak
  for (let k=Math.ceil(u/(S.beat))*S.beat; ; k+=S.beat){
    const dt=(k-u)*EIGHTH_SEC; if (dt>LOOK*1.2) break; const s=sOf(dt), y=py(s);
    const isBar = k%BAR===0; g.strokeStyle=isBar? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"; g.lineWidth=isBar?2.5*s:1.5*s;
    g.beginPath(); g.moveTo(CX+(L0-CX)*s,y); g.lineTo(CX+(R0-CX)*s,y); g.stroke();
  }
  // senar
  [0,1,2,3].forEach(l=>{ const active=cur&&lane(cur)===l;
    g.strokeStyle= active? STRINGS[3-l].color : "rgba(235,235,235,0.85)"; g.lineWidth=[4,3.4,2.8,2.2][l]*(active?1.6:1);
    g.beginPath(); g.moveTo(px(l,S_TOP),HDR); g.lineTo(px(l,sB),MID_B+20); g.stroke(); });
  // lingkaran target
  [0,1,2,3].forEach(l=>{ const c=STRINGS[3-l].color, x=LANE_X[l];
    const rg=g.createRadialGradient(x,HIT_Y+6,4,x,HIT_Y,62); rg.addColorStop(0,"#000"); rg.addColorStop(1,"#1b1714");
    ell(x,HIT_Y,62,46); g.fillStyle=rg; g.fill(); g.lineWidth=4; g.strokeStyle=c; g.stroke();
    if (cur&&lane(cur)===l){ ell(x,HIT_Y,70,53); g.strokeStyle=hexA(c,0.35); g.lineWidth=8; g.stroke(); } });
  // ekor nada panjang
  const vis = EVENTS.filter(e=>e.start+e.dur>u && (e.start-u)*EIGHTH_SEC<LOOK*1.25).sort((a,b)=>b.start-a.start);
  for (const e of vis){
    const l=lane(e), c=STRINGS[e.string].color;
    const s0=sOf((Math.max(e.start,u)-u)*EIGHTH_SEC), s1=sOf((e.start+e.dur-u)*EIGHTH_SEC-0.08);
    if (s0-s1<0.004) continue;
    g.beginPath(); g.moveTo(px(l,s0)-7*s0,py(s0)); g.lineTo(px(l,s1)-7*s1,py(s1)); g.lineTo(px(l,s1)+7*s1,py(s1)); g.lineTo(px(l,s0)+7*s0,py(s0)); g.closePath();
    g.fillStyle=e===cur? c : hexA(c,0.75); g.fill();
  }
  // nada
  for (const e of vis){
    const l=lane(e), c=STRINGS[e.string].color, on=e===cur, active=e.start<=u;
    const s=active?1:sOf((e.start-u)*EIGHTH_SEC), x=px(l,s), y=py(s), rx=48*s, ry=36*s;
    if (on){ // keping 3D di lingkaran target
      ell(x,y+12,rx,ry); g.fillStyle=hexA(c,0.55); g.fill();
      g.fillRect(x-rx,y,rx*2,12); ell(x,y,rx,ry); g.fillStyle="#24211d"; g.fill(); g.lineWidth=4; g.strokeStyle=c; g.stroke();
    } else {
      ell(x,y,rx,ry); g.fillStyle="rgba(20,18,16,0.88)"; g.fill(); g.lineWidth=Math.max(1,3.5*s); g.strokeStyle=c; g.stroke();
      ell(x,y,rx*0.82,ry*0.8); g.lineWidth=Math.max(0.6,1.5*s); g.strokeStyle=hexA(c,0.6); g.stroke();
    }
    const big=e.label.length===1; g.fillStyle=c; g.textAlign="center"; g.textBaseline="middle";
    g.font=`bold ${Math.round((big?46:36)*s)}px 'DejaVu Sans'`; g.fillText(e.label,x,y+2*s);
    if (e.pos==="III"){ g.font=`bold ${Math.round(16*s)}px 'DejaVu Sans'`; g.fillText("III",x,y-ry-10*s); }
  }
  g.restore();
}

// -- papan jari (dilihat dari atas)
const FB_CX=1712, NUT_Y=166, FB_LEN=1000;
const fretY = off => NUT_Y+FB_LEN*(1-Math.pow(2,-off/12));
const fbHalf = y => 100+(y-NUT_Y)*0.075;
const strX = (l,y) => FB_CX+[-0.75,-0.25,0.25,0.75][l]*fbHalf(y)*1.0;
function drawFingerboard(cur, next){
  g.save(); g.beginPath(); g.rect(FB_L,HDR,1920-FB_L,MID_B-HDR); g.clip();
  g.fillStyle="#ffffff"; g.fillRect(FB_L,HDR,1920-FB_L,MID_B-HDR);
  // kotak kunci (pegbox)
  const pb=g.createLinearGradient(FB_CX-170,0,FB_CX+170,0); pb.addColorStop(0,"#5a2a12"); pb.addColorStop(0.5,"#9a4f25"); pb.addColorStop(1,"#5a2a12");
  g.fillStyle=pb; g.beginPath(); g.roundRect(FB_CX-170,HDR-30,340,NUT_Y-HDR+22,18); g.fill();
  g.fillStyle="#2b1408"; g.fillRect(FB_CX-95,HDR,190,NUT_Y-HDR-10);
  // papan jari
  const yB=MID_B+10;
  g.fillStyle="#141414"; g.beginPath(); g.moveTo(FB_CX-fbHalf(NUT_Y),NUT_Y); g.lineTo(FB_CX+fbHalf(NUT_Y),NUT_Y); g.lineTo(FB_CX+fbHalf(yB),yB); g.lineTo(FB_CX-fbHalf(yB),yB); g.closePath(); g.fill();
  g.fillStyle="#efe6cf"; g.fillRect(FB_CX-fbHalf(NUT_Y)-4,NUT_Y-8,2*fbHalf(NUT_Y)+8,9);
  // tape posisi jari 1, 2 tinggi, 3
  for (const off of [2,4,5]){ const y=fretY(off), h=fbHalf(y), xs=[FB_CX-h,strX(0,y),strX(1,y),strX(2,y),strX(3,y),FB_CX+h];
    g.fillStyle="#ffffff"; for (let k=0;k<5;k++) g.fillRect(xs[k]+(k?7:0),y-4,xs[k+1]-xs[k]-(k?7:0)-(k<4?7:0),8); }
  // senar
  [0,1,2,3].forEach(l=>{ const active=cur&&lane(cur)===l;
    g.strokeStyle= active? STRINGS[3-l].color : "#b9bcc2"; g.lineWidth=(active?8:[4,3.4,2.8,2.2][l]);
    g.beginPath(); g.moveTo(strX(l,HDR),HDR); g.lineTo(strX(l,NUT_Y),NUT_Y); g.lineTo(strX(l,yB),yB); g.stroke(); });
  // penanda
  const mark=(e,alpha)=>{ const l=lane(e); const y = e.off===0 ? HDR+44 : (fretY(e.off-1)+fretY(e.off))/2 + 6;
    g.globalAlpha=alpha; ell(strX(l,y),y,34,34); g.fillStyle="#fff"; g.fill(); g.lineWidth=4; g.strokeStyle="#111"; g.stroke();
    g.fillStyle="#111"; g.textAlign="center"; g.textBaseline="middle"; g.font=`bold ${e.label.length>1?28:34}px 'DejaVu Sans'`; g.fillText(e.label,strX(l,y),y+1);
    g.globalAlpha=1; };
  if (cur) mark(cur,1); else if (next) mark(next,0.35);
  // keterangan
  const show=cur||next;
  if (show){ const c=STRINGS[show.string].color, x0=FB_L+26; g.textAlign="left"; g.textBaseline="alphabetic";
    g.globalAlpha=cur?1:0.45;
    const parts=[pretty(show.pitch)].concat(show.desc.split(", ")); if (show.pizz) parts.push("pizz.");
    const top=MID_B-28-parts.length*26-104;
    g.fillStyle=c; g.font="bold 26px 'DejaVu Sans'"; g.fillText("Senar "+STRINGS[show.string].name,x0,top);
    g.fillStyle="#111"; g.font="bold 64px 'DejaVu Sans'"; g.fillText(show.label,x0,top+74);
    g.fillStyle="#444"; g.font="20px 'DejaVu Sans'";
    parts.forEach((t,i)=>g.fillText(t,x0,top+112+i*26));
    g.globalAlpha=1; }
  g.restore();
}

// -- not balok berjalan
const ST_PX=S.staffPx||46, PH_X=640, LINE_GAP=15, BOT_LINE=912, FIXED_W=240;
const yStep = st => BOT_LINE-(st-30)*LINE_GAP/2;   // st 30 = E4 (garis bawah)
const SHARP_STEPS={F:38,C:35,G:39,D:36,A:33,E:37,B:34}, FLAT_STEPS={B:34,E:37,A:33,D:36,G:32,C:35,F:31};
function glyph(ch,x,y,size){ g.font=`${size}px FreeSerif`; g.fillText(ch,x,y); }
function drawStaff(u, cur){
  g.save(); g.beginPath(); g.rect(0,STAFF_T,1920,STAFF_B-STAFF_T); g.clip();
  g.fillStyle="#fff"; g.fillRect(0,STAFF_T,1920,STAFF_B-STAFF_T);
  g.strokeStyle="#222"; g.lineWidth=1.4;
  for (let i=0;i<5;i++){ const y=BOT_LINE-i*LINE_GAP; g.beginPath(); g.moveTo(20,y); g.lineTo(1900,y); g.stroke(); }
  const xT = t => PH_X+(t-u)*ST_PX;
  // isi yang bergulir
  g.save(); g.beginPath(); g.rect(FIXED_W,STAFF_T,1920-FIXED_W,STAFF_B-STAFF_T); g.clip();
  g.textAlign="center"; g.textBaseline="alphabetic";
  for (let b=0;b<=BARS.length;b++){ const x=xT(b*BAR); if (x<FIXED_W-50||x>1940) continue;
    g.strokeStyle="#222"; g.lineWidth=b===BARS.length?4:1.6; g.beginPath(); g.moveTo(x,BOT_LINE); g.lineTo(x,BOT_LINE-4*LINE_GAP); g.stroke();
    if (b<BARS.length){ g.fillStyle="#888"; g.font="italic 15px 'DejaVu Serif'"; g.textAlign="left"; g.fillText(String(b+1),x+4,STAFF_B-12);
      if (SECTIONS[b+1]){ g.fillStyle="#555"; g.font="italic bold 17px 'DejaVu Sans'"; g.fillText(SECTIONS[b+1],x+34,STAFF_B-12); } } }
  const items=ITEMS.filter(it=>{ const x=xT(it.t); return x>FIXED_W-60&&x<1960; });
  for (const it of items){
    const x=xT(it.t)+16;
    if (it.kind==="rest"){
      g.fillStyle="#222"; g.textAlign="center";
      if (it.whole){ g.fillRect(xT(it.t)+BAR*ST_PX/2-11,BOT_LINE-3*LINE_GAP,22,LINE_GAP*0.5); continue; }
      if (it.d>=4){ g.fillRect(x-11,BOT_LINE-2*LINE_GAP-LINE_GAP*0.5,22,LINE_GAP*0.5); if (it.d===6) ell(x+18,BOT_LINE-2.5*LINE_GAP,2.6,2.6), g.fill(); continue; }
      if (it.d>=2){ glyph("\u{1D13D}",x,BOT_LINE-1.6*LINE_GAP,58); if (it.d===3) { ell(x+14,BOT_LINE-2.5*LINE_GAP,2.6,2.6); g.fill(); } continue; }
      glyph("\u{1D13E}",x,BOT_LINE-1.9*LINE_GAP,58); continue;
    }
    const e=it.ev, on=e===cur, y=yStep(it.step), col=on? STRINGS[e.string].color : "#111";
    // garis bantu
    g.strokeStyle="#222"; g.lineWidth=1.4;
    for (let st=28; st>=it.step; st-=2){ const yy=yStep(st); g.beginPath(); g.moveTo(x-15,yy); g.lineTo(x+15,yy); g.stroke(); }
    for (let st=40; st<=it.step; st+=2){ const yy=yStep(st); g.beginPath(); g.moveTo(x-15,yy); g.lineTo(x+15,yy); g.stroke(); }
    if (it.acc){ g.fillStyle=col; g.textAlign="center"; glyph({"#":"♯",b:"♭",n:"♮"}[it.acc],x-24,y+8,30); }
    // kepala not
    const hollow=it.d>=4; g.save(); g.translate(x,y); g.rotate(-0.35); g.beginPath(); g.ellipse(0,0,9.5,6.6,0,0,Math.PI*2); g.restore();
    if (hollow){ g.lineWidth=2.6; g.strokeStyle=col; g.stroke(); } else { g.fillStyle=col; g.fill(); }
    if ([3,6,12].includes(it.d)){ const dy=it.step%2===0? -LINE_GAP/2 : 0; ell(x+17,y+dy,2.8,2.8); g.fillStyle=col; g.fill(); }
    // tangkai dan bendera
    if (it.d<8){ const up=it.step<34; g.strokeStyle=col; g.lineWidth=1.8; const sx=up? x+8.6 : x-8.6, sy=up? y-52 : y+52;
      g.beginPath(); g.moveTo(sx,y+(up?-2:2)); g.lineTo(sx,sy); g.stroke();
      if (it.d===1){ g.beginPath(); g.moveTo(sx,sy); if (up) g.bezierCurveTo(sx+4,sy+14,sx+18,sy+18,sx+12,sy+34); else g.bezierCurveTo(sx+4,sy-14,sx+18,sy-18,sx+12,sy-34); g.lineWidth=2.4; g.stroke(); } }
    // ikatan
    if (it.tie){ const up=it.step<34, nx=x+it.d*ST_PX; g.strokeStyle=col; g.lineWidth=1.8; g.beginPath();
      const ty=y+(up?12:-12); g.moveTo(x+6,ty); g.quadraticCurveTo((x+nx)/2,ty+(up?14:-14),nx-6,ty); g.stroke(); }
    // angka jari
    if (it.first){ g.fillStyle=STRINGS[e.string].color; g.textAlign="center"; g.font="bold 21px 'DejaVu Sans'";
      g.fillText(e.label,x,STAFF_T+30); if (e.pos==="III"){ g.font="bold 11px 'DejaVu Sans'"; g.fillText("III",x,STAFF_T+44); } }
  }
  g.restore();
  // kunci, tanda kunci, birama (tetap)
  g.fillStyle="#fff"; g.fillRect(0,STAFF_T,FIXED_W,STAFF_B-STAFF_T);
  g.strokeStyle="#222"; g.lineWidth=1.4; for (let i=0;i<5;i++){ const y=BOT_LINE-i*LINE_GAP; g.beginPath(); g.moveTo(20,y); g.lineTo(FIXED_W,y); g.stroke(); }
  g.fillStyle="#111"; g.textAlign="left"; glyph("\u{1D11E}",26,BOT_LINE+12,88);
  let kx=86; (S.keySig||[]).forEach(k=>{ const st=(k[1]==="#"?SHARP_STEPS:FLAT_STEPS)[k[0]]; glyph(k[1]==="#"?"♯":"♭",kx,yStep(st)+(k[1]==="#"?9:6),30); kx+=15; });
  const [tn,td]=(S.time||"4/4").split("/"); g.font="bold 30px 'DejaVu Serif'"; g.textAlign="center";
  g.fillText(tn,kx+28,BOT_LINE-2*LINE_GAP-3); g.fillText(td,kx+28,BOT_LINE+1);
  // playhead
  g.strokeStyle="#2b39d8"; g.lineWidth=3; g.beginPath(); g.moveTo(PH_X,STAFF_T+4); g.lineTo(PH_X,STAFF_B-30); g.stroke();
  g.restore();
}

function renderAt(sec){
  const u = sec/EIGHTH_SEC - LEAD;
  let cur=null, next=null;
  for (const e of EVENTS){ if (u>=e.start && u<e.start+e.dur) cur=e; if (e.start>u && !next) next=e; }
  const barNow = Math.min(BARS.length, Math.max(1, Math.floor(Math.max(0,u)/BAR)+1));
  g.fillStyle="#c9b532"; g.fillRect(0,0,1920,1080);              // garis pemisah emas
  // kepala
  g.fillStyle="#101012"; g.fillRect(0,0,1920,HDR);
  g.textBaseline="alphabetic"; g.textAlign="left";
  g.fillStyle="#f2ede2"; g.font="44px 'DejaVu Serif'"; g.fillText(S.title,36,60);
  const tw=g.measureText(S.title).width;
  g.fillStyle="#9a9a9a"; g.font="20px 'DejaVu Sans'"; g.fillText(S.kicker+"  ·  "+S.subtitle,36+tw+24,58);
  g.textAlign="right"; g.fillStyle="#d9d4c8"; g.font="20px 'DejaVu Sans'";
  g.fillText(`Birama ${barNow}  ·  Tempo ${tempo}  ·  ${fmt(sec)} / ${fmt(totalSec())}`,1884,58);
  drawHighway(u,cur);
  drawFingerboard(cur,next);
  drawStaff(u,cur);
  // kaki: progres + legenda
  g.fillStyle="#101012"; g.fillRect(0,STAFF_B,1920,1080-STAFF_B);
  g.fillStyle="#2c2c30"; g.fillRect(0,STAFF_B,1920,5); g.fillStyle="#c9b532"; g.fillRect(0,STAFF_B,1920*Math.min(1,sec/totalSec()),5);
  g.textBaseline="middle"; g.textAlign="left"; let lx=36;
  ["G","D","A","E"].forEach((n,i)=>{ const c=STRINGS[3-i].color; ell(lx+12,1046,12,12); g.strokeStyle=c; g.lineWidth=3; g.stroke();
    g.fillStyle=c; g.font="bold 18px 'DejaVu Sans'"; g.fillText(n,lx+32,1047); lx+=78; });
  g.fillStyle="#bdbdbd"; g.font="18px 'DejaVu Sans'";
  const hasIII=EVENTS.some(e=>e.pos==="III");
  g.fillText(`0 = senar kosong   ·   1 2 3 4 = jari   ·   #2 = jari agak maju (tinggi)   ·   b2 = jari agak mundur (rendah)${hasIII?"   ·   III = posisi III":""}`,lx+24,1047);
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
