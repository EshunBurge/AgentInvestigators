(() => {
'use strict';
const $ = s => document.querySelector(s);
const CASE = window.CASE, CASE_ID = CASE.id, ST = CASE.stations, NREG = ST.filter(s => !s.final).length;
const SAVE = CASE_ID ? 'agent-investigator-case-' + CASE_ID : 'agent-investigator-case1';
const params = new URLSearchParams(location.search);

/* ---------- save ---------- */
let save = { done:{}, ft:{}, seen:false };
try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE) || '{}')); } catch (e) {}
const persist = () => { try { localStorage.setItem(SAVE, JSON.stringify(save)); } catch (e) {} };
const doneCount = () => ST.filter(s => !s.final && save.done[s.id]).length;
const allRegDone = () => doneCount() === NREG;
const stationState = s => save.done[s.id] ? 'done' : (s.final && !allRegDone() ? 'locked' : 'open');
const objective = () => ST.find(s => !s.final && !save.done[s.id]) || (save.done.hq ? null : ST.find(s => s.final));
const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2800); };

/* ---------- modal flow (shared by 3D and text mode) ---------- */
let modalOpen = false, onModalClose = null;
function openStation(s) {
  if (stationState(s) === 'locked') {
    showPanel(`<p class="eyebrow">Locked</p><h2>${s.name}</h2><p>You need all ${NREG} pieces of evidence before you can solve the case. You have ${doneCount()} so far.</p><button class="act primary" id="m-close">Back to the city</button>`);
    $('#m-close').onclick = closeModal; return;
  }
  const np = s.puzzles.length, state = { qi:0, tried:false };
  const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const bar = (cur, all) => `<div class="steps" aria-hidden="true">${Array.from({ length:np + 2 }, (_, i) => `<i class="${all || i < cur ? 'done' : i === cur ? 'on' : ''}"></i>`).join('')}</div>`;
  const ftKey = () => s.id + ':' + state.qi;
  function brief() {
    showPanel(`${bar(0)}<p class="eyebrow">${esc(s.topic)} · Briefing</p><h2 id="m-title">${esc(s.name)}</h2>${s.brief.map(p => `<p class="story">${esc(p)}</p>`).join('')}<div class="row"><button class="act primary big" id="go">Show me the puzzle →</button><button class="act" id="m-close">Not now</button></div>`);
    $('#go').onclick = () => { state.qi = 0; state.tried = false; puzzle(); }; $('#m-close').onclick = closeModal;
  }
  function solved(p) {
    if (!state.tried) { save.ft = save.ft || {}; save.ft[ftKey()] = true; }
    const last = state.qi + 1 >= np;
    $('#fb').innerHTML = `<div class="fb good"><b>Correct.</b>${esc(p.why)}</div><button class="act primary big" id="next">${last ? 'Collect the evidence →' : 'Next puzzle →'}</button>`;
    $('#next').focus(); const chk = $('#check'); if (chk) chk.hidden = true;
    $('#next').onclick = () => { if (!last) { state.qi++; state.tried = false; puzzle(); } else evidence(); };
  }
  function wrong(msg) { state.tried = true; $('#fb').innerHTML = `<div class="fb bad"><b>Not quite.</b>${esc(msg)}</div>`; }
  function puzzle() {
    const p = s.puzzles[state.qi], type = p.type || 'mc';
    const head = `${bar(state.qi + 1)}<p class="eyebrow">Puzzle ${state.qi + 1} of ${np} · ${esc(s.topic)}</p><h2 id="m-title" style="font-size:24px">${esc(p.q)}</h2>`;
    const foot = `<div id="fb"></div><div class="row"><button class="act" id="back">← Re-read briefing</button></div>`;
    if (type === 'mc') {
      if (!p._sh) { p._sh = 1; const ans = p.options[p.answer], o = p.options.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } p.options = o; p.answer = o.indexOf(ans); }
      const wrongSet = new Set();
      showPanel(`${head}<div class="opts">${p.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`).join('')}</div>${foot}`);
      document.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        if (i === p.answer) { document.querySelectorAll('.opt').forEach((x, j) => { x.disabled = true; if (j === i) x.classList.add('good'); }); solved(p); }
        else { b.classList.add('bad'); b.disabled = true; wrong('Think about what you could actually check or verify, then try another answer.'); }
      });
    } else if (type === 'multi') {
      showPanel(`${head}<p class="hintline">Select every answer that applies, then check.</p><div class="opts">${p.options.map((o, i) => `<button class="opt tog" data-i="${i}" aria-pressed="false"><span class="k"></span><span>${esc(o)}</span></button>`).join('')}</div><button class="act primary" id="check">Check my answers</button>${foot}`);
      document.querySelectorAll('.opt').forEach(b => b.onclick = () => { const on = b.classList.toggle('sel'); b.setAttribute('aria-pressed', on); b.classList.remove('bad'); });
      $('#check').onclick = () => {
        const sel = [...document.querySelectorAll('.opt.sel')].map(b => +b.dataset.i), want = p.answers;
        const hit = sel.filter(i => want.includes(i)).length, extra = sel.length - hit;
        if (hit === want.length && extra === 0) { document.querySelectorAll('.opt').forEach((b, i) => { b.disabled = true; b.classList.toggle('good', want.includes(i)); }); solved(p); }
        else { document.querySelectorAll('.opt.sel').forEach(b => { if (!want.includes(+b.dataset.i)) b.classList.add('bad'); });
          wrong(`You have ${hit} of ${want.length} correct answers${extra ? ` and ${extra} that shouldn't be selected (marked red)` : ''}. Adjust and check again.`); }
      };
    } else {
      const assign = p.items.map(() => null);
      showPanel(`${head}<p class="hintline">Tap a bucket for each item, then check.</p><div class="sortlist">${p.items.map((it, i) => `<div class="sitem" data-i="${i}"><span class="st">${esc(it.t)}</span><span class="sb">${p.buckets.map((b, j) => `<button class="bk" data-j="${j}">${esc(b)}</button>`).join('')}</span></div>`).join('')}</div><button class="act primary" id="check" disabled>Check my sorting</button>${foot}`);
      document.querySelectorAll('.sitem').forEach(row => row.querySelectorAll('.bk').forEach(btn => btn.onclick = () => {
        const i = +row.dataset.i, j = +btn.dataset.j; assign[i] = j; row.classList.remove('bad');
        row.querySelectorAll('.bk').forEach(x => x.classList.toggle('on', +x.dataset.j === j));
        $('#check').disabled = assign.some(v => v === null);
      }));
      $('#check').onclick = () => {
        let bad = 0; document.querySelectorAll('.sitem').forEach((row, i) => { const ok = assign[i] === p.items[i].b; row.classList.toggle('bad', !ok); if (!ok) bad++; });
        if (!bad) { document.querySelectorAll('.bk').forEach(x => x.disabled = true); document.querySelectorAll('.sitem').forEach(r => r.classList.add('good')); solved(p); }
        else wrong(`${p.items.length - bad} of ${p.items.length} correct. The red items are in the wrong bucket, so move them and check again.`);
      };
    }
    $('#back').onclick = brief;
  }
  function evidence() {
    const first = !save.done[s.id];
    save.done[s.id] = true; persist();
    refreshAll();
    const ev = s.evidence, left = NREG - doneCount();
    const nextMsg = s.final ? '' : (left > 0 ? `<p>${left} more to find. Head for the next red beam.</p>` : `<p><b>All evidence collected.</b> Go back to HQ at the center of the city to solve the case.</p>`);
    showPanel(`${bar(np + 1, true)}<div class="stamp">${s.final ? 'CASE SOLVED' : 'EVIDENCE COLLECTED'}</div><div class="evcard"><h3>${esc(ev.title)}</h3><p>${esc(ev.text)}</p></div>${nextMsg}<button class="act primary big" id="fin">${s.final ? 'See my results →' : 'Back to the city'}</button>`);
    $('#fin').onclick = () => { closeModal(); if (s.final) showWin(); else if (first && allRegDone()) toast('All evidence found. Walk to HQ in the center of the city!'); };
    $('#fin').focus();
  }
  if (save.done[s.id] && !s.final) {
    const ev = s.evidence;
    showPanel(`<p class="eyebrow">${esc(s.topic)} · Done</p><h2 id="m-title">${esc(s.name)}</h2><div class="evcard"><h3>${esc(ev.title)}</h3><p>${esc(ev.text)}</p></div><div class="row"><button class="act" id="re">Replay the briefing</button><button class="act primary" id="m-close">Back to the city</button></div>`);
    $('#m-close').onclick = closeModal; $('#re').onclick = brief; return;
  }
  brief();
}
function showPanel(html) { const m = $('#modal'); $('#mpanel').innerHTML = html; m.hidden = false; modalOpen = true; const f = $('#mpanel button'); if (f) f.focus({ preventScroll:true }); $('#mpanel').scrollTop = 0; }
function closeModal() { $('#modal').hidden = true; modalOpen = false; if (onModalClose) onModalClose(); }
document.addEventListener('keydown', e => {
  if (!modalOpen) return;
  if (e.key === 'Escape') { closeModal(); return; }
  if (/^[1-9]$/.test(e.key)) { const b = document.querySelector(`.opt[data-i="${+e.key - 1}"]`); if (b && !b.disabled) b.click(); }
  if (e.key === 'Enter' && document.activeElement && document.activeElement.tagName !== 'BUTTON') { const c = $('#check:not([disabled])') || $('#next'); if (c && !c.hidden) c.click(); }
});
$('#modal').addEventListener('pointerdown', e => { if (e.target.id === 'modal') closeModal(); });

function showWin() {
  const total = ST.reduce((a, x) => a + x.puzzles.length, 0), n = Object.keys(save.ft || {}).length, frac = n / total;
  let rank = CASE.ranks[0][1]; CASE.ranks.forEach(r => { if (frac >= r[0]) rank = r[1]; });
  $('#win-text').textContent = ST.at(-1).evidence.text;
  $('#rank').textContent = rank; $('#rank-sub').textContent = `${n} of ${total} puzzles solved on the first try`;
  $('#evlist').innerHTML = ST.filter(s => !s.final).map(s => `<div>${s.evidence.title.replace(/^Evidence #\d+ — /, '')}</div>`).join('');
  if (window.AI && CASE.key) { const r = AI.caseWin(CASE.key); $('#rank-sub').textContent += r ? ` · +${r} coins` : ''; }
  $('#win').hidden = false;
}
function restart() { save = { done:{}, ft:{}, seen:true }; persist(); location.href = location.pathname + location.search; }
$('#win-again').onclick = restart;

/* ---------- text mode ---------- */
function textMode() {
  document.body.classList.add('text-mode');
  $('#view').style.display = 'none'; $('#hud').hidden = true; $('#board').hidden = false;
  $('#board-intro').textContent = CASE.intro;
  $('#to3d').href = 'play.html';
  $('#board-restart').onclick = () => { if (confirm('Restart the case and erase your progress?')) restart(); };
  onModalClose = drawBoard;
  function drawBoard() {
    const obj = objective();
    $('#board-prog').innerHTML = `<div class="lbl">Evidence</div><b style="font-size:20px">${doneCount()} / ${NREG}</b><span style="color:var(--mute)">${obj ? 'Next: ' + obj.name : 'Case solved'}</span>`;
    $('#board-list').innerHTML = ST.map((s, i) => { const st = stationState(s); return `<div class="bs ${st}"><div class="n">${st === 'done' ? '✓' : st === 'locked' ? '🔒' : (s.final ? '★' : i + 1)}</div><div class="t"><b>${s.name}</b><span>${s.topic}${st === 'locked' ? ' · collect all evidence first' : ''}</span></div><button class="act ${obj === s ? 'primary' : ''}" data-i="${i}">${st === 'done' ? 'Review' : 'Open'}</button></div>`; }).join('');
    document.querySelectorAll('#board-list button').forEach(b => b.onclick = () => openStation(ST[+b.dataset.i]));
    if (save.done.hq && $('#win').hidden && !textMode.shown) { textMode.shown = true; }
  }
  window.refreshAll = drawBoard; drawBoard();
  const origShowWin = showWin;
}

const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } })();
if (params.get('mode') === 'text' || !hasGL || typeof THREE === 'undefined') { window.refreshAll = () => {}; textMode(); if (!hasGL && params.get('mode') !== 'text') {} return; }

