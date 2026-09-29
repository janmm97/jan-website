/* White particle characters, animated through joints and feather motion. */
(()=>{
  'use strict';
  const TAU=Math.PI*2;
  const fract=n=>n-Math.floor(n);
  const rand=n=>fract(Math.sin(n*127.1+311.7)*43758.5453);
  const lerp=(a,b,t)=>a+(b-a)*t;
  const point=(x,y)=>({x,y});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const sampler=document.createElement('canvas').getContext('2d');
  let seed=1;
  function cloud(path,bounds,count){
    const shape=new Path2D(path),points=[];
    for(let attempt=0;points.length<count&&attempt<count*500;attempt++){
      const x=lerp(bounds[0],bounds[2],rand(seed++)),y=lerp(bounds[1],bounds[3],rand(seed++));
      if(sampler.isPointInPath(shape,x,y))points.push({x,y,seed:rand(seed++)});
    }
    return points;
  }
  function ellipse(cx,cy,rx,ry,count){
    return Array.from({length:count},()=>{
      const angle=rand(seed++)*TAU,r=Math.sqrt(rand(seed++));
      return {x:cx+Math.cos(angle)*rx*r,y:cy+Math.sin(angle)*ry*r,seed:rand(seed++)};
    });
  }
  function boneCloud(count,r0,r1,start=0,end=1){
    return Array.from({length:count},()=>({u:lerp(start,end,rand(seed++)),v:rand(seed++)*2-1,r0,r1,seed:rand(seed++)}));
  }
  function onBone(p,a,b){
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1;
    const width=lerp(p.r0,p.r1,p.u)*p.v;
    return {x:lerp(a.x,b.x,p.u)-dy/length*width,y:lerp(a.y,b.y,p.u)+dx/length*width};
  }
  function knee(hip,ankle){
    const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.max(.01,Math.hypot(dx,dy));
    const length=.425,offset=Math.sqrt(Math.max(0,length*length-d*d/4));
    return {x:(hip.x+ankle.x)/2+dy/d*offset,y:(hip.y+ankle.y)/2-dx/d*offset};
  }

  function moonwalker(){
    const particles=[];
    const add=(points,part,brightness=1)=>points.forEach(p=>particles.push({...p,part,brightness}));
    // Open jacket, shirt, profile, and fedora. Negative spaces separate the lapels.
    add(cloud('M-.19 -.73 Q-.3 -.64 -.28 -.4 L-.26 .22 L-.06 .24 L-.015 -.24 L.025 -.69 Z',[-.31,-.75,.03,.25],240),'body',.92);
    add(cloud('M.1 -.69 L.22 -.59 L.17 -.17 L.18 .23 L.065 .2 L.06 -.27 Z',[.05,-.71,.23,.24],115),'body',.92);
    add(cloud('M.025 -.68 L.105 -.65 L.055 -.12 L-.012 -.26 Z',[-.02,-.7,.11,-.1],95),'body');
    add(cloud('M-.15 .17 L.17 .17 L.15 .3 L-.19 .3 Z',[-.2,.16,.18,.31],85),'body',.9);
    add(cloud('M-.005 -1.14 Q.12 -1.2 .19 -1.11 L.19 -1.025 L.245 -1 L.19 -.975 L.17 -.9 Q.1 -.875 .04 -.915 L-.015 -1.015 Z',[-.02,-1.21,.25,-.87],135),'body',.93);
    add(cloud('M.04 -.93 L.125 -.93 L.135 -.73 L.02 -.7 Z',[.01,-.94,.14,-.69],40),'body');
    add(cloud('M-.115 -1.18 L-.09 -1.345 Q.04 -1.37 .185 -1.305 L.2 -1.165 Z',[-.12,-1.38,.21,-1.16],145),'body');
    add(cloud('M-.19 -1.145 Q.03 -1.19 .34 -1.11 L.33 -1.075 Q.025 -1.125 -.185 -1.105 Z',[-.2,-1.2,.35,-1.07],125),'body');
    // Both legs have separate trousers, white socks, and low loafers.
    for(const side of [0,1]){
      add(boneCloud(160,.083,.063),side+'thigh',side?.96:.78);
      add(boneCloud(140,.064,.045,0,.82),side+'calf',side?.96:.78);
      add(boneCloud(60,.042,.038,.84,1),side+'calf');
      add(cloud('M-.15 -.075 Q-.02 -.12 .08 -.07 L.22 -.04 Q.29 -.02 .265 .005 L-.16 .005 Z',[-.17,-.13,.3,.02],100),side+'shoe');
    }
    add(boneCloud(115,.068,.052),'backUpper',.78);
    add(boneCloud(100,.052,.035),'backLower',.8);
    add(ellipse(0,.018,.045,.065,45),'backHand',.9);
    add(boneCloud(130,.075,.058),'frontUpper',.98);
    add(boneCloud(100,.056,.035),'frontLower',.98);
    add(ellipse(.012,.032,.049,.068,70),'glove');

    function pose(t){
      const phase=t/2.8,bob=.018*Math.sin(TAU*phase*2),sway=.02*Math.sin(TAU*phase);
      const joints={body:point(sway,bob)};
      for(const side of [0,1]){
        const u=fract(phase+side*.5),recovery=Math.max(0,(u-.5)*2);
        const angle=.82*Math.sin(Math.PI*recovery)**2,x=.29*Math.cos(TAU*u),floor=1.13;
        const shoe=p=>{
          const dx=p.x-.24,c=Math.cos(angle),s=Math.sin(angle);
          return {x:x+.24+dx*c-p.y*s,y:floor+dx*s+p.y*c};
        };
        const hip=point(-.055+side*.09+sway,.23+bob),ankle=shoe(point(0,-.095));
        const bend=knee(hip,ankle);
        joints[side+'thigh']=[hip,bend];joints[side+'calf']=[bend,ankle];joints[side+'shoe']=shoe;
      }
      const swing=.045*Math.sin(TAU*phase);
      const backShoulder=point(-.2+sway,-.63+bob),backElbow=point(-.34-swing,-.24+bob),backWrist=point(-.26-swing,.07+bob);
      const shoulder=point(.15+sway,-.62+bob),elbow=point(.34+swing,-.29+bob),wrist=point(.33+swing,.015+bob);
      joints.backUpper=[backShoulder,backElbow];joints.backLower=[backElbow,backWrist];joints.backHand=backWrist;
      joints.frontUpper=[shoulder,elbow];joints.frontLower=[elbow,wrist];joints.glove=wrist;
      return joints;
    }
    function position(p,joints){
      const joint=joints[p.part];
      if(typeof joint==='function')return joint(p);
      if(Array.isArray(joint))return onBone(p,...joint);
      return {x:p.x+joint.x,y:p.y+joint.y};
    }
    return {particles,pose,position,period:2.8,width:3.7,height:3.45,kind:'moonwalk'};
  }

  function phoenix(){
    const particles=[];
    const add=(points,part,side=0)=>points.forEach(p=>particles.push({...p,part,side,brightness:1}));
    add(ellipse(0,-.09,.155,.37,220),'body');
    add(cloud('M-.075 -.36 Q-.14 -.64 -.05 -.78 Q.05 -.83 .125 -.75 L.13 -.6 Q.02 -.48 .065 -.28 Z',[-.15,-.85,.14,-.27],110),'body');
    add(cloud('M.105 -.735 L.285 -.69 L.105 -.635 Z',[.1,-.75,.29,-.63],32),'body');
    for(let plume=0;plume<3;plume++){
      for(let i=0;i<30;i++){
        const u=rand(seed++),width=.018*Math.sin(Math.PI*u);
        add([{x:-.02-.12*u-plume*.075*u,y:-.72-.26*u+.08*plume*u,seed:rand(seed++),spread:(rand(seed++)-.5)*width}],'crest');
      }
    }
    for(const side of [-1,1]){
      const membrane=[];
      for(let i=0;i<330;i++){
        const u=rand(seed++),v=rand(seed++),top=-.28-.52*Math.sin(u*Math.PI*.65);
        membrane.push({x:.13+u*1.62,y:top+v*(.16+.36*Math.sin(Math.PI*u)),seed:rand(seed++)});
      }
      add(membrane,'wing',side);
      // Separated tapered flight feathers along each wing's trailing edge.
      for(let feather=0;feather<12;feather++){
        const rank=feather/11,x=.28+rank*1.32,y=-.29-.48*Math.sin(rank*Math.PI*.7);
        for(let i=0;i<45;i++){
          const u=rand(seed++),width=(.055+.02*(1-rank))*Math.sin(Math.PI*u)**.65;
          add([{x:x+u*(.13+rank*.19)+(rand(seed++)-.5)*width*2,y:y+u*(.54-.12*rank),seed:rand(seed++)}],'wing',side);
        }
      }
    }
    // Five long, independently rippling tail plumes distinguish the phoenix.
    for(let plume=-2;plume<=2;plume++){
      for(let i=0;i<105;i++){
        const u=rand(seed++),width=.045*Math.sin(Math.PI*u)**.7;
        particles.push({part:'tail',u,plume,across:(rand(seed++)-.5)*width,seed:rand(seed++),brightness:1});
      }
    }
    function pose(t){return {phase:TAU*t/2.8,tail:TAU*t/5.6}}
    function position(p,pose){
      const bob=.04*Math.sin(pose.phase),phase=pose.phase;
      if(p.part==='wing'){
        const u=p.x/1.8,flap=Math.sin(phase-u*.48);
        return {x:p.side*(.1+(p.x-.1)*(.88+.12*Math.cos(phase))),y:p.y+.72*u*flap+bob,z:.12*u*Math.cos(phase)};
      }
      if(p.part==='tail'){
        const sweep=Math.sin(pose.tail-p.u*3+p.plume*.4);
        return {x:p.plume*.22*p.u+sweep*.13*p.u*p.u+p.across,y:.13+p.u*(1.54-Math.abs(p.plume)*.16)+bob,z:0};
      }
      if(p.part==='crest')return {x:p.x+(p.spread||0)+.035*Math.sin(phase)*(-p.y-.7),y:p.y+bob};
      return {x:p.x,y:p.y+bob};
    }
    return {particles,pose,position,period:5.6,width:4.4,height:4.25,kind:'phoenix'};
  }

  const sprite=document.createElement('canvas');sprite.width=sprite.height=24;
  const g=sprite.getContext('2d'),halo=g.createRadialGradient(12,12,1,12,12,12);
  halo.addColorStop(0,'rgba(248,252,255,.85)');halo.addColorStop(.3,'rgba(241,249,255,.2)');halo.addColorStop(1,'rgba(241,249,255,0)');
  g.fillStyle=halo;g.fillRect(0,0,24,24);g.fillStyle='#fcfdff';g.fillRect(9.5,9.5,5,5);

  function mount(id,model){
    const canvas=document.getElementById(id),ctx=canvas?.getContext('2d');
    if(!ctx)return;
    const button=canvas.parentElement.querySelector('.motion-toggle');
    let paused=reduced.matches,visible=false,time=0,last=0,frame=0,w=0,h=0;
    function draw(){
      if(!w||!h)return;
      ctx.clearRect(0,0,w,h);
      const scale=Math.min(w/model.width,h/model.height),cx=w*.5,cy=h*.5;
      const pose=model.pose(time);
      if(model.kind==='moonwalk'){
        // Moving floor dust reinforces the backward glide without resetting the dancer.
        for(let i=0;i<42;i++){
          const u=fract(i/42+time*.095),x=(u-.5)*3.2;
          ctx.fillStyle='rgba(245,250,255,'+(.17*Math.sin(Math.PI*u)**2)+')';
          ctx.fillRect(cx+x*scale,cy+scale*1.15,1.3,1);
        }
      }
      for(const p of model.particles){
        const v=model.position(p,pose),depth=1+(v.z||0)*.12;
        const size=(model.kind==='moonwalk'?1.05+p.seed*.6:1.35+p.seed*.75)*4.8*depth;
        ctx.globalAlpha=p.brightness*(.9+.1*Math.sin(time*2+p.seed*TAU)**2);
        ctx.drawImage(sprite,cx+v.x*scale-size/2,cy+v.y*scale-size/2,size,size);
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
    reduced.addEventListener('change',()=>{paused=reduced.matches;sync()});
    document.addEventListener('visibilitychange',sync);document.addEventListener('portfolio:entered',sync);
    sync();
  }
  mount('moonwalkCanvas',moonwalker());
  mount('phoenixCanvas',phoenix());
})();
