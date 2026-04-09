const COOKIE_META_KEY = "lyra_workspace_meta";
const COOKIE_DATA_PREFIX = "lyra_workspace_data_";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const COOKIE_CHUNK_SIZE = 3300;
const COOKIE_MAX_TOTAL = 60000;

const treeRoot = document.getElementById("treeRoot");
const fileNameInput = document.getElementById("fileNameInput");
const titleInput = document.getElementById("titleInput");
const rowsEditor = document.getElementById("rowsEditor");
const previewTitle = document.getElementById("previewTitle");
const previewLyrics = document.getElementById("previewLyrics");

const newFolderButton = document.getElementById("newFolderButton");
const newFileButton = document.getElementById("newFileButton");
const deleteNodeButton = document.getElementById("deleteNodeButton");
const addRowButton = document.getElementById("addRowButton");

const saveButton = document.getElementById("saveButton");
const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const resetButton = document.getElementById("resetButton");

const focusEditorButton = document.getElementById("focusEditorButton");
const focusPreviewButton = document.getElementById("focusPreviewButton");
const normalLayoutButton = document.getElementById("normalLayoutButton");

const importFileInput = document.getElementById("importFileInput");
const status = document.getElementById("status");

let autosaveTimer = null;
let dragSourceId = null;
const expandedFolders = new Set(["root"]);
let workspace = createDefaultWorkspace();

function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function createRow(lyrics = "", beat = 8, note = "") {
  return {
    id: createId(),
    lyrics,
    beat,
    note,
  };
}

function createDefaultWorkspace() {
  const songFileId = createId();
  return {
    tree: {
      id: "root",
      type: "folder",
      name: "Lyrics",
      children: [
        {
          id: createId(),
          type: "folder",
          name: "Demo",
          children: [
            {
              id: songFileId,
              type: "file",
              name: "demo-song",
              title: "Demo Song",
              rows: [
                createRow("[天球|そら]へ [シルエットダンス|silhouette dance]", 8, "1 & 2 & 3 & 4 &"),
                createRow("[世界|せかい]を [越|こ]えていこう", 8, "x - x - x x - -"),
              ],
            },
          ],
        },
      ],
    },
    selectedFileId: songFileId,
    selectedNodeId: songFileId,
  };
}

