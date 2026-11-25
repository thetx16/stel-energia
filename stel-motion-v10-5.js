/* STEL V09 — bidirectional motion with unclipped text. */
(() => {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  const {gsap,ScrollTrigger}=window;
  const root=document.querySelector('.st-landing');
  const sign=document.querySelector('.campaign-sign');
  if(!root || !sign) return;
  gsap.registerPlugin(ScrollTrigger);
  const clamp=n=>Math.max(0,Math.min(1,n));
  const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
  const mm=gsap.matchMedia();
  mm.add({motion:'(prefers-reduced-motion: no-preference)',desktop:'(min-width: 801px) and (pointer: fine)'},({conditions})=>{
    if(!conditions.motion)return;
    const desktop=conditions.desktop;
    const reducedData=Boolean(navigator.connection?.saveData);
    const records=[];
    const originals=[];
    const glints=[];
    let observer,disposed=false;
    const activeClass='st-motion-edge';
    const commonVars=['--st-opacity','--st-x','--st-y','--st-scale','--st-filter','--st-cut-top','--st-cut-bottom','--st-glint-alpha','--st-glint-x'];
    const bandVars=['--st-band-filter'];
    function vars(el,values){for(const [key,value] of Object.entries(values))el.style.setProperty(key,String(value));}
    function reset(el,cls,keys){el.classList.remove(cls);keys.forEach(k=>el.style.removeProperty(k));}
    // ScrollTrigger tracks a proxy instead of transforming its own measured trigger.
    // A fully visible plateau preserves crisp text and avoids constant filter painting.
    function attach(el,paint,clear,{anchor=el,phase=0,endAtBottom=false}={}){
      const proxy={p:0};
      let total=1,entry=.25,exit=.2,last=-1;
      const record={el,clear,draw:null,trigger:null,tween:null};
      function measure(st){
        total=Math.max(1,st.end-st.start);
        entry=Math.min(.48,Math.max(.08,innerHeight*(desktop?.27:.23)/total));
        exit=endAtBottom?0:Math.min(.35,Math.max(.06,innerHeight*.20/total));
        last=-1;
      }
      function draw(){
        if(disposed)return;
        const p=clamp(proxy.p);
        if(el.contains(document.activeElement)){clear();last=-1;return;}
        if(Math.abs(p-last)<.0005)return;
        last=p;
        const a=smooth(clamp((p/entry-phase)/(1-phase)));
        const b=exit?smooth(clamp((p-(1-exit))/exit)):0;
        if(a>.999 && b<.001){clear();return;}
        paint(a,b);
      }
      record.draw=()=>{last=-1;draw();};
      const tween=gsap.to(proxy,{p:1,ease:'none',duration:1,paused:true,onUpdate:draw});
      const st=ScrollTrigger.create({trigger:anchor,start:'top bottom',end:endAtBottom?'clamp(bottom top)':'bottom top',animation:tween,scrub:desktop?.22:.12,invalidateOnRefresh:false,onRefresh:self=>{measure(self);record.draw();}});
      record.trigger=st;record.tween=tween;records.push(record);
      measure(st);record.draw();
    }
    // Wrap words, not characters: preserve natural wrapping, semantic headings and italic spans.
    function makeWave(heading){
      const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);
      const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
      const words=[];
      for(const node of nodes){
        if(!node.data.trim())continue;
        const parent=node.parentNode;
        const marker=document.createComment('st-wave');
        const frag=document.createDocumentFragment(),inserted=[];
        frag.append(marker);
        for(const part of node.data.match(/\s+|[^\s]+/g)||[]){
          if(/^\s+$/.test(part)){const t=document.createTextNode(part);frag.append(t);inserted.push(t);continue;}
          const mask=document.createElement('span'),ink=document.createElement('span');
          mask.className='st-word-mask';ink.className='st-word-ink';ink.textContent=part;
          mask.append(ink);frag.append(mask);inserted.push(mask);words.push(ink);
        }
        parent.replaceChild(frag,node);
        originals.push(()=>{if(marker.parentNode){inserted.forEach(n=>n.remove());marker.replaceWith(node);}});
      }
      if(!words.length)return;
      heading.classList.add('st-motion-wave');
      const clear=()=>{heading.classList.remove('st-wave-edge');words.forEach(w=>['--st-word-y','--st-word-alpha','--st-word-filter'].forEach(k=>w.style.removeProperty(k)));};
      attach(heading,(a,b)=>{
        heading.classList.add('st-wave-edge');
        words.forEach((word,i)=>{
          const delay=words.length>1?i/(words.length-1)*.34:0;
          const localIn=smooth(clamp((a-delay)/(1-delay)));
          const localOut=smooth(clamp((b-delay*.55)/(1-delay*.55)));
          const visible=localIn*(1-localOut);
          vars(word,{'--st-word-y':((1-localIn)*26-localOut*22).toFixed(2)+'%','--st-word-alpha':(.18+.82*visible).toFixed(3),'--st-word-filter':desktop&&!reducedData?'blur('+((1-visible)*2.3).toFixed(2)+'px)':'none'});
        });
      },clear);
      originals.push(()=>heading.classList.remove('st-motion-wave'));
    }
    root.querySelectorAll('.st-section h2').forEach(makeWave);
    // Different motion families share the same position envelope, not a one-shot state.
    const selectors=['.st-tag','.st-lead','.st-clock','.st-offer','.st-follow > *','.st-split > div:first-child > .pill','.st-calc','.st-segment','.st-solar-tabs','.st-solar-display','.st-photo','.st-bento-cta','.st-project-note','.st-big-number','.st-checks li','.st-about-pics','.st-faq details','.st-contact-panel > .form-card'];
    const targets=[...new Set(root.querySelectorAll(selectors.join(',')))];
    for(const el of targets){
      const isCard=el.matches('.st-card,.st-photo,.form-card,.st-about-pics');
      const isPhoto=el.matches('.st-photo');
      const group=el.closest('.st-offer-grid,.st-segment-grid,.st-bento,.st-checks,.st-faq');
      const i=group?[...group.children].indexOf(el):0;
      const phase=desktop?Math.max(0,Math.min(i,3))*.065:0;
      const side=i%2===0?-1:1;
      const curtain=isCard&&!el.matches('.st-about-pics,.form-card');
      if(curtain)el.classList.add('st-motion-card');
      if(curtain&&!reducedData&&desktop){
        const g=document.createElement('span');g.className='st-motion-glint';g.setAttribute('aria-hidden','true');el.append(g);glints.push(g);
      }
      const clear=()=>reset(el,activeClass,commonVars);
      attach(el,(a,b)=>{
        const unseen=1-a,visible=a*(1-b),edge=Math.max(unseen,b);
        el.classList.add(activeClass);
        const alpha=(.12+.88*visible).toFixed(3);
        const shiftY=(unseen*(isCard?40:25)-b*(isCard?32:20))*(desktop?1:.55);
        const shiftX=desktop&&isCard?side*(unseen*6-b*4):0;
        const zoom=isCard?1+unseen*(desktop?.025:0)-b*.02:1;
        const blur=desktop&&!reducedData?edge*(isCard?(isPhoto?3:4):2):0;
        vars(el,{'--st-opacity':alpha,'--st-x':shiftX.toFixed(2)+'px','--st-y':shiftY.toFixed(2)+'px','--st-scale':zoom.toFixed(4),'--st-filter':blur>.15?'blur('+blur.toFixed(2)+'px)':'none','--st-glint-alpha':(.18*Math.sin(Math.PI*a)*(1-b)).toFixed(3),'--st-glint-x':(-95+a*195).toFixed(2)+'%'});
      },clear,{phase,endAtBottom:el.matches('.st-contact-panel > .form-card')});
      originals.push(()=>el.classList.remove('st-motion-card'));
    }
    // The bands keep their original geometry, color and marquee. Only focus follows scroll.
    const bands=[...sign.querySelectorAll('.ribbon')];
    bands.forEach(band=>{
      const clear=()=>reset(band,'st-band-edge',bandVars);
      attach(band,(a,b)=>{
        const edge=Math.max(1-a,b);
        const amount=edge*(reducedData?1.5:desktop?6:3);
        band.classList.add('st-band-edge');
        vars(band,{'--st-band-filter':amount>.05?'blur('+amount.toFixed(2)+'px)':'none'});
      },clear,{anchor:sign});
    });
    if('IntersectionObserver' in window){
      observer=new IntersectionObserver(([entry])=>sign.classList.toggle('st-ribbons-idle',!entry.isIntersecting),{rootMargin:'100px 0px'});
      observer.observe(sign);
    }
    function focus(event){records.filter(r=>r.el.contains(event.target)).forEach(r=>r.clear());}
    function blur(){requestAnimationFrame(()=>records.forEach(r=>r.draw()));}
    function restore(){ScrollTrigger.refresh();records.forEach(r=>r.draw());}
    root.addEventListener('focusin',focus);root.addEventListener('focusout',blur);
    window.addEventListener('pageshow',restore);
    document.fonts?.ready.then(()=>{if(!disposed)restore();});
    requestAnimationFrame(()=>{if(!disposed)restore();});
    return ()=>{
      disposed=true;
      observer?.disconnect();sign.classList.remove('st-ribbons-idle');
      root.removeEventListener('focusin',focus);root.removeEventListener('focusout',blur);window.removeEventListener('pageshow',restore);
      records.forEach(r=>{r.trigger.kill();r.tween.kill();r.clear();});
      glints.forEach(el=>el.remove());originals.reverse().forEach(fn=>fn());
    };
  });
})();
