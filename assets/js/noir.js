// Noir pages: mobile burger menu + continuously looping testimonials. Without JS both fall back to plain HTML.
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
  const view = document.createElement('div'); view.className = 'tq-view';
  tq.before(view); view.append(tq);
  tq.classList.add('is-loop');
  view.setAttribute('role', 'group'); view.setAttribute('aria-label', 'Client testimonials, scrolling. Hover or focus to hold; click, tap or press Enter to pause.');
  view.tabIndex = 0;
  // Continuous drift left; once the first card is fully out, it moves to the end. Each quote stays once in the DOM.
  const cs = getComputedStyle(tq);
  const speed = parseFloat(cs.getPropertyValue('--motion-marquee-speed')) || 40; // px per second
  const gap = parseFloat(cs.columnGap) || 0;
  let x = 0, last = 0, hold = false;
  const tick = (t) => {
    const dt = Math.min(t - (last || t), 50) / 1000; last = t;
    if (!hold) {
      x += speed * dt;
      const first = tq.firstElementChild, w = first.getBoundingClientRect().width + gap;
      if (x >= w) { x -= w; tq.append(first); }
      tq.style.transform = `translateX(${-x}px)`;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  // Hold while hovered or focused; click, tap, Enter or Space toggles a lasting pause (WCAG 2.2.2) without a visible button.
  let hov = false, foc = false, stop = false;
  const sync = () => { hold = hov || foc || stop; };
  view.addEventListener('mouseenter', () => { hov = true; sync(); }); view.addEventListener('mouseleave', () => { hov = false; sync(); });
  view.addEventListener('focusin', () => { foc = true; sync(); }); view.addEventListener('focusout', () => { foc = false; sync(); });
  view.addEventListener('click', () => { stop = !stop; sync(); });
  view.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stop = !stop; sync(); } });
})();