function setCookie(name, value, maxAge = COOKIE_MAX_AGE) {
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function getCookie(name) {
  const encodedName = `${name}=`;
  for (const rawPart of document.cookie.split(";")) {
    const part = rawPart.trim();
    if (part.startsWith(encodedName)) {
      return part.slice(encodedName.length);
    }
  }
  return "";
}

function deleteCookie(name) {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function saveWorkspaceToCookies(current) {
  const encoded = encodeURIComponent(JSON.stringify(current));
  if (encoded.length > COOKIE_MAX_TOTAL) {
    throw new Error("Workspace too large for cookie storage.");
  }

  const chunkCount = Math.ceil(encoded.length / COOKIE_CHUNK_SIZE);
  const prevMeta = getCookie(COOKIE_META_KEY);
  let previousCount = 0;
  if (prevMeta) {
    previousCount = Number.parseInt(prevMeta.split(".")[0], 10) || 0;
  }

  for (let i = 0; i < previousCount; i += 1) {
    deleteCookie(`${COOKIE_DATA_PREFIX}${i}`);
  }

  for (let i = 0; i < chunkCount; i += 1) {
    const start = i * COOKIE_CHUNK_SIZE;
    const part = encoded.slice(start, start + COOKIE_CHUNK_SIZE);
    setCookie(`${COOKIE_DATA_PREFIX}${i}`, part);
  }

  setCookie(COOKIE_META_KEY, `${chunkCount}.v1`);
}

function loadWorkspaceFromCookies() {
  try {
    const meta = getCookie(COOKIE_META_KEY);
    if (!meta) {
      return null;
    }

    const chunkCount = Number.parseInt(meta.split(".")[0], 10);
    if (!Number.isFinite(chunkCount) || chunkCount <= 0) {
      return null;
    }

    let merged = "";
    for (let i = 0; i < chunkCount; i += 1) {
      const chunk = getCookie(`${COOKIE_DATA_PREFIX}${i}`);
      if (!chunk) {
        return null;
      }
      merged += chunk;
    }

    const parsed = JSON.parse(decodeURIComponent(merged));
    return isValidWorkspace(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function clearWorkspaceCookies() {
  const meta = getCookie(COOKIE_META_KEY);
  if (meta) {
    const chunkCount = Number.parseInt(meta.split(".")[0], 10) || 0;
    for (let i = 0; i < chunkCount; i += 1) {
      deleteCookie(`${COOKIE_DATA_PREFIX}${i}`);
    }
  }
  deleteCookie(COOKIE_META_KEY);
}

function isValidWorkspace(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }
  if (!candidate.tree || candidate.tree.type !== "folder" || candidate.tree.id !== "root") {
    return false;
  }
  if (typeof candidate.selectedFileId !== "string") {
    return false;
  }
  return true;
}

function clampBeat(value) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) {
    return 8;
  }
  return Math.max(1, Math.min(32, n));
}

function normalizeFileNode(node) {
  if (node.type === "file") {
    if (!Array.isArray(node.rows)) {
      const legacyLyrics = typeof node.lyrics === "string" ? node.lyrics : "";
      node.rows = legacyLyrics.split("\n").map((line) => createRow(line, 8, ""));
      if (node.rows.length === 0) {
        node.rows = [createRow("", 8, "")];
      }
      delete node.lyrics;
    }

    node.rows = node.rows.map((row) => ({
      id: typeof row.id === "string" ? row.id : createId(),
      lyrics: typeof row.lyrics === "string" ? row.lyrics : "",
      beat: clampBeat(row.beat),
      note: typeof row.note === "string" ? row.note : "",
    }));

    if (node.rows.length === 0) {
      node.rows = [createRow("", 8, "")];
    }

    if (typeof node.name !== "string") {
      node.name = "untitled-file";
    }
    if (typeof node.title !== "string") {
      node.title = "Untitled";
    }
    return;
  }

  if (!Array.isArray(node.children)) {
    node.children = [];
  }
  node.children.forEach((child) => normalizeFileNode(child));
}

function normalizeWorkspaceData() {
  normalizeFileNode(workspace.tree);
  if (typeof workspace.selectedNodeId !== "string") {
    workspace.selectedNodeId = workspace.selectedFileId;
  }
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLine(line) {
  const pieces = [];
  let i = 0;

  while (i < line.length) {
    const open = line.indexOf("[", i);
    if (open === -1) {
      pieces.push(escapeHtml(line.slice(i)));
      break;
    }

    pieces.push(escapeHtml(line.slice(i, open)));

    const close = line.indexOf("]", open + 1);
    if (close === -1) {
      pieces.push(escapeHtml(line.slice(open)));
      break;
    }

    const inner = line.slice(open + 1, close);
    const separator = inner.indexOf("|");
    if (separator === -1) {
      pieces.push(escapeHtml(line.slice(open, close + 1)));
      i = close + 1;
      continue;
    }

    const base = inner.slice(0, separator).trim();
    const phonetic = inner.slice(separator + 1).trim();
    if (!base || !phonetic) {
      pieces.push(escapeHtml(line.slice(open, close + 1)));
      i = close + 1;
      continue;
    }

    pieces.push(`<ruby>${escapeHtml(base)}<rt>${escapeHtml(phonetic)}</rt></ruby>`);
    i = close + 1;
  }

  return pieces.join("");
}

function findNodeWithParentById(node, id, parent = null) {
  if (node.id === id) {
    return { node, parent };
  }
  if (node.type !== "folder") {
    return null;
  }
  for (const child of node.children) {
    const hit = findNodeWithParentById(child, id, node);
    if (hit) {
      return hit;
    }
  }
  return null;
}

function findFirstFile(node) {
  if (node.type === "file") {
    return node;
  }
  for (const child of node.children) {
    const hit = findFirstFile(child);
    if (hit) {
      return hit;
    }
  }
  return null;
}

function ensureSelectedFile() {
  const selected = findNodeWithParentById(workspace.tree, workspace.selectedFileId);
  if (!selected || selected.node.type !== "file") {
    const firstFile = findFirstFile(workspace.tree);
    if (firstFile) {
      workspace.selectedFileId = firstFile.id;
    } else {
      const file = {
        id: createId(),
        type: "file",
        name: "new-lyrics",
        title: "Untitled",
        rows: [createRow("", 8, "")],
      };
      workspace.tree.children.push(file);
      workspace.selectedFileId = file.id;
    }
  }

  const selectedNode = findNodeWithParentById(workspace.tree, workspace.selectedNodeId);
  if (!selectedNode) {
    workspace.selectedNodeId = workspace.selectedFileId;
  }
}

function getSelectedFile() {
  const hit = findNodeWithParentById(workspace.tree, workspace.selectedFileId);
  if (!hit || hit.node.type !== "file") {
    return null;
  }
  return hit.node;
}

function showStatus(message) {
  status.textContent = message;
  setTimeout(() => {
    if (status.textContent === message) {
      status.textContent = "";
    }
  }, 2300);
}

function scheduleAutosave() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }
  autosaveTimer = setTimeout(() => {
    persistWorkspace();
  }, 350);
}

function persistWorkspace() {
  try {
    saveWorkspaceToCookies(workspace);
    showStatus("Saved to cookies.");
  } catch (error) {
    showStatus(error instanceof Error ? error.message : "Save failed.");
  }
}

function setLayoutMode(mode) {
  document.body.classList.remove("focus-editor", "focus-preview");
  if (mode === "editor") {
    document.body.classList.add("focus-editor");
  }
  if (mode === "preview") {
    document.body.classList.add("focus-preview");
  }
}

function renderRowsEditor(file) {
  rowsEditor.innerHTML = "";
  file.rows.forEach((row, index) => {
    const card = document.createElement("div");
    card.className = "row-card";
    card.dataset.rowId = row.id;

    const head = document.createElement("div");
    head.className = "row-head";

    const rowIndex = document.createElement("p");
    rowIndex.className = "row-index";
    rowIndex.textContent = `Row ${index + 1}`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "secondary remove-row-button";
    removeButton.textContent = "Delete Row";
    removeButton.dataset.rowId = row.id;

    head.append(rowIndex, removeButton);

    const lyricsInput = document.createElement("textarea");
    lyricsInput.className = "row-lyrics";
    lyricsInput.dataset.rowId = row.id;
    lyricsInput.dataset.field = "lyrics";
    lyricsInput.value = row.lyrics;
    lyricsInput.placeholder = "Lyrics line";

    const meta = document.createElement("div");
    meta.className = "row-meta";

    const beatInput = document.createElement("input");
    beatInput.type = "number";
    beatInput.min = "1";
    beatInput.max = "32";
    beatInput.step = "1";
    beatInput.className = "beat-input";
    beatInput.dataset.rowId = row.id;
    beatInput.dataset.field = "beat";
    beatInput.value = String(row.beat);

    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.className = "note-input";
    noteInput.dataset.rowId = row.id;
    noteInput.dataset.field = "note";
    noteInput.value = row.note;
    noteInput.placeholder = "Note aligned to beat";

    meta.append(beatInput, noteInput);
    card.append(head, lyricsInput, meta);
    rowsEditor.append(card);
  });
}

function renderPreviewRows(file) {
  previewLyrics.innerHTML = "";

  for (const row of file.rows) {
    const wrap = document.createElement("div");
    wrap.className = "preview-row";
    wrap.style.setProperty("--beats", String(clampBeat(row.beat)));

    const lyricLine = document.createElement("div");
    lyricLine.className = "preview-line lyric";
    lyricLine.innerHTML = renderLine(row.lyrics || " ");

    const noteLine = document.createElement("div");
    noteLine.className = "preview-line note";
    noteLine.textContent = row.note || " ";

    wrap.append(lyricLine, noteLine);
    previewLyrics.append(wrap);
  }
}

function updateEditorFromSelection() {
  const file = getSelectedFile();
  if (!file) {
    fileNameInput.value = "";
    titleInput.value = "";
    fileNameInput.disabled = true;
    titleInput.disabled = true;
    rowsEditor.innerHTML = "";
    previewTitle.textContent = "No file selected";
    previewLyrics.innerHTML = "";
    return;
  }

  fileNameInput.disabled = false;
  titleInput.disabled = false;

  fileNameInput.value = file.name;
  titleInput.value = file.title;
  previewTitle.textContent = file.title.trim() || "Untitled";

  renderRowsEditor(file);
  renderPreviewRows(file);
}

function saveHeaderToSelection() {
  const file = getSelectedFile();
  if (!file) {
    return;
  }
  file.name = fileNameInput.value.trim() || "untitled-file";
  file.title = titleInput.value;
}

function addRowToSelectedFile() {
  const file = getSelectedFile();
  if (!file) {
    return;
  }
  file.rows.push(createRow("", 8, ""));
  renderRowsEditor(file);
  renderPreviewRows(file);
  scheduleAutosave();
}

function removeRowFromSelectedFile(rowId) {
  const file = getSelectedFile();
  if (!file) {
    return;
  }
  file.rows = file.rows.filter((row) => row.id !== rowId);
  if (file.rows.length === 0) {
    file.rows = [createRow("", 8, "")];
  }
  renderRowsEditor(file);
  renderPreviewRows(file);
  scheduleAutosave();
}

function patchRowValue(rowId, field, value) {
  const file = getSelectedFile();
  if (!file) {
    return;
  }
  const row = file.rows.find((item) => item.id === rowId);
  if (!row) {
    return;
  }

  if (field === "beat") {
    row.beat = clampBeat(value);
  } else if (field === "lyrics") {
    row.lyrics = value;
  } else if (field === "note") {
    row.note = value;
  }

  renderPreviewRows(file);
  scheduleAutosave();
}

function createFolder() {
  const selected = findNodeWithParentById(workspace.tree, workspace.selectedNodeId);
  let parentFolder = workspace.tree;

  if (selected && selected.parent) {
    parentFolder = selected.parent;
  }

  const focused = findNodeWithParentById(workspace.tree, workspace.selectedNodeId);
  if (focused && focused.node.type === "folder") {
    parentFolder = focused.node;
  }

  const name = window.prompt("Folder name:", "New Folder");
  if (!name) {
    return;
  }

  const folder = {
    id: createId(),
    type: "folder",
    name: name.trim() || "New Folder",
    children: [],
  };

  parentFolder.children.push(folder);
  expandedFolders.add(parentFolder.id);
  expandedFolders.add(folder.id);
  renderTree();
  scheduleAutosave();
}

function createFile() {
  const selected = findNodeWithParentById(workspace.tree, workspace.selectedNodeId);
  let parentFolder = workspace.tree;

  if (selected && selected.parent) {
    parentFolder = selected.parent;
  }

  const focused = findNodeWithParentById(workspace.tree, workspace.selectedNodeId);
  if (focused && focused.node.type === "folder") {
    parentFolder = focused.node;
  }

  const name = window.prompt("File name:", "new-lyrics");
  if (!name) {
    return;
  }

  const file = {
    id: createId(),
    type: "file",
    name: name.trim() || "new-lyrics",
    title: "Untitled",
    rows: [createRow("", 8, "")],
  };

  parentFolder.children.push(file);
  workspace.selectedFileId = file.id;
  workspace.selectedNodeId = file.id;
  expandedFolders.add(parentFolder.id);
  renderAll();
  scheduleAutosave();
}

function deleteSelectedNode() {
  const target = findNodeWithParentById(workspace.tree, workspace.selectedNodeId);
  if (!target || !target.parent) {
    return;
  }

  const label = target.node.type === "folder" ? `folder \"${target.node.name}\"` : `file \"${target.node.name}\"`;
  const hasChildren = target.node.type === "folder" && target.node.children.length > 0;
  const question = hasChildren ? `Delete ${label} and all nested items?` : `Delete ${label}?`;

  if (!window.confirm(question)) {
    return;
  }

  target.parent.children = target.parent.children.filter((child) => child.id !== target.node.id);
  ensureSelectedFile();
  workspace.selectedNodeId = workspace.selectedFileId;
  renderAll();
  scheduleAutosave();
}

function toggleFolder(folderId) {
  if (expandedFolders.has(folderId)) {
    if (folderId !== "root") {
      expandedFolders.delete(folderId);
    }
  } else {
    expandedFolders.add(folderId);
  }
  renderTree();
}

function isDescendantFolder(folderNode, candidateId) {
  if (folderNode.id === candidateId) {
    return true;
  }
  if (folderNode.type !== "folder") {
    return false;
  }
  for (const child of folderNode.children) {
    if (child.type === "folder" && isDescendantFolder(child, candidateId)) {
      return true;
    }
    if (child.id === candidateId) {
      return true;
    }
  }
  return false;
}

function moveNode(sourceId, targetId, dropInsideFolder) {
  if (!sourceId || !targetId || sourceId === "root") {
    return;
  }

  const sourceHit = findNodeWithParentById(workspace.tree, sourceId);
  const targetHit = findNodeWithParentById(workspace.tree, targetId);
  if (!sourceHit || !sourceHit.parent || !targetHit) {
    return;
  }

  if (sourceHit.node.type === "folder" && isDescendantFolder(sourceHit.node, targetHit.node.id)) {
    showStatus("Cannot move a folder into itself.");
    return;
  }

  sourceHit.parent.children = sourceHit.parent.children.filter((child) => child.id !== sourceId);

  if (dropInsideFolder && targetHit.node.type === "folder") {
    targetHit.node.children.push(sourceHit.node);
    expandedFolders.add(targetHit.node.id);
  } else {
    const parent = targetHit.parent;
    if (!parent) {
      workspace.tree.children.push(sourceHit.node);
    } else {
      const index = parent.children.findIndex((child) => child.id === targetHit.node.id);
      parent.children.splice(index + 1, 0, sourceHit.node);
    }
  }

  renderTree();
  scheduleAutosave();
}

function handleDragStart(event) {
  dragSourceId = event.currentTarget.dataset.nodeId || null;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

function handleDrop(event) {
  event.preventDefault();
  const item = event.currentTarget;
  item.classList.remove("drag-over");

  const targetId = item.dataset.nodeId;
  const targetType = item.dataset.nodeType;
  if (!dragSourceId || !targetId || dragSourceId === targetId) {
    dragSourceId = null;
    return;
  }

  moveNode(dragSourceId, targetId, targetType === "folder");
  dragSourceId = null;
}

function createTreeNodeElement(node) {
  const li = document.createElement("li");

  const row = document.createElement("div");
  row.className = `tree-item ${node.type}`;
  row.dataset.nodeId = node.id;
  row.dataset.nodeType = node.type;
  row.draggable = node.id !== "root";

  if (node.id === workspace.selectedNodeId) {
    row.classList.add("selected");
  }

  const twisty = document.createElement("span");
  twisty.className = "twisty";
  if (node.type === "folder") {
    const isOpen = expandedFolders.has(node.id) || node.id === "root";
    twisty.textContent = isOpen ? "▾" : "▸";
    twisty.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFolder(node.id);
    });
  } else {
    twisty.textContent = "";
  }

  const label = document.createElement("p");
  label.className = "label";
  label.textContent = node.name;

  row.append(twisty, label);

  row.addEventListener("click", () => {
    if (node.type === "file") {
      saveHeaderToSelection();
      workspace.selectedFileId = node.id;
      workspace.selectedNodeId = node.id;
      renderAll();
      scheduleAutosave();
      return;
    }

    workspace.selectedNodeId = node.id;
    renderTree();
  });

  row.addEventListener("dragstart", handleDragStart);
  row.addEventListener("dragover", handleDragOver);
  row.addEventListener("dragleave", handleDragLeave);
  row.addEventListener("drop", handleDrop);

  li.append(row);

  if (node.type === "folder") {
    const isOpen = expandedFolders.has(node.id) || node.id === "root";
    if (isOpen) {
      const ul = document.createElement("ul");
      for (const child of node.children) {
        ul.append(createTreeNodeElement(child));
      }
      li.append(ul);
    }
  }

  return li;
}

