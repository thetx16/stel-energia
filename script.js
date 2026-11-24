const masthead = document.querySelector('.masthead');
const menuToggle = masthead.querySelector('.menu-toggle');
const siteMenu = masthead.querySelector('.site-menu');

function setMenuOpen(open) {
  masthead.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}

menuToggle.addEventListener('click', () => setMenuOpen(!masthead.classList.contains('is-open')));
siteMenu.addEventListener('click', () => setMenuOpen(false));
document.addEventListener('pointerdown', event => {
  if (!masthead.contains(event.target)) setMenuOpen(false);
});
masthead.addEventListener('focusout', event => {
  if (event.relatedTarget && !masthead.contains(event.relatedTarget)) setMenuOpen(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && masthead.classList.contains('is-open')) {
    setMenuOpen(false);
    menuToggle.focus();
  }
});
matchMedia('(max-width: 800px)').addEventListener('change', () => setMenuOpen(false));
let headerScrolled;
function updateHeaderOnScroll() {
  const next = window.scrollY > 40;
  if (next !== headerScrolled) { headerScrolled = next; masthead.classList.toggle('is-scrolled', next); }
}
updateHeaderOnScroll();
window.addEventListener('scroll', updateHeaderOnScroll, { passive: true });

const hero = document.querySelector('.hero');
const video = hero.querySelector('video');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');

// Keep the poster visible while loading; never download both viewport variants.
const filmSurface = hero.querySelector('.film-surface');
const posterImage = hero.querySelector('.film-poster img');
let filmStarted = false, filmFailed = false, playRequest, fallbackURL;
let frameRequest = null;

function showFilmFrame() {
  if (motionPreference.matches || filmFailed || video.paused) return;
  if (frameRequest !== null) return;
  const reveal = () => {
    frameRequest = null;
    if (!motionPreference.matches && !filmFailed && !video.paused && video.readyState >= 2) {
      filmSurface.classList.add('is-playing');
    }
  };
  if (typeof video.requestVideoFrameCallback === 'function') {
    frameRequest = video.requestVideoFrameCallback(reveal);
  } else {
    requestAnimationFrame(reveal);
  }
}
function resumeFilm() {
  if (!filmStarted || filmFailed || motionPreference.matches || document.hidden || !video.paused || playRequest) return;
  playRequest = video.play().catch(() => {}).finally(() => { playRequest = null; });
}
function startFilm() {
  if (filmStarted || motionPreference.matches || document.hidden || navigator.connection?.saveData) return;
  filmStarted = true;
  const mobile = matchMedia('(max-width: 800px)').matches;
  const webm = mobile ? video.dataset.mobileWebm : video.dataset.desktopWebm;
  const mp4 = mobile ? video.dataset.mobileMp4 : video.dataset.desktopMp4;
  const vp9 = video.canPlayType('video/webm; codecs="vp9"');
  fallbackURL = vp9 ? mp4 : null;
  video.defaultMuted = true;
  video.muted = true;
  video.poster = posterImage.currentSrc || posterImage.src;
  video.src = vp9 ? webm : mp4;
  video.preload = 'auto';
  resumeFilm();
}
video.addEventListener('playing', showFilmFrame);
video.addEventListener('error', () => {
  filmSurface.classList.remove('is-playing');
  if (frameRequest !== null && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameRequest);
  frameRequest = null;
  if (fallbackURL && !motionPreference.matches) {
    const url = fallbackURL;
    fallbackURL = null;
    playRequest = null;
    video.src = url;
    resumeFilm();
  } else {
    filmFailed = true;
  }
});
for (const event of ['canplay', 'pause', 'ended']) video.addEventListener(event, resumeFilm);
let posterReady = false, filmAllowed = false;
function startAfterPoster() {
  if (posterReady) return;
  posterReady = true;
  // Allow the poster, headline and CTA to paint before media requests begin.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const begin = () => { filmAllowed = true; startFilm(); };
    if ('requestIdleCallback' in window) requestIdleCallback(begin, { timeout: 350 });
    else setTimeout(begin, 180);
  }));
}
if (posterImage.complete) startAfterPoster();
else {
  posterImage.addEventListener('load', startAfterPoster, { once: true });
  posterImage.addEventListener('error', startAfterPoster, { once: true });
}
// If the image is unusually slow, allow playback after the page load event.
window.addEventListener('load', startAfterPoster, { once: true });
function onMotionChange() {
  if (motionPreference.matches) {
    filmSurface.classList.remove('is-playing');
    if (frameRequest !== null && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameRequest);
    frameRequest = null;
    video.pause();
  } else if (filmAllowed) {
    startFilm(); resumeFilm();
  }
}
motionPreference.addEventListener('change', onMotionChange);
function onReturn() { if (filmAllowed) { startFilm(); resumeFilm(); } }
document.addEventListener('visibilitychange', onReturn);
window.addEventListener('pageshow', onReturn);
document.addEventListener('pointerdown', onReturn, { passive: true });
document.addEventListener('keydown', onReturn);
new IntersectionObserver(([entry]) => { if (entry.isIntersecting && filmStarted) resumeFilm(); }).observe(video);

