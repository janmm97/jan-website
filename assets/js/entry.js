(()=>{'use strict';
const dialog=document.querySelector('#entryDialog'),form=document.querySelector('#entryForm'),submit=form.querySelector('button[type=submit]'),status=document.querySelector('#entryStatus');
// localStorage keeps the introduction across tabs and browser restarts; sessionStorage is the fallback where it is blocked.
const KEY='jan-visitor-entered';
function remembered(store){try{return window[store].getItem(KEY)==='1'}catch{return false}}
function remember(){for(const store of ['localStorage','sessionStorage'])try{window[store].setItem(KEY,'1')}catch{}}
const unlocked=remembered('localStorage')||remembered('sessionStorage');
function unlock(){document.documentElement.classList.remove('entry-pending');dialog.close();document.body.style.overflow='';document.dispatchEvent(new Event('portfolio:entered'));document.querySelector('.page.active [data-heading]')?.focus({preventScroll:true})}
if(unlocked){remember();unlock();return}
dialog.showModal();document.body.style.overflow='hidden';dialog.addEventListener('cancel',e=>e.preventDefault());
window.addEventListener('hashchange',()=>{if(dialog.open){document.body.style.overflow='hidden';requestAnimationFrame(()=>form.elements.fullName.focus({preventScroll:true}))}});
form.addEventListener('submit',async e=>{
 e.preventDefault();if(submit.disabled||!form.reportValidity())return;
 submit.disabled=true;submit.textContent='Saving your details…';form.setAttribute('aria-busy','true');status.textContent='';
 const fullName=form.elements.fullName.value.trim(),email=form.elements.email.value.trim();
 try{
  if(!fullName){form.elements.fullName.focus();throw new Error('Please enter your full name.')}
  const endpoint=window.PORTFOLIO_VISITOR_ENDPOINT;
  if(!endpoint)throw new Error('Visitor registration is not available yet. Please come back shortly.');
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fullName,email,website:form.elements.website.value}),signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.saved!==true)throw new Error(response.status===429?'Too many attempts. Please wait a minute and try again.':'Your details could not be saved right now. Please try again shortly.');
  remember();form.reset();unlock();
 }catch(error){status.textContent=error.name==='TimeoutError'?'The connection took too long. Please try again.':error instanceof TypeError?'Unable to connect. Check your connection and try again.':error.message}
 finally{submit.disabled=false;submit.textContent='Enter the portfolio';form.removeAttribute('aria-busy')}
});
})();
