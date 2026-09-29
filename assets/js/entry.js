/* A short brand intro. Elapsed time drives progress, never a network request. */
(()=>{
  'use strict';
  const root=document.documentElement,loader=document.getElementById('entryLoader');
  if(!loader||!root.classList.contains('entry-pending'))return;
  const finish=window.__finishPortfolioIntro;
  const started=Number(root.dataset.introStarted);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration=reduced?450:2200,hold=reduced?70:140,fade=reduced?80:240;
  const progress=loader.querySelector('[role="progressbar"]');
  const percent=document.getElementById('loaderPercent'),fill=document.getElementById('loaderFill');
  let frame=0,completed=false,lastValue=-1;
  loader.querySelectorAll('.loader-logo,.loader-shadow').forEach(el=>{
    el.getAnimations().forEach(animation=>{animation.currentTime=Math.max(0,performance.now()-started)});
  });
  document.querySelectorAll('body>header,body>main,body>footer,.skip-link').forEach(el=>{
    if(!el.inert){el.inert=true;el.setAttribute('data-intro-inert','')}
  });
  function tick(){
    if(!root.classList.contains('entry-pending'))return;
    const elapsed=performance.now()-started;
    const value=Math.min(100,Math.floor(elapsed/duration*100));
    if(value!==lastValue){
      lastValue=value;percent.textContent=value+'%';
      progress.setAttribute('aria-valuenow',String(value));
      fill.style.transform='scaleX('+value/100+')';
    }
    if(value===100&&!completed){
      completed=true;loader.classList.add('is-complete');
    }
    if(elapsed>=duration+hold)loader.classList.add('is-leaving');
    if(elapsed>=duration+hold+fade){finish();return}
    frame=requestAnimationFrame(tick);
  }
  document.addEventListener('portfolio:entered',()=>cancelAnimationFrame(frame),{once:true});
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&root.classList.contains('entry-pending')){
      cancelAnimationFrame(frame);tick();
    }
  });
  tick();
})();
