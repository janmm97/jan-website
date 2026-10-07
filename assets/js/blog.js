/* Blog post pages: the mobile menu and the running head (current section + reading progress). */
(function(){
  'use strict';

  /* Mobile menu, same sheet as the main site. */
  var burger=document.getElementById('burger');
  var menu=document.getElementById('mmenu');
  var closeBtn=document.getElementById('mmenuClose');
  function setMenu(open){
    if(!menu||!burger)return;
    menu.classList.toggle('open',open);
    burger.setAttribute('aria-expanded',String(open));
    document.querySelectorAll('body > header, body > main, body > footer, .runhead, .skip-link').forEach(function(el){el.inert=open;});
    document.body.style.overflow=open?'hidden':'';
    if(open){if(closeBtn)closeBtn.focus();}else{burger.focus();}
  }
  if(burger&&menu){
    burger.addEventListener('click',function(){setMenu(!menu.classList.contains('open'));});
    if(closeBtn)closeBtn.addEventListener('click',function(){setMenu(false);});
    menu.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false);});
    document.addEventListener('keydown',function(e){
      if(!menu.classList.contains('open'))return;
      if(e.key==='Escape'){setMenu(false);return;}
      if(e.key==='Tab'){
        var items=menu.querySelectorAll('button,a[href]');
        var first=items[0],last=items[items.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    });
    window.addEventListener('resize',function(){if(window.innerWidth>820&&menu.classList.contains('open'))setMenu(false);});
  }

  /* Running head. */
  var head=document.querySelector('.runhead');
  var article=document.querySelector('.post');
  if(!head||!article)return;
  var nav=document.querySelector('.nav');
  var toc=document.getElementById('contents');
  var sections=Array.prototype.slice.call(document.querySelectorAll('.post-content h2[id]'));
  var numEl=head.querySelector('.runhead-n');
  var titleEl=head.querySelector('.runhead-title');
  var postTitle=titleEl?titleEl.textContent:'';
  var total=sections.length;
  var pad=function(n){return(n<10?'0':'')+n;};
  var current=-2;
  var queued=false;

  function update(){
    queued=false;
    var navH=nav?nav.offsetHeight:0;
    var line=navH+head.offsetHeight+window.innerHeight*0.25;
    var on=toc?toc.getBoundingClientRect().bottom<navH:window.scrollY>320;
    head.classList.toggle('is-on',on);

    var idx=-1;
    for(var i=0;i<total;i++){
      if(sections[i].getBoundingClientRect().top-line<=0)idx=i;else break;
    }
    if(idx!==current){
      current=idx;
      if(idx<0){
        numEl.textContent='';
        titleEl.textContent=postTitle;
      }else{
        numEl.textContent=pad(idx+1)+' / '+pad(total);
        titleEl.textContent=sections[idx].textContent.trim();
      }
    }

    var r=article.getBoundingClientRect();
    var span=r.height-window.innerHeight;
    var p=span>0?Math.min(1,Math.max(0,-r.top/span)):1;
    head.style.setProperty('--read-progress',p.toFixed(4));
  }
  function queue(){if(!queued){queued=true;requestAnimationFrame(update);}}
  window.addEventListener('scroll',queue,{passive:true});
  window.addEventListener('resize',queue);
  update();
})();
