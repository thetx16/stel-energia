/* STEL V06 — viewport-triggered reveals. Content stays visible without JS. */
(() => {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  const root = document.querySelector('.st-landing');
  const sign = document.querySelector('.campaign-sign');
  if (!root || !sign) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add({
    motion: '(prefers-reduced-motion: no-preference)',
    desktop: '(min-width: 801px) and (pointer: fine)'
  }, ({ conditions }) => {
    if (!conditions.motion) return;
    const desktop = conditions.desktop;
    const candidates = Array.from(root.querySelectorAll([
      '.st-head > div:first-child', '.st-head > .st-lead', '.st-clock',
      '.st-offer', '.st-follow > *', '.st-split > div:first-child',
      '.st-calc', '.st-segment', '.st-photo', '.st-bento-cta',
      '.st-project-note', '.st-about-pics', '.st-faq-grid > div:first-child',
      '.st-faq details', '.st-contact-panel > div:first-child',
      '.st-contact-panel > .form-card', '.st-footer .st-wrap'
    ].join(',')));
    // Keep initial/restored viewport accessible. Only prepare elements about to enter.
    const pending = new Set(candidates.filter(el => el.getBoundingClientRect().top >= innerHeight * .94));
    const active = new Map();
    const played = new Set();
    const ribbonEls = [...sign.querySelectorAll('.ribbon')];
    let ribbonPlayed = false;
    let disposed = false;
    let observer;
    const clear = el => {
      el.classList.remove('st-revealing');
      gsap.set(el, {clearProps:'opacity,filter,transform'});
    };
    const finish = el => {
      if (!pending.has(el) && !active.has(el)) return;
      pending.delete(el);
      played.add(el);
      const tween = active.get(el);
      active.delete(el);
      if (tween) tween.kill();
      clear(el);
    };
    // Opacity only while waiting; blur/scale are applied just for the short entrance.
    gsap.set([...pending], {opacity: .15});
    function enter(batch) {
      if (disposed) return;
      batch.filter(el => pending.has(el) && !played.has(el)).forEach((el, index) => {
        pending.delete(el);
        played.add(el);
        el.classList.add('st-revealing');
        const isCard = el.matches('.st-card,.st-photo,.form-card,.st-about-pics');
        const tween = gsap.fromTo(el,
          {opacity:.15, y:desktop ? 24 : 14, scale:isCard ? (desktop ? 1.045 : 1.025) : 1.018, filter:'blur(' + (desktop ? 6 : 3) + 'px)'},
          {opacity:1, y:0, scale:1, filter:'blur(0px)', duration:desktop ? .76 : .55, delay:Math.min(index,2)*.075,
            ease:'power3.out', overwrite:'auto',
            onComplete:() => {active.delete(el);clear(el);}
          });
        active.set(el,tween);
      });
    }
    const triggers = ScrollTrigger.batch([...pending],{
      start:'top 95%', end:'bottom top', once:true,
      interval:.06, batchMax:3,
      onEnter:enter, onEnterBack:enter,
      onLeave:batch=>batch.forEach(finish)
    });
    // Keyboard navigation must never land on a dimmed or blurred control.
    function onFocus(event) {
      const el=candidates.find(candidate=>candidate.contains(event.target));
      if(el) finish(el);
    }
    root.addEventListener('focusin',onFocus);
    // Crossed bands keep their CSS angles and continuous child-track motion.
    function enterRibbons() {
      if(disposed || ribbonPlayed) return;
      ribbonPlayed=true;
      ribbonEls.forEach((el,i)=>{
        el.classList.add('st-revealing');
        const tween=gsap.fromTo(el,
          {opacity:.18,scale:desktop?1.035:1.02,xPercent:i===0?-3:3,filter:'blur('+(desktop?5:2.5)+'px)'},
          {opacity:1,scale:1,xPercent:0,filter:'blur(0px)',duration:desktop?.9:.65,delay:i*.09,ease:'power3.out',overwrite:'auto',
            onComplete:()=>{active.delete(el);clear(el);}
          });
        active.set(el,tween);
      });
    }
    const ribbonTrigger=ScrollTrigger.create({trigger:sign,start:'top 95%',end:'bottom top',once:true,onEnter:enterRibbons,onEnterBack:enterRibbons});
    // No offscreen marquee painting. Preserve loop phase when it comes back.
    if('IntersectionObserver' in window){
      observer=new IntersectionObserver(([entry])=>sign.classList.toggle('st-ribbons-idle',!entry.isIntersecting),{rootMargin:'80px 0px'});
      observer.observe(sign);
    }
    function restoreAfterNavigation(){
      // BFCache restores, fast scroll and direct hash links must not leave elements dimmed.
      pending.forEach(el=>{const r=el.getBoundingClientRect();if(r.bottom<=0)finish(el);});
      ScrollTrigger.update();
    }
    window.addEventListener('pageshow',restoreAfterNavigation);
    restoreAfterNavigation();
    return ()=>{
      disposed=true;
      root.removeEventListener('focusin',onFocus);
      window.removeEventListener('pageshow',restoreAfterNavigation);
      observer?.disconnect();
      sign.classList.remove('st-ribbons-idle');
      triggers.forEach(t=>t.kill());
      ribbonTrigger.kill();
      active.forEach(t=>t.kill());
      candidates.forEach(clear);
      ribbonEls.forEach(clear);
      pending.clear();active.clear();played.clear();
    };
  });
})();
