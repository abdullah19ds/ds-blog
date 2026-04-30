(function () {
  'use strict';

  // ── Utility ─────────────────────────────────────────────
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
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

    // Close on link click (mobile)
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // ── Scroll reveal (IntersectionObserver) ────────────────
  function initReveal() {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  }

  // ── Header: add shadow when scrolled ────────────────────
  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── FAQ accordion — smooth height animation on open/close ───────────────
  function initFAQ() {
    document.querySelectorAll('.faq-item details').forEach(function (details) {
      var summary = details.querySelector('summary');
      var panel   = details.querySelector('.faq-panel');
      if (!summary || !panel) return;
      panel.setAttribute('data-faq-bound', '');

      // Set initial state to match [open] without flashing
      if (details.open) {
        panel.style.height = 'auto';
        panel.style.opacity = '1';
      } else {
        panel.style.height = '0px';
        panel.style.opacity = '0';
      }

      // Run on click so we control timing of the [open] attribute
      summary.addEventListener('click', function (e) {
        e.preventDefault();
        if (details.open) {
          // CLOSE: from current height to 0
          var startH = panel.scrollHeight;
          panel.style.height = startH + 'px';
          // Force reflow so the next change actually transitions
          panel.offsetHeight; // eslint-disable-line no-unused-expressions
          panel.style.height = '0px';
          panel.style.opacity = '0';
          var onEnd = function (ev) {
            if (ev.propertyName !== 'height') return;
            details.removeAttribute('open');
            panel.removeEventListener('transitionend', onEnd);
          };
          panel.addEventListener('transitionend', onEnd);
        } else {
          // OPEN: 0 → measured height, then settle to auto
          details.setAttribute('open', '');
          var endH = panel.scrollHeight;
          panel.style.height = '0px';
          panel.offsetHeight; // eslint-disable-line no-unused-expressions
          panel.style.height = endH + 'px';
          panel.style.opacity = '1';
          var onEnd = function (ev) {
            if (ev.propertyName !== 'height') return;
            panel.style.height = 'auto'; // let it grow if content reflows
            panel.removeEventListener('transitionend', onEnd);
          };
          panel.addEventListener('transitionend', onEnd);
        }
      });

      // Keyboard: Enter / Space already trigger the click above
      summary.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          summary.click();
        }
      });
    });
  }

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Dynamic loader for GSAP (kept out of <head> to avoid template parser issues)
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function loadGSAP() {
    if (window.gsap) return Promise.resolve();
    if (prefersReducedMotion) return Promise.reject(new Error('reduced-motion'));
    return loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js')
      .then(function () { return loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js'); });
  }
  function loadLenis() {
    if (window.Lenis) return Promise.resolve();
    if (prefersReducedMotion) return Promise.reject(new Error('reduced-motion'));
    return loadScript('https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.42/bundled/lenis.min.js');
  }

  // ── Lenis smooth scroll ─────────────────────────────────
  function initSmoothScroll() {
    if (prefersReducedMotion || !window.Lenis) return;
    try {
      var lenis = new window.Lenis({
        duration: 1.15,
        // easeOutExpo-ish — gentle, damped
        easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); },
        smoothWheel: true,
        // Disable smooth on touch — native momentum is already great
        smoothTouch: false,
        touchMultiplier: 1.6,
      });
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);

      // Keep ScrollTrigger in sync if it's loaded
      if (window.ScrollTrigger) {
        lenis.on('scroll', window.ScrollTrigger.update);
        window.gsap && window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        window.gsap && window.gsap.ticker.lagSmoothing(0);
      }

      // Pause Lenis when nav drawer or modal needs body scroll lock — the
      // nav already toggles .is-open; if that gets used in the future, hook
      // here. For now Lenis just runs.
      window.__lenis = lenis; // expose for debugging
    } catch (e) { /* fail silent — native scroll continues */ }
  }

  // ── Page-transition curtain ─────────────────────────────
  function initPageTransition() {
    if (prefersReducedMotion || !window.gsap) return;
    var curtain = document.createElement('div');
    curtain.className = 'page-curtain';
    document.body.appendChild(curtain);

    // Initial entry: cover, then slide up off-screen
    gsap.set(curtain, { y: 0 });
    gsap.to(curtain, {
      y: '-100%', duration: 0.85, ease: 'power3.inOut', delay: 0.05,
      onComplete: function () { gsap.set(curtain, { y: '100%' }); }
    });

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href) return;
      var isExternal = /^(https?:|\/\/)/.test(href) && href.indexOf(location.host) === -1;
      if (isExternal) return;
      if (href.charAt(0) === '#') return;
      if (/^(mailto:|tel:)/.test(href)) return;
      if (a.target === '_blank') return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      gsap.set(curtain, { y: '100%' });
      gsap.to(curtain, {
        y: 0, duration: 0.55, ease: 'power3.inOut',
        onComplete: function () { window.location.href = href; }
      });
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
      options.forEach(function (b) {
        var active = b.getAttribute('data-billing') === mode;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      amounts.forEach(function (el) {
        var v = el.getAttribute('data-' + mode);
        if (!v) return;
        el.classList.add('is-flipping');
        setTimeout(function () {
          el.textContent = v;
          el.classList.remove('is-flipping');
        }, 180);
      });
      periods.forEach(function (el) {
        var v = el.getAttribute('data-' + mode + '-label');
        if (v) el.textContent = v;
      });
    }

    options.forEach(function (b) {
      b.addEventListener('click', function () { setMode(b.getAttribute('data-billing')); });
    });
  }

  // ── Animated number counters ────────────────────────────
  function initCounters() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length) return;

    function setFinal(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      // Preserve the <em> styling around the suffix
      el.innerHTML = target + '<em>' + suffix + '</em>';
    }

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      els.forEach(setFinal);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        // Longer duration with snappier-front, slow-back curve = smoother feel
        var duration = 2200;
        var start = performance.now();
        // Track last rendered value so we don't repaint identical frames
        var lastVal = -1;

        function tick(now) {
          var t = Math.min(1, (now - start) / duration);
          // easeOutQuint — long graceful settle at the end
          var eased = 1 - Math.pow(1 - t, 5);
          var val = target >= 10
            ? Math.floor(eased * target)
            : Math.round(eased * target * 10) / 10; // 1 decimal for small targets like 4.9
          if (val !== lastVal) {
            el.innerHTML = val + '<em>' + suffix + '</em>';
            lastVal = val;
          }
          if (t < 1) requestAnimationFrame(tick);
          else setFinal(el);
        }
        // Apply a tiny stagger if multiple counters share a parent (e.g. results-strip)
        var siblings = el.parentElement && el.parentElement.parentElement
          ? el.parentElement.parentElement.querySelectorAll('[data-count]')
          : [];
        var ix = Array.prototype.indexOf.call(siblings, el);
        var stagger = ix > -1 ? ix * 90 : 0;
        setTimeout(function () { requestAnimationFrame(tick); }, stagger);
        io.unobserve(el);
      });
    }, { threshold: 0.45 });
    els.forEach(function (el) { io.observe(el); });
  }

  // ── Auto-update copyright year ──────────────────────────
  function initCopyYear() {
    var el = document.querySelector('.copy-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // ── Testimonial slider ──────────────────────────────────
  function initSlider() {
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

      root.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { prevSlide(); restartAutoplay(); }
        if (e.key === 'ArrowRight') { nextSlide(); restartAutoplay(); }
      });

      var touchX = null;
      track.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
      track.addEventListener('touchend', function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) { dx < 0 ? nextSlide() : prevSlide(); restartAutoplay(); }
        touchX = null;
      }, { passive: true });

      function startAutoplay() {
        if (!autoplayMs || prefersReducedMotion) return;
        timer = setInterval(nextSlide, autoplayMs);
      }
      function stopAutoplay() { if (timer) { clearInterval(timer); timer = null; } }
      function restartAutoplay() { stopAutoplay(); startAutoplay(); }

      root.addEventListener('mouseenter', stopAutoplay);
      root.addEventListener('mouseleave', startAutoplay);
      root.addEventListener('focusin', stopAutoplay);
      root.addEventListener('focusout', startAutoplay);

      go(0);
      startAutoplay();
    });
  }

  // ── Init ────────────────────────────────────────────────
  ready(function () {
    initNav();
    initReveal();
    initHeaderScroll();
    initFAQ();
    initCopyYear();
    initSlider();
    initBillingToggle();
    initCounters();

    // GSAP is loaded ONLY for the page-transition curtain — section reveals
    // run on the CSS-only IntersectionObserver path above. Lenis loads
    // separately for smooth wheel scroll. Both are non-fatal on failure.
    loadGSAP()
      .then(function () { initPageTransition(); })
      .catch(function () {})
      .then(function () { return loadLenis(); })
      .then(function () { initSmoothScroll(); })
      .catch(function () { /* Lenis unavailable — native scroll stays */ });
  });

}());
