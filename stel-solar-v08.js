/* STEL V08 — Hero05-inspired radial reveal, without per-frame canvas encoding. */
(()=>{
  'use strict';
  const root=document.querySelector('.st-solar-module');
  if(!root)return;
  const tabs=[...root.querySelectorAll('[role="tab"]')];
  const tablist=root.querySelector('[role="tablist"]');
  const panels=tabs.map(tab=>document.getElementById(tab.getAttribute('aria-controls')));
  const pointer=matchMedia('(hover: hover) and (pointer: fine)');
  const compact=matchMedia('(max-width: 800px)');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let selected=0;
  const controllers=panels.map(panel=>{
    const stage=panel.querySelector('.st-solar-stage');
    const before=stage.querySelector('.st-solar-before');
    const after=stage.querySelector('.st-solar-after');
    const toggle=panel.querySelector('.st-solar-toggle');
    const toggleText=toggle.querySelector('.st-solar-toggle-text');
    const badge=stage.querySelector('.st-solar-badge-text');
    const category=stage.dataset.category.toLowerCase();
    let full=false,hover=false,raf=0,initialized=false;
    let x=50,y=50,tx=50,ty=50;
    function label(){
      const shown=full||hover;
      badge.textContent=full?'Com energia solar':hover?'Revelando energia solar':'Sem energia solar';
      if(!stage.classList.contains('st-solar-ready')&&shown)badge.textContent='Carregando simulação…';
      stage.setAttribute('aria-label','Simulação ilustrativa '+category+': '+(full?'ambiente com energia solar':'ambiente sem energia solar, com comparação disponível'));
      toggle.setAttribute('aria-pressed',String(full));
      toggleText.textContent=full?'Ver sem energia solar':'Ver com energia solar';
    }
    function load(){
      if(initialized)return;
      initialized=true;
      if(before.dataset.src){before.src=before.dataset.src;delete before.dataset.src;}
      const ready=()=>{if(after.naturalWidth){stage.classList.add('st-solar-ready');label();}};
      after.addEventListener('load',ready,{once:true});
      after.addEventListener('error',()=>{initialized=false;stage.classList.remove('st-solar-ready');badge.textContent='Imagem indisponível';},{once:true});
      after.src=after.dataset.src;
      if(after.complete)ready();
    }
    function paint(){stage.style.setProperty('--solar-x',x.toFixed(3)+'%');stage.style.setProperty('--solar-y',y.toFixed(3)+'%');}
    function step(){raf=0;if(!hover||full)return;const factor=reduced.matches?1:.16;x+=(tx-x)*factor;y+=(ty-y)*factor;paint();if(Math.abs(tx-x)+Math.abs(ty-y)>.08)raf=requestAnimationFrame(step);}
    function point(e,first=false){
      if(!pointer.matches||e.pointerType==='touch'||full)return;
      load();const r=stage.getBoundingClientRect();
      if(!r.width||!r.height)return;
      tx=Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100));
      ty=Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100));
      if(first||!hover||reduced.matches){x=tx;y=ty;paint();}
      hover=true;stage.classList.add('st-solar-hover');label();
      if(!raf)raf=requestAnimationFrame(step);
    }
    function leave(){hover=false;if(raf)cancelAnimationFrame(raf);raf=0;stage.classList.remove('st-solar-hover');label();}
    function reset(){leave();full=false;stage.classList.remove('st-solar-full');x=y=tx=ty=50;paint();label();}
    stage.addEventListener('pointerenter',e=>point(e,true),{passive:true});
    stage.addEventListener('pointermove',e=>point(e),{passive:true});
    stage.addEventListener('pointerleave',leave,{passive:true});
    stage.addEventListener('pointercancel',leave,{passive:true});
    toggle.addEventListener('click',()=>{load();leave();full=!full;stage.classList.toggle('st-solar-full',full);label();});
    return {load,reset,leave};
  });
  function select(index,focus=false){
    if(index<0||index>=tabs.length)return;
    if(index!==selected)controllers[selected].reset();
    selected=index;
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});
    controllers[index].load();
    if(focus)tabs[index].focus({preventScroll:true});
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>select(i));
    tab.addEventListener('keydown',e=>{
      let next;
      if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%tabs.length;
      else if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i-1+tabs.length)%tabs.length;
      else if(e.key==='Home')next=0;
      else if(e.key==='End')next=tabs.length-1;
      else return;
      e.preventDefault();select(next,true);
    });
  });
  function orientation(){tablist.setAttribute('aria-orientation',compact.matches?'horizontal':'vertical');}
  orientation();compact.addEventListener('change',orientation);
  pointer.addEventListener('change',()=>controllers.forEach(c=>c.leave()));
  // Only fetch the active comparison near its section; other pairs load on tab selection.
  if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){controllers[selected].load();io.disconnect();}},{rootMargin:'250px 0px'});io.observe(root);}else controllers[0].load();
})();
