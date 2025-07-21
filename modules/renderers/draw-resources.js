"use strict";

function drawResources() {
  TIME && console.time("drawResources");
  resources.selectAll("*").remove();
  const bySize = Resources.getDisplayMode();
  const html = pack.resources.map(r => {
    const type = Resources.getType(r.type);
    const color = type?.color || "#000";
    const size = bySize ? (r.size || 1) * 3 : 3;
    const name = type?.name || "Unknown";
    return `<circle id="resource${r.i}" cx="${r.x}" cy="${r.y}" r="${size}" fill="${color}" data-tip="${name}" />`;
  });
  resources.html(html.join(""));
  TIME && console.timeEnd("drawResources");
}
