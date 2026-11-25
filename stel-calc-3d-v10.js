/* STEL V10 — bounded pointer tilt, no global animation loop. */
(()=>{
 'use strict';
 const shell=document.querySelector('.st-calc-tilt-shell');
 const card=shell?.querySelector('.st-calc');
 const slider=card?.querySelector('#bill-range');
 if(!shell||!card||!slider)return;
 const media=matchMedia('(hover:hover) and (pointer:fine) and (min-width:801px) and (prefers-reduced-motion:no-preference)');
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 let current={rx:0,ry:0,x:50,y:50,light:0},target={...current},raf=0,engaged=false;
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
  if(!media.matches||event.pointerType==='touch'||event.buttons||slider===event.target||card.classList.contains('st-motion-edge')){reset(true);return;}
  const r=shell.getBoundingClientRect();
  if(!r.width||!r.height)return;
  const x=clamp((event.clientX-r.left)/r.width,0,1),y=clamp((event.clientY-r.top)/r.height,0,1);
  engaged=true;target={rx:(.5-y)*11,ry:(x-.5)*13,x:x*100,y:y*100,light:.12};
  card.classList.add('is-tilting');
  if(!raf)raf=requestAnimationFrame(step);
 }
 shell.addEventListener('pointermove',move,{passive:true});
 shell.addEventListener('pointerleave',()=>reset(),{passive:true});
 shell.addEventListener('pointercancel',()=>reset(true),{passive:true});
 shell.addEventListener('pointerdown',()=>reset(true),{passive:true});
 slider.addEventListener('pointerenter',()=>reset(true),{passive:true});
 slider.addEventListener('focus',()=>reset(true));
 media.addEventListener('change',()=>reset(true));
 window.addEventListener('scroll',()=>{if(engaged||raf)reset(true);},{passive:true});
 window.addEventListener('blur',()=>reset(true));
})();
