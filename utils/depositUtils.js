"use strict";

// internal helpers
function minmax(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Global deposit size tiers (metric tons)
const DepositSizeTiers = [
  { tier: 1, min: 1,     max: 5 },         // trace deposits
  { tier: 2, min: 5,     max: 20 },        // very small
  { tier: 3, min: 20,    max: 50 },        // small
  { tier: 4, min: 50,    max: 200 },       // medium-small
  { tier: 5, min: 200,   max: 1000 },      // medium
  { tier: 6, min: 1000,  max: 5000 },      // large
  { tier: 7, min: 5000,  max: 20000 },     // very large
  { tier: 8, min: 20000, max: 100000 },    // mega
  { tier: 9, min: 100000,max: 500000 },    // regional
  { tier:10, min: 500000,max: 2000000 },   // continental
  { tier:11, min: 2000000,max: 10000000 }, // extreme
  { tier:12, min: 10000000,max: 50000000 } // mythical
];

// Resource → size tier mapping
const ResourceSizeTiers = {
  "Iron": [8, 11],
  "Copper": [6, 9],
  "Gold": [2, 4],
  "Silver": [3, 5],
  "Tin": [3, 6],
  "Lead": [4, 7],
  "Coal": [9, 12],
  "Oil": [8, 11],
  "Salt": [7, 10],
  "Clay": [6, 9],
  "Limestone": [7, 10],
  "Sandstone": [7, 10],
  "Sulfur": [3, 6],
  "Saltpeter": [2, 4],
  "Magical Timbers": [3, 6],
  "Gems": [2, 5],
  "Mithril": [1, 3],
  "Mana Crystal": [1, 3]
};

function getDepositSize(resourceName, randomValue) {
  const range = ResourceSizeTiers[resourceName] || [1, 1];
  const [minTier, maxTier] = range;
  const tierIndex = minTier + Math.floor(Math.random() * (maxTier - minTier + 1));
  const tier = DepositSizeTiers[tierIndex - 1];
  const tons = lerp(tier.min, tier.max, minmax(randomValue, 0, 1));
  return Math.round(tons);
}

function getRenderRadius(depositTons, mapScale) {
  const base = Math.log10(Math.max(depositTons, 1));
  const radius = base * mapScale;
  return minmax(radius, 2, 50);
}

if (typeof module !== "undefined") {
  module.exports = {DepositSizeTiers, ResourceSizeTiers, getDepositSize, getRenderRadius};
}
