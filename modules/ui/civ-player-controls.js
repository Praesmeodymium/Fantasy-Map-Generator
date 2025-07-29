'use strict';

window.CivPlayerControls = (() => {
  let steps = [];
  let resourceSteps = [];
  let resourceMap = {};
  let index = 0;
  let timer = null;
  let playing = false;
  let counterEl = null;
  let initialStates = null;

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

  function updateCounter() {
    if (counterEl) counterEl.textContent = `${index} / ${steps.length}`;
  }

  function applyStep(i, forward = true) {
    const step = steps[i];
    if (!step) return;
    pack.cells.state[step.cell] = forward ? step.to : step.from;
  }

  function applyResources(i, forward = true) {
    const ids = resourceMap[i];
    if (!ids) return;
    ids.forEach(id => {
      const deposit = pack.resources.find(r => r.i === id);
      if (!deposit) return;
      forward ? Resources.discoverDeposit(deposit) : Resources.hideDeposit(deposit);
    });
  }

  function resetToInitial() {
    if (initialStates) pack.cells.state.set(initialStates);
    index = 0;
    Object.values(resourceMap).flat().forEach(id => {
      const deposit = pack.resources.find(r => r.i === id);
      if (deposit) Resources.hideDeposit(deposit);
    });
    applyResources(0, true);
  }

  function draw() {
    if (layerIsOn('toggleStates')) drawStates();
    if (layerIsOn('toggleResources')) drawResources();
    updateCounter();
  }

  function frame() {
    if (index >= steps.length) {
      pause();
      return;
    }
    applyStep(index, true);
    index++;
    applyResources(index, true);
    draw();
  }

  function start(growthSteps) {
    if (growthSteps && growthSteps.steps) {
      steps = growthSteps.steps;
      initialStates = growthSteps.initialStates || null;
      resourceSteps = growthSteps.resourceSteps || [];
    } else {
      steps = growthSteps || [];
      initialStates = null;
      resourceSteps = [];
    }
    resourceMap = resourceSteps.reduce((m, r) => {
      if (!m[r.step]) m[r.step] = [];
      m[r.step].push(r.id);
      return m;
    }, {});
    resetToInitial();
    draw();
  }

  function rewind() {
    pause();
    resetToInitial();
    draw();
  }

  function stepForward() {
    pause();
    if (index < steps.length) {
      applyStep(index, true);
      index++;
      applyResources(index, true);
      draw();
    }
  }

  function stepBackward() {
    pause();
    if (index > 0) {
      index--;
      applyStep(index, false);
      applyResources(index, false);
      draw();
    }
  }

  function refresh() {
    rewind();
    play();
  }

  function regenerate() {
    pause();
    const data = BurgsAndStates.expandStatesWithSteps();
    steps = data.steps;
    initialStates = data.initialStates;
    resourceSteps = Resources.computeDiscoverySteps(steps, initialStates);
    resourceMap = resourceSteps.reduce((m, r) => {
      if (!m[r.step]) m[r.step] = [];
      m[r.step].push(r.id);
      return m;
    }, {});
    resetToInitial();
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
      <span id="civStepCounter"></span>
      <button id="civReplayBtn" class="icon-cw" data-tip="Replay"></button>
      <button id="civRegenerateBtn" class="icon-arrows-cw" data-tip="Regenerate"></button>
    `;
    container.style.display = 'block';
    byId('civPlayPauseBtn').on('click', togglePlay);
    counterEl = byId('civStepCounter');
    byId('civStepBackBtn').on('click', stepBackward);
    byId('civStepForwardBtn').on('click', stepForward);
    byId('civReplayBtn').on('click', refresh);
    byId('civRegenerateBtn').on('click', regenerate);
    byId('civSpeed')?.addEventListener('input', () => {
      if (timer) play();
    });
    updateCounter();
  }

  return { init, play, pause, togglePlay, start };
})();

document.addEventListener('DOMContentLoaded', () => CivPlayerControls.init());
