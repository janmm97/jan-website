/* Project and article discovery; the visual performance lives in cinema.js. */
(()=>{
  'use strict';
  const workbench=document.querySelector('.project-workbench'),cards=[...document.querySelectorAll('.projects-grid .pcard')],index=document.querySelector('.project-index');
  let category='all',selected=0,listMode=true;
  const indexHint=document.createElement('p');indexHint.className='project-index-hint';indexHint.setAttribute('role','status');
  if(workbench)workbench.before(indexHint);
  const categoryOf=i=>i<2?'agents':'workflows';
  function showProjects(){
    const valid=cards.map((_,i)=>i).filter(i=>category==='all'||category===categoryOf(i));
    if(!valid.includes(selected))selected=valid[0];
    indexHint.hidden=listMode;indexHint.replaceChildren(document.createTextNode(valid.length+' projects'));const hint=document.createElement('span');hint.textContent=' · Swipe the titles to browse';indexHint.append(hint);
    cards.forEach((card,i)=>{card.hidden=!valid.includes(i)||(!listMode&&selected!==i)});
    [...index.children].forEach((button,i)=>{button.hidden=!valid.includes(i);button.setAttribute('aria-current',String(selected===i))});
    workbench.classList.toggle('list-mode',listMode);
  }
  if(cards.length&&workbench&&index){
    cards.forEach((card,i)=>{card.id='project-'+i;const b=document.createElement('button');b.type='button';b.setAttribute('aria-controls',card.id);const title=document.createElement('span');title.textContent=card.querySelector('.pcard-title').textContent;const meta=document.createElement('small');meta.textContent=categoryOf(i)==='agents'?'Agent system':'Connected workflow';b.append(title,meta);b.addEventListener('click',()=>{selected=i;showProjects()});index.append(b)});
    workbench.classList.add('enhanced');index.hidden=false;document.querySelector('.project-tools').hidden=false;
    document.querySelectorAll('[data-project-filter]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.projectFilter;document.querySelectorAll('[data-project-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));showProjects()}));
    document.getElementById('projectView').addEventListener('click',e=>{listMode=!listMode;e.currentTarget.textContent=listMode?'Show project explorer':'Show all projects';e.currentTarget.setAttribute('aria-pressed',String(listMode));showProjects()});showProjects();
  }

  const notes=[...document.querySelectorAll('.post-entry')],search=document.getElementById('journalSearch');let topic='all';
  // Topic, label and dot pattern per post, keyed by its URL so new posts and reordering don't shift them.
  const NOTE_META={
    'ai-marketing-agents-claude-code':['guides','Guide / AI agents',2],
    'human-in-the-loop-ai-agents':['guides','Guide / building systems',2],
    'deepseek-v4-1-flash-vs-claude-sonnet-5-5':['experiments','Experiment / model tests',0],
    'claude-haiku-5-5-vs-deepseek-v4-1-flash-vs-gpt-6-luna':['experiments','Experiment / research agents',0],
    'virtual-assistant-job-sites':['guides','Guide / virtual assistance',1],
    'what-to-learn-instead-of-ai-automation':['guides','Guide / building systems',2],
  };
  notes.forEach(note=>{
    const slug=(note.querySelector('a')?.getAttribute('href')||'').split('/').filter(Boolean).pop();
    const [kind,topicLabel,i]=NOTE_META[slug]||['guides','Guide',2];
    note.dataset.topic=kind;
    const art=document.createElement('div');art.className='note-art';art.setAttribute('aria-hidden','true');
    const c=document.createElement('canvas');art.append(c);note.children[1].prepend(art);
    const label=document.createElement('p');label.className='note-topic';label.textContent=topicLabel;note.children[1].append(label);
    new ResizeObserver(()=>{const w=art.clientWidth,h=art.clientHeight;if(!w)return;c.width=w*2;c.height=h*2;const cx=c.getContext('2d');cx.scale(2,2);cx.fillStyle='#b8b8b8';for(let j=0;j<480;j++){const a=j*.19,r=8+Math.sqrt(j)*4;let x=w/2+Math.cos(a)*r*1.65,y=h/2+Math.sin(a)*r*.5;if(i===1){x=20+(j%60)*(w-40)/60;y=20+Math.floor(j/60)*(h-40)/8;}if(i===2){x=20+j/480*(w-40);y=h/2+Math.sin(j*.04)*h*.3;}cx.globalAlpha=.3+(j%7)/10;cx.fillRect(x,y,1.5,1.5)}}).observe(art);
  });
  function filterNotes(){const q=search.value.trim().toLowerCase();let count=0;notes.forEach(n=>{n.hidden=!(topic==='all'||n.dataset.topic===topic)||!n.textContent.toLowerCase().includes(q);n.classList.remove('featured-note');if(!n.hidden)count++});notes.find(n=>!n.hidden)?.classList.add('featured-note');document.getElementById('journalCount').textContent=count+' '+(count===1?'note':'notes');document.getElementById('journalEmpty').hidden=count!==0}
  if(search){document.querySelector('.journal-tools').hidden=false;search.addEventListener('input',filterNotes);document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{topic=b.dataset.topic;document.querySelectorAll('[data-topic]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));filterNotes()}));document.getElementById('clearJournal').addEventListener('click',()=>{search.value='';topic='all';document.querySelectorAll('[data-topic]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.topic==='all')));filterNotes();search.focus()});filterNotes()}
})();
