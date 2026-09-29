(() => {
  'use strict';
  const hero = document.querySelector('.svc-hero');
  const logo = document.getElementById('serviceLogo');
  if (!hero || !logo) return;
  const slot = hero.querySelector('.svc-logo-slot');
  const area = hero.querySelector('.svc-logo-playground');
  const image = logo.querySelector('img');
  const toggle = slot.querySelector('button');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const inset = 12, danger = 72, giveUpDelay = 2200;
  let paused = reduced.matches, visible = false, ready = false;
  let x = 0, y = 0, homeX = 0, homeY = 0, maxX = 0, maxY = 0;
  let frame = 0, last = 0, lastChase = 0, idleSince = 0;
  let state = 'idle', previousPointer = null;
  const clamp = (v, max) => Math.max(inset, Math.min(max, v));
  const paint = () => { logo.style.transform = `translate3d(${x}px, ${y}px, 0)`; };
  const running = () => visible && ready && !paused && !reduced.matches && !document.hidden;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousPointer = null;
  }
  function start() {
    if (running() && !frame) {
      last = performance.now();
      frame = requestAnimationFrame(animate);
    }
  }
  function resize() {
    const bounds = area.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    maxX = Math.max(inset, bounds.width - logo.offsetWidth - inset);
    maxY = Math.max(inset, bounds.height - logo.offsetHeight - inset);
    const origin = slot.getBoundingClientRect();
    homeX = clamp(origin.left - bounds.left + (origin.width - logo.offsetWidth) / 2, maxX);
    homeY = clamp(origin.top - bounds.top + (origin.height - logo.offsetHeight) / 2, maxY);
    if (!ready || state === 'idle') {
      x = homeX; y = homeY; state = 'idle'; idleSince = performance.now();
    }
    ready = true;
    x = clamp(x, maxX); y = clamp(y, maxY);
    paint(); start();
  }
  function animate(now) {
    frame = 0;
    if (!running()) return;
    const elapsed = Math.min(now - last, 40);
    last = now;
    if (state === 'chasing' && now - lastChase >= giveUpDelay) state = 'returning';
    if (state === 'returning') {
      const blend = 1 - Math.exp(-elapsed / 125);
      x += (homeX - x) * blend; y += (homeY - y) * blend;
      if (Math.hypot(homeX - x, homeY - y) < 0.5) {
        x = homeX; y = homeY; state = 'idle'; idleSince = now;
      }
    }
    if (state === 'idle') {
      // A repeating hop, with its lowest point at the original resting position.
      x = homeX;
      y = clamp(homeY - 22 * Math.abs(Math.sin((now - idleSince) * Math.PI / 900)), maxY);
    }
    paint();
    frame = requestAnimationFrame(animate);
  }

  hero.addEventListener('pointermove', event => {
    if (!running() || event.pointerType !== 'mouse') return;
    const now = performance.now();
    const rect = image.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
    const dx = Math.max(rect.left - event.clientX, 0, event.clientX - rect.right);
    const dy = Math.max(rect.top - event.clientY, 0, event.clientY - rect.bottom);
    // Predict fast approaches, but cap anticipation so distant movement stays harmless.
    const dt = previousPointer ? Math.max(8, now - previousPointer.time) : 16;
    const predictX = event.clientX + (previousPointer ? Math.max(-90, Math.min(90, (event.clientX - previousPointer.x) * 35 / dt)) : 0);
    const predictY = event.clientY + (previousPointer ? Math.max(-90, Math.min(90, (event.clientY - previousPointer.y) * 35 / dt)) : 0);
    previousPointer = {x:event.clientX, y:event.clientY, time:now};
    const predictedDistance = Math.hypot(Math.max(rect.left - predictX, 0, predictX - rect.right), Math.max(rect.top - predictY, 0, predictY - rect.bottom));
    if (Math.min(Math.hypot(dx, dy), predictedDistance) > danger) return;
    lastChase = now;
    state = 'chasing';
    const away = Math.atan2(centerY - event.clientY, centerX - event.clientX);
    let bestScore = -Infinity, nextX = x, nextY = y;
    const candidates = [];
    for (let i = 0; i < 16; i++) {
      const angle = away + i * Math.PI / 8;
      candidates.push([clamp(x + Math.cos(angle) * 330, maxX), clamp(y + Math.sin(angle) * 330, maxY)]);
    }
    // Corner fallbacks guarantee a way out when pursued against the section boundary.
    candidates.push([inset,inset], [maxX,inset], [inset,maxY], [maxX,maxY]);
    for (const [cx, cy] of candidates) {
      const moveX = cx - x, moveY = cy - y;
      const clearance = (mx, my) => Math.hypot(
        Math.max(rect.left + moveX - mx, 0, mx - rect.right - moveX),
        Math.max(rect.top + moveY - my, 0, my - rect.bottom - moveY));
      const safety = Math.min(clearance(event.clientX, event.clientY), clearance(predictX, predictY));
      const travel = Math.hypot(moveX, moveY);
      const score = Math.min(safety, 230) - travel * 0.12;
      if (safety > danger + 30 && score > bestScore) {
        bestScore = score; nextX = cx; nextY = cy;
      }
    }
    // Move immediately: easing and animation lockouts let the cursor catch the logo.
    x = nextX; y = nextY; paint();
  });
  hero.addEventListener('pointerleave', () => { previousPointer = null; });

  function syncToggle() {
    toggle.textContent = reduced.matches ? 'Reduced motion' : paused ? 'Play motion' : 'Pause motion';
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.disabled = reduced.matches;
    if (paused) stop(); else start();
  }
  toggle.addEventListener('click', () => { paused = !paused; syncToggle(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; syncToggle(); });
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    logo.classList.toggle('is-visible', visible);
    if (visible) resize(); else { stop(); ready = false; }
  }).observe(hero);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  resize(); syncToggle();
})();