/* ================= 3D CITY ================= */
const STREETS = [-88, -44, 0, 44, 88], HALF_ST = 7, BLOCK_C = [-66, -22, 22, 66], BOUND = 93, HALF_B = 15;
const PARKS = [[-22, -22], [22, 22]];
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const R = rng(20261119);

const canvas = $('#view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
const scene = new THREE.Scene();
const SKY = new THREE.Color('#2b2040');
scene.background = SKY; scene.fog = new THREE.Fog(SKY, 80, 250);
scene.add(new THREE.Mesh(new THREE.SphereGeometry(520, 24, 16), new THREE.ShaderMaterial({ side:THREE.BackSide, depthWrite:false, fog:false, uniforms:{}, vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}', fragmentShader:'varying vec3 p;void main(){float h=clamp(normalize(p).y,0.,1.);vec3 hor=vec3(.169,.125,.251),top=vec3(.027,.027,.098);gl_FragColor=vec4(mix(hor,top,pow(h,.55)),1.);}' })));
const camera = new THREE.PerspectiveCamera(55, 1, .3, 600);
scene.add(new THREE.HemisphereLight(0xaab4e8, 0x40283a, 1.15));
const moon = new THREE.DirectionalLight(0xdde4ff, .85); moon.position.set(-60, 90, 40); scene.add(moon);

const mk = (g, m, x = 0, y = 0, z = 0, parent = scene) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); parent.add(o); return o; };
const lam = (c, extra) => new THREE.MeshLambertMaterial(Object.assign({ color:c }, extra));
const basic = (c, extra) => new THREE.MeshBasicMaterial(Object.assign({ color:c }, extra));

/* roads: one canvas texture */
(function roads() {
  const S = 2048, W = 240, k = S / W, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); g.fillStyle = '#17171d'; g.fillRect(0, 0, S, S);
  const p = v => (v + W / 2) * k;
  g.fillStyle = '#26262e';
  STREETS.forEach(v => { g.fillRect(p(v - HALF_ST), 0, 2 * HALF_ST * k, S); g.fillRect(0, p(v - HALF_ST), S, 2 * HALF_ST * k); });
  g.fillStyle = '#e6c75a';
  STREETS.forEach(v => { for (let t = -W / 2; t < W / 2; t += 6) { g.fillRect(p(v) - .3 * k, p(t), .6 * k, 3 * k); g.fillRect(p(t), p(v) - .3 * k, 3 * k, .6 * k); } });
  g.fillStyle = '#d8d8e0';
  STREETS.forEach(a => STREETS.forEach(b => {
    for (let i = -5; i <= 5; i++) { const o = i * 1.25; g.fillRect(p(a + o) - .35 * k, p(b - HALF_ST - 3.4), .7 * k, 2.4 * k); g.fillRect(p(a + o) - .35 * k, p(b + HALF_ST + 1), .7 * k, 2.4 * k); g.fillRect(p(a - HALF_ST - 3.4), p(b + o) - .35 * k, 2.4 * k, .7 * k); g.fillRect(p(a + HALF_ST + 1), p(b + o) - .35 * k, 2.4 * k, .7 * k); }
  }));
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4;
  const m = mk(new THREE.PlaneGeometry(W, W), new THREE.MeshLambertMaterial({ map:t }), 0, 0, 0); m.rotation.x = -Math.PI / 2;
  const far = mk(new THREE.PlaneGeometry(900, 900), lam('#101015'), 0, -.05, 0); far.rotation.x = -Math.PI / 2;
})();

/* facade textures */
function facade(tint) {
  const c = document.createElement('canvas'), e = document.createElement('canvas'); c.width = c.height = e.width = e.height = 256;
  const g = c.getContext('2d'), h = e.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); h.fillStyle = '#000'; h.fillRect(0, 0, 256, 256);
  const r = rng(tint * 977 + 5);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const X = x * 64 + 12, Y = y * 64 + 12;
    g.fillStyle = '#2b2d3a'; g.fillRect(X, Y, 40, 36);
    if (r() < .38) { h.fillStyle = r() < .2 ? '#ff5470' : (r() < .5 ? '#ffe9a8' : '#c8d6ff'); h.fillRect(X, Y, 40, 36); }
  }
  const a = new THREE.CanvasTexture(c), b = new THREE.CanvasTexture(e);
  [a, b].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; });
  return { a, b };
}
const TINTS = ['#6d6a82', '#84636f', '#5c6b86', '#76707a', '#68586f', '#7b5a60'];
const wallMats = TINTS.map((c, i) => { const f = facade(i); return new THREE.MeshLambertMaterial({ color:c, map:f.a, emissive:0xffffff, emissiveMap:f.b }); });
const roofMat = lam('#2e2e38');
const colliders = []; // AABBs {x0,x1,z0,z1,b}
const bldgs = [];
function building(cx, cz, w, d, h, tintIdx, bx, bz) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const faces = [[0, d], [1, d], [4, w], [5, w]];
  faces.forEach(([f, fw]) => { for (let i = f * 4; i < f * 4 + 4; i++) uv.setXY(i, uv.getX(i) * fw / 24, uv.getY(i) * h / 24); });
  const mat = wallMats[tintIdx % wallMats.length];
  const m = new THREE.Mesh(g, [mat, mat, roofMat, roofMat, mat, mat]); m.position.set(cx, h / 2 + .3, cz); scene.add(m);
  if (h > 24 && R() < .6) { mk(new THREE.CylinderGeometry(.18, .18, 5, 6), basic('#ff3355'), cx + w * .2, h + 2.8, cz, scene); }
  colliders.push({ x0:cx - w / 2 - .9, x1:cx + w / 2 + .9, z0:cz - d / 2 - .9, z1:cz + d / 2 + .9, b:true });
  bldgs.push({ cx, cz, w, d, h, bx, bz });
  if (h > 18 && R() < .5) { const tk = mk(new THREE.CylinderGeometry(1.6, 1.6, 2.6, 10), lam('#4b4350'), cx - w * .2, h + 1.6, cz + d * .15); mk(new THREE.ConeGeometry(1.8, 1, 10), lam('#2c2833'), cx - w * .2, h + 3.4, cz + d * .15); }
}
const treeSpots = [];
const slabMat = lam('#3b3b46'), parkMat = lam('#25402f');
function city() {
  const all = [];
  BLOCK_C.forEach(bx => BLOCK_C.forEach(bz => all.push([bx, bz])));
  // backdrop ring beyond the playable area
  [-132, 132].forEach(a => BLOCK_C.concat([-110, 110, -154, 154]).forEach(b => { all.push([a, b]); all.push([b, a]); }));
  [-110, 110].forEach(a => [-66, -22, 22, 66].forEach(b => { all.push([a, b]); all.push([b, a]); }));
  all.forEach(([bx, bz]) => {
    const playable = Math.abs(bx) < 90 && Math.abs(bz) < 90;
    const park = PARKS.some(p => p[0] === bx && p[1] === bz);
    mk(new THREE.BoxGeometry(30, .3, 30), park ? parkMat : slabMat, bx, .15, bz);
    if (park) {
      for (let i = 0; i < 9; i++) { const tx = bx + (R() - .5) * 24, tz = bz + (R() - .5) * 24; if (Math.hypot(tx - bx, tz - bz) < 4) continue; tree(tx, tz); }
      mk(new THREE.CylinderGeometry(3.2, 3.4, .5, 24), lam('#4a4a56'), bx, .45, bz); mk(new THREE.CylinderGeometry(.5, .5, 3, 12), lam('#8a8a98'), bx, 1.9, bz);
      return;
    }
    const mode = R();
    if (mode < .25) building(bx, bz, 26, 26, 22 + R() * 30, (R() * 6) | 0, bx, bz);
    else for (const dx of [-7.2, 7.2]) for (const dz of [-7.2, 7.2]) building(bx + dx, bz + dz, 13.4, 13.4, 10 + R() * 34, (R() * 6) | 0, bx, bz);
    if (!playable) {}
  });
}
function tree(x, z) {
  mk(new THREE.CylinderGeometry(.25, .35, 2.2, 6), lam('#4a3426'), x, 1.4, z);
  mk(new THREE.ConeGeometry(1.8, 4.4, 8), lam('#2f5a3e'), x, 4, z);
  colliders.push({ x0:x - .9, x1:x + .9, z0:z - .9, z1:z + .9 });
}
city();

