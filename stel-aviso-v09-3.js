/* STEL V09.3 — scroll-linked, reversible notice after the midpoint of the offers section. */
(()=>{
 'use strict';
 const bar=document.getElementById('st-bf-float'),section=document.getElementById('ofertas');
 if(!bar||!section)return;
 const link=bar.querySelector('a');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const deadline=Date.parse('2026-12-01T00:00:00-03:00');
 const clamp=n=>Math.max(0,Math.min(1,n));
 let last=-1,visible=false;
 function paint(value){
  const p=Date.now()>=deadline?0:clamp(value);
  if(p===last)return;
  last=p;
  bar.style.setProperty('--bf-progress',p.toFixed(4));
  const show=p>.005;
  if(show!==visible){
   visible=show;
   bar.classList.toggle('is-visible',show);
   bar.inert=!show;
   bar.setAttribute('aria-hidden',String(!show));
   link.tabIndex=show?0:-1;
  }
 }
 // The second section's midpoint crosses the center of the viewport.
 // The following 120–180px of scroll resolve the blur and opacity.
 if(window.gsap&&window.ScrollTrigger){
  const {gsap,ScrollTrigger}=window;
  gsap.registerPlugin(ScrollTrigger);
  const mm=gsap.matchMedia();
  mm.add({reduced:'(prefers-reduced-motion: reduce)',normal:'(prefers-reduced-motion: no-preference)'},({conditions})=>{
   const proxy={p:0};
   const tween=gsap.to(proxy,{p:1,duration:1,ease:'none',paused:true,onUpdate:()=>paint(proxy.p)});
   const st=ScrollTrigger.create({trigger:section,start:'center center',end:()=>'+='+Math.min(180,Math.max(120,innerHeight*.18)),animation:tween,scrub:conditions.reduced?true:.16,invalidateOnRefresh:true,onRefresh:self=>paint(self.progress),onUpdate:self=>{if(self.progress===0||self.progress===1)paint(self.progress);}});
   paint(st.progress);
   const restore=()=>{ScrollTrigger.refresh();paint(st.progress);};
   window.addEventListener('pageshow',restore);
   return ()=>{window.removeEventListener('pageshow',restore);st.kill();tween.kill();paint(0);};
  });
 }else{
  let raf=0;
  const update=()=>{raf=0;const rect=section.getBoundingClientRect();const distance=innerHeight/2-(rect.top+rect.height/2);paint(distance/Math.min(180,Math.max(120,innerHeight*.18)));};
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});window.addEventListener('pageshow',schedule);update();
 }
 // Avoid displaying an expired offer on a tab left open overnight.
 document.addEventListener('visibilitychange',()=>{if(Date.now()>=deadline)paint(0);});
})();
