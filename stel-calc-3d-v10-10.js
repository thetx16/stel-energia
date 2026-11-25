/* STEL V10.10 — hover and touch tilt, independent of scroll transforms. */
(()=>{
 'use strict';
 const shell=document.querySelector('.st-calc-tilt-shell');
 const card=shell?.querySelector('.st-calc');
 const slider=card?.querySelector('#bill-range');
 if(!shell||!card||!slider)return;
 const motion=matchMedia('(prefers-reduced-motion:no-preference)');
 const desktop=matchMedia('(hover:hover) and (pointer:fine) and (min-width:801px)');
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const neutral=()=>({rx:0,ry:0,x:50,y:50,light:0});
 let current=neutral(),target=neutral(),raf=0,engaged=false,activePointer=null,touchMode=false;
 const paint=()=>{
  card.style.setProperty('--tilt-rx',current.rx.toFixed(3)+'deg');
  card.style.setProperty('--tilt-ry',current.ry.toFixed(3)+'deg');
  card.style.setProperty('--tilt-x',current.x.toFixed(2)+'%');
  card.style.setProperty('--tilt-y',current.y.toFixed(2)+'%');
  card.style.setProperty('--tilt-light',current.light.toFixed(4));
 };
 const clearClasses=()=>card.classList.remove('is-tilting','is-touch-tilting');
 function step(){
  raf=0;let moving=false;
  for(const k of Object.keys(current)){
   const delta=target[k]-current[k];
   if(Math.abs(delta)>(k==='light'?.0005:.035)){current[k]+=delta*.22;moving=true;}
   else current[k]=target[k];
  }
  paint();
  if(moving)raf=requestAnimationFrame(step);
  else if(!engaged)clearClasses();
 }
 function reset(immediate=false){
  engaged=false;target=neutral();
  if(immediate){if(raf)cancelAnimationFrame(raf);raf=0;current=neutral();paint();clearClasses();}
  else if(!raf&&card.classList.contains('is-tilting'))raf=requestAnimationFrame(step);
 }
 function move(event,touch){
  if(!motion.matches)return;
  const r=shell.getBoundingClientRect();
  if(!r.width||!r.height)return;
  const x=clamp((event.clientX-r.left)/r.width,0,1),y=clamp((event.clientY-r.top)/r.height,0,1);
  engaged=true;
  target={rx:touch?clamp((.5-y)*13+3,-6,8):(.5-y)*11,ry:(x-.5)*(touch?18:13),x:x*100,y:y*100,light:touch?.18:.12};
  card.classList.toggle('is-touch-tilting',touch);
  card.classList.add('is-tilting');
  if(!raf)raf=requestAnimationFrame(step);
 }
 function onDown(event){
  if(!motion.matches||!event.isPrimary||activePointer!==null||event.button!==0)return;
  const touch=event.pointerType==='touch'||!desktop.matches;
  if(!touch&&!slider.contains(event.target)){move(event,false);return;}
  activePointer=event.pointerId;touchMode=touch;move(event,touch);
 }
 shell.addEventListener('pointerdown',onDown,{passive:true});
 shell.addEventListener('pointermove',event=>{
  if(activePointer===null&&desktop.matches&&event.pointerType!=='touch')move(event,false);
 },{passive:true});
 shell.addEventListener('pointerleave',()=>{if(activePointer===null)reset();},{passive:true});
 window.addEventListener('pointermove',event=>{
  if(activePointer===event.pointerId)move(event,touchMode);
 },{passive:true});
 function end(event){
  if(activePointer!==event.pointerId)return;
  const wasTouch=touchMode;activePointer=null;touchMode=false;
  const r=shell.getBoundingClientRect();
  if(wasTouch||event.type==='pointercancel'||event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)reset();
  else move(event,false);
 }
 window.addEventListener('pointerup',end,{passive:true});
 window.addEventListener('pointercancel',end,{passive:true});
 const stop=()=>{activePointer=null;touchMode=false;reset(true);};
 motion.addEventListener('change',stop);desktop.addEventListener('change',stop);
 window.addEventListener('scroll',()=>{if(activePointer===null&&(engaged||raf))reset(true);},{passive:true});
 window.addEventListener('blur',stop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
})();
