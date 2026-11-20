/* Builds a 3D case file for one lesson (play.html?k=<lessonKey>) from the lesson's own content. */
(() => {
  const k = new URLSearchParams(location.search).get('k');
  if (!k || !window.AI || !window.COURSE) return;
  const flat = AI.flat(), idx = flat.findIndex(e => e.key === k);
  if (idx < 0 || !AI.isDone(k) || (AI.state().mode === 'regular')) { document.documentElement.style.visibility = 'hidden'; location.replace('dashboard.html#ops'); window.CASE = null; return; }
  const { l: L, c: C, p: P } = flat[idx];
  const MC = (q, options, answer, why) => ({ type:'mc', q, options, answer, why });
  const MULTI = (q, options, answers, why) => ({ type:'multi', q, options, answers, why });
  const SORT = (q, buckets, items, why) => ({ type:'sort', q, buckets, items:items.map(([t, b]) => ({ t, b })), why });
  const mcq = q => MC(q[0], [q[1], ...q[2].slice(0, 3)], 0, q[3]);
  const hash = [...k].reduce((a, c) => a + c.charCodeAt(0), 0), n = idx + 1;
  const cq = (L.cq || []).map(mcq);
  const seeds = [`A coded message reaches HQ: something has gone wrong in Nightfall City, and it traces back to "${L.t}".`, `The city's AI division is stumped. The only way to fix it is to understand "${L.t}" better than the system does.`, `A rival agency is spreading bad information about "${L.t}". Collect the facts before the morning briefing.`, `An informant left a sealed file labelled "${L.t}". Three evidence sites hold the proof.`, `Nightfall City's newspaper printed a story about "${L.t}" that doesn't add up. Investigate it.`];
  const ST = [
    { id:'vault', name:'The Witness Room', x:0, z:-22, topic:L.t, brief:L.a, puzzles:[cq[0], cq[1]], evidence:{ title:'Evidence #1 — The witness account', text:`A witness describes how "${L.t}" really works: ${L.v[0][0]} — ${L.v[0][1]}.` } },
    { id:'lab', name:'The Evidence Lab', x:-44, z:-22, topic:L.t, brief:[...L.b, ...(L.key ? [L.key] : [])], puzzles:[cq[2], cq[3]], evidence:{ title:'Evidence #2 — The lab result', text:L.key || 'The lab results back up the lesson.' } },
    { id:'field', name:'The Field Test Site', x:44, z:-22, topic:L.t, brief:['You have the witness account and the lab results. Now run a field check.', 'Stay sharp: this one tests whether you can use the idea in a new situation.'], puzzles:[cq[4]], evidence:{ title:'Evidence #3 — The field report', text:'The field check confirms good habits work anywhere.' } },
    { id:'hq', final:true, name:'HQ · Case Board', x:0, z:0, topic:L.t, brief:['All evidence is in. Answer the final question to close the case.'], puzzles:[cq[5]], evidence:{ title:'Case closed', text:L.key || 'You stay in charge of every AI decision.' } }
  ];
  window.CASE = { id:k, key:k, title:`Case ${String(n).padStart(3, '0')}: ${L.t}`, intro:`${seeds[hash % seeds.length]} Collect three pieces of evidence across the city, then return to HQ in the center to close the case.`, stations:ST, ranks:[[0, 'Recruit'], [.4, 'Field Agent'], [.65, 'Senior Agent'], [.85, 'Master Investigator']] };
})();
