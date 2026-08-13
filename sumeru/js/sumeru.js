/* Sumeru - product site behaviour */

(function () {
  "use strict";

  var $ = function (sel, root) {
    return (root || document).querySelector(sel);
  };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var THEME_KEY = "sumeru-theme";

  function currentTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    return t === "light" ? "light" : "dark";
  }

  function applyTheme(theme) {
    var next = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      /* ignore */
    }
    var meta = $('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", next === "light" ? "#f3f3f0" : "#050505");
    }
    $$(".theme-toggle").forEach(function (btn) {
      btn.setAttribute(
        "aria-label",
        next === "light" ? "Switch to dark theme" : "Switch to light theme",
      );
      btn.setAttribute(
        "title",
        next === "light" ? "Switch to dark theme" : "Switch to light theme",
      );
    });
  }

  applyTheme(currentTheme());

  $$(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      applyTheme(currentTheme() === "light" ? "dark" : "light");
    });
  });

  /* Card nav */

  var nav = $("#cardNav");
  var triggers = $$(".card-nav-trigger", nav);
  var panels = $$(".card-nav-panel[data-panel]", nav);

  function closeNav() {
    if (!nav) return;
    nav.classList.remove("open");
    nav.classList.remove("panel-inert");
    triggers.forEach(function (t) {
      t.classList.remove("active");
      t.setAttribute("aria-expanded", "false");
    });
    panels.forEach(function (p) {
      p.hidden = true;
      p.classList.remove("is-active");
    });
  }

  var inertTimer = null;

  function openPanel(name) {
    if (!nav) return;
    nav.classList.add("open");
    /* Block clicks on newly shown links until the open gesture finishes */
    nav.classList.add("panel-inert");
    if (inertTimer) clearTimeout(inertTimer);
    inertTimer = setTimeout(function () {
      nav.classList.remove("panel-inert");
      inertTimer = null;
    }, 320);

    triggers.forEach(function (t) {
      var on = t.getAttribute("data-panel") === name;
      t.classList.toggle("active", on);
      t.setAttribute("aria-expanded", on ? "true" : "false");
    });
    panels.forEach(function (p) {
      var on = p.getAttribute("data-panel") === name;
      p.hidden = !on;
      p.classList.toggle("is-active", on);
    });
  }

  if (nav) {
    panels.forEach(function (p) {
      p.hidden = true;
      p.classList.remove("is-active");
    });
    triggers.forEach(function (t) {
      t.setAttribute("aria-expanded", "false");
      t.setAttribute("aria-haspopup", "true");
    });

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var name = trigger.getAttribute("data-panel");
        if (trigger.classList.contains("active")) {
          closeNav();
        } else {
          openPanel(name);
        }
      });
    });

    $$(".nav-box", nav).forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (nav.classList.contains("panel-inert")) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        closeNav();
      });
    });

    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target)) closeNav();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* Tabs */

  $$(".tabs").forEach(function (tabs) {
    var buttons = $$(".tab-btn", tabs);
    var tabPanels = $$(".tab-panel", tabs);

    function selectTab(name) {
      buttons.forEach(function (btn) {
        btn.classList.toggle(
          "is-active",
          btn.getAttribute("data-tab") === name,
        );
      });
      tabPanels.forEach(function (panel) {
        panel.classList.toggle(
          "is-active",
          panel.getAttribute("data-panel") === name,
        );
      });
    }

    buttons.forEach(function (btn, index) {
      btn.addEventListener("click", function () {
        selectTab(btn.getAttribute("data-tab"));
      });
      btn.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        var step = e.key === "ArrowRight" ? 1 : -1;
        var next = buttons[(index + step + buttons.length) % buttons.length];
        next.focus();
        selectTab(next.getAttribute("data-tab"));
      });
    });
  });

  /* Capability switcher */

  var capList = $("#capList");
  if (capList) {
    var items = $$(".cap-item", capList);
    var codePanels = $$("[data-cap-panel]");
    var notes = $$("[data-cap-note]");

    function selectCap(name) {
      items.forEach(function (item) {
        item.classList.toggle(
          "is-active",
          item.getAttribute("data-cap") === name,
        );
      });
      codePanels.forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-cap-panel") !== name;
      });
      notes.forEach(function (note) {
        note.hidden = note.getAttribute("data-cap-note") !== name;
      });
    }

    items.forEach(function (item) {
      item.addEventListener("click", function () {
        selectCap(item.getAttribute("data-cap"));
      });
    });
  }

  /* Module filters */

  var filters = $("#filters");
  var moduleGrid = $("#moduleGrid");
  var emptyNote = $("#emptyNote");
  var filterCount = $("#filterCount");

  if (filters && moduleGrid) {
    var chips = $$(".chip", filters);
    var modules = $$(".module", moduleGrid);

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var want = chip.getAttribute("data-filter");
        chips.forEach(function (c) {
          c.classList.toggle("is-active", c === chip);
        });

        var shown = 0;
        modules.forEach(function (mod) {
          var match = want === "all" || mod.getAttribute("data-cat") === want;
          mod.hidden = !match;
          if (match) shown++;
        });

        if (emptyNote) emptyNote.hidden = shown > 0;
        if (filterCount) {
          filterCount.textContent =
            want === "all"
              ? modules.length + " addons"
              : shown + " of " + modules.length + " addons";
        }
      });
    });

    if (filterCount) filterCount.textContent = modules.length + " addons";
  }

  /* Copy buttons */

  if (navigator.clipboard && navigator.clipboard.writeText) {
    $$("pre").forEach(function (pre) {
      if (pre.closest(".code-block")) return;
      var wrapper = document.createElement("div");
      wrapper.className = "code-block";
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      wrapper.appendChild(btn);

      var resetTimer = null;
      btn.addEventListener("click", function () {
        navigator.clipboard
          .writeText(pre.textContent)
          .then(function () {
            btn.textContent = "Copied";
            btn.classList.add("is-copied");
            window.clearTimeout(resetTimer);
            resetTimer = window.setTimeout(function () {
              btn.textContent = "Copy";
              btn.classList.remove("is-copied");
            }, 1600);
          })
          .catch(function () {
            btn.textContent = "Failed";
          });
      });
    });
  }

  /* FAQ */

  var faqList = $("#faqList");
  if (faqList) {
    $$(".faq-q", faqList).forEach(function (question) {
      question.addEventListener("click", function () {
        var item = question.parentNode;
        var open = item.classList.toggle("is-open");
        question.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  /* Heading anchors */

  $$("main section[id]").forEach(function (section) {
    var heading =
      $(".wrap > h2", section) || $(".wrap .page-hero-title", section);
    if (!heading || heading.querySelector(".heading-anchor")) return;
    var anchor = document.createElement("a");
    anchor.className = "heading-anchor";
    anchor.href = "#" + section.id;
    anchor.textContent = "#";
    anchor.setAttribute("aria-label", "Link to this section");
    heading.appendChild(anchor);
  });

  /* Scroll / reveal */

  var toTop = $("#toTop");
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
  }
  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        onScroll();
        ticking = false;
      });
    },
    { passive: true },
  );
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  var revealTargets = $$(
    ".card, .module, .tl-item, .arch-tier, .edition, .faq-item, .cap-item",
  ).filter(function (el) {
    return !el.closest(".tab-panel") && !el.closest(".card-nav");
  });

  if (
    revealTargets.length &&
    "IntersectionObserver" in window &&
    !reduceMotion
  ) {
    revealTargets.forEach(function (el) {
      el.classList.add("reveal");
    });
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  var year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
