(function () {
  "use strict";

  var root = document.getElementById("solari-board");
  if (!root) return;

  var gridEl = root.querySelector("[data-solari-grid]");
  var statusEl = root.querySelector("[data-solari-status]");
  if (!gridEl) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var COLS = 14;
  var ROWS = 9;
  var CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  var phrases = [
    ["EVENT STREAMS", "MOSTLY ONCE", "SHIPPED IT"],
    ["KAFKA SAID HI", "LAG IS A MYTH", "HEARTBEAT OK"],
    ["RECONNECT PLS", "RETRY BACKOFF", "PROD IS FINE"],
    ["SCHEMA EVOLVED", "NO DEAD LETTERS", "OFFSET OK"],
    ["YAML AGAIN", "OPS GONNA OPS", "WORKS ON MY BOX"],
  ];

  var cells = [];
  var phraseIndex = 0;
  var cycleTimer = 0;
  var mode = "board"; // board | snake
  var eggRow = ROWS - 1;
  var eggCol = COLS - 1;
  var eggHoverTimer = 0;
  var EGG_CHAR = "S";
  var startingSnake = false;

  var hintTimer = 0;
  var eggPulseTimer = 0;
  var hintIndex = 0;
  var hints = [
    "click · hover · try the S tile",
    "S starts snake · arrows to play",
    "double-click flips a line",
    "esc exits snake",
  ];
  var statusLocked = false;

  // Snake state
  var snake = [];
  var dir = { x: 1, y: 0 };
  var nextDir = { x: 1, y: 0 };
  var food = null;
  var score = 0;
  var snakeTimer = 0;
  var snakeAlive = false;
  var rollGeneration = 0;
  var shuffleTimeout = 0;

  function idx(r, c) {
    return r * COLS + c;
  }

  function stopAllRolls() {
    rollGeneration += 1;
    for (var i = 0; i < cells.length; i++) {
      cells[i]._rolling = false;
      cells[i]._rollTarget = null;
      cells[i]._forceLap = false;
      cells[i]._stepsLeft = 0;
      cells[i].classList.remove("is-flipping");
    }
  }

  function isEggCell(cell) {
    return !!(cell && cell.classList.contains("solari-cell--egg"));
  }

  function paintEgg(cell, flip) {
    if (!cell) return;
    cell.classList.add("solari-cell--egg");
    cell.setAttribute("data-egg", "snake");
    cell.setAttribute("aria-label", "Start snake");
    cell.removeAttribute("aria-hidden");
    cell.title = "Play snake";
    if (flip && !reduceMotion.matches && mode === "board") {
      rollTo(cell, EGG_CHAR, 0, false);
    } else {
      applyGlyph(cell, EGG_CHAR);
    }
  }

  function eggCell() {
    return cells[idx(eggRow, eggCol)] || null;
  }

  function createCell(r, c) {
    var cell = document.createElement("button");
    cell.type = "button";
    cell.className = "solari-cell";
    cell.setAttribute("data-row", String(r));
    cell.setAttribute("data-col", String(c));
    cell.setAttribute("tabindex", "-1");
    cell.setAttribute("aria-hidden", "true");
    cell.setAttribute("data-char", " ");

    if (r === eggRow && c === eggCol) {
      cell.classList.add("solari-cell--egg");
      cell.setAttribute("data-egg", "snake");
      cell.setAttribute("aria-label", "Start snake");
      cell.removeAttribute("aria-hidden");
      cell.title = "Play snake";
      cell.setAttribute("data-char", EGG_CHAR);
    }

    var top = document.createElement("span");
    top.className = "solari-cell__half solari-cell__half--top";
    var topGlyph = document.createElement("span");
    topGlyph.className = "solari-cell__glyph";
    topGlyph.textContent = r === eggRow && c === eggCol ? EGG_CHAR : "\u00a0";
    top.appendChild(topGlyph);

    var bottom = document.createElement("span");
    bottom.className = "solari-cell__half solari-cell__half--bottom";
    var bottomGlyph = document.createElement("span");
    bottomGlyph.className = "solari-cell__glyph";
    bottomGlyph.textContent = r === eggRow && c === eggCol ? EGG_CHAR : "\u00a0";
    bottom.appendChild(bottomGlyph);

    cell.appendChild(top);
    cell.appendChild(bottom);
    return cell;
  }

  function applyGlyph(cell, ch) {
    var display = ch === " " ? "\u00a0" : ch;
    cell.setAttribute("data-char", ch);
    var glyphs = cell.querySelectorAll(".solari-cell__glyph");
    for (var g = 0; g < glyphs.length; g++) {
      glyphs[g].textContent = display;
    }
  }

  function charsetIndex(ch) {
    var i = CHARSET.indexOf(ch);
    return i < 0 ? 0 : i;
  }

  function flipOnce(cell, nextCh, gen) {
    return new Promise(function (resolve) {
      if (mode === "snake" || (typeof gen === "number" && gen !== rollGeneration)) {
        resolve();
        return;
      }
      if (reduceMotion.matches) {
        applyGlyph(cell, nextCh);
        resolve();
        return;
      }
      cell.classList.remove("is-flipping");
      void cell.offsetWidth;
      cell.classList.add("is-flipping");
      window.setTimeout(function () {
        if (mode === "snake" || (typeof gen === "number" && gen !== rollGeneration)) {
          cell.classList.remove("is-flipping");
          resolve();
          return;
        }
        applyGlyph(cell, nextCh);
      }, 48);
      window.setTimeout(function () {
        cell.classList.remove("is-flipping");
        resolve();
      }, 96);
    });
  }

  // Airport-style: every cell rolls forward; unchanged cells take a full lap
  function rollTo(cell, target, delay, forceAll, maxSteps) {
    var gen = rollGeneration;
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        if (mode === "snake" || gen !== rollGeneration) {
          resolve();
          return;
        }

        cell._rollTarget = target;
        cell._forceLap = !!forceAll;
        cell._stepsLeft = -1;
        cell._maxSteps = typeof maxSteps === "number" ? maxSteps : -1;

        if (cell._rolling) {
          resolve();
          return;
        }

        cell._rolling = true;

        function planSteps(current, goal, forceLap) {
          var fromIdx = charsetIndex(current);
          var toIdx = charsetIndex(goal);
          var dist = (toIdx - fromIdx + CHARSET.length) % CHARSET.length;
          if (dist === 0 && forceLap) dist = CHARSET.length;
          if (cell._maxSteps > 0 && dist > cell._maxSteps) {
            // Short shuffle: jump near the target within maxSteps
            return cell._maxSteps;
          }
          return dist;
        }

        function step() {
          if (mode === "snake" || gen !== rollGeneration) {
            cell._rolling = false;
            cell.classList.remove("is-flipping");
            resolve();
            return;
          }

          var goal = cell._rollTarget;
          var current = cell.getAttribute("data-char") || " ";

          if (cell._stepsLeft < 0) {
            cell._stepsLeft = planSteps(current, goal, cell._forceLap);
            cell._forceLap = false;
            if (cell._stepsLeft === 0) {
              applyGlyph(cell, goal);
              cell._rolling = false;
              cell._rollTarget = null;
              resolve();
              return;
            }
          }

          if (cell._stepsLeft === 0) {
            applyGlyph(cell, goal);
            cell._rolling = false;
            cell._rollTarget = null;
            resolve();
            return;
          }

          var nextIdx = (charsetIndex(current) + 1) % CHARSET.length;
          var nextCh =
            cell._stepsLeft === 1 ? goal : CHARSET.charAt(nextIdx);
          cell._stepsLeft -= 1;

          flipOnce(cell, nextCh, gen).then(function () {
            if (mode === "snake" || gen !== rollGeneration) {
              cell._rolling = false;
              cell.classList.remove("is-flipping");
              resolve();
              return;
            }
            var pause = cell._stepsLeft > 16 ? 0 : cell._stepsLeft > 8 ? 4 : 10;
            window.setTimeout(step, pause);
          });
        }

        step();
      }, delay || 0);
    });
  }

  function setCellChar(cell, ch, flip) {
    if (isEggCell(cell) && mode === "board") {
      paintEgg(cell, false);
      return;
    }
    if (flip) {
      var r = parseInt(cell.getAttribute("data-row"), 10) || 0;
      var c = parseInt(cell.getAttribute("data-col"), 10) || 0;
      // Wave across the whole grid so every tile participates
      var stagger = c * 18 + r * 14 + ((r + c) % 5) * 6;
      rollTo(cell, ch, stagger, true);
      return;
    }
    applyGlyph(cell, ch);
  }

  function clearMarks() {
    for (var i = 0; i < cells.length; i++) {
      cells[i].classList.remove(
        "is-near",
        "is-hot",
        "is-snake",
        "is-snake-head",
        "is-food",
        "is-egg-hint"
      );
    }
  }

  function targetGrid(lines, flip) {
    var targets = [];
    var i;
    for (i = 0; i < cells.length; i++) targets[i] = " ";

    var startRow = Math.floor((ROWS - lines.length) / 2);
    for (i = 0; i < lines.length; i++) {
      var line = centerText(lines[i], COLS);
      var r = startRow + i;
      for (var c = 0; c < COLS; c++) {
        targets[idx(r, c)] = line.charAt(c);
      }
    }

    // Keep the snake tile constant
    targets[idx(eggRow, eggCol)] = EGG_CHAR;

    for (i = 0; i < cells.length; i++) {
      cells[i].classList.remove("is-snake", "is-snake-head", "is-food");
      if (isEggCell(cells[i])) {
        paintEgg(cells[i], false);
        continue;
      }
      setCellChar(cells[i], targets[i], flip);
    }
  }

  function paintBlank(flip) {
    for (var i = 0; i < cells.length; i++) {
      cells[i].classList.remove("is-snake", "is-snake-head", "is-food");
      if (isEggCell(cells[i]) && mode === "board") {
        paintEgg(cells[i], false);
        continue;
      }
      setCellChar(cells[i], " ", flip);
    }
  }

  function centerText(text, width) {
    var t = String(text || "")
      .toUpperCase()
      .slice(0, width);
    var pad = Math.max(0, width - t.length);
    var left = Math.floor(pad / 2);
    var right = pad - left;
    var out = "";
    var i;
    for (i = 0; i < left; i++) out += " ";
    out += t;
    for (i = 0; i < right; i++) out += " ";
    return out;
  }

  function paintPhrases(set, flip) {
    targetGrid(set, flip);
  }

  function buildGrid() {
    gridEl.style.setProperty("--solari-cols", String(COLS));
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cell = createCell(r, c);
        cells.push(cell);
        gridEl.appendChild(cell);
      }
    }
  }

  function setStatus(text, show, lock) {
    if (!statusEl) return;
    if (!show) {
      statusLocked = false;
      statusEl.hidden = false;
      showBoardHint(true);
      return;
    }
    statusLocked = !!lock;
    statusEl.hidden = false;
    statusEl.classList.remove("is-fading");
    statusEl.textContent = text;
  }

  function showBoardHint(instant) {
    if (!statusEl || statusLocked || mode !== "board") return;
    var next = hints[hintIndex % hints.length];
    hintIndex += 1;
    if (instant || reduceMotion.matches) {
      statusEl.textContent = next;
      return;
    }
    statusEl.classList.add("is-fading");
    window.setTimeout(function () {
      if (statusLocked || mode !== "board") return;
      statusEl.textContent = next;
      statusEl.classList.remove("is-fading");
    }, 180);
  }

  function scheduleHints() {
    window.clearInterval(hintTimer);
    if (mode !== "board") return;
    hintTimer = window.setInterval(function () {
      if (mode !== "board" || statusLocked) return;
      showBoardHint(false);
    }, 5200);
  }

  function scheduleEggPulse() {
    window.clearInterval(eggPulseTimer);
    if (mode !== "board" || reduceMotion.matches) return;
    eggPulseTimer = window.setInterval(function () {
      if (mode !== "board") return;
      var egg = root.querySelector(".solari-cell--egg");
      if (!egg || egg.classList.contains("is-egg-hint")) return;
      egg.classList.add("is-egg-pulse");
      window.setTimeout(function () {
        egg.classList.remove("is-egg-pulse");
      }, 900);
    }, 7000);
  }

  function scheduleCycle() {
    window.clearInterval(cycleTimer);
    if (reduceMotion.matches || mode !== "board") return;
    cycleTimer = window.setInterval(function () {
      if (mode !== "board" || root.matches(":hover")) return;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      paintPhrases(phrases[phraseIndex], true);
    }, 9000);
  }

  function highlightNear(nx, ny) {
    if (mode !== "board") return;
    var focusRow = Math.min(ROWS - 1, Math.max(0, Math.floor(ny * ROWS)));
    var focusCol = Math.min(COLS - 1, Math.max(0, Math.floor(nx * COLS)));
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cell = cells[idx(r, c)];
        var dist = Math.abs(r - focusRow) + Math.abs(c - focusCol) * 0.55;
        cell.classList.toggle("is-near", dist < 1.7);
        cell.classList.toggle("is-hot", dist < 0.75);
      }
    }
  }

  function clearHighlight() {
    for (var i = 0; i < cells.length; i++) {
      cells[i].classList.remove("is-near", "is-hot");
    }
  }

  function nextCharsetChar(ch) {
    var i = CHARSET.indexOf(ch);
    if (i < 0) i = 0;
    return CHARSET.charAt((i + 1) % CHARSET.length);
  }

  // —— Snake ——
  function randomEmpty() {
    var empties = [];
    var occupied = {};
    var i;
    for (i = 0; i < snake.length; i++) {
      occupied[snake[i].y + "," + snake[i].x] = true;
    }
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (!occupied[r + "," + c]) empties.push({ x: c, y: r });
      }
    }
    if (!empties.length) return null;
    return empties[Math.floor(Math.random() * empties.length)];
  }

  function renderSnake() {
    clearMarks();
    paintBlank(false);
    if (food) {
      var foodCell = cells[idx(food.y, food.x)];
      foodCell.classList.add("is-food");
      setCellChar(foodCell, "·", false);
    }
    for (var i = 0; i < snake.length; i++) {
      var seg = snake[i];
      var cell = cells[idx(seg.y, seg.x)];
      cell.classList.add(i === 0 ? "is-snake-head" : "is-snake");
      setCellChar(cell, i === 0 ? "◉" : "█", false);
    }
    setStatus("snake · " + score + " · esc exits", true, true);
  }

  function stopSnake(message) {
    snakeAlive = false;
    startingSnake = false;
    window.clearInterval(snakeTimer);
    snakeTimer = 0;
    mode = "board";
    root.classList.remove("solari--snake");
    clearMarks();
    paintEgg(eggCell(), false);
    if (message) {
      paintPhrases([message, "SCORE " + score, "NICE TRY THO"], true);
      setStatus("game over · click S to play again", true, true);
      window.setTimeout(function () {
        if (mode !== "board") return;
        paintPhrases(phrases[phraseIndex], true);
        paintEgg(eggCell(), false);
        setStatus("", false);
        scheduleHints();
        scheduleEggPulse();
      }, 2600);
    } else {
      paintPhrases(phrases[phraseIndex], true);
      paintEgg(eggCell(), false);
      setStatus("", false);
      scheduleHints();
      scheduleEggPulse();
    }
    scheduleCycle();
  }

  function tickSnake() {
    if (!snakeAlive) return;
    dir = nextDir;
    var head = snake[0];
    var nx = head.x + dir.x;
    var ny = head.y + dir.y;

    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
      stopSnake("BONK");
      return;
    }

    for (var i = 0; i < snake.length; i++) {
      if (snake[i].x === nx && snake[i].y === ny) {
        stopSnake("OUROBOROS");
        return;
      }
    }

    snake.unshift({ x: nx, y: ny });
    if (food && nx === food.x && ny === food.y) {
      score += 1;
      food = randomEmpty();
      if (!food) {
        stopSnake("NO MORE LAG");
        return;
      }
    } else {
      snake.pop();
    }
    renderSnake();
  }

  function shuffleThenStartSnake() {
    if (mode === "snake" || startingSnake) return;
    startingSnake = true;
    window.clearInterval(cycleTimer);
    window.clearInterval(hintTimer);
    window.clearInterval(eggPulseTimer);
    window.clearTimeout(shuffleTimeout);
    stopAllRolls();
    setStatus("shuffling · get ready", true, true);

    var pending = 0;
    var finished = false;
    var shuffleGen = rollGeneration;

    function finish() {
      if (finished) return;
      if (mode === "snake") return;
      if (shuffleGen !== rollGeneration && !startingSnake) return;
      finished = true;
      window.clearTimeout(shuffleTimeout);
      shuffleTimeout = 0;
      startSnake();
    }

    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      if (isEggCell(cell)) {
        applyGlyph(cell, EGG_CHAR);
        continue;
      }
      pending += 1;
      var r = parseInt(cell.getAttribute("data-row"), 10) || 0;
      var c = parseInt(cell.getAttribute("data-col"), 10) || 0;
      var stagger = c * 8 + r * 6;
      var target = CHARSET.charAt(1 + Math.floor(Math.random() * 26));
      // Short shuffle burst — not a full alphabet lap
      rollTo(cell, target, stagger, false, 8).then(function () {
        pending -= 1;
        if (pending <= 0) finish();
      });
    }

    if (pending === 0) {
      finish();
      return;
    }

    shuffleTimeout = window.setTimeout(finish, reduceMotion.matches ? 120 : 900);
  }

  function startSnake() {
    if (mode === "snake") return;
    startingSnake = false;
    window.clearTimeout(shuffleTimeout);
    shuffleTimeout = 0;
    stopAllRolls();
    mode = "snake";
    snakeAlive = true;
    window.clearInterval(hintTimer);
    window.clearInterval(eggPulseTimer);
    window.clearInterval(cycleTimer);
    score = 0;
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    var midY = Math.floor(ROWS / 2);
    var midX = Math.floor(COLS / 2);
    snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ];
    food = randomEmpty();
    root.classList.add("solari--snake", "solari--egg");
    root.setAttribute("tabindex", "0");
    try {
      root.focus({ preventScroll: true });
    } catch (err) {
      root.focus();
    }
    renderSnake();
    window.clearInterval(snakeTimer);
    snakeTimer = window.setInterval(tickSnake, reduceMotion.matches ? 180 : 130);
  }

  function onPointerMove(e) {
    if (mode !== "board") return;
    var rect = root.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    var nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    var ny = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    highlightNear(nx, ny);

    var cell = e.target.closest(".solari-cell--egg");
    if (cell) {
      if (!eggHoverTimer) {
        eggHoverTimer = window.setTimeout(function () {
          cell.classList.add("is-egg-hint");
        }, 900);
      }
    } else {
      window.clearTimeout(eggHoverTimer);
      eggHoverTimer = 0;
      var hinted = root.querySelector(".is-egg-hint");
      if (hinted) hinted.classList.remove("is-egg-hint");
    }
  }

  function onPointerLeave() {
    clearHighlight();
    window.clearTimeout(eggHoverTimer);
    eggHoverTimer = 0;
  }

  function onClick(e) {
    var cell = e.target.closest(".solari-cell");
    if (!cell || !root.contains(cell)) return;
    e.preventDefault();
    e.stopPropagation();

    // Snake tile always wins, even mid-roll — shuffle then play
    if (isEggCell(cell) || cell.getAttribute("data-egg") === "snake") {
      shuffleThenStartSnake();
      return;
    }

    if (mode === "snake" || startingSnake) return;

    // Ignore clicks while the board is mid-cascade (except egg above)
    if (cell._rolling) return;

    if (e.detail >= 2) {
      phraseIndex = (phraseIndex + 1) % phrases.length;
      paintPhrases(phrases[phraseIndex], true);
      return;
    }

    var current = cell.getAttribute("data-char") || " ";
    rollTo(cell, nextCharsetChar(current), 0, false);
  }

  function onKeydown(e) {
    var key = e.key;

    // Allow starting snake from keyboard even while board is rolling
    if (mode !== "snake" && key && key.length === 1) {
      root._keyBuf = ((root._keyBuf || "") + key.toLowerCase()).slice(-8);
      if (root._keyBuf.indexOf("snake") !== -1) {
        root._keyBuf = "";
        e.preventDefault();
        shuffleThenStartSnake();
        return;
      }
    }

    if (mode !== "snake") return;

    var map = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      w: { x: 0, y: -1 },
      s: { x: 0, y: 1 },
      a: { x: -1, y: 0 },
      d: { x: 1, y: 0 },
      W: { x: 0, y: -1 },
      S: { x: 0, y: 1 },
      A: { x: -1, y: 0 },
      D: { x: 1, y: 0 },
    };
    if (key === "Escape") {
      e.preventDefault();
      stopSnake("");
      return;
    }
    if (map[key]) {
      e.preventDefault();
      var nd = map[key];
      // no instant reverse
      if (nd.x + dir.x === 0 && nd.y + dir.y === 0) return;
      nextDir = nd;
    }
  }

  buildGrid();
  paintPhrases(phrases[0], false);
  paintEgg(eggCell(), false);
  scheduleCycle();
  scheduleHints();
  scheduleEggPulse();

  root.addEventListener("pointermove", onPointerMove, { passive: true });
  root.addEventListener("pointerleave", onPointerLeave, { passive: true });
  root.addEventListener("click", onClick);
  window.addEventListener("keydown", onKeydown);

  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", scheduleCycle);
  } else if (typeof reduceMotion.addListener === "function") {
    reduceMotion.addListener(scheduleCycle);
  }
})();