/* neon shop signs on street-facing walls */
(function neon() {
  const names = ['NOODLES', 'CAFE 24', 'PRESS', 'ARCADE', 'PHARMACY', 'RADIO', 'BOOKS', 'TAXI', 'DINER', 'LAUNDRY', 'PIZZA', 'REPAIR'], cols = ['#ff5470', '#4de1ff', '#ffc857', '#9b7bff', '#3ddc97'];
  const r = rng(99); let n = 0;
  bldgs.filter(b => Math.abs(b.bx) < 90 && Math.abs(b.bz) < 90).forEach(b => {
    if (r() > .55) return;
    const faces = [];
    if (b.cx + b.w / 2 >= b.bx + 14) faces.push(['px', b.cx + b.w / 2 + .05, b.cz, Math.PI / 2]);
    if (b.cx - b.w / 2 <= b.bx - 14) faces.push(['nx', b.cx - b.w / 2 - .05, b.cz, -Math.PI / 2]);
    if (b.cz + b.d / 2 >= b.bz + 14) faces.push(['pz', b.cx, b.cz + b.d / 2 + .05, 0]);
    if (b.cz - b.d / 2 <= b.bz - 14) faces.push(['nz', b.cx, b.cz - b.d / 2 - .05, Math.PI]);
    if (!faces.length) return;
    const f = faces[(r() * faces.length) | 0], txt = names[n++ % names.length], col = cols[(r() * cols.length) | 0];
    const c = document.createElement('canvas'); c.width = 512; c.height = 160; const g = c.getContext('2d');
    g.fillStyle = '#0b0b10'; g.fillRect(0, 0, 512, 160); g.strokeStyle = col; g.lineWidth = 8; g.shadowColor = col; g.shadowBlur = 24; g.strokeRect(14, 14, 484, 132);
    g.fillStyle = col; g.font = '700 74px Anton, Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 256, 84);
    const m = mk(new THREE.PlaneGeometry(8.5, 2.65), new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(c) }), f[1], 4.2 + r() * 2.5, f[2]); m.rotation.y = f[3];
    if (f[0][1] === 'x') m.position.z += (r() - .5) * 3; else m.position.x += (r() - .5) * 3;
  });
})();

