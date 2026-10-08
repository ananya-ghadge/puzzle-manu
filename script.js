/* ============================================================
   Minute Cryptic
   Vanilla JS only. All puzzle content comes from clues.json.
   Sections below are labelled so you can find things later.
   ============================================================ */

/* ---------- 1. Settings ---------- */

var STORAGE_KEY = "minuteCrypticProgress";
var HINT_TYPES = ["fodder", "indicator", "definition"];

/* ---------- 2. Game state ---------- */

var data = null;          // the parsed clues.json object
var clueIndex = 0;        // which clue we are on (0 = first)
var solved = false;       // true = this clue is solved, show the reveal
var finished = false;     // true = show the final birthday screen
var revealedHints = [];   // hint types already used on the current clue
var typed = [];           // letters the player has typed (A–Z only)
var pattern = [];         // boxes for the current answer (letters / gaps / dashes)

/* ---------- 3. Grab the HTML elements we will update ---------- */

var el = {
  loadError: document.getElementById("load-error"),
  screenClue: document.getElementById("screen-clue"),
  screenReveal: document.getElementById("screen-reveal"),
  screenFinal: document.getElementById("screen-final"),
  clueProgress: document.getElementById("clue-progress"),
  clueText: document.getElementById("clue-text"),
  hintExtras: document.getElementById("hint-extras"),
  clueAuthor: document.getElementById("clue-author"),
  answerRow: document.getElementById("answer-row"),
  typeCatcher: document.getElementById("type-catcher"),
  btnHints: document.getElementById("btn-hints"),
  btnCheck: document.getElementById("btn-check"),
  hintMenu: document.getElementById("hint-menu"),
  btnHintClose: document.getElementById("btn-hint-close"),
  revealProgress: document.getElementById("reveal-progress"),
  revealClueText: document.getElementById("reveal-clue-text"),
  revealAuthor: document.getElementById("reveal-author"),
  revealAnswerRow: document.getElementById("reveal-answer-row"),
  revealImage: document.getElementById("reveal-image"),
  revealWriteup: document.getElementById("reveal-writeup"),
  btnNext: document.getElementById("btn-next"),
  finaleHeading: document.getElementById("finale-heading"),
  finaleMessage: document.getElementById("finale-message"),
  finaleBanner: document.getElementById("finale-banner"),
  finaleImage: document.getElementById("finale-image"),
  btnPlayAgain: document.getElementById("btn-play-again"),
  confirmModal: document.getElementById("confirm-modal"),
  btnConfirmYes: document.getElementById("btn-confirm-yes"),
  btnConfirmCancel: document.getElementById("btn-confirm-cancel")
};

/* ---------- 4. Start the game ---------- */

init();

function init() {
  handleResetQuery();

  fetch("clues.json")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("bad response");
      }
      return response.json();
    })
    .then(function (json) {
      if (!json || !Array.isArray(json.clues) || json.clues.length === 0) {
        throw new Error("malformed");
      }
      data = json;
      if (data.title) {
        document.title = data.title;
      }
      restoreProgress();
      render();
      bindEvents();
    })
    .catch(function () {
      showLoadError();
    });
}

function showLoadError() {
  el.loadError.hidden = false;
  el.screenClue.hidden = true;
  el.screenReveal.hidden = true;
  el.screenFinal.hidden = true;
}

/* Visiting with ?reset=true wipes save data, then tidies the URL. */
function handleResetQuery() {
  var params = new URLSearchParams(window.location.search);
  if (params.get("reset") !== "true") {
    return;
  }
  clearSave();
  params.delete("reset");
  var query = params.toString();
  var next = window.location.pathname + (query ? "?" + query : "") + window.location.hash;
  window.history.replaceState({}, "", next);
}

/* ---------- 5. Saving and loading progress ---------- */

function loadSave() {
  try {
    var raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function writeSave() {
  var payload = {
    clueIndex: clueIndex,
    solved: solved,
    finished: finished,
    revealedHints: revealedHints.slice()
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    /* Storage can be blocked (private mode, etc). The game still works. */
  }
}

function clearSave() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    /* ignore */
  }
}

