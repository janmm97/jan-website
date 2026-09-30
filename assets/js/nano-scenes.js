/* One persistent particle pool assembles seven independent logo masks. */
(()=>{
  'use strict';
  const TAU=Math.PI*2;
  const fract=n=>n-Math.floor(n);
  const rand=n=>fract(Math.sin(n*127.1+311.7)*43758.5453);
  const lerp=(a,b,t)=>a+(b-a)*t;
  const clamp=n=>Math.max(0,Math.min(1,n));
  const smooth=n=>{const t=clamp(n);return t*t*t*(t*(t*6-15)+10)};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const COUNT=2700,INTRO=3.4,HOLD=2.5,BURST=.85,DRIFT=1.15,ASSEMBLE=3.4;
  const TRANSITION=BURST+DRIFT+ASSEMBLE,STEP=HOLD+TRANSITION;
  const assets=[
    {name:'Personal logo',src:'assets/images/websitelogo-blackbg1.svg',light:true},
    {name:'Claude',src:'assets/images/nano-logos/claude.svg'},
    {name:'ChatGPT',src:'assets/images/nano-logos/openai.svg'},
    {name:'DeepSeek',src:'assets/images/nano-logos/deepseek.svg'},
    {name:'Qwen',src:'assets/images/nano-logos/qwen.svg'},
    {name:'Antigravity',src:'assets/images/nano-logos/antigravity.svg'},
    {name:'WithOne',src:'assets/images/nano-logos/withone.svg'}
  ];

  async function sampleLogo(asset,index){
    const img=new Image();img.src=asset.src;await img.decode();
    const mask=document.createElement('canvas');mask.width=mask.height=400;
    const context=mask.getContext('2d',{willReadFrequently:true});
    context.drawImage(img,0,0,400,400);
    const pixels=context.getImageData(0,0,400,400).data,candidates=[];
    let left=400,top=400,right=0,bottom=0;
    for(let y=0;y<400;y++)for(let x=0;x<400;x++){
      const offset=(y*400+x)*4;
      // The personal SVG has black cutouts over white; the others have transparent backgrounds.
      if(pixels[offset+3]<180||(asset.light&&pixels[offset]<180))continue;
      candidates.push([x,y]);left=Math.min(left,x);right=Math.max(right,x);
      top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    if(!candidates.length)throw new Error('Empty particle mask: '+asset.name);
    const scale=2.12/Math.max(right-left,bottom-top),cx=(left+right)/2,cy=(top+bottom)/2;
    const targets=Array.from({length:COUNT},(_,i)=>{
      // Stratification covers thin strokes and negative spaces even on small screens.
      const [x,y]=candidates[Math.floor((i+rand(i+index*COUNT+1))*candidates.length/COUNT)];
      return {x:(x-cx)*scale,y:(y-cy)*scale,z:0};
    });
    // Independent permutations prevent rows moving together during reconstruction.
    for(let i=COUNT-1;i>0;i--){
      const j=Math.floor(rand(i+index*COUNT+71)*(i+1));
      [targets[i],targets[j]]=[targets[j],targets[i]];
    }
    return targets;
  }

  function logoSequence(targets){
    const particles=Array.from({length:COUNT},(_,i)=>{
      const angle=rand(i*7+1)*TAU,z=rand(i*7+2)*2-1,r=Math.sqrt(1-z*z);
      return {i,seed:rand(i*7+3),brightness:.84+.16*rand(i*7+4),
        angle,radius:.7+.3*rand(i*7+5),radial:r,depth:z,
        spin:(rand(i*7+6)>.5?1:-1)*(.2+.25*rand(i*7+7))};
    });
    function pose(t){
      if(t<INTRO)return {intro:true,from:0,to:0,elapsed:t,phase:'assemble'};
      const loop=(t-INTRO)%(STEP*assets.length),from=Math.floor(loop/STEP),elapsed=loop-from*STEP;
      return {from,to:(from+1)%assets.length,elapsed:elapsed-HOLD,
        phase:elapsed<HOLD?'hold':elapsed<HOLD+BURST?'explode':elapsed<HOLD+BURST+DRIFT?'scatter':'assemble'};
    }
    function scatter(p,t,cycle){
      // Bounded 3D drift keeps the entire cloud visible inside the original canvas.
      const a=p.angle+cycle*.73+p.spin*t;
      return {x:Math.cos(a)*p.radial*p.radius*1.48,
        y:Math.sin(a)*p.radial*p.radius*1.36,
        z:p.depth*p.radius*1.15+.08*Math.sin(a+t*.6)};
    }
    const blend=(a,b,t)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),z:lerp(a.z,b.z,t)});
    function position(p,scene){
      const source=targets[scene.from][p.i];
      if(scene.phase==='hold')return source;
      if(scene.intro){
        const u=clamp((scene.elapsed-p.seed*.55)/(INTRO-.55));
        return blend(scatter(p,scene.elapsed,-1),source,smooth(u));
      }
      const t=scene.elapsed;
      const loose=scatter(p,t,scene.from);
      if(t<BURST){
        // Fast release from the actual source coordinates, with a staggered impulse.
        const u=clamp((t-p.seed*.1)/(BURST-.1));
        return blend(source,loose,1-(1-u)**3);
      }
      if(t<BURST+DRIFT)return loose;
      // Different capture times and curved drift make the approach magnetic rather than a dissolve.
      const u=clamp((t-BURST-DRIFT-p.seed*.65)/(ASSEMBLE-.65));
      return blend(loose,targets[scene.to][p.i],smooth(u));
    }
    return {particles,pose,position,width:3.7,height:3.45,kind:'logos',stillTime:INTRO};
  }

  const sprite=document.createElement('canvas');sprite.width=sprite.height=24;
  const g=sprite.getContext('2d'),halo=g.createRadialGradient(12,12,1,12,12,12);
  halo.addColorStop(0,'rgba(248,252,255,.85)');halo.addColorStop(.3,'rgba(241,249,255,.2)');halo.addColorStop(1,'rgba(241,249,255,0)');
  g.fillStyle=halo;g.fillRect(0,0,24,24);g.fillStyle='#fcfdff';g.fillRect(9.5,9.5,5,5);

  function mount(id,model){
    const canvas=document.getElementById(id),ctx=canvas?.getContext('2d');
    if(!ctx)return;
    const button=canvas.parentElement.querySelector('.motion-toggle');
    let paused=reduced.matches,visible=false,time=reduced.matches?model.stillTime:0,last=0,frame=0,w=0,h=0;
    function draw(){
      if(!w||!h)return;
      ctx.clearRect(0,0,w,h);
      const scale=Math.min(w/model.width,h/model.height),cx=w*.5,cy=h*.5;
      const pose=model.pose(time);
      canvas.dataset.formation=assets[pose.phase==='hold'?pose.from:pose.to].name;
      canvas.dataset.phase=pose.phase;
      for(const p of model.particles){
        const v=model.position(p,pose),depth=5/(5-(v.z||0));
        const size=(1.05+p.seed*.6)*4.8*depth;
        ctx.globalAlpha=p.brightness*(.9+.1*Math.sin(time*2+p.seed*TAU)**2);
        ctx.drawImage(sprite,cx+v.x*scale*depth-size/2,cy+v.y*scale*depth-size/2,size,size);
      }
      ctx.globalAlpha=1;
    }
    function running(){return !paused&&visible&&!document.hidden&&!document.documentElement.classList.contains('entry-pending')}
    function loop(now){
      frame=0;time+=Math.min(.05,Math.max(0,(now-last)/1000));last=now;draw();
      if(running())frame=requestAnimationFrame(loop);
    }
    function sync(){
      cancelAnimationFrame(frame);frame=0;last=performance.now();
      button.textContent=paused?'Play motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));
      draw();if(running())frame=requestAnimationFrame(loop);
    }
    new ResizeObserver(()=>{
      const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;
      const d=Math.min(devicePixelRatio,2);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
      ctx.setTransform(d,0,0,d,0,0);sync();
    }).observe(canvas);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()}).observe(canvas);
    button.addEventListener('click',()=>{paused=!paused;sync()});
    reduced.addEventListener('change',()=>{paused=reduced.matches;if(paused)time=model.stillTime;sync()});
    document.addEventListener('visibilitychange',sync);document.addEventListener('portfolio:entered',sync);
    sync();
  }
  if(document.getElementById('moonwalkCanvas')){
    Promise.all(assets.map(sampleLogo)).then(targets=>mount('moonwalkCanvas',logoSequence(targets))).catch(error=>{
      console.error('Unable to prepare About logo particles:',error);
      const canvas=document.getElementById('moonwalkCanvas');
      canvas.setAttribute('aria-label','Personal logo');
      const ctx=canvas.getContext('2d'),img=new Image();
      img.onload=()=>{
        const size=Math.min(canvas.width,canvas.height)*.7;
        ctx.drawImage(img,(canvas.width-size)/2,(canvas.height-size)/2,size,size);
      };
      img.src=assets[0].src;
      const button=canvas.parentElement.querySelector('.motion-toggle');
      button.textContent='Motion unavailable';button.disabled=true;
    });
  }
})();