/* street lamps */
(function lamps() {
  const poleG = new THREE.CylinderGeometry(.1, .14, 6.4, 6), headG = new THREE.SphereGeometry(.42, 8, 6);
  const pole = lam('#4b4b58'), head = basic('#ffe9b0');
  const gc = document.createElement('canvas'); gc.width = gc.height = 64; const gg = gc.getContext('2d'), gr = gg.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,230,160,.9)'); gr.addColorStop(.35, 'rgba(255,200,110,.28)'); gr.addColorStop(1, 'rgba(255,200,110,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, 64, 64);
  const glowMat = new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(gc), blending:THREE.AdditiveBlending, depthWrite:false, transparent:true });
  STREETS.forEach(sx => STREETS.forEach(sz => {
    [[1, 1], [-1, -1], [1, -1], [-1, 1]].forEach(([a, b]) => {
      const x = sx + a * (HALF_ST + 1.2), z = sz + b * (HALF_ST + 1.2);
      if (Math.abs(x) > 98 || Math.abs(z) > 98) return;
      mk(poleG, pole, x, 3.2, z); mk(headG, head, x, 6.6, z);
      const gl = new THREE.Sprite(glowMat); gl.position.set(x, 6.6, z); gl.scale.set(5, 5, 1); scene.add(gl);
    });
  }));
})();

/* stars + moon */
(function sky() {
  const n = 500, a = new Float32Array(n * 3), r = rng(7);
  for (let i = 0; i < n; i++) { const th = r() * Math.PI * 2, ph = Math.acos(.15 + r() * .85); a[i * 3] = 380 * Math.sin(ph) * Math.cos(th); a[i * 3 + 1] = 380 * Math.cos(ph); a[i * 3 + 2] = 380 * Math.sin(ph) * Math.sin(th); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color:0xffffff, size:1.6, sizeAttenuation:false, fog:false })));
  mk(new THREE.SphereGeometry(14, 24, 16), basic('#f3f1ff', { fog:false }), -190, 200, -260);
})();

