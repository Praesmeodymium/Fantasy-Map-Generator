'use strict';

window.CivPlayerControls = (() => {
  let playing = false;

  function showLayer() {
    if (!layerIsOn('toggleStates')) toggleStates();
  }

  function play() {
    showLayer();
    playing = true;
    const btn = byId('civPlayPauseBtn');
    btn.classList.remove('icon-play');
    btn.classList.add('icon-pause');
  }

  function pause() {
    playing = false;
    const btn = byId('civPlayPauseBtn');
    btn.classList.remove('icon-pause');
    btn.classList.add('icon-play');
  }

  function togglePlay() {
    playing ? pause() : play();
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
  }

  return { init, play, pause, togglePlay };
})();

document.addEventListener('DOMContentLoaded', () => CivPlayerControls.init());
