/* Mission Control: seeded 3D point instrument. Local illustration, no network or real actions.
   Continuous, autonomous orbit and workflow sequence; no pointer or stage controls.
   Stops offscreen, in background tabs, and immediately for reduced motion. */
(() => {
  'use strict';
  const art = document.querySelector('.mission-art');
  if (!art) return;
  const canvas = art.querySelector('canvas'), viewport = art.querySelector('.mission-viewport');
  const ctx = canvas.getContext('2d', { alpha: true });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const steps = [...art.querySelectorAll('.mission-step')];
  const detail = art.querySelector('.mission-detail');
  const descriptions = [
    'Dry-run every write. See what the agent plans to change before anything happens.',
    'Approve the exact payload. You decide what gets permission to act.',
    'Run it once. The approved action moves into your connected workflow.',
    'Read the result back. Check what actually happened in the connected system.'
  ];
  let stage = 0, raf = 0, visible = false, time = 0, last = 0, intro = 0;
  let width = 1, height = 1, transition = 1, angle = 0;
  const STAGE_SECONDS = 4.8;
  const TAU = Math.PI * 2, INK = '242,244,248', STAR = '159,216,255';
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const ease = v => v >= 1 ? 1 : 1 - Math.pow(2, -10 * v);
  let seed = 97;
  const random = () => ((seed = (Math.imul(seed,1664525) + 1013904223) >>> 0) / 4294967296);
  const stars = Array.from({length:180}, () => ({x:random(),y:random(),r:.35+random()*.65,a:.12+random()*.4}));
  // Hollow spherical shell: negative space at its heart keeps the agent label legible.
  const shell = Array.from({length:2400}, (_,i) => {
    const y = 1 - 2 * (i + .5) / 2400, r = Math.sqrt(1-y*y), a = i * Math.PI * (3-Math.sqrt(5));
    return {x:Math.cos(a)*r,y,z:Math.sin(a)*r,a:.2+random()*.7};
  });
  // Dense, tapered orbital ribbons give the instrument a sculptural silhouette.
  const ribbons = Array.from({length:3200}, (_,i) => {
    const a = random()*TAU, lane = i%3, radial = 1 + (random()-.5)*.085;
    return {a,lane,radial,jitter:(random()-.5)*.02,alpha:.12+random()*.66};
  });
  function advance(index) {
    stage = index; art.dataset.stage = String(index); transition = reduced.matches ? 1 : 0;
    steps.forEach((step,i) => step.classList.toggle('is-active', i === index));
    detail.textContent = descriptions[index];
  }
  if (!ctx) return; // SVG poster and static workflow caption remain visible.
  const colour = (rgb,a) => 'rgba('+rgb+','+clamp(a).toFixed(3)+')';
  function dot(x,y,r,a,rgb=STAR) {
    ctx.fillStyle=colour(rgb,a);ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
  }
  function project(x,y,z) {
    const drift = reduced.matches ? 0 : time * TAU / 36;
    const yaw = -.24 + Math.sin(drift)*.12, pitch = -.13 + Math.sin(drift*.5)*.09;
    const xx = x*Math.cos(yaw)+z*Math.sin(yaw), zz = z*Math.cos(yaw)-x*Math.sin(yaw);
    const yy = y*Math.cos(pitch)-zz*Math.sin(pitch), depth = y*Math.sin(pitch)+zz*Math.cos(pitch);
    const perspective = 3.8/(3.8+depth);
    const unit = Math.min(width*.26,height*.29);
    return {x:width*.50+xx*unit*perspective,y:height*.51+yy*unit*perspective,z:depth,k:perspective};
  }
  function ribbonPoint(a,lane,radial=1,jitter=0) {
    const r=[1.68,1.49,1.83][lane]*radial;
    let x=Math.cos(a)*r,y=Math.sin(a)*r,z=jitter;
    const tilt=[1.12,.45,1.36][lane],spin=[-.37,1.03,.38][lane];
    const yy=y*Math.cos(tilt)-z*Math.sin(tilt),zz=y*Math.sin(tilt)+z*Math.cos(tilt);
    return project(x*Math.cos(spin)-yy*Math.sin(spin),x*Math.sin(spin)+yy*Math.cos(spin),zz);
  }
  function path(points,alpha=.25,rgb=STAR) {
    ctx.strokeStyle=colour(rgb,alpha);ctx.lineWidth=.65;ctx.beginPath();
    points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
  }
  function bezier(p0,p1,p2,p3,t) {
    const u=1-t;
    return {x:u*u*u*p0.x+3*u*u*t*p1.x+3*u*t*t*p2.x+t*t*t*p3.x,
      y:u*u*u*p0.y+3*u*u*t*p1.y+3*u*t*t*p2.y+t*t*t*p3.y};
  }
  function stream(output,lane) {
    const sy=height*(output?.64:.3)+lane*height*.037;
    const p0={x:width*(output?.62:.06),y:output?height*.55:sy};
    const p1={x:width*(output?.78:.23),y:output?height*.52:sy};
    const p2={x:width*(output?.72:.19),y:output?sy:height*.48};
    const p3={x:width*(output?.92:.39),y:output?sy:height*.49};
    const enabled=!output||stage>=2;
    const points=Array.from({length:65},(_,i)=>bezier(p0,p1,p2,p3,i/64));
    path(points,enabled?.22:.07);
    if(!enabled)return;
    for(let i=0;i<20;i++){
      const t=(i/20+time*.075+lane*.07)%1,p=bezier(p0,p1,p2,p3,t);
      dot(p.x,p.y,i%5===0?1.35:.65,(.2+.65*t)*(.4+.6*transition));
    }
  }
  function render() {
    ctx.clearRect(0,0,width,height);
    stars.forEach(s=>dot(s.x*width,s.y*height,s.r,s.a,INK));
    const reveal=reduced.matches?1:ease(clamp(intro/1.1));
    // Quiet coordinate arcs frame the instrument, using crisp lines rather than blur.
    const center=project(0,0,0), radius=Math.min(width*.45,height*.47);
    ctx.strokeStyle=colour(STAR,.11);ctx.lineWidth=.6;
    ctx.beginPath();ctx.arc(center.x,center.y,radius,-2.9,-.48);ctx.stroke();
    ctx.beginPath();ctx.arc(center.x,center.y,radius,.25,2.6);ctx.stroke();
    for(let i=0;i<72;i++){
      const a=i/72*TAU,r=radius,major=i%6===0;
      path([{x:center.x+Math.cos(a)*r,y:center.y+Math.sin(a)*r},
        {x:center.x+Math.cos(a)*(r+(major?5:2)),y:center.y+Math.sin(a)*(r+(major?5:2))}],major?.28:.11);
    }
    for(let lane=0;lane<4;lane++){stream(false,lane);stream(true,lane);}
    // The output gate is visibly closed until the "Run once" stage.
    const gx=width*.75,gy=height*.64,open=stage>=2;
    path([{x:width*.87,y:height*.31},{x:width*.87,y:height*.40},{x:gx,y:gy-height*.06}],stage===1?.7:.2);
    ctx.strokeStyle=colour(STAR,stage===1?.85:.35);ctx.lineWidth=1;
    const gateProgress = stage===2 ? ease(transition) : stage===3 ? 1 : stage===0 ? 1-ease(transition) : 0;
    const gap=height*.045*gateProgress;
    path([{x:gx,y:gy-height*.075},{x:gx,y:gy-gap}],.65);
    path([{x:gx,y:gy+gap},{x:gx,y:gy+height*.075}],.65);
    ctx.strokeRect(gx-4,gy-height*.075-8,8,8);
    const projected=[];
    for(const s of shell){
      const a=angle*.18,x=s.x*Math.cos(a)+s.z*Math.sin(a),z=s.z*Math.cos(a)-s.x*Math.sin(a);
      const p=project(x*.78,s.y*.78,z*.78);
      const edge=clamp(Math.hypot(p.x-center.x,p.y-center.y)/(Math.min(width*.26,height*.29)*.65));
      projected.push({...p,r:.55+p.k*.25,alpha:s.a*(.15+.85*edge)*reveal,ink:p.z<-.3});
    }
    for(const r of ribbons){
      const p=ribbonPoint(r.a+angle*(r.lane===1?-.15:.1),r.lane,r.radial,r.jitter);
      projected.push({...p,r:.42+p.k*.32,alpha:r.alpha*(p.z>0?.38:1)*reveal,ink:r.lane===1&&p.z<0});
    }
    projected.sort((a,b)=>b.z-a.z);
    for(const p of projected)dot(p.x,p.y,p.r,p.alpha,p.ink?INK:STAR);
    // Four fixed stations correspond to the four actual stages, not random nodes.
    const positions=[[-2.68,0],[-.77,1],[.4,0],[2.3,2]];
    positions.forEach(([a,lane],i)=>{
      const p=ribbonPoint(a,lane),active=i===stage,completed=i<stage;
      ctx.strokeStyle=colour(active?STAR:INK,active?.95:completed?.5:.2);ctx.lineWidth=1;
      ctx.strokeRect(p.x-6,p.y-6,12,12);
      dot(p.x,p.y,active?2.5:1.3,active?1:.5,active?INK:STAR);
      if(active){
        const k=8+ease(transition)*7;
        path([{x:p.x-k-4,y:p.y},{x:p.x-k,y:p.y}],.85);
        path([{x:p.x+k,y:p.y},{x:p.x+k+4,y:p.y}],.85);
        path([{x:p.x,y:p.y-k-4},{x:p.x,y:p.y-k}],.85);
        path([{x:p.x,y:p.y+k},{x:p.x,y:p.y+k+4}],.85);
      }
    });
    // Read-back closes the path around the core only in the final stage.
    if(stage===3){
      const points=Array.from({length:100},(_,i)=>ribbonPoint(i/99*TAU*ease(transition),1,1.045));
      path(points,.55);
    }
    art.classList.add('is-rendered');
  }
  function frame(now){
    raf=0;if(!visible||document.hidden)return;
    const dt=Math.min(.05,(now-(last||now))/1000);last=now;
    const moving=!reduced.matches;
    if(moving){
      intro=Math.min(4.8,intro+dt);
      time+=dt;angle+=dt*.12;
      const nextStage=Math.floor(time/STAGE_SECONDS)%4;
      if(nextStage!==stage)advance(nextStage);
      transition=Math.min(1,transition+dt/.85);
    } else {intro=4.8;advance(3);transition=1;angle=.35;}
    render();
    if(moving)wake();else last=0;
  }
  function wake(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(frame);}
  new ResizeObserver(()=>{
    const rect=viewport.getBoundingClientRect();width=rect.width;height=rect.height;
    if(!width||!height)return;
    const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);wake();
  }).observe(viewport);
  new IntersectionObserver(es=>{
    visible=es[0].isIntersecting;
    if(visible){last=0;wake();}else{cancelAnimationFrame(raf);raf=0;last=0;}
  },{threshold:0}).observe(viewport);
  reduced.addEventListener('change',()=>{last=0;wake();});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else wake();
  });
})();
