/* Stardust: one WebGL particle material for the cosmic journey.
 * Photographs, procedural forms and marks become particle shapes. The material morphs between
 * two shapes on expo-out, swirls in mid-flight, and the source photograph is composited in the
 * same camera space (luminance as premultiplied alpha, so black stays the #0b0b0b night ground).
 * It also draws the flowing sea of light on Home. Monochrome: every point is ink #f2f2f2.
 * Crisp points only: no halos, glow, blur or trails. */
(()=>{
  'use strict';
  const TAU=Math.PI*2;
  const lcg=seed=>{let s=(seed>>>0)||1;return()=>(s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296;};
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));

  /* ---------- shapes: Float32Array(count*4) = x, y, z, brightness ---------- */
  function luma(img,w=400){
    const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,h=Math.max(1,Math.round(w*ih/iw));
    const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});
    x.drawImage(img,0,0,w,h);const d=x.getImageData(0,0,w,h).data,L=new Float32Array(w*h);
    for(let i=0;i<w*h;i++)L[i]=(d[i*4]*.2126+d[i*4+1]*.7152+d[i*4+2]*.0722)/255*(d[i*4+3]/255);
    return {L,w,h};
  }
  function fromLuma(map,count,{floor=.06,gamma=1.25,height=1,seed=7,depth=null,boost=1.15}={}){
    const {L,w,h}=map,cdf=new Float64Array(w*h);let acc=0;
    for(let i=0;i<w*h;i++){acc+=Math.pow(Math.max(0,L[i]-floor),gamma);cdf[i]=acc;}
    const out=new Float32Array(count*4),r=lcg(seed),aspect=w/h;
    if(acc<=0)return cosmos(count,seed);
    for(let n=0;n<count;n++){
      const t=r()*acc;let lo=0,hi=w*h-1;while(lo<hi){const m=(lo+hi)>>1;if(cdf[m]<t)lo=m+1;else hi=m;}
      const nx=((lo%w)+r())/w*2-1,ny=1-(Math.floor(lo/w)+r())/h*2,b=clamp(L[lo]*boost);
      out[n*4]=nx*aspect*height;out[n*4+1]=ny*height;out[n*4+2]=depth?depth(nx*aspect,ny,b,r)*height:0;out[n*4+3]=b;
    }
    return out;
  }
  // The drop photograph: a liquid sphere with a starfield inside. Rim on the surface, stars in the volume.
  const dropDepth=R=>(x,y,b,r)=>{const q=Math.hypot(x,y)/R,cap=Math.sqrt(Math.max(0,1-q*q))*R;return q>.86?(r()*2-1)*cap*.35:(r()*2-1)*cap*.9;};
  // A galaxy: thin disk, thicker bulge.
  const galaxyDepth=(x,y,b,r)=>{const q=x*x+y*y;return (r()-.5)*.06+(r()-.5)*.42*Math.exp(-q*9);};
  // The explosion target: most of the material fills the view frustum at every depth (camera at z=+3),
  // the rest scatters around and behind the viewer, so the burst passes the camera.
  function cosmos(count,seed=11){
    const out=new Float32Array(count*4),r=lcg(seed);
    for(let i=0;i<count;i++){
      if(r()<.78){const zc=.45+Math.pow(r(),.75)*9.5;out.set([(r()*2-1)*zc*.95,(r()*2-1)*zc*.58,3-zc,.3+Math.pow(r(),1.6)*.7],i*4);}
      else{const u=r()*2-1,a=r()*TAU,s=Math.sqrt(1-u*u),rad=2+Math.pow(r(),.7)*8;out.set([Math.cos(a)*s*rad,u*rad*.7,Math.sin(a)*s*rad,.2+Math.pow(r(),2)*.6],i*4);}
    }
    return out;
  }
  // A crown splash, drawn in the same material as the sea (origin = impact point, y = 0 at the surface):
  // a cup that flares as it rises, K spikes each throwing a droplet from its tip, a wide fan of flung
  // droplets, a low sheet at the base and a dim cavity. Silhouette edges and the rim catch the light.
  function crown(count,seed=61){
    const out=new Float32Array(count*4),r=lcg(seed),K=14,R0=.3,HB=.3,HS=.24;
    const drops=Array.from({length:96},()=>{const a=r()*TAU,d=R0*(1.25+Math.pow(r(),.8)*1.7),y=.32+Math.pow(r(),.9)*.85;return [Math.cos(a)*d,y-(d-R0)*.08,Math.sin(a)*d*.85,.006+r()*.016];});
    const tip=k=>{const a=k/K*TAU+.11;return [Math.cos(a)*R0*1.3,HB+HS+.07+r()*.03,Math.sin(a)*R0*1.3];};
    const ball=(c,rad,b)=>{const u=r()*2-1,a=r()*TAU,s=Math.sqrt(1-u*u),q=Math.cbrt(r())*.4+.6;return [c[0]+Math.cos(a)*s*rad*q,c[1]+u*rad*q,c[2]+Math.sin(a)*s*rad*q,b];};
    for(let i=0;i<count;i++){
      const g=r();let p;
      if(g<.5){ // the wall
        const a=r()*TAU,u=Math.pow(r(),.55),spike=Math.pow(.5+.5*Math.cos(K*(a-.11)),9),h=HB+HS*spike,y=u*h;
        const rad=R0*(.8+.42*Math.pow(u,1.7))*(1+(r()-.5)*.03);
        const edge=Math.pow(Math.abs(Math.cos(a)),4),rim=u>.9?.45:0;
        p=[Math.cos(a)*rad,y,Math.sin(a)*rad,Math.min(1,.28+edge*.5+rim+.12*Math.sin(a*23+u*9))];
      }else if(g<.63){p=ball(tip(Math.floor(r()*K)),.024,.95);}
      else if(g<.86){const d=drops[Math.floor(r()*drops.length)];p=ball(d,d[3],.75+r()*.25);}
      else if(g<.95){const a=r()*TAU,rad=R0*(.95+Math.pow(r(),1.5)*.75);p=[Math.cos(a)*rad,r()*.045,Math.sin(a)*rad,.3+r()*.25];}
      else{const a=r()*TAU,rad=Math.sqrt(r())*R0*.8;p=[Math.cos(a)*rad,r()*.12,Math.sin(a)*rad,.15+r()*.15];}
      out.set(p,i*4);
    }
    return out;
  }
  // The Worthington jet: after the crown falls, a column rises from the cavity and pinches off a drop.
  function jet(count,seed=67){
    // A short tapered column with a drop pinching off just above it.
    const out=new Float32Array(count*4),r=lcg(seed),H=.5,B=.1,Y=H+.08+B;
    for(let i=0;i<count;i++){
      if(r()<.58){const u=r()*2-1,a=r()*TAU,s=Math.sqrt(1-u*u),q=Math.cbrt(r())*.3+.7;out.set([Math.cos(a)*s*B*q,Y+u*B*q*1.08,Math.sin(a)*s*B*q,.55+r()*.45],i*4);}
      else{const t=Math.pow(r(),1.2),w=(.09-.06*t)*(1+(r()-.5)*.08),a=r()*TAU;out.set([Math.cos(a)*w,t*H,Math.sin(a)*w,.3+(1-t)*.3+r()*.2],i*4);}
    }
    return out;
  }
  // Outline emphasis for marks: edges bright, interiors a soft fill, so a filled logo reads as luminous.
  function outline(map,{inner=.26,gain=1.4}={}){
    const {L,w,h}=map,E=new Float32Array(w*h),O=new Float32Array(w*h);
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x,v=L[i];E[i]=Math.max(Math.abs(v-L[i-1]),Math.abs(v-L[i+1]),Math.abs(v-L[i-w]),Math.abs(v-L[i+w]));}
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;let m=E[i];m=Math.max(m,E[i-1],E[i+1],E[i-w],E[i+w]);O[i]=Math.min(1,L[i]*inner+m*gain);}
    return {L:O,w,h};
  }
  function sphere(count,seed=5){ // fallback drop: a shell with a band of stars inside
    const out=new Float32Array(count*4),r=lcg(seed);
    for(let i=0;i<count;i++){
      const shell=r()<.45,u=r()*2-1,a=r()*TAU,s=Math.sqrt(1-u*u),rad=shell?1:Math.cbrt(r())*.92;
      const y=shell?u*rad:(u*.18+(r()-.5)*.25)*rad;
      out.set([Math.cos(a)*s*rad,y,Math.sin(a)*s*rad,shell?.65+r()*.35:.2+r()*.5],i*4);
    }
    return out;
  }
  function spiral(count,seed=3){ // fallback galaxy: two logarithmic arms and a bulge
    const out=new Float32Array(count*4),r=lcg(seed);
    for(let i=0;i<count;i++){
      const bulge=r()<.22,arm=r()<.5?0:Math.PI,t=Math.pow(r(),.8),rad=bulge?Math.pow(r(),2)*.28:.12+t*.88;
      const a=bulge?r()*TAU:arm+Math.log(rad/.12+1)*2.4+(r()-.5)*.55*(1-t*.4);
      out.set([Math.cos(a)*rad+(r()-.5)*.05,Math.sin(a)*rad+(r()-.5)*.05,(r()-.5)*(bulge?.3:.05),bulge?.6+r()*.4:.25+r()*.6],i*4);
    }
    return out;
  }
  // Jan's mark, drawn from the same geometry as the site logo (rounded square, square window, slash).
  function markMap(){
    const c=document.createElement('canvas');c.width=c.height=200;const x=c.getContext('2d',{willReadFrequently:true});
    // Pad every side so outline() can sample the complete outer edge.
    x.translate((c.width-187)/2,(c.height-187)/2);
    x.fillStyle='#fff';x.beginPath();x.roundRect?x.roundRect(0,0,187,187,26.18):x.rect(0,0,187,187);x.fill();
    x.globalCompositeOperation='destination-out';x.fillRect(37.8125,97.953125,70.125,70.125);
    x.fill(new Path2D('M148.886719 28.773438 L108.304688 111.640625 C108.007812 112.214844 107.21875 112.386719 106.59375 112.011719 L92.941406 106.632812 C92.398438 106.308594 92.15625 105.679688 92.375 105.160156 L126.933594 19.738281 C127.167969 19.1875 127.847656 18.945312 128.472656 19.195312 L148.152344 27.132812 C148.851562 27.410156 149.195312 28.175781 148.886719 28.773438 Z'));
    return c;
  }
  const loadImage=src=>new Promise((res,rej)=>{const i=new Image();i.decoding='async';i.onload=()=>res(i);i.onerror=rej;i.src=src;});

  /* ---------- renderer ---------- */
  const CAMERA=`
    uniform vec3 uCam;uniform vec3 uTarget;uniform float uFocal;uniform float uAspect;uniform float uZoom;uniform vec2 uOffset;
    uniform vec4 uSafe0;uniform vec4 uSafe1;uniform vec4 uSafe2;
    vec3 view(vec3 p){p-=uTarget;float c=cos(uCam.x),s=sin(uCam.x);p=vec3(p.x*c+p.z*s,p.y,p.z*c-p.x*s);c=cos(uCam.y);s=sin(uCam.y);return vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);}
    vec4 project(vec3 v,out float persp){float zc=uCam.z-v.z;persp=uFocal/max(zc,.05);if(zc<.16)return vec4(9.,9.,0.,1.);return vec4(v.x*persp*uZoom/uAspect+uOffset.x,v.y*persp*uZoom+uOffset.y,0.,1.);}
    float box(vec2 q,vec4 r){vec2 c=vec2(r.x+r.y,r.z+r.w)*.5,h=vec2(r.y-r.x,r.w-r.z)*.5;vec2 d=abs(q-c)-h;return smoothstep(0.,.07,length(max(d,0.))+min(max(d.x,d.y),0.));}
    float shield(vec2 q){return mix(.1,1.,min(box(q,uSafe0),min(box(q,uSafe1),box(q,uSafe2))));}
    mat3 rot(vec2 r){float ct=cos(r.x),st=sin(r.x),cs=cos(r.y),ss=sin(r.y);return mat3(cs,ss*ct,ss*st, -ss,cs*ct,cs*st, 0.,-st,ct);}
  `;
  const POINTS_VS=`precision highp float;
    attribute vec4 aA;attribute vec4 aB;attribute vec4 aR;
    uniform float uMix;uniform float uStagger;uniform float uArc;uniform float uSwirl;uniform float uTime;uniform float uAlpha;uniform float uSize;uniform float uPx;uniform float uDrift;
    uniform vec3 uPosA;uniform float uSclA;uniform vec2 uRotA;uniform vec3 uPosB;uniform float uSclB;uniform vec2 uRotB;
    varying float vA;
    ${CAMERA}
    void main(){
      float t=clamp((uMix-aR.x*uStagger)/max(.001,1.-uStagger),0.,1.);
      float e=t>=1.?1.:1.-pow(2.,-10.*t);
      vec3 b=aB.xyz;float r=length(b.xy);float sw=uSwirl*(1.-e)*(.9/(.18+r));float cs=cos(sw),ss=sin(sw);b.xy=vec2(b.x*cs-b.y*ss,b.x*ss+b.y*cs);
      vec3 pa=uPosA+rot(uRotA)*(aA.xyz*uSclA),pb=uPosB+rot(uRotB)*(b*uSclB);
      vec3 p=mix(pa,pb,e)+(aR.yzw-.5)*sin(3.14159*e)*uArc*1.6;
      p+=vec3(sin(uTime*.7+aR.y*6.283),cos(uTime*.5+aR.z*6.283),sin(uTime*.6+aR.w*6.283))*uDrift;
      float persp;vec3 v=view(p);gl_Position=project(v,persp);
      float bright=mix(aA.w,aB.w,e);
      gl_PointSize=uPx*uSize*(.55+bright*1.05)*clamp(persp*.55,.45,3.2);
      vA=uAlpha*(.22+.78*bright)*clamp(persp*.6,.25,1.)*shield(gl_Position.xy);
    }`;
  const POINTS_FS=`precision mediump float;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=min(vA,1.)*(1.-smoothstep(.36,.5,d));gl_FragColor=vec4(vec3(.949)*a,a);}`;
  const SEA_VS=`precision highp float;
    attribute vec4 aG;
    uniform float uTime;uniform float uAmp;uniform float uAlpha;uniform float uSize;uniform float uPx;uniform float uSeaY;uniform vec2 uSeaW;uniform vec2 uSeaZ;
    uniform vec4 uRip0;uniform vec4 uRip1;uniform vec4 uRip2;uniform vec4 uRip3;uniform vec3 uPtr;uniform vec2 uGlint;
    varying float vA;
    ${CAMERA}
    float ripple(vec2 q,vec4 R){float age=uTime-R.z;if(age<0.||R.w<=0.)return 0.;float d=distance(q,R.xy);float f=d-age*.85;return R.w*exp(-age*.38)*exp(-f*f*4.)*sin(f*15.);}
    void main(){
      float x=(aG.x-.5)*uSeaW.x;
      float zc=1./mix(1./uSeaZ.x,1./uSeaZ.y,aG.y);float z=uCam.z-zc+uTarget.z;
      vec2 q=vec2(x,z);float t=uTime;
      float y=(.085*sin(q.x*1.5+t*.8+q.y*.9)+.05*sin(q.x*3.1-t*1.15+q.y*2.2)+.04*sin(q.x*.7+q.y*3.4+t*.55)+.016*sin(q.x*6.3+q.y*1.3-t*1.9))*uAmp;
      float rp=ripple(q,uRip0)+ripple(q,uRip1)+ripple(q,uRip2)+ripple(q,uRip3);
      vec2 dp=q-uPtr.xy;float dd=dot(dp,dp);float wake=uPtr.z*.07*exp(-dd*2.2)*sin(sqrt(dd)*13.-t*5.);
      y+=rp+wake;
      vec3 p=vec3(x+(aG.z-.5)*.01,uSeaY+y,z);
      float persp;vec3 v=view(p);gl_Position=project(v,persp);
      float slope=.085*1.5*cos(q.x*1.5+t*.8+q.y*.9)+.05*3.1*cos(q.x*3.1-t*1.15+q.y*2.2);
      float crest=smoothstep(-.02,.13,y)*.75+smoothstep(.05,.2,abs(slope))*.35+abs(rp)*6.+abs(wake)*7.;
      float glint=uGlint.y*exp(-pow((x-uGlint.x)/(.25+zc*.07),2.))*(.45+.55*sin(q.x*9.+q.y*7.-t*2.3)*sin(q.y*5.+t*1.7));
      float far=smoothstep(0.,.14,1.-aG.y)*smoothstep(0.,.32,aG.y);
      float edge=smoothstep(0.,.1,aG.x)*smoothstep(0.,.1,1.-aG.x);
      gl_PointSize=uPx*uSize*(.8+aG.w*.7)*clamp(persp*.5,.5,1.8);
      vA=uAlpha*clamp(.3+.7*crest+max(glint,0.),0.,1.)*far*edge*(.6+aG.w*.4)*shield(gl_Position.xy);
    }`;
  const PHOTO_VS=`precision highp float;
    attribute vec2 aQ;uniform vec3 uPos;uniform vec2 uHalf;uniform vec2 uRot;uniform vec2 uAnchor;varying vec2 vUv;varying float vS;
    ${CAMERA}
    void main(){vec3 l=vec3((aQ.x-uAnchor.x)*uHalf.x,(aQ.y-uAnchor.y)*uHalf.y,0.);vec3 p=uPos+rot(uRot)*l;float persp;vec3 v=view(p);gl_Position=project(v,persp);vUv=vec2(aQ.x*.5+.5,.5-aQ.y*.5);vS=shield(gl_Position.xy);}`;
  const PHOTO_FS=`precision mediump float;uniform sampler2D uTex;uniform float uOp;uniform float uFloor;varying vec2 vUv;varying float vS;
    void main(){float L=texture2D(uTex,vUv).r;float a=clamp((L-uFloor)/(1.-uFloor),0.,1.)*uOp*mix(.35,1.,vS);gl_FragColor=vec4(vec3(a),a);}`;

  function create(canvas,{dpr:maxDpr=1.75}={}){
    const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true,powerPreference:'high-performance'});
    if(!gl)return null;
    const sh=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const program=(vs,fs,names)=>{const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
      const u={};['uCam','uTarget','uFocal','uAspect','uZoom','uOffset','uSafe0','uSafe1','uSafe2',...names].forEach(n=>u[n]=gl.getUniformLocation(p,n));return {p,u};};
    const pts=program(POINTS_VS,POINTS_FS,['uMix','uStagger','uArc','uSwirl','uTime','uAlpha','uSize','uPx','uDrift','uPosA','uSclA','uRotA','uPosB','uSclB','uRotB']);
    const sea=program(SEA_VS,POINTS_FS,['uTime','uAmp','uAlpha','uSize','uPx','uSeaY','uSeaW','uSeaZ','uRip0','uRip1','uRip2','uRip3','uPtr','uGlint']);
    const pho=program(PHOTO_VS,PHOTO_FS,['uPos','uHalf','uRot','uAnchor','uTex','uOp','uFloor']);
    const loc={aA:gl.getAttribLocation(pts.p,'aA'),aB:gl.getAttribLocation(pts.p,'aB'),aR:gl.getAttribLocation(pts.p,'aR'),aG:gl.getAttribLocation(sea.p,'aG'),aQ:gl.getAttribLocation(pho.p,'aQ')};
    const buffer=data=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);return b;};
    const quad=buffer(new Float32Array([-1,-1,1,-1,-1,1,1,1]));
    const shapes={},textures={};let count=0,rnd=null,seaBuf=null,seaCount=0,w=0,h=0,dpr=1,lost=false;
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;canvas.dataset.renderer='context-lost';});
    canvas.addEventListener('webglcontextrestored',()=>location.reload());
    function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return false;dpr=Math.min(devicePixelRatio||1,maxDpr);const rw=Math.round(r.width*dpr),rh=Math.round(r.height*dpr);if(rw!==w||rh!==h){w=rw;h=rh;canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}return true;}
    function camera(prog,s){const u=prog.u;gl.uniform3f(u.uCam,s.yaw||0,s.pitch||0,s.dist||3.2);gl.uniform3f(u.uTarget,s.tx||0,s.ty||0,s.tz||0);gl.uniform1f(u.uFocal,s.focal||2);gl.uniform1f(u.uAspect,w/h);gl.uniform1f(u.uZoom,s.zoom||1);gl.uniform2f(u.uOffset,s.ox||0,s.oy||0);
      for(let i=0;i<3;i++){const r=s.safe&&s.safe[i]||[3,4,3,4];gl.uniform4f(u['uSafe'+i],r[0],r[1],r[2],r[3]);}}
    function attrib(l,b,size){if(l<0)return;gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0);}
    function off(...ls){ls.forEach(l=>l>=0&&gl.disableVertexAttribArray(l));}
    return {
      gl,get dpr(){return dpr;},get size(){return [w,h];},
      setCount(n,seed=19){count=n;const r=lcg(seed),a=new Float32Array(n*4);for(let i=0;i<n*4;i++)a[i]=r();rnd=buffer(a);},
      shape(name,data){if(shapes[name])gl.deleteBuffer(shapes[name]);shapes[name]=buffer(data.length===count*4?data:data.slice(0,count*4));},      has(name){return !!shapes[name];},
      setSea(cols,rows,seed=23){const r=lcg(seed),a=new Float32Array(cols*rows*4);let i=0;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){a.set([(x+r()*.5)/(cols-1),y/(rows-1),r(),r()],i*4);i++;}seaBuf=buffer(a);seaCount=cols*rows;},
      texture(name,img){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,gl.LUMINANCE,gl.UNSIGNED_BYTE,img);
        [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);textures[name]=t;},
      hasTexture(name){return !!textures[name];},
      begin(){if(lost||!resize())return false;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);return true;},
      sea(s,o){if(!seaBuf||o.alpha<=0)return;const u=sea.u;gl.useProgram(sea.p);camera(sea,s);
        gl.uniform1f(u.uTime,o.time);gl.uniform1f(u.uAmp,o.amp);gl.uniform1f(u.uAlpha,o.alpha);gl.uniform1f(u.uSize,o.size||1.6);gl.uniform1f(u.uPx,dpr);gl.uniform1f(u.uSeaY,o.y);
        gl.uniform2f(u.uSeaW,o.width||9,0);gl.uniform2f(u.uSeaZ,o.near||1,o.far||9);
        for(let i=0;i<4;i++){const r=o.ripples[i]||[0,0,0,0];gl.uniform4f(u['uRip'+i],r[0],r[1],r[2],r[3]);}
        gl.uniform3f(u.uPtr,o.ptr[0],o.ptr[1],o.ptr[2]);gl.uniform2f(u.uGlint,o.glint?o.glint[0]:0,o.glint?o.glint[1]:0);
        attrib(loc.aG,seaBuf,4);gl.drawArrays(gl.POINTS,0,seaCount);off(loc.aG);},
      photo(s,name,o){const t=textures[name];if(!t||o.op<=.001)return;const u=pho.u;gl.useProgram(pho.p);camera(pho,s);
        gl.uniform3f(u.uPos,o.x||0,o.y||0,o.z||0);gl.uniform2f(u.uHalf,o.hw,o.hh);gl.uniform2f(u.uRot,o.tilt||0,o.spin||0);gl.uniform2f(u.uAnchor,0,o.anchor||0);
        gl.uniform1f(u.uOp,o.op);gl.uniform1f(u.uFloor,o.floor==null?.05:o.floor);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(u.uTex,0);
        attrib(loc.aQ,quad,2);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);off(loc.aQ);},
      points(s,o){const A=shapes[o.a],B=shapes[o.b];if(!A||!B||!rnd||o.alpha<=.001)return;const u=pts.u;gl.useProgram(pts.p);camera(pts,s);
        gl.uniform1f(u.uMix,o.mix);gl.uniform1f(u.uStagger,o.stagger||0);gl.uniform1f(u.uArc,o.arc||0);gl.uniform1f(u.uSwirl,o.swirl||0);gl.uniform1f(u.uTime,o.time||0);
        gl.uniform1f(u.uAlpha,o.alpha);gl.uniform1f(u.uSize,o.size||1.6);gl.uniform1f(u.uPx,dpr);gl.uniform1f(u.uDrift,o.drift||0);
        gl.uniform3f(u.uPosA,o.ax||0,o.ay||0,o.az||0);gl.uniform1f(u.uSclA,o.as==null?1:o.as);gl.uniform2f(u.uRotA,o.atilt||0,o.aspin||0);
        gl.uniform3f(u.uPosB,o.bx||0,o.by||0,o.bz||0);gl.uniform1f(u.uSclB,o.bs==null?1:o.bs);gl.uniform2f(u.uRotB,o.btilt||0,o.bspin||0);
        attrib(loc.aA,A,4);attrib(loc.aB,B,4);attrib(loc.aR,rnd,4);gl.drawArrays(gl.POINTS,0,o.count||count);off(loc.aA,loc.aB,loc.aR);},
      // Screen rectangle (DOM element) -> NDC box for the text shield.
      shieldOf(els,pad=14){const c=canvas.getBoundingClientRect();if(!c.width)return [];return els.filter(Boolean).slice(0,3).map(el=>{const r=el.getBoundingClientRect();if(!r.width)return [3,4,3,4];return [((r.left-c.left-pad)/c.width)*2-1,((r.right-c.left+pad)/c.width)*2-1,1-((r.bottom-c.top+pad)/c.height)*2,1-((r.top-c.top-pad)/c.height)*2];});}
    };
  }
  window.Stardust={create,luma,fromLuma,outline,dropDepth,galaxyDepth,cosmos,crown,jet,sphere,spiral,markMap,loadImage,lcg,clamp};
})();
