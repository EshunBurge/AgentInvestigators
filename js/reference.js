/* Reference page: lists the PDFs in /docs. Edit DOCS to add or rename documents. */
(() => {
  const DOCS = [
    { title:'Student Copyright Checklist', tag:'Competition', file:'copyright-checklist.pdf', desc:'The signed checklist showing that every image, font, library and piece of media on this site is original, licensed or used with permission.' },
    { title:'Plan of Work Log', tag:'Competition', file:'plan-of-work-log.pdf', desc:'The team log of tasks, dates, time spent and who did what while building Agent Investigator.' },
    { title:'Resources and AI Reflection', tag:'Competition', file:'ai-reflection.pdf', desc:'How the team used AI tools during development, what was reviewed by hand and what the team learned.' },
    { title:'Course Outline', tag:'Curriculum', file:'course-outline.pdf', desc:'All three pathways, 16 chapters and 127 lessons with their learning goals.' },
    { title:'Teacher and Family Guide', tag:'Guide', file:'teacher-guide.pdf', desc:'How lessons, tests, case files, streaks and certificates work, plus tips for using the site in class.' }
  ];
  const grid = document.getElementById('docGrid'), viewer = document.getElementById('docViewer'), frame = document.getElementById('docFrame'), vt = document.getElementById('docTitle'), dl = document.getElementById('docDownload');
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
  grid.innerHTML = DOCS.map((d, i) => `<article class="doc" data-i="${i}"><div class="doc-ic">${icon}</div><span class="doc-tag">${d.tag}</span><h3>${d.title}</h3><p>${d.desc}</p><div class="doc-act" id="act${i}"><span class="doc-wait">Checking…</span></div></article>`).join('');
  DOCS.forEach((d, i) => {
    const url = 'docs/' + d.file, act = document.getElementById('act' + i);
    fetch(url, { method:'HEAD' }).then(r => { if (!r.ok || !/pdf/i.test(r.headers.get('content-type') || 'pdf')) throw 0; act.innerHTML = `<button class="btn" data-open="${i}">View PDF</button><a class="btn btn-ghost" href="${url}" download>Download</a>`; act.querySelector('[data-open]').onclick = () => open(d, url); })
      .catch(() => { act.innerHTML = '<span class="doc-soon">Coming soon</span>'; act.closest('.doc').classList.add('soon'); });
  });
  function open(d, url) { vt.textContent = d.title; frame.src = url + '#view=FitH'; dl.href = url; viewer.hidden = false; viewer.scrollIntoView({ behavior:'smooth', block:'start' }); }
  document.getElementById('docClose').onclick = () => { viewer.hidden = true; frame.src = 'about:blank'; };
})();
