(function () {
  var slides = Array.from(document.querySelectorAll(".slide"));
  var deck = document.querySelector(".deck");
  var counter = document.getElementById("deck-counter");
  var progressBar = document.getElementById("deck-progress-fill");
  var timerEl = document.getElementById("deck-timer");
  var current = 0;
  var timer = null;

  function getSlideTitle(slide) {
    var heading = slide.querySelector("h1, h2, h3");
    return heading ? heading.textContent.trim() : slide.id;
  }

  function getSlideEyebrow(slide) {
    var eyebrow = slide.querySelector(".eyebrow");
    return eyebrow ? eyebrow.textContent.trim() : "";
  }

  function emitSlidesManifest() {
    if (!window.parent || window.parent === window) return;
    window.parent.postMessage({
      type: "python-training:slides",
      slides: slides.map(function (slide, index) {
        return {
          id: slide.id,
          index: index,
          title: getSlideTitle(slide),
          eyebrow: getSlideEyebrow(slide)
        };
      })
    }, "*");
  }

  function emitState() {
    if (!window.parent || window.parent === window) return;
    var slide = slides[current];
    window.parent.postMessage({
      type: "python-training:state",
      slideId: slide.id,
      slideIndex: current,
      totalSlides: slides.length,
      title: getSlideTitle(slide),
      eyebrow: getSlideEyebrow(slide),
      fragmentIndex: Number(slide.dataset.fi || 0),
      fragmentCount: getFragments(slide).length
    }, "*");
  }

  function getFragments(s) { return Array.from(s.querySelectorAll(".fragment")); }

  function isProminentSlideNumberDeck() {
    return Boolean(deck && deck.dataset.prominentSlideNumber === "true");
  }

  function injectSlideHeaders() {
    if (!isProminentSlideNumberDeck()) return;

    slides.forEach(function (slide, index) {
      if (slide.querySelector(".slide-header")) return;

      var header = document.createElement("div");
      header.className = "slide-header";

      var numberBlock = document.createElement("div");
      numberBlock.className = "slide-number-badge";
      numberBlock.innerHTML =
        '<span class="slide-number-label">Slide</span>' +
        '<span class="slide-number-value">' + String(index + 1) + '</span>' +
        '<span class="slide-number-total">of ' + String(slides.length) + '</span>';

      header.appendChild(numberBlock);

      var eyebrow = slide.querySelector(".eyebrow");
      if (eyebrow) {
        header.appendChild(eyebrow);
      }

      slide.insertBefore(header, slide.firstChild);
    });
  }

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
    if (counter) counter.textContent = (current + 1) + " / " + slides.length;
    if (progressBar) progressBar.style.width = ((current + 1) / slides.length * 100) + "%";
    history.replaceState(null, "", "#" + slides[current].id);
    try { localStorage.setItem("pt-slide", String(current)); } catch (e) {}
    emitState();
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
    if (!timerEl) return;
    timerEl.textContent = "";
    timerEl.className = "deck-timer";
    document.querySelectorAll(".timer-btn").forEach(function (b) {
      b.classList.remove("running");
      b.textContent = b.dataset.label || "Start timer";
    });
  }

  function startTimer(btn, mins) {
    if (!timerEl) return;
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
    if (!deck || !deck.contains(e.target)) return;
    if (e.target.closest("button, a, pre, code, .exercise-card")) return;
    var rect = deck.getBoundingClientRect();
    if (e.clientX > rect.left + rect.width * 0.65) next();
  });

  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "python-training:command") return;
    if (event.data.command === "next") next();
    if (event.data.command === "prev") prev();
    if (event.data.command === "clear-timer") clearTimer();
    if (event.data.command === "goToSlide") {
      if (typeof event.data.slideId === "string") {
        var idx = slides.findIndex(function (slide) { return slide.id === event.data.slideId; });
        if (idx >= 0) go(idx);
      }
      if (typeof event.data.slideIndex === "number") {
        go(event.data.slideIndex);
      }
    }
  });

  injectSlideHeaders();
  slides.forEach(resetFragments);

  var hash = location.hash.replace("#", "");
  var startIdx = slides.findIndex(function (s) { return s.id === hash; });
  if (startIdx < 0) {
    try { startIdx = Number(localStorage.getItem("pt-slide")) || 0; } catch (e) { startIdx = 0; }
  }

  slides[0].classList.add("active");
  emitSlidesManifest();
  go(Math.max(0, Math.min(startIdx, slides.length - 1)));
})();
