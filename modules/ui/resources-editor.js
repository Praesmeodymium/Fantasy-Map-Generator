"use strict";
function editResources() {
  if (customization) return;
  closeDialogs("#resourcesEditor, .stable");
  if (!layerIsOn("toggleResources")) toggleResources();

  const body = byId("resourcesBody");
  const filters = byId("resourcesFilters");
  const showAllButton = byId("resourcesShowAll");
  const displaySizeButton = byId("resourcesDisplaySize");
  const useIconsButton = byId("resourcesUseIcons");
  let showAll = false;
  refreshResourcesEditor();
  drawResources(showAll);
  if (Resources.getDisplayMode()) displaySizeButton.classList.add("pressed");
  if (Resources.getUseIcons()) useIconsButton.classList.add("pressed");
  byId("resourcesFrequency").value = Resources.getFrequency();
  if (showAll) showAllButton.classList.add("pressed");

  $("#resourcesEditor").dialog({
    title: "Resources Editor",
    resizable: false,
    width: fitContent(),
    position: {my: "right top", at: "right-10 top+10", of: "svg", collision: "fit"},
    close: closeResourcesEditor
  });

  if (modules.editResources) return;
  modules.editResources = true;

  byId("resourcesEditorRefresh").addEventListener("click", refreshResourcesEditor);
  byId("resourcesEditStyle").addEventListener("click", () => editStyle("resources"));
  byId("resourcesLegend").addEventListener("click", toggleLegend);
  byId("resourcesRegenerate").addEventListener("click", regenerateResources);
  showAllButton.addEventListener("click", () => {
    showAll = !showAll;
    showAllButton.classList.toggle("pressed", showAll);
    showAllButton.classList.toggle("icon-eye-off", !showAll);
    showAllButton.classList.toggle("icon-eye", showAll);
    refreshResourcesEditor();
    drawResources(showAll);
  });
  byId("resourcesManually").addEventListener("click", enterResourcesManualAssign);
  byId("resourcesManuallyApply").addEventListener("click", applyResourcesManualAssign);
  byId("resourcesManuallyCancel").addEventListener("click", exitResourcesManualAssign);

  body.addEventListener("click", ev => {
    const line = ev.target.closest("div.resources");
    const cl = ev.target.classList;
    if (ev.target.tagName === "FILL-BOX") resourceChangeColor(ev.target);
    else if (cl.contains("icon-trash-empty")) removeCustomResource(ev.target);
    if (line && customization === 14) selectResourceOnLineClick(line);
  });

  body.addEventListener("change", ev => {
    const el = ev.target;
    const cl = el.classList;
    if (cl.contains("resourceName")) resourceChangeName(el);
    else if (cl.contains("resourceBase")) resourceChangeBase(el);
    else if (cl.contains("resourceSize")) resourceChangeSize(el);
    else if (cl.contains("resourceIcon")) resourceChangeIcon(el);
    else if (cl.contains("resourceType")) resourceChangeType(el);
    else if (cl.contains("resourceCivImpact")) resourceChangeCivImpact(el);
    else if (cl.contains("resourceVisible")) resourceToggleVisibility(el);
  });

  function refreshResourcesEditor() {
    const cells = pack.cells;
    const types = Resources.getTypes();
    const counts = {};
    for (const i of cells.i) {
      const id = showAll ? cells.hiddenResource[i] : cells.resource[i];
      if (id) counts[id] = (counts[id] || 0) + 1;
    }
    let lines = types
      .map(t => {
        const count = counts[t.id] || 0;
        return `<div class="states resources" data-id="${t.id}" data-name="${t.name}" data-color="${t.color}" data-base="${t.base}" data-size="${t.size}" data-icon="${t.icon || ''}" data-type="${t.type}" data-civimpact="${t.civImpact ?? 0}" data-cells="${count}">`+
          `<fill-box fill="${t.color}" class="resourceColor"></fill-box>`+
          `<input id="resourceVisible${t.id}" class="checkbox resourceVisible" type="checkbox" ${Resources.isTypeVisible(t.id) ? "checked" : ""}/>`+
          `<label for="resourceVisible${t.id}" class="checkbox-label"></label>`+
          `<input class="resourceIcon" value="${t.icon || ''}" style="width:2em"/>`+
          `<input class="resourceName" value="${t.name}" style="width:8em"/>`+
          `<input class="resourceType" value="${t.type}" style="width:6em"/>`+
          `<input class="resourceBase" type="number" step="0.001" value="${t.base}" style="width:4em"/>`+
          `<input class="resourceSize" type="number" step="1" min="1" value="${t.size}" style="width:4em"/>`+
          `<input class="resourceCivImpact" type="number" step="0.1" value="${t.civImpact ?? 0}" style="width:5em"/>`+
          `<div data-tip="Cells count" class="resourceCells">${count}</div>`+
          `${t.custom ? '<span data-tip="Remove the custom resource" class="icon-trash-empty"></span>' : ''}`+
          `</div>`;
      })
      .join("");
    lines += `<div class="states resources" data-id="0" data-name="None" data-color="#eee" data-base="0" data-size="1" data-icon="" data-type="" data-civimpact="0" data-cells="0">`+
             `<fill-box fill="#eee" class="resourceColor"></fill-box>`+
             `<input id="resourceVisible0" class="checkbox resourceVisible" type="checkbox" checked disabled/>`+
             `<label for="resourceVisible0" class="checkbox-label"></label>`+
             `<input class="resourceIcon" value="" style="width:2em"/>`+
             `<div class="resourceName" style="width:8em">None</div>`+
             `<input class="resourceType" value="" style="width:6em"/>`+
             `<input class="resourceBase" type="number" step="0.001" value="0" style="width:4em"/>`+
             `<input class="resourceSize" type="number" step="1" min="1" value="1" style="width:4em"/>`+
             `<input class="resourceCivImpact" type="number" step="0.1" value="0" style="width:5em"/>`+
             `<div class="resourceCells">0</div></div>`;
  body.innerHTML = lines;
  body.querySelector("div.states")?.classList.add("selected");
  byId("resourcesFooterNumber").textContent = pack.resources.length;
  updateFilters();
  drawResources(showAll);
}

  function updateFilters() {
    body.querySelectorAll("div.states.resources").forEach(line => {
      const id = +line.dataset.id;
      const cb = line.querySelector(".resourceVisible");
      if (cb) cb.checked = Resources.isTypeVisible(id);
    });
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
    Resources.regenerate().then(() => {
      Resources.discoverAroundBurgs();
      refreshResourcesEditor();
      drawResources(showAll);
    });
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
        const type = Resources.getType(typeId);
        const size = Resources.getRandomSize(type, x, y);
        const tons = Resources.getDepositTons(type, x, y);
        pack.resources.push({i: id, type: typeId, x: rn(x,2), y: rn(y,2), cell: i, size, tons});
      }
    });
    drawResources(showAll);
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

  function resourceChangeColor(el) {
    const resource = +el.parentNode.dataset.id;
    const currentFill = el.getAttribute("fill");
    const callback = newFill => {
      el.fill = newFill;
      el.setAttribute("fill", newFill);
      const types = Resources.getTypes();
      const type = types.find(t => t.id === resource);
      if (type) type.color = newFill;
      Resources.updateTypes(types);
      drawResources(showAll);
    };
    openPicker(currentFill, callback);
  }

  function resourceChangeName(el) {
    const resource = +el.parentNode.dataset.id;
    const types = Resources.getTypes();
    const type = types.find(t => t.id === resource);
    if (type) type.name = el.value;
    Resources.updateTypes(types);
    drawResources(showAll);
    updateFilters();
  }

  function resourceChangeBase(el) {
    const resource = +el.parentNode.dataset.id;
    const val = +el.value;
    if (isNaN(val) || val < 0) {
      el.value = Resources.getType(resource).base;
      return tip("Please provide a valid base weight", false, "error");
    }
    const types = Resources.getTypes();
    const type = types.find(t => t.id === resource);
    if (type) type.base = val;
    Resources.updateTypes(types);
    updateFilters();
  }

  function resourceChangeSize(el) {
    const resource = +el.parentNode.dataset.id;
    const val = +el.value;
    if (isNaN(val) || val < 1) {
      el.value = Resources.getType(resource).size;
      return tip("Please provide a valid size", false, "error");
    }
    const types = Resources.getTypes();
    const type = types.find(t => t.id === resource);
    if (type) type.size = val;
    Resources.updateTypes(types);
    updateFilters();
  }

  function resourceChangeIcon(el) {
    const resource = +el.parentNode.dataset.id;
    const types = Resources.getTypes();
    const type = types.find(t => t.id === resource);
    if (type) type.icon = el.value;
    Resources.updateTypes(types);
    drawResources(showAll);
    updateFilters();
  }

  function resourceChangeType(el) {
    const resource = +el.parentNode.dataset.id;
    const types = Resources.getTypes();
    const type = types.find(t => t.id === resource);
    if (type) type.type = el.value;
    Resources.updateTypes(types);
    updateFilters();
  }

  function resourceChangeCivImpact(el) {
    const resource = +el.parentNode.dataset.id;
    const val = +el.value;
    if (isNaN(val)) {
      el.value = Resources.getType(resource).civImpact ?? 0;
      return tip("Please provide a valid impact", false, "error");
    }
    const types = Resources.getTypes();
    const type = types.find(t => t.id === resource);
    if (type) type.civImpact = val;
    Resources.updateTypes(types);
  }

  function resourceToggleVisibility(el) {
    const resource = +el.parentNode.dataset.id;
    if (el.checked) Resources.showType(resource);
    else Resources.hideType(resource);
    drawResources(showAll);
  }

  function removeCustomResource(el) {
    const resource = +el.parentNode.dataset.id;
    const types = Resources.getTypes().filter(t => t.id !== resource);
    Resources.updateTypes(types);
    refreshResourcesEditor();
    drawResources(showAll);
    updateFilters();
  }

  byId("resourcesAdd").addEventListener("click", addCustomResource);
  displaySizeButton.addEventListener("click", () => {
    const active = displaySizeButton.classList.toggle("pressed");
    Resources.setDisplayMode(active);
    drawResources(showAll);
  });
  useIconsButton.addEventListener("click", () => {
    const active = useIconsButton.classList.toggle("pressed");
    Resources.setUseIcons(active);
    drawResources(showAll);
  });
  byId("resourcesFrequency").addEventListener("change", () => {
    const val = +byId("resourcesFrequency").value;
    if (isNaN(val) || val < 0) {
      byId("resourcesFrequency").value = Resources.getFrequency();
      return tip("Please provide a valid frequency", false, "error");
    }
    Resources.setFrequency(val);
    regenerateResources();
  });

  function addCustomResource() {
    const types = Resources.getTypes();
    if (types.length >= 32)
      return tip("Maximum number of resources reached (32)", false, "error");
    const id = types.reduce((m, t) => Math.max(m, t.id), 0) + 1;
    types.push({id, name: "Custom", color: getRandomColor(), base: 0.01, size: 1, type: "custom", custom: true, icon: ""});
    Resources.updateTypes(types);
    refreshResourcesEditor();
  }
}

function editResourceSpot(id) {
  if (customization) return;
  const resId = +id.replace("resource", "");
  const resource = pack.resources.find(r => r.i === resId);
  if (!resource) return;
  editResources();
  setTimeout(() => {
    const body = byId("resourcesBody");
    const line = body.querySelector(`div[data-id='${resource.type}']`);
    if (line) {
      body.querySelectorAll("div.selected").forEach(el => el.classList.remove("selected"));
      line.classList.add("selected");
      line.scrollIntoView({block: "center"});
    }
  });
}