function restoreProgress() {
  var saved = loadSave();
  var fresh = {
    clueIndex: 0,
    solved: false,
    finished: false,
    revealedHints: []
  };

  if (!saved || typeof saved !== "object") {
    applySnapshot(fresh);
    return;
  }

  var index = saved.clueIndex;
  var hints = Array.isArray(saved.revealedHints) ? saved.revealedHints : [];
  var total = data.clues.length;

  /* Corrupted or outdated save (e.g. fewer clues than last time) → start fresh */
  if (typeof index !== "number" || index < 0 || index >= total) {
    if (saved.finished === true) {
      applySnapshot({
        clueIndex: total - 1,
        solved: true,
        finished: true,
        revealedHints: []
      });
      return;
    }
    applySnapshot(fresh);
    return;
  }

  applySnapshot({
    clueIndex: index,
    solved: saved.solved === true,
    finished: saved.finished === true,
    revealedHints: hints.filter(function (name) {
      return HINT_TYPES.indexOf(name) !== -1;
    })
  });
}

function applySnapshot(snapshot) {
  clueIndex = snapshot.clueIndex;
  solved = snapshot.solved;
  finished = snapshot.finished;
  revealedHints = snapshot.revealedHints.slice();
  typed = [];
  pattern = buildPattern(currentClue().answer);
}

function currentClue() {
  return data.clues[clueIndex];
}

/* ---------- 6. Answer pattern (letters, word gaps, hyphens) ---------- */

function buildPattern(answer) {
  var tokens = [];
  var words = String(answer || "").trim().split(/\s+/);
  words.forEach(function (word, wordIndex) {
    if (wordIndex > 0) {
      tokens.push({ type: "gap" });
    }
    var bits = word.split("-");
    bits.forEach(function (bit, bitIndex) {
      if (bitIndex > 0) {
        tokens.push({ type: "dash" });
      }
      for (var i = 0; i < bit.length; i++) {
        var ch = bit.charAt(i);
        if (/[a-zA-Z]/.test(ch)) {
          tokens.push({ type: "letter", expected: ch.toUpperCase() });
        }
      }
    });
  });
  return tokens;
}

function letterSlots() {
  return pattern.filter(function (token) {
    return token.type === "letter";
  });
}

function expectedLetters() {
  return letterSlots()
    .map(function (token) {
      return token.expected;
    })
    .join("");
}

/* ---------- 7. Drawing the screens ---------- */

function render() {
  if (finished) {
    renderFinal();
    showScreen("screen-final");
    return;
  }
  if (solved) {
    renderReveal();
    showScreen("screen-reveal");
    return;
  }
  renderClue();
  showScreen("screen-clue");
  focusTyper();
}

function showScreen(id) {
  var screens = [el.screenClue, el.screenReveal, el.screenFinal];
  screens.forEach(function (screen) {
    var on = screen.id === id;
    screen.hidden = !on;
    screen.classList.remove("is-visible");
    if (on) {
      /* Next frame so the CSS fade actually runs */
      requestAnimationFrame(function () {
        screen.classList.add("is-visible");
      });
    }
  });
}

function progressLabel() {
  var n = clueIndex + 1;
  var total = data.clues.length;
  var padded = n < 10 ? "0" + n : String(n);
  return "Clue " + padded + " of " + total;
}

function setAuthor(node) {
  node.textContent = data.author || "";
  node.hidden = !data.author;
}

function renderClue() {
  var clue = currentClue();
  el.clueProgress.textContent = progressLabel();
  el.clueText.innerHTML = highlightClue(clue.clue, clue.hints, revealedHints);
  renderHintExtras(clue);
  setAuthor(el.clueAuthor);
  drawAnswerRow(el.answerRow, typed, true);
  updateHintMenu();
  closeHintMenu();
}

function renderReveal() {
  var clue = currentClue();
  var filled = expectedLetters().split("");
  el.revealProgress.textContent = progressLabel();
  el.revealClueText.textContent = clue.clue;
  setAuthor(el.revealAuthor);
  drawAnswerRow(el.revealAnswerRow, filled, false);
  setPhoto(el.revealImage, clue.reveal && clue.reveal.image);
  el.revealWriteup.textContent = (clue.reveal && clue.reveal.writeup) || "";
}

function renderFinal() {
  var finale = data.finale || {};
  el.finaleHeading.textContent = finale.heading || "Happy Birthday!";
  el.finaleMessage.textContent = finale.message || "";
  drawBanner(finale.banner || "HAPPY BIRTHDAY");
  setPhoto(el.finaleImage, finale.image);
}

function setPhoto(img, src) {
  img.hidden = true;
  img.removeAttribute("src");
  if (!src) {
    return;
  }
  img.onload = function () {
    img.hidden = false;
  };
  img.onerror = function () {
    img.hidden = true;
    img.removeAttribute("src");
  };
  img.src = src;
}