/* stations */
const beacons = {};
function labelSprite(text) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = 'rgba(10,10,14,.9)'; g.beginPath(); g.roundRect ? g.roundRect(4, 20, 504, 88, 44) : g.rect(4, 20, 504, 88); g.fill();
  g.lineWidth = 4; g.strokeStyle = '#ff5470'; g.stroke();
  g.fillStyle = '#fff'; g.font = '700 44px Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:t, depthTest:false, transparent:true, fog:false }));
  sp.scale.set(11, 2.75, 1); sp.renderOrder = 10; return sp;
}
ST.forEach((s, i) => {
  const grp = new THREE.Group(); grp.position.set(s.x, 0, s.z); scene.add(grp);
  const col = new THREE.Color('#ff2d55');
  const beamMat = new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:.35, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide, fog:false });
  const beam = mk(new THREE.CylinderGeometry(2.4, 2.4, 1, 24, 1, true), beamMat, 0, 0, 0, grp);
  const ringMat = new THREE.MeshBasicMaterial({ color:col }); const ring = mk(new THREE.TorusGeometry(4, .22, 8, 40), ringMat, 0, .5, 0, grp); ring.rotation.x = Math.PI / 2;
  const disc = mk(new THREE.CircleGeometry(4, 32), new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:.18, depthWrite:false }), 0, .42, 0, grp); disc.rotation.x = -Math.PI / 2;
  const kiosk = mk(new THREE.BoxGeometry(1.8, 2.6, 1.2), lam('#20202a'), 0, 1.6, 0, grp);
  const scr = mk(new THREE.PlaneGeometry(1.3, 1.1), basic('#ff5470'), 0, 2, .62, grp);
  const lab = labelSprite(s.final ? '★  HQ · Case Board' : `${i + 1} · ${s.name.replace(/^The /, '')}`); lab.position.set(0, 9, 0); grp.add(lab);
  const holo = mk(new THREE.OctahedronGeometry(.9, 0), new THREE.MeshBasicMaterial({ color:col, wireframe:true }), 0, 4.4, 0, grp);
  beacons[s.id] = { grp, beam, beamMat, ringMat, ring, disc, scr, lab, s, holo };
  colliders.push({ x0:s.x - 1.8, x1:s.x + 1.8, z0:s.z - 1.5, z1:s.z + 1.5 });
});
function styleBeacons(t) {
  const obj = objective();
  ST.forEach(s => {
    const b = beacons[s.id], st = stationState(s), active = obj === s;
    const col = st === 'done' ? 0x3ddc97 : st === 'locked' ? 0x777788 : 0xff2d55;
    b.beamMat.color.setHex(col); b.ringMat.color.setHex(col); b.disc.material.color.setHex(col); b.scr.material.color.setHex(col);
    const h = st === 'done' ? 7 : active ? 90 : st === 'locked' ? 6 : 26;
    b.beam.scale.set(1, h, 1); b.beam.position.y = h / 2;
    b.beamMat.opacity = active ? .34 + .12 * Math.sin(t * 4) : st === 'done' ? .2 : .2;
    b.ring.scale.setScalar(active ? 1 + .06 * Math.sin(t * 4) : 1);
    const dc = camera.position.distanceTo(b.grp.position), pd = Math.hypot(s.x - P.x, s.z - P.z); const k = Math.max(.32, Math.min(1.15, dc / 42)); b.lab.scale.set(11 * k, 2.75 * k, 1); b.lab.position.y = 7 + 2 * k;
    b.lab.visible = pd > 7; b.lab.material.opacity = active ? 1 : .8;
    b.holo.material.color.setHex(col); b.holo.rotation.y = t * 1.6; b.holo.rotation.x = t * .7; b.holo.position.y = 4.4 + Math.sin(t * 2 + b.s.x) * .25; b.holo.scale.setScalar(s.final ? 1.5 : 1);
  });
}

/* ---------- traffic ---------- */
const cars = [];
(function traffic() {
  const colsC = ['#c0c4d8', '#ff5470', '#ffc857', '#4de1ff', '#9aa0b8', '#7b5cff'], r = rng(5);
  const bodyG = new THREE.BoxGeometry(2, .85, 4.2), cabG = new THREE.BoxGeometry(1.7, .7, 2.1), lightG = new THREE.BoxGeometry(.5, .25, .08);
  const head = basic('#fff2b8'), tail = basic('#ff2d55');
  [-44, 0, 44].forEach(line => [0, 1].forEach(axis => [-1, 1].forEach(dir => {
    const car = new THREE.Group(), body = mk(bodyG, lam(colsC[(r() * colsC.length) | 0]), 0, .75, 0, car); mk(cabG, lam('#1d1d26'), 0, 1.42, -.2, car);
    [-.6, .6].forEach(x => { mk(lightG, head, x, .8, 2.12, car); mk(lightG, tail, x, .8, -2.12, car); });
    car.rotation.y = axis === 0 ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (dir > 0 ? 0 : Math.PI);
    scene.add(car);
    cars.push({ car, axis, line: line + dir * -3.2 * (axis ? 1 : -1), dir, pos:(r() - .5) * 200, base:7 + r() * 5, v:0 });
  })));
})();
function updateCars(dt) {
  cars.forEach(c => {
    const along = c.axis === 0 ? P.x : P.z, cross = c.axis === 0 ? P.z : P.x;
    const ahead = (along - c.pos) * c.dir, lat = Math.abs(cross - c.line);
    const target = (ahead > 0 && ahead < 11 && lat < 3.2) ? 0 : c.base;
    c.v += (target - c.v) * Math.min(1, dt * 3);
    c.pos += c.dir * c.v * dt; if (c.pos > 105) c.pos = -105; if (c.pos < -105) c.pos = 105;
    if (c.axis === 0) c.car.position.set(c.pos, 0, c.line); else c.car.position.set(c.line, 0, c.pos);
  });
}

