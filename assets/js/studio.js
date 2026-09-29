/* Deterministic nano formations sampled from the original logo geometry. */
(()=>{'use strict';
const canvas=document.querySelector('#signalCanvas'),motion=matchMedia('(prefers-reduced-motion: reduce)'),button=document.querySelector('.motion-toggle');
const ctx=canvas?.getContext('2d'),selectors=[...document.querySelectorAll('[data-formation]')],label=document.querySelector('#formationName');
const names=['Jan / signature','Sphere / orbit','Helix / sequence','Cube / structure'];
let paused=motion.matches,frame=0,visible=false,time=0,last=0,w=0,h=0,px=0,py=0,index=0,manual=null;
const count=1500,targets=[[],[],[],[]];
const fract=n=>n-Math.floor(n),rand=n=>fract(Math.sin(n*127.1+311.7)*43758.5453);
// Translated square and angled cutout from websitelogo-blackbg1.svg.
const slash=new Path2D('M148.886719 28.773438 L108.304688 111.640625 C108.007812 112.214844 107.21875 112.386719 106.59375 112.011719 L92.941406 106.632812 C92.398438 106.308594 92.15625 105.679688 92.375 105.160156 L126.933594 19.738281 C127.167969 19.1875 127.847656 18.945312 128.472656 19.195312 L148.152344 27.132812 C148.851562 27.410156 149.195312 28.175781 148.886719 28.773438 Z');
const mask=document.createElement('canvas').getContext('2d'),logo=[];
for(let y=2;y<187;y+=3.7)for(let x=2;x<187;x+=3.7){
 const rx=Math.max(26.18-x,0,x-160.82),ry=Math.max(26.18-y,0,y-160.82);
 if(rx*rx+ry*ry>26.18**2||(x>=37.8125&&x<=107.9375&&y>=97.953125&&y<=168.078125)||mask.isPointInPath(slash,x,y))continue;
 logo.push({x:(x-93.5)/86,y:(y-93.5)/86,z:0});
}
for(let i=0;i<count;i++){
 targets[0].push(logo[Math.floor(i/count*logo.length)]);
 const y=1-2*(i+.5)/count,a=i*Math.PI*(3-Math.sqrt(5)),r=Math.sqrt(1-y*y);
 targets[1].push({x:r*Math.cos(a),y,z:r*Math.sin(a)});
 const u=i/count,turn=u*Math.PI*8,strand=i%2*Math.PI;
 targets[2].push({x:.72*Math.cos(turn+strand),y:(u-.5)*2.2,z:.72*Math.sin(turn+strand)});
 const face=i%6,aa=rand(i+1)*1.6-.8,bb=rand(i+700)*1.6-.8;
 targets[3].push(face<2?{x:face?-.8:.8,y:aa,z:bb}:face<4?{x:aa,y:face===2?-.8:.8,z:bb}:{x:aa,y:bb,z:face===4?-.8:.8});
}
function announce(n){if(index===n&&label.textContent===names[n])return;index=n;label.textContent=names[n];selectors.forEach((el,i)=>el.setAttribute('aria-pressed',String(i===n)))}
function draw(){
 if(!ctx||!w||!h)return;ctx.clearRect(0,0,w,h);
 const cycle=time/7500,base=manual===null?Math.floor(cycle)%4:manual,next=manual===null?(base+1)%4:manual;
 const local=cycle%1,t=manual===null?Math.max(0,(local-.57)/.43):0,e=t*t*(3-2*t),burst=Math.sin(t*Math.PI);
 announce(t>.5?next:base);
 const scale=Math.min(w,h)*.30,cx=w*.5,cy=h*.43;
 const logoWeight=(base===0?1-e:0)+(next===0?e:0);
 const angle=(time*.00012+px*.28)*(1-logoWeight),tilt=.24*(1-logoWeight)+py*.1*(1-logoWeight),projected=[];
 for(let i=0;i<count;i++){
  const from=targets[base][i],to=targets[next][i],seed=rand(i+90);
  let x=from.x+(to.x-from.x)*e,y=from.y+(to.y-from.y)*e,z=from.z+(to.z-from.z)*e;
  x+=Math.sin(i*2.3+time*.001)*burst*.35;y+=Math.cos(i*.9+time*.0007)*burst*.35;z+=(seed-.5)*burst;
  const xx=x*Math.cos(angle)-z*Math.sin(angle),zz=x*Math.sin(angle)+z*Math.cos(angle);
  const yy=y*Math.cos(tilt)-zz*Math.sin(tilt),depth=y*Math.sin(tilt)+zz*Math.cos(tilt),perspective=3.6/(3.6+depth);
  projected.push({x:cx+xx*scale*perspective,y:cy+yy*scale*perspective,size:(1+seed*.7)*perspective,alpha:.45+.5*(depth+1.8)/3.6});
 }
 ctx.lineWidth=.45;
 for(let i=0;i<count;i++){
  const p=projected[i],q=projected[(i+1)%count],dx=p.x-q.x,dy=p.y-q.y;
  if(dx*dx+dy*dy<220){ctx.strokeStyle='rgba(225,225,225,.14)';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}
  ctx.fillStyle=`rgba(245,245,245,${Math.min(1,p.alpha)})`;ctx.fillRect(p.x,p.y,p.size,p.size);
 }
 canvas.dataset.formation=String(index);
}
function loop(now){frame=0;if(now-last>=32){time+=Math.min(50,now-last||16);last=now;draw()}if(!paused&&visible&&!document.hidden&&!document.documentElement.classList.contains('entry-pending'))frame=requestAnimationFrame(loop)}
function sync(){cancelAnimationFrame(frame);frame=0;last=performance.now();button.textContent=paused?'Play motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));draw();if(!paused&&visible&&!document.hidden&&!document.documentElement.classList.contains('entry-pending'))frame=requestAnimationFrame(loop)}
if(ctx){
 new ResizeObserver(()=>{const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const d=Math.min(devicePixelRatio,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);sync()}).observe(canvas);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()}).observe(canvas);
 canvas.parentElement.addEventListener('pointermove',e=>{if(paused)return;const r=canvas.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5});
 selectors.forEach((el,i)=>el.addEventListener('click',()=>{manual=i;time=i*7500;sync()}));
 button.addEventListener('click',()=>{paused=!paused;if(!paused)manual=null;sync()});
 motion.addEventListener('change',()=>{paused=motion.matches;manual=paused?0:null;sync()});
 document.addEventListener('visibilitychange',sync);document.addEventListener('portfolio:entered',sync);sync();
}
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){if(!motion.matches)e.target.classList.add('reveal-in');observer.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.pcard,.timeline-item,.selected-feature,.svc-card,.page-closing').forEach(el=>observer.observe(el));
})();