function renderTree() {
  treeRoot.innerHTML = "";
  const rootList = document.createElement("ul");
  rootList.append(createTreeNodeElement(workspace.tree));
  treeRoot.append(rootList);
}

function renderAll() {
  renderTree();
  updateEditorFromSelection();
}

function exportWorkspace() {
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "lyrics-workspace.json";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showStatus("Workspace exported.");
}

async function importWorkspaceFromFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const parsed = JSON.parse(await file.text());
    if (!isValidWorkspace(parsed)) {
      throw new Error("Invalid workspace format.");
    }

    workspace = parsed;
    normalizeWorkspaceData();
    ensureSelectedFile();
    renderAll();
    persistWorkspace();
    showStatus("Workspace imported.");
  } catch {
    showStatus("Import failed.");
  } finally {
    importFileInput.value = "";
  }
}

function resetWorkspace() {
  workspace = createDefaultWorkspace();
  expandedFolders.clear();
  expandedFolders.add("root");
  renderAll();
  persistWorkspace();
  showStatus("Workspace reset.");
}

function bindEditorEvents() {
  fileNameInput.addEventListener("input", () => {
    saveHeaderToSelection();
    renderTree();
    scheduleAutosave();
  });

  titleInput.addEventListener("input", () => {
    saveHeaderToSelection();
    const file = getSelectedFile();
    if (file) {
      previewTitle.textContent = file.title.trim() || "Untitled";
    }
    scheduleAutosave();
  });

  rowsEditor.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const rowId = target.dataset.rowId;
    const field = target.dataset.field;
    if (!rowId || !field) {
      return;
    }

    patchRowValue(rowId, field, target.value);

    if (field === "beat") {
      target.value = String(clampBeat(target.value));
    }
  });

  rowsEditor.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.classList.contains("remove-row-button")) {
      const rowId = target.dataset.rowId;
      if (rowId) {
        removeRowFromSelectedFile(rowId);
      }
    }
  });

  addRowButton.addEventListener("click", addRowToSelectedFile);
}

function bindActionEvents() {
  newFolderButton.addEventListener("click", createFolder);
  newFileButton.addEventListener("click", createFile);
  deleteNodeButton.addEventListener("click", deleteSelectedNode);

  saveButton.addEventListener("click", () => {
    saveHeaderToSelection();
    persistWorkspace();
  });

  exportButton.addEventListener("click", exportWorkspace);
  importButton.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", importWorkspaceFromFile);

  resetButton.addEventListener("click", () => {
    if (window.confirm("Reset workspace to demo content?")) {
      clearWorkspaceCookies();
      resetWorkspace();
    }
  });

  focusEditorButton.addEventListener("click", () => setLayoutMode("editor"));
  focusPreviewButton.addEventListener("click", () => setLayoutMode("preview"));
  normalLayoutButton.addEventListener("click", () => setLayoutMode("normal"));
}

function init() {
  const fromCookie = loadWorkspaceFromCookies();
  workspace = fromCookie || createDefaultWorkspace();

  normalizeWorkspaceData();
  ensureSelectedFile();
  expandedFolders.add("root");
  renderAll();

  bindEditorEvents();
  bindActionEvents();
}

init();