/* Draw letter boxes. Gaps between words and dashes are automatic. */
function drawAnswerRow(row, letters, showCursor) {
  row.innerHTML = "";
  row.classList.remove("shake");

  var letterIndex = 0;
  var word = null;

  function startWord() {
    word = document.createElement("div");
    word.className = "word";
    row.appendChild(word);
  }

  pattern.forEach(function (token) {
    if (token.type === "gap") {
      word = null;
      return;
    }
    if (token.type === "dash") {
      word = null;
      var dash = document.createElement("span");
      dash.className = "hyphen";
      dash.textContent = "–";
      row.appendChild(dash);
      return;
    }
    if (!word) {
      startWord();
    }
    var cell = document.createElement("span");
    cell.className = "cell";
    var value = letters[letterIndex] || "";
    cell.textContent = value;
    if (showCursor && letterIndex === letters.length) {
      cell.classList.add("current");
    }
    word.appendChild(cell);
    letterIndex += 1;
  });
}

function drawBanner(text) {
  el.finaleBanner.innerHTML = "";
  var words = String(text).toUpperCase().split(/\s+/);
  words.forEach(function (word) {
    var group = document.createElement("div");
    group.className = "word";
    for (var i = 0; i < word.length; i++) {
      if (!/[A-Z]/.test(word.charAt(i))) {
        continue;
      }
      var cell = document.createElement("span");
      cell.className = "cell";
      cell.textContent = word.charAt(i).toLowerCase();
      group.appendChild(cell);
    }
    el.finaleBanner.appendChild(group);
  });
}

/* ---------- 8. Hints ---------- */

function snippetsFor(hint) {
  if (!hint || hint.highlight == null || hint.highlight === "") {
    return [];
  }
  if (Array.isArray(hint.highlight)) {
    return hint.highlight;
  }
  return [hint.highlight];
}

/* Find a snippet in the clue. Prefer a whole-word match so that
   highlight "A" lights up the letter A, not the "a" inside "an". */
function findSnippetIndex(haystack, snippet) {
  var needle = String(snippet);
  if (!needle) {
    return -1;
  }
  var escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var re = new RegExp("(^|[^A-Za-z])(" + escaped + ")(?![A-Za-z])", "i");
  var match = haystack.match(re);
  if (match) {
    return match.index + match[1].length;
  }
  return haystack.toLowerCase().indexOf(needle.toLowerCase());
}

