/* DS Blog — site interactions
 * All animations are CSS-driven (transitions + @keyframes). JS only adds
 * trigger classes (.is-visible, .is-leaving, .is-flipping) and runs the
 * counter rAF loop + the FAQ height measurement. No external animation
 * libraries — those get blocked by Squarespace's CSP on production.
 *
 * The one external library kept is Lenis (smooth wheel scroll) loaded
 * from jsdelivr — it works on Squarespace published sites.
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // ── Header: 'is-scrolled' class for static styling hooks ──
  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Scroll reveal — GSAP ScrollTrigger when available, fail-open otherwise
  // The CSS hide rule is gated on [data-reveal-pending] so if GSAP fails
  // to load (deleted file, wrong path, etc.), content stays visible.
  function initReveal() {
    var els = document.querySelectorAll('.reveal, .reveal-up');
    if (!els.length) return;

    // Reduced motion → no fade, just mark visible
    if (prefersReducedMotion) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    // Prefer GSAP ScrollTrigger if both are present
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      els.forEach(function (el) {
        // Above-the-fold elements: reveal immediately without animation
        var rect = el.getBoundingClientRect();
        var aboveFold = rect.top < window.innerHeight * 0.9;

        // Arm hide state ONLY for elements we'll animate
        if (!aboveFold) el.setAttribute('data-reveal-pending', '');

        gsap.fromTo(el,
          { opacity: aboveFold ? 1 : 0, y: aboveFold ? 0 : 28 },
          {
            opacity: 1, y: 0,
            duration: 0.95,
            ease: 'power3.out',
            delay: aboveFold ? 0 : 0,
            scrollTrigger: aboveFold ? null : {
              trigger: el,
              start: 'top 88%',
              once: true
            },
            onStart: function () {
              el.classList.add('is-visible');
              el.removeAttribute('data-reveal-pending');
            }
          }
        );
      });
      return;
    }

    // Fallback: IntersectionObserver + CSS transition (same fail-open pattern)
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    requestAnimationFrame(function () {
      els.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) {
          el.classList.add('is-visible');
          return;
        }
        el.setAttribute('data-reveal-pending', '');
      });

      var pending = document.querySelectorAll('[data-reveal-pending]');
      if (!pending.length) return;

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            entry.target.removeAttribute('data-reveal-pending');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      pending.forEach(function (el) { io.observe(el); });

      setTimeout(function () {
        document.querySelectorAll('[data-reveal-pending]').forEach(function (el) {
          el.classList.add('is-visible');
          el.removeAttribute('data-reveal-pending');
        });
      }, 4000);
    });
  }

  // ── Lenis smooth scroll ─────────────────────────────────
  function initLenis() {
    if (prefersReducedMotion || !window.Lenis) return;
    try {
      var lenis = new window.Lenis({
        duration: 1.15,
        easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); },
        smoothWheel: true,
        smoothTouch: false,
        touchMultiplier: 1.6
      });

      // Sync ScrollTrigger to Lenis if both are present
      if (window.gsap && window.ScrollTrigger) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
      }

      window.__lenis = lenis;
    } catch (e) { /* native scroll continues */ }
  }

  // ── FAQ accordion — smooth height transition (CSS) ───────────────────
  function initFAQ() {
    document.querySelectorAll('.faq-item details').forEach(function (details) {
      var summary = details.querySelector('summary');
      var panel   = details.querySelector('.faq-panel');
      if (!summary || !panel) return;
      panel.setAttribute('data-faq-bound', '');

      // Prime initial state (no flash)
      if (details.open) {
        panel.style.height = panel.scrollHeight + 'px';
        panel.style.opacity = '1';
      } else {
        panel.style.height = '0px';
        panel.style.opacity = '0';
      }

      summary.addEventListener('click', function (e) {
        e.preventDefault();
        if (details.open) {
          // CLOSE
          var startH = panel.scrollHeight;
          panel.style.height = startH + 'px';
          panel.offsetHeight; // reflow
          panel.style.height = '0px';
          panel.style.opacity = '0';
          var onEnd = function (ev) {
            if (ev.propertyName !== 'height') return;
            details.removeAttribute('open');
            panel.removeEventListener('transitionend', onEnd);
          };
          panel.addEventListener('transitionend', onEnd);
        } else {
          // OPEN
          details.setAttribute('open', '');
          var endH = panel.scrollHeight;
          panel.style.height = '0px';
          panel.offsetHeight; // reflow
          panel.style.height = endH + 'px';
          panel.style.opacity = '1';
          var onEnd = function (ev) {
            if (ev.propertyName !== 'height') return;
            panel.style.height = 'auto';
            panel.removeEventListener('transitionend', onEnd);
          };
          panel.addEventListener('transitionend', onEnd);
        }
      });

      summary.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          summary.click();
        }
      });
    });
  }

  // ── Animated number counters ────────────────────────────
  function initCounters() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length) return;

    function setFinal(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
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
        var duration = 2000;
        var start = performance.now();
        var lastVal = -1;

        function tick(now) {
          var t = Math.min(1, (now - start) / duration);
          var eased = 1 - Math.pow(1 - t, 5); // easeOutQuint
          var val = target >= 10
            ? Math.floor(eased * target)
            : Math.round(eased * target * 10) / 10;
          if (val !== lastVal) {
            el.innerHTML = val + '<em>' + suffix + '</em>';
            lastVal = val;
          }
          if (t < 1) requestAnimationFrame(tick);
          else setFinal(el);
        }

        // Stagger sibling counters in the same parent row
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
        if (e.key === 'ArrowLeft')  { prevSlide(); restartAutoplay(); }
        if (e.key === 'ArrowRight') { nextSlide(); restartAutoplay(); }
      });

      var touchX = null;
      track.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
      track.addEventListener('touchend',   function (e) {
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
      root.addEventListener('focusin',  stopAutoplay);
      root.addEventListener('focusout', startAutoplay);

      go(0);
      startAutoplay();
    });
  }

  // ── Pricing monthly/yearly toggle with animated flip ─────
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

  // ── Page curtain — pure CSS @keyframes; JS only handles link clicks ──
  function initPageCurtain() {
    if (prefersReducedMotion) return;
    var curtain = document.createElement('div');
    curtain.className = 'page-curtain';
    document.body.appendChild(curtain);

    // Ensure the curtain stops being interactive after the entry animation
    curtain.addEventListener('animationend', function () {
      if (curtain.classList.contains('is-leaving')) return;
      curtain.style.display = 'none';
    });

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href) return;
      var sameOrigin = !/^(https?:|\/\/)/.test(href) || href.indexOf(location.host) !== -1;
      if (!sameOrigin) return;
      if (href.charAt(0) === '#') return;
      if (/^(mailto:|tel:)/.test(href)) return;
      if (a.target === '_blank') return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      curtain.style.display = '';
      // Force reflow before adding the leaving class so the @keyframes plays
      void curtain.offsetWidth;
      curtain.classList.add('is-leaving');
      curtain.addEventListener('animationend', function leave() {
        curtain.removeEventListener('animationend', leave);
        window.location.href = href;
      });
    });
  }

  // ── Init ────────────────────────────────────────────────
  // Each module is wrapped in try/catch so one failing module never aborts
  // the rest. (On production a single error in initSlider was breaking
  // initBillingToggle / initPageCurtain — wrapping makes that impossible.)
  function safe(name, fn) {
    try { fn(); } catch (e) {
      if (window.console && console.warn) console.warn('[ds-blog] ' + name, e);
    }
  }

  ready(function () {
    safe('nav', initNav);
    safe('header', initHeaderScroll);
    safe('faq', initFAQ);
    safe('reveal', initReveal);
    safe('counters', initCounters);
    safe('copyYear', initCopyYear);
    safe('slider', initSlider);
    safe('billing', initBillingToggle);
    safe('curtain', initPageCurtain);
    safe('lenis', initLenis);
  });
}());
