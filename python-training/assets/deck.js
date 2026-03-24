(function () {
  var slides = Array.from(document.querySelectorAll(".slide"));
  var counter = document.getElementById("deck-counter");
  var progressBar = document.getElementById("deck-progress-fill");
  var timerEl = document.getElementById("deck-timer");
  var current = 0;
  var timer = null;

  function getFragments(s) { return Array.from(s.querySelectorAll(".fragment")); }

  function resetFragments(s) {
    getFragments(s).forEach(function (f) { f.classList.remove("visible"); });
    s.dataset.fi = "0";
  }

  function revealNext(s) {
    var frags = getFragments(s);
    var i = Number(s.dataset.fi || 0);
    if (i >= frags.length) return false;
    frags[i].classList.add("visible");
    s.dataset.fi = String(i + 1);
    return true;
  }

  function hideLast(s) {
    var frags = getFragments(s);
    var i = Number(s.dataset.fi || 0);
    if (i <= 0) return false;
    frags[i - 1].classList.remove("visible");
    s.dataset.fi = String(i - 1);
    return true;
  }

  function go(index, reset) {
    if (index < 0 || index >= slides.length) return;
    slides[current].classList.remove("active");
    current = index;
    slides[current].classList.add("active");
    if (reset !== false) resetFragments(slides[current]);
    counter.textContent = (current + 1) + " / " + slides.length;
    progressBar.style.width = ((current + 1) / slides.length * 100) + "%";
    history.replaceState(null, "", "#" + slides[current].id);
    try { localStorage.setItem("pt-slide", String(current)); } catch (e) {}
  }

  function next() {
    if (revealNext(slides[current])) return;
    go(Math.min(current + 1, slides.length - 1));
  }

  function prev() {
    if (hideLast(slides[current])) return;
    go(Math.max(current - 1, 0), false);
  }

  function fmtTime(sec) {
    var m = String(Math.floor(sec / 60)).padStart(2, "0");
    var s = String(sec % 60).padStart(2, "0");
    return m + ":" + s;
  }

  function clearTimer() {
    if (timer) { clearInterval(timer.id); timer = null; }
    timerEl.textContent = "";
    timerEl.className = "deck-timer";
    document.querySelectorAll(".timer-btn").forEach(function (b) {
      b.classList.remove("running");
      b.textContent = b.dataset.label || "Start timer";
    });
  }

  function startTimer(btn, mins) {
    clearTimer();
    var total = mins * 60;
    var start = Date.now();
    btn.classList.add("running");
    timerEl.className = "deck-timer running";
    var tick = function () {
      var left = total - Math.floor((Date.now() - start) / 1000);
      if (left <= 0) {
        timerEl.textContent = "00:00";
        timerEl.className = "deck-timer expired";
        btn.classList.remove("running");
        btn.textContent = "Done";
        clearInterval(timer.id);
        timer = null;
        return;
      }
      timerEl.textContent = fmtTime(left);
      btn.textContent = fmtTime(left);
    };
    timerEl.textContent = fmtTime(total);
    timer = { id: setInterval(tick, 1000) };
  }

  document.querySelectorAll(".timer-btn").forEach(function (btn) {
    btn.dataset.label = btn.textContent;
    btn.addEventListener("click", function () {
      startTimer(btn, Number(btn.dataset.minutes));
    });
  });

  document.addEventListener("keydown", function (e) {
    var tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    switch (e.key) {
      case "ArrowRight": case " ": case "PageDown":
        e.preventDefault(); next(); break;
      case "ArrowLeft": case "PageUp":
        e.preventDefault(); prev(); break;
      case "Home": e.preventDefault(); go(0); break;
      case "End":  e.preventDefault(); go(slides.length - 1); break;
      case "t": case "T": e.preventDefault(); clearTimer(); break;
    }
  });

  document.addEventListener("click", function (e) {
    var deck = document.querySelector(".deck");
    if (!deck.contains(e.target)) return;
    if (e.target.closest("button, a, pre, code, .exercise-card")) return;
    var rect = deck.getBoundingClientRect();
    if (e.clientX > rect.left + rect.width * 0.65) next();
  });

  slides.forEach(resetFragments);

  var hash = location.hash.replace("#", "");
  var startIdx = slides.findIndex(function (s) { return s.id === hash; });
  if (startIdx < 0) {
    try { startIdx = Number(localStorage.getItem("pt-slide")) || 0; } catch (e) { startIdx = 0; }
  }

  slides[0].classList.add("active");
  go(Math.max(0, Math.min(startIdx, slides.length - 1)));
})();
