// Home: testimonial loop (pause/prev/next, off under reduced motion) and click-to-load Calendly.
(() => {
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const tq = document.getElementById('tq'), ctl = document.querySelector('.tq-ctl');
  if (tq && ctl) {
    const items = [...tq.children];
    let i = 0, paused = false, t;
    const show = n => { i = (n + items.length) % items.length; items.forEach((el, k) => el.classList.toggle('on', k === i)); };
    const tick = () => { clearInterval(t); if (!paused && !rm.matches) t = setInterval(() => show(i + 1), 7000); };
    const setup = () => { if (rm.matches) { clearInterval(t); tq.classList.remove('loop'); ctl.hidden = true; } else { tq.classList.add('loop'); ctl.hidden = false; show(i); tick(); } };
    const pause = document.getElementById('tq-pause');
    pause.onclick = () => { paused = !paused; pause.setAttribute('aria-pressed', paused); tick(); };
    document.getElementById('tq-prev').onclick = () => { show(i - 1); tick(); };
    document.getElementById('tq-next').onclick = () => { show(i + 1); tick(); };
    tq.addEventListener('focusin', () => clearInterval(t));
    tq.addEventListener('focusout', tick);
    rm.addEventListener('change', setup);
    setup();
  }
  const cal = document.getElementById('cal');
  if (cal) {
    cal.hidden = false;
    document.getElementById('cal-load').onclick = () => {
      const f = document.createElement('iframe');
      f.src = cal.dataset.src; f.title = 'Book a discovery call (Calendly)';
      cal.replaceChildren(f); f.focus();
    };
  }
})();
