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

  // ── FAQ keyboard: toggle on Enter/Space ─────────────────
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
  });

}());
