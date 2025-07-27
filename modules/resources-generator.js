"use strict";

window.Resources = (function () {
  let types = [];
  const STORAGE_KEY = "resourcesConfig";
  let displayBySize = false;
  let useIcons = true;
  // overall spawn rate multiplier, reduced to 50% of original
  let frequency = 0.05;
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

  function getDepositTons(type, x, y) {
    const r = regionRandom(x, y, type.id + "_tons");
    return getDepositSize(type.name, r);
  }

  function addDeposit(typeId, cell, visible = false) {
    const type = getType(typeId);
    if (!type) return;
    const [x, y] = pack.cells.p[cell];
    const size = getRandomSize(type, x, y);
    const tons = getDepositTons(type, x, y);
    const affected = size > 1 ? findAll(x, y, size) : [cell];
    affected.forEach(c => {
      if (pack.cells.h[c] < 20) return;
      if (visible) pack.cells.resource[c] = typeId;
      else pack.cells.hiddenResource[c] = typeId;
    });
    const id = (last(pack.resources)?.i || 0) + 1;
    const deposit = {i: id, type: typeId, x: rn(x,2), y: rn(y,2), cell, size, tons, visible};
    pack.resources.push(deposit);
    return deposit;
  }

  function removeHiddenDeposit(typeId) {
    const hiddenDeposits = pack.resources.filter(r => r.type === typeId && !r.visible);
    if (!hiddenDeposits.length) return;
    const deposit = ra(hiddenDeposits);
    const index = pack.resources.indexOf(deposit);
    pack.resources.splice(index, 1);
    const cells = findAll(deposit.x, deposit.y, deposit.size);
    cells.forEach(c => {
      if (pack.cells.hiddenResource[c] === deposit.type) {
        pack.cells.hiddenResource[c] = 0;
      }
    });
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

  function computeTectonicZones() {
    const {cells} = pack;
    if (cells.tectonic) return cells.tectonic;
    cells.tectonic = new Uint8Array(cells.i.length);
    for (const i of cells.i) {
      if (cells.h[i] < 20) continue;
      const neighbors = cells.c[i];
      if (!neighbors.length) continue;
      const h = cells.h[i];
      const avg = d3.mean(neighbors.map(n => cells.h[n]));
      const maxDiff = d3.max(neighbors.map(n => Math.abs(cells.h[n] - h)));
      if (maxDiff > 15) {
        if (h - avg > 5) cells.tectonic[i] = 3; // compression / uplift
        else if (avg - h > 5) cells.tectonic[i] = 2; // rift / depression
        else cells.tectonic[i] = 1; // active
      } else {
        cells.tectonic[i] = 0; // stable
      }
    }
    return cells.tectonic;
  }

  function getResourceWeight(resource, height, biome, pop = 0, tectonic = 0) {
    let weight = resource.base || 0;
    if (!weight) return 0;

    const isMountain = height > 60;
    const isExtreme = height > 75;
    const isLowland = height < 40;
    const isDesert = [1, 2].includes(biome);
    const isForest = [5, 6, 7, 8].includes(biome);
    const isWetland = biome === 12;
    const isRiverValley = isWetland;
    const isSedimentary = isLowland && tectonic === 0;
    const isActive = tectonic === 1 || tectonic === 3;
    const isRift = tectonic === 2;
    const isCompression = tectonic === 3;

    switch (resource.type) {
      case "metal":
        if (isMountain) weight *= 3;
        if (isActive) weight *= 2;
        break;
      case "fuel":
        if (isSedimentary) weight *= 2;
        if (resource.name === "Oil") {
          if (isDesert) weight *= 3;
          if (isCompression) weight *= 3;
        }
        break;
      case "mineral":
        if (resource.name === "Salt") {
          if (isDesert || isSedimentary) weight *= 3;
        } else if (resource.name === "Sulfur") {
          if (isActive || isRift) weight *= 3;
        } else if (resource.name === "Saltpeter") {
          if (isDesert) weight *= 2;
        }
        break;
      case "gem":
        if (isMountain || isRift) weight *= 3;
        if (isRiverValley) weight *= 2;
        break;
      case "magic":
        if (isExtreme) weight *= 5;
        if (isRift) weight *= 3;
        break;
      case "building":
        if (isLowland) weight *= 2;
        if (pop > 0) weight *= 1.5;
        break;
      case "organic":
        if (isForest || isWetland) weight *= 3;
        break;
    }

    return weight;
  }

  async function generate() {
    await loadConfig();
    const {cells} = pack;
    const tectonicMap = computeTectonicZones();
    pack.resources = [];
    cells.resource = new Uint8Array(cells.i.length); // visible resources
    cells.hiddenResource = new Uint8Array(cells.i.length); // undiscovered resources
    const used = new Set();
    let id = 0;
    for (const i of cells.i) {
      if (cells.h[i] < 20 || used.has(i)) continue; // ignore water
      const height = cells.h[i];
      const biome = cells.biome[i];
      const pop = cells.pop ? cells.pop[i] : 0;
      const tectonic = tectonicMap[i];
      const weights = types.map(t => getResourceWeight(t, height, biome, pop, tectonic));
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
      const tons = getDepositTons(type, x, y);
      const affected = size > 1 ? findAll(x, y, size) : [i];
      affected.forEach(c => {
        if (cells.h[c] < 20 || used.has(c)) return;
        cells.hiddenResource[c] = type.id;
        used.add(c);
      });
      pack.resources.push({i: ++id, type: type.id, x: rn(x, 2), y: rn(y, 2), cell: i, size, tons, visible: false});
    }
  }
  async function regenerate() {
    await generate();
    if (window.drawResources) drawResources();
  }

  const getType = id => types.find(t => t.id === id);
  const getTypes = () => types.slice();
  const getCivImpact = id => {
    const t = getType(id);
    return t?.civImpact || 0;
  };
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

  // reveal deposit and update visible cells
  function discoverDeposit(deposit) {
    if (deposit.visible) return;
    const cells = findAll(deposit.x, deposit.y, deposit.size);
    cells.forEach(c => {
      if (pack.cells.hiddenResource[c] === deposit.type) {
        pack.cells.resource[c] = deposit.type;
      }
    });
    deposit.visible = true;
  }

  // discover resources around existing burgs
  function discoverAroundBurgs(radius = 2) {
    const {burgs} = pack;
    if (!burgs) return;
    pack.resources.forEach(r => {
      if (r.visible) return;
      const near = burgs.some(b => {
        if (!b.i || b.removed) return false;
        const dist2 = (b.x - r.x) ** 2 + (b.y - r.y) ** 2;
        return dist2 <= (radius * grid.spacing) ** 2;
      });
      if (near) discoverDeposit(r);
    });
  }

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
    discoverAroundBurgs,
    addDeposit,
    removeHiddenDeposit,
    discoverDeposit,
    getRandomSize,
    getDepositTons,
    getResourceWeight,
    getCivImpact
  };

})();
