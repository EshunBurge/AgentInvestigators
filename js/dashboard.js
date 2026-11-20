(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)], A = window.AI, esc = A.esc;
  const ICON = {
    home:'<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10h-6v-6H9v6H3z"/></svg>', train:'<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM19 19v2H6"/></svg>', ops:'<svg viewBox="0 0 24 24"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/></svg>', shop:'<svg viewBox="0 0 24 24"><path d="M4 8h16l-1.2 12H5.2L4 8zM8 8V6a4 4 0 0 1 8 0v2"/></svg>', me:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
    flame:'<svg viewBox="0 0 24 24"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 2 4 4 1-3 0-6 0-9z"/></svg>', coin:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>', star:'<svg viewBox="0 0 24 24"><path d="M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z"/></svg>'
  };
  const VIEWS = [['home', 'HQ', ICON.home], ['train', 'Training', ICON.train], ['ops', 'Field Ops', ICON.ops], ['shop', 'Armory', ICON.shop], ['me', 'Dossier', ICON.me]];
  let view = (location.hash || '#home').slice(1); if (!VIEWS.some(v => v[0] === view)) view = 'home';
  let browsePath = null;

  function go(v) { view = v; history.replaceState(null, '', '#' + v); render(); scrollTo(0, 0); }
  function chrome() {
    const nav = VIEWS.map(([id, n, ic]) => `<button class="nav-i ${id === view ? 'on' : ''}" data-v="${id}">${ic}<span>${n}</span></button>`).join('');
    $('#side').innerHTML = `<a class="brand" href="index.html">Agent Investigator<i></i></a>${nav}<div class="sp"></div><a class="nav-i" href="reference.html"><svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg><span>References</span></a><a class="nav-i" href="index.html"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg><span>Home page</span></a>`;
    $('#tabbar').innerHTML = nav;
    const st = A.state(), ttl = { home:'Control Center', train:'Training', ops:'Field Ops', shop:'Armory', me:'Dossier' }[view];
    $('#topbar').innerHTML = `<h1>${ttl}</h1><div class="top-r"><div class="pill" title="Day streak">${ICON.flame}<b>${A.streakNow()}</b></div><div class="pill" title="Coins">${ICON.coin}<b>${st.coins}</b></div><button class="me" data-v="me" aria-label="Your dossier">${A.avatar(null, 40)}</button></div>`;
    $$('[data-v]').forEach(b => b.onclick = () => go(b.dataset.v));
  }
  const statsOld = () => { const s = A.state(); return `<div class="stats"><div class="stat" title="Day streak">${ICON.flame}<b>${A.streakNow()}</b><small>Streak</small></div><div class="stat">${ICON.coin}<b>${s.coins}</b><small>Coins</small></div><div class="stat">${ICON.star}<b>${s.xp}</b><small>XP</small></div></div>`; };
  const stats = () => '';
  const greet = () => { const u = A.user || {}; return u.guest ? 'Agent' : (u.first || 'Agent'); };
  const gameMode = () => A.state().mode !== 'regular';

  /* ---------- home ---------- */
  function home() {
    const s = A.state(), nx = A.next(), pr = A.progress(), pct = pr.total ? Math.round(pr.done / pr.total * 100) : 0, all = A.flat();
    const casesDone = all.filter(e => A.caseDone(e.key)).length, certs = Object.keys(s.certs).length, wk = A.week();
    const partial = nx && s.lessons[nx.key] && s.lessons[nx.key].step;
    const nextCase = all.find(e => A.isDone(e.key) && !A.caseDone(e.key));
    const rank = ['Recruit', 'Field Agent', 'Senior Agent', 'Master Investigator'][Math.min(3, Math.floor(pct / 26))];
    const hero = `<div class="hero-red"><span class="eyebrow">Your mission</span><h2>Welcome back, ${esc(greet())}.</h2><p>${nx ? (partial ? 'You are partway through a lesson. Pick up where you left off.' : 'Ready for your next lesson?') : 'You finished every available lesson. Excellent work.'}</p>${nx ? `<a class="btn btn-on-red" href="lesson.html?k=${nx.key}">${partial ? 'Continue lesson' : (pr.done ? 'Start next lesson' : 'Start your first lesson')}</a>` : ''}</div>`;
    const me = `<div class="card agent-side"><div class="av">${A.avatar(null, 118)}</div><h3>${esc(greet())}</h3><span class="rankchip">${rank}</span><p>${gameMode() ? 'Spend coins on gear to customize your agent.' : 'Your agent profile.'}</p><button class="btn sm" data-go="${gameMode() ? 'shop' : 'me'}">${gameMode() ? 'Visit the Armory' : 'Open dossier'}</button></div>`;
    const tile = (lab, n, sub, ico) => `<div class="tile"><span>${lab}</span><div class="tn">${ico || ''}<b>${n}</b></div><small>${sub}</small></div>`;
    const tiles = `<div class="tiles">${tile('Coins', s.coins, 'To spend in the Armory', ICON.coin)}${tile('Streak', A.streakNow(), A.streakNow() === 1 ? 'day in a row' : 'days in a row', ICON.flame)}${tile('Lessons', pr.done, 'of ' + pr.total + ' complete')}${tile('Certificates', certs, certs === 1 ? 'chapter cleared' : 'chapters cleared')}</div>`;
    const mission = nx ? `<div class="card"><div class="ch"><h3>Your next mission</h3><button class="lnk" data-go="train">All training</button></div><div class="mrow"><div class="mnum">${nx.li + 1}</div><div><h4>${esc(nx.l.t)}</h4><span class="sub">${esc(nx.c.title)} · ${esc(nx.p.name)}</span></div></div><div class="bar-track"><i style="width:${pct}%"></i></div><small class="sub">${pct}% of your pathway done · about 10 minutes</small><a class="btn sm" href="lesson.html?k=${nx.key}">${partial ? 'Continue' : 'Start'}</a></div>` : `<div class="card"><h3>All missions complete</h3><p>Check your Dossier for certificates.</p></div>`;
    const week = `<div class="card"><h3>This week</h3><p>Do one lesson a day to grow your streak.</p><div class="week">${wk.map(d => `<div class="wd ${d.on ? 'on' : ''} ${d.today ? 'today' : ''}"><i>${d.on ? ICON.flame : ''}</i><span>${d.label}</span></div>`).join('')}</div><p class="wnote">${A.streakNow() ? A.streakNow() + ' day' + (A.streakNow() > 1 ? 's' : '') + ' in a row. Play today to keep it going.' : 'Finish a lesson today to start a streak.'}</p></div>`;
    const caseCards = gameMode() ? `<div class="card"><div class="ch"><h3>Case files</h3><button class="lnk" data-go="ops">All cases</button></div><div class="two"><div class="mini"><span class="ic">${ICON.ops}</span><h4>${nextCase ? 'Case ' + String(all.findIndex(e => e.key === nextCase.key) + 1).padStart(3, '0') : 'No open case'}</h4><p>${nextCase ? esc(nextCase.l.t) : 'Finish a lesson to unlock your next case file.'}</p>${nextCase ? `<a class="btn sm" href="play.html?k=${nextCase.key}">Open case</a>` : ''}</div><div class="mini"><span class="ic">${ICON.star}</span><h4>${casesDone} solved</h4><p>Each solved case earns 25 coins and 50 XP.</p><button class="btn sm btn-ghost" data-go="ops">Browse cases</button></div></div></div>` : `<div class="card"><div class="ch"><h3>Chapter progress</h3></div><p>You are on the regular version: lessons, quizzes and tests. Switch versions any time in your Dossier.</p></div>`;
    const earned = s.badges, nextBadges = Object.entries(A.BADGES).filter(([id]) => !earned[id]).slice(0, 3);
    const prizes = `<div class="card"><div class="ch"><h3>Badges to win next</h3><button class="lnk" data-go="me">All badges</button></div><div class="plist">${nextBadges.length ? nextBadges.map(([id, [n, d]]) => `<div class="prow"><span class="bi">${ICON.star}</span><div><b>${n}</b><small>${d}</small></div></div>`).join('') : '<p>You have every badge. Legend.</p>'}</div></div>`;
    const lg = s.log || [], recent = `<div class="card"><h3>Recent activity</h3><div class="alist">${lg.length ? lg.slice(0, 6).map(x => `<div class="arow"><i></i><span>${esc(x.t)}</span><small>${A.ago(x.w)}</small></div>`).join('') : '<div class="arow"><i></i><span>Joined Agent Investigator</span><small>Just now</small></div>'}</div></div>`;
    return `<div class="hq-top">${hero}${me}</div>${tiles}<div class="grid2">${mission}${week}</div>${caseCards}<div class="grid2">${prizes}${recent}</div>`;
  }

  /* ---------- training ---------- */
  function train() {
    const P = window.COURSE.pathways, sp = A.pathStart(); if (browsePath === null) { const nx = A.next(); browsePath = nx ? nx.pi : sp; }
    const tabs = P.map((p, i) => { const open = i <= sp || A.pathDone(P[i - 1] || { chapters:[] }) ; return `<button class="pt ${i === browsePath ? 'on' : ''} ${open ? '' : 'lock'}" data-p="${i}">${open ? '' : '🔒 '}${esc(p.name)}</button>`; }).join('');
    const p = P[browsePath], s = A.state(), cur = A.next();
    let html = `<div class="top-row"><div class="hello"><h1>Training <em>missions</em></h1><p>${esc(p.sub)}</p></div>${stats()}</div><div class="pathtabs">${tabs}</div>`;
    if (gameMode()) {
      html += '<div class="level-path">';
      p.chapters.forEach((c, ci) => { html += `<div style="width:100%;text-align:center;margin:14px 0 18px"><span class="eyebrow">Chapter ${ci + 1}</span><h3 style="font-size:1.8rem;color:#fff">${esc(c.title)}</h3></div>`; c.lessons.forEach((l, li) => { const e = { p, pi:browsePath, c, ci, l, li, key:A.lessonKey(c.id, li) }, done = A.isDone(e.key), open = A.unlocked(e), isCur = cur && cur.key === e.key; html += `<div class="node ${done ? 'done' : isCur ? 'cur' : open ? '' : 'lock'}"><button class="dot" data-k="${e.key}" ${open ? '' : 'disabled'} aria-label="${esc(l.t)}">${done ? '✓' : li + 1}</button><div class="lbl">${esc(l.t)}<small>${done ? 'Complete' : open ? (s.lessons[e.key] && s.lessons[e.key].step ? 'In progress' : 'Ready') : 'Locked'}</small></div></div>`; }); });
      html += '</div>';
    } else {
      p.chapters.forEach((c, ci) => { const dn = c.lessons.filter((_, li) => A.isDone(A.lessonKey(c.id, li))).length; html += `<section class="chap"><div class="chap-h"><span>Chapter ${ci + 1}</span><h3>${esc(c.title)}</h3><span>${dn}/${c.lessons.length}</span></div><div class="lessons">${c.lessons.map((l, li) => { const e = { p, pi:browsePath, c, ci, l, li, key:A.lessonKey(c.id, li) }, done = A.isDone(e.key), open = A.unlocked(e), isCur = cur && cur.key === e.key; return `<button class="lesson ${done ? 'done' : isCur ? 'cur' : open ? '' : 'lock'}" data-k="${e.key}" ${open ? '' : 'disabled'}><span class="n">${done ? '✓' : li + 1}</span><span>${esc(l.t)}<small>${done ? 'Complete' : open ? 'Open' : 'Locked'}</small></span></button>`; }).join('')}</div></section>`; });
    }
    return html;
  }

  /* ---------- ops ---------- */
  function ops() {
    if (!gameMode()) return `<div class="top-row"><div class="hello"><h1>Field <em>Ops</em></h1><p>Field Ops belongs to the game version.</p></div></div><div class="card"><h3>Game version only</h3><p>You chose the regular version. Switch to the game version in your Dossier to unlock a 3D case for every lesson.</p></div>`;
    const f = A.flat().filter(e => e.pi === browsePathOps()), all = A.flat();
    const solved = all.filter(e => A.caseDone(e.key)).length, opened = all.filter(e => A.isDone(e.key)).length;
    const P = window.COURSE.pathways, sp = A.pathStart();
    const tabs = P.map((p, i) => `<button class="pt ${i === browsePathOps() ? 'on' : ''}" data-op="${i}">${esc(p.name)}</button>`).join('');
    let html = `<div class="top-row"><div class="hello"><h1>Field <em>Ops</em></h1><p>Every lesson you finish unlocks a case file in Nightfall City. ${solved} solved · ${opened} unlocked.</p></div>${stats()}</div><div class="pathtabs">${tabs}</div>`;
    P[browsePathOps()].chapters.forEach((c, ci) => {
      html += `<section class="chap"><div class="chap-h"><span>Chapter ${ci + 1}</span><h3>${esc(c.title)}</h3></div><div class="cases">${c.lessons.map((l, li) => { const key = A.lessonKey(c.id, li), n = all.findIndex(e => e.key === key) + 1, open = A.isDone(key), done = A.caseDone(key);
        return open ? `<a class="casef ${done ? 'solved' : ''}" href="play.html?k=${key}"><span class="tab">CASE ${String(n).padStart(3, '0')}</span><b>${esc(l.t)}</b><small>${done ? 'Solved' : 'Ready to investigate'}</small></a>` : `<div class="casef lock"><span class="tab">CASE ${String(n).padStart(3, '0')}</span><b>${esc(l.t)}</b><small>Finish the lesson to unlock</small></div>`; }).join('')}</div></section>`;
    });
    return html;
  }
  let opsPath = null;
  function browsePathOps() { if (opsPath === null) { const nx = A.next(); opsPath = nx ? nx.pi : A.pathStart(); } return opsPath; }

  /* ---------- armory ---------- */
  const SKINS = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e'], HAIRC = ['#1a1a1a', '#5a3825', '#c0392b', '#e8c07a', '#9aa0a6', '#6c3ec1'], HAIRS = ['short', 'bald', 'curly', 'afro', 'long', 'bun', 'mohawk', 'waves'], OUTF = ['trench', 'blazer', 'tux', 'stealth', 'turtle'], ACCS = ['fedora', 'shades', 'earpiece', 'scarf', 'mask', 'watch'];
  const NAMES = { short:'Short', bald:'Bald', curly:'Curly', afro:'Afro', long:'Long', bun:'Bun', mohawk:'Mohawk', waves:'Waves', trench:'Trench coat', blazer:'Red blazer', tux:'Tuxedo', stealth:'Stealth suit', turtle:'Turtleneck', fedora:'Fedora', shades:'Shades', earpiece:'Earpiece', scarf:'Red scarf', mask:'Domino mask', watch:'Spy watch' };
  function priceOf(id) { const it = A.SHOP.find(x => x.id === id); return it ? it.c : 0; }
  function shop() {
    const s = A.state(), eq = s.eq;
    const sw = (arr, kind, cur) => arr.map(v => { const id = kind + ':' + v, own = A.owns(id); return `<button class="sw ${cur === v ? 'on' : ''} ${own ? '' : 'lock'}" style="background:${v}" data-buy="${id}" aria-label="${kind} ${v} ${own ? '' : '(' + priceOf(id) + ' coins)'}" title="${own ? '' : priceOf(id) + ' coins'}"></button>`; }).join('');
    const chips = (arr, kind, cur) => arr.map(v => { const id = kind + ':' + v, own = A.owns(id), on = kind === 'acc' ? (eq.acc || []).includes(v) : cur === v; return `<button class="chip ${on ? 'on' : ''} ${own ? '' : 'lock'}" data-buy="${id}">${NAMES[v]}${own ? '' : `<small>${priceOf(id)}c</small>`}</button>`; }).join('');
    return `<div class="top-row"><div class="hello"><h1>The <em>Armory</em></h1><p>Customize your agent. Earn coins by finishing lessons.</p></div>${stats()}</div>
    <div class="builder"><div class="card avatar-card" style="position:sticky;top:12px;align-self:start">${A.avatar(null, 220)}<p style="margin:0">${esc(greet())}</p></div>
    <div class="card"><div class="subh">Skin tone</div><div class="pick-row">${sw(SKINS, 'skin', eq.skin)}</div>
    <div class="subh">Hair style</div><div class="pick-row">${chips(HAIRS, 'hair', eq.hair)}</div>
    <div class="subh">Hair color</div><div class="pick-row">${sw(HAIRC, 'hairc', eq.hairc)}</div>
    <div class="subh">Spy outfit</div><div class="pick-row">${chips(OUTF, 'outfit', eq.outfit)}</div>
    <div class="subh">Gadgets &amp; accessories</div><div class="pick-row">${chips(ACCS, 'acc', null)}</div>
    <p style="font-size:.85rem">Tap an owned item to wear it. Tap a dashed item to buy it with coins.</p></div></div>`;
  }
  function wear(id) {
    const s = A.state(), [k, v] = id.split(':');
    if (!A.owns(id)) { const p = priceOf(id); if (s.coins < p) { A.toast('Not enough coins. You need ' + p + '.'); return; } if (!A.buy(id)) return; A.toast('Purchased!'); }
    if (k === 'acc') { const a = s.eq.acc || []; s.eq.acc = a.includes(v) ? a.filter(x => x !== v) : a.concat(v); } else s.eq[k === 'skin' ? 'skin' : k === 'hair' ? 'hair' : k === 'hairc' ? 'hairc' : 'outfit'] = v;
    A.save(); render();
  }

  /* ---------- dossier ---------- */
  function me() {
    const s = A.state(), u = A.user || {}, badges = Object.entries(A.BADGES).map(([id, [n, d]]) => `<div class="bdg ${s.badges[id] ? 'on' : ''}"><span class="bi"><svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/></svg></span><div><b>${n}</b><small>${d}</small></div></div>`).join('');
    const certs = Object.entries(s.certs).map(([id, c]) => `<div class="cert"><div><b>${esc(c.title)}</b><br><small style="color:var(--muted)">${esc(c.path)} · ${new Date(c.when).toLocaleDateString()}</small></div><a class="btn sm" href="certificate.html?c=${id}">View</a></div>`).join('') || '<p>Finish a chapter to earn your first certificate.</p>';
    return `<div class="top-row"><div class="hello"><h1>Your <em>dossier</em></h1><p>${u.guest ? 'Guest agent. Progress saves on this device only.' : esc((u.first || '') + ' · ' + (u.email || ''))}</p></div>${stats()}</div>
    <div class="grid2"><div class="card"><h3>Streak</h3><p>Current: <b style="color:#fff">${A.streakNow()}</b> days · Best: <b style="color:#fff">${s.streak.best}</b> days</p>${(() => { const c = A.streakNow(), nx = [3, 7, 14, 30].find(m => m > c); return nx ? `<div class="bar-track" style="width:100%"><i style="width:${Math.round(c / nx * 100)}%"></i></div><p>${nx - c} more day${nx - c > 1 ? 's' : ''} to the ${nx}-day streak badge.</p>` : '<p>Every streak badge earned. Keep it going!</p>'; })()}</div>
    <div class="card"><h3>Settings</h3><p>Version: <b style="color:#fff">${gameMode() ? 'Game' : 'Regular'}</b></p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn sm" id="swmode">Switch to ${gameMode() ? 'regular' : 'game'} version</button><button class="btn btn-ghost sm" id="logout">${u.guest ? 'Leave guest mode' : 'Log out'}</button></div></div></div>
    <div class="card" style="margin-top:18px"><h3>Badges</h3><div class="badges" style="margin-top:12px">${badges}</div></div>
    <div class="card" style="margin-top:18px"><h3>Certificates</h3><div class="certs" style="margin-top:12px">${certs}</div></div>
    ${u.guest ? '<div class="card" style="margin-top:18px"><h3>Save your progress</h3><p>Create an account to keep your progress on every device.</p><a class="btn sm" href="login.html#signup">Create an account</a></div>' : ''}`;
  }

  /* ---------- onboarding ---------- */
  function onboarding() {
    const s = A.state(); let mode = 'game', path = 'beginner';
    const m = $('#modal'), box = $('#mbox'); m.hidden = false;
    const step1 = () => { box.innerHTML = `<span class="eyebrow">Step 1 of 2</span><h2>Choose your version</h2><p>Same lessons either way. You can switch later in your Dossier.</p><div class="choice2"><button class="cbox ${mode === 'game' ? 'on' : ''}" data-m="game"><h3>Game version</h3><p>Levels on a mission map, coins, gear for your agent, and 3D Field Ops missions.</p></button><button class="cbox ${mode === 'regular' ? 'on' : ''}" data-m="regular"><h3>Regular version</h3><p>A simple list of lessons, quizzes and tests with no extras.</p></button></div><button class="btn" id="n1">Next</button>`; $$('[data-m]', box).forEach(b => b.onclick = () => { mode = b.dataset.m; step1(); }); $('#n1').onclick = step2; };
    const step2 = () => { box.innerHTML = `<span class="eyebrow">Step 2 of 2</span><h2>Where do you start?</h2><p>Pick the level that fits. Finish it and the next one opens.</p><div style="display:grid;gap:12px;margin:16px 0">${window.COURSE.pathways.map(p => `<button class="cbox ${path === p.id ? 'on' : ''}" data-p="${p.id}"><h3>${esc(p.name)}</h3><p>${esc(p.who)}</p></button>`).join('')}</div><div style="display:flex;gap:10px"><button class="btn btn-ghost" id="b1">Back</button><button class="btn" id="n2">Start training</button></div>`; $$('[data-p]', box).forEach(b => b.onclick = () => { path = b.dataset.p; step2(); }); $('#b1').onclick = step1; $('#n2').onclick = () => { s.mode = mode; s.startPath = path; A.save(true); m.hidden = true; browsePath = null; go(mode === 'game' ? 'shop' : 'home'); if (mode === 'game') A.toast('Build your agent, then head to Training.'); }; };
    step1();
  }

  function render() {
    chrome();
    const V = { home, train, ops, shop, me }; $('#main').innerHTML = V[view]();
    $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
    $$('[data-op]').forEach(b => b.onclick = () => { opsPath = +b.dataset.op; render(); });
    $$('[data-k]').forEach(b => b.onclick = () => { location.href = 'lesson.html?k=' + b.dataset.k; });
    $$('[data-p]').forEach(b => b.onclick = () => { browsePath = +b.dataset.p; const open = browsePath <= A.pathStart() || A.pathDone(window.COURSE.pathways[browsePath - 1]); if (!open) A.toast('Finish the previous pathway to unlock this one.'); render(); });
    $$('[data-buy]').forEach(b => b.onclick = () => wear(b.dataset.buy));
    const sw = $('#swmode'); if (sw) sw.onclick = () => { const s = A.state(); s.mode = gameMode() ? 'regular' : 'game'; A.save(true); render(); };
    const lo = $('#logout'); if (lo) lo.onclick = async () => { if (window.AQ && AQ.live && !(A.user || {}).guest) await AQ.logOut(); localStorage.removeItem('ai_user'); location.href = 'login.html'; };
  }
  A.ready(() => {
    if (!A.user) { location.replace('login.html'); return; }
    render(); if (!A.state().mode) onboarding();
  });
})();
