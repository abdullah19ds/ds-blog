(function () {
  'use strict';

  // Sticky header
  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile hamburger menu
  var hamburger = document.getElementById('hamburgerBtn');
  var navEl = document.getElementById('mainNavEl');
  if (hamburger && navEl) {
    hamburger.addEventListener('click', function () {
      var isOpen = navEl.classList.toggle('mobile-open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on nav link click
    navEl.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navEl.classList.remove('mobile-open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Pricing billing toggle
  var monthlyBtn = document.getElementById('monthlyBtn');
  var annualBtn = document.getElementById('annualBtn');
  var priceAmounts = document.querySelectorAll('.amount[data-monthly]');

  function setPricing(isAnnual) {
    priceAmounts.forEach(function (el) {
      var val = isAnnual ? el.getAttribute('data-annual') : el.getAttribute('data-monthly');
      if (val) el.textContent = val;
    });
    if (monthlyBtn) monthlyBtn.classList.toggle('active', !isAnnual);
    if (annualBtn) annualBtn.classList.toggle('active', isAnnual);
  }

  if (monthlyBtn) {
    monthlyBtn.addEventListener('click', function () { setPricing(false); });
  }
  if (annualBtn) {
    annualBtn.addEventListener('click', function () { setPricing(true); });
  }

  // Scroll-reveal animation
  var revealEls = document.querySelectorAll(
    '.service-card, .team-card, .value-item, .testimonial-card, .pricing-card, .post-card, .faq-item'
  );

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.5s ease ' + (i % 3 * 0.1) + 's, transform 0.5s ease ' + (i % 3 * 0.1) + 's';
      observer.observe(el);
    });
  }

  // Blog category filter (visual only — full filtering requires server-side)
  var catBtns = document.querySelectorAll('.cat-btn');
  catBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      catBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });

  // Smooth anchor scroll
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

}());
