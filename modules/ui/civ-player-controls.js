'use strict';

window.CivPlayerControls = (() => {
  let steps = [];
  let index = 0;
  let timer = null;

  let playBtn, backBtn, forwardBtn, speedSlider, replayBtn, regenerateBtn;

  function showLayer() {
    if (!layerIsOn('toggleStates')) toggleStates();
  }

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
    if (layerIsOn('toggleStates')) drawStates();
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
    showLayer();
    pause();
    timer = setInterval(frame, Math.max(10, interval()));
    playBtn.classList.remove('icon-play');
    playBtn.classList.add('icon-pause');
  }

  function pause() {
    if (timer) clearInterval(timer);
    timer = null;
    playBtn.classList.remove('icon-pause');
    playBtn.classList.add('icon-play');
  }

  function togglePlay() {
    timer ? pause() : play();
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

  function rewind() {
    pause();
    while (index > 0) {
      index--;
      applyStep(index, false);
    }
    draw();
  }

  function replay() {
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
    const container = document.getElementById('civPlayerControls');
    if (!container) return;
    container.innerHTML = `
      <button id="civPlayPauseBtn" class="icon-play" data-tip="Play/Pause"></button>
      <button id="civStepBackBtn" data-tip="Step back">-1</button>
      <button id="civStepForwardBtn" data-tip="Step forward">+1</button>
      <span id="civSpeedLabel">Speed:<slider-input id="civSpeed" min="1" max="100" value="50"></slider-input></span>
      <button id="civReplayBtn" class="icon-cw" data-tip="Replay"></button>
      <button id="civRegenerateBtn" class="icon-arrows-cw" data-tip="Regenerate"></button>
    `;

    playBtn = byId('civPlayPauseBtn');
    backBtn = byId('civStepBackBtn');
    forwardBtn = byId('civStepForwardBtn');
    speedSlider = byId('civSpeed');
    replayBtn = byId('civReplayBtn');
    regenerateBtn = byId('civRegenerateBtn');

    playBtn.on('click', togglePlay);
    backBtn.on('click', stepBackward);
    forwardBtn.on('click', stepForward);
    replayBtn.on('click', replay);
    regenerateBtn.on('click', regenerate);
    speedSlider?.addEventListener('input', () => {
      if (timer) play();
    });
  }

  function start(growthSteps) {
    steps = growthSteps || [];
    index = 0;
    draw();
    if (steps.length) play();
  }

  return { init, start, play, pause, togglePlay };
})();

document.addEventListener('DOMContentLoaded', () => CivPlayerControls.init());
