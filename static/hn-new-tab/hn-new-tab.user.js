// ==UserScript==
// @name         Hacker News Open Links in New Tab
// @namespace    https://joel-hanson.github.io/hn-new-tab/
// @version      1.0.0
// @description  Open Hacker News story links in a new tab
// @author       Joel Hanson
// @match        https://news.ycombinator.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=news.ycombinator.com
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  document.querySelectorAll(".athing .titleline > a").forEach(function (link) {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
})();
