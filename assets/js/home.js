// Home: click-to-load Calendly (nothing third-party loads until the visitor asks).
(() => {
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
