/* STEL V10.1 — rolling digits and visible-only card spotlights. */
(()=>{
 'use strict';
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const clock=document.getElementById('count-row');
 if(clock){
  const deadline=Date.parse('2026-12-01T00:00:00-03:00');
  const boxes=['d','h','m','s'].map(k=>document.getElementById('cd-'+k));
  const units=clock.querySelector('.st-count');
  const floating=document.querySelector('.st-bf-countdown');
  const floatingBar=document.getElementById('st-bf-float');
  const title=clock.querySelector('.count-text');
  const labels=['dias','horas','minutos','segundos'];
  const slots=boxes.map(box=>({box,value:null,digits:[]}));
  const floatingSlots=floating?['d','h','m','s'].map(k=>({box:document.getElementById('bf-cd-'+k),value:null,digits:[]})):[];
  let timer=0,visible=false;
  function set(slot,value,animate){
   if(slot.value===value)return;
   const {box}=slot;
   if(slot.digits.length!==value.length){
    box.textContent='';slot.digits=[];
    for(const ch of value){
     const wrap=document.createElement('span'),ink=document.createElement('span');
     wrap.className='st-roll-digit';wrap.setAttribute('aria-hidden','true');
     ink.textContent=ch;wrap.append(ink);box.append(wrap);slot.digits.push({wrap,ink,ch,animation:null});
    }
   }else{
    [...value].forEach((ch,i)=>{
     const d=slot.digits[i];if(d.ch===ch)return;
     d.animation?.cancel();d.wrap.replaceChildren(d.ink);d.ink.textContent=d.ch;
     if(animate&&typeof d.ink.animate==='function'){
      const outgoing=d.ink, incoming=document.createElement('span');incoming.textContent=ch;
      d.wrap.append(incoming);d.ink=incoming;
      const a=outgoing.animate([{transform:'translateY(0)'},{transform:'translateY(-110%)'}],{duration:420,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});
      const b=incoming.animate([{transform:'translateY(110%)'},{transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.65,0,.35,1)'});
      d.animation=b;b.onfinish=()=>{outgoing.remove();a.cancel();if(d.animation===b)d.animation=null;};
     }else d.ink.textContent=ch;
     d.ch=ch;
    });
   }
   slot.value=value;box.setAttribute('aria-label',value);
  }
  function tick(){
   clearTimeout(timer);
   const remain=Math.max(0,deadline-Date.now()),s=Math.floor(remain/1000);
   const parts=[Math.floor(s/86400),Math.floor(s/3600)%24,Math.floor(s/60)%60,s%60];
   slots.forEach((slot,i)=>set(slot,String(parts[i]).padStart(2,'0'),visible&&!document.hidden&&!reduce.matches));
   const description=parts.map((n,i)=>n+' '+labels[i]).join(', ');
   units.setAttribute('aria-label',description);
   const floatingVisible=Boolean(floatingBar?.classList.contains('is-visible'));
   floatingSlots.forEach((slot,i)=>set(slot,String(parts[i]).padStart(2,'0'),floatingVisible&&!document.hidden&&!reduce.matches));
   floating?.setAttribute('aria-label',description);
   if(!remain){clock.classList.add('st-clock-done');title.textContent='A campanha de novembro foi encerrada. Consulte as condições atuais com a STEL.';return;}
   if(!document.hidden)timer=setTimeout(tick,1000-Date.now()%1000);
  }
  if('IntersectionObserver' in window){new IntersectionObserver(([e])=>{visible=e.isIntersecting;clock.classList.toggle('st-clock-active',visible);}).observe(clock);}
  else{visible=true;clock.classList.add('st-clock-active');}
  document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden)tick();});
  window.addEventListener('pageshow',tick);tick();
 }
 const root=document.querySelector('.st-landing');
 if(!root)return;
 const media=matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
 const groups=[
  ['.st-offer-grid','.st-offer'],
  ['.st-count',':scope > div'],
  ['.st-calc-tilt-shell','.st-calc,.st-calc-results > div'],
  ['.st-solar-module','.st-solar-tab,.st-solar-panel'],
  ['.st-bento','.st-photo,.st-bento-cta'],
  ['.st-about-pics','figure'],
  ['.st-faq','.st-faq-item'],
  ['.st-contact-panel','.form-card',true]
 ];
 const states=[];const registered=new Set();let raf=0,lastFrame=0;
 const clear=state=>state.cards.forEach(c=>c.classList.remove('st-spot-on'));
 function paint(state,x,y){
  state.cards.forEach(card=>{
   const r=card.getBoundingClientRect();
   if(!r.width||!r.height||card.hidden){card.classList.remove('st-spot-on');return;}
   const dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom);
   const near=dx*dx+dy*dy<245*245;
   card.classList.toggle('st-spot-on',near);
   if(near){
    // Normalize coordinates against the projected card while the calculator tilts.
    const w=card.clientWidth||r.width,h=card.clientHeight||r.height;
    card.style.setProperty('--spot-x',((x-r.left)*w/r.width).toFixed(1)+'px');
    card.style.setProperty('--spot-y',((y-r.top)*h/r.height).toFixed(1)+'px');
   }
  });
 }
 function loop(now){
  raf=0;if(!media.matches||document.hidden)return;
  if(now-lastFrame>=32){
   lastFrame=now;
   states.forEach(state=>{
    if(!state.visible)return;
    if(state.hover&&now-state.last<2500){paint(state,state.x,state.y);return;}
    if(navigator.connection?.saveData){clear(state);return;}
    const r=state.el.getBoundingClientRect(),t=now/1000;
    if(!r.width||!r.height)return;
    paint(state,r.left+r.width*(.5+.47*Math.sin(t*.6+state.phase)),r.top+r.height*(.5+.45*Math.sin(t*1.1+state.phase)));
   });
  }
  if(states.some(s=>s.visible))raf=requestAnimationFrame(loop);
 }
 function sync(){
  if(!media.matches||document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;states.forEach(clear);return;}
  if(!raf&&states.some(s=>s.visible))raf=requestAnimationFrame(loop);
 }
 groups.forEach(([selector,cardSelector,includeGroup],phase)=>{
  const el=root.querySelector(selector);if(!el)return;
  const candidates=[...(includeGroup?[el]:[]),...el.querySelectorAll(cardSelector)];
  const cards=candidates.filter(card=>!registered.has(card));
  if(!cards.length)return;
  cards.forEach(card=>{
   registered.add(card);
   card.classList.add('st-spot-target');
   // Do not override positioned photos or the calculator's 3D transform context.
   if(getComputedStyle(card).position==='static')card.classList.add('st-spot-position');
   const light=document.createElement('span');light.className='st-spot-light';light.setAttribute('aria-hidden','true');
   const host=card.matches('details')?card.querySelector('summary'):card;
   (host||card).append(light);
  });
  const state={el,cards,phase,visible:false,hover:false,last:0,x:0,y:0};states.push(state);
  el.addEventListener('pointermove',e=>{if(!media.matches||e.pointerType==='touch')return;state.hover=true;state.last=performance.now();state.x=e.clientX;state.y=e.clientY;sync();},{passive:true});
  el.addEventListener('pointerleave',()=>{state.hover=false;},{passive:true});
 });
 if('IntersectionObserver' in window){
  const io=new IntersectionObserver(entries=>{entries.forEach(e=>{const s=states.find(s=>s.el===e.target);if(!s)return;s.visible=e.isIntersecting;if(!s.visible){s.hover=false;clear(s);}});sync();});
  states.forEach(s=>io.observe(s.el));
 }else{states.forEach(s=>{s.visible=true;});sync();}
 media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
})();
