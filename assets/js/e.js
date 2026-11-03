/* Direction E "Clearance board" · site script (Sienna, 2026-11-03). No dependencies.
   Every block below enhances markup that is already in the HTML, so the page reads fine without JS.
   Motion: transform / opacity / clip-path only; prefers-reduced-motion gets the static end state. */
(() => {
  const d = document, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  d.documentElement.classList.add('js');
  // Pause motion (WCAG 2.2.2): paused acts like reduced motion; each looping block registers how it stops/resumes.
  let paused = false; const still = () => RM || paused, onPause = [];

  /* Old single-page links (#/about, #/blog ...) go to the page's own URL. */
  const legacy = location.hash.match(/^#\/([a-z-]+)/);
  if (legacy) {
    const map = { home: '', about: 'about/', projects: 'projects/', services: 'services/', blog: 'blog/', contact: 'contact/', academy: 'academy/' };
    if (legacy[1] in map) location.replace(new URL((d.body.dataset.root || './') + map[legacy[1]], location.href).href);
  }

  /* ---------- the clearance board (home) ---------- */
  const board = d.getElementById('board');
  if (board) {
    const lanes = { work: board.querySelector('[data-lane=work] .strips'), wait: board.querySelector('[data-lane=wait] .strips'), done: board.querySelector('[data-lane=done] .strips') };
    const tpl = [...board.querySelectorAll('.strip')].sort((a, b) => a.dataset.n - b.dataset.n).map(s => ({ html: s.outerHTML, out: s.dataset.out === '1' }));
    let timers = [], touched = false, swiped = false;
    ['pointerdown', 'wheel', 'keydown'].forEach(ev => board.addEventListener(ev, () => { swiped = true; }, { passive: true }));
    const make = t => { const w = d.createElement('div'); w.innerHTML = t.html; const el = w.firstElementChild; el.className = 'strip'; el.querySelector('.acts')?.remove(); el.querySelector('.run-bar')?.remove(); el.querySelector('.via').textContent = el.dataset.via; return el; };
    const count = () => { for (const k in lanes) lanes[k].parentElement.querySelector('[data-count]').textContent = lanes[k].children.length; };
    function move(el, to, first) { // FLIP between lanes
      const all = [...board.querySelectorAll('.strip')], before = new Map(all.map(s => [s, s.getBoundingClientRect()]));
      first ? to.prepend(el) : to.append(el); count();
      // Small screens: lanes are a swipe bay, so follow the work to its lane until the visitor swipes.
      if (!swiped && board.scrollWidth > board.clientWidth + 4) board.scrollTo({ left: to.parentElement.offsetLeft - board.firstElementChild.offsetLeft, behavior: RM ? 'auto' : 'smooth' });
      if (still()) return;
      all.forEach(s => { const a = before.get(s), b = s.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
        if (dx || dy) s.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 620, easing: EASE }); });
    }
    function clear(el, label) {
      el.classList.remove('waiting', 'held'); el.querySelector('.run-bar')?.remove(); el.querySelector('.acts')?.remove();
      move(el, lanes.done, true); requestAnimationFrame(() => el.classList.add('done'));
      el.querySelector('.via').textContent = el.dataset.id + ' · ' + label;
    }
    function wait(el) {
      el.querySelector('.run-bar')?.remove(); el.classList.add('waiting');
      el.querySelector('.via').textContent = el.dataset.id + ' · Waits for your OK';
      const a = d.createElement('div'); a.className = 'acts';
      a.innerHTML = '<button type="button" class="ok">Approve</button><button type="button" class="hold">Hold</button>';
      const what = el.querySelector('.what').textContent;
      a.children[0].setAttribute('aria-label', 'Approve: ' + what); a.children[1].setAttribute('aria-label', 'Hold: ' + what);
      a.children[0].onclick = () => { touched = true; clear(el, 'Approved by you'); focusNext(); };
      a.children[1].onclick = () => { touched = true; el.classList.remove('waiting'); el.classList.add('held'); a.remove(); el.querySelector('.via').textContent = el.dataset.id + ' · On hold: nothing sent'; focusNext(); };
      el.append(a); move(el, lanes.wait, false);
      if (!still()) timers.push(setTimeout(() => { if (!touched && el.isConnected && el.classList.contains('waiting')) clear(el, 'Approved by you (demo)'); }, 5000));
    }
    // Keep keyboard users on the board after their button disappears.
    const focusNext = () => (board.querySelector('.acts button') || d.getElementById('replay')).focus({ preventScroll: true });
    function run() {
      timers.forEach(clearTimeout); timers = []; touched = false; swiped = false;
      for (const k in lanes) lanes[k].replaceChildren();
      const els = tpl.map(make); els.forEach(e => lanes.work.append(e)); count();
      if (still()) { clear(els[1], 'Done inside your tools'); wait(els[0]); return; }
      let t = 700;
      els.forEach((el, i) => {
        timers.push(setTimeout(() => { const b = d.createElement('i'); b.className = 'run-bar'; b.setAttribute('aria-hidden', 'true'); el.append(b); }, t - 600));
        timers.push(setTimeout(() => (tpl[i].out ? wait(el) : clear(el, 'Done inside your tools')), t + 1700));
        t += 1500;
      });
    }
    d.getElementById('replay').onclick = run;
    // Start once the board is on screen (it is, on load, for almost everyone).
    const bo = new IntersectionObserver(es => { if (es[0].isIntersecting) { bo.disconnect(); run(); } });
    bo.observe(board);
    // Pausing jumps the board to its static end state (the reduced-motion one); Play leaves it there, "Run it again" replays.
    onPause.push(p => { if (p) { bo.disconnect(); run(); } });
  }

  /* ---------- routes: a square steps from tool to tool, only while in view ---------- */
  const runs = [...d.querySelectorAll('.run[data-caps]')];
  if (runs.length) {
    const step = row => {
      const st = [...row.querySelectorAll('.stn')], pk = row.querySelector('.pk'), cap = row.querySelector('.run-cap'), caps = row.dataset.caps.split('|');
      const i = row._i || 0, s = st[i];
      st.forEach(x => x.classList.toggle('hit', x === s));
      pk.style.setProperty('--x', (s.offsetLeft + s.offsetWidth / 2) + 'px');
      cap.textContent = (i + 1) + '/' + st.length + '  ' + caps[i];
      const gate = s.classList.contains('gate'); row.classList.toggle('wait', gate);
      row._i = (i + 1) % st.length; row._t = setTimeout(() => { row._t = null; if (!paused) step(row); }, gate ? 2200 : 1100);
    };
    if (RM) runs.forEach(r => { r.querySelector('.run-cap').textContent = r.dataset.caps.split('|').join(' → '); });
    else {
      const io = new IntersectionObserver(es => es.forEach(e => {
        const row = e.target; row._in = e.isIntersecting;
        if (e.isIntersecting && !row._t && !paused) step(row);
        else if (!e.isIntersecting && row._t) { clearTimeout(row._t); row._t = null; }
      }), { threshold: .5 });
      runs.forEach(r => io.observe(r));
      onPause.push(p => runs.forEach(r => { if (p) { clearTimeout(r._t); r._t = null; } else if (r._in && !r._t) step(r); }));
    }
  }

  /* ---------- Pause motion toggle: one state, shown on the board and above the routes ---------- */
  const tg = [...d.querySelectorAll('[data-motion]')];
  if (tg.length && !RM && onPause.length) tg.forEach(b => {
    b.hidden = false;
    b.onclick = () => { paused = !paused; tg.forEach(x => x.setAttribute('aria-pressed', paused)); onPause.forEach(f => f(paused)); };
  });

  /* ---------- level boxes fill when they come into view ---------- */
  const lvs = d.querySelectorAll('.lv');
  if (lvs.length) {
    if (RM) lvs.forEach(l => l.classList.add('in'));
    else { const lo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); lo.unobserve(e.target); } }), { threshold: .6 }); lvs.forEach(l => lo.observe(l)); }
  }

  /* ---------- shelves / topic tabs (WAI-ARIA tabs, arrow keys, Home/End) ---------- */
  d.querySelectorAll('[data-tabs]').forEach(root => {
    const tabs = [...root.querySelectorAll('[role=tab]')], panels = tabs.map(t => d.getElementById(t.getAttribute('aria-controls')));
    const show = (i, focus) => {
      tabs.forEach((t, j) => { t.setAttribute('aria-selected', i === j); t.tabIndex = i === j ? 0 : -1; panels[j].hidden = i !== j; });
      if (focus) tabs[i].focus();
      if (!RM) panels[i].animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EASE });
      if (root.dataset.tabs === 'hash' && history.replaceState) history.replaceState(null, '', '#' + tabs[i].dataset.key);
    };
    tabs.forEach((t, i) => {
      t.onclick = () => show(i);
      t.onkeydown = e => {
        const k = e.key, n = tabs.length;
        const to = k === 'ArrowRight' ? (i + 1) % n : k === 'ArrowLeft' ? (i + n - 1) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
        if (to > -1) { e.preventDefault(); show(to, true); }
      };
    });
    const start = Math.max(0, tabs.findIndex(t => '#' + t.dataset.key === location.hash));
    tabs.forEach((t, j) => { t.tabIndex = j === start ? 0 : -1; t.setAttribute('aria-selected', j === start); panels[j].hidden = j !== start; });
  });
})();
