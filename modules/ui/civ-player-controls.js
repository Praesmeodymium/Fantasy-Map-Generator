'use strict';

window.CivPlayerControls = (() => {
  let steps = [];
  let index = 0;
  let timer = null;
  let playing = false;

  function showLayer() {
    if (!layerIsOn('toggleStates')) toggleStates();
  }

  function play() {
    showLayer();
    pause();
    playing = true;
    const btn = byId('civPlayPauseBtn');
    btn.classList.remove('icon-play');
    btn.classList.add('icon-pause');
    timer = setInterval(frame, Math.max(10, interval()));
  }

  function pause() {
    playing = false;
    if (timer) clearInterval(timer);
    timer = null;
    const btn = byId('civPlayPauseBtn');
    btn.classList.remove('icon-pause');
    btn.classList.add('icon-play');
  }

  function togglePlay() {
    playing ? pause() : play();
  }

  function interval() {
    const slider = byId('civSpeed');
    const val = slider ? slider.valueAsNumber : 50;
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

  function start(growthSteps) {
    steps = growthSteps || [];
    index = 0;
    draw();
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
    container.style.display = 'block';
    byId('civPlayPauseBtn').on('click', togglePlay);
    byId('civStepBackBtn').on('click', stepBackward);
    byId('civStepForwardBtn').on('click', stepForward);
    byId('civReplayBtn').on('click', refresh);
    byId('civRegenerateBtn').on('click', regenerate);
    byId('civSpeed')?.addEventListener('input', () => {
      if (timer) play();
    });
  }

  return { init, play, pause, togglePlay, start };
})();

document.addEventListener('DOMContentLoaded', () => CivPlayerControls.init());
