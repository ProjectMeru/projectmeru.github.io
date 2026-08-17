/* Sumeru docs — Ctrl+K fuzzy search (Fuse.js) */

(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var modal = null;
  var input = null;
  var resultsEl = null;
  var emptyEl = null;
  var fuse = null;
  var index = [];
  var activeIdx = -1;
  var bound = false;

  function ensureDom() {
    modal = $('[data-search-modal]');
    input = $('[data-search-input]');
    resultsEl = $('[data-search-results]');
    emptyEl = $('[data-search-empty]');
    return !!(modal && input && resultsEl);
  }

  function bindUi() {
    if (bound) return;
    if (!ensureDom()) return;
    bound = true;
    $$('[data-search-open]').forEach(function (btn) {
      btn.addEventListener('click', openModal);
    });
    $$('[data-search-close]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });
    input.addEventListener('input', function () {
      renderResults(input.value.trim());
    });
  }

  function docsRootPath() {
    var path = location.pathname.replace(/\/$/, '');
    var idx = path.indexOf('/docs/');
    if (idx < 0) return '';
    return path.slice(0, idx + 6);
  }

  function docsBaseUrl() {
    var root = docsRootPath();
    if (!root) return window.location.origin + '/';
    var base = window.location.origin + root.replace(/\/+$/, '');
    return base + '/';
  }

  function relUrl(target) {
    try {
      if (docsRootPath()) {
        return new URL(target, docsBaseUrl()).pathname;
      }
      return target;
    } catch (e) {
      return target;
    }
  }

  function loadIndex(cb) {
    if (window.SUMERU_DOCS_SEARCH) {
      index = window.SUMERU_DOCS_SEARCH.filter(function (e) {
        return e.url !== '404.html';
      });
      initFuse();
      cb();
      return;
    }
    var root = docsRootPath().replace(/\/+$/, '');
    var url = (root ? root + '/' : '/') + 'js/docs-search-index.json';
    if (!url.startsWith('/')) url = '/' + url.replace(/^\//, '');
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        index = data.filter(function (e) { return e.url !== '404.html'; });
        window.SUMERU_DOCS_SEARCH = index;
        initFuse();
        cb();
      })
      .catch(function () {
        index = [];
        cb();
      });
  }

  function initFuse() {
    if (typeof Fuse === 'undefined') return;
    fuse = new Fuse(index, {
      keys: [
        { name: 'title', weight: 0.45 },
        { name: 'section', weight: 0.15 },
        { name: 'headings', weight: 0.2 },
        { name: 'excerpt', weight: 0.2 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }

  function updateKbdHints() {
    var isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
    $$('.docs-search-kbd-group').forEach(function (g) {
      var mod = $('.docs-kbd-mod', g);
      var key = g.querySelector('.docs-kbd:not(.docs-kbd-mod)');
      if (mod) mod.textContent = isMac ? '⌘' : 'Ctrl';
      if (key) key.textContent = 'K';
    });
  }

  function openModal() {
    bindUi();
    if (!ensureDom()) return;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('docs-search-open');
    loadIndex(function () {
      input.value = '';
      input.focus();
      renderResults('');
    });
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('docs-search-open');
    activeIdx = -1;
  }

  function renderResults(q) {
    if (!resultsEl) return;
    resultsEl.innerHTML = '';
    activeIdx = -1;
    var items = [];
    if (!q || q.length < 1) {
      items = index.slice(0, 8);
    } else if (fuse) {
      items = fuse.search(q, { limit: 12 }).map(function (r) { return r.item; });
    } else {
      var lower = q.toLowerCase();
      items = index.filter(function (it) {
        return (it.title && it.title.toLowerCase().indexOf(lower) >= 0) ||
          (it.excerpt && it.excerpt.toLowerCase().indexOf(lower) >= 0);
      }).slice(0, 12);
    }
    if (emptyEl) emptyEl.hidden = items.length > 0;
    items.forEach(function (it) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      var a = document.createElement('a');
      a.href = relUrl(it.url);
      a.className = 'docs-search-hit';
      var meta = document.createElement('span');
      meta.className = 'docs-search-hit-meta';
      meta.textContent = (it.track || '') + ' · ' + (it.section || '');
      var title = document.createElement('span');
      title.className = 'docs-search-hit-title';
      title.textContent = it.title;
      var excerpt = document.createElement('span');
      excerpt.className = 'docs-search-hit-excerpt';
      excerpt.textContent = it.excerpt || '';
      a.appendChild(meta);
      a.appendChild(title);
      if (it.excerpt) a.appendChild(excerpt);
      li.appendChild(a);
      resultsEl.appendChild(li);
    });
  }

  function highlightActive() {
    var rows = $$('[data-search-results] li');
    rows.forEach(function (li, i) {
      li.classList.toggle('is-active', i === activeIdx);
      if (i === activeIdx) {
        var link = li.querySelector('a');
        if (link) link.focus();
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (modal && !modal.hidden) closeModal();
      else openModal();
      return;
    }
    if (!modal || modal.hidden) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      var rows = $$('[data-search-results] li');
      if (!rows.length) return;
      activeIdx = Math.min(activeIdx + 1, rows.length - 1);
      highlightActive();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
      highlightActive();
    }
    if (e.key === 'Enter' && activeIdx >= 0) {
      var row = $$('[data-search-results] li')[activeIdx];
      if (row) {
        var a = row.querySelector('a');
        if (a) window.location.href = a.getAttribute('href');
      }
    }
  });

  updateKbdHints();
  bindUi();
  loadIndex(function () { /* warm cache */ });
})();
