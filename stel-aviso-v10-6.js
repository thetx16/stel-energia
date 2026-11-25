/* STEL V10.6 — stable scroll window, CSS-driven reversible fades. */
(()=>{
 'use strict';
 const bar=document.getElementById('st-bf-float'),section=document.getElementById('ofertas'),form=document.getElementById('cadastro');
 if(!bar||!section||!form)return;
 const link=bar.querySelector('a');
 const deadline=Date.parse('2026-12-01T00:00:00-03:00');
 const margin=12;
 const exitLead=()=>Math.min(140,Math.max(90,innerHeight*.14));
 let visible=false,trigger=null,raf=0;
 function setVisible(next){
  next=Boolean(next&&Date.now()<deadline);
  if(next===visible)return;
  visible=next;
  // The CSS transition keeps the bar painted during the whole fade-out.
  bar.classList.toggle('is-visible',next);
  bar.inert=!next;
  bar.setAttribute('aria-hidden',String(!next));
  link.tabIndex=next?0:-1;
 }
 function updateRange(position,start,end){
  if(!Number.isFinite(position)||!Number.isFinite(start)||!Number.isFinite(end)||end<=start){setVisible(false);return;}
  // A small deadband prevents flicker when the scroll oscillates at either boundary.
  const offset=visible?0:margin;
  setVisible(position>=start+offset&&position<end-offset);
 }
 function fromTrigger(self){
  if(!self)return;
  updateRange(self.scroll(),self.start,self.end);
 }
 function nativeUpdate(){
  raf=0;
  const start=section.getBoundingClientRect().top-innerHeight*.95;
  const end=form.getBoundingClientRect().top-innerHeight-exitLead();
  updateRange(0,start,end);
 }
 function schedule(){
  if(!raf)raf=requestAnimationFrame(nativeUpdate);
 }
 if(window.gsap&&window.ScrollTrigger){
  const {gsap,ScrollTrigger}=window;
  gsap.registerPlugin(ScrollTrigger);
  trigger=ScrollTrigger.create({
   trigger:section,start:'top 95%',
   endTrigger:form,end:()=> 'top bottom+='+exitLead(),
   invalidateOnRefresh:true,
   onUpdate:fromTrigger,onToggle:fromTrigger,onRefresh:fromTrigger
  });
  fromTrigger(trigger);
  window.addEventListener('pageshow',()=>{ScrollTrigger.refresh();fromTrigger(trigger);});
 }else{
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('pageshow',schedule);
  nativeUpdate();
 }
 document.addEventListener('visibilitychange',()=>{
  if(Date.now()>=deadline)setVisible(false);
  else if(!document.hidden){if(trigger)fromTrigger(trigger);else schedule();}
 });
 const remaining=deadline-Date.now();
 if(remaining>0&&remaining<2147483647)setTimeout(()=>setVisible(false),remaining);
})();