/* ---------- navigation grid ---------- */
const CELL = 2, N = Math.ceil(BOUND * 2 / CELL), OFF = BOUND;
const blockedAt = (x, z) => { if (Math.abs(x) > BOUND || Math.abs(z) > BOUND) return true; for (const c of colliders) if (x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1) return true; return false; };
const grid = new Uint8Array(N * N);
for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) grid[j * N + i] = blockedAt(i * CELL - OFF + CELL / 2, j * CELL - OFF + CELL / 2) ? 1 : 0;
const toCell = (x, z) => [Math.max(0, Math.min(N - 1, Math.floor((x + OFF) / CELL))), Math.max(0, Math.min(N - 1, Math.floor((z + OFF) / CELL)))];
const cellCenter = (i, j) => [i * CELL - OFF + CELL / 2, j * CELL - OFF + CELL / 2];
function nearestFree(i, j) {
  if (!grid[j * N + i]) return [i, j];
  for (let r = 1; r < 30; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < N && b < N && !grid[b * N + a]) return [a, b]; }
  return [i, j];
}
function findPath(fx, fz, tx, tz) {
  let [si, sj] = nearestFree(...toCell(fx, fz)), [ti, tj] = nearestFree(...toCell(tx, tz));
  const prev = new Int32Array(N * N).fill(-1), q = [sj * N + si]; prev[q[0]] = q[0]; const goal = tj * N + ti;
  const D = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (let h = 0; h < q.length; h++) {
    const cur = q[h]; if (cur === goal) break; const ci = cur % N, cj = (cur / N) | 0;
    for (const [di, dj] of D) { const a = ci + di, b = cj + dj; if (a < 0 || b < 0 || a >= N || b >= N) continue; const k = b * N + a; if (prev[k] !== -1 || grid[k]) continue; if (di && dj && (grid[cj * N + a] || grid[b * N + ci])) continue; prev[k] = cur; q.push(k); }
  }
  if (prev[goal] === -1) return [];
  const cells = []; for (let k = goal; k !== prev[k]; k = prev[k]) cells.push(k); cells.reverse();
  const pts = cells.map(k => cellCenter(k % N, (k / N) | 0));
  // thin out collinear points
  const out = []; let last = null;
  pts.forEach((p, i) => { if (i === 0 || i === pts.length - 1) { out.push(p); last = i; return; } const a = pts[i - 1], b = pts[i + 1], d1 = [p[0] - a[0], p[1] - a[1]], d2 = [b[0] - p[0], b[1] - p[1]]; if (d1[0] !== d2[0] || d1[1] !== d2[1]) out.push(p); });
  return out;
}

/* ---------- player ---------- */
const player = new THREE.Group(); scene.add(player);
(function buildAgent() {
  const coat = lam('#23232b'), dark = lam('#0d0d10'), red = basic('#e11d3f'), white = lam('#f2f2f5');
  const body = mk(new THREE.CylinderGeometry(.5, .66, 1.45, 10), coat, 0, 1.45, 0, player);
  mk(new THREE.BoxGeometry(.14, .75, .06), red, 0, 1.7, .56, player); mk(new THREE.BoxGeometry(.42, .3, .06), white, 0, 2.02, .45, player);
  mk(new THREE.SphereGeometry(.4, 14, 12), dark, 0, 2.45, 0, player);
  mk(new THREE.CylinderGeometry(.78, .78, .07, 18), lam('#1a1a20'), 0, 2.72, 0, player);
  mk(new THREE.CylinderGeometry(.4, .46, .42, 14), lam('#1a1a20'), 0, 2.95, 0, player);
  mk(new THREE.CylinderGeometry(.47, .47, .1, 14), red, 0, 2.82, 0, player);
  player.armL = mk(new THREE.BoxGeometry(.2, 1, .22), coat, -.66, 1.95, 0, player); player.armR = mk(new THREE.BoxGeometry(.2, 1, .22), coat, .66, 1.95, 0, player);
  player.armL.geometry.translate(0, -.5, 0); player.armR.geometry.translate(0, -.5, 0);
  mk(new THREE.ConeGeometry(.78, .5, 10, 1, true), coat, 0, .95, 0, player).material.side = THREE.DoubleSide;
  mk(new THREE.BoxGeometry(.32, .12, .42), dark, -.24, .05, .06, player); mk(new THREE.BoxGeometry(.32, .12, .42), dark, .24, .05, .06, player);
  player.legL = mk(new THREE.BoxGeometry(.3, 1, .32), dark, -.24, .5, 0, player); player.legR = mk(new THREE.BoxGeometry(.3, 1, .32), dark, .24, .5, 0, player);
  player.legL.geometry.translate(0, -.5, 0); player.legR.geometry.translate(0, -.5, 0); player.legL.position.y = 1; player.legR.position.y = 1;
  const blob = mk(new THREE.CircleGeometry(.95, 20), new THREE.MeshBasicMaterial({ color:0x000000, transparent:true, opacity:.4, depthWrite:false }), 0, .06, 0, player); blob.rotation.x = -Math.PI / 2;
  player.scale.setScalar(1.05);
})();
const P = { x:0, z:12, face:Math.PI, yaw:0, pitch:.5, dist:15, walk:0 };
let path = [], targetMark = null, autoWalk = false, inside = null, lastTime = 0;
const mark = mk(new THREE.TorusGeometry(1, .12, 6, 28), basic('#ffffff', { transparent:true, opacity:.9 }), 0, .4, 0); mark.rotation.x = Math.PI / 2; mark.visible = false;

