/* Sumeru docs behaviour */

(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var THEME_KEY = 'sumeru-theme';

  function currentTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    return t === 'dark' ? 'dark' : 'light';
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
    btn.addEventListener('click', function () {
      applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
    });
  });

  /* Shell: track tabs, sidebar from nav.json, site footer */

  var NAV = window.SUMERU_DOCS_NAV;

  function docsDepth() {
    var path = location.pathname.replace(/\/$/, '');
    var idx = path.indexOf('/docs/');
    if (idx < 0) return 0;
    var after = path.slice(idx + 6).replace(/^\//, '');
    if (!after || after === 'index.html') return 0;
    var parts = after.split('/').filter(Boolean);
    if (!parts.length) return 0;
    if (parts[parts.length - 1].endsWith('.html')) {
      return Math.max(0, parts.length - 1);
    }
    return parts.length;
  }

  function docsRootPrefix() {
    var path = location.pathname;
    var idx = path.indexOf('/docs/');
    if (idx < 0) return '';
    return path.slice(0, idx + 6);
  }

  function docsBaseUrl() {
    var root = docsRootPrefix();
    if (!root) return window.location.origin + '/';
    var base = window.location.origin + root.replace(/\/+$/, '');
    return base + '/';
  }

  function resolveNavHref(href) {
    if (!href || href.indexOf('#') === 0 || href.indexOf('http') === 0) return href;
    if (docsRootPrefix()) {
      try {
        return new URL(href, docsBaseUrl()).pathname;
      } catch (e) { /* fall through */ }
    }
    return navPrefix() + href;
  }

  function fixBrandAssets() {
    var img = $('.docs-brand img');
    var product = $('.docs-product-link');
    var depth = docsDepth();
    var logoPrefix = '../'.repeat(depth + 2);
    var productPrefix = '../'.repeat(depth + 1);
    if (img) img.src = logoPrefix + 'logo.png';
    if (product) product.href = productPrefix + 'index.html';
  }

  function navPrefix() {
    var d = docsDepth();
    return d ? '../'.repeat(d) : '';
  }

  function currentDocsHref() {
    var path = location.pathname.replace(/\/$/, '');
    var idx = path.indexOf('/docs/');
    if (idx < 0) return 'index.html';
    var after = path.slice(idx + 6).replace(/^\//, '');
    if (!after || after === 'index.html') return 'index.html';
    if (path.endsWith('/docs')) return 'index.html';
    return after;
  }

  function groupStorageKey(track, groupId) {
    return 'sumeru-docs-nav-' + track + '-' + groupId;
  }

  var TRACK_ICONS = {
    guides: '<svg viewBox="0 0 16 16"><path d="M2 3.2A1.2 1.2 0 0 1 3.2 2H6.5A1.5 1.5 0 0 1 8 3.5v9A1.5 1.5 0 0 0 6.5 11H2Z"/><path d="M14 3.2A1.2 1.2 0 0 0 12.8 2H9.5A1.5 1.5 0 0 0 8 3.5v9A1.5 1.5 0 0 1 9.5 11H14Z"/></svg>',
    reference: '<svg viewBox="0 0 16 16"><rect x="1.5" y="2.5" width="13" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="m4.6 6.4 2 1.6-2 1.6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8.6 10.2h3" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
    addons: '<svg viewBox="0 0 16 16"><path d="M8 1.6 14.5 5 8 8.4 1.5 5Z"/><path d="m1.5 8 6.5 3.4L14.5 8"/><path d="m1.5 11 6.5 3.4L14.5 11"/></svg>',
    business: '<svg viewBox="0 0 16 16"><rect x="2" y="5" width="12" height="9" rx="1.2"/><path d="M5 5V3.8A1.8 1.8 0 0 1 6.8 2h2.4A1.8 1.8 0 0 1 11 3.8V5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
  };

  function renderTrackTabs(track) {
    var list = $('.docs-track-list');
    if (!list || !NAV || !NAV.tracks) return;
    list.innerHTML = '';
    NAV.tracks.forEach(function (t) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = resolveNavHref(t.href);
      a.className = 'docs-track-tab';
      if (t.id === track) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
      a.setAttribute('data-track', t.id);
      var ico = document.createElement('span');
      ico.className = 'docs-track-ico';
      ico.innerHTML = TRACK_ICONS[t.id] || TRACK_ICONS.guides;
      var label = document.createElement('span');
      label.className = 'docs-track-label';
      label.textContent = t.label;
      a.appendChild(ico);
      a.appendChild(label);
      li.appendChild(a);
      list.appendChild(li);
    });
    initTrackMarker();
  }

  function initTrackMarker() {
    var rail = $('.docs-track-rail');
    var marker = $('.docs-track-marker');
    if (!rail || !marker) return;
    function activeTab() {
      return rail.querySelector('.docs-track-tab.is-active, .docs-track-tab[aria-current="page"]');
    }
    function setMarker(tab, isActive) {
      if (!tab) {
        rail.removeAttribute('data-marker');
        return;
      }
      marker.style.setProperty('--marker-left', tab.offsetLeft + 'px');
      marker.style.setProperty('--marker-width', tab.offsetWidth + 'px');
      rail.setAttribute('data-marker', isActive ? 'active' : 'hover');
    }
    function snapActive() { setMarker(activeTab(), true); }
    snapActive();
    requestAnimationFrame(function () { rail.setAttribute('data-marker-ready', ''); });
    rail.addEventListener('pointerover', function (e) {
      var tab = e.target && e.target.closest ? e.target.closest('.docs-track-tab') : null;
      if (tab) setMarker(tab, tab.matches('.is-active, [aria-current="page"]'));
    });
    rail.addEventListener('pointerleave', snapActive);
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(snapActive).observe(rail);
    }
    var tab = activeTab();
    if (tab && tab.scrollIntoView) {
      tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
    }
  }

  function initInstallBtn() {
    var btn = $('.docs-install-btn');
    if (!btn) return;
    var timer = null;
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      if (!text) return;
      navigator.clipboard.writeText(text).then(function () {
        btn.setAttribute('data-copied', 'true');
        clearTimeout(timer);
        timer = setTimeout(function () { btn.removeAttribute('data-copied'); }, 1600);
      }).catch(function () { /* ignore */ });
    });
  }

  function renderSidebar(track) {
    var sidebar = $('.docs-sidebar[data-nav-track]');
    if (!sidebar || !NAV || !NAV.sidebars) return;
    var groups = NAV.sidebars[track];
    if (!groups) return;
    sidebar.innerHTML = '';
    var current = currentDocsHref();
    groups.forEach(function (group) {
      var wrap = document.createElement('div');
      wrap.className = 'docs-sidebar-group is-collapsible';
      wrap.setAttribute('data-nav-group', group.id || group.title);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'docs-sidebar-title';
      var label = document.createElement('span');
      label.textContent = group.title;
      var chev = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      chev.setAttribute('class', 'docs-sidebar-chevron');
      chev.setAttribute('viewBox', '0 0 24 24');
      chev.setAttribute('width', '14');
      chev.setAttribute('height', '14');
      chev.setAttribute('aria-hidden', 'true');
      chev.innerHTML = '<path fill="none" stroke="currentColor" stroke-width="2" d="M6 9l6 6 6-6"/>';
      btn.appendChild(label);
      btn.appendChild(chev);
      var list = document.createElement('ul');
      list.className = 'docs-sidebar-list';
      var hasActive = false;
      (group.items || []).forEach(function (item) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = resolveNavHref(item.href);
        a.textContent = item.title;
        if (item.href === current) {
          a.classList.add('is-active');
          hasActive = true;
        }
        li.appendChild(a);
        list.appendChild(li);
      });
      var gkey = groupStorageKey(track, group.id || group.title);
      var stored = null;
      try { stored = sessionStorage.getItem(gkey); } catch (e) { /* ignore */ }
      var expanded = stored === null ? (hasActive || group.id === 'start' || group.id === 'reference' || group.id === 'addons-start' || group.id === 'biz-start') : stored === '1';
      btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      wrap.classList.toggle('is-collapsed', !expanded);
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        wrap.classList.toggle('is-collapsed', !open);
        try { sessionStorage.setItem(gkey, open ? '1' : '0'); } catch (e) { /* ignore */ }
      });
      wrap.appendChild(btn);
      wrap.appendChild(list);
      sidebar.appendChild(wrap);
    });
  }

  function renderSiteFooter() {
    var footer = $('[data-site-footer]');
    if (!footer) return;
    var productHref = navPrefix() + '../index.html';
    footer.innerHTML =
      '<div class="docs-site-footer-grid">' +
      '<div class="docs-site-footer-col"><p class="docs-site-footer-heading">Documentation</p><ul>' +
      '<li><a href="' + resolveNavHref('index.html') + '">Guides</a></li>' +
      '<li><a href="' + resolveNavHref('reference/index.html') + '">Reference</a></li>' +
      '<li><a href="' + resolveNavHref('addons/index.html') + '">Addons</a></li>' +
      '<li><a href="' + resolveNavHref('using/index.html') + '">Business</a></li>' +
      '</ul></div>' +
      '<div class="docs-site-footer-col"><p class="docs-site-footer-heading">Resources</p><ul>' +
      '<li><a href="https://github.com/ProjectMeru/sumeru" target="_blank" rel="noopener">GitHub</a></li>' +
      '<li><a href="' + resolveNavHref('guides/start/installation.html') + '">Installation</a></li>' +
      '<li><a href="' + resolveNavHref('guides/build/report-engine.html') + '">Report engine</a></li>' +
      '</ul></div>' +
      '<div class="docs-site-footer-col"><p class="docs-site-footer-heading">Project</p><ul>' +
      '<li><a href="' + productHref + '">Sumeru product</a></li>' +
      '<li><a href="https://github.com/ProjectMeru" target="_blank" rel="noopener">Project Meru</a></li>' +
      '</ul></div>' +
      '</div>' +
      '<p class="docs-site-footer-note"><strong>Pre-alpha.</strong> No tagged release or upgrade path. Evaluation and development only.</p>';
  }

  function flattenTrackItems(track) {
    var out = [];
    if (!NAV || !NAV.sidebars || !NAV.sidebars[track]) return out;
    NAV.sidebars[track].forEach(function (g) {
      (g.items || []).forEach(function (it) { out.push(it); });
    });
    return out;
  }

  function updatePrevNext(track) {
    var navEl = $('.docs-next');
    if (!navEl || !NAV) return;
    var items = flattenTrackItems(track);
    var current = currentDocsHref();
    var idx = -1;
    items.forEach(function (it, i) { if (it.href === current) idx = i; });
    if (idx < 0) return;
    var prev = idx > 0 ? items[idx - 1] : null;
    var next = idx < items.length - 1 ? items[idx + 1] : null;
    navEl.innerHTML = '';
    if (prev) {
      var pa = document.createElement('a');
      pa.className = 'is-prev';
      pa.href = resolveNavHref(prev.href);
      pa.innerHTML = '<span class="docs-next-label">Previous</span><span class="docs-next-title">&larr; ' + prev.title + '</span>';
      navEl.appendChild(pa);
    }
    if (next) {
      var na = document.createElement('a');
      na.className = 'is-next';
      na.href = resolveNavHref(next.href);
      na.innerHTML = '<span class="docs-next-label">Next</span><span class="docs-next-title">' + next.title + ' &rarr;</span>';
      navEl.appendChild(na);
    }
  }

  function addHeadingAnchors() {
    var article = $('.docs-article');
    if (!article) return;
    $$('h2[id], h3[id]', article).forEach(function (h) {
      if ($('.docs-heading-anchor', h)) return;
      var a = document.createElement('a');
      a.className = 'docs-heading-anchor';
      a.href = '#' + h.id;
      a.setAttribute('aria-label', 'Section titled ' + h.textContent.replace(/\s+/g, ' ').trim());
      a.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
      h.appendChild(a);
    });
  }

  if (NAV) {
    var trackEl = $('.docs-sidebar[data-nav-track]');
    var track = trackEl ? trackEl.getAttribute('data-nav-track') : 'guides';
    fixBrandAssets();
    renderTrackTabs(track);
    renderSidebar(track);
    renderSiteFooter();
    updatePrevNext(track);
    addHeadingAnchors();
  }

  initInstallBtn();
  fixBrandAssets();

  /* Mobile sidebar */

  var menuBtn = $('.docs-menu-btn');
  var backdrop = $('.docs-backdrop');

  function closeNav() {
    document.body.classList.remove('docs-nav-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }

  function openNav() {
    document.body.classList.add('docs-nav-open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      if (document.body.classList.contains('docs-nav-open')) closeNav();
      else openNav();
    });
  }
  if (backdrop) backdrop.addEventListener('click', closeNav);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });
  $$('.docs-sidebar a').forEach(function (a) {
    a.addEventListener('click', closeNav);
  });

  /* Active sidebar link + keep sidebar scroll on the current page */

  var SIDEBAR_SCROLL_KEY = 'sumeru-docs-sidebar-scroll';
  var sidebar = $('.docs-sidebar');
  var path = location.pathname.replace(/\/$/, '');
  var activeNav = null;

  $$('.docs-sidebar a').forEach(function (a) {
    try {
      var href = a.getAttribute('href');
      if (!href || href.indexOf('#') === 0) return;
      var resolved = new URL(href, location.href).pathname.replace(/\/$/, '');
      if (resolved === path ||
          (path.endsWith('/docs') && resolved.endsWith('/docs/index.html')) ||
          (path.endsWith('/docs') && resolved.endsWith('/docs')) ||
          (path.endsWith('/docs/index.html') && resolved.endsWith('/docs'))) {
        a.classList.add('is-active');
        activeNav = a;
      }
    } catch (err) { /* ignore */ }
  });

  function saveSidebarScroll() {
    if (!sidebar) return;
    try { sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(sidebar.scrollTop)); } catch (e) { /* ignore */ }
  }

  function restoreSidebarScroll() {
    if (!sidebar) return;
    var saved = null;
    try { saved = sessionStorage.getItem(SIDEBAR_SCROLL_KEY); } catch (e) { /* ignore */ }
    if (saved !== null && saved !== '') {
      var y = parseInt(saved, 10);
      if (!isNaN(y)) sidebar.scrollTop = y;
    }
    if (!activeNav) return;
    // Keep the current page visible without jumping the whole window
    var pad = 12;
    var sideRect = sidebar.getBoundingClientRect();
    var linkRect = activeNav.getBoundingClientRect();
    var linkTop = linkRect.top - sideRect.top + sidebar.scrollTop;
    var linkBottom = linkTop + linkRect.height;
    var viewTop = sidebar.scrollTop;
    var viewBottom = viewTop + sidebar.clientHeight;
    if (linkTop < viewTop + pad) {
      sidebar.scrollTop = Math.max(0, linkTop - pad);
    } else if (linkBottom > viewBottom - pad) {
      sidebar.scrollTop = Math.max(0, linkBottom - sidebar.clientHeight + pad);
    }
    saveSidebarScroll();
  }

  if (sidebar) {
    sidebar.addEventListener('scroll', saveSidebarScroll, { passive: true });
    $$('a', sidebar).forEach(function (a) {
      a.addEventListener('click', saveSidebarScroll);
    });
    // After layout (banner/topbar) so clientHeight is correct
    requestAnimationFrame(restoreSidebarScroll);
  }

  /* Build TOC from h2 + nested h3 */

  var article = $('.docs-article');
  var tocList = $('.docs-toc-list');
  if (article && tocList) {
    var headings = $$('h2[id], h3[id]', article);
    if (!headings.length) {
      var toc = $('.docs-toc');
      if (toc) toc.style.display = 'none';
    } else {
      var overviewLi = document.createElement('li');
      overviewLi.className = 'is-overview';
      var overviewLink = document.createElement('a');
      overviewLink.href = '#';
      overviewLink.textContent = 'Overview';
      overviewLi.appendChild(overviewLink);
      tocList.appendChild(overviewLi);

      function tocLabel(h) {
        var custom = h.getAttribute('data-toc');
        if (custom && custom.trim()) return custom.trim();
        var code = $('code', h);
        if (code && h.tagName === 'H3') return code.textContent.trim();
        return h.textContent.replace(/\s+/g, ' ').trim();
      }

      headings.forEach(function (h) {
        var li = document.createElement('li');
        if (h.tagName === 'H3') li.className = 'is-h3';
        var link = document.createElement('a');
        link.href = '#' + h.id;
        link.textContent = tocLabel(h);
        link.title = tocLabel(h);
        li.appendChild(link);
        tocList.appendChild(li);
      });

      var tocLinks = $$('a', tocList);
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          tocLinks.forEach(function (l) {
            l.classList.toggle('is-active', l.getAttribute('href') === '#' + id);
          });
        });
      }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });

      headings.forEach(function (h) { observer.observe(h); });
    }
  }

  /* Syntax color */

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function colorize(text, lang) {
    if (!text || text === '\u00a0') return text === '\u00a0' ? '&nbsp;' : '';
    lang = (lang || '').toLowerCase();
    if (lang === 'xml' || lang === 'html') return colorXml(text);
    if (lang === 'go') return colorGo(text);
    if (lang === 'json') return colorJson(text);
    if (lang === 'csv') return colorCsv(text);
    if (lang === 'shell') return colorShell(text);
    return escHtml(text);
  }

  function colorXml(text) {
    var out = '';
    var i = 0;
    while (i < text.length) {
      if (text.slice(i, i + 4) === '<!--') {
        var end = text.indexOf('-->', i);
        if (end < 0) end = text.length; else end += 3;
        out += '<span class="tok-cmt">' + escHtml(text.slice(i, end)) + '</span>';
        i = end;
        continue;
      }
      if (text[i] === '<') {
        var close = text.indexOf('>', i);
        if (close < 0) {
          out += escHtml(text.slice(i));
          break;
        }
        var tag = text.slice(i, close + 1);
        var escTag = escHtml(tag);
        escTag = escTag.replace(
          /^(&lt;\/?)([a-zA-Z0-9:_-]+)/,
          '<span class="tok-punct">$1</span><span class="tok-tag">$2</span>'
        );
        escTag = escTag.replace(
          /([a-zA-Z_:][\w:.-]*)(=)(&quot;[\s\S]*?&quot;)/g,
          '<span class="tok-attr">$1</span><span class="tok-punct">$2</span><span class="tok-str">$3</span>'
        );
        escTag = escTag.replace(/(\/?&gt;)$/, '<span class="tok-punct">$1</span>');
        out += escTag;
        i = close + 1;
        continue;
      }
      var next = text.indexOf('<', i);
      if (next < 0) next = text.length;
      out += escHtml(text.slice(i, next));
      i = next;
    }
    return out;
  }

  function colorGo(text) {
    var esc = escHtml(text);
    esc = esc.replace(/(\/\/.*)$/g, '<span class="tok-cmt">$1</span>');
    esc = esc.replace(/(&quot;(?:\\.|[^&])*?&quot;|&#39;(?:\\.|[^&])*?&#39;)/g, '<span class="tok-str">$1</span>');
    esc = esc.replace(
      /\b(package|import|func|return|type|struct|var|const|if|else|for|range|defer|go|map|chan|interface|string|int|bool|error|nil|true|false)\b/g,
      '<span class="tok-kw">$1</span>'
    );
    esc = esc.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
    return esc;
  }

  function colorJson(text) {
    var esc = escHtml(text);
    esc = esc.replace(/(&quot;[^&]*?&quot;)(\s*:)/g, '<span class="tok-key">$1</span><span class="tok-punct">$2</span>');
    esc = esc.replace(/:(\s*)(&quot;[\s\S]*?&quot;)/g, ':$1<span class="tok-str">$2</span>');
    esc = esc.replace(/\b(true|false|null)\b/g, '<span class="tok-kw">$1</span>');
    esc = esc.replace(/\b(-?\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>');
    return esc;
  }

  function colorCsv(text) {
    return escHtml(text).split(',').map(function (cell, idx, arr) {
      return '<span class="tok-str">' + cell + '</span>' +
        (idx < arr.length - 1 ? '<span class="tok-punct">,</span>' : '');
    }).join('');
  }

  function colorShell(text) {
    var esc = escHtml(text);
    if (/^(cd|make|go|curl|psql|export|cp|mkdir|cat)\b/.test(text)) {
      esc = esc.replace(/^(\S+)/, '<span class="tok-fn">$1</span>');
    }
    esc = esc.replace(/(--?[\w-]+)/g, '<span class="tok-attr">$1</span>');
    esc = esc.replace(/(&quot;[\s\S]*?&quot;)/g, '<span class="tok-str">$1</span>');
    return esc;
  }

  function colorizeBox(box) {
    $$('.docs-pre.is-lined', box).forEach(function (pre) {
      var lang = pre.getAttribute('data-lang') || '';
      $$('.docs-line-c', pre).forEach(function (cell) {
        if (cell.getAttribute('data-tok') === '1') return;
        var raw = cell.textContent;
        if (raw === '\u00a0' || raw === '') {
          cell.innerHTML = '&nbsp;';
        } else {
          cell.innerHTML = colorize(raw, lang);
        }
        cell.setAttribute('data-tok', '1');
      });
    });
    $$('.docs-shell-cmd', box).forEach(function (cmd) {
      if (cmd.getAttribute('data-tok') === '1') return;
      var line = cmd.closest('.docs-shell-line');
      if (line && line.classList.contains('is-comment')) {
        cmd.setAttribute('data-tok', '1');
        return;
      }
      cmd.innerHTML = colorShell(cmd.textContent);
      cmd.setAttribute('data-tok', '1');
    });
  }

  /* Code boxes: tabs, explorer, copy, wrap, color */

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  $$('.docs-codebox').forEach(function (box) {
    box.classList.add('is-wrap');
    var tabs = $$('.docs-file[role="tab"], .docs-seg-btn[role="tab"]', box);
    var panels = $$('.docs-codebox-panel', box);
    var pathEl = $('[data-path]', box);
    var langEl = $('[data-lang-label]', box);
    var copyBtn = $('[data-copy]', box);
    var wrapBtn = $('[data-wrap]', box);
    if (!panels.length) return;

    // Ensure wrap control exists on source/shell/explorer
    if (!wrapBtn && (box.classList.contains('is-source') ||
        box.classList.contains('is-shell') ||
        box.classList.contains('is-explorer'))) {
      var actions = $('.docs-codebox-actions', box);
      if (actions) {
        wrapBtn = document.createElement('button');
        wrapBtn.type = 'button';
        wrapBtn.className = 'docs-wrap';
        wrapBtn.setAttribute('data-wrap', '');
        wrapBtn.setAttribute('aria-pressed', 'true');
        wrapBtn.title = 'Toggle word wrap';
        wrapBtn.textContent = 'Wrap';
        var copy = $('[data-copy]', actions);
        if (copy) actions.insertBefore(wrapBtn, copy);
        else actions.appendChild(wrapBtn);
      }
    }

    function activePanel() {
      return panels.filter(function (p) { return p.classList.contains('is-active'); })[0] || panels[0];
    }

    function showPanel(id) {
      var matched = false;
      panels.forEach(function (p) {
        var on = p.getAttribute('data-panel') === id;
        p.classList.toggle('is-active', on);
        if (on) {
          matched = true;
          p.removeAttribute('hidden');
        } else {
          p.setAttribute('hidden', '');
        }
      });
      if (!matched) return false;

      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === id;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });

      var tab = tabs.filter(function (t) { return t.getAttribute('data-tab') === id; })[0];
      if (pathEl && tab && tab.getAttribute('data-file')) {
        pathEl.textContent = tab.getAttribute('data-file');
      }
      if (langEl && tab && tab.getAttribute('data-lang')) {
        langEl.textContent = tab.getAttribute('data-lang');
      }

      var editor = $('.docs-codebox-editor', box);
      if (editor) editor.scrollTop = 0;
      if (tab && tab.scrollIntoView) {
        try { tab.scrollIntoView({ block: 'nearest' }); } catch (e) { /* ignore */ }
      }
      colorizeBox(box);
      return true;
    }

    function activate(tab) {
      if (!tab) return;
      showPanel(tab.getAttribute('data-tab'));
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        activate(tab);
      });
      tab.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' &&
            e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var i = tabs.indexOf(tab);
        var dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
        var next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus();
        activate(next);
      });
    });

    box.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('.docs-tree-link') : null;
      if (!link || !box.contains(link)) return;
      e.preventDefault();
      e.stopPropagation();
      var id = link.getAttribute('data-open');
      if (id) showPanel(id);
    });

    if (wrapBtn) {
      wrapBtn.addEventListener('click', function () {
        var on = !box.classList.contains('is-wrap');
        box.classList.toggle('is-wrap', on);
        wrapBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (box.dataset.userSized !== '1') requestAnimationFrame(fitToContent);
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var panel = activePanel();
        var text = panel ? (panel.getAttribute('data-copy-text') || '') : '';
        if (!text && panel) {
          var cmd = $$('.docs-shell-cmd', panel).map(function (el) { return el.textContent; });
          if (cmd.length) text = cmd.join('\n');
          else text = panel.textContent.replace(/\n{3,}/g, '\n\n').trim();
        }
        copyText(text).then(function () {
          var prev = copyBtn.textContent;
          copyBtn.textContent = 'Copied';
          copyBtn.classList.add('is-copied');
          setTimeout(function () {
            copyBtn.textContent = prev;
            copyBtn.classList.remove('is-copied');
          }, 1400);
        }).catch(function () {
          copyBtn.textContent = 'Failed';
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1400);
        });
      });
    }

    colorizeBox(box);

    /* Size box to content; keep user drag-resize */
    function fitToContent() {
      if (box.dataset.userSized === '1') return;
      box.style.height = 'auto';
      var title = $('.docs-codebox-titlebar', box);
      var bodyEl = $('.docs-codebox-editor', box) || $('.docs-codebox-panels', box);
      if (!bodyEl) return;
      var titleH = title ? title.offsetHeight : 0;
      var contentH = bodyEl.scrollHeight;
      var next = titleH + contentH + 2;
      var max = Math.min(window.innerHeight * 0.75, 820);
      var min = box.classList.contains('is-explorer') ? 220 : 0;
      box.style.height = Math.max(min, Math.min(next, max)) + 'px';
    }

    var resizeWatch = 0;
    box.addEventListener('mousedown', function () {
      resizeWatch = box.offsetHeight;
    });
    window.addEventListener('mouseup', function () {
      if (!resizeWatch) return;
      if (Math.abs(box.offsetHeight - resizeWatch) > 2) {
        box.dataset.userSized = '1';
      }
      resizeWatch = 0;
    });

    var origShow = showPanel;
    showPanel = function (id) {
      var ok = origShow(id);
      if (ok) requestAnimationFrame(fitToContent);
      return ok;
    };

    requestAnimationFrame(function () {
      colorizeBox(box);
      fitToContent();
    });
  });
})();
