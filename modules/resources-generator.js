"use strict";

window.Resources = (function () {
  let types = [];
  const STORAGE_KEY = "resourcesConfig";
  let displayBySize = false;
  let useIcons = true;
  let frequency = 0.1; // overall spawn rate multiplier
  const hidden = new Set();

  // region size used to group deposits for size similarity
  const REGION = 120;

  // deterministic pseudo-random number based on map seed and region
  function regionRandom(x, y, typeId) {
    const rx = Math.floor(x / REGION);
    const ry = Math.floor(y / REGION);
    return aleaPRNG(seed + "_" + typeId + "_" + rx + "_" + ry)();
  }

  function getRandomSize(type, x, y) {
    const base = type.size || 1;
    const r = regionRandom(x, y, type.id);
    const factor = 0.8 + r * 0.4 + Math.random() * 0.2;
    return Math.max(1, Math.round(base * factor));
  }

  async function loadConfig() {
    if (types.length) return types;
    const stored = JSON.safeParse(localStorage.getItem(STORAGE_KEY));
    if (stored?.length) {
      types = stored;
      return types;
    }
    try {
      types = await (await fetch("config/resources.json")).json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
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
    const used = new Set();
    let id = 0;
    for (const i of cells.i) {
      if (cells.h[i] < 20 || used.has(i)) continue; // ignore water
      const height = cells.h[i];
      const biome = cells.biome[i];
      const weights = types.map(t => {
        let w = t.base || 0;
        if (t.type === "metal" && height > 60) w *= 3;
        if (t.type === "fuel" && height < 60 && [3,4,5,7,8,9,12].includes(biome)) w *= 2;
        if (t.type === "magic" && height > 70) w *= 5;
        if (t.type === "building" && height < 60) w *= 2;
        if (t.type === "building" && cells.pop && cells.pop[i]) w *= 1 + cells.pop[i] / 20;
        if (t.type === "organic" && [5,6,7,8,9].includes(biome)) w *= 2;
        if (t.type === "mineral" && [1,2,12].includes(biome)) w *= 2;
        if (t.type === "gem" && height > 70) w *= 3;
        return w;
      });
      const total = weights.reduce((a, b) => a + b, 0);
      if (Math.random() >= total * frequency) continue;
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
      const [x, y] = cells.p[i];
      const size = getRandomSize(type, x, y);
      const affected = size > 1 ? findAll(x, y, size) : [i];
      affected.forEach(c => {
        if (cells.h[c] < 20 || used.has(c)) return;
        cells.resource[c] = type.id;
        used.add(c);
      });
      pack.resources.push({i: ++id, type: type.id, x: rn(x, 2), y: rn(y, 2), cell: i, size});
    }
  }
  async function regenerate() {
    await generate();
    if (window.drawResources) drawResources();
  }

  const getType = id => types.find(t => t.id === id);
  const getTypes = () => types.slice();
  const updateTypes = t => {
    types = t.slice();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
  };
  const setDisplayMode = value => (displayBySize = value);
  const getDisplayMode = () => displayBySize;
  const setUseIcons = value => (useIcons = value);
  const getUseIcons = () => useIcons;
  const setFrequency = value => (frequency = +value);
  const getFrequency = () => frequency;
  const hideType = id => hidden.add(+id);
  const showType = id => hidden.delete(+id);
  const toggleType = id => (hidden.has(+id) ? hidden.delete(+id) : hidden.add(+id));
  const isTypeVisible = id => !hidden.has(+id);
  const getHidden = () => Array.from(hidden);

  return {
    generate,
    regenerate,
    getType,
    getTypes,
    updateTypes,
    setDisplayMode,
    getDisplayMode,
    setUseIcons,
    getUseIcons,
    setFrequency,
    getFrequency,
    hideType,
    showType,
    toggleType,
    isTypeVisible,
    getHidden,
    getRandomSize
  };

})();
