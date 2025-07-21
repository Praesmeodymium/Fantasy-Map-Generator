"use strict";

function drawResources() {
  TIME && console.time("drawResources");
  resources.selectAll("*").remove();

  const bySize = Resources.getDisplayMode();
  const useIcons = Resources.getUseIcons();

  const html = pack.resources.map(r => {
    const type = Resources.getType(r.type);
    const color = type?.color || "#000";
    const name = type?.name || "Unknown";

    if (bySize || !useIcons || !type?.icon) {
      const size = bySize ? (r.size || 1) * 3 : 3;
      return `<circle id="resource${r.i}" cx="${r.x}" cy="${r.y}" r="${size}" fill="${color}" data-tip="${name}" />`;
    }

    const icon = type.icon;
    const px = type.px || 12;
    const viewX = rn(r.x - px / 2, 1);
    const viewY = rn(r.y - px / 2, 1);
    const isExternal = icon.startsWith("http") || icon.startsWith("data:image");

    return `\
<svg id="resource${r.i}" width="${px}" height="${px}" x="${viewX}" y="${viewY}" viewBox="0 0 ${px} ${px}" data-tip="${name}">
  <text x="50%" y="50%" font-size="${px}px" dominant-baseline="central" text-anchor="middle">${isExternal ? "" : icon}</text>
  <image x="0" y="0" width="${px}" height="${px}" href="${isExternal ? icon : ""}" />
</svg>`;
  });

  resources.html(html.join(""));
  TIME && console.timeEnd("drawResources");
}