if (window.gsap && window.ScrollTrigger && window.ScrollSmoother) {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
  const media = gsap.matchMedia();

  media.add({
    animate: '(prefers-reduced-motion: no-preference)',
    desktop: '(min-width: 801px) and (pointer: fine)',
    pointer: '(hover: hover) and (pointer: fine)'
  }, ({ conditions }) => {
    if (!conditions.animate) return;
    document.documentElement.classList.add('motion-active');
    const events = new AbortController();
    const listen = { signal: events.signal };
    const smoother = conditions.desktop ? ScrollSmoother.create({
      wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: .55
    }) : null;

    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .from('.eyebrow', { y: 12, opacity: 0, duration: .6 }, .08)
      .from('.title-line', { yPercent: 12, rotate: 1, transformOrigin: 'left bottom', stagger: .07, duration: .55 }, .16)
      .from('.copy, .hero-actions', { y: 10, opacity: .85, stagger: .08, duration: .45 }, .20)
      .from('.hero-tools', { opacity: 0, duration: .6 }, .95);

    // Only hold the frame when the full hero fits, so short viewports stay scrollable.
    const canHold = () => conditions.desktop && hero.offsetHeight <= innerHeight;
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.hero-stage', start: 'top top', end: () => '+=' + (canHold() ? innerHeight * .38 : Math.min(150, innerHeight * .2)),
        pin: canHold(), pinSpacing: true, scrub: .45, invalidateOnRefresh: true
      }
    })
      .to('.hero-content', { y: -24, duration: 1 }, 0)
      .to('.spark', { rotation: 100, duration: 1 }, 0)
      .to('.eyebrow-line', { scaleX: 1.65, transformOrigin: 'left', duration: 1 }, 0)
      .to('.veil', { opacity: .9, duration: 1 }, 0);


    if (conditions.pointer) {
      const bounds = gsap.utils.clamp(-1, 1);
      const moveX = gsap.quickTo('.hero h1', 'x', { duration: .5, ease: 'power3.out' });
      const moveY = gsap.quickTo('.hero h1', 'y', { duration: .5, ease: 'power3.out' });
      const cursor = document.querySelector('.cursor');
      const cursorX = gsap.quickTo(cursor, 'x', { duration: .16 });
      const cursorY = gsap.quickTo(cursor, 'y', { duration: .16 });
      gsap.set(cursor, { xPercent: -50, yPercent: -50 });
      let pendingPointer = null, pointerRAF = 0;
      const renderPointer = () => {
        pointerRAF = 0;
        const event = pendingPointer;
        if (!event) return;
        const rect = hero.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        hero.style.setProperty('--x', x + 'px');
        hero.style.setProperty('--y', y + 'px');
        moveX(bounds(2 * x / rect.width - 1) * 6);
        moveY(bounds(2 * y / rect.height - 1) * 4);
        cursor.style.opacity = '1';
        cursorX(event.clientX);
        cursorY(event.clientY);
        cursor.classList.toggle('active', Boolean(event.target.closest('a, button')));
      };
      hero.addEventListener('pointermove', event => {
        pendingPointer = event;
        if (!pointerRAF) pointerRAF = requestAnimationFrame(renderPointer);
      }, { ...listen, passive: true });
      hero.addEventListener('pointerleave', () => {
        pendingPointer = null;
        cursor.style.opacity = '0';
        moveX(0); moveY(0);
      }, listen);
    }
    if (smoother) {
      document.querySelector('.brand').addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        setMenuOpen(false);
        smoother.scrollTo(0, true);
      }, listen);
    }
    document.fonts.ready.then(() => {
      if (!events.signal.aborted) ScrollTrigger.refresh();
    });
    return () => {
      events.abort();
      smoother?.kill();
      document.querySelector('.cursor').style.opacity = '0';
      document.documentElement.classList.remove('motion-active');
    };
  });
}

// CSS starts both tracks on first paint. Only their speed needs a measurement.
function sizeRibbonLaps() {
  document.querySelectorAll('.ribbon-track').forEach(track => {
    const width = track.firstElementChild.offsetWidth;
    const speed = track.parentElement.classList.contains('ribbon-back') ? 54 : 74;
    track.style.setProperty('--lap', (width / speed) + 's');
  });
}
sizeRibbonLaps();
new ResizeObserver(sizeRibbonLaps).observe(document.querySelector('.campaign-sign'));
document.fonts.ready.then(sizeRibbonLaps);