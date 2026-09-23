// The Campfire: a night clearing where every guestbook story is a star.
// A canvas scene plus a thin client for campfire-api (GET /api/entries, POST /api/sign).
// The API has the final word on every rule; the checks here only save a round trip.
(() => {
'use strict';
const $ = id => document.getElementById(id);
const scene = $('cf-scene');
if (!scene) return;
const API = scene.dataset.api;
const cv = $('cf-sky'), ctx = cv.getContext('2d');
const form = $('cf-sign'), fName = $('cf-name'), fMsg = $('cf-msg'), fSite = $('cf-site'), fCount = $('cf-count'), fStatus = $('cf-status'), sendBtn = $('cf-send');
const intro = $('cf-intro'), legend = $('cf-legend'), starLayer = $('cf-stars'), card = $('cf-card');
const cName = $('cf-card-name'), cDate = $('cf-card-date'), cMsg = $('cf-card-msg'), cTag = $('cf-card-tag');
const list = $('cf-entries');
const mq = matchMedia('(prefers-reduced-motion: reduce)');
const coarse = matchMedia('(pointer: coarse)');
let RM = mq.matches;

const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rand = (a, b) => a + Math.random() * (b - a);
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
const smooth = t => t * t * (3 - 2 * t);
const easeOutBack = t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function seeded(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mix(a, b, t) { return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')'; }
const WOOD = [20, 12, 8], WOODLIT = [205, 112, 52], STONE = [15, 16, 24], STONELIT = [196, 116, 72];

/* ---------- notes: the newest guestbook stories, placed as stars ---------- */
// u, v are spots inside the constellation box. They are seeded from the entry id,
// so a story keeps its place in the sky between visits.
const notes = [], edges = [];
const ASPECT = 1.7;                                   // rough width:height of the box, for spacing in u/v
const SKY_MAX = window.innerWidth < 900 ? 30 : 60;    // older stories stay in the list below
let spacing = 0.18;

function hashId(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function uvDist(a, u, v) { return Math.hypot((a.u - u) * ASPECT, a.v - v); }
function spotFor(id) {
  const R = seeded(hashId(String(id)));
  let best = { u: 0.5, v: 0.5 }, bd = -1;
  for (let i = 0; i < 48; i++) {
    const u = 0.03 + R() * 0.94, v = 0.05 + R() * 0.9;
    let m = 1e9; for (const n of notes) { const d = uvDist(n, u, v); if (d < m) m = d; }
    if (m >= spacing) return { u, v };
    if (m > bd) { bd = m; best = { u, v }; }
  }
  return best;
}
// each story links to the nearest star that was already up there, so the constellation grows the way the fire did
function nearestEarlier(n) {
  let best = -1, bd = 1e9;
  notes.forEach((o, i) => { if (o.born === Infinity) return; const d = uvDist(o, n.u, n.v); if (d < bd) { bd = d; best = i; } });
  return best;
}
function addNote(entry, fresh) {
  const pos = spotFor(entry.id);
  const n = { id: entry.id, name: entry.name, msg: entry.message, ts: entry.ts, u: pos.u, v: pos.v, mine: !!fresh, ph: Math.random() * TAU, born: fresh ? Infinity : -1e9, x: 0, y: 0 };
  const li = nearestEarlier(n);
  notes.push(n);
  if (li >= 0) edges.push({ a: li, b: notes.length - 1, at: fresh ? Infinity : -1e9 });
  place(n);
  return n;
}
function setSky(entries) {   // entries arrive newest first
  notes.length = 0; edges.length = 0;
  const sky = entries.slice(0, SKY_MAX).reverse();
  spacing = clamp(0.7 * Math.sqrt(ASPECT / Math.max(1, sky.length)), 0.085, 0.2);
  sky.forEach(e => addNote(e, false));
  // the lines draw themselves in, oldest first
  edges.forEach((e, k) => { e.at = RM ? -1e9 : T + 0.3 + k * 0.035; });
}

/* ---------- layout ---------- */
const L = { bx0: 0, bx1: 1, by0: 0, by1: 1 };
let W = 0, H = 0, DPR = 1, bg = null, paths = null, stars = [], stones = [], pebbles = [];
let groundGrad = null, mistGrad = null, groundPath = null;

function place(n) { n.x = L.bx0 + n.u * (L.bx1 - L.bx0); n.y = L.by0 + n.v * (L.by1 - L.by0); }

function layout() {
  const r = scene.getBoundingClientRect();
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  const fr = form.getBoundingClientRect(), ir = intro.getBoundingClientRect();
  const mobile = W < 900, fs = clamp(Math.min(W / 1100, H / 760), 0.55, 1.05);
  L.mobile = mobile; L.fs = fs;
  L.formTop = fr.top - r.top;
  L.intro = { x0: ir.left - r.left, y0: ir.top - r.top, x1: ir.right - r.left, y1: ir.bottom - r.top };
  L.fireX = Math.round(W / 2);
  L.fireY = Math.round(L.formTop - 30 * fs - 10);
  L.horizon = Math.round(L.fireY - 92 * fs);
  L.fireW = 86 * fs; L.flameH = 190 * fs;
  L.moonR = mobile ? 15 : clamp(W * 0.017, 18, 26);
  L.moonX = mobile ? W - 42 : W * 0.885; L.moonY = mobile ? L.intro.y1 + 34 : H * 0.14;   // on phones the moon sits under the intro, right of the stars
  if (mobile) { L.bx0 = 34; L.bx1 = W - 76; L.by0 = L.intro.y1 + 40; L.by1 = L.horizon - 120 * fs; }
  else { L.bx0 = Math.max(W * 0.42, L.intro.x1 + 70); L.bx1 = W * 0.82; L.by0 = Math.max(H * 0.12, 96); L.by1 = L.horizon - L.flameH - 30; }
  if (L.by1 - L.by0 < 120) L.by0 = L.by1 - 120;
  L.px = Math.max(2, Math.round(3.4 * fs));
  L.stumpX = L.fireX + 170 * fs; L.stumpTop = L.fireY - 24 * fs;
  L.nFlame = Math.round(55 + 95 * fs * (mobile ? 0.8 : 1));
  L.nEmber = Math.round(12 + 26 * fs);
  L.nSmoke = Math.round(7 + 9 * fs);
  notes.forEach(place);
  buildBg(); buildTrees(); buildStars(); buildCamp(); buildStarButtons();
}

/* sky, milky band and moon are painted once per resize */
function buildBg() {
  bg = document.createElement('canvas'); bg.width = cv.width; bg.height = cv.height;
  const b = bg.getContext('2d'); b.setTransform(DPR, 0, 0, DPR, 0, 0);
  const hz = L.horizon;
  const g = b.createLinearGradient(0, 0, 0, hz + 30);
  g.addColorStop(0, '#0A0E1F'); g.addColorStop(0.5, '#0E1329'); g.addColorStop(0.84, '#141A33'); g.addColorStop(1, '#1B2244');
  b.fillStyle = g; b.fillRect(0, 0, W, H);

  // milky band, lower left to upper right, only above the trees
  b.save(); b.beginPath(); b.rect(0, 0, W, hz); b.clip();
  const R = seeded(11);
  const ax = -0.08 * W, ay = hz * 0.98, bx = 1.08 * W, by = hz * 0.0;
  const len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len, nx = -uy, ny = ux;
  const bw = Math.max(70, Math.min(W, H) * 0.17);
  const at = (t, o) => [ax + ux * len * t + nx * o, ay + uy * len * t + ny * o];
  b.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 48; i++) {
    const [x, y] = at(R(), (R() + R() - 1) * bw * 0.55), rr = bw * (0.35 + R() * 0.8);
    const gg = b.createRadialGradient(x, y, 0, x, y, rr);
    gg.addColorStop(0, 'rgba(150,162,230,0.05)'); gg.addColorStop(1, 'rgba(150,162,230,0)');
    b.fillStyle = gg; b.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  b.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 24; i++) { // dust lanes
    const [x, y] = at(R(), (R() - 0.3) * bw * 0.4), rr = bw * (0.14 + R() * 0.3);
    const gg = b.createRadialGradient(x, y, 0, x, y, rr);
    gg.addColorStop(0, 'rgba(8,11,24,0.32)'); gg.addColorStop(1, 'rgba(8,11,24,0)');
    b.fillStyle = gg; b.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  b.globalCompositeOperation = 'lighter';
  const nd = Math.round(len * 1.1);
  for (let i = 0; i < nd; i++) {
    const [x, y] = at(R(), (R() + R() + R() - 1.5) * bw * 0.5), s = R() < 0.9 ? 0.7 : 1.2;
    b.fillStyle = 'rgba(233,237,255,' + (0.04 + R() * 0.22).toFixed(3) + ')';
    b.fillRect(x, y, s, s);
  }
  b.restore();

  // moon: halo, faint earthshine, lit crescent
  const mr = L.moonR, mx = L.moonX, my = L.moonY;
  b.globalCompositeOperation = 'lighter';
  const hg = b.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 7);
  hg.addColorStop(0, 'rgba(233,237,255,0.13)'); hg.addColorStop(0.35, 'rgba(233,237,255,0.035)'); hg.addColorStop(1, 'rgba(233,237,255,0)');
  b.fillStyle = hg; b.fillRect(mx - mr * 7, my - mr * 7, mr * 14, mr * 14);
  b.globalCompositeOperation = 'source-over';
  b.fillStyle = '#1A2141'; b.beginPath(); b.arc(mx, my, mr, 0, TAU); b.fill();
  const ms = Math.ceil(mr * 2 + 4), m = document.createElement('canvas');
  m.width = m.height = Math.ceil(ms * DPR);
  const mc = m.getContext('2d'); mc.scale(DPR, DPR);
  const c0 = ms / 2, lg = mc.createLinearGradient(c0 - mr, c0 - mr, c0 + mr, c0 + mr);
  lg.addColorStop(0, '#F7F8FF'); lg.addColorStop(1, '#C3CAE6');
  mc.fillStyle = lg; mc.beginPath(); mc.arc(c0, c0, mr, 0, TAU); mc.fill();
  mc.fillStyle = 'rgba(110,120,165,0.25)';
  for (const [dx, dy, cr] of [[-.45, .1, .16], [-.2, .5, .12], [-.55, -.35, .1], [-.1, -.1, .08], [-.35, .62, .07]]) { mc.beginPath(); mc.arc(c0 + dx * mr, c0 + dy * mr, cr * mr, 0, TAU); mc.fill(); }
  mc.globalCompositeOperation = 'destination-out';
  mc.beginPath(); mc.arc(c0 + mr * 0.52, c0 - mr * 0.24, mr * 0.98, 0, TAU); mc.fill();
  b.drawImage(m, mx - ms / 2, my - ms / 2, ms, ms);

  // cool haze sitting on the tree line
  const hz2 = b.createLinearGradient(0, hz - 90, 0, hz + 10);
  hz2.addColorStop(0, 'rgba(34,44,84,0)'); hz2.addColorStop(1, 'rgba(34,44,84,0.35)');
  b.fillStyle = hz2; b.fillRect(0, hz - 90, W, 100);

  // ground shape and gradients used every frame
  groundPath = new Path2D();
  const G = seeded(19);
  groundPath.moveTo(-60, H + 10); groundPath.lineTo(-60, hz + 6);
  for (let x = -60; x <= W + 60; x += 6 + G() * 8) groundPath.lineTo(x, hz + 6 - (G() < 0.35 ? 2 + G() * 5 : G() * 1.5));
  groundPath.lineTo(W + 60, hz + 6); groundPath.lineTo(W + 60, H + 10); groundPath.closePath();
  groundGrad = ctx.createLinearGradient(0, hz, 0, H);
  groundGrad.addColorStop(0, '#0B0F20'); groundGrad.addColorStop(0.3, '#080B17'); groundGrad.addColorStop(1, '#05070F');
  mistGrad = ctx.createLinearGradient(0, hz - 70, 0, hz + 8);
  mistGrad.addColorStop(0, 'rgba(26,33,64,0)'); mistGrad.addColorStop(1, 'rgba(26,33,64,0.5)');
}

/* one pine: drooping tiers, drawn into a shared Path2D */
function pine(p, x, base, h, w, R) {
  const tiers = 7 + (R() * 5 | 0), trunk = h * 0.07, crown = h - trunk, step = crown * 0.9 / tiers, tw = Math.max(0.8, w * 0.05);
  const left = [], right = [];
  for (let i = 0; i < tiers; i++) {
    const k = i / tiers, yTip = base - trunk - step * i, yN = yTip - step * (1.15 + R() * 0.3);
    const hl = (w / 2) * (1 - k) * (0.75 + R() * 0.45) + w * 0.02, hr = (w / 2) * (1 - k) * (0.75 + R() * 0.45) + w * 0.02;
    left.push([x - hl, yTip + R() * step * 0.3], [x - hl * (0.22 + R() * 0.18), yN]);
    right.push([x + hr, yTip + R() * step * 0.3], [x + hr * (0.22 + R() * 0.18), yN]);
  }
  p.moveTo(x - tw, base); p.lineTo(x - tw, base - trunk);
  for (const q of left) p.lineTo(q[0], q[1]);
  p.lineTo(x + (R() - 0.5) * w * 0.04, base - h);
  for (let i = right.length - 1; i >= 0; i--) p.lineTo(right[i][0], right[i][1]);
  p.lineTo(x + tw, base - trunk); p.lineTo(x + tw, base); p.closePath();
}
function buildTrees() {
  const s = L.fs, hz = L.horizon, sc = Math.max(s, 0.7);
  const far = new Path2D(), mid = new Path2D(), near = new Path2D();
  let R = seeded(7);
  for (let x = -50; x < W + 50; x += (9 + R() * 13) * sc) { const h = (24 + R() * 50 + (R() < 0.12 ? 26 : 0)) * s; pine(far, x, hz + 4, h, h * (0.34 + R() * 0.1), R); }
  R = seeded(23);
  for (let x = -60; x < W + 60; x += (18 + R() * 26) * sc) {
    const d = clamp(Math.abs(x - L.fireX) / (W * (L.mobile ? 0.45 : 0.3)), 0, 1), clear = 0.4 + 0.6 * smooth(d);
    const h = (70 + R() * 95) * s * clear;
    pine(mid, x, hz + 14 * s, h, h * (0.36 + R() * 0.1), R);
  }
  R = seeded(41);
  const spots = L.mobile ? [[-0.05, 0.95], [0.04, 0.72], [0.97, 0.88], [1.06, 1]] : [[-0.03, 1], [0.035, 0.78], [0.09, 0.58], [0.925, 0.64], [0.972, 0.92], [1.03, 1]];
  for (const [fx, k] of spots) { const h = (L.mobile ? H * 0.34 : H * 0.56) * k * (0.92 + R() * 0.16); pine(near, fx * W, hz + 58 * s, h, h * 0.36, R); }
  paths = { far, mid, near };
}
function buildStars() {
  const R = seeded(3), n = Math.round(clamp(W * L.horizon / 2600, 150, 420));
  stars = [];
  for (let i = 0; i < n; i++) {
    const x = R() * W, y = Math.pow(R(), 1.25) * (L.horizon - 12), big = R() < 0.07;
    if (Math.hypot(x - L.moonX, y - L.moonY) < L.moonR * 2.2) continue;
    stars.push({ x, y, r: big ? 1.3 + R() * 0.6 : 0.5 + R() * 0.7, a: (0.3 + R() * 0.6) * (1 - 0.5 * y / L.horizon), sp: 0.5 + R() * 1.8, ph: R() * TAU, c: R() < 0.1 ? 1 : R() < 0.2 ? 2 : 0, big });
  }
  stars.sort((a, b) => a.c - b.c);
}
function buildCamp() {
  const R = seeded(5);
  stones = [];
  for (let i = 0; i < 11; i++) {
    const a = i / 11 * TAU + (R() - 0.5) * 0.3;
    stones.push({ dx: Math.cos(a) * 62, dy: Math.sin(a) * 15 + 4, w: 15 + R() * 7, h: 9 + R() * 4, back: Math.sin(a) < 0.05, tilt: (R() - 0.5) * 0.3 });
  }
  stones.sort((a, b) => a.dy - b.dy);
  pebbles = [];
  for (let i = 0; i < 34; i++) {
    const a = R() * TAU, d = 1.4 + R() * 3.4;
    const dx = Math.cos(a) * 62 * d, dy = Math.sin(a) * 12 * d;
    if (Math.abs(dx - 170) < 40 && dy < 10) continue; // keep the stump clear
    if (dy > 22) continue;                             // stay above the prompt
    pebbles.push({ dx, dy, r: 1.4 + R() * 2.6, d });
  }
}

/* ---------- sprites ---------- */
function glow(rgb, stops, size) {
  size = size || 64;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, a] of stops) g.addColorStop(o, 'rgba(' + rgb + ',' + a + ')');
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  return c;
}
const HOT = [[0, 1], [0.25, 0.7], [0.6, 0.18], [1, 0]], SOFT = [[0, 0.55], [0.5, 0.22], [1, 0]];
const SPR = {
  core: glow('255,241,193', HOT), flame: glow('255,154,60', HOT), red: glow('255,90,31', HOT),
  star: glow('233,237,255', [[0, 1], [0.15, 0.45], [0.5, 0.08], [1, 0]]), warm: glow('255,214,160', [[0, 1], [0.15, 0.5], [0.5, 0.1], [1, 0]]),
  ember: glow('255,140,60', [[0, 1], [0.4, 0.3], [1, 0]], 16), smoke: glow('130,136,168', SOFT)
};

// the squirrel, 16x16, facing left toward the fire
const SQ = [
  '.........ooo....',
  '........oyyyoo..',
  '.......oyyttyyo.',
  '..oo...oytoottyo',
  '.okbo..oyo..otyo',
  '.obbbo..o...otyo',
  'ohbbbbo.....otyo',
  'ohebbbbo...ottyo',
  'nhhbbbbo..otttyo',
  'ohccbbdo.otttyo.',
  'ohhcbdbboottyyo.',
  '.occcbdbbbttyo..',
  '..occbdbbbtyo...',
  '..occcbbbbbo....',
  '.ohcobbbbbbo....',
  '.oooooooooo.....'
];
const SQ_FLICK = { 3: '..oo...oyyoottyo', 4: '.okbo...oo..otyo', 5: '.obbbo......otyo' };
const SQPAL = { o: '#1A0F0A', b: '#8A4B24', h: '#C27A3E', c: '#EBCB9C', d: '#3B2014', t: '#9A5528', y: '#D08A45', e: '#05070F', n: '#2A1208', k: '#C9775A' };
function sprite(rows, lit) {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const x = c.getContext('2d'), warm = hexRgb('#FFB36B');
  rows.forEach((row, j) => { for (let i = 0; i < 16; i++) { const k = SQPAL[row[i]]; if (!k) continue; x.fillStyle = lit ? mix(hexRgb(k), warm, 0.45) : k; x.fillRect(i, j, 1, 1); } });
  return c;
}
const SQF = [];
for (const flick of [0, 1]) for (const blink of [0, 1]) {
  const rows = SQ.map((r, j) => (flick && SQ_FLICK[j]) ? SQ_FLICK[j] : r);
  if (blink) rows[7] = rows[7].slice(0, 2) + 'b' + rows[7].slice(3);
  SQF.push([sprite(rows, false), sprite(rows, true)]);
}

/* ---------- simulation ---------- */
let T = 0, fl = 0.9, flT = 0.9, flNext = 0, wind = 0;
let px = 0, py = 0, tpx = 0, tpy = 0, hasMouse = false, lastMouse = -99;
const flames = [], embers = [], smoke = [], sparks = [], dust = [];
let accF = 0, accE = 0, accS = 0;
let blinkEnd = 0, blinkAt = 2.5, blink2 = -1, flickEnd = 0, flickAt = 5;
let shoot = null, shootNext = 5;

function spawnFlame() {
  const s = L.fs, hw = L.fireW * 0.5, off = gauss() * hw * 0.85, heat = 1 - Math.min(1, Math.abs(off) / hw);
  flames.push({ x: L.fireX + off, y: L.fireY - 4 * s + Math.random() * 6 * s, vx: -off * 0.4 + rand(-8, 8) * s, vy: -rand(80, 150) * s * (0.7 + heat * 0.5), age: 0, life: rand(0.5, 1.05) * (0.6 + heat * 0.5), size: rand(15, 25) * s * (0.65 + heat * 0.5), heat });
}
function spawnEmber(burst) {
  const s = L.fs, k = burst ? 2 : 1;
  embers.push({ x: L.fireX + gauss() * L.fireW * 0.35, y: L.fireY - rand(12, 70) * s, vx: rand(-18, 18) * s * k, vy: -rand(50, 120) * s * (burst ? 1.5 : 1), age: 0, life: rand(1.4, 3.4), r: rand(0.8, 1.9), seed: Math.random() * 99 });
}
function spawnSmoke() {
  const s = L.fs;
  smoke.push({ x: L.fireX + rand(-10, 10) * s, y: L.fireY - L.flameH * rand(0.6, 0.85), vx: rand(-4, 4) * s, vy: -rand(14, 24) * s, age: 0, life: rand(4, 6.5), size: rand(14, 22) * s, grow: rand(10, 16) * s, seed: Math.random() * 99 });
}
function stepAll(arr, dt, fn) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i]; p.age += dt;
    if (p.age >= p.life) { arr[i] = arr[arr.length - 1]; arr.pop(); continue; }
    fn(p, dt);
  }
}
const qb = (a, b, c, u) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;

