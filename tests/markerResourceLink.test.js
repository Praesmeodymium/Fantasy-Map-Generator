const path = require('path');

test('adding marker with resource adds deposit', () => {
  global.window = {};
  global.document = { getElementById: () => ({ value: '' }) };
  global.notes = [];
  global.seed = 'test';
  global.aleaPRNG = () => Math.random; // deterministic not required
  global.findAll = () => [0];
  global.rn = (v, d = 0) => { const m = Math.pow(10, d); return Math.round(v*m)/m; };
  global.last = arr => arr[arr.length - 1];
  global.Names = { getCulture: () => 'Test' };

  global.pack = {
    markers: [],
    resources: [],
    cells: {
      i: [0],
      p: [[0,0]],
      h: [30],
      culture: [0],
      religion: [0],
      hiddenResource: new Uint8Array(1)
    },
    religions: { 0: { name: 'Rel' } }
  };

  require('../modules/resources-generator.js');
  require('../modules/markers-generator.js');

  window.Markers.add({type: 'sacred-forests', cell: 0});

  expect(pack.resources.length).toBe(1);
  expect(pack.cells.hiddenResource[0]).toBe(13);
});
