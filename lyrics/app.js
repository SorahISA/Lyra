const COOKIE_META_KEY = "lyra_workspace_meta";
const COOKIE_DATA_PREFIX = "lyra_workspace_data_";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const COOKIE_CHUNK_SIZE = 3300;
const COOKIE_MAX_TOTAL = 60000;

const treeRoot = document.getElementById("treeRoot");
const fileNameInput = document.getElementById("fileNameInput");
const titleInput = document.getElementById("titleInput");
const lyricsInput = document.getElementById("lyricsInput");
const previewTitle = document.getElementById("previewTitle");
const previewLyrics = document.getElementById("previewLyrics");
const newFolderButton = document.getElementById("newFolderButton");
const newFileButton = document.getElementById("newFileButton");
const deleteNodeButton = document.getElementById("deleteNodeButton");
const saveButton = document.getElementById("saveButton");
const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const resetButton = document.getElementById("resetButton");
const importFileInput = document.getElementById("importFileInput");
const status = document.getElementById("status");

let autosaveTimer = null;
let dragSourceId = null;

const expandedFolders = new Set(["root"]);

let workspace = createDefaultWorkspace();

function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
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
              lyrics: `[天球|そら]へ [シルエットダンス|silhouette dance]\\n\\n[世界|せかい]を [越|こ]えていこう`,
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
  const parts = document.cookie.split(";");
  for (const rawPart of parts) {
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
  const json = JSON.stringify(current);
  const encoded = encodeURIComponent(json);

  if (encoded.length > COOKIE_MAX_TOTAL) {
    throw new Error("Workspace too large for cookie storage.");
  }

  const chunkCount = Math.ceil(encoded.length / COOKIE_CHUNK_SIZE);
  const prevMeta = getCookie(COOKIE_META_KEY);
  let previousCount = 0;
  if (prevMeta) {
    const countPart = prevMeta.split(".")[0];
    previousCount = Number.parseInt(countPart, 10) || 0;
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

    const countPart = meta.split(".")[0];
    const chunkCount = Number.parseInt(countPart, 10);
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
    if (!isValidWorkspace(parsed)) {
      return null;
    }

    return parsed;
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

function renderLyrics(rawLyrics) {
  return rawLyrics
    .split("\\n")
    .map((line) => renderLine(line))
    .join("<br>");
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
        lyrics: "",
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

function getSelectedFile() {
  const selected = findNodeWithParentById(workspace.tree, workspace.selectedFileId);
  if (!selected || selected.node.type !== "file") {
    return null;
  }
  return selected.node;
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

function updateEditorFromSelection() {
  const file = getSelectedFile();
  if (!file) {
    fileNameInput.value = "";
    titleInput.value = "";
    lyricsInput.value = "";
    fileNameInput.disabled = true;
    titleInput.disabled = true;
    lyricsInput.disabled = true;
    previewTitle.textContent = "No file selected";
    previewLyrics.innerHTML = "";
    return;
  }

  fileNameInput.disabled = false;
  titleInput.disabled = false;
  lyricsInput.disabled = false;

  fileNameInput.value = file.name;
  titleInput.value = file.title;
  lyricsInput.value = file.lyrics;

  previewTitle.textContent = file.title.trim() || "Untitled";
  previewLyrics.innerHTML = renderLyrics(file.lyrics);
}

function saveEditorToSelection() {
  const file = getSelectedFile();
  if (!file) {
    return;
  }

  file.name = fileNameInput.value.trim() || "untitled-file";
  file.title = titleInput.value;
  file.lyrics = lyricsInput.value;
}

function createFolder() {
  const selected = findNodeWithParentById(workspace.tree, workspace.selectedNodeId);
  let parentFolder = workspace.tree;

  if (selected && selected.parent) {
    parentFolder = selected.parent;
  }

  const focusedNode = findNodeWithParentById(workspace.tree, workspace.selectedNodeId);
  if (focusedNode && focusedNode.node.type === "folder") {
    parentFolder = focusedNode.node;
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

  const focusedNode = findNodeWithParentById(workspace.tree, workspace.selectedNodeId);
  if (focusedNode && focusedNode.node.type === "folder") {
    parentFolder = focusedNode.node;
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
    lyrics: "",
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
  const question = hasChildren
    ? `Delete ${label} and all nested items?`
    : `Delete ${label}?`;

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
  const item = event.currentTarget;
  dragSourceId = item.dataset.nodeId || null;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function handleDragOver(event) {
  event.preventDefault();
  const item = event.currentTarget;
  item.classList.add("drag-over");
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
      saveEditorToSelection();
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
  const blob = new Blob([JSON.stringify(workspace, null, 2)], {
    type: "application/json",
  });
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
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!isValidWorkspace(parsed)) {
      throw new Error("Invalid workspace format.");
    }

    workspace = parsed;
    if (typeof workspace.selectedNodeId !== "string") {
      workspace.selectedNodeId = workspace.selectedFileId;
    }
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

function init() {
  const fromCookie = loadWorkspaceFromCookies();
  workspace = fromCookie || createDefaultWorkspace();
  ensureSelectedFile();
  expandedFolders.add("root");
  renderAll();

  fileNameInput.addEventListener("input", () => {
    saveEditorToSelection();
    renderTree();
    updateEditorFromSelection();
    scheduleAutosave();
  });

  titleInput.addEventListener("input", () => {
    saveEditorToSelection();
    updateEditorFromSelection();
    scheduleAutosave();
  });

  lyricsInput.addEventListener("input", () => {
    saveEditorToSelection();
    updateEditorFromSelection();
    scheduleAutosave();
  });

  newFolderButton.addEventListener("click", createFolder);
  newFileButton.addEventListener("click", createFile);
  deleteNodeButton.addEventListener("click", deleteSelectedNode);

  saveButton.addEventListener("click", () => {
    saveEditorToSelection();
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
}

init();
