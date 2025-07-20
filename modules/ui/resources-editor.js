"use strict";
function editResources() {
  if (customization) return;
  closeDialogs("#resourcesEditor, .stable");
  if (!layerIsOn("toggleResources")) toggleResources();

  const body = byId("resourcesBody");
  refreshResourcesEditor();

  if (modules.editResources) return;
  modules.editResources = true;

  $("#resourcesEditor").dialog({
    title: "Resources Editor",
    resizable: false,
    width: fitContent(),
    position: {my: "right top", at: "right-10 top+10", of: "svg", collision: "fit"},
    close: closeResourcesEditor
  });

  byId("resourcesEditorRefresh").addEventListener("click", refreshResourcesEditor);
  byId("resourcesEditStyle").addEventListener("click", () => editStyle("resources"));
  byId("resourcesLegend").addEventListener("click", toggleLegend);
  byId("resourcesRegenerate").addEventListener("click", regenerateResources);
  byId("resourcesManually").addEventListener("click", enterResourcesManualAssign);
  byId("resourcesManuallyApply").addEventListener("click", applyResourcesManualAssign);
  byId("resourcesManuallyCancel").addEventListener("click", exitResourcesManualAssign);

  body.addEventListener("click", ev => {
    const line = ev.target.closest("div.resources");
    if (line && customization === 14) selectResourceOnLineClick(line);
  });

  function refreshResourcesEditor() {
    const cells = pack.cells;
    const types = Resources.getTypes();
    const counts = {};
    for (const i of cells.i) {
      const id = cells.resource[i];
      if (id) counts[id] = (counts[id] || 0) + 1;
    }
    let lines = types
      .map(t => {
        const count = counts[t.id] || 0;
        return `<div class="states resources" data-id="${t.id}" data-name="${t.name}" data-color="${t.color}" data-cells="${count}">`+
          `<fill-box fill="${t.color}"></fill-box>`+
          `<div class="resourceName" style="width:10em">${t.name}</div>`+
          `<div data-tip="Cells count" class="resourceCells">${count}</div>`+
          `</div>`;
      })
      .join("");
    lines += `<div class="states resources" data-id="0" data-name="None" data-color="#eee" data-cells="0">`+
             `<fill-box fill="#eee"></fill-box>`+
             `<div class="resourceName" style="width:10em">None</div>`+
             `<div class="resourceCells">0</div></div>`;
    body.innerHTML = lines;
    body.querySelector("div.states")?.classList.add("selected");
    byId("resourcesFooterNumber").textContent = pack.resources.length;
  }

  function closeResourcesEditor() {
    modules.editResources = false;
    if (customization === 14) exitResourcesManualAssign();
  }

  function toggleLegend() {
    if (legend.selectAll("*").size()) {
      clearLegend();
      return;
    }
    const data = Resources.getTypes()
      .filter(t => pack.resources.some(r => r.type === t.id))
      .map(t => [t.id, t.color, t.name]);
    drawLegend("Resources", data);
  }

  function regenerateResources() {
    Resources.regenerate().then(refreshResourcesEditor);
  }

  function enterResourcesManualAssign() {
    customization = 14;
    resources.append("g").attr("id", "temp");
    document.querySelectorAll("#resourcesBottom > button").forEach(el => (el.style.display = "none"));
    byId("resourcesManuallyButtons").style.display = "block";
    body.querySelector("div.states").classList.add("selected");
    resourcesEditor.querySelectorAll(".hide").forEach(el => el.classList.add("hidden"));
    resourcesFooter.style.display = "none";
    $("#resourcesEditor").dialog({position: {my: "right top", at: "right-10 top+10", of: "svg"}});

    tip("Drag the circle to assign selected resource", true);
    viewbox.style("cursor", "crosshair")
      .call(d3.drag().on("start", dragResourceBrush))
      .on("touchmove mousemove", moveResourceBrush);
  }

  function selectResourceOnLineClick(line) {
    body.querySelectorAll("div.selected").forEach(el => el.classList.remove("selected"));
    line.classList.add("selected");
  }

  function dragResourceBrush() {
    const r = +resourcesBrush.value;
    d3.event.on("drag", () => {
      if (!d3.event.dx && !d3.event.dy) return;
      const p = d3.mouse(this);
      moveCircle(p[0], p[1], r);
      const found = r > 5 ? findAll(p[0], p[1], r) : [findCell(p[0], p[1])];
      changeResourceForSelection(found.filter(isLand));
    });
  }

  function moveResourceBrush() {
    showMainTip();
    const point = d3.mouse(this);
    const radius = +resourcesBrush.value;
    moveCircle(point[0], point[1], radius);
  }

  function changeResourceForSelection(selection) {
    const typeId = +body.querySelector("div.selected").dataset.id;
    selection.forEach(i => {
      if (pack.cells.h[i] < 20) return;
      pack.cells.resource[i] = typeId;
      const index = pack.resources.findIndex(r => r.cell === i);
      if (index !== -1) pack.resources.splice(index, 1);
      if (typeId) {
        const [x, y] = pack.cells.p[i];
        const id = last(pack.resources)?.i + 1 || 1;
        pack.resources.push({i: id, type: typeId, x: rn(x,2), y: rn(y,2), cell: i});
      }
    });
    drawResources();
  }

  function applyResourcesManualAssign() {
    refreshResourcesEditor();
    exitResourcesManualAssign();
  }

  function exitResourcesManualAssign() {
    customization = 0;
    resources.select("#temp").remove();
    removeCircle();
    document.querySelectorAll("#resourcesBottom > button").forEach(el => (el.style.display = "inline-block"));
    byId("resourcesManuallyButtons").style.display = "none";
    resourcesEditor.querySelectorAll(".hide.hidden").forEach(el => el.classList.remove("hidden"));
    resourcesFooter.style.display = "block";
    restoreDefaultEvents();
    clearMainTip();
  }
}
