/* ==========================================================================
   Project Meru — site behaviour
   Plain ES5-compatible DOM code. No dependencies, no build step.
   ========================================================================== */

(function () {
  'use strict';

  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Theme ─────────────────────────────────────────────────────────────────
     The initial theme is applied by the inline script in <head> so the page
     never flashes. This only handles switching it afterwards.
     ────────────────────────────────────────────────────────────────────────── */

  var root = document.documentElement;
  var themeToggle = $('#themeToggle');
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.setAttribute(
        'title', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('meru-theme', next); } catch (e) { /* private mode */ }
    });
    applyTheme(root.getAttribute('data-theme') || 'light');
  }

  // Follow the system setting until the visitor has made a choice of their own.
  if (darkQuery && darkQuery.addEventListener) {
    darkQuery.addEventListener('change', function (e) {
      var chosen = null;
      try { chosen = localStorage.getItem('meru-theme'); } catch (err) { /* ignore */ }
      if (!chosen) { applyTheme(e.matches ? 'dark' : 'light'); }
    });
  }

  /* ── Mobile navigation ─────────────────────────────────────────────────── */

  var nav = $('#nav');
  var navToggle = $('#navToggle');

  if (nav && navToggle) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Close the menu after tapping a link on small screens.
    $$('a', nav).forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  /* ── Scrollspy: highlight the section currently in view ────────────────── */

  var navLinks = $$('#nav a[href^="#"]');
  var sections = navLinks
    .map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
    });
  }

  if (sections.length && 'IntersectionObserver' in window) {
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting;
      });
      // Pick the first section (in document order) that is currently visible.
      for (var i = 0; i < sections.length; i++) {
        if (visible[sections[i].id]) { setActive(sections[i].id); return; }
      }
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ── Header shadow + back-to-top button ────────────────────────────────── */

  var header = $('#siteHeader');
  var toTop = $('#toTop');
  var progressFill = $('#readProgress span');

  function onScroll() {
    var doc = document.documentElement;
    var y = window.pageYOffset || doc.scrollTop;

    if (header) { header.classList.toggle('is-stuck', y > 4); }
    if (toTop)  { toTop.classList.toggle('is-visible', y > 600); }

    if (progressFill) {
      var scrollable = doc.scrollHeight - window.innerHeight;
      var pct = scrollable > 0 ? (y / scrollable) * 100 : 0;
      progressFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    }
  }

  // Throttle to one update per animation frame.
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) { return; }
    ticking = true;
    window.requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ── Code tabs ─────────────────────────────────────────────────────────── */

  // Each .tabs container is independent — the page has more than one.
  $$('.tabs').forEach(function (tabs) {
    var buttons = $$('.tab-btn', tabs);
    var panels  = $$('.tab-panel', tabs);

    function selectTab(name) {
      buttons.forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-tab') === name);
      });
      panels.forEach(function (panel) {
        panel.classList.toggle('is-active', panel.getAttribute('data-panel') === name);
      });
    }

    buttons.forEach(function (btn, index) {
      btn.addEventListener('click', function () {
        selectTab(btn.getAttribute('data-tab'));
      });
      // Left/right arrows move between tabs, as expected of a tablist.
      btn.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') { return; }
        e.preventDefault();
        var step = e.key === 'ArrowRight' ? 1 : -1;
        var next = buttons[(index + step + buttons.length) % buttons.length];
        next.focus();
        selectTab(next.getAttribute('data-tab'));
      });
    });
  });

  /* ── Module filters ────────────────────────────────────────────────────── */

  var filters = $('#filters');
  var moduleGrid = $('#moduleGrid');
  var emptyNote = $('#emptyNote');
  var filterCount = $('#filterCount');

  if (filters && moduleGrid) {
    var chips = $$('.chip', filters);
    var modules = $$('.module', moduleGrid);

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });

        var shown = 0;
        modules.forEach(function (mod) {
          var match = want === 'all' || mod.getAttribute('data-cat') === want;
          mod.hidden = !match;
          if (match) { shown++; }
        });

        if (emptyNote) { emptyNote.hidden = shown > 0; }
        if (filterCount) {
          filterCount.textContent = want === 'all'
            ? modules.length + ' addons'
            : shown + ' of ' + modules.length + ' addons';
        }
      });
    });

    if (filterCount) { filterCount.textContent = modules.length + ' addons'; }
  }

  /* ── Copy button on every code block ───────────────────────────────────── */

  function canCopy() {
    return !!(navigator.clipboard && navigator.clipboard.writeText);
  }

  if (canCopy()) {
    $$('pre').forEach(function (pre) {
      var wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy code to clipboard');
      wrapper.appendChild(btn);

      var resetTimer = null;
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(pre.textContent).then(function () {
          btn.textContent = 'Copied';
          btn.classList.add('is-copied');
          window.clearTimeout(resetTimer);
          resetTimer = window.setTimeout(function () {
            btn.textContent = 'Copy';
            btn.classList.remove('is-copied');
          }, 1600);
        }).catch(function () {
          btn.textContent = 'Failed';
        });
      });
    });
  }

  /* ── Permalink beside each section heading ─────────────────────────────── */

  $$('main section[id]').forEach(function (section) {
    // Only the section's own title, not a secondary heading further down.
    var heading = $('.wrap > h2', section);
    if (!heading) { return; }

    var anchor = document.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.href = '#' + section.id;
    anchor.textContent = '#';
    anchor.setAttribute('aria-label', 'Link to this section');
    heading.appendChild(anchor);
  });

  /* ── FAQ accordion ─────────────────────────────────────────────────────── */

  var faqList = $('#faqList');
  if (faqList) {
    $$('.faq-q', faqList).forEach(function (question) {
      question.addEventListener('click', function () {
        var item = question.parentNode;
        var open = item.classList.toggle('is-open');
        question.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  /* ── Counters in the hero ──────────────────────────────────────────────── */

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduceMotion || target === 0) { el.textContent = String(target); return; }

    var duration = 700;
    var start = null;

    function step(now) {
      if (start === null) { start = now; }
      var progress = Math.min((now - start) / duration, 1);
      el.textContent = String(Math.round(target * progress));
      if (progress < 1) { window.requestAnimationFrame(step); }
    }
    window.requestAnimationFrame(step);
  }

  var counters = $$('.stat-num');
  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) { return; }
          countUp(entry.target);
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { counterObserver.observe(el); });
    } else {
      counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
    }
  }

  /* ── Reveal blocks as they scroll into view ────────────────────────────── */

  var revealTargets = $$(
    '.card, .feature, .module, .tl-item, .arch-tier, .table-scroll, .faq-item'
  ).filter(function (el) {
    // Anything inside a tab panel starts hidden, so it would never intersect
    // until its tab is opened. Leave those fully visible from the start.
    return !el.closest('.tab-panel');
  });

  if (revealTargets.length && 'IntersectionObserver' in window && !reduceMotion) {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });

    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ── Current year in the footer, if a placeholder exists ───────────────── */

  var year = $('#year');
  if (year) { year.textContent = String(new Date().getFullYear()); }

})();