function update(dt) {
  T += dt;
  const s = L.fs;
  if (T > flNext) { flT = rand(0.72, 1); flNext = T + rand(0.05, 0.16); }
  fl += (flT - fl) * (1 - Math.exp(-dt * 14));
  wind = Math.sin(T * 0.13) * 9 + Math.sin(T * 0.41 + 1) * 4;

  // parallax target: the mouse, or a slow idle sway
  if (!hasMouse || T - lastMouse > 4) { tpx = Math.sin(T * 0.11) * 0.35; tpy = 0; }
  const k = 1 - Math.exp(-dt * 3);
  px += (tpx - px) * k; py += (tpy - py) * k;

  accF += dt * L.nFlame / 0.62; while (accF >= 1) { accF--; if (flames.length < L.nFlame * 1.25) spawnFlame(); }
  accE += dt * L.nEmber / 2.4;  while (accE >= 1) { accE--; if (embers.length < L.nEmber * 1.6) spawnEmber(false); }
  accS += dt * L.nSmoke / 5.2;  while (accS >= 1) { accS--; if (smoke.length < L.nSmoke) spawnSmoke(); }

  stepAll(flames, dt, (p, dt) => {
    const t = p.age / p.life;
    p.vx += (L.fireX - p.x) * 2.2 * dt;
    p.vy -= 40 * s * dt;
    const sway = Math.sin(T * 5.1 + (L.fireY - p.y) * 0.05) * 22 * s * t + wind * s * 0.6 * t;
    p.x += (p.vx + sway) * dt; p.y += p.vy * dt;
  });
  stepAll(embers, dt, (p, dt) => {
    p.vx += (Math.sin(T * 2.2 + p.seed) * 22 * s + wind * 0.5) * dt;
    p.vy += 8 * s * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
  });
  stepAll(smoke, dt, (p, dt) => {
    p.x += (p.vx + wind * s * 0.5 + Math.sin(T * 0.7 + p.seed) * 6 * s) * dt; p.y += p.vy * dt; p.size += p.grow * dt;
  });
  stepAll(dust, dt, (p, dt) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 12 * dt; });

  // sparks carrying a new note up to its star
  for (let i = sparks.length - 1; i >= 0; i--) {
    const sp = sparks[i];
    if (!sp.done) {
      sp.age += dt;
      const lin = clamp(sp.age / sp.dur, 0, 1), u = 1 - Math.pow(1 - lin, 2.2);
      const x = qb(sp.S.x, sp.C.x, sp.n.x, u), y = qb(sp.S.y, sp.C.y, sp.n.y, u);
      sp.trail.push(x, y); if (sp.trail.length > 64) sp.trail.splice(0, 2);
      if (dust.length < 90) dust.push({ x, y, vx: rand(-14, 14), vy: rand(-6, 10), age: 0, life: rand(0.35, 0.8) });
      if (lin >= 1) { sp.done = true; land(sp.n); }
    } else {
      sp.trail.splice(0, 4);
      if (!sp.trail.length) sparks.splice(i, 1);
    }
  }

  // squirrel
  if (T > blinkAt) { blinkEnd = T + 0.14; blink2 = Math.random() < 0.3 ? T + 0.32 : -1; blinkAt = T + rand(2.4, 6); }
  if (T > flickAt) { flickEnd = T + 0.52; flickAt = T + rand(4, 9); }

  // rare shooting star
  if (!shoot && T > shootNext && !RM) {
    const dir = Math.random() < 0.5 ? 1 : -1, ang = rand(0.3, 0.55), sp = rand(620, 900);
    shoot = { x: rand(0.15, 0.85) * W, y: rand(0.04, 0.35) * L.horizon, vx: Math.cos(ang) * sp * dir, vy: Math.sin(ang) * sp, age: 0, life: rand(0.6, 0.9) };
    shootNext = T + rand(8, 20);
  }
  if (shoot) { shoot.age += dt; if (shoot.age > shoot.life) shoot = null; }
}

