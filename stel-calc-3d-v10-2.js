/* STEL V10.2 — pointer tilt remains active during native range interaction. */
(()=>{
 'use strict';
 const shell=document.querySelector('.st-calc-tilt-shell');
 const card=shell?.querySelector('.st-calc');
 const slider=card?.querySelector('#bill-range');
 if(!shell||!card||!slider)return;
 const media=matchMedia('(hover:hover) and (pointer:fine) and (min-width:801px) and (prefers-reduced-motion:no-preference)');
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 let current={rx:0,ry:0,x:50,y:50,light:0},target={...current},raf=0,engaged=false,dragPointer=null;
 const neutral=()=>({rx:0,ry:0,x:50,y:50,light:0});
 const paint=()=>{
  card.style.setProperty('--tilt-rx',current.rx.toFixed(3)+'deg');
  card.style.setProperty('--tilt-ry',current.ry.toFixed(3)+'deg');
  card.style.setProperty('--tilt-x',current.x.toFixed(2)+'%');
  card.style.setProperty('--tilt-y',current.y.toFixed(2)+'%');
  card.style.setProperty('--tilt-light',current.light.toFixed(4));
 };
 function step(){
  raf=0;let moving=false;
  for(const key of Object.keys(current)){
   const delta=target[key]-current[key];
   if(Math.abs(delta)>(key==='light'?.0005:.035)){current[key]+=delta*.19;moving=true;}
   else current[key]=target[key];
  }
  paint();
  if(moving)raf=requestAnimationFrame(step);
  else if(!engaged)card.classList.remove('is-tilting');
 }
 function reset(immediate=false){
  engaged=false;target=neutral();
  if(immediate){if(raf)cancelAnimationFrame(raf);raf=0;current=neutral();paint();card.classList.remove('is-tilting');}
  else if(!raf&&card.classList.contains('is-tilting'))raf=requestAnimationFrame(step);
 }
 function move(event){
  if(!media.matches||event.pointerType==='touch'||card.classList.contains('st-motion-edge')){reset(true);return;}
  const r=shell.getBoundingClientRect();
  if(!r.width||!r.height)return;
  const x=clamp((event.clientX-r.left)/r.width,0,1),y=clamp((event.clientY-r.top)/r.height,0,1);
  engaged=true;target={rx:(.5-y)*11,ry:(x-.5)*13,x:x*100,y:y*100,light:.12};
  card.classList.add('is-tilting');
  if(!raf)raf=requestAnimationFrame(step);
 }
 shell.addEventListener('pointermove',move,{passive:true});
 shell.addEventListener('pointerleave',()=>{if(dragPointer===null)reset();},{passive:true});
 shell.addEventListener('pointerdown',move,{passive:true});
 // Track the native slider drag without preventing default or changing its pointer capture.
 slider.addEventListener('pointerdown',event=>{
  if(!media.matches||event.pointerType==='touch'||event.button!==0)return;
  dragPointer=event.pointerId;move(event);
 },{passive:true});
 window.addEventListener('pointermove',event=>{
  if(dragPointer!==null&&event.pointerId===dragPointer)move(event);
 },{passive:true});
 function endDrag(event){
  if(dragPointer===null||event.pointerId!==dragPointer)return;
  dragPointer=null;
  const r=shell.getBoundingClientRect();
  if(event.type==='pointercancel'||event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)reset();
  else move(event);
 }
 window.addEventListener('pointerup',endDrag,{passive:true});
 window.addEventListener('pointercancel',endDrag,{passive:true});
 media.addEventListener('change',()=>{dragPointer=null;reset(true);});
 window.addEventListener('scroll',()=>{if(dragPointer===null&&(engaged||raf))reset(true);},{passive:true});
 window.addEventListener('blur',()=>{dragPointer=null;reset(true);});
})();
