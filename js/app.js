/* Agent Investigator — shared app core: state, rewards, avatar, helpers */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const A = window.AI = {};
  const parse = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  A.user = parse('ai_user');                      // {first,email,guest}
  A.key = 'ai_state_' + ((A.user && A.user.email) || 'guest');
  A.esc = t => String(t).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  A.today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  /* ---------- state ---------- */
  const DEFAULT = () => ({ v:1, mode:null, startPath:null, lessons:{}, coins:0, xp:0, streak:{ n:0, best:0, last:'' }, badges:{}, inv:['skin:#c68642', 'skin:#8d5524', 'skin:#f1c27d', 'skin:#ffdbac', 'skin:#e0ac69', 'skin:#5c3a1e', 'hair:short', 'hair:bald', 'hair:curly', 'hairc:#1a1a1a', 'hairc:#5a3825', 'outfit:trench'], eq:{ skin:'#c68642', hair:'short', hairc:'#1a1a1a', outfit:'trench', acc:[] }, certs:{}, created:Date.now() });
  let state = parse(A.key) || DEFAULT();
  if (!parse(A.key) && A.user && !A.user.guest) { const g = parse('ai_state_guest'); if (g) state = g; }
  state = Object.assign(DEFAULT(), state);
  A.state = () => state;
  A.save = (now) => {
    try { localStorage.setItem(A.key, JSON.stringify(state)); } catch (e) {}
    if (window.AQ && AQ.live && A.user && !A.user.guest) AQ.push(state, now);
  };
  A.reset = () => { state = DEFAULT(); A.save(true); };
  // cloud copy may arrive after load; refresh from cache once the backend is ready
  A.ready = fn => { if (window.AQ && AQ.whenReady) AQ.whenReady(() => { const c = parse(A.key); if (c) state = Object.assign(DEFAULT(), c); A.user = parse('ai_user') || A.user; fn(); }); else fn(); };

  /* ---------- shuffle: correct answer never always in the middle ---------- */
  let lastPos = -1, midRun = 0;
  A.options = (right, wrongs) => {
    const n = wrongs.length + 1, mid = n === 3 ? 1 : -1;
    let pos, tries = 0;
    do { pos = Math.floor(Math.random() * n); tries++; } while (tries < 20 && (pos === lastPos || (pos === mid && (midRun >= 1 || Math.random() < .55))));
    midRun = pos === mid ? midRun + 1 : 0; lastPos = pos;
    const w = A.shuffle(wrongs.slice()), out = []; let wi = 0;
    for (let i = 0; i < n; i++) out.push(i === pos ? { t:right, ok:true } : { t:w[wi++], ok:false });
    return out;
  };
  A.shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- course helpers ---------- */
  const ALL = () => window.COURSE.pathways;
  A.lessonKey = (cid, i) => cid + '-' + i;
  A.flat = () => { const out = []; ALL().forEach((p, pi) => p.chapters.forEach((c, ci) => c.lessons.forEach((l, li) => out.push({ p, pi, c, ci, l, li, key:A.lessonKey(c.id, li) })))); return out; };
  A.isDone = key => !!(state.lessons[key] && state.lessons[key].done);
  A.pathStart = () => { const i = ALL().findIndex(p => p.id === state.startPath); return i < 0 ? 0 : i; };
  A.chapterDone = c => c.lessons.every((_, i) => A.isDone(A.lessonKey(c.id, i)));
  A.pathDone = p => p.chapters.every(A.chapterDone);
  // a lesson is open if the previous lesson (in its pathway) is done
  A.unlocked = e => {
    const sp = A.pathStart();
    if (e.pi > sp && !A.pathDone(ALL()[e.pi - 1])) return false;
    if (e.pi < sp) return true;
    const list = A.flat().filter(x => x.pi === e.pi), idx = list.findIndex(x => x.key === e.key);
    return idx === 0 || A.isDone(list[idx - 1].key);
  };
  A.next = () => A.flat().find(e => !A.isDone(e.key) && A.unlocked(e) && e.pi >= A.pathStart());
  A.progress = () => { const f = A.flat().filter(e => e.pi >= A.pathStart()); const d = f.filter(e => A.isDone(e.key)).length; return { done:d, total:f.length }; };

  /* ---------- rewards ---------- */
  const BADGES = {
    first:['First Mission','Finish your first lesson'], streak3:['3-Day Streak','Learn 3 days in a row'], streak7:['7-Day Streak','Learn 7 days in a row'], streak14:['14-Day Streak','Learn 14 days in a row'], streak30:['30-Day Streak','Learn 30 days in a row'],
    perfect:['Sharp Eye','Get a perfect score on a quiz'], chapter:['Chapter Cleared','Finish a whole chapter'], five:['Five Down','Finish 5 lessons'], twenty:['Field Veteran','Finish 20 lessons'], gadget:['Gadget Guru','Buy your first piece of gear'], sim:['Simulation Ace','Pass a simulation first try']
  };
  A.BADGES = BADGES;
  A.log = text => { state.log = state.log || []; state.log.unshift({ t:text, w:Date.now() }); state.log.length = Math.min(state.log.length, 20); };
  A.ago = w => { const m = Math.round((Date.now() - w) / 60000); if (m < 1) return 'Just now'; if (m < 60) return m + ' min ago'; const h = Math.round(m / 60); if (h < 24) return h + ' hr ago'; const d = Math.round(h / 24); return d + (d === 1 ? ' day ago' : ' days ago'); };
  A.week = () => { const out = [], s = state.streak, days = state.days || {}; const fmt = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); const runEnd = s.last ? new Date(s.last + 'T12:00:00') : null; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = fmt(d); let on = !!days[k]; if (!on && runEnd && A.streakNow() > 0) { const diff = Math.round((runEnd - new Date(k + 'T12:00:00')) / 864e5); if (diff >= 0 && diff < s.n) on = true; } out.push({ k, label:['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()], on, today:i === 0 }); } return out; };
  A.award = id => { if (state.badges[id]) return false; state.badges[id] = Date.now(); A.log('Earned the ' + BADGES[id][0] + ' badge'); A.toast('Badge earned: ' + BADGES[id][0]); return true; };
  A.touchStreak = () => {
    const t = A.today(), s = state.streak; state.days = state.days || {}; state.days[t] = 1; if (s.last === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1); const ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
    s.n = s.last === ys ? s.n + 1 : 1; s.last = t; s.best = Math.max(s.best, s.n);
    [3, 7, 14, 30].forEach(n => { if (s.n >= n) A.award('streak' + n); });
  };
  A.streakNow = () => { const s = state.streak, t = A.today(); if (!s.last) return 0; const y = new Date(); y.setDate(y.getDate() - 1); const ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0'); return (s.last === t || s.last === ys) ? s.n : 0; };
  A.toast = msg => { let t = $('#aiToast'); if (!t) { t = document.createElement('div'); t.id = 'aiToast'; t.className = 'ai-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = msg; t.classList.add('show'); clearTimeout(A.toast.t); A.toast.t = setTimeout(() => t.classList.remove('show'), 2800); };

  A.completeLesson = (key, stats) => {
    const e = A.flat().find(x => x.key === key), L = state.lessons[key] = state.lessons[key] || {}, first = !L.done;
    Object.assign(L, stats || {}); L.done = L.done || Date.now(); L.step = 5;
    let gain = 0;
    if (first) {
      gain = 40 + (stats && stats.perfect ? 10 : 0); state.coins += gain; state.xp += 100; A.touchStreak(); A.award('first'); A.log('Finished the lesson ' + (e ? e.l.t : ''));
      const n = Object.values(state.lessons).filter(x => x.done).length; if (n >= 5) A.award('five'); if (n >= 20) A.award('twenty');
      if (stats && stats.perfect) A.award('perfect'); if (stats && stats.simFirst) A.award('sim');
      if (e && A.chapterDone(e.c)) { A.award('chapter'); state.certs[e.c.id] = state.certs[e.c.id] || { when:Date.now(), title:e.c.title, path:e.p.name }; gain += 60; state.coins += 60; }
    }
    A.save(true); return { first, gain, chapter:!!(e && first && A.chapterDone(e.c)) };
  };

  A.caseDone = key => !!(state.cases && state.cases[key]);
  A.caseWin = key => { state.cases = state.cases || {}; if (state.cases[key]) return 0; state.cases[key] = Date.now(); const ce = A.flat().find(x => x.key === key); A.log('Solved the case file for ' + (ce ? ce.l.t : 'a lesson')); state.coins += 25; state.xp += 50; A.save(true); return 25; };

  /* ---------- shop ---------- */
  A.SHOP = [
    { id:'outfit:blazer', n:'Red Blazer', c:80, kind:'outfit' }, { id:'outfit:tux', n:'Tuxedo', c:120, kind:'outfit' }, { id:'outfit:stealth', n:'Stealth Suit', c:150, kind:'outfit' }, { id:'outfit:turtle', n:'Turtleneck', c:60, kind:'outfit' },
    { id:'hair:afro', n:'Afro', c:40, kind:'hair' }, { id:'hair:long', n:'Long Hair', c:40, kind:'hair' }, { id:'hair:bun', n:'Bun', c:40, kind:'hair' }, { id:'hair:mohawk', n:'Mohawk', c:60, kind:'hair' }, { id:'hair:waves', n:'Waves', c:40, kind:'hair' },
    { id:'hairc:#c0392b', n:'Red Hair', c:30, kind:'hairc' }, { id:'hairc:#e8c07a', n:'Blonde Hair', c:30, kind:'hairc' }, { id:'hairc:#9aa0a6', n:'Silver Hair', c:30, kind:'hairc' }, { id:'hairc:#6c3ec1', n:'Violet Hair', c:50, kind:'hairc' },
    { id:'acc:fedora', n:'Fedora', c:50, kind:'acc' }, { id:'acc:shades', n:'Shades', c:50, kind:'acc' }, { id:'acc:earpiece', n:'Earpiece', c:70, kind:'acc' }, { id:'acc:scarf', n:'Red Scarf', c:60, kind:'acc' }, { id:'acc:mask', n:'Domino Mask', c:90, kind:'acc' }, { id:'acc:watch', n:'Spy Watch', c:100, kind:'acc' }
  ];
  A.owns = id => state.inv.includes(id);
  A.buy = id => { const it = A.SHOP.find(x => x.id === id); if (!it || A.owns(id) || state.coins < it.c) return false; state.coins -= it.c; state.inv.push(id); A.log('Bought ' + it.n); A.award('gadget'); A.save(true); return true; };

  /* ---------- avatar ---------- */
  A.avatar = (c, size) => {
    c = c || state.eq; const sk = c.skin, hc = c.hairc, acc = c.acc || [];
    const shade = '#00000026';
    const outfits = {
      trench: '<path d="M28 262l8-72q6-42 52-48h24q46 6 52 48l8 72z" fill="#26262c"/><path d="M84 142l16 56 16-56-16 10z" fill="#fff"/><path d="M96 154h8l5 44-9 10-9-10z" fill="#e5213a"/><path d="M60 160l24-18 4 40-26 8zM140 160l-24-18-4 40 26 8z" fill="#3c3c44"/>',
      blazer: '<path d="M28 262l8-72q6-42 52-48h24q46 6 52 48l8 72z" fill="#c4182f"/><path d="M84 142l16 60 16-60-16 10z" fill="#fff"/><path d="M84 142l16 60-34 10zM116 142l-16 60 34 10z" fill="#9c0f22"/><circle cx="100" cy="222" r="3" fill="#111"/>',
      tux: '<path d="M28 262l8-72q6-42 52-48h24q46 6 52 48l8 72z" fill="#101014"/><path d="M82 142l18 70 18-70-18 10z" fill="#fff"/><path d="M88 150l12 8 12-8v10l-12-4-12 4z" fill="#e5213a"/><path d="M82 142l-14 36 32 34zM118 142l14 36-32 34z" fill="#26262c"/>',
      stealth: '<path d="M28 262l8-72q6-42 52-48h24q46 6 52 48l8 72z" fill="#0b0b0e"/><path d="M52 190h96M60 226h80" stroke="#e5213a" stroke-width="3"/><path d="M84 142q16 14 32 0l-4 16h-24z" fill="#1c1c22"/>',
      turtle: '<path d="M28 262l8-72q6-42 52-48h24q46 6 52 48l8 72z" fill="#3a3a40"/><path d="M82 140h36v26q-18 10-36 0z" fill="#4a4a52"/><path d="M52 200h96" stroke="#00000030" stroke-width="3"/>'
    };
    const backHair = { long:`<path d="M58 90c0-34 18-50 42-50s42 16 42 50v58h-24V108H82v40H58z" fill="${hc}"/>`, afro:`<circle cx="100" cy="82" r="50" fill="${hc}"/>`, curly:`<g fill="${hc}"><circle cx="66" cy="80" r="16"/><circle cx="134" cy="80" r="16"/><circle cx="76" cy="58" r="16"/><circle cx="124" cy="58" r="16"/><circle cx="100" cy="50" r="17"/></g>`, waves:`<path d="M60 92c-4-34 14-52 40-52s44 18 40 52c0 22 4 40 8 50-14-6-20-18-22-30H74c-2 12-8 24-22 30 4-10 8-28 8-50z" fill="${hc}"/>` };
    const frontHair = { short:`<path d="M62 90c0-30 16-46 38-46s38 16 38 46c-8-14-20-20-38-20s-30 6-38 20z" fill="${hc}"/>`, bun:`<circle cx="100" cy="40" r="15" fill="${hc}"/><path d="M62 90c0-30 16-46 38-46s38 16 38 46c-8-14-20-20-38-20s-30 6-38 20z" fill="${hc}"/>`, mohawk:`<path d="M90 76l4-44h12l4 44q-10-6-20 0z" fill="${hc}"/>`, long:`<path d="M62 92c0-30 16-46 38-46s38 16 38 46c-10-12-24-20-38-18-14-2-28 6-38 18z" fill="${hc}"/>`, afro:`<path d="M66 86c6-14 18-22 34-22s28 8 34 22c-12-8-22-10-34-10s-22 2-34 10z" fill="${hc}"/>`, curly:`<g fill="${hc}"><circle cx="76" cy="72" r="13"/><circle cx="100" cy="64" r="14"/><circle cx="124" cy="72" r="13"/></g>`, waves:`<path d="M62 92c0-30 16-46 38-46s38 16 38 46c-6-8-14-16-22-16-6 6-14 8-22 4-10-2-22 4-32 12z" fill="${hc}"/>` };
    const hat = acc.includes('fedora') ? '<ellipse cx="100" cy="70" rx="52" ry="10" fill="#17171c"/><path d="M68 70q0-34 32-34t32 34z" fill="#17171c"/><rect x="68" y="58" width="64" height="8" fill="#e5213a"/>' : '';
    const shades = acc.includes('shades') ? '<rect x="68" y="88" width="30" height="16" rx="6" fill="#0a0a0a"/><rect x="102" y="88" width="30" height="16" rx="6" fill="#0a0a0a"/><rect x="96" y="93" width="8" height="4" fill="#0a0a0a"/>' : '';
    const mask = acc.includes('mask') ? '<path d="M64 90q36-16 72 0v14q-12 8-26 2-10-4-20 0-14 6-26-2z" fill="#0a0a0a"/>' : '';
    const ear = acc.includes('earpiece') ? '<circle cx="62" cy="104" r="4" fill="#e5213a"/><path d="M60 108q-6 20 6 34" stroke="#e5213a" stroke-width="2.5" fill="none"/>' : '';
    const scarf = acc.includes('scarf') ? '<path d="M70 140q30 18 60 0l4 18q-34 22-68 0z" fill="#e5213a"/><path d="M118 152l12 40-14 4-6-36z" fill="#c4182f"/>' : '';
    const watch = acc.includes('watch') ? '<rect x="48" y="214" width="16" height="10" rx="3" fill="#e5213a"/><rect x="50" y="216" width="12" height="6" rx="2" fill="#fff"/>' : '';
    const eyes = shades || mask ? '' : '<ellipse cx="85" cy="96" rx="4" ry="5" fill="#1a1a1a"/><ellipse cx="115" cy="96" rx="4" ry="5" fill="#1a1a1a"/><path d="M76 84q9-5 18 0M106 84q9-5 18 0" stroke="#00000066" stroke-width="3" fill="none" stroke-linecap="round"/>';
    const nose = '<path d="M100 98q-5 12 0 15" stroke="#00000040" stroke-width="3" fill="none" stroke-linecap="round"/>';
    return `<svg viewBox="0 0 200 262" width="${size || 200}" height="${Math.round((size || 200) * 1.31)}" role="img" aria-label="Your agent" xmlns="http://www.w3.org/2000/svg">${backHair[c.hair] || ''}${outfits[c.outfit] || outfits.trench}<rect x="88" y="124" width="24" height="22" fill="${sk}"/><rect x="88" y="124" width="24" height="9" fill="${shade}"/><ellipse cx="100" cy="94" rx="38" ry="42" fill="${sk}"/><ellipse cx="62" cy="98" rx="6" ry="9" fill="${sk}"/><ellipse cx="138" cy="98" rx="6" ry="9" fill="${sk}"/>${eyes}${nose}<path d="M88 120q12 8 24 0" stroke="#1a1a1a" stroke-width="3" fill="none" stroke-linecap="round"/>${mask}${shades}${ear}${frontHair[c.hair] || ''}${scarf}${watch}${hat}</svg>`;
  };
})();
