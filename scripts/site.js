/* DS Blog — site interactions
 * - Mobile nav, FAQ keyboard, header scroll
 * - GSAP-powered scroll reveals (with CSS fallback)
 * - Testimonial slider (auto + manual + keyboard + swipe)
 * - Pricing monthly/yearly toggle
 * - Animated number counters on results strip
 * - Page-transition curtain on internal links
 */
(function () {
  'use strict';

  // ── Utility ─────────────────────────────────────────────
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = function () { return typeof window.gsap !== 'undefined'; };

  // Dynamically load GSAP + ScrollTrigger (Squarespace prefers <squarespace:script>
  // in templates, so we inject the CDN from JS rather than from site.region <head>).
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function loadGSAP() {
    if (hasGSAP()) return Promise.resolve();
    if (prefersReducedMotion) return Promise.reject(new Error('reduced-motion'));
    return loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js')
      .then(function () { return loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js'); });
  }

  // ── Mobile nav toggle ───────────────────────────────────
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav    = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // ── Reveal: GSAP ScrollTrigger preferred, fallback to IntersectionObserver ──
  function initReveal() {
    var elsLegacy  = document.querySelectorAll('.reveal');
    var elsRevealUp = document.querySelectorAll('.reveal-up');

    if (prefersReducedMotion) {
      elsLegacy.forEach(function (el) { el.classList.add('is-visible'); });
      elsRevealUp.forEach(function (el) {
        el.style.opacity = 1; el.style.transform = 'none';
      });
      return;
    }

    function fallbackReveal() {
      // Mark <html> so CSS fallback animation kicks in for .reveal-up
      document.documentElement.classList.add('gsap-disabled');

      // Stagger the fallback CSS animation by index
      elsRevealUp.forEach(function (el, i) {
        el.style.animationDelay = (i % 6) * 80 + 'ms';
      });

      if (!('IntersectionObserver' in window)) {
        elsLegacy.forEach(function (el) { el.classList.add('is-visible'); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      elsLegacy.forEach(function (el) { io.observe(el); });
    }

    if (!hasGSAP()) { fallbackReveal(); return; }

    try {
      var gsap = window.gsap;
      if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

      // Reveal-up: stagger when batched together inside the same parent
      elsRevealUp.forEach(function (el) {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true
          }
        });
      });

      // Legacy .reveal — still supported (uses CSS transition, just toggle class)
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        elsLegacy.forEach(function (el) { io.observe(el); });
      } else {
        elsLegacy.forEach(function (el) { el.classList.add('is-visible'); });
      }
    } catch (e) {
      fallbackReveal();
    }
  }

  // ── Header: shadow when scrolled ────────────────────────
  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── FAQ keyboard ────────────────────────────────────────
  function initFAQ() {
    document.querySelectorAll('.faq-item summary').forEach(function (summary) {
      summary.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          summary.click();
        }
      });
    });
  }

  // ── Testimonial slider ──────────────────────────────────
  function initSlider() {
    document.querySelectorAll('[data-slider]').forEach(function (root) {
      var track  = root.querySelector('[data-slider-track]');
      var slides = root.querySelectorAll('[data-slider-slide]');
      var prev   = root.querySelector('[data-slider-prev]');
      var next   = root.querySelector('[data-slider-next]');
      var dotsEl = root.querySelector('[data-slider-dots]');
      if (!track || slides.length === 0) return;

      var index = 0;
      var autoplayMs = parseInt(root.getAttribute('data-slider-autoplay') || '0', 10);
      var timer = null;

      // Build dots
      var dots = [];
      if (dotsEl) {
        Array.prototype.forEach.call(slides, function (_, i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('role', 'tab');
          b.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
          if (i === 0) b.classList.add('is-active');
          b.addEventListener('click', function () { go(i); restartAutoplay(); });
          dotsEl.appendChild(b);
          dots.push(b);
        });
      }

      function go(i) {
        index = (i + slides.length) % slides.length;
        track.style.transform = 'translateX(' + (-index * 100) + '%)';
        dots.forEach(function (d, di) { d.classList.toggle('is-active', di === index); });
      }

      function nextSlide() { go(index + 1); }
      function prevSlide() { go(index - 1); }

      if (prev) prev.addEventListener('click', function () { prevSlide(); restartAutoplay(); });
      if (next) next.addEventListener('click', function () { nextSlide(); restartAutoplay(); });

      // Keyboard
      root.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { prevSlide(); restartAutoplay(); }
        if (e.key === 'ArrowRight') { nextSlide(); restartAutoplay(); }
      });

      // Touch swipe
      var touchX = null;
      track.addEventListener('touchstart', function (e) {
        touchX = e.changedTouches[0].clientX;
      }, { passive: true });
      track.addEventListener('touchend', function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) { dx < 0 ? nextSlide() : prevSlide(); restartAutoplay(); }
        touchX = null;
      }, { passive: true });

      // Autoplay (paused on hover/focus)
      function startAutoplay() {
        if (!autoplayMs || prefersReducedMotion) return;
        timer = setInterval(nextSlide, autoplayMs);
      }
      function stopAutoplay() {
        if (timer) { clearInterval(timer); timer = null; }
      }
      function restartAutoplay() { stopAutoplay(); startAutoplay(); }

      root.addEventListener('mouseenter', stopAutoplay);
      root.addEventListener('mouseleave', startAutoplay);
      root.addEventListener('focusin', stopAutoplay);
      root.addEventListener('focusout', startAutoplay);

      go(0);
      startAutoplay();
    });
  }

  // ── Pricing monthly/yearly toggle ───────────────────────
  function initBillingToggle() {
    var root = document.querySelector('[data-billing-toggle]');
    if (!root) return;

    var options = root.querySelectorAll('[data-billing]');
    var amounts = document.querySelectorAll('.plan-amount');
    var periods = document.querySelectorAll('.plan-period');

    function setMode(mode) {
      // Buttons
      options.forEach(function (b) {
        var active = b.getAttribute('data-billing') === mode;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      // Amounts — flip with quick fade
      amounts.forEach(function (el) {
        var v = el.getAttribute('data-' + mode);
        if (!v) return;
        el.classList.add('is-flipping');
        setTimeout(function () {
          el.textContent = v;
          el.classList.remove('is-flipping');
        }, 180);
      });
      // Period labels
      periods.forEach(function (el) {
        var v = el.getAttribute('data-' + mode + '-label');
        if (v) el.textContent = v;
      });
    }

    options.forEach(function (b) {
      b.addEventListener('click', function () {
        setMode(b.getAttribute('data-billing'));
      });
    });
  }

  // ── Animated number counters (.results-strip) ───────────
  function initCounters() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    if (prefersReducedMotion) {
      els.forEach(function (el) {
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        // Preserve any <em> child inside the value
        var em = el.querySelector('em');
        el.firstChild.textContent = target;
        if (em) { /* leave existing em */ }
        else { el.textContent = target + suffix; }
      });
      return;
    }
    if (!('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var em = el.querySelector('em');
        var emHTML = em ? em.outerHTML : '';
        var duration = 1400;
        var start = performance.now();

        function tick(now) {
          var t = Math.min(1, (now - start) / duration);
          var eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
          var val = Math.floor(eased * target);
          el.innerHTML = val + emHTML;
          if (t < 1) requestAnimationFrame(tick);
          else el.innerHTML = target + emHTML;
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  // ── Page-transition curtain ─────────────────────────────
  function initPageTransition() {
    if (prefersReducedMotion || !hasGSAP()) return;

    var curtain = document.createElement('div');
    curtain.className = 'page-curtain';
    document.body.appendChild(curtain);

    var gsap = window.gsap;

    // Initial entry: curtain starts covering, slides up on load
    gsap.set(curtain, { y: 0 });
    gsap.to(curtain, {
      y: '-100%', duration: 0.9, ease: 'power3.inOut', delay: 0.05,
      onComplete: function () { gsap.set(curtain, { y: '100%' }); }
    });

    // On internal-link click: slide curtain up to cover, then navigate
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href) return;
      // Skip externals, anchors, mailto/tel, target=_blank, modifier keys
      var isExternal = /^(https?:|\/\/)/.test(href) && !href.includes(location.host);
      if (isExternal) return;
      if (href.charAt(0) === '#') return;
      if (/^(mailto:|tel:)/.test(href)) return;
      if (a.target === '_blank') return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      gsap.set(curtain, { y: '100%' });
      gsap.to(curtain, {
        y: 0,
        duration: 0.55,
        ease: 'power3.inOut',
        onComplete: function () { window.location.href = href; }
      });
    });
  }

  // ── Auto-update copyright year ──────────────────────────
  function initCopyYear() {
    var el = document.querySelector('.copy-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // ── Init ────────────────────────────────────────────────
  ready(function () {
    initNav();
    initHeaderScroll();
    initFAQ();
    initSlider();
    initBillingToggle();
    initCounters();
    initCopyYear();

    // Load GSAP + plugins, then enable scroll reveals + page transition.
    // If load fails or reduced-motion is on, fall back to CSS/IO reveals.
    loadGSAP().then(function () {
      initReveal();
      initPageTransition();
    }).catch(function () {
      initReveal();
    });
  });
}());
