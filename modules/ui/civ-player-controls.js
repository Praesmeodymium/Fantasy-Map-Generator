"use strict";

window.CivPlayerControls = (() => {
  function init() {
    const container = document.getElementById("civPlayerControls");
    if (!container) return;
    container.innerHTML = `
      <button id="civPlayBtn">Play</button>
      <button id="civPauseBtn">Pause</button>
      <button id="civStepBackBtn">Step -</button>
      <button id="civStepForwardBtn">Step +</button>
    `;
    container.style.display = "block";
  }

  return {init};
})();

document.addEventListener("DOMContentLoaded", () => CivPlayerControls.init());
