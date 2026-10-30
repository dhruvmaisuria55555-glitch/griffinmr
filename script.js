(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  $('#year').textContent = new Date().getFullYear();
  const contact = window.GRIFFIN_CONTACT || {};
  const email = String(contact.email || '').trim();
  const phone = String(contact.whatsapp || '').replace(/[\s+()-]/g, '');
  let hasContact = false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !/[\r\n?&#]/.test(email)) {
    const url = 'mailto:' + email;
    $('#email-link').href = url;
    $('#email-link').hidden = false;
    $('#contact-address').href = url;
    $('#contact-address').textContent = email;
    $('#contact-address').hidden = false;
    hasContact = true;
  }
  if (/^[1-9]\d{6,14}$/.test(phone)) {
    $('#whatsapp-link').href = 'https://wa.me/' + phone;
    $('#whatsapp-link').hidden = false;
    hasContact = true;
  }
  if (hasContact) {
    $('.contact-actions').hidden = false;
    $('.contact-fallback').hidden = true;
    document.querySelectorAll('[data-contact-only]').forEach(el => { el.hidden = false; });
  }

  const mobile = matchMedia('(max-width: 700px)');
  const header = $('.site-header');
  const menu = $('.menu-toggle');
  const nav = $('#primary-nav');
  header.classList.add('js-menu');
  const closeMenu = () => {
    menu.setAttribute('aria-expanded', 'false');
    $('.menu-label').textContent = 'Menu';
    nav.classList.remove('is-open');
  };
  const updateMenu = () => { menu.hidden = !mobile.matches; closeMenu(); };
  menu.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(expanded));
    $('.menu-label').textContent = expanded ? 'Close' : 'Menu';
    nav.classList.toggle('is-open', expanded);
  });
  nav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || !mobile.matches) return;
    closeMenu();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menu.focus();
    }
  });
  document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
  mobile.addEventListener('change', updateMenu);
  updateMenu();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const reveals = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveals.unobserve(entry.target); }
      });
    }, { threshold: .08 });
    document.querySelectorAll('.reveal').forEach(el => reveals.observe(el));
  }

  // Original Griffin human animation: mouse-controlled video scrubbing on desktop,
  // muted inline playback on touch devices. The poster is always available underneath.
  const video = $('.hero-media video');
  const source = video.querySelector('source');
  const motionButton = $('.motion-toggle');
  const pointer = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
  let paused = false, loaded = false, failed = false, visible = true;
  let previousX = null, targetTime = 0, frame = null;
  const active = () => !paused && !reduced.matches && !failed && visible && !document.hidden;
  const cancelFrame = () => { if (frame !== null) cancelAnimationFrame(frame); frame = null; };
  function seek() {
    frame = null;
    if (!active() || !pointer.matches || video.seeking || !Number.isFinite(video.duration)) return;
    const delta = targetTime - video.currentTime;
    if (Math.abs(delta) < .018) return;
    video.currentTime = Math.max(0, Math.min(video.duration - .04, Math.abs(delta) > .08 ? video.currentTime + delta * .42 : targetTime));
  }
  function scheduleSeek() { if (frame === null) frame = requestAnimationFrame(seek); }
  function updateMode() {
    cancelFrame(); previousX = null;
    motionButton.hidden = reduced.matches || failed;
    motionButton.setAttribute('aria-pressed', String(paused));
    $('.motion-label').textContent = paused ? 'Resume motion' : 'Pause motion';
    motionButton.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
    if (!active()) { video.pause(); return; }
    if (!loaded) { source.src = source.dataset.src; video.load(); loaded = true; }
    if (pointer.matches) { video.pause(); targetTime = video.currentTime; }
    else video.play().catch(() => {
      if (active() && !pointer.matches) {
        paused = true;
        updateMode();
      }
    });
  }
  motionButton.addEventListener('click', () => { paused = !paused; updateMode(); });
  window.addEventListener('pointermove', event => {
    if (!pointer.matches || !active() || event.pointerType === 'touch' || !Number.isFinite(video.duration)) return;
    if (previousX === null) { previousX = event.clientX; targetTime = video.currentTime; return; }
    targetTime = Math.max(0, Math.min(video.duration - .04, targetTime + ((event.clientX - previousX) / innerWidth) * .8 * video.duration));
    previousX = event.clientX;
    scheduleSeek();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { previousX = null; });
  video.addEventListener('seeked', scheduleSeek);
  video.addEventListener('loadeddata', () => { video.classList.add('ready'); });
  video.addEventListener('loadedmetadata', () => {
    if (pointer.matches && active()) { targetTime = Math.min(1, video.duration / 3); video.currentTime = targetTime; }
  });
  const onFailure = () => { failed = true; video.classList.remove('ready'); updateMode(); };
  video.addEventListener('error', onFailure);
  source.addEventListener('error', onFailure);
  reduced.addEventListener('change', updateMode);
  pointer.addEventListener('change', updateMode);
  document.addEventListener('visibilitychange', updateMode);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; updateMode(); }, { threshold: 0 }).observe($('.hero'));
  }
  window.addEventListener('pagehide', () => { cancelFrame(); video.pause(); });
  window.addEventListener('pageshow', updateMode);
  updateMode();
})();
