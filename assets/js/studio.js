/* The same 1,500 particles scatter, orbit, and assemble throughout the sequence. */
(()=>{
  'use strict';
  const canvas=document.querySelector('#signalCanvas');
  const ctx=canvas?.getContext('2d');
  const button=document.querySelector('.motion-toggle');
  const label=document.querySelector('#formationName');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const COUNT=1500,TAU=Math.PI*2,INTRO=4.3,CYCLE=22;
  const fract=n=>n-Math.floor(n);
  const rand=n=>fract(Math.sin(n*127.1+311.7)*43758.5453);
  const clamp=n=>Math.max(0,Math.min(1,n));
  const ease=n=>{const t=clamp(n);return t*t*(3-2*t)};
  const mix=(a,b,t)=>a+(b-a)*t;
  const blend=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:mix(a.z,b.z,t)});
  let paused=reduced.matches,visible=false,frame=0,time=reduced.matches?INTRO:0,last=0,w=0,h=0;

  // Hold at both ends of the cycle so the wrap occurs inside a stationary logo.
  const timeline=[
    {mode:'hold',form:'logo',duration:1.4},
    {mode:'transition',from:'logo',to:'hand',duration:4},
    {mode:'hold',form:'hand',duration:3},
    {mode:'transition',from:'hand',to:'ball',duration:4},
    {mode:'hold',form:'ball',duration:4.2},
    {mode:'transition',from:'ball',to:'logo',duration:4},
    {mode:'hold',form:'logo',duration:1.4}
  ];
  function sceneAt(t){
    if(t<INTRO)return {mode:'intro',elapsed:t};
    let elapsed=(t-INTRO)%CYCLE;
    for(const scene of timeline){
      if(elapsed<scene.duration)return {...scene,elapsed};
      elapsed-=scene.duration;
    }
    return {mode:'hold',form:'logo',duration:1.4,elapsed:0};
  }

  const logo=[],hand=[],ball=[];
  const mask=document.createElement('canvas');
  mask.width=mask.height=200;
  const m=mask.getContext('2d');
  // Original SVG geometry: rounded square, square cutout, and angled cutout.
  const slash=new Path2D('M148.886719 28.773438 L108.304688 111.640625 C108.007812 112.214844 107.21875 112.386719 106.59375 112.011719 L92.941406 106.632812 C92.398438 106.308594 92.15625 105.679688 92.375 105.160156 L126.933594 19.738281 C127.167969 19.1875 127.847656 18.945312 128.472656 19.195312 L148.152344 27.132812 C148.851562 27.410156 149.195312 28.175781 148.886719 28.773438 Z');
  for(let y=2;y<187;y+=2.5)for(let x=2;x<187;x+=2.5){
    const rx=Math.max(26.18-x,0,x-160.82),ry=Math.max(26.18-y,0,y-160.82);
    if(rx*rx+ry*ry>26.18**2||(x>=37.8125&&x<=107.9375&&y>=97.953125&&y<=168.078125)||m.isPointInPath(slash,x,y))continue;
    logo.push({x:(x-93.5)/86,y:(y-93.5)/86,z:0});
  }

  // Four fingers plus one thumb, with open gaps and a tapered wrist.
  m.fillStyle='#fff';
  m.beginPath();m.moveTo(62,86);m.lineTo(147,86);m.lineTo(143,130);
  m.quadraticCurveTo(140,147,128,155);m.lineTo(128,192);m.lineTo(79,192);
  m.lineTo(77,155);m.quadraticCurveTo(60,143,60,123);m.closePath();m.fill();
  m.strokeStyle='#fff';m.lineCap='round';
  const fingers=[
    [68,98,64,40,10], [92,94,91,17,10],
    [116,94,117,25,10], [138,99,145,52,9],
    [68,124,29,90,12]
  ];
  for(const [x1,y1,x2,y2,r] of fingers){
    m.lineWidth=r*2;m.beginPath();m.moveTo(x1,y1);m.lineTo(x2,y2);m.stroke();
  }
  const pixels=m.getImageData(0,0,200,200).data;
  for(let y=7;y<196;y+=2)for(let x=8;x<190;x+=2){
    if(pixels[(y*200+x)*4+3]>128)hand.push({x:(x-99)/88,y:(y-103)/91,z:0});
  }
  for(let i=0;i<COUNT;i++){
    const y=1-2*(i+.5)/COUNT,a=i*Math.PI*(3-Math.sqrt(5)),r=Math.sqrt(1-y*y);
    ball.push({x:r*Math.cos(a),y,z:r*Math.sin(a)});
  }
  const samples={logo,hand,ball};
  const targets={};
  for(const name of Object.keys(samples)){
    const list=samples[name];
    targets[name]=Array.from({length:COUNT},(_,i)=>{
      // A stable permutation disperses neighboring particles into different parts of each form.
      const j=name==='hand'?(i*947)%COUNT:i;
      return list[Math.floor((j+rand(i+8))*list.length/COUNT)];
    });
  }

  function wave(t){
    return .21*Math.sin(TAU*2*t)*Math.sin(Math.PI*t);
  }
  function bounce(t){
    if(t>=1)return 0;
    const u=fract(clamp(t)*3);
    // Three equal ballistic arcs. The third landing immediately releases the particles.
    return -.88*4*u*(1-u);
  }
  function formed(name,i,t=0){
    const p=targets[name][i];
    if(name==='hand'){
      const a=wave(t),x=p.x-.12,y=p.y-.8;
      return {x:.12+x*Math.cos(a)-y*Math.sin(a),y:.8+x*Math.sin(a)+y*Math.cos(a),z:.055*Math.sin(TAU*t)*Math.sin(Math.PI*t)};
    }
    if(name==='ball'){
      const a=.3+ease(t)*.8,c=Math.cos(a),s=Math.sin(a);
      return {x:.78*(p.x*c-p.z*s),y:.78*p.y+.28+bounce(t),z:.78*(p.x*s+p.z*c)};
    }
    return p;
  }

  // Each burst exits along an outward path, then joins an orbit with matching velocity.
  const flights={};
  for(const name of ['logo','hand','ball']){
    flights[name]=Array.from({length:COUNT},(_,i)=>{
      const start=formed(name,i,name==='ball'?1:0);
      return {
        start,angle:Math.atan2(start.y/.76,start.x)+(rand(i+90)-.5)*.35,
        outer:1.8+rand(i+46)*.3,inner:1.15+rand(i+232)*.45,
        speed:2.5+rand(i+17)*.7,depth:.18+rand(i+501)*.25,
        offset:rand(i+81)*TAU,delay:rand(i+212)*.2
      };
    });
  }
  function orbit(f,t){
    const r=mix(f.outer,f.inner,ease(t/1.5)),a=f.angle+t*f.speed;
    return {x:Math.cos(a)*r,y:Math.sin(a)*r*.76,z:Math.sin(a+f.offset)*f.depth};
  }
  function orbitVelocity(f,t){
    const a=f.angle+t*f.speed;
    return {x:-Math.sin(a)*f.outer*f.speed,y:Math.cos(a)*f.outer*.76*f.speed,z:Math.cos(a+f.offset)*f.depth*f.speed};
  }
  function scatter(f,t,impact){
    const u=clamp(t/1.2),u2=u*u,u3=u2*u,end=orbit(f,0),v=orbitVelocity(f,0);
    const startVelocity={x:f.start.x*.8,y:f.start.y*.6+(impact ? .7 : 0),z:Math.sin(f.offset)*.4};
    const result={};
    for(const axis of ['x','y','z']){
      result[axis]=(2*u3-3*u2+1)*f.start[axis]+(u3-2*u2+u)*1.2*startVelocity[axis]+(-2*u3+3*u2)*end[axis]+(u3-u2)*1.2*v[axis];
    }
    return result;
  }
  function position(i,scene){
    if(scene.mode==='hold')return formed(scene.form,i,scene.elapsed/scene.duration);
    if(scene.mode==='intro'){
      const f=flights.logo[i],orbital=orbit(f,scene.elapsed);
      return blend(orbital,targets.logo[i],ease((scene.elapsed-2.1)/2.2));
    }
    const f=flights[scene.from][i],s=scene.elapsed;
    if(s<1.2)return scatter(f,s,scene.from==='ball');
    const orbital=orbit(f,s-1.2);
    if(s<2.7+f.delay)return orbital;
    return blend(orbital,formed(scene.to,i),ease((s-2.7-f.delay)/(1.3-f.delay)));
  }
  function caption(scene){
    if(scene.mode==='intro')return 'Nanotechnology / assembling';
    if(scene.mode==='transition')return 'Nanotechnology / transforming';
    return {logo:'Jan / signature',hand:'Hello / in motion',ball:'Energy / in motion'}[scene.form];
  }

  // Cache the soft halo; avoid calculating a canvas shadow for every particle every frame.
  const glow=document.createElement('canvas');glow.width=glow.height=24;
  const g=glow.getContext('2d'),halo=g.createRadialGradient(12,12,1,12,12,12);
  halo.addColorStop(0,'rgba(248,252,255,.8)');halo.addColorStop(.3,'rgba(241,249,255,.22)');halo.addColorStop(1,'rgba(241,249,255,0)');
  g.fillStyle=halo;g.fillRect(0,0,24,24);g.fillStyle='#fcfdff';g.fillRect(9.5,9.5,5,5);
  const sizes=Array.from({length:COUNT},(_,i)=>1.5+rand(i+82)*.8);
  function project(p,scale){
    const perspective=5/(5+p.z);
    return {x:w*.5+p.x*scale*perspective,y:h*.45+p.y*scale*perspective,perspective};
  }
  function draw(){
    if(!ctx||!w||!h)return;
    ctx.clearRect(0,0,w,h);
    const scene=sceneAt(time),scale=Math.min(w,h)*.27;
    const moving=scene.mode==='intro'||scene.mode==='transition';
    const previous=moving?sceneAt(Math.max(0,time-.025)):null;
    ctx.lineWidth=.65;ctx.strokeStyle='rgba(245,251,255,.18)';
    if(scene.mode==='hold'&&scene.form==='ball'){
      const height=-bounce(scene.elapsed/scene.duration),radius=scale*(.55-height*.18);
      ctx.fillStyle='rgba(245,250,255,'+(.09-height*.055)+')';
      ctx.beginPath();ctx.ellipse(w*.5,h*.45+scale*1.12,radius,scale*.035,0,0,TAU);ctx.fill();
    }
    const projected=[];
    if(previous)ctx.beginPath();
    for(let i=0;i<COUNT;i++){
      const p=project(position(i,scene),scale);
      projected.push(p);
      if(previous){
        const q=project(position(i,previous),scale);
        ctx.moveTo(q.x,q.y);ctx.lineTo(p.x,p.y);
      }
    }
    if(previous)ctx.stroke();
    for(let i=0;i<COUNT;i++){
      const p=projected[i];
      const size=sizes[i]*p.perspective*4.8;
      ctx.globalAlpha=.9+.1*Math.sin(time*1.8+i*1.73)**2;
      ctx.drawImage(glow,p.x-size/2,p.y-size/2,size,size);
      ctx.globalAlpha=1;
    }
    const text=caption(scene);if(label.textContent!==text)label.textContent=text;
    canvas.dataset.formation=scene.mode==='hold'?scene.form:'transition';
    canvas.dataset.phase=scene.mode==='transition'?(scene.elapsed<1.2?'scatter':scene.elapsed<2.7?'swirl':'assemble'):scene.mode;
  }
  function running(){
    return !paused&&visible&&!document.hidden&&!document.documentElement.classList.contains('entry-pending');
  }
  function loop(now){
    frame=0;
    time+=Math.min(.05,Math.max(0,(now-last)/1000));last=now;draw();
    if(running())frame=requestAnimationFrame(loop);
  }
  function sync(){
    cancelAnimationFrame(frame);frame=0;last=performance.now();
    button.textContent=paused?'Play motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));
    draw();if(running())frame=requestAnimationFrame(loop);
  }
  if(ctx){
    new ResizeObserver(()=>{
      const r=canvas.getBoundingClientRect();w=r.width;h=r.height;
      const d=Math.min(devicePixelRatio,2);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
      ctx.setTransform(d,0,0,d,0,0);sync();
    }).observe(canvas);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()}).observe(canvas);
    button.addEventListener('click',()=>{paused=!paused;sync()});
    reduced.addEventListener('change',()=>{paused=reduced.matches;if(paused)time=INTRO;sync()});
    document.addEventListener('visibilitychange',sync);
    document.addEventListener('portfolio:entered',sync);sync();
  }
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting){if(!reduced.matches)e.target.classList.add('reveal-in');observer.unobserve(e.target)}
  }),{threshold:.12});
  document.querySelectorAll('.pcard,.timeline-item,.selected-feature,.svc-card,.page-closing').forEach(el=>observer.observe(el));
})();
