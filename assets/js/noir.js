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
  view.setAttribute('role', 'group'); view.setAttribute('aria-label', 'Client testimonials, scrolling. Hover, tap or focus to hold.');
  view.tabIndex = 0; // keyboard users hold the loop by focusing it (WCAG 2.2.2)
  // Continuous drift left; once the first card is fully out, it moves to the end. Each quote stays once in the DOM.
  const speed = parseFloat(getComputedStyle(tq).getPropertyValue('--motion-marquee-speed')) || 40; // px per second
  let x = 0, last = 0, hold = false;
  const tick = (t) => {
    const dt = Math.min(t - (last || t), 50) / 1000; last = t;
    if (!hold) {
      x += speed * dt;
      const first = tq.firstElementChild, w = first.offsetWidth + parseFloat(getComputedStyle(tq).columnGap || 0);
      if (x >= w) { x -= w; tq.append(first); }
      tq.style.transform = `translateX(${-x}px)`;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const on = () => { hold = true; }, off = () => { hold = false; };
  view.addEventListener('mouseenter', on); view.addEventListener('mouseleave', off);
  view.addEventListener('focusin', on); view.addEventListener('focusout', off);
})();
