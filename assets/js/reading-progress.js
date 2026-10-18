(function () {
  "use strict";

  function init() {
    var article =
      document.querySelector(".article-content") ||
      document.querySelector("article");
    var bar = document.getElementById("reading-prog-bar");
    var fill = document.getElementById("reading-prog-fill");
    var pctEl = document.getElementById("reading-prog-pct");
    var top = document.getElementById("top-reading-prog");
    if (!article || (!fill && !top)) return;

    var lastPct = -1;

    function update() {
      var end =
        article.getBoundingClientRect().bottom +
        window.scrollY -
        window.innerHeight;
      var ratio = Math.max(0, Math.min(1, window.scrollY / Math.max(1, end)));
      var pct = Math.round(100 * ratio);
      var width = 100 * ratio + "%";

      if (top) top.style.width = width;
      if (fill) fill.style.width = width;

      if (pct === lastPct) return;
      lastPct = pct;

      if (pctEl) pctEl.textContent = pct + "%";
      if (bar) bar.setAttribute("aria-valuenow", String(pct));
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
