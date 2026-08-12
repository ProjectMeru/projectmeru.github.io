/* Project Meru - hub behaviour */

(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var THEME_KEY = 'meru-theme';

  function currentTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    return t === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    var next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
    var meta = $('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', next === 'light' ? '#f3f3f0' : '#050505');
    }
    $$('.theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-label', next === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      btn.setAttribute('title', next === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    });
  }

  applyTheme(currentTheme());

  $$('.theme-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
    });
  });

  /* Card nav */

  var nav = $('#cardNav');
  var triggers = $$('.card-nav-trigger', nav);
  var panels = $$('.card-nav-panel[data-panel]', nav);

  function closeNav() {
    if (!nav) return;
    nav.classList.remove('open');
    triggers.forEach(function (t) { t.classList.remove('active'); });
    panels.forEach(function (p) {
      p.hidden = true;
      p.classList.remove('is-active');
    });
  }

  function openPanel(name) {
    if (!nav) return;
    nav.classList.add('open');
    triggers.forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-panel') === name);
    });
    panels.forEach(function (p) {
      var on = p.getAttribute('data-panel') === name;
      p.hidden = !on;
      p.classList.toggle('is-active', on);
    });
  }

  if (nav) {
    panels.forEach(function (p) {
      p.hidden = true;
      p.classList.remove('is-active');
    });

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var name = trigger.getAttribute('data-panel');
        if (trigger.classList.contains('active')) {
          closeNav();
        } else {
          openPanel(name);
        }
      });
    });

    $$('.nav-box', nav).forEach(function (link) {
      link.addEventListener('click', function () { closeNav(); });
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* Back to top */

  var toTop = $('#toTop');
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (toTop) toTop.classList.toggle('is-visible', y > 600);
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* Reveal */

  var revealTargets = $$('.card, .project-card').filter(function (el) {
    return !el.closest('.card-nav');
  });

  if (revealTargets.length && 'IntersectionObserver' in window && !reduceMotion) {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
