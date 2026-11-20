(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), A = window.AI, esc = A.esc, stage = () => $('#stage');
  const STEPS = ['Briefing', 'Vocab test', 'Concepts', 'Quiz', 'Simulation'];
  const key = new URLSearchParams(location.search).get('k');
  let E, L, step = 0, rec;

  const html = h => { stage().innerHTML = h; scrollTo(0, 0); };
  const bar = () => { $('#lsteps').innerHTML = STEPS.map((s, i) => `<li class="${i < step ? 'done' : i === step ? 'on' : ''}"><i></i>${s}</li>`).join(''); $('#lcoins').textContent = A.state().coins + ' coins'; };
  const setStep = n => { step = n; rec.step = Math.max(rec.step || 0, n); A.save(); bar(); [part1, vocabTest, part2, quiz, game][n](); };
  const marked = (t, terms) => { let s = esc(t); terms.forEach(([w]) => { s = s.replace(new RegExp('\\b(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')\\b', 'i'), '<mark class="term">$1</mark>'); }); return s; };

  /* ---------- shared question runner ---------- */
  function runQs(qs, opts, done) {
    let i = 0, right = 0, firstTry = true;
    const show = () => {
      const [q, ok, wr, why] = qs[i], o = A.options(ok, wr);
      html(`<div class="q-card"><div class="q-meta">${esc(opts.label)} · Question ${i + 1} of ${qs.length}</div><div class="q-text">${esc(q)}</div><div class="qopts">${o.map((x, j) => `<button class="qopt" data-j="${j}"><span class="k">${'ABCD'[j]}</span><span>${esc(x.t)}</span></button>`).join('')}</div><div id="fb"></div></div>`);
      document.querySelectorAll('.qopt').forEach(b => b.onclick = () => {
        const x = o[+b.dataset.j]; document.querySelectorAll('.qopt').forEach((c, k) => { c.disabled = true; if (o[k].ok) c.classList.add('right'); }); if (!x.ok) b.classList.add('wrong'); else right++; if (!x.ok) firstTry = false;
        $('#fb').innerHTML = `<div class="fbx ${x.ok ? 'ok' : 'no'}"><b>${x.ok ? 'Correct.' : 'Not quite.'}</b>${esc(why || '')}</div><div class="actions"><button class="btn" id="nx">${i + 1 < qs.length ? 'Next question' : 'See results'}</button></div>`; $('#nx').focus();
        $('#nx').onclick = () => { i++; if (i < qs.length) show(); else finish(); };
      });
    };
    const finish = () => {
      const need = Math.ceil(qs.length * opts.pass), pass = right >= need;
      html(`<div class="q-card" style="text-align:center"><div class="q-meta">${esc(opts.label)} results</div><div class="score-big">${right}/${qs.length}</div><p class="t" style="margin-top:12px">${pass ? opts.winMsg : 'You need ' + need + ' correct to continue. Review the briefing if you like, then try again.'}</p><div class="actions" style="justify-content:center">${pass ? '<button class="btn" id="go">' + opts.next + '</button>' : '<button class="btn" id="re">Try again</button><button class="btn btn-ghost" id="rv">Review the lesson</button>'}</div></div>`);
      if (pass) $('#go').onclick = () => done(right === qs.length && firstTry); else { $('#re').onclick = () => { i = 0; right = 0; firstTry = true; show(); }; $('#rv').onclick = () => setStep(opts.review); }
    };
    show();
  }

  /* ---------- steps ---------- */
  function part1() {
    html(`<span class="eyebrow">${esc(E.c.title)} · Lesson ${E.li + 1}</span><h1>${esc(L.t)}</h1><p class="t" style="color:var(--muted)">Part 1 · Learn the language</p>${L.a.map(p => `<p class="t">${marked(p, L.v)}</p>`).join('')}<div class="subh" style="color:var(--aqua);font-weight:800;letter-spacing:.14em;font-size:.75rem;text-transform:uppercase;margin-top:26px">Key vocabulary (${L.v.length} terms)</div><div class="vgrid">${L.v.map(([t, d]) => `<div class="vcard"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('')}</div><div class="actions"><button class="btn" id="go">Take the vocab test</button></div>`);
    $('#go').onclick = () => setStep(1);
  }
  function pool() { const out = []; E.c.lessons.forEach(l => l.v.forEach(x => out.push(x))); window.COURSE.pathways.forEach(p => p.chapters.forEach(c => { if (out.length < 24) c.lessons.forEach(l => l.v.forEach(x => out.push(x))); })); return out; }
  function vocabTest() {
    const all = pool(), vp = L.v.slice(); const n = Math.min(vp.length, 5), picks = A.shuffle(vp.slice()).slice(0, n);
    const qs = picks.map(([t, d], i) => {
      const others = A.shuffle(all.filter(x => x[0] !== t)); const rev = i % 2 === 1;
      return rev ? ['Which definition matches the term "' + t + '"?', d, [...new Set(others.map(x => x[1]))].slice(0, 3), t + ': ' + d] : ['Which term matches this definition: "' + d + '"?', t, [...new Set(others.map(x => x[0]))].slice(0, 3), t + ': ' + d];
    });
    runQs(qs, { label:'Vocab test', pass:.6, winMsg:'Vocabulary locked in. On to the big ideas.', next:'Continue to concepts', review:0 }, () => setStep(2));
  }
  function part2() {
    html(`<span class="eyebrow">${esc(E.c.title)} · Lesson ${E.li + 1}</span><h1>${esc(L.t)}</h1><p class="t" style="color:var(--muted)">Part 2 · Understand the concepts</p>${L.b.map(p => `<p class="t">${esc(p)}</p>`).join('')}${L.ex ? `<div class="callout ex"><b>Field example</b>${esc(L.ex)}</div>` : ''}${L.key ? `<div class="callout"><b>Remember</b>${esc(L.key)}</div>` : ''}<div class="actions"><button class="btn" id="go">Take the quiz</button></div>`);
    $('#go').onclick = () => setStep(3);
  }
  function quiz() { runQs(L.q, { label:'Short quiz', pass:.66, winMsg:'Quiz passed. Time for the simulation.', next:'Start the simulation', review:2 }, perfect => { rec.perfect = perfect; setStep(4); }); }

  /* ---------- simulation games ---------- */
  function finishLesson(simFirst) {
    const r = A.completeLesson(key, { perfect:!!rec.perfect, simFirst:!!simFirst });
    const nx = A.next(), cert = r.chapter;
    html(`<div class="reward"><span class="eyebrow">Lesson complete</span><h1>Mission accomplished.</h1><p class="t">${esc(L.t)}</p><div class="chips">${r.first ? `<span class="rchip">+${r.gain} coins</span><span class="rchip">+100 XP</span>` : '<span class="rchip">Replay complete</span>'}<span class="rchip">${A.streakNow()}-day streak</span></div>${cert ? `<div class="callout"><b>Chapter cleared</b>You earned a certificate for ${esc(E.c.title)}.</div>` : ''}<div class="actions" style="justify-content:center">${nx ? `<a class="btn" href="lesson.html?k=${nx.key}">Next lesson: ${esc(nx.l.t)}</a>` : ''}${cert ? `<a class="btn" href="certificate.html?c=${E.c.id}">View certificate</a>` : ''}${A.state().mode !== 'regular' ? `<a class="btn btn-ghost" href="play.html?k=${key}">Open case file</a>` : ''}<a class="btn btn-ghost" href="dashboard.html#train">Back to training</a></div></div>`);
    $('#lcoins').textContent = A.state().coins + ' coins';
  }
  function game() {
    const g = L.g, G = GAMES[g.type] || GAMES.match;
    html(`<span class="eyebrow">Step 5 · Simulation test</span><h1>${esc(g.title || 'Field simulation')}</h1><span class="gbanner">${g.type === 'lab' ? 'Practice AI · simulation' : 'Simulation'}</span><p class="t">${esc(g.intro || '')}</p><div id="gbox"></div>`);
    G(g, $('#gbox'), simFirst => finishLesson(simFirst));
  }
  const msg = (box, ok, text) => { let f = $('#gfb', box); if (!f) { f = document.createElement('div'); f.id = 'gfb'; box.appendChild(f); } f.innerHTML = `<div class="fbx ${ok ? 'ok' : 'no'}"><b>${ok ? 'Nice work.' : 'Not yet.'}</b>${esc(text)}</div>`; };
  const finishBtn = (box, cb, label) => { const d = document.createElement('div'); d.className = 'actions'; d.innerHTML = `<button class="btn" id="gdone">${label || 'Finish lesson'}</button>`; box.appendChild(d); $('#gdone').onclick = cb; $('#gdone').focus(); };

  const GAMES = {
    sort(g, box, done) {
      let tries = 0; const asg = g.items.map(() => null);
      box.innerHTML = `<p class="t"><b>${esc(g.prompt)}</b></p><div class="sortlist">${g.items.map((it, i) => `<div class="sitem" data-i="${i}"><span>${esc(it[0])}</span><span class="sb">${g.buckets.map((b, j) => `<button class="bk" data-j="${j}">${esc(b)}</button>`).join('')}</span></div>`).join('')}</div><button class="btn" id="chk" disabled>Check my sorting</button>`;
      box.querySelectorAll('.sitem').forEach(row => row.querySelectorAll('.bk').forEach(b => b.onclick = () => { const i = +row.dataset.i; asg[i] = +b.dataset.j; row.classList.remove('bad'); row.querySelectorAll('.bk').forEach(x => x.classList.toggle('on', +x.dataset.j === asg[i])); $('#chk').disabled = asg.some(v => v === null); }));
      $('#chk').onclick = () => { tries++; let bad = 0; box.querySelectorAll('.sitem').forEach((r, i) => { const ok = asg[i] === g.items[i][1]; r.classList.toggle('bad', !ok); if (!ok) bad++; }); if (!bad) { $('#chk').remove(); box.querySelectorAll('.bk').forEach(b => b.disabled = true); msg(box, true, g.why || 'Every item is in the right group.'); finishBtn(box, () => done(tries === 1)); } else msg(box, false, `${g.items.length - bad} of ${g.items.length} correct. Red items are in the wrong group. Move them and check again.`); };
    },
    match(g, box, done) {
      let mistakes = 0, sel = null, left = g.pairs.length; const R = A.shuffle(g.pairs.map((p, i) => [p[1], i]));
      box.innerHTML = `<p class="t"><b>${esc(g.prompt || 'Match each item on the left with its partner on the right.')}</b></p><div class="mcols"><div id="mL" style="display:grid;gap:10px">${g.pairs.map((p, i) => `<button class="mcell" data-i="${i}">${esc(p[0])}</button>`).join('')}</div><div id="mR" style="display:grid;gap:10px">${R.map(([t, i]) => `<button class="mcell" data-i="${i}">${esc(t)}</button>`).join('')}</div></div>`;
      const cells = s => [...box.querySelectorAll(s + ' .mcell')];
      cells('#mL').forEach(c => c.onclick = () => { cells('#mL').forEach(x => x.classList.remove('sel')); c.classList.add('sel'); sel = c; });
      cells('#mR').forEach(c => c.onclick = () => { if (!sel) { msg(box, false, 'Pick something on the left first.'); return; } if (sel.dataset.i === c.dataset.i) { sel.classList.add('ok'); sel.classList.remove('sel'); c.classList.add('ok'); sel = null; left--; if (!left) { msg(box, true, 'Every pair matched.' + (mistakes ? '' : ' Perfect, no mistakes.')); finishBtn(box, () => done(!mistakes)); } } else { mistakes++; c.classList.add('shake'); setTimeout(() => c.classList.remove('shake'), 400); } });
    },
    scenario(g, box, done) {
      let i = 0, pts = 0, max = 0; g.steps.forEach(s => max += Math.max(...s.opts.map(o => o[1])));
      const show = () => { const s = g.steps[i], o = A.shuffle(s.opts.map((x, k) => ({ x, k })));
        box.innerHTML = `<div class="q-card"><div class="q-meta">Decision ${i + 1} of ${g.steps.length}</div><div class="q-text">${esc(s.q)}</div><div class="qopts">${o.map(({ x }, j) => `<button class="qopt" data-j="${j}"><span class="k">${'ABCD'[j]}</span><span>${esc(x[0])}</span></button>`).join('')}</div><div id="fb"></div></div>`;
        box.querySelectorAll('.qopt').forEach(b => b.onclick = () => { const x = o[+b.dataset.j].x; pts += x[1]; box.querySelectorAll('.qopt').forEach(c => c.disabled = true); b.classList.add(x[1] >= 2 ? 'right' : 'wrong'); $('#fb').innerHTML = `<div class="fbx ${x[1] >= 2 ? 'ok' : 'no'}"><b>${x[1] >= 2 ? 'Strong choice.' : x[1] ? 'Workable, but not best.' : 'Risky choice.'}</b>${esc(x[2])}</div><div class="actions"><button class="btn" id="nx">${i + 1 < g.steps.length ? 'Next' : 'See result'}</button></div>`; $('#nx').onclick = () => { i++; if (i < g.steps.length) show(); else end(); }; }); };
      const end = () => { const pass = pts >= Math.ceil(max * .6); box.innerHTML = `<div class="q-card" style="text-align:center"><div class="score-big">${pts}/${max}</div><p class="t" style="margin-top:12px">${pass ? 'Mission success. Your decisions held up.' : 'Not enough points to pass. Try the scenario again and think about the safest, most careful option.'}</p><div class="actions" style="justify-content:center">${pass ? '<button class="btn" id="fin">Finish lesson</button>' : '<button class="btn" id="re">Try again</button>'}</div></div>`; if (pass) $('#fin').onclick = () => done(pts === max); else $('#re').onclick = () => { i = 0; pts = 0; show(); }; };
      show();
    },
    spot(g, box, done) {
      let tries = 0; const sel = new Set();
      box.innerHTML = `<p class="t"><b>${esc(g.prompt)}</b></p><div id="lines">${g.lines.map((l, i) => `<button class="spotline" data-i="${i}">${esc(l[0])}</button>`).join('')}</div><button class="btn" id="chk">Check my answers</button>`;
      box.querySelectorAll('.spotline').forEach(b => b.onclick = () => { const i = +b.dataset.i; sel.has(i) ? sel.delete(i) : sel.add(i); b.classList.toggle('sel', sel.has(i)); b.classList.remove('miss'); });
      $('#chk').onclick = () => { tries++; const flaws = g.lines.map((l, i) => l[1] ? i : -1).filter(i => i >= 0); const ok = flaws.every(i => sel.has(i)) && [...sel].every(i => g.lines[i][1]); box.querySelectorAll('.spotline').forEach((b, i) => { b.classList.remove('hit', 'miss'); if (sel.has(i)) b.classList.add(g.lines[i][1] ? 'hit' : 'miss'); }); if (ok) { $('#chk').remove(); box.querySelectorAll('.spotline').forEach(b => b.disabled = true); msg(box, true, g.lines.filter(l => l[1]).map(l => l[2]).join(' ')); finishBtn(box, () => done(tries === 1)); } else msg(box, false, `Not quite. Green lines are real problems; red lines you flagged are actually fine. You need to find all ${flaws.length} problems and nothing extra.`); };
    },
    order(g, box, done) {
      let mistakes = 0, n = 0; const items = A.shuffle(g.items.map((t, i) => [t, i]));
      box.innerHTML = `<p class="t"><b>${esc(g.prompt)}</b></p><div class="orderbox" id="slots">${g.items.map((_, i) => `<div class="ordslot">Step ${i + 1}</div>`).join('')}</div><div class="qopts" id="pool">${items.map(([t, i]) => `<button class="qopt" data-i="${i}"><span>${esc(t)}</span></button>`).join('')}</div>`;
      box.querySelectorAll('#pool .qopt').forEach(b => b.onclick = () => { if (+b.dataset.i === n) { const s = box.querySelectorAll('.ordslot')[n]; s.textContent = (n + 1) + '. ' + g.items[n]; s.classList.add('fill'); b.remove(); n++; if (n === g.items.length) { msg(box, true, 'The order is correct.' + (mistakes ? '' : ' No wrong clicks.')); finishBtn(box, () => done(!mistakes)); } } else { mistakes++; b.classList.add('shake'); b.classList.add('wrong'); setTimeout(() => b.classList.remove('shake', 'wrong'), 450); } });
    },
    pick(g, box, done) {
      box.innerHTML = `<p class="t"><b>${esc(g.prompt)}</b></p><div class="pickgrid">${g.options.map((o, i) => `<button class="pbtn" data-i="${i}"><b>${esc(o.name)}</b><span>${esc(o.tag)}</span></button>`).join('')}</div>`;
      box.querySelectorAll('.pbtn').forEach(b => b.onclick = () => { const o = g.options[+b.dataset.i]; runQs(o.qs, { label:o.name + ' challenge', pass:.66, winMsg:'You know ' + o.name + ' well.', next:'Finish lesson', review:2 }, perfect => done(perfect)); });
    },
    lab(g, box, done) { LABS[g.kind](g, box, done); }
  };

  /* ---------- practice-AI labs (simulations: nothing leaves the page) ---------- */
  const STOP = new Set('a an the and or but of to in on for with is are was were be been it this that these those i my me we our you your they their from as at by about into how what when where why who can could should would will do does did have has had not no yes so if than then there here very more most some any all just also like want need make using use'.split(' '));
  const keywords = t => { const c = {}; t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)).forEach(w => c[w] = (c[w] || 0) + 1); return Object.entries(c).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).map(x => x[0]); };
  const bubble = (box, cls, h) => { const c = $('.chat', box); const d = document.createElement('div'); d.className = 'bub ' + cls; d.innerHTML = h; c.appendChild(d); return d; };
  const reflect = (box, q, ok, wrongs, why, cb) => { const w = document.createElement('div'); w.id = 'refl'; box.appendChild(w); runInline(w, q, ok, wrongs, why, cb); };
  function runInline(w, q, ok, wrongs, why, cb) {
    const o = A.options(ok, wrongs); w.innerHTML = `<div class="q-card" style="margin-top:20px"><div class="q-meta">Check your thinking</div><div class="q-text" style="font-size:1.15rem">${esc(q)}</div><div class="qopts">${o.map((x, j) => `<button class="qopt" data-j="${j}"><span class="k">${'ABCD'[j]}</span><span>${esc(x.t)}</span></button>`).join('')}</div><div class="rfb"></div></div>`;
    let first = true; w.querySelectorAll('.qopt').forEach(b => b.onclick = () => { const x = o[+b.dataset.j]; if (!x.ok) { first = false; b.classList.add('wrong'); b.disabled = true; w.querySelector('.rfb').innerHTML = `<div class="fbx no"><b>Not quite.</b>Think again.</div>`; return; } w.querySelectorAll('.qopt').forEach(c => c.disabled = true); b.classList.add('right'); w.querySelector('.rfb').innerHTML = `<div class="fbx ok"><b>Correct.</b>${esc(why)}</div><div class="actions"><button class="btn" id="lf">Finish lesson</button></div>`; $('#lf').onclick = () => cb(first); });
  }
  const THEMES = [['Schedule and time', /time|day|week|month|deadline|schedule|calendar|date|when|soon|hour|morning|night|due|plan ahead/], ['People and teamwork', /friend|team|group|people|partner|class|teacher|parent|club|member|everyone|together|share|help|ask/], ['Money and supplies', /money|cost|budget|buy|price|fund|pay|sell|supplies|materials|free|cheap/], ['Tools and technology', /app|website|software|computer|phone|ai|tool|code|video|photo|online|internet|device|robot|game/], ['Writing and content', /write|essay|story|poster|video|slide|present|speech|post|design|draw|music|podcast|report/], ['Research and facts', /research|learn|study|data|fact|source|survey|interview|read|test|experiment|find out|question/]];
  const LABS = {
    sources(g, box, done) {
      box.innerHTML = `<p class="t"><b>Type your idea or question. The practice AI will suggest search terms and places to look, not made-up articles.</b></p><input class="inp" id="idea" placeholder="${esc(g.placeholder || 'Example: How does social media affect teen sleep?')}" maxlength="140"><div class="pfx"><button class="btn sm" id="go">Find sources</button><button class="btn btn-ghost sm" id="ex">Use an example</button></div><div class="chat" hidden></div>`;
      $('#ex').onclick = () => { $('#idea').value = g.example || 'How does social media affect teen sleep?'; };
      let ran = false; $('#go').onclick = () => { const v = $('#idea').value.trim(); if (v.length < 8) { A.toast('Write a longer idea first (at least 8 characters).'); return; } const k = keywords(v).slice(0, 4); const c = $('.chat', box); c.hidden = false; c.innerHTML = ''; bubble(box, 'me', esc(v));
        const lc = v.toLowerCase(); const lib = /health|sleep|body|medic|disease|brain|mental/.test(lc) ? ['CDC.gov and NIH.gov', 'Google Scholar (look for review articles)', 'MedlinePlus'] : /space|planet|science|physics|climate|energy|animal|environment|chemistry/.test(lc) ? ['NASA.gov or NOAA.gov', 'Google Scholar', 'Smithsonian Institution'] : /history|war|government|law|rights|president|culture/.test(lc) ? ['Library of Congress (loc.gov)', 'National Archives (archives.gov)', 'Your school or public library databases'] : ['Your school or public library databases', 'Google Scholar', 'Britannica or another encyclopedia for background'];
        setTimeout(() => { bubble(box, 'ai', `<h4>Search terms to try</h4><ul>${[k.join(' '), (k[0] || 'topic') + ' research study', (k[0] || 'topic') + ' ' + (k[1] || 'effects') + ' statistics', 'what is ' + (k[0] || 'topic')].map(x => '<li>' + esc(x) + '</li>').join('')}</ul><h4>Good places to look</h4><ul>${lib.map(x => '<li>' + esc(x) + '</li>').join('')}</ul><h4>Check every source</h4><ul><li>Who wrote it, and are they an expert?</li><li>When was it published or updated?</li><li>Can you find the same fact somewhere independent?</li></ul><i>I cannot browse the internet in this practice tool, so I never make up article titles.</i>`); if (!ran) { ran = true; reflect(box, 'You find two articles on your topic. Which one should you trust more?', 'The one by a named expert, with a date and cited sources', ['The one that appears first in search results', 'The one with the most dramatic headline'], 'Authority, dates and citations are signs of a reliable source. Ranking and drama are not.', done); } }, 450); };
    },
    organize(g, box, done) {
      box.innerHTML = `<p class="t"><b>Dump every idea you have for a project, one per line. The practice AI will sort them into themes.</b></p><textarea class="ta" id="dump" placeholder="Make a poster\nAsk the teacher about the deadline\nFind a free app for the video\nSurvey 20 classmates\n..."></textarea><div class="pfx"><button class="btn sm" id="go">Organize my ideas</button><button class="btn btn-ghost sm" id="ex">Use an example</button></div><div class="chat" hidden></div>`;
      $('#ex').onclick = () => { $('#dump').value = 'Make a poster about recycling\nAsk the teacher when it is due\nSurvey 20 classmates about their habits\nFind a free app to design the poster\nWork with a partner on the slides\nResearch how much waste our school makes\nPractice the speech on Friday\nBudget five dollars for supplies'; };
      let ran = false; $('#go').onclick = () => { const ideas = $('#dump').value.split(/\n|;/).map(s => s.trim()).filter(Boolean); if (ideas.length < 4) { A.toast('Add at least 4 ideas, one per line.'); return; } const groups = {}; ideas.forEach(t => { const th = THEMES.find(([, re]) => re.test(t.toLowerCase())); const n = th ? th[0] : 'Other ideas'; (groups[n] = groups[n] || []).push(t); }); const c = $('.chat', box); c.hidden = false; c.innerHTML = ''; bubble(box, 'me', esc(ideas.length + ' ideas dumped.'));
        setTimeout(() => { bubble(box, 'ai', Object.entries(groups).map(([n, a]) => `<h4>${esc(n)}</h4><ul>${a.map(x => '<li>' + esc(x) + '</li>').join('')}</ul>`).join('') + '<i>I grouped these by keywords. You decide whether the groups make sense and what order to do them in.</i>'); if (!ran) { ran = true; reflect(box, 'The sorting put one idea in a theme that does not fit. What should you do?', 'Move it yourself. The AI is a helper and you are in charge', ['Accept it because the AI sorted it', 'Delete the idea'], 'AI sorting is a starting point. You review and fix it.', done); } }, 450); };
    },
    topic(g, box, done) {
      box.innerHTML = `<p class="t"><b>Pick a prompt to send to the practice AI.</b></p><div class="qopts" id="pp">${g.prompts.map((p, i) => `<button class="qopt" data-i="${i}"><span class="k">${i + 1}</span><span>${esc(p[0])}</span></button>`).join('')}</div><div class="chat" hidden></div>`;
      let ran = false; box.querySelectorAll('#pp .qopt').forEach(b => b.onclick = () => { const p = g.prompts[+b.dataset.i], c = $('.chat', box); c.hidden = false; c.innerHTML = ''; bubble(box, 'me', esc(p[0])); setTimeout(() => { bubble(box, 'ai', `<h4>Ideas</h4><ul>${p[1].map(x => '<li>' + esc(x) + '</li>').join('')}</ul><i>Pick one, or ask me to narrow them down.</i>`); if (!ran) { ran = true; reflect(box, g.q || 'Which is the best next step after the AI gives you topic ideas?', 'Choose the one you care about, then check it is specific and researchable', ['Pick the first one without thinking', 'Ask the AI to pick for you and stop there'], 'The AI generates options. You choose based on your interest, the assignment, and whether you can find good sources.', done); } }, 450); });
    },
    eliminate(g, box, done) {
      const ex = g.example || ['Interview three local business owners about recycling', 'Copy a finished essay from the internet and change a few words', 'Survey classmates about how they get to school', 'Do something about the environment'];
      box.innerHTML = `<p class="t"><b>Enter four ideas for ${esc(g.topic || 'your project')}. Include one idea you know is a bad one. The practice AI will try to spot it.</b></p>${[0, 1, 2, 3].map(i => `<input class="inp idea" maxlength="120" placeholder="Idea ${i + 1}">`).join('')}<div class="pfx"><button class="btn sm" id="go">Filter my ideas</button><button class="btn btn-ghost sm" id="ex">Use an example</button></div><div class="chat" hidden></div>`;
      $('#ex').onclick = () => box.querySelectorAll('.idea').forEach((x, i) => x.value = ex[i]);
      const BAD = /(copy|cheat|plagiar|steal|hack|fake|lie |lying|skip|ignore the rules|without permission|spy on|someone else'?s)/i; let ran = false;
      $('#go').onclick = () => { const ideas = [...box.querySelectorAll('.idea')].map(x => x.value.trim()); if (ideas.some(x => x.length < 6)) { A.toast('Fill in all four ideas.'); return; } const res = ideas.map(t => { if (BAD.test(t)) return [t, 'Remove', 'Breaks honesty or safety rules.']; if (t.split(/\s+/).length < 4) return [t, 'Revise', 'Too vague to act on. Add who, what or how.']; return [t, 'Keep', 'Specific enough to try.']; }); if (!res.some(r => r[1] !== 'Keep')) { let w = 0; res.forEach((r, i) => { if (r[0].length < res[w][0].length) w = i; }); res[w] = [res[w][0], 'Revise', 'Your shortest idea has the least detail. Make it more specific.']; }
        const c = $('.chat', box); c.hidden = false; c.innerHTML = ''; bubble(box, 'me', 'Filter these ideas for me.'); setTimeout(() => { bubble(box, 'ai', res.map(r => `<h4>${esc(r[1])}: ${esc(r[0])}</h4>${esc(r[2])}`).join('') + '<br><i>This is a simple rule-based filter. A real AI can miss bad ideas or reject good ones, so you always make the final call.</i>'); if (!ran) { ran = true; reflect(box, 'Why should you not blindly trust an AI\'s decision about which ideas to cut?', 'It can miss problems or reject good ideas, so a person makes the final call', ['AI is always right about ideas', 'It is only wrong when the idea is short'], 'AI filters are helpers. You apply your own judgment, especially on ethics and quality.', done); } }, 450); };
    }
  };

  function boot() {
    const f = A.flat(); E = f.find(e => e.key === key);
    if (!A.user) { location.replace('login.html'); return; }
    if (!E) { location.replace('dashboard.html#train'); return; }
    if (!A.unlocked(E)) { location.replace('dashboard.html#train'); return; }
    L = E.l; $('#ltitle').textContent = E.c.title + ' · ' + L.t; document.title = L.t + ' · Agent Investigator';
    const s = A.state(); rec = s.lessons[key] = s.lessons[key] || { step:0 };
    step = rec.done ? 0 : Math.min(rec.step || 0, 4); bar(); setStep(step);
  }
  A.ready(boot);
})();
