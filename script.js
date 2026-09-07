(() => {
  const pageOne = document.getElementById('pageOne');
  const heroVideo = document.getElementById('heroVideo');
  const scrubVideo = document.getElementById('scrubVideo');
  const scrollPage = document.getElementById('scrollPage');
  const pin = document.getElementById('scrollPin');
  const loader = document.getElementById('loader');
  const duration = window.SCRUB_DURATION;

  heroVideo.muted = true;
  const heroObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
        try { heroVideo.currentTime = 0; } catch(e) {}
        heroVideo.play().catch(() => {});
      } else {
        heroVideo.pause();
      }
    }
  }, { threshold:[0,0.45,1] });
  heroObserver.observe(pageOne);

  const ensureHeroPlay = () => {
    const r = pageOne.getBoundingClientRect();
    if (r.bottom > innerHeight * 0.4 && r.top < innerHeight * 0.6) {
      heroVideo.play().catch(() => {});
    }
  };
  addEventListener('pageshow', ensureHeroPlay);
  addEventListener('focus', ensureHeroPlay);
  heroVideo.play().catch(() => {});

  let targetTime = 0;
  let currentTime = 0;
  let lastSeek = -1;
  let lastNow = performance.now();
  let started = false;

  async function primeScrubVideo(){
    try{
      scrubVideo.muted = true;
      await scrubVideo.play();
      scrubVideo.pause();
      scrubVideo.currentTime = 0;
    }catch(e){ scrubVideo.pause(); }
  }

  function updateThirdSection(){
    const sectionTop = scrollPage.offsetTop;
    const sectionHeight = scrollPage.offsetHeight;
    const viewportH = innerHeight;
    const sectionEnd = sectionTop + sectionHeight;
    const y = scrollY;

    if (y < sectionTop) {
      pin.classList.remove('is-fixed','is-bottom');
    } else if (y <= sectionEnd - viewportH) {
      pin.classList.add('is-fixed');
      pin.classList.remove('is-bottom');
    } else {
      pin.classList.remove('is-fixed');
      pin.classList.add('is-bottom');
    }

    let p = (y - sectionTop) / (sectionHeight - viewportH);
    p = Math.max(0, Math.min(1, p));
    targetTime = p * Math.max(0, duration - 0.0167);
  }

  function scrubLoop(now){
    const dt = Math.min(0.04, (now-lastNow)/1000);
    lastNow = now;

    if (!scrubVideo.paused) scrubVideo.pause();

    const follow = 1 - Math.exp(-32 * dt);
    currentTime += (targetTime-currentTime) * follow;
    if (Math.abs(targetTime-currentTime) < 0.001) currentTime = targetTime;

    if (Math.abs(currentTime-lastSeek) > 0.007) {
      try {
        scrubVideo.currentTime = currentTime;
        lastSeek = currentTime;
      } catch(e) {}
    }

    requestAnimationFrame(scrubLoop);
  }

  let ticking = false;
  addEventListener('scroll', () => {
    ensureHeroPlay();
    if (!ticking) {
      requestAnimationFrame(() => {
        updateThirdSection();
        ticking = false;
      });
      ticking = true;
    }
  }, {passive:true});

  addEventListener('resize', updateThirdSection, {passive:true});

  function ready(){
    loader.classList.add('hide');
    primeScrubVideo();
    updateThirdSection();
    if (!started) {
      started = true;
      requestAnimationFrame(scrubLoop);
    }
  }

  scrubVideo.addEventListener('loadeddata', ready, {once:true});
  scrubVideo.addEventListener('canplay', ready, {once:true});
  setTimeout(() => { if (scrubVideo.readyState >= 2) ready(); }, 700);
})();