/* ---------- input ---------- */
const keys = new Set(), joy = { x:0, y:0 };
const KEYMAP = { w:'f', arrowup:'f', s:'b', arrowdown:'b', a:'l', arrowleft:'l', d:'r', arrowright:'r' };
addEventListener('keydown', e => {
  if (modalOpen || !$('#tut').hidden || !$('#menu').hidden || !$('#win').hidden) return;
  const k = e.key.toLowerCase();
  if (KEYMAP[k]) { keys.add(KEYMAP[k]); cancelAuto(); e.preventDefault(); }
  else if (k === 'q') keys.add('cl'); else if (k === 'e') keys.add('cr'); else if (k === 'f' && !e.repeat) tryEnter(true);
  else if (k === ' ' || k === 'g') { e.preventDefault(); if (!e.repeat) toggleAuto(); }
  else if (k === 'enter' && !e.repeat) tryEnter(true);
  else if (k === 'escape') openMenu();
});
addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (KEYMAP[k]) keys.delete(KEYMAP[k]); if (k === 'q') keys.delete('cl'); if (k === 'e') keys.delete('cr'); });
addEventListener('blur', () => keys.clear());
let drag = null;
canvas.addEventListener('pointerdown', e => { if (e.target !== canvas) return; canvas.setPointerCapture(e.pointerId); drag = { x:e.clientX, y:e.clientY, lx:e.clientX, ly:e.clientY, moved:false, id:e.pointerId }; });
canvas.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly; drag.lx = e.clientX; drag.ly = e.clientY; if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 7) drag.moved = true; if (drag.moved) { P.dragT = performance.now(); P.yaw -= dx * .006; P.pitch = Math.max(.15, Math.min(1.2, P.pitch + dy * .004)); } });
canvas.addEventListener('pointerup', e => { if (drag && !drag.moved && !modalOpen) clickMove(e.clientX, e.clientY); drag = null; });
canvas.addEventListener('wheel', e => { e.preventDefault(); P.dist = Math.max(8, Math.min(30, P.dist + e.deltaY * .02)); }, { passive:false });
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function clickMove(cx, cy) {
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = new THREE.Vector3(); if (!ray.ray.intersectPlane(plane, hit)) return;
  const p = findPath(P.x, P.z, hit.x, hit.z); if (!p.length) return;
  path = p; autoWalk = false; const end = p[p.length - 1]; mark.position.set(end[0], .4, end[1]); mark.visible = true; $('#tips').classList.add('hide');
}
function toggleAuto() { if (autoWalk) { cancelAuto(); return; } const o = objective(); if (!o) return; const p = findPath(P.x, P.z, o.x, o.z + 3); if (!p.length) return; path = p; autoWalk = true; mark.visible = false; $('#btn-auto').innerHTML = '■ Stop auto-walk <kbd>Space</kbd>'; }
function cancelAuto() { if (autoWalk || path.length) { path = []; autoWalk = false; mark.visible = false; } $('#btn-auto').innerHTML = '▶ Auto-walk to objective <kbd>Space</kbd>'; }
$('#btn-auto').onclick = toggleAuto;
// touch joystick
const joyEl = $('#joy'), stick = $('#stick');
if (matchMedia('(pointer:coarse)').matches) { joyEl.hidden = false; $('#tips').style.display = 'none'; }
let joyId = null;
function joyMove(e) { const r = joyEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = e.clientX - cx, dy = e.clientY - cy; const m = Math.hypot(dx, dy), max = r.width / 2; if (m > max) { dx *= max / m; dy *= max / m; } stick.style.transform = `translate(${dx}px,${dy}px)`; joy.x = dx / max; joy.y = dy / max; if (Math.hypot(joy.x, joy.y) > .15) cancelAuto(); }
joyEl.addEventListener('pointerdown', e => { joyId = e.pointerId; joyEl.setPointerCapture(joyId); joyMove(e); });
joyEl.addEventListener('pointermove', e => { if (e.pointerId === joyId) joyMove(e); });
const joyEnd = e => { if (e.pointerId === joyId) { joyId = null; joy.x = joy.y = 0; stick.style.transform = ''; } };
joyEl.addEventListener('pointerup', joyEnd); joyEl.addEventListener('pointercancel', joyEnd);

/* ---------- UI wiring ---------- */
function openMenu() { cancelAuto(); $('#menu').hidden = false; }
$('#btn-menu').onclick = openMenu;
$('#btn-help').onclick = () => { $('#tut-title').textContent = 'How to play'; $('#tut-go').textContent = 'Got it'; $('#tut').hidden = false; };
$('#menu').addEventListener('click', e => {
  const m = e.target.dataset && e.target.dataset.m;
  if (e.target.id === 'menu' || m === 'resume') $('#menu').hidden = true;
  else if (m === 'help') { $('#menu').hidden = true; $('#btn-help').click(); }
  else if (m === 'file') { $('#menu').hidden = true; caseFile(); }
  else if (m === 'text') location.href = 'play.html?mode=text';
  else if (m === 'restart') { if (confirm('Restart the case and erase your progress?')) restart(); }
});
function caseFile() {
  const got = ST.filter(x => !x.final && save.done[x.id]);
  showPanel(`<p class="eyebrow">Case file</p><h2 id="m-title">${doneCount()} of ${NREG} pieces of evidence</h2>${got.length ? got.map(x => `<div class="evcard"><h3>${x.evidence.title}</h3><p>${x.evidence.text}</p></div>`).join('') : '<p>Nothing yet. Follow the red beam to your first station.</p>'}<button class="act primary" id="m-close">Back to the city</button>`);
  $('#m-close').onclick = closeModal;
}
$('#tut-intro').textContent = CASE.intro; if (CASE.key) { $('#case-eyebrow').textContent = CASE.title; const te = $('#text-eyebrow'); if (te) te.textContent = 'Text version · ' + CASE.title; }
$('#tut-go').onclick = () => { $('#tut').hidden = true; save.seen = true; persist(); };
$('#tut-text').onclick = () => { location.href = 'play.html?mode=text'; };
if (save.seen) { $('#tut-title').textContent = 'Welcome back, Agent.'; }
$('#tut').hidden = false; $('#hud').hidden = false;
if (save.seen && doneCount() > 0) { $('#tut').hidden = true; }

function refreshAll() {
  const dots = $('#dots'); dots.innerHTML = ST.filter(s => !s.final).map(s => `<i class="${save.done[s.id] ? 'on' : ''}"></i>`).join('');
  $('#prog-n').textContent = `${doneCount()}/${NREG}`;
  const o = objective(); $('#obj-text').textContent = o ? (o.final ? 'Return to HQ and solve the case' : `Go to ${o.name}`) : 'Case solved. Replay any station.';
}
window.refreshAll = refreshAll; refreshAll();
function tryEnter(force) {
  if (modalOpen) return;
  const near = nearStation(); if (!near) return;
  inside = near.id; cancelAuto(); keys.clear(); onModalClose = null; openStation(near);
}
$('#btn-enter').onclick = () => tryEnter(true);
const nearStation = () => ST.find(s => Math.hypot(s.x - P.x, s.z - P.z) < 5.2);

