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
    btn.addEventListener('click', function () {
      applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
    });
  });

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
