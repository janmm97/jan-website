// Noir pages: mobile burger menu + looping testimonial carousel. Without JS both fall back to plain HTML.
(() => {
  const nav = document.querySelector('.nav');
  const burger = nav && nav.querySelector('.burger');
  if (burger) {
    document.documentElement.classList.add('js');
    burger.hidden = false;
    const set = (open) => { nav.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
    burger.onclick = () => set(!nav.classList.contains('open'));
    nav.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); burger.focus(); } });
    nav.querySelectorAll('ul a').forEach((a) => a.addEventListener('click', () => set(false)));
    matchMedia('(min-width:701px)').addEventListener('change', (m) => m.matches && set(false));
  }

  const tq = document.querySelector('.tq');
  if (!tq || matchMedia('(prefers-reduced-motion:reduce)').matches) return; // reduced motion: static stack
  const items = [...tq.children];
  const view = document.createElement('div'); view.className = 'tq-view';
  tq.before(view); view.append(tq);
  tq.classList.add('is-loop');
  const ctl = document.createElement('div'); ctl.className = 'tq-ctl';
  ctl.innerHTML = '<button type="button" data-a="prev" aria-label="Previous testimonial">←</button><button type="button" data-a="pause" aria-pressed="false">Pause</button><button type="button" data-a="next" aria-label="Next testimonial">→</button>';
  view.after(ctl);
  view.setAttribute('role', 'group'); view.setAttribute('aria-roledescription', 'carousel'); view.setAttribute('aria-label', 'Client testimonials');
  let busy = false, paused = false, hold = false, timer;
  const step = () => items[0].offsetWidth + parseFloat(getComputedStyle(tq).columnGap || 0);
  const go = (dir) => {
    if (busy) return; busy = true;
    if (dir < 0) { tq.style.transition = 'none'; tq.prepend(tq.lastElementChild); tq.style.transform = `translateX(${-step()}px)`; tq.offsetWidth; }
    tq.style.transition = ''; tq.style.transform = dir > 0 ? `translateX(${-step()}px)` : 'translateX(0)';
    let done = false;
    const end = () => { if (done) return; done = true; tq.removeEventListener('transitionend', end); tq.style.transition = 'none'; if (dir > 0) tq.append(tq.firstElementChild); tq.style.transform = ''; tq.offsetWidth; tq.style.transition = ''; busy = false; };
    tq.addEventListener('transitionend', end); setTimeout(end, 800);
  };
  const play = () => { clearInterval(timer); if (!paused && !hold) timer = setInterval(() => go(1), 6000); };
  const live = () => tq.setAttribute('aria-live', paused || hold ? 'polite' : 'off');
  ctl.onclick = (e) => {
    const a = e.target.dataset && e.target.dataset.a; if (!a) return;
    if (a === 'pause') { paused = !paused; e.target.setAttribute('aria-pressed', paused); e.target.textContent = paused ? 'Play' : 'Pause'; } else go(a === 'next' ? 1 : -1);
    live(); play();
  };
  const sec = tq.closest('section');
  sec.addEventListener('mouseenter', () => { hold = true; live(); play(); });
  sec.addEventListener('mouseleave', () => { hold = false; live(); play(); });
  sec.addEventListener('focusin', () => { hold = true; live(); play(); });
  sec.addEventListener('focusout', () => { hold = false; live(); play(); });
  live(); play();
})();