/* ---------- main loop ---------- */
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
const mini = $('#mini'), mg = mini.getContext('2d');
function drawMini(t) {
  const S = mini.width, k = S / 200, c = v => (v + 100) * k;
  mg.clearRect(0, 0, S, S); mg.fillStyle = '#0d0d12'; mg.fillRect(0, 0, S, S);
  mg.fillStyle = '#2a2a34'; STREETS.forEach(v => { mg.fillRect(c(v - HALF_ST), 0, HALF_ST * 2 * k, S); mg.fillRect(0, c(v - HALF_ST), S, HALF_ST * 2 * k); });
  const obj = objective();
  ST.forEach(s => { const st = stationState(s); mg.beginPath(); mg.arc(c(s.x), c(s.z), (obj === s ? 9 : 6) * (S / 320), 0, 7); mg.fillStyle = st === 'done' ? '#3ddc97' : st === 'locked' ? '#777788' : '#ff2d55'; mg.fill(); if (obj === s) { mg.lineWidth = 3; mg.strokeStyle = 'rgba(255,255,255,' + (.6 + .4 * Math.sin(t * 5)) + ')'; mg.stroke(); } });
  mg.save(); mg.translate(c(P.x), c(P.z)); mg.rotate(-P.face + Math.PI); mg.fillStyle = '#fff'; mg.beginPath(); mg.moveTo(0, -11); mg.lineTo(8, 9); mg.lineTo(0, 4); mg.lineTo(-8, 9); mg.closePath(); mg.fill(); mg.restore();
}
function step(now) {
  requestAnimationFrame(step);
  const t = now / 1000, dt = Math.min(.05, t - (lastTime || t)); lastTime = t;
  const frozen = modalOpen || !$('#tut').hidden || !$('#menu').hidden || !$('#win').hidden;
  // input vector (camera relative)
  let ix = (keys.has('r') ? 1 : 0) - (keys.has('l') ? 1 : 0) + joy.x, iz = (keys.has('f') ? 1 : 0) - (keys.has('b') ? 1 : 0) - joy.y;
  const mag = Math.hypot(ix, iz);
  let mx = 0, mz = 0;
  if (!frozen) {
    if (mag > .12) {
      path = []; mark.visible = false;
      const f = [-Math.sin(P.yaw), -Math.cos(P.yaw)], r = [Math.cos(P.yaw), -Math.sin(P.yaw)];
      const m = Math.min(1, mag); mx = (f[0] * iz + r[0] * ix) / mag * m; mz = (f[1] * iz + r[1] * ix) / mag * m;
    } else if (path.length) {
      const [wx, wz] = path[0], dx = wx - P.x, dz = wz - P.z, d = Math.hypot(dx, dz);
      if (d < .6) { path.shift(); if (!path.length) { mark.visible = false; if (autoWalk) { autoWalk = false; $('#btn-auto').innerHTML = '▶ Auto-walk to objective <kbd>Space</kbd>'; } } }
      else { mx = dx / d; mz = dz / d; }
    }
    const sp = 10 * (keys.has('sh') ? 1.5 : 1); P.vx = (P.vx || 0) + (mx * sp - (P.vx || 0)) * Math.min(1, dt * 11); P.vz = (P.vz || 0) + (mz * sp - (P.vz || 0)) * Math.min(1, dt * 11);
    const nx = P.x + P.vx * dt, nz = P.z + P.vz * dt;
    if (!blockedAt(nx, P.z)) P.x = nx; if (!blockedAt(P.x, nz)) P.z = nz;
    const moving = Math.hypot(P.vx, P.vz) > .6;
    if (moving) { const want = Math.atan2(P.vx, P.vz); let da = want - P.face; da = Math.atan2(Math.sin(da), Math.cos(da)); P.face += da * Math.min(1, dt * 14); P.walk += dt * (keys.has('sh') ? 15 : 11); $('#tips').classList.add('hide'); }
    else P.walk *= .85;
    // auto-camera swing behind the player when walking by click/auto
    if (moving && !drag && performance.now() - (P.dragT || 0) > 1200 && (!(mag > .12) || iz > .3)) { const behind = P.face + Math.PI; let dy = behind - P.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); P.yaw += dy * Math.min(1, dt * (mag > .12 ? 2.6 : 1.4)); }
    if (keys.has('cl')) { P.yaw += dt * 1.8; P.dragT = performance.now(); } if (keys.has('cr')) { P.yaw -= dt * 1.8; P.dragT = performance.now(); }
  }
  updateCars(dt);
  player.position.set(P.x, Math.abs(Math.sin(P.walk)) * .12, P.z); player.rotation.y = P.face;
  player.legL.rotation.x = Math.sin(P.walk) * .7; player.legR.rotation.x = -Math.sin(P.walk) * .7; player.armL.rotation.x = -Math.sin(P.walk) * .6; player.armR.rotation.x = Math.sin(P.walk) * .6;
  if (mark.visible) { mark.scale.setScalar(1 + .15 * Math.sin(t * 8)); }
  // camera
  const cp = Math.cos(P.pitch), cx = P.x + Math.sin(P.yaw) * cp * P.dist, cz = P.z + Math.cos(P.yaw) * cp * P.dist, cy = 2 + Math.sin(P.pitch) * P.dist;
  let tcl = 1; const camBlocked = (x, z) => colliders.some(c => c.b && x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1);
  for (; tcl > .3; tcl -= .06) if (!camBlocked(P.x + (cx - P.x) * tcl, P.z + (cz - P.z) * tcl)) break;
  const camx = P.x + (cx - P.x) * tcl, camz = P.z + (cz - P.z) * tcl, camy = cy + (1 - tcl) * 6;
  camera.position.x += (camx - camera.position.x) * Math.min(1, dt * 8); camera.position.y += (camy - camera.position.y) * Math.min(1, dt * 8); camera.position.z += (camz - camera.position.z) * Math.min(1, dt * 8);
  camera.lookAt(P.x, 2.2, P.z);
  // stations
  styleBeacons(t);
  const near = nearStation();
  const be = $('#btn-enter');
  if (near && !frozen) {
    be.hidden = false; be.textContent = stationState(near) === 'locked' ? `🔒 ${near.name} · locked` : stationState(near) === 'done' ? `Review ${near.name} (F)` : `▶ Enter ${near.name} (F)`;
    if (inside !== near.id && stationState(near) === 'open') { inside = near.id; cancelAuto(); keys.clear(); onModalClose = null; openStation(near); }
    else if (inside !== near.id) { inside = near.id; if (stationState(near) === 'locked') { toast(`HQ unlocks after all ${NREG} pieces of evidence`); } }
  } else { if (!near) { inside = null; be.hidden = true; } }
  // objective HUD
  const o = objective();
  if (o) {
    const dx = o.x - P.x, dz = o.z - P.z, dist = Math.hypot(dx, dz);
    $('#obj-dist').textContent = dist < 6 ? 'You are here. Step into the ring.' : `${Math.round(dist)} m away`;
    const a2 = Math.atan2(dx * Math.cos(P.yaw) - dz * Math.sin(P.yaw), -dx * Math.sin(P.yaw) - dz * Math.cos(P.yaw));
    $('#arrow svg').style.transform = `rotate(${a2}rad)`;
  } else $('#obj-dist').textContent = '';
  drawMini(t);
  renderer.render(scene, camera);
}
requestAnimationFrame(step);
addEventListener('keydown', e => { if (e.key === 'Shift') keys.add('sh'); }); addEventListener('keyup', e => { if (e.key === 'Shift') keys.delete('sh'); });

// win overlay when case already solved
onModalClose = null;
window.__game = { P, save, objective, openStation, ST, tp(x, z) { P.x = x; P.z = z; } };
})();
