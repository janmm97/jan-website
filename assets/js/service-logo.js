/* Reference-sampled articulated particles. Canvas 2D, like nano-scenes.js.
 * Each particle keeps its identity. Only the head and RIGHT arm change pose.
 * The torso, supporting LEFT hand, and laptop stay fixed throughout the loop. */
(() => {
  'use strict';
  const canvas=document.getElementById('serviceGod');
  if(!canvas)return;
  const ctx=canvas.getContext('2d'),slot=canvas.parentElement,button=slot.querySelector('button');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const TAU=Math.PI*2,INTRO=3.6,PERIOD=15;
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=v=>{const t=clamp(v);return t*t*t*(t*(t*6-15)+10);};
  const mix=(a,b,t)=>a+(b-a)*t;
  const rand=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
  const dimensions=[[435,400],[1312,1199],[1357,1159]];
  const normalize=(points,pose)=>points.map(([x,y])=>[x/dimensions[pose][0],y/dimensions[pose][1]]);
  const regions=[];
  function region(name,wave,typing=wave,point=wave,fixed=false){
    const poses=fixed?[1,1,1].map(()=>normalize(wave,1)):[normalize(typing,0),normalize(wave,1),normalize(point,2)];
    regions.push({name,poses,fixed});
  }
  // Anatomical landmarks in the supplied photographs, ordered back to front.
  region('body',[[151,1199],[158,986],[217,857],[287,679],[362,570],[490,482],[553,484],[663,524],[746,526],[811,556],[863,635],[930,785],[986,922],[1104,1003],[1142,1095],[1161,1199]],undefined,undefined,true);
  region('head',
    [[475,437],[461,365],[461,279],[476,206],[511,153],[567,112],[634,85],[706,90],[771,114],[817,154],[839,209],[831,269],[817,333],[783,387],[753,458],[724,533],[667,557],[610,535],[557,500],[514,464]],
    [[159,155],[145,130],[148,101],[157,72],[174,48],[195,31],[216,28],[238,32],[259,44],[270,64],[274,83],[269,101],[254,116],[250,134],[248,153],[250,177],[231,194],[211,184],[189,172],[173,163]],
    [[497,433],[477,357],[482,274],[497,199],[531,149],[586,111],[654,85],[725,91],[788,115],[832,155],[851,207],[847,269],[829,335],[801,389],[778,459],[748,535],[691,563],[635,540],[578,503],[536,465]]);
  region('upperArm',
    [[371,566],[437,599],[454,681],[350,809],[247,924],[177,943],[101,902],[85,839],[178,700],[277,604]],
    [[100,194],[129,191],[150,218],[142,278],[132,326],[112,357],[91,356],[78,331],[78,275],[82,224]],
    [[384,507],[448,549],[451,614],[379,732],[290,806],[219,827],[140,805],[91,751],[111,675],[259,536]]);
  region('forearm',
    [[88,848],[122,790],[240,567],[253,528],[340,546],[345,587],[277,806],[227,898],[184,934],[120,916]],
    [[83,319],[112,318],[200,314],[224,304],[235,326],[219,341],[148,358],[114,369],[89,360],[78,344]],
    [[99,724],[136,654],[212,548],[238,513],[310,535],[325,574],[287,673],[252,754],[196,811],[132,799]]);
  // Matching hand vertices follow the same fingers in all three states.
  region('hand',
    [[252,555],[244,492],[242,438],[253,390],[265,347],[277,337],[287,346],[283,376],[278,407],[289,409],[306,357],[314,317],[326,306],[337,313],[333,348],[320,410],[335,412],[345,354],[347,309],[357,293],[370,299],[370,329],[354,418],[369,422],[385,370],[386,330],[397,312],[408,318],[402,365],[382,446],[378,461],[398,447],[421,428],[436,424],[444,435],[427,455],[404,494],[376,532],[343,564],[300,575]],
    [[220,331],[218,322],[221,313],[234,307],[254,303],[271,300],[279,301],[278,306],[257,311],[244,316],[261,311],[280,307],[288,308],[292,312],[281,313],[258,318],[259,320],[278,315],[293,313],[302,316],[302,319],[289,321],[266,324],[267,326],[285,321],[299,320],[305,323],[303,326],[289,327],[271,330],[264,334],[269,337],[279,338],[281,342],[277,346],[262,344],[249,339],[236,335],[228,335],[224,334]],
    [[237,549],[213,560],[211,593],[218,622],[239,648],[253,657],[271,656],[274,642],[268,614],[280,616],[282,650],[299,668],[317,665],[324,652],[322,623],[334,621],[340,655],[354,670],[369,666],[375,651],[371,624],[376,625],[377,671],[379,710],[384,748],[391,760],[402,756],[407,742],[403,706],[400,668],[396,630],[391,599],[382,567],[363,538],[337,516],[306,506],[278,508],[256,518],[245,534],[241,542]]);
  region('laptopAndLeftHand',[[679,984],[904,963],[1004,640],[1020,633],[1254,654],[1262,670],[1172,972],[1098,992],[1120,1033],[1148,1090],[1122,1154],[1076,1167],[991,1134],[922,1085],[877,1044],[866,1008],[689,1007]],undefined,undefined,true);
  // Sample each anatomical silhouette on a stratified grid. Spatial ordering
  // pairs neighboring material between references, including folded fingers.
  function contains(x,y,polygon){
    let hit=false;
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[i],b=polygon[j];
      if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
    }
    return hit;
  }
  // Recursive spatial transport avoids the bands caused by scanline/Morton
  // matching. Each leaf pairs nearby material with equal mass in both poses.
  function matchCloud(source,target,axis=0){
    if(source.length<=1){if(source.length)source[0].matched=target[0];return;}
    const key=axis?'y':'x';source.sort((a,b)=>a[key]-b[key]);target.sort((a,b)=>a[key]-b[key]);
    const mid=source.length>>1;
    matchCloud(source.slice(0,mid),target.slice(0,mid),1-axis);
    matchCloud(source.slice(mid),target.slice(mid),1-axis);
  }
  let particles=[],width=0,height=0,time=0,frame=0,last=0;
  let paused=reduced.matches,visible=false,ready=false,failed=false,loading=false,userPaused=false;
  const shade=Array.from({length:64},(_,i)=>`rgb(${Math.round(50+i*3.17)},${Math.round(53+i*3.12)},${Math.round(56+i*3.08)})`);
  async function prepare(){
    if(loading)return;loading=true;
    try{
      if(!ctx)throw new Error('Canvas 2D unavailable');
      const maps=await Promise.all(['Typing','Waving','PointingDown'].map(async name=>{
        const image=new Image();image.src=`assets/images/greek-god/${name}.webp`;await image.decode();
        const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
        const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(image,0,0);
        return{pixels:g.getImageData(0,0,c.width,c.height).data,w:c.width,h:c.height};
      }));
      const luminance=(pose,x,y)=>{
        const m=maps[pose],o=(Math.min(m.h-1,Math.max(0,Math.floor(y*m.h)))*m.w+Math.min(m.w-1,Math.max(0,Math.floor(x*m.w))))*4;
        return(m.pixels[o]*.2126+m.pixels[o+1]*.7152+m.pixels[o+2]*.0722)/255;
      };
      let id=0;
      for(const r of regions){
        const samples=r.poses.map((polygon,pose)=>{
          const points=[],step=width<450?.0048:.0038;
          const minX=Math.min(...polygon.map(p=>p[0])),maxX=Math.max(...polygon.map(p=>p[0]));
          const minY=Math.min(...polygon.map(p=>p[1])),maxY=Math.max(...polygon.map(p=>p[1]));
          let n=0;
          for(let yy=minY;yy<=maxY;yy+=step)for(let xx=minX;xx<=maxX;xx+=step){
            const x=xx+rand(++n)*step*.85,y=yy+rand(n+500)*step*.85;
            if(contains(x,y,polygon))points.push({x,y,l:luminance(r.fixed?1:pose,x,y)});
          }
          return points;
        });
        const count=Math.max(...samples.map(p=>p.length));
        const clouds=samples.map(points=>Array.from({length:count},(_,i)=>({...points[Math.min(points.length-1,Math.floor((i+.5)*points.length/count))]})));
        const base=clouds[1].map((p,i)=>({...p,index:i}));
        const matched=[[],clouds[1],[]];
        for(const pose of [0,2]){
          if(r.fixed){matched[pose]=clouds[1];continue;}
          matchCloud(base.slice(),clouds[pose].slice());
          for(const p of base)matched[pose][p.index]=p.matched;
        }
        r.particles=[];r.cache=[];
        for(let i=0;i<count;i++){
          const targets=matched.map(points=>points[i]),seed=rand(++id);
          const particle={id,seed,targets,part:r.name,region:r,angle:rand(id+2)*TAU,radius:.08+Math.sqrt(rand(id+4))*.43};
          particles.push(particle);r.particles.push(particle);
        }
      }
      ready=true;if(reduced.matches)time=INTRO+7;sync();
    }catch(error){
      failed=true;canvas.dataset.phase='unavailable';
      const image=document.createElement('img');image.src='assets/images/greek-god/Waving.webp';image.className='svc-god-fallback';image.alt='A Greek god waves while holding a laptop in his left hand.';
      slot.insertBefore(image,canvas);canvas.hidden=true;button.textContent='Motion unavailable';button.disabled=true;
      console.error('Unable to prepare Services sculpture:',error);
    }
  }
  function sequence(t){
    if(t<INTRO)return{from:0,to:0,blend:0,phase:t<.45?'SCATTERED_PARTICLES':'FORM_GREEK_GOD',typing:0,wave:0,point:0};
    const s=(t-INTRO)%PERIOD;
    if(s<3.2)return{from:0,to:0,blend:0,phase:'TYPING',typing:Math.sin(Math.PI*s/3.2)**2,wave:0,point:0};
    // The head turns before the right hand leaves the keyboard.
    if(s<4.6)return{from:0,to:0,blend:0,head:smooth((s-3.2)/1.4),phase:'LOOK_AT_VISITOR',typing:0,wave:0,point:0};
    if(s<6)return{from:0,to:1,blend:smooth((s-4.6)/1.4),head:1,phase:'WAVE',typing:0,wave:0,point:0};
    if(s<8.2)return{from:1,to:1,blend:0,head:1,phase:'WAVE',typing:0,wave:Math.sin((s-6)*TAU*1.15)*Math.sin(Math.PI*(s-6)/2.2),point:0};
    if(s<9.8)return{from:1,to:2,blend:smooth((s-8.2)/1.6),head:1,phase:'POINT_DOWN',typing:0,wave:0,point:0};
    if(s<12)return{from:2,to:2,blend:0,head:1,phase:'POINT_DOWN',typing:0,wave:0,point:Math.sin((s-9.8)*TAU/2.2)**2};
    return{from:2,to:0,blend:smooth((s-12)/3),head:1-smooth((s-12)/3),phase:'RETURN_TO_TYPING',typing:0,wave:0,point:0};
  }
  function draw(){
    if(!ready||!width||!height)return;
    ctx.clearRect(0,0,width,height);
    const pose=sequence(time),scale=Math.min(width/.99,height/1.04),ox=(width-scale)/2,oy=(height-scale)/2;
    canvas.dataset.phase=pose.phase;canvas.dataset.particles=particles.length;
    const breath=Math.sin(time*.85)*.0015;
    for(const r of regions){
      let from=pose.from,to=pose.to,t=pose.blend;
      if(r.name==='head'&&pose.head!==undefined){from=0;to=1;t=pose.head;}
      if(time>=INTRO){
        ctx.beginPath();
        r.poses[from].forEach((a,i)=>{const b=r.poses[to][i],x=ox+mix(a[0],b[0],t)*scale,y=oy+(mix(a[1],b[1],t)+breath)*scale;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
        ctx.closePath();ctx.globalAlpha=1;ctx.fillStyle='#0b0b0b';ctx.fill();
        const held=r.fixed?1:from===to||t===0?from:t===1?to:-1;
        if(held>=0&&!(r.name==='hand'&&pose.typing)){
          if(!r.cache[held]){
            const layer=document.createElement('canvas');layer.width=canvas.width;layer.height=canvas.height;
            const g=layer.getContext('2d');g.setTransform(canvas.width/width,0,0,canvas.height/height,0,0);
            for(const p of r.particles){
              const v=p.targets[held],edge=1-smooth((v.y-.91)/.09),intensity=clamp((v.l-.08)*1.13),size=Math.max(.65,scale*(.0022+p.seed*.0007));
              g.globalAlpha=edge*(.48+intensity*.5);g.fillStyle=shade[Math.min(63,Math.floor(intensity*63))];g.fillRect(ox+v.x*scale,oy+v.y*scale,size,size);
              if(p.id%113===0&&v.l>.55){g.globalAlpha=edge*.13;g.fillRect(ox+v.x*scale-size*1.5,oy+v.y*scale-size*1.5,size*4,size*4);}
            }
            r.cache[held]=layer;
          }
          ctx.save();ctx.globalAlpha=.975+.025*Math.sin(time*1.8);ctx.translate(0,breath*scale);
          if(r.name==='hand'){
            ctx.translate(0,pose.point*.006*scale);
            if(pose.wave){const x=ox+.225*scale,y=oy+.46*scale;ctx.translate(x,y);ctx.rotate(pose.wave*.12);ctx.translate(-x,-y);}
          }
          ctx.drawImage(r.cache[held],0,0,width,height);ctx.restore();continue;
        }
      }
      for(const p of r.particles){
        let a=p.targets[pose.from],b=p.targets[pose.to],blend=pose.blend;
        if(p.part==='head'&&pose.head!==undefined){a=p.targets[0];b=p.targets[1];blend=pose.head;}
        let x=mix(a.x,b.x,blend),y=mix(a.y,b.y,blend),light=mix(a.l,b.l,blend);
        y+=breath;
        if(p.part==='hand'){
          y+=Math.sin(time*19+p.seed*1.8)*.0022*pose.typing;
          if(pose.wave){const angle=pose.wave*.12,dx=x-.225,dy=y-.46;x=.225+dx*Math.cos(angle)-dy*Math.sin(angle);y=.46+dx*Math.sin(angle)+dy*Math.cos(angle);}
          y+=pose.point*.006;
        }
        if(time<INTRO){
          const capture=smooth((time-.35-p.seed*.75)/(INTRO-1.1)),angle=p.angle+time*(.12+p.seed*.12);
          const sx=.5+Math.cos(angle)*p.radius,sy=.48+Math.sin(angle)*p.radius*.9;
          x=mix(sx,x,capture);y=mix(sy,y,capture);x+=Math.sin(capture*Math.PI)*.09*Math.sin(p.angle);light=mix(.5,light,capture);
        }
        const edge=1-smooth((y-.91)/.09),intensity=clamp((light-.08)*1.13);
        ctx.globalAlpha=edge*(.95+.05*Math.sin(time*1.8+p.seed*TAU))*(.48+intensity*.5);
        ctx.fillStyle=shade[Math.min(63,Math.floor(intensity*63))];
        const size=Math.max(.65,scale*(.0022+p.seed*.0007));
        ctx.fillRect(ox+x*scale,oy+y*scale,size,size);
        if(p.id%113===0&&light>.55){ctx.globalAlpha=edge*.13;ctx.fillRect(ox+x*scale-size*1.5,oy+y*scale-size*1.5,size*4,size*4);}
      }
    }
    ctx.globalAlpha=1;
  }
  function running(){return ready&&!paused&&visible&&!document.hidden&&!document.documentElement.classList.contains('entry-pending');}
  function tick(now){frame=0;if(!running())return;time+=Math.min(.05,(now-last)/1000);last=now;draw();frame=requestAnimationFrame(tick);}
  function sync(){
    cancelAnimationFrame(frame);frame=0;if(failed)return;
    button.textContent=reduced.matches?'Reduced motion':paused?'Play motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));button.disabled=reduced.matches;
    draw();if(running()){last=performance.now();frame=requestAnimationFrame(tick);}
  }
  new ResizeObserver(()=>{
    const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;
    const d=Math.min(devicePixelRatio,2);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx?.setTransform(d,0,0,d,0,0);for(const r of regions)r.cache=[];sync();
  }).observe(slot);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)prepare();sync();}).observe(slot);
  button.addEventListener('click',()=>{userPaused=!userPaused;paused=userPaused;sync();});
  reduced.addEventListener('change',()=>{paused=reduced.matches||userPaused;if(reduced.matches)time=INTRO+7;sync();});
  document.addEventListener('visibilitychange',sync);document.addEventListener('portfolio:entered',sync);
  // Deterministic inspection is opt-in; normal visits cannot seek the animation.
  if(new URLSearchParams(location.search).has('sculpture-preview'))canvas.addEventListener('sculpture:seek',event=>{if(!Number.isFinite(event.detail))return;time=Math.max(0,event.detail);userPaused=true;paused=true;sync();});
  sync();
})();