/* ---------- drawing ---------- */
let activeIdx = -1, pinned = -1;
const STARC = ['#E9EDFF', '#FFF1C1', '#BFD0FF'];
function seg(a, b, c, d) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

function drawStars() {
  let c = -1;
  for (const st of stars) {
    if (st.c !== c) { c = st.c; ctx.fillStyle = STARC[c]; }
    ctx.globalAlpha = st.a * (RM ? 0.9 : 0.72 + 0.28 * Math.sin(T * st.sp + st.ph));
    ctx.fillRect(st.x - st.r / 2, st.y - st.r / 2, st.r, st.r);
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const st of stars) if (st.big) { ctx.globalAlpha = st.a * 0.35; ctx.drawImage(SPR.star, st.x - 5, st.y - 5, 10, 10); }
  if (shoot) {
    const t = shoot.age / shoot.life, a = Math.sin(Math.PI * t);
    const hx = shoot.x + shoot.vx * shoot.age, hy = shoot.y + shoot.vy * shoot.age, tx = hx - shoot.vx * 0.14, ty = hy - shoot.vy * 0.14;
    const g = ctx.createLinearGradient(hx, hy, tx, ty);
    g.addColorStop(0, 'rgba(233,237,255,' + (0.9 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(233,237,255,0)');
    ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.3; seg(hx, hy, tx, ty);
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}

function drawConstellation() {
  ctx.lineWidth = 1;
  for (const e of edges) {
    const A = notes[e.a], B = notes[e.b];
    if (!A || !B || A.born === Infinity || B.born === Infinity) continue;
    const p = clamp((T - e.at) / 0.9, 0, 1); if (p <= 0) continue;
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy); if (d < 18) continue;
    const ux = dx / d, uy = dy / d, g0 = 8, len = (d - 16) * p;
    const hi = activeIdx === e.a || activeIdx === e.b;
    ctx.strokeStyle = hi ? 'rgba(233,237,255,0.42)' : 'rgba(233,237,255,0.17)';
    seg(A.x + ux * g0, A.y + uy * g0, A.x + ux * (g0 + len), A.y + uy * (g0 + len));
  }
  ctx.globalCompositeOperation = 'lighter';
  notes.forEach((n, i) => {
    if (n.born === Infinity) return;
    const age = T - n.born, b = age < 1.1 ? Math.max(0, easeOutBack(clamp(age / 1.1, 0, 1))) : 1;
    const pulse = RM ? 1 : 0.86 + 0.14 * Math.sin(T * 1.1 + n.ph), act = i === activeIdx;
    const size = (n.mine ? 14 : 12) * b * pulse * (act ? 1.45 : 1);
    ctx.globalAlpha = 0.9; ctx.drawImage(n.mine ? SPR.warm : SPR.star, n.x - size, n.y - size, size * 2, size * 2);
    const k = (5 + 3 * pulse) * b * (act ? 1.5 : 1);
    ctx.globalAlpha = 0.55; ctx.strokeStyle = n.mine ? '#FFF1C1' : '#E9EDFF'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(n.x - k, n.y); ctx.lineTo(n.x + k, n.y); ctx.moveTo(n.x, n.y - k); ctx.lineTo(n.x, n.y + k); ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(n.x, n.y, 1.7 * b, 0, TAU); ctx.fill();
    if (age < 0.9 && age >= 0) { // arrival flash
      const q = age / 0.9;
      ctx.globalAlpha = (1 - q) * 0.7; ctx.strokeStyle = '#FFF1C1'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(n.x, n.y, 4 + 46 * smooth(q), 0, TAU); ctx.stroke();
      ctx.globalAlpha = (1 - q); ctx.drawImage(SPR.core, n.x - 30 * (1 - q), n.y - 30 * (1 - q), 60 * (1 - q), 60 * (1 - q));
    }
  });
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  if (activeIdx >= 0 && notes[activeIdx]) {
    const n = notes[activeIdx];
    ctx.strokeStyle = 'rgba(233,237,255,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(n.x, n.y, 13, 0, TAU); ctx.stroke();
  }
}

function layer(path, color, ox, oy, la, lr) {
  ctx.save(); ctx.translate(ox, oy);
  ctx.fillStyle = color; ctx.fill(path);
  if (la > 0) {
    const fx = L.fireX - ox, fy = L.fireY - oy, g = ctx.createRadialGradient(fx, fy, 0, fx, fy, lr);
    g.addColorStop(0, 'rgba(255,150,70,' + la.toFixed(3) + ')');
    g.addColorStop(0.45, 'rgba(255,120,50,' + (la * 0.35).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,110,40,0)');
    ctx.fillStyle = g; ctx.fill(path);
  }
  ctx.restore();
}

function drawGround(F) {
  const s = L.fs;
  ctx.fillStyle = groundGrad; ctx.fill(groundPath);
  // light pool on the ground, radius breathes with the flicker
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.translate(L.fireX, L.fireY + 4 * s); ctx.scale(1, 0.3);
  const R = 330 * s * (0.86 + 0.2 * F), g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, 'rgba(255,179,107,' + (0.32 * F).toFixed(3) + ')');
  g.addColorStop(0.3, 'rgba(255,130,60,' + (0.15 * F).toFixed(3) + ')');
  g.addColorStop(1, 'rgba(255,110,40,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
  ctx.restore();
  // pebbles and twigs caught in the light
  for (const p of pebbles) {
    const x = L.fireX + p.dx * s, y = L.fireY + p.dy * s, r = p.r * s, lit = clamp(1 - (p.d - 1.4) / 3.6, 0, 1) * F;
    ctx.fillStyle = '#0B0C13'; ctx.beginPath(); ctx.ellipse(x, y, r * 1.4, r * 0.8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,160,90,' + (0.55 * lit).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(x - (p.dx > 0 ? r * 0.3 : -r * 0.3), y - r * 0.3, r * 0.8, r * 0.35, 0, 0, TAU); ctx.fill();
  }
}

function drawBench(F) {
  const s = L.fs, cx = L.fireX - 184 * s, by = L.fireY + 6 * s, len = 128 * s, th = 22 * s, x0 = cx - len / 2, y0 = by - th;
  ctx.fillStyle = 'rgba(2,3,8,0.6)'; ctx.beginPath(); ctx.ellipse(cx + 6 * s, by + s, len * 0.56, 5 * s, 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(0, y0, 0, by);
  g.addColorStop(0, mix(WOOD, WOODLIT, 0.45 * F)); g.addColorStop(0.35, mix(WOOD, WOODLIT, 0.12 * F)); g.addColorStop(1, '#080504');
  ctx.fillStyle = g; rrect(x0, y0, len, th, th / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
  for (let i = 1; i < 7; i++) { const x = x0 + len * i / 7; ctx.beginPath(); ctx.moveTo(x, y0 + th * 0.2); ctx.quadraticCurveTo(x + 5 * s, y0 + th * 0.5, x + 2 * s, y0 + th * 0.85); ctx.stroke(); }
  const ex = x0 + len - th * 0.3, ey = by - th / 2;
  ctx.fillStyle = mix([38, 22, 13], [222, 140, 70], 0.8 * F); ctx.beginPath(); ctx.ellipse(ex, ey, th * 0.28, th * 0.48, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(70,32,14,0.8)'; ctx.beginPath(); ctx.ellipse(ex, ey, th * 0.15, th * 0.28, 0, 0, TAU); ctx.stroke();
}

function drawStump(F) {
  const s = L.fs, cx = L.stumpX, top = L.stumpTop, w = 46 * s, h = 26 * s, ry = 7.5 * s;
  ctx.fillStyle = 'rgba(2,3,8,0.6)'; ctx.beginPath(); ctx.ellipse(cx + 8 * s, top + h + 2 * s, w * 0.8, 5 * s, 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  g.addColorStop(0, mix(WOOD, WOODLIT, 0.6 * F)); g.addColorStop(0.5, '#140C08'); g.addColorStop(1, '#090605');
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(cx - w / 2, top); ctx.lineTo(cx - w / 2 - 4 * s, top + h); ctx.lineTo(cx - w / 2 - 9 * s, top + h + 2 * s);
  ctx.quadraticCurveTo(cx, top + h + ry * 1.2, cx + w / 2 + 9 * s, top + h + 2 * s); ctx.lineTo(cx + w / 2 + 4 * s, top + h); ctx.lineTo(cx + w / 2, top);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = mix([40, 24, 14], [226, 150, 84], 0.7 * F); ctx.beginPath(); ctx.ellipse(cx, top, w / 2, ry, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(80,38,16,0.75)'; ctx.lineWidth = 1;
  for (const k of [0.72, 0.46, 0.22]) { ctx.beginPath(); ctx.ellipse(cx + 1, top, w / 2 * k, ry * k, 0, 0, TAU); ctx.stroke(); }
}

function drawSquirrel(F) {
  const p = L.px, blink = T < blinkEnd || (blink2 > 0 && T > blink2 && T < blink2 + 0.12);
  const flick = T < flickEnd && Math.floor((flickEnd - T) / 0.13) % 2 === 0;
  const fr = SQF[(flick ? 2 : 0) + (blink ? 1 : 0)];
  const x = Math.round(L.stumpX - 8 * p + p), y = Math.round(L.stumpTop - 15 * p);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(fr[0], x, y, 16 * p, 16 * p);
  ctx.globalAlpha = clamp(0.2 + (F - 0.7) * 1.6, 0.1, 0.7);
  ctx.drawImage(fr[1], x, y, 16 * p, 16 * p);
  ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true;
}

function drawStones(back, F) {
  const s = L.fs;
  for (const st of stones) {
    if (st.back !== back) continue;
    const x = L.fireX + st.dx * s, y = L.fireY + st.dy * s, w = st.w * s, h = st.h * s;
    ctx.beginPath(); ctx.ellipse(x, y - h * 0.4, w / 2, h / 2, st.tilt, 0, TAU);
    if (back) { // their faces look at us and at the fire
      const g = ctx.createLinearGradient(0, y - h, 0, y);
      g.addColorStop(0, mix(STONE, STONELIT, 0.3 * F)); g.addColorStop(1, mix(STONE, STONELIT, 0.85 * F));
      ctx.fillStyle = g; ctx.fill();
    } else {    // lit from behind: dark face, warm rim
      ctx.fillStyle = '#0D0E15'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,170,100,' + (0.6 * F).toFixed(3) + ')'; ctx.lineWidth = 1.3 * s;
      ctx.beginPath(); ctx.ellipse(x, y - h * 0.4, w / 2 - 0.6, h / 2 - 0.6, st.tilt, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    }
  }
}

function drawFireBed(F) {
  const s = L.fs, X = L.fireX, Y = L.fireY;
  ctx.lineCap = 'round';
  for (const [x1, y1, x2, y2, w0] of [[-16, -9, 24, -11, 10], [-52, 10, 30, -5, 12], [52, 9, -30, -6, 12]]) {
    const w = w0 * s, ax = X + x1 * s, ay = Y + y1 * s, bx = X + x2 * s, by = Y + y2 * s;
    ctx.strokeStyle = '#150C08'; ctx.lineWidth = w; seg(ax, ay, bx, by);
    ctx.strokeStyle = mix(WOOD, WOODLIT, 0.7 * F); ctx.lineWidth = w * 0.28; seg(ax, ay - w * 0.3, bx, by - w * 0.3);
    ctx.fillStyle = mix([40, 22, 12], [170, 92, 44], 0.6 * F); ctx.beginPath(); ctx.ellipse(ax, ay, w * 0.42, w * 0.5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(20,10,6,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(ax, ay, w * 0.22, w * 0.27, 0, 0, TAU); ctx.stroke();
  }
  ctx.lineCap = 'butt';
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(255,90,31,' + (0.55 * F).toFixed(3) + ')'; ctx.lineWidth = 3.5 * s; ctx.lineCap = 'round';
  seg(X - 22 * s, Y + 3 * s, X + 20 * s, Y - 3 * s); seg(X + 22 * s, Y + 2 * s, X - 20 * s, Y - 4 * s);
  ctx.lineCap = 'butt';
  ctx.save(); ctx.translate(X, Y - 2 * s); ctx.scale(1, 0.3);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 52 * s);
  g.addColorStop(0, 'rgba(255,220,150,' + (0.85 * F).toFixed(3) + ')'); g.addColorStop(0.35, 'rgba(255,110,40,' + (0.5 * F).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,90,31,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 52 * s, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

function drawFlames(F) {
  const s = L.fs;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.35 * F; ctx.drawImage(SPR.core, L.fireX - 34 * s, L.fireY - 54 * s, 68 * s, 68 * s);
  for (const p of flames) {
    const t = p.age / p.life, sz = p.size * Math.pow(1 - t, 0.65) + 1;
    let spr, a;
    if (t < 0.3 && p.heat > 0.45) { spr = SPR.core; a = 0.5; }
    else if (t < 0.64) { spr = SPR.flame; a = 0.42; }
    else { spr = SPR.red; a = 0.36; }
    ctx.globalAlpha = a * Math.min(1, t / 0.08) * (1 - t * 0.6) * (0.82 + 0.18 * F);
    ctx.drawImage(spr, p.x - sz, p.y - sz * 1.15, sz * 2, sz * 2.3);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

function drawEmbers() {
  ctx.globalCompositeOperation = 'lighter';
  for (const p of embers) {
    const t = p.age / p.life, a = (1 - t) * (RM ? 0.8 : 0.6 + 0.4 * Math.sin(T * 18 + p.seed));
    ctx.globalAlpha = a * 0.8; ctx.drawImage(SPR.ember, p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6);
    ctx.globalAlpha = a; ctx.fillStyle = t < 0.35 ? '#FFB36B' : '#FF5A1F'; ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
  }
  ctx.fillStyle = '#FFB36B';
  for (const p of dust) { ctx.globalAlpha = (1 - p.age / p.life) * 0.9; ctx.fillRect(p.x - 0.6, p.y - 0.6, 1.2, 1.2); }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

function drawSparks() {
  if (!sparks.length) return;
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const sp of sparks) {
    const tr = sp.trail, n = tr.length / 2;
    for (let i = 1; i < n; i++) {
      const q = i / n;
      ctx.strokeStyle = 'rgba(255,179,107,' + (q * 0.85).toFixed(3) + ')'; ctx.lineWidth = 0.4 + 2.6 * q;
      seg(tr[i * 2 - 2], tr[i * 2 - 1], tr[i * 2], tr[i * 2 + 1]);
    }
    if (!sp.done && n) {
      const x = tr[tr.length - 2], y = tr[tr.length - 1];
      ctx.globalAlpha = 1; ctx.drawImage(SPR.core, x - 11, y - 11, 22, 22);
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill();
    }
  }
  ctx.lineCap = 'butt'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

function draw() {
  if (!bg) return;
  const s = L.fs, F = RM ? 0.9 : fl, ox = -px, oy = -py;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.drawImage(bg, 0, 0, W, H);
  drawStars();
  drawConstellation();
  layer(paths.far, '#0C1024', ox * 6, oy * 2, 0.12 * F, W * 0.45 * (0.92 + 0.16 * F));
  ctx.fillStyle = mistGrad; ctx.fillRect(0, L.horizon - 70, W, 78);
  layer(paths.mid, '#080B18', ox * 14, oy * 4, 0.3 * F, 380 * s * (0.9 + 0.2 * F));
  drawGround(F);
  layer(paths.near, '#05070F', ox * 30, oy * 8, 0.34 * F, Math.max(W * 0.62, 460) * (0.92 + 0.16 * F));
  // warm air around the fire
  ctx.globalCompositeOperation = 'lighter';
  const ag = ctx.createRadialGradient(L.fireX, L.fireY - 60 * s, 0, L.fireX, L.fireY - 60 * s, 440 * s);
  ag.addColorStop(0, 'rgba(255,130,60,' + (0.08 * F).toFixed(3) + ')'); ag.addColorStop(1, 'rgba(255,130,60,0)');
  ctx.fillStyle = ag; ctx.fillRect(L.fireX - 440 * s, L.fireY - 500 * s, 880 * s, 880 * s);
  ctx.globalCompositeOperation = 'source-over';
  for (const p of smoke) { ctx.globalAlpha = Math.sin(Math.PI * p.age / p.life) * 0.16; ctx.drawImage(SPR.smoke, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2); }
  ctx.globalAlpha = 1;
  drawBench(F); drawStump(F); drawSquirrel(F);
  drawStones(true, F); drawFireBed(F); drawFlames(F); drawStones(false, F);
  drawEmbers(); drawSparks();
}

/* ---------- loop ---------- */
let raf = 0, last = 0, inView = true;
function tick(now) {
  raf = requestAnimationFrame(tick);
  if (!inView) { last = now; return; }
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  update(dt); draw();
}
function start() { if (!raf && !RM && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } }
function stop() { cancelAnimationFrame(raf); raf = 0; }
function presim() { flames.length = embers.length = smoke.length = dust.length = 0; for (let i = 0; i < 100; i++) update(1 / 60); }
function relayout() { layout(); presim(); draw(); if (activeIdx >= 0) show(activeIdx); }

document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (RM) draw(); else start(); });
if ('IntersectionObserver' in window) new IntersectionObserver(es => { inView = es[0].isIntersecting; }).observe(scene);
let rq = 0, lastSize = '';
const onResize = () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(() => { const k = scene.clientWidth + 'x' + scene.clientHeight + ':' + form.offsetHeight + ':' + intro.offsetHeight; if (k !== lastSize) { lastSize = k; relayout(); } }); };
if ('ResizeObserver' in window) { const ro = new ResizeObserver(onResize); ro.observe(scene); ro.observe(form); ro.observe(intro); } else window.addEventListener('resize', onResize);
mq.addEventListener && mq.addEventListener('change', e => { RM = e.matches; if (RM) { stop(); draw(); } else start(); });

window.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  hasMouse = true; lastMouse = T;
  tpx = clamp(e.clientX / window.innerWidth * 2 - 1, -1, 1); tpy = clamp(e.clientY / window.innerHeight * 2 - 1, -1, 1);
}, { passive: true });

/* ---------- note stars as buttons + the card ---------- */
function fmtDate(ts) {
  const d = new Date(ts);
  try { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return d.toDateString(); }
}
function buildStarButtons() {
  starLayer.textContent = '';
  notes.forEach((n, i) => {
    if (n.born === Infinity) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cf-star';
    b.style.left = n.x.toFixed(1) + 'px'; b.style.top = n.y.toFixed(1) + 'px';
    b.setAttribute('aria-label', 'Story from ' + n.name + ', ' + fmtDate(n.ts) + ': ' + n.msg);
    b.addEventListener('mouseenter', () => show(i));
    b.addEventListener('mouseleave', () => pinned >= 0 ? show(pinned) : hide());
    b.addEventListener('focus', () => show(i));
    b.addEventListener('blur', () => pinned >= 0 ? show(pinned) : hide());
    b.addEventListener('click', () => { if (pinned === i) { pinned = -1; hide(); } else { pinned = i; show(i); } });
    starLayer.appendChild(b);
  });
}
function show(i) {
  const n = notes[i]; if (!n || n.born === Infinity) return;
  activeIdx = i;
  cName.textContent = n.name; cDate.textContent = fmtDate(n.ts); cMsg.textContent = n.msg;
  cTag.textContent = n.mine ? 'yours, just now' : '';
  card.classList.toggle('cf-mine', n.mine);
  card.classList.add('cf-on');
  const cw = card.offsetWidth, ch = card.offsetHeight, m = 12;
  // try four spots around the star, pick the one that hides the fewest other stars
  const cands = [[n.x + 18, n.y - ch - 12], [n.x + 18, n.y + 16], [n.x - 18 - cw, n.y - ch - 12], [n.x - 18 - cw, n.y + 16]];
  let best = cands[0], bs = 1e9;
  cands.forEach(([x, y], k) => {
    let sc = k * 0.1;
    if (x < m || x + cw > W - m) sc += 20;
    if (y < 56 || y + ch > L.formTop - 8) sc += 20;
    notes.forEach((o, j) => { if (j !== i && o.born !== Infinity && o.x > x - 8 && o.x < x + cw + 8 && o.y > y - 8 && o.y < y + ch + 8) sc += 1; });
    const I = L.intro;
    if (x < I.x1 && x + cw > I.x0 && y < I.y1 && y + ch > I.y0) sc += 6;
    if (sc < bs) { bs = sc; best = [x, y]; }
  });
  const x = clamp(best[0], m, Math.max(m, W - cw - m)), y = clamp(best[1], 56, Math.max(56, L.formTop - ch - 8));
  card.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
  if (RM) draw();
}
function hide() { activeIdx = -1; card.classList.remove('cf-on'); if (RM) draw(); }
document.addEventListener('pointerdown', e => { if (pinned < 0 || e.target.closest('.cf-star, .cf-card')) return; pinned = -1; hide(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && activeIdx >= 0) { pinned = -1; hide(); } });

/* ---------- the written list under the fire ---------- */
let total = 0;
function isoDay(ts) { try { return new Date(ts).toISOString().slice(0, 10); } catch (e) { return ''; } }
function entryNode(e, fresh) {
  const row = document.createElement('li'); row.className = 'cf-entry' + (fresh ? ' cf-entry-new' : '');
  const meta = document.createElement('div'); meta.className = 'cf-entry-meta';
  const nm = document.createElement('span'); nm.className = 'cf-entry-name'; nm.textContent = e.name;
  const dt = document.createElement('time'); dt.className = 'cf-entry-date'; dt.textContent = isoDay(e.ts);
  try { dt.dateTime = new Date(e.ts).toISOString(); } catch (err) {}
  meta.append(nm, dt);
  const p = document.createElement('p'); p.className = 'cf-entry-msg'; p.textContent = e.message;
  row.append(meta, p);
  return row;
}
function listStatus(text) {
  list.textContent = '';
  const li = document.createElement('li'); li.className = 'cf-entries-status'; li.textContent = text;
  list.appendChild(li);
}
function renderList(entries) {
  if (!entries.length) return listStatus('the fire is quiet. no stories yet. sit, warm up, tell the first one.');
  list.textContent = '';
  entries.forEach(e => list.appendChild(entryNode(e, false)));
}
function setLegend(state) {
  const shown = notes.filter(n => n.born !== Infinity).length;
  if (state === 'loading') legend.textContent = 'stoking the fire...';
  else if (state === 'error') legend.textContent = 'the fire crackles but does not answer. the stars will be back, try again in a bit.';
  else if (!shown) legend.textContent = 'no stories up there yet. yours would be the first star.';
  else if (total > shown) legend.textContent = 'the newest ' + shown + ' stories shine up there. hover or tap one to read it. every story is written down below.';
  else legend.textContent = 'every story here is a star. hover or tap one to read it.';
}

/* ---------- signing ---------- */
const LINK = /https?:\/\/|www\./i;      // the same check the API runs
const MSG_LINK = 'no links by the fire. just words.';
const loadedAt = Date.now();            // the API wants a few seconds between page load and a story
let sending = false;
function clean(s) { return String(s || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim(); }
function codeLen(s) { return Array.from(s).length; }
function say(kind, text) { fStatus.textContent = text; fStatus.className = 'cf-status' + (kind ? ' cf-' + kind : ''); }
function mark(el, bad) { if (bad) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
function updCount() { const n = codeLen(fMsg.value); fCount.textContent = n + '/140'; fCount.classList.toggle('cf-warn', n > 120); }
function liveLinks() {
  const bn = LINK.test(fName.value), bm = LINK.test(fMsg.value);
  mark(fName, bn); mark(fMsg, bm);
  if (bn || bm) say('err', MSG_LINK); else if (fStatus.textContent === MSG_LINK) say('', '');
}
fName.addEventListener('input', liveLinks);
fMsg.addEventListener('input', () => { updCount(); liveLinks(); });
fMsg.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } });
form.addEventListener('submit', e => { e.preventDefault(); submit(); });
fMsg.addEventListener('focus', () => { if (coarse.matches) setTimeout(() => form.scrollIntoView({ block: 'end', behavior: RM ? 'auto' : 'smooth' }), 320); });

async function submit() {
  if (sending) return;
  const name = clean(fName.value), msg = clean(fMsg.value);
  mark(fName, false); mark(fMsg, false);
  if (!name) { mark(fName, true); fName.focus(); return say('err', 'add a name first. any name works.'); }
  if (!msg) { mark(fMsg, true); fMsg.focus(); return say('err', 'the story is empty. even a hi works.'); }
  if (codeLen(name) > 30) { mark(fName, true); return say('err', 'that name is a bit long. 30 characters at most.'); }
  if (codeLen(msg) > 140) { mark(fMsg, true); return say('err', 'that story is a bit long. 140 characters at most.'); }
  if (LINK.test(name) || LINK.test(msg)) { mark(LINK.test(msg) ? fMsg : fName, true); return say('err', MSG_LINK); }

  sending = true; sendBtn.disabled = true; say('', 'carrying it to the fire...');
  let res = null, data = {};
  try {
    res = await fetch(API + '/api/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, message: msg, website: fSite.value, t: Date.now() - loadedAt }),
    });
    data = await res.json().catch(() => ({}));
  } catch (err) { res = null; }
  sending = false; sendBtn.disabled = false;
  if (!res) return say('err', 'the fire crackles but does not answer. try again in a bit.');
  if (!res.ok || !data.entry) return say('err', data.error || 'something went wrong. try again in a bit.');

  const entry = data.entry;
  fMsg.value = ''; updCount();
  if (coarse.matches) fMsg.blur();
  total++;
  if (list.querySelector('.cf-entries-status')) list.textContent = '';
  list.insertBefore(entryNode(entry, true), list.firstChild);
  const n = addNote(entry, true);
  if (RM) { land(n); return; }
  say('ok', 'up it goes. watch the sky.');
  launch(n);
}
function launch(n) {
  const s = L.fs, S = { x: L.fireX + rand(-6, 6) * s, y: L.fireY - L.flameH * 0.7 }, side = n.x >= S.x ? 1 : -1;
  const C = { x: S.x + (n.x - S.x) * 0.1 - side * 30 * s, y: n.y + (S.y - n.y) * 0.3 };
  sparks.push({ S, C, n, age: 0, dur: clamp(Math.hypot(n.x - S.x, n.y - S.y) / 420, 1.3, 2.2), trail: [], done: false });
  for (let i = 0; i < 16; i++) spawnEmber(true);
  Snd.whoosh();
}
function land(n) {
  n.born = RM ? T - 10 : T;
  const idx = notes.indexOf(n);
  const e = edges.find(e => e.b === idx); if (e) e.at = n.born;
  buildStarButtons(); setLegend('ok');
  pinned = idx; show(idx);
  Snd.ting();
  say('ok', 'your story is a star now, the warm one. it is written down below too.');
  if (RM) draw();
}

/* ---------- sound: filtered noise crackle + a low hum, only after a click ---------- */
/* ---------- sound: filtered noise crackle + a low hum, only after a click ---------- */
const Snd = {
  ac: null, master: null, buf: null, on: false, tm: 0,
  init() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try {
      const ac = this.ac = new AC(), m = this.master = ac.createGain(); m.gain.value = 0; m.connect(ac.destination);
      const len = ac.sampleRate * 2, buf = this.buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const bl = ac.createBuffer(1, len, ac.sampleRate), bd = bl.getChannelData(0); let lastv = 0;
      for (let i = 0; i < len; i++) { lastv = (lastv + 0.02 * (Math.random() * 2 - 1)) / 1.02; bd[i] = lastv * 3.5; }
      const roar = ac.createBufferSource(); roar.buffer = bl; roar.loop = true;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
      const rg = ac.createGain(); rg.gain.value = 0.35; roar.connect(lp); lp.connect(rg); rg.connect(m); roar.start();
      const o1 = ac.createOscillator(), o2 = ac.createOscillator(), g1 = ac.createGain(), g2 = ac.createGain();
      o1.type = 'sine'; o1.frequency.value = 55; o2.type = 'triangle'; o2.frequency.value = 82.4;
      g1.gain.value = 0.05; g2.gain.value = 0.014; o1.connect(g1); g1.connect(m); o2.connect(g2); g2.connect(m);
      const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.13; lg.gain.value = 0.02; lfo.connect(lg); lg.connect(g1.gain);
      o1.start(); o2.start(); lfo.start();
      return true;
    } catch (e) { this.ac = null; return false; }
  },
  pop(strength) {
    const ac = this.ac; if (!ac || !this.on) return;
    const t = ac.currentTime, src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = this.buf; bp.type = 'bandpass'; bp.frequency.value = rand(900, 5200); bp.Q.value = rand(0.7, 3.5);
    const dur = rand(0.006, 0.05), peak = rand(0.15, 0.7) * (strength || 1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(this.master); src.start(t, Math.random() * 1.9, dur + 0.03);
  },
  loop() {
    if (!this.on) return;
    if (!document.hidden) {
      this.pop(1);
      if (Math.random() < 0.18) { const k = 2 + (Math.random() * 4 | 0); for (let i = 0; i < k; i++) setTimeout(() => this.pop(0.5), rand(10, 120)); }
    }
    this.tm = setTimeout(() => this.loop(), rand(50, 420));
  },
  toggle() {
    if (!this.ac && !this.init()) return false;
    this.on = !this.on;
    const t = this.ac.currentTime, gn = this.master.gain;
    gn.cancelScheduledValues(t); gn.setValueAtTime(gn.value, t);
    if (this.on) { this.ac.resume(); gn.linearRampToValueAtTime(0.8, t + 0.8); this.loop(); }
    else { gn.linearRampToValueAtTime(0, t + 0.3); clearTimeout(this.tm); setTimeout(() => { if (!this.on && this.ac) this.ac.suspend(); }, 400); }
    return this.on;
  },
  whoosh() {
    if (!this.on) return;
    const ac = this.ac, t = ac.currentTime, src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = this.buf; bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 0.9);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    src.connect(bp); bp.connect(g); g.connect(this.master); src.start(t, 0, 1.3);
    for (let i = 0; i < 6; i++) setTimeout(() => this.pop(0.9), i * 40 + rand(0, 30));
  },
  ting() {
    if (!this.on) return;
    const ac = this.ac, t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = 1318.5;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 1.5);
  }
};
const soundBtn = $('cf-sound'), soundLbl = $('cf-sound-label');
soundBtn.addEventListener('click', () => {
  const on = Snd.toggle();
  soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  soundLbl.textContent = on ? 'sound on' : (Snd.ac ? 'sound off' : 'no sound here');
});

/* ---------- boot ---------- */
setLegend('loading');
layout(); presim(); draw();
updCount();
start();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { lastSize = ''; onResize(); });

fetch(API + '/api/entries')
  .then(r => { if (!r.ok) throw new Error('api ' + r.status); return r.json(); })
  .then(data => {
    const entries = (Array.isArray(data && data.entries) ? data.entries : [])
      .filter(e => e && e.id && typeof e.name === 'string' && typeof e.message === 'string' && Number.isFinite(e.ts));
    total = entries.length;
    setSky(entries);
    renderList(entries);
    buildStarButtons();
    setLegend('ok');
    lastSize = ''; onResize();                          // the legend may have changed the intro's height
    if (notes.length && !L.mobile) { pinned = notes.length - 1; show(pinned); }   // the newest story, open at rest (phones keep the sky clear)
    if (RM) draw();
  })
  .catch(() => {
    setLegend('error');
    listStatus('the fire crackles but does not answer. try again in a bit.');
  });
})();
