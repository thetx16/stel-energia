/* STEL V09.9 — reversible promotional notice between offers and lead form. */
(()=>{
 'use strict';
 const bar=document.getElementById('st-bf-float'),section=document.getElementById('ofertas'),form=document.getElementById('cadastro');
 if(!bar||!section||!form)return;
 const link=bar.querySelector('a');
 const deadline=Date.parse('2026-12-01T00:00:00-03:00');
 const clamp=n=>Math.max(0,Math.min(1,n));
 const entryDistance=()=>Math.min(120,Math.max(80,innerHeight*.12));
 const exitDistance=()=>Math.min(120,Math.max(80,innerHeight*.12));
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
 if(window.gsap&&window.ScrollTrigger){
  const {gsap,ScrollTrigger}=window;
  gsap.registerPlugin(ScrollTrigger);
  const mm=gsap.matchMedia();
  mm.add({reduced:'(prefers-reduced-motion: reduce)',normal:'(prefers-reduced-motion: no-preference)'},({conditions})=>{
   let entry=0,exit=0;
   const draw=()=>paint(Math.min(entry,1-exit));
   const create=(trigger,start,end,set)=>{
    const proxy={p:0};
    const apply=p=>{set(p);draw();};
    const tween=gsap.to(proxy,{p:1,duration:1,ease:'none',paused:true,onUpdate:()=>apply(proxy.p)});
    const st=ScrollTrigger.create({trigger,start,end,animation:tween,scrub:conditions.reduced?true:.16,invalidateOnRefresh:true,onRefresh:self=>apply(self.progress),onUpdate:self=>{if(self.progress===0||self.progress===1)apply(self.progress);}});
    apply(st.progress);
    return {st,tween};
   };
   const entering=create(section,'top 95%',()=>'+='+entryDistance(),p=>{entry=p;});
   // Finish fading out just as the form section enters the viewport.
   const leaving=create(form,()=> 'top bottom+='+exitDistance(),'top bottom',p=>{exit=p;});
   const restore=()=>{ScrollTrigger.refresh();entry=entering.st.progress;exit=leaving.st.progress;draw();};
   window.addEventListener('pageshow',restore);
   return ()=>{window.removeEventListener('pageshow',restore);entering.st.kill();leaving.st.kill();entering.tween.kill();leaving.tween.kill();paint(0);};
  });
 }else{
  let raf=0;
  const update=()=>{raf=0;const start=section.getBoundingClientRect().top;const finish=form.getBoundingClientRect().top;paint(Math.min(clamp((innerHeight*.95-start)/entryDistance()),clamp((finish-innerHeight)/exitDistance())));};
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(update);};
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});window.addEventListener('pageshow',schedule);update();
 }
 document.addEventListener('visibilitychange',()=>{if(Date.now()>=deadline)paint(0);});
})();
