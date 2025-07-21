"use strict";

window.Resources = (function () {
  let types = [];

  async function loadConfig() {
    if (types.length) return types;
    try {
      types = await (await fetch("config/resources.json")).json();
    } catch (e) {
      console.error("Failed to load resources config", e);
      types = [];
    }
    return types;
  }

  async function generate() {
    await loadConfig();
    const {cells} = pack;
    pack.resources = [];
    cells.resource = new Uint8Array(cells.i.length);
    let id = 0;
    for (const i of cells.i) {
      if (cells.h[i] < 20) continue; // ignore water
      const height = cells.h[i];
      const biome = cells.biome[i];
      const weights = types.map(t => {
        let w = t.base || 0;
        if (t.type === "metal" && height > 60) w *= 3;
        if (t.type === "fuel" && height < 60 && [3,4,5,7,8,9,12].includes(biome)) w *= 2;
        if (t.type === "magic" && height > 70) w *= 5;
        return w;
      });
      const total = weights.reduce((a, b) => a + b, 0);
      if (Math.random() >= total) continue;
      let r = Math.random() * total;
      let resIndex = -1;
      for (let j = 0; j < weights.length; j++) {
        r -= weights[j];
        if (r <= 0) {
          resIndex = j;
          break;
        }
      }
      if (resIndex === -1) continue;
      const type = types[resIndex];
      cells.resource[i] = type.id;
      const [x, y] = cells.p[i];
      pack.resources.push({i: ++id, type: type.id, x: rn(x, 2), y: rn(y, 2), cell: i});
    }
  }
  async function regenerate() {
    await generate();
    if (window.drawResources) drawResources();
  }

  const getType = id => types.find(t => t.id === id);
  const getTypes = () => types.slice();

  return {generate, regenerate, getType, getTypes};

})();
