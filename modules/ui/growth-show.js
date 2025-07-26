"use strict";

window.GrowthShowUI = (() => {
  let steps = [];
  let index = 0;
  let timer = null;

  const playBtn = byId("growthPlayBtn");
  const pauseBtn = byId("growthPauseBtn");
  const backBtn = byId("growthBackBtn");
  const forwardBtn = byId("growthForwardBtn");
  const rewindBtn = byId("growthRewindBtn");
  const refreshBtn = byId("growthRefreshBtn");
  const regenerateBtn = byId("growthRegenerateBtn");
  const speedSlider = byId("growthShowSpeed");

  function interval() {
    const val = speedSlider ? speedSlider.valueAsNumber : 100;
    const total = 30 - (val / 100) * (30 - 0.1);
    return steps.length ? (total * 1000) / steps.length : 0;
  }

  function applyStep(i, forward = true) {
    const step = steps[i];
    if (!step) return;
    pack.cells.state[step.cell] = forward ? step.to : step.from;
  }

  function draw() {
    if (layerIsOn("toggleStates")) drawStates();
  }

  function frame() {
    if (index >= steps.length) {
      pause();
      return;
    }
    applyStep(index, true);
    index++;
    draw();
  }

  function play() {
    pause();
    timer = setInterval(frame, Math.max(10, interval()));
  }

  function pause() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function rewind() {
    pause();
    while (index > 0) {
      index--;
      applyStep(index, false);
    }
    draw();
  }

  function stepForward() {
    pause();
    if (index < steps.length) {
      applyStep(index, true);
      index++;
      draw();
    }
  }

  function stepBackward() {
    pause();
    if (index > 0) {
      index--;
      applyStep(index, false);
      draw();
    }
  }

  function refresh() {
    rewind();
    play();
  }

  function regenerate() {
    pause();
    steps = BurgsAndStates.expandStatesWithSteps();
    index = 0;
    draw();
    play();
  }

  function init() {
    playBtn?.on("click", play);
    pauseBtn?.on("click", pause);
    backBtn?.on("click", stepBackward);
    forwardBtn?.on("click", stepForward);
    rewindBtn?.on("click", rewind);
    refreshBtn?.on("click", refresh);
    regenerateBtn?.on("click", regenerate);
    speedSlider?.addEventListener("input", () => {
      if (timer) play();
    });
  }

  function start(growthSteps) {
    steps = growthSteps || [];
    index = 0;
    draw();
    if (steps.length) play();
  }

  return {init, start};
})();

document.addEventListener("DOMContentLoaded", () => GrowthShowUI.init());