function highlightClue(text, hints, types) {
  var ranges = [];
  types.forEach(function (type) {
    var hint = hints && hints[type];
    snippetsFor(hint).forEach(function (snippet) {
      var start = findSnippetIndex(text, snippet);
      if (start === -1) {
        console.warn(
          'Could not find highlight "' + snippet + '" in clue:',
          text
        );
        return;
      }
      ranges.push({ start: start, end: start + String(snippet).length, type: type });
    });
  });

  ranges.sort(function (a, b) {
    return a.start - b.start || b.end - a.end;
  });

  var used = [];
  ranges.forEach(function (range) {
    var overlaps = used.some(function (other) {
      return range.start < other.end && range.end > other.start;
    });
    if (!overlaps) {
      used.push(range);
    }
  });

  var html = "";
  var cursor = 0;
  used.forEach(function (range) {
    html += escapeHtml(text.slice(cursor, range.start));
    html += '<mark class="hl-' + range.type + '">';
    html += escapeHtml(text.slice(range.start, range.end));
    html += "</mark>";
    cursor = range.end;
  });
  html += escapeHtml(text.slice(cursor));
  return html;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHintExtras(clue) {
  el.hintExtras.innerHTML = "";
  revealedHints.forEach(function (type) {
    var hint = clue.hints && clue.hints[type];
    if (!hint || !hint.text) {
      return;
    }
    var line = document.createElement("p");
    line.className = "hint-extra " + type;
    line.textContent = hint.text;
    el.hintExtras.appendChild(line);
  });
}

function updateHintMenu() {
  var buttons = el.hintMenu.querySelectorAll(".hint-option");
  buttons.forEach(function (button) {
    var type = button.getAttribute("data-hint");
    if (revealedHints.indexOf(type) !== -1) {
      button.classList.add("used");
    } else {
      button.classList.remove("used");
    }
  });
}

function openHintMenu() {
  el.hintMenu.hidden = false;
  el.screenClue.classList.add("menu-open");
}

function closeHintMenu() {
  el.hintMenu.hidden = true;
  el.screenClue.classList.remove("menu-open");
}

function revealHint(type) {
  if (HINT_TYPES.indexOf(type) === -1) {
    return;
  }
  if (revealedHints.indexOf(type) === -1) {
    revealedHints.push(type);
    writeSave();
  }
  var clue = currentClue();
  el.clueText.innerHTML = highlightClue(clue.clue, clue.hints, revealedHints);
  renderHintExtras(clue);
  updateHintMenu();
}

/* ---------- 9. Typing and checking ---------- */

function focusTyper() {
  try {
    el.typeCatcher.focus({ preventScroll: true });
  } catch (err) {
    el.typeCatcher.focus();
  }
}

function handleTypedLetter(letter) {
  if (finished || solved) {
    return;
  }
  if (typed.length >= letterSlots().length) {
    return;
  }
  typed.push(letter.toUpperCase());
  drawAnswerRow(el.answerRow, typed, true);
}

function handleBackspace() {
  if (finished || solved) {
    return;
  }
  if (typed.length === 0) {
    return;
  }
  typed.pop();
  drawAnswerRow(el.answerRow, typed, true);
}

function checkAnswer() {
  if (finished || solved) {
    return;
  }
  var guess = typed.join("");
  var answer = expectedLetters();
  if (guess === answer) {
    solved = true;
    writeSave();
    render();
    return;
  }
  shakeBoxes();
}

function shakeBoxes() {
  el.answerRow.classList.remove("shake");
  /* Force the browser to notice the class was removed so the animation
     can play again even if the last guess was also wrong. */
  void el.answerRow.offsetWidth;
  el.answerRow.classList.add("shake");
}

function goNext() {
  if (clueIndex >= data.clues.length - 1) {
    finished = true;
    writeSave();
    render();
    return;
  }
  clueIndex += 1;
  solved = false;
  revealedHints = [];
  typed = [];
  pattern = buildPattern(currentClue().answer);
  writeSave();
  render();
}

function startOver() {
  clearSave();
  clueIndex = 0;
  solved = false;
  finished = false;
  revealedHints = [];
  typed = [];
  pattern = buildPattern(currentClue().answer);
  hideConfirm();
  render();
}

/* ---------- 10. Events ---------- */

function bindEvents() {
  el.btnHints.addEventListener("click", function () {
    if (el.hintMenu.hidden) {
      openHintMenu();
    } else {
      closeHintMenu();
    }
  });

  el.btnHintClose.addEventListener("click", closeHintMenu);

  el.hintMenu.addEventListener("click", function (event) {
    var button = event.target.closest(".hint-option");
    if (!button) {
      return;
    }
    revealHint(button.getAttribute("data-hint"));
  });

  el.btnCheck.addEventListener("click", checkAnswer);
  el.btnNext.addEventListener("click", goNext);
  el.btnPlayAgain.addEventListener("click", showConfirm);
  el.btnConfirmYes.addEventListener("click", startOver);
  el.btnConfirmCancel.addEventListener("click", hideConfirm);

  el.answerRow.addEventListener("click", focusTyper);

  /* Typing: listen on the whole page so he does not have to click first. */
  document.addEventListener("keydown", function (event) {
    if (!el.confirmModal.hidden) {
      if (event.key === "Escape") {
        hideConfirm();
      }
      return;
    }

    if (event.key === "Escape") {
      closeHintMenu();
    }

    if (finished || solved) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      checkAnswer();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      handleBackspace();
      return;
    }

    if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
      event.preventDefault();
      handleTypedLetter(event.key);
    }
  });

  /* Extra path for phones: letters arriving in the hidden input */
  el.typeCatcher.addEventListener("input", function () {
    var value = el.typeCatcher.value;
    el.typeCatcher.value = "";
    for (var i = 0; i < value.length; i++) {
      var ch = value.charAt(i);
      if (/[a-zA-Z]/.test(ch)) {
        handleTypedLetter(ch);
      }
    }
  });

  document.addEventListener("click", function (event) {
    if (el.hintMenu.hidden) {
      return;
    }
    if (el.hintMenu.contains(event.target) || el.btnHints.contains(event.target)) {
      return;
    }
    closeHintMenu();
  });
}

function showConfirm() {
  el.confirmModal.hidden = false;
}

function hideConfirm() {
  el.confirmModal.hidden = true;
}
