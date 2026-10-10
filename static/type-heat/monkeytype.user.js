// ==UserScript==
// @name         Type Heat on Monkeytype
// @namespace    https://joel-hanson.github.io/type-heat/
// @version      1.0.0
// @description  Warm Monkeytype's background as you type faster (white → pink → red).
// @author       Joel Hanson
// @match        https://monkeytype.com/*
// @match        https://www.monkeytype.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=monkeytype.com
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // Same tuning as /type-heat/
  var heat = 0;
  var times = [];
  var WINDOW = 2000; // ms window for speed
  var MAX_CPS = 9; // characters/sec for full heat
  var RISE = 0.12;
  var FALL = 0.004;

  function mix(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  function heatColor(h) {
    var r;
    var g;
    var b;
    if (h < 0.5) {
      var t = h / 0.5;
      r = mix(255, 255, t);
      g = mix(255, 182, t);
      b = mix(255, 200, t);
    } else {
      var t2 = (h - 0.5) / 0.5;
      r = mix(255, 232, t2);
      g = mix(182, 62, t2);
      b = mix(200, 82, t2);
    }
    return "rgb(" + r + "," + g + "," + b + ")";
  }

  function paintTargets() {
    return [
      document.documentElement,
      document.body,
      document.getElementById("app"),
      document.querySelector(".content"),
    ].filter(Boolean);
  }

  function paint(h) {
    var color = heatColor(h);
    var targets = paintTargets();
    for (var i = 0; i < targets.length; i++) {
      targets[i].style.setProperty("background", color, "important");
      targets[i].style.setProperty("background-color", color, "important");
    }
  }

  function isTypingKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    if (e.isComposing) return false;
    if (e.key === "Backspace" || e.key === "Delete") return true;
    return e.key.length === 1;
  }

  document.addEventListener(
    "keydown",
    function (e) {
      if (!isTypingKey(e)) return;
      times.push(performance.now());
    },
    true
  );

  function tick() {
    var now = performance.now();
    while (times.length && now - times[0] > WINDOW) times.shift();

    var cps = times.length / (WINDOW / 1000);
    var target = Math.min(cps / MAX_CPS, 1);

    if (target > heat) heat += (target - heat) * RISE;
    else heat = Math.max(heat - FALL, 0);

    paint(heat);
    requestAnimationFrame(tick);
  }

  tick();
})();
