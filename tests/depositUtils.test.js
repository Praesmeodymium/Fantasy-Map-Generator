const {DepositSizeTiers, getDepositSize, getRenderRadius} = require('../utils/depositUtils.js');

test('getDepositSize uses tier range and random value', () => {
  const oldRandom = Math.random;
  Math.random = () => 0; // always pick lowest tier
  const tons = getDepositSize('Iron', 0);
  Math.random = oldRandom;
  expect(tons).toBe(DepositSizeTiers[7].min); // Iron min tier is 8
});

test('getRenderRadius scales logarithmically and clamps', () => {
  expect(getRenderRadius(10000, 1)).toBe(4); // log10(10000)=4
  expect(getRenderRadius(1e10, 10)).toBe(50); // clamped to max
  expect(getRenderRadius(1, 0)).toBe(2); // clamped to min
});
