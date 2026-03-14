(function () {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const jumpList = document.getElementById("jump-list");
  const currentLabel = document.getElementById("current-label");
  const currentCounter = document.getElementById("current-counter");
  const progressFill = document.getElementById("progress-fill");
  const prevButton = document.getElementById("prev-slide");
  const nextButton = document.getElementById("next-slide");
  const notesButton = document.getElementById("toggle-notes");
  const overviewButton = document.getElementById("toggle-overview");
  const sidebar = document.querySelector(".sidebar");
  const day1Fill = document.getElementById("day1-fill");
  const day2Fill = document.getElementById("day2-fill");
  const day3Fill = document.getElementById("day3-fill");
  const timerDisplay = document.getElementById("session-timer");
  const timerLabel = document.getElementById("timer-status");

  let currentSlide = 0;
  let notesVisible = false;
  let overviewVisible = true;
  let activeTimer = null;

  const slideMeta = slides.map((slide, index) => ({
    id: slide.id,
    index,
    title: slide.dataset.title || slide.querySelector("h2")?.textContent || `Slide ${index + 1}`,
    day: Number(slide.dataset.day || 0),
    type: slide.dataset.type || "Concept",
  }));

  function parseHash() {
    const hash = window.location.hash.replace("#", "").trim();
    if (!hash) {
      return null;
    }
    const directIndex = slideMeta.findIndex((slide) => slide.id === hash);
    return directIndex >= 0 ? directIndex : null;
  }

  function buildJumpList() {
    const fragment = document.createDocumentFragment();
    slideMeta.forEach((slide) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "jump-button";
      button.dataset.index = String(slide.index);
      button.innerHTML = `
        <span class="slide-number">${slide.index + 1}</span>
        <span class="slide-title">${slide.title}</span>
      `;
      button.addEventListener("click", () => goToSlide(slide.index));
      fragment.appendChild(button);
    });
    jumpList.appendChild(fragment);
  }

  function getFragments(slide) {
    return Array.from(slide.querySelectorAll(".fragment"));
  }

  function resetFragments(slide) {
    getFragments(slide).forEach((fragment) => fragment.classList.remove("visible"));
    slide.dataset.fragmentIndex = "0";
  }

  function revealNextFragment(slide) {
    const fragments = getFragments(slide);
    const currentIndex = Number(slide.dataset.fragmentIndex || 0);
    if (currentIndex >= fragments.length) {
      return false;
    }
    fragments[currentIndex].classList.add("visible");
    slide.dataset.fragmentIndex = String(currentIndex + 1);
    return true;
  }

  function hideLastFragment(slide) {
    const fragments = getFragments(slide);
    const currentIndex = Number(slide.dataset.fragmentIndex || 0);
    if (currentIndex <= 0) {
      return false;
    }
    fragments[currentIndex - 1].classList.remove("visible");
    slide.dataset.fragmentIndex = String(currentIndex - 1);
    return true;
  }

  function updateSidebarButtons() {
    const buttons = jumpList.querySelectorAll(".jump-button");
    buttons.forEach((button) => {
      const index = Number(button.dataset.index);
      button.classList.toggle("active", index === currentSlide);
    });
  }

  function updateProgress() {
    const total = slides.length;
    currentCounter.textContent = `${currentSlide + 1} / ${total}`;
    currentLabel.textContent = slideMeta[currentSlide].title;
    progressFill.style.width = `${((currentSlide + 1) / total) * 100}%`;

    const dayProgress = { 1: 0, 2: 0, 3: 0 };
    const dayTotals = { 1: 0, 2: 0, 3: 0 };

    slideMeta.forEach((meta, index) => {
      if (!dayTotals[meta.day]) {
        return;
      }
      dayTotals[meta.day] += 1;
      if (index <= currentSlide) {
        dayProgress[meta.day] += 1;
      }
    });

    day1Fill.style.width = `${(dayProgress[1] / dayTotals[1]) * 100}%`;
    day2Fill.style.width = `${(dayProgress[2] / dayTotals[2]) * 100}%`;
    day3Fill.style.width = `${(dayProgress[3] / dayTotals[3]) * 100}%`;
  }

  function updateControls() {
    prevButton.disabled = currentSlide === 0;
    nextButton.disabled = currentSlide === slides.length - 1 && !getFragments(slides[currentSlide]).length;
    notesButton.classList.toggle("toggle-on", notesVisible);
    overviewButton.classList.toggle("toggle-on", overviewVisible);
  }

  function syncHash() {
    const id = slideMeta[currentSlide].id;
    if (window.location.hash !== `#${id}`) {
      history.replaceState(null, "", `#${id}`);
    }
  }

  function goToSlide(index, reset = true) {
    if (index < 0 || index >= slides.length) {
      return;
    }
    slides[currentSlide].classList.remove("active");
    currentSlide = index;
    slides[currentSlide].classList.add("active");
    if (reset) {
      resetFragments(slides[currentSlide]);
    }
    updateSidebarButtons();
    updateProgress();
    updateControls();
    syncHash();
  }

  function nextStep() {
    const slide = slides[currentSlide];
    if (revealNextFragment(slide)) {
      return;
    }
    goToSlide(Math.min(currentSlide + 1, slides.length - 1));
  }

  function previousStep() {
    const slide = slides[currentSlide];
    if (hideLastFragment(slide)) {
      return;
    }
    goToSlide(Math.max(currentSlide - 1, 0), false);
  }

  function setNotesVisibility(visible) {
    notesVisible = visible;
    document.body.classList.toggle("notes-visible", notesVisible);
    updateControls();
  }

  function setOverviewVisibility(visible) {
    overviewVisible = visible;
    sidebar.style.display = overviewVisible ? "" : "none";
    updateControls();
  }

  function formatTimer(secondsLeft) {
    const minutes = Math.floor(secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(secondsLeft % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function clearTimer() {
    if (activeTimer) {
      clearInterval(activeTimer.intervalId);
      activeTimer = null;
    }
    timerDisplay.textContent = "No timer";
    timerDisplay.classList.remove("running", "expired");
    timerLabel.textContent = "Ready for live facilitation";
    document.querySelectorAll(".timer-button").forEach((button) => {
      button.classList.remove("active");
      button.textContent = button.dataset.defaultLabel || "Start timer";
    });
  }

  function startTimer(button, minutes) {
    clearTimer();
    const totalSeconds = Number(minutes) * 60;
    const startedAt = Date.now();
    timerLabel.textContent = `Running ${minutes}-minute activity`;
    timerDisplay.classList.add("running");
    button.classList.add("active");

    const update = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = totalSeconds - elapsed;
      if (remaining <= 0) {
        timerDisplay.textContent = "00:00";
        timerDisplay.classList.remove("running");
        timerDisplay.classList.add("expired");
        timerLabel.textContent = "Activity time is up";
        button.classList.remove("active");
        button.textContent = "Restart timer";
        clearInterval(activeTimer.intervalId);
        activeTimer = null;
        return;
      }
      timerDisplay.textContent = formatTimer(remaining);
      button.textContent = `Running ${formatTimer(remaining)}`;
    };

    timerDisplay.textContent = formatTimer(totalSeconds);
    activeTimer = {
      intervalId: window.setInterval(update, 1000),
      button,
    };
  }

  function bindTimers() {
    document.querySelectorAll(".timer-button").forEach((button) => {
      button.dataset.defaultLabel = button.textContent;
      button.addEventListener("click", () => {
        const minutes = button.dataset.minutes;
        if (!minutes) {
          return;
        }
        startTimer(button, minutes);
      });
    });
  }

  function bindPolls() {
    document.querySelectorAll(".poll-card").forEach((card) => {
      const reveal = card.querySelector("[data-reveal-answer]");
      card.querySelectorAll(".poll-option").forEach((option) => {
        option.addEventListener("click", () => {
          card.querySelectorAll(".poll-option").forEach((button) => {
            button.classList.remove("selected");
          });
          option.classList.add("selected");
        });
      });
      reveal?.addEventListener("click", () => {
        card.classList.toggle("revealed");
      });
    });
  }

  function bindKeyboard() {
    document.addEventListener("keydown", (event) => {
      const tagName = event.target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea") {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          event.preventDefault();
          nextStep();
          break;
        case "ArrowLeft":
        case "PageUp":
          event.preventDefault();
          previousStep();
          break;
        case "Home":
          event.preventDefault();
          goToSlide(0);
          break;
        case "End":
          event.preventDefault();
          goToSlide(slides.length - 1);
          break;
        case "n":
        case "N":
          event.preventDefault();
          setNotesVisibility(!notesVisible);
          break;
        case "o":
        case "O":
          event.preventDefault();
          setOverviewVisibility(!overviewVisible);
          break;
        case "t":
        case "T":
          event.preventDefault();
          clearTimer();
          break;
        default:
          break;
      }
    });
  }

  prevButton.addEventListener("click", previousStep);
  nextButton.addEventListener("click", nextStep);
  notesButton.addEventListener("click", () => setNotesVisibility(!notesVisible));
  overviewButton.addEventListener("click", () => setOverviewVisibility(!overviewVisible));

  buildJumpList();
  bindTimers();
  bindPolls();
  bindKeyboard();
  slides.forEach(resetFragments);

  const hashIndex = parseHash();
  slides[0].classList.add("active");
  goToSlide(hashIndex ?? 0);
  clearTimer();
})();
