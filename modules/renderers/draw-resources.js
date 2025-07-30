"use strict";

function drawResources(showHidden = false) {
  TIME && console.time("drawResources");
  resources.selectAll("*").remove();

  const bySize = Resources.getDisplayMode();
  const useIcons = Resources.getUseIcons();
  const tooltipSupported = !MOBILE && document.getElementById("tooltip");

  const deposits = pack.resources.filter(r => Resources.isTypeVisible(r.type));

  const renderDeposit = r => {
    const type = Resources.getType(r.type);
    const color = type?.color || "#000";
    const name = type?.name || "Unknown";
    const tons = r.tons || 1;
    const tipText = `${name}: ${tons.toLocaleString()} tons`;

    // radius should not depend on current zoom when redrawn
    const radius = bySize ? getRenderRadius(tons, 1) : 3;
    const labelSize = Math.max(radius * 1.5, 8);

    if (bySize || !useIcons || !type?.icon) {
      if (tooltipSupported)
        return `<circle id="resource${r.i}" cx="${r.x}" cy="${r.y}" r="${radius}" fill="${color}" data-tip="${tipText}" />`;
      return `<g id="resource${r.i}"><circle cx="${r.x}" cy="${r.y}" r="${radius}" fill="${color}" />` +
             `<text x="${r.x}" y="${r.y}" font-size="${labelSize}px" dominant-baseline="central" text-anchor="middle">${si(tons)}</text></g>`;
    }

    const icon = type.icon;
    const px = type.px || 12;
    const visualLen = Array.from(icon.replace(/\uFE0F/g, "")).length || 1;
    const width = px * visualLen;
    const viewX = rn(r.x - width / 2, 1);
    const viewY = rn(r.y - px / 2, 1);
    const isExternal = icon.startsWith("http") || icon.startsWith("data:image");

    if (tooltipSupported)
      return `\
<svg id="resource${r.i}" width="${width}" height="${px}" x="${viewX}" y="${viewY}" viewBox="0 0 ${width} ${px}" data-tip="${tipText}">
  <text x="50%" y="50%" font-size="${px}px" dominant-baseline="central" text-anchor="middle">${isExternal ? "" : icon}</text>
  <image x="0" y="0" width="${width}" height="${px}" href="${isExternal ? icon : ""}" />
</svg>`;

    return `\
<g id="resource${r.i}">
  <svg width="${width}" height="${px}" x="${viewX}" y="${viewY}" viewBox="0 0 ${width} ${px}">
    <text x="50%" y="50%" font-size="${px}px" dominant-baseline="central" text-anchor="middle">${isExternal ? "" : icon}</text>
    <image x="0" y="0" width="${width}" height="${px}" href="${isExternal ? icon : ""}" />
  </svg>
  <text x="${r.x}" y="${r.y}" font-size="${labelSize}px" dominant-baseline="central" text-anchor="middle">${si(tons)}</text>
</g>`;
  };

  if (showHidden) {
    const all = deposits.map(renderDeposit).join("");
    resources.append("g").attr("id", "resources-all").html(all);
    const discovered = deposits.filter(r => r.visible).map(renderDeposit).join("");
    resources.append("g").attr("id", "resources-discovered").html(discovered);
  } else {
    const discovered = deposits.filter(r => r.visible).map(renderDeposit).join("");
    resources.append("g").attr("id", "resources-discovered").html(discovered);
  }

  TIME && console.timeEnd("drawResources");
}
