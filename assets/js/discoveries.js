(function () {
  "use strict";

  var reel = document.getElementById("discoveries-reel");
  if (!reel || reel.classList.contains("discoveries-reel--preview")) return;

  var cards = Array.prototype.slice.call(reel.querySelectorAll(".discovery-card"));
  if (!cards.length) return;

  var progress = document.getElementById("discoveries-progress");
  var mq = window.matchMedia("(max-width: 767px)");
  var dots = [];
  var activeIndex = 0;
  var syncFromScroll = true;

  function clamp(i) {
    return Math.min(cards.length - 1, Math.max(0, i));
  }

  function buildDots() {
    if (!progress) return;
    progress.innerHTML = "";
    dots = [];
    if (!mq.matches) {
      progress.hidden = true;
      return;
    }
    progress.hidden = false;
    for (var i = 0; i < cards.length; i++) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "discoveries-progress-dot";
      dot.setAttribute("aria-label", "Go to discovery " + (i + 1));
      (function (index) {
        dot.addEventListener("click", function (e) {
          e.preventDefault();
          goTo(index);
        });
      })(i);
      progress.appendChild(dot);
      dots.push(dot);
    }
    paintActive();
  }

  function indexFromScroll() {
    var referenceTop = mq.matches ? reel.getBoundingClientRect().top + 8 : 96;
    var best = 0;
    var bestDist = Infinity;
    for (var i = 0; i < cards.length; i++) {
      var dist = Math.abs(cards[i].getBoundingClientRect().top - referenceTop);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  }

  function paintActive() {
    for (var i = 0; i < cards.length; i++) {
      cards[i].classList.toggle("is-active", i === activeIndex);
    }
    for (var j = 0; j < dots.length; j++) {
      dots[j].classList.toggle("is-active", j === activeIndex);
    }
  }

  function scrollToCard(card) {
    if (mq.matches) {
      card.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }
    var y = window.scrollY + card.getBoundingClientRect().top - 24;
    window.scrollTo(0, Math.max(0, y));
  }

  function goTo(index) {
    activeIndex = clamp(index);
    paintActive();
    syncFromScroll = false;
    scrollToCard(cards[activeIndex]);
    try {
      cards[activeIndex].focus({ preventScroll: true });
    } catch (err) {
      cards[activeIndex].focus();
    }
    window.setTimeout(function () {
      syncFromScroll = true;
    }, 50);
  }

  function isTypingTarget(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    var tag = el.tagName;
    return (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      el.isContentEditable
    );
  }

  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    if (isTypingTarget(document.activeElement) || isTypingTarget(e.target)) return;

    var key = e.key;
    if (key === "ArrowDown" || key === "j" || key === "J") {
      e.preventDefault();
      e.stopPropagation();
      goTo(activeIndex + 1);
    } else if (key === "ArrowUp" || key === "k" || key === "K") {
      e.preventDefault();
      e.stopPropagation();
      goTo(activeIndex - 1);
    }
  }

  var ticking = false;
  function onScroll() {
    if (!syncFromScroll || ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      activeIndex = indexFromScroll();
      paintActive();
      ticking = false;
    });
  }

  function bindScroll() {
    window.removeEventListener("scroll", onScroll, { passive: true });
    reel.removeEventListener("scroll", onScroll, { passive: true });
    (mq.matches ? reel : window).addEventListener("scroll", onScroll, { passive: true });
  }

  activeIndex = indexFromScroll();
  buildDots();
  bindScroll();
  paintActive();

  // Capture phase so we win over theme search / link focus quirks
  document.addEventListener("keydown", onKey, true);

  function onBreakpointChange() {
    buildDots();
    bindScroll();
    activeIndex = indexFromScroll();
    paintActive();
  }

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onBreakpointChange);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(onBreakpointChange);
  }
})();
