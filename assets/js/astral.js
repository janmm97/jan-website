/* The Observatory, site-wide (Jan, 2026-10-15).
 * Autonomous starlight drift, film grain, clip-and-rise reveals, sky parallax,
 * the approval orbit, model marks, About swarm and route films.
 * Mission Control has its own continuous renderer in mission.js.
 * Reduced motion: composed stills, no travel; films show their poster. */
(()=>{
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),narrow=matchMedia('(max-width:740px)'),fine=matchMedia('(pointer:fine)');
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const ROUTES=['home','about','projects','services','blog','contact'];
  const routeNow=()=>{const h=(location.hash||'').replace(/^#\/?/,'').replace(/\/$/,'').toLowerCase();return ROUTES.includes(h)?h:'home';};
  const html=document.documentElement;html.classList.add('astral');
  const isPost=html.classList.contains('blog-post');
  let current=isPost?'blog':routeNow();
  if(window.gsap&&window.CustomEase){gsap.registerPlugin(CustomEase);if(!CustomEase.get('site-expo'))CustomEase.create('site-expo','.16,1,.3,1');}

  /* ---------- 1. starfield ---------- */
  const sky=(()=>{
    const haze=document.createElement('div');haze.className='sky-haze';haze.setAttribute('aria-hidden','true');document.body.prepend(haze);
    const c=document.createElement('canvas');c.className='sky-field';c.setAttribute('aria-hidden','true');document.body.prepend(c);
    const gl=c.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true});
    if(!gl){c.remove();return null;}
    const VS=`precision highp float;attribute vec4 aS;uniform float uZ;uniform float uAspect;uniform float uPx;uniform float uAlpha;uniform vec2 uLook;varying float vA;varying float vT;
      void main(){float z=mod(aS.z-uZ,64.)+.35;vec2 p=(aS.xy-uLook*(1.+z*.015))/z*1.7;gl_Position=vec4(p.x/uAspect,p.y,0.,1.);
      float near=1.-z/64.;gl_PointSize=uPx*(.55+aS.w*1.25)*(.5+near*near*2.3);vT=fract(aS.w*7.31);
      vA=uAlpha*(.16+.84*aS.w)*smoothstep(.35,4.,z)*smoothstep(64.,44.,z)*(.3+.7*near);}`;
    const FS=`precision mediump float;varying float vA;varying float vT;void main(){float d=length(gl_PointCoord-.5);float a=vA*(1.-smoothstep(.3,.5,d));
      vec3 ink=vec3(.949,.957,.973);vec3 star=vec3(.624,.847,1.);vec3 col=mix(ink,star,step(.62,vT));gl_FragColor=vec4(col*a,a);}`;
    const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o;};
    const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,VS));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){c.remove();return null;}
    gl.useProgram(p);
    const n=narrow.matches?1700:3600,data=new Float32Array(n*4);let s=11;const r=()=>(s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296;
    for(let i=0;i<n;i++)data.set([(r()*2-1)*17,(r()*2-1)*10.5,r()*64,Math.pow(r(),2.3)],i*4);
    const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(p,'aS');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,4,gl.FLOAT,false,0,0);
    const u={};['uZ','uAspect','uPx','uAlpha','uLook'].forEach(k=>u[k]=gl.getUniformLocation(p,k));
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    const st={travel:ROUTES.indexOf(current)*16,alpha:current==='home'?.85:.72,lx:0,ly:0,tlx:0,tly:0};
    let w=0,h=0,raf=0,last=0,drift=0;
    function draw(now){
      raf=0;if(document.hidden)return;const dt=Math.min(.05,(now-(last||now))/1000);last=now;
      const dpr=Math.min(devicePixelRatio||1,1.5),rw=Math.round(innerWidth*dpr),rh=Math.round(innerHeight*dpr);
      if(rw!==w||rh!==h){w=rw;h=rh;c.width=w;c.height=h;gl.viewport(0,0,w,h);}
      const k=reduced.matches?1:1-Math.exp(-dt*3.5);st.lx+=(st.tlx-st.lx)*k;st.ly+=(st.tly-st.ly)*k;
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      if(!reduced.matches)drift+=dt*.12;
      gl.uniform1f(u.uZ,st.travel+(reduced.matches?0:drift+scrollY*.0045));gl.uniform1f(u.uAspect,w/h);gl.uniform1f(u.uPx,dpr);gl.uniform1f(u.uAlpha,st.alpha);gl.uniform2f(u.uLook,st.lx,st.ly);
      gl.drawArrays(gl.POINTS,0,n);
      if(!reduced.matches)request();else last=0;
    }
    function request(){if(!raf)raf=requestAnimationFrame(draw);}
    function travelTo(route){
      const z=ROUTES.indexOf(route)*16,a=route==='home'?.85:.72;
      if(reduced.matches||!window.gsap){st.travel=z;st.alpha=a;request();return;}
      gsap.to(st,{travel:z,alpha:a,duration:1.6,ease:'site-expo',overwrite:true,onUpdate:request});
    }
    addEventListener('scroll',request,{passive:true});addEventListener('resize',request);
    document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden)request();});
    reduced.addEventListener('change',()=>{last=0;request();});
    request();
    return {travelTo,request};
  })();

  /* ---------- 2. ambient grain ---------- */
  const grain=document.createElement('div');grain.className='sky-grain';grain.setAttribute('aria-hidden','true');document.body.append(grain);
  /* ---------- 3. reveals ---------- */
  const REVEAL=['.page h2','.gate-head > *','.gate-steps li','.orbit-head > *','.orbit-credit','.selected-head','.selected-feature > div','.page-closing > *',
    '.about-h3','.about-story > p','.about-h3-section','.timeline-item','.about-cta','.svc-packages-head > *','.svc-card','.svc-outro',
    '.post-entry','.journal-tools','.contact-intro','.contact-note','.contact-actions','.contact-detail'];
  const revealed=new Set();
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -6% 0px'});
    document.querySelectorAll(REVEAL.join(',')).forEach(el=>{
      if(revealed.has(el)||el.closest('.post-entry h2,.pcard,.sky-hero,.process-viewport,dialog')&&!el.matches('.post-entry'))return;
      if(el.parentElement&&[...revealed].some(r=>r.contains(el)))return;
      revealed.add(el);const sib=[...el.parentElement.children].indexOf(el);el.setAttribute('data-reveal','');el.style.setProperty('--rd',Math.min(sib,4)*70+'ms');io.observe(el);
    });
    html.classList.add('reveal-ready');
  }

  /* ---------- 4. sky parallax ---------- */
  const plx=[...document.querySelectorAll('[data-parallax]')];
  function parallax(){
    if(reduced.matches)return;const vh=innerHeight;
    for(const el of plx){const host=el.parentElement,r=host.getBoundingClientRect();if(!r.height||r.bottom<-60||r.top>vh+60)continue;
      const k=+el.dataset.parallax||.2,d=(r.top+r.height/2-vh/2)*k;el.style.transform='translate3d(0,'+d.toFixed(1)+'px,0)';}
  }

  /* ---------- 5. Home: the Neural Constellation ---------- */
  const hero=document.getElementById('skyHero'),art=hero&&hero.querySelector('.sky-hero-art');
  let ax=0,ay=0,atx=0,aty=0,araf=0;
  function artFrame(){araf=0;ax+=(atx-ax)*.08;ay+=(aty-ay)*.08;
    const fade=hero.getBoundingClientRect(),p=clamp(-fade.top/Math.max(1,fade.height*.8));
    art.style.transform='translate3d('+ax.toFixed(1)+'px,'+(ay+p*120).toFixed(1)+'px,0)';art.style.opacity=(1-p*.9).toFixed(3);
    if(Math.abs(atx-ax)+Math.abs(aty-ay)>.2)araf=requestAnimationFrame(artFrame);}
  const artGo=()=>{if(!araf)araf=requestAnimationFrame(artFrame);};
  if(art&&!reduced.matches){
    if(fine.matches)addEventListener('pointermove',e=>{atx=(e.clientX/innerWidth-.5)*-28;aty=(e.clientY/innerHeight-.5)*-18;artGo();},{passive:true});
  }

  /* ---------- 6. Home: the approval gate orbit ---------- */
  const gate=document.getElementById('approvalGate');
  const gateOrbit=gate&&gate.querySelector('.gate-orbit'),gateStations=gate?[...gate.querySelectorAll('.g-station')]:[],gateSteps=gate?[...gate.querySelectorAll('.gate-steps li')]:[];
  function gateScroll(){
    if(!gate||!gate.offsetParent)return;
    const r=gate.getBoundingClientRect(),vh=innerHeight;
    const p=reduced.matches?1:clamp((vh*.86-r.top)/Math.max(1,r.height+vh*.3));
    gateOrbit.style.setProperty('--gp',p.toFixed(4));
    const lit=Math.floor(p*4+.08);
    gateStations.forEach((s,i)=>s.classList.toggle('is-lit',i<lit||p>=.995));
    gateSteps.forEach((s,i)=>s.classList.toggle('is-lit',i<lit||p>=.995));
  }

  /* ---------- 7. the models, in orbit ---------- */
  (()=>{
    const stage=document.getElementById('orbitStage');if(!stage)return;
    const items=[...stage.querySelectorAll('.orbit-list li')],rings=[...stage.querySelectorAll('.orbit-ring')];
    stage.classList.add('is-live');
    const SPEED=[.15,.085,.05],per=[0,1,2].map(r=>items.filter(li=>+li.dataset.ring===r));
    items.forEach(li=>{const r=+li.dataset.ring,i=per[r].indexOf(li);li._a=i/per[r].length*Math.PI*2+r*.62;li._r=r;li._i=items.indexOf(li);});
    let geo=null,t=0,spin=0,deployAt=-1,visible=false,raf=0,last=0,scrollRef=scrollY;
    function measure(){const r=stage.getBoundingClientRect(),W=r.width,H=r.height,tall=W<740;
      const rx=tall?[W*.23,W*.355,W*.46]:[Math.min(W*.17,250),Math.min(W*.295,430),Math.min(W*.43,620)],tilt=tall?.8:.36,ry=rx.map(x=>Math.min(x*tilt,H*.46*(x/rx[2])));
      geo={rx,ry,cx:W/2,cy:H/2};rings.forEach((el,i)=>{el.style.width=rx[i]*2+'px';el.style.height=ry[i]*2+'px';});}
    function place(now){
      if(!geo)measure();
      const dep=reduced.matches?1:deployAt<0?0:(now-deployAt)/1700;
      for(const li of items){
        const r=li._r,a=li._a+t*SPEED[r]+spin*(1-r*.22),d0=clamp((dep-li._i*.018)/.7),d=d0>=1?1:1-Math.pow(2,-10*d0);
        const front=Math.sin(a),x=geo.cx+geo.rx[r]*Math.cos(a)*d,y=geo.cy+geo.ry[r]*front*d,k=front*.5+.5;
        li.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0) translate(-50%,-50%) scale('+((.6+.4*k)*(.35+.65*d)).toFixed(3)+')';
        li.style.opacity=((.3+.7*k)*d).toFixed(3);li.style.zIndex=front>0?'4':'1';
      }
    }
    function frame(now){raf=0;const dt=Math.min(.05,(now-(last||now))/1000);last=now;
      if(!reduced.matches){t+=dt;const ds=scrollY-scrollRef;scrollRef=scrollY;spin+=ds*.0011;}
      place(now);if(visible&&!reduced.matches&&!document.hidden)raf=requestAnimationFrame(frame);else last=0;}
    const go=()=>{if(!raf)raf=requestAnimationFrame(frame);};
    new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible){if(deployAt<0)deployAt=performance.now();scrollRef=scrollY;go();}},{threshold:.12}).observe(stage);
    new ResizeObserver(()=>{measure();place(performance.now());}).observe(stage);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&visible)go();});
    reduced.addEventListener('change',go);
  })();

  /* ---------- 8. About: the mark swarm ---------- */
  (()=>{
    const fig=document.getElementById('markSwarm'),SD=window.Stardust;if(!fig)return;
    const canvas=fig.querySelector('canvas');let R=null;try{R=SD&&SD.create(canvas);}catch(e){R=null;}
    if(!R){fig.classList.add('is-static');return;}
    const MARKS=[['jan','Jan'],['claude','Claude'],['openai','OpenAI'],['withone','One'],['deepseek','DeepSeek'],['qwen','Qwen'],['antigravity','Antigravity'],
      ['anthropic','Anthropic'],['deepmind','Google DeepMind'],['meta','Meta'],['mistral','Mistral AI'],['xai','xAI'],['nvidia','NVIDIA']];
    const N=narrow.matches?5200:9000;R.setCount(N,29);
    const depth=(x,y,b,r)=>(r()-.5)*.12;
    R.shape('jan',SD.fromLuma(SD.outline(SD.luma(SD.markMap(),220),{inner:.32,gain:1.5}),N,{floor:.05,gamma:1.1,height:.72,seed:3,boost:1,depth}));
    const ready=['jan'];
    MARKS.slice(1).forEach(([slug],i)=>SD.loadImage('assets/images/llm-logos/'+slug+'.png').then(img=>{
      try{R.shape(slug,SD.fromLuma(SD.outline(SD.luma(img,220),{inner:.4,gain:1.4}),N,{floor:.05,gamma:1.1,height:.72,seed:50+i,boost:1,depth}));ready.push(slug);ready.sort((a,b)=>MARKS.findIndex(m=>m[0]===a)-MARKS.findIndex(m=>m[0]===b));}catch(e){}
    }).catch(()=>{}));
    const idx=document.getElementById('swarmIndex'),name=document.getElementById('swarmName');
    const HOLD=1.8,MORPH=1.35;let cur='jan',next='jan',phase=0,clock=0,visible=false,raf=0,last=0,mix=1;
    function label(slug){const i=MARKS.findIndex(m=>m[0]===slug);if(idx)idx.textContent=String(i+1).padStart(2,'0');if(name)name.textContent=MARKS[i][1];}
    function frame(now){raf=0;const dt=Math.min(.05,(now-(last||now))/1000);last=now;
      if(!reduced.matches){clock+=dt;phase+=dt;
        if(cur===next&&phase>HOLD&&ready.length>1){const i=ready.indexOf(cur);next=ready[(i+1)%ready.length];phase=0;}
        if(cur!==next){mix=clamp(phase/MORPH);if(mix>=1){cur=next;mix=1;phase=0;label(cur);}}
      }
      if(R.begin()){const yaw=reduced.matches?0:Math.sin(clock*.32)*.32;
        R.points({yaw,pitch:0,dist:3,focal:2.1,zoom:1},{a:cur,b:next===cur?cur:next,mix:cur===next?1:mix,stagger:.3,arc:.32,time:clock,alpha:1,size:1.7,drift:reduced.matches?0:.006});}
      if(visible&&!reduced.matches&&!document.hidden)raf=requestAnimationFrame(frame);else last=0;}
    const go=()=>{if(!raf)raf=requestAnimationFrame(frame);};
    new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)go();}).observe(fig);
    new ResizeObserver(go).observe(fig);reduced.addEventListener('change',go);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&visible)go();});
  })();

  /* ---------- 9. About: the journey line ---------- */
  const journey=document.querySelector('[data-page=about] .timeline');
  const jItems=journey?[...journey.querySelectorAll('.timeline-item')]:[];
  if(journey)journey.classList.add('is-traced');
  function journeyScroll(){
    if(!journey||!journey.offsetParent)return;const r=journey.getBoundingClientRect(),line=innerHeight*.62;
    journey.style.setProperty('--fill',reduced.matches?'1':clamp((line-r.top)/Math.max(1,r.height)).toFixed(4));
    jItems.forEach(it=>it.classList.toggle('is-lit',reduced.matches||it.getBoundingClientRect().top<line));
  }

  /* ---------- 10. route films ---------- */
  document.querySelectorAll('video.sky-video').forEach(v=>{
    const io=new IntersectionObserver(es=>{
      if(es[0].isIntersecting&&!reduced.matches){if(!v.getAttribute('src')){v.src=(narrow.matches&&v.dataset.srcSmall)||v.dataset.src;}const p=v.play();if(p&&p.catch)p.catch(()=>{});}
      else v.pause();
    },{threshold:.1});io.observe(v);
    reduced.addEventListener('change',()=>{if(reduced.matches)v.pause();});
  });

  /* ---------- routing and scroll ---------- */
  addEventListener('hashchange',()=>{if(isPost)return;const r=routeNow();if(r===current)return;current=r;if(sky)sky.travelTo(r);setTimeout(onScroll,60);});
  let ticking=false;
  function onScroll(){ticking=false;parallax();journeyScroll();gateScroll();if(art&&!reduced.matches)artGo();}
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
  addEventListener('resize',onScroll);onScroll();
})();
