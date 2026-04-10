const COOKIE_META_KEY = "lyra_workspace_meta";
const COOKIE_DATA_PREFIX = "lyra_workspace_data_";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const COOKIE_CHUNK_SIZE = 3300;
const COOKIE_MAX_TOTAL = 60000;
const LOCAL_SETTINGS_KEY = "lyra_settings_v1";

const treeRoot = document.getElementById("treeRoot");
const fileNameInput = document.getElementById("fileNameInput");
const titleInput = document.getElementById("titleInput");
const lyricsEditor = document.getElementById("lyricsEditor");
const lineNumbers = document.getElementById("lineNumbers");
const lineNumbersContent = document.getElementById("lineNumbersContent");
const previewTitle = document.getElementById("previewTitle");
const previewLyrics = document.getElementById("previewLyrics");

const newFolderButton = document.getElementById("newFolderButton");
const newFileButton = document.getElementById("newFileButton");
const renameFolderButton = document.getElementById("renameFolderButton");
const deleteNodeButton = document.getElementById("deleteNodeButton");

const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");

const toggleEditorLayoutButton = document.getElementById("toggleEditorLayoutButton");
const togglePreviewLayoutButton = document.getElementById("togglePreviewLayoutButton");
const compactPreviewButton = document.getElementById("compactPreviewButton");
const exportPdfButton = document.getElementById("exportPdfButton");
const colorNamesInput = document.getElementById("colorNamesInput");
const saveColorNamesButton = document.getElementById("saveColorNamesButton");

const importFileInput = document.getElementById("importFileInput");
const status = document.getElementById("status");

let autosaveTimer = null;
let dragSourceId = null;
let hasUnsavedOversizeChanges = false;
const expandedFolders = new Set(["root"]);
let workspace = createDefaultWorkspace();

function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function createRow(lyrics = "", comment = "") {
  return {
    id: createId(),
    lyrics,
    comment,
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
                createRow("[天球|そら]へ [シルエットダンス|silhouette dance]", "audience sing together"),
                createRow("[世界|せかい]を [越|こ]えていこう", "__clap__ on every strong beat"),
              ],
            },
          ],
        },
      ],
    },
    selectedFileId: songFileId,
    selectedNodeId: songFileId,
    settings: {
      customColors: {},
    },
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

function saveSettingsToLocal(settings) {
  try {
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings || { customColors: {} }));
  } catch {
    // ignore localStorage failures (private mode/quota/security)
  }
}

function loadSettingsFromLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
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

function normalizeFileNode(node, seen = new WeakSet()) {
  if (!node || typeof node !== "object") {
    return null;
  }

  if (seen.has(node)) {
    return null;
  }
  seen.add(node);

  if (node.type === "file") {
    if (!Array.isArray(node.rows)) {
      const legacyLyrics = typeof node.lyrics === "string" ? node.lyrics : "";
      node.rows = legacyLyrics.split("\n").map((line) => createRow(line, ""));
      if (node.rows.length === 0) {
        node.rows = [createRow("", "")];
      }
      delete node.lyrics;
    }

    node.rows = node.rows.map((row) => ({
      id: typeof row.id === "string" ? row.id : createId(),
      lyrics: typeof row.lyrics === "string" ? row.lyrics : "",
      comment:
        typeof row.comment === "string"
          ? row.comment
          : typeof row.note === "string"
            ? row.note
            : "",
    }));

    if (node.rows.length === 0) {
      node.rows = [createRow("", "")];
    }

    if (typeof node.name !== "string") {
      node.name = "untitled-file";
    }
    if (typeof node.title !== "string") {
      node.title = "Untitled";
    }
    return node;
  }

  if (node.type !== "folder") {
    node.type = "folder";
    node.name = typeof node.name === "string" ? node.name : "Folder";
    node.children = [];
    return node;
  }

  if (typeof node.name !== "string") {
    node.name = "Folder";
  }

  if (!Array.isArray(node.children)) {
    node.children = [];
  }

  const normalizedChildren = [];
  for (const child of node.children) {
    const normalizedChild = normalizeFileNode(child, seen);
    if (!normalizedChild) {
      continue;
    }
    if (normalizedChild.type === "file" || normalizedChild.type === "folder") {
      normalizedChildren.push(normalizedChild);
    }
  }
  node.children = normalizedChildren;
  return node;
}

function normalizeWorkspaceData() {
  const normalizedRoot = normalizeFileNode(workspace.tree);
  if (!normalizedRoot || normalizedRoot.type !== "folder") {
    throw new Error("Invalid workspace root");
  }
  normalizedRoot.id = "root";
  workspace.tree = normalizedRoot;

  if (typeof workspace.selectedNodeId !== "string") {
    workspace.selectedNodeId = workspace.selectedFileId;
  }

  if (!workspace.settings || typeof workspace.settings !== "object") {
    workspace.settings = { customColors: {} };
  }
  if (!workspace.settings.customColors || typeof workspace.settings.customColors !== "object") {
    workspace.settings.customColors = {};
  }

  const cleanedColors = {};
  for (const [rawName, rawValue] of Object.entries(workspace.settings.customColors)) {
    if (typeof rawName !== "string" || typeof rawValue !== "string") {
      continue;
    }
    const name = rawName.trim().toLowerCase();
    const hex = rawValue.trim();
    if (!/^[a-z][a-z0-9_-]*$/i.test(name)) {
      continue;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
      continue;
    }
    cleanedColors[name] = hex.toLowerCase();
  }
  workspace.settings.customColors = cleanedColors;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderStyledText(rawText) {
  let output = escapeHtml(rawText);

  output = output.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/__(.+?)__/g, "<u>$1</u>");

  return output;
}

function resolveColorToken(token) {
  const value = token.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toLowerCase();
  }
  if (!/^[a-z][a-z0-9_-]*$/i.test(value)) {
    return null;
  }
  const color = workspace.settings?.customColors?.[value.toLowerCase()];
  return typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color) ? color.toLowerCase() : null;
}

function renderLine(line) {
  const pieces = [];
  let i = 0;
  let activeColor = null;

  while (i < line.length) {
    const openColor = line.slice(i).match(/^\{([a-zA-Z][a-zA-Z0-9_-]*|#[0-9a-fA-F]{6})\}/);
    if (openColor && !activeColor) {
      const resolved = resolveColorToken(openColor[1]);
      if (resolved) {
        activeColor = resolved;
        pieces.push(`<span style="color:${activeColor}">`);
        i += openColor[0].length;
        continue;
      }
    }

    if (line.startsWith("{/color}", i) && activeColor) {
      pieces.push("</span>");
      activeColor = null;
      i += "{/color}".length;
      continue;
    }

    if (line[i] === "[") {
      const close = line.indexOf("]", i + 1);
      if (close === -1) {
        pieces.push(renderStyledText(line.slice(i)));
        break;
      }

      const inner = line.slice(i + 1, close);
      const separator = inner.indexOf("|");
      if (separator === -1) {
        pieces.push(renderStyledText(line.slice(i, close + 1)));
        i = close + 1;
        continue;
      }

      const base = inner.slice(0, separator).trim();
      const phonetic = inner.slice(separator + 1).trim();
      if (!base || !phonetic) {
        pieces.push(renderStyledText(line.slice(i, close + 1)));
        i = close + 1;
        continue;
      }

      pieces.push(`<ruby>${renderStyledText(base)}<rt>${renderStyledText(phonetic)}</rt></ruby>`);
      i = close + 1;
      continue;
    }

    if (line[i] === "{") {
      pieces.push(renderStyledText(line[i]));
      i += 1;
      continue;
    }

    const nextRuby = line.indexOf("[", i);
    const nextCurly = line.indexOf("{", i);
    const nextOpenColor = line.indexOf("{#", i);
    const nextCloseColor = line.indexOf("{/color}", i);
    const nextSpecial = [nextRuby, nextCurly, nextOpenColor, nextCloseColor]
      .filter((pos) => pos !== -1)
      .reduce((min, pos) => Math.min(min, pos), line.length);

    pieces.push(renderStyledText(line.slice(i, nextSpecial)));
    i = nextSpecial;
  }

  if (activeColor) {
    pieces.push("</span>");
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
        rows: [createRow("", "")],
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

function colorNamesToEditorText(colorMap) {
  const entries = Object.entries(colorMap || {}).sort((a, b) => a[0].localeCompare(b[0]));
  return entries.map(([name, hex]) => `${name} = ${hex}`).join("\n");
}

function parseColorNamesEditorText(text) {
  const result = {};
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i].trim();
    if (!raw || raw.startsWith("#") || raw.startsWith("//")) {
      continue;
    }
    const match = raw.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(#[0-9a-fA-F]{6})$/);
    if (!match) {
      return { ok: false, error: `Invalid color at line ${i + 1}. Use: name = #RRGGBB` };
    }
    result[match[1].toLowerCase()] = match[2].toLowerCase();
  }
  return { ok: true, value: result };
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
    saveSettingsToLocal(workspace.settings);
    hasUnsavedOversizeChanges = false;
    showStatus("Saved to cookies.");
  } catch (error) {
    saveSettingsToLocal(workspace.settings);
    const message = error instanceof Error ? error.message : "Save failed.";
    if (message.includes("Workspace too large")) {
      hasUnsavedOversizeChanges = true;
    }
    showStatus(message);
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
  refreshLayoutToggleLabels();
}

function refreshLayoutToggleLabels() {
  const isEditorMax = document.body.classList.contains("focus-editor");
  const isPreviewMax = document.body.classList.contains("focus-preview");
  toggleEditorLayoutButton.textContent = isEditorMax ? "Exit Max Editor" : "Max Editor";
  togglePreviewLayoutButton.textContent = isPreviewMax ? "Exit Max Preview" : "Max Preview";
}

function toggleEditorLayout() {
  if (document.body.classList.contains("focus-editor")) {
    setLayoutMode("normal");
    return;
  }
  setLayoutMode("editor");
}

function togglePreviewLayout() {
  if (document.body.classList.contains("focus-preview")) {
    setLayoutMode("normal");
    return;
  }
  setLayoutMode("preview");
}

function setCompactPreview(enabled) {
  document.body.classList.toggle("compact-preview", enabled);
  compactPreviewButton.setAttribute("aria-pressed", enabled ? "true" : "false");
  compactPreviewButton.textContent = enabled ? "Compact On" : "Compact";
}

function rowsToEditorText(rows) {
  const lines = [];
  for (const row of rows) {
    lines.push(row.lyrics || "");
    lines.push(row.comment || "");
  }
  return lines.join("\n");
}

function editorTextToRows(text, previousRows = []) {
  const lines = text.split("\n");
  const rows = [];

  for (let i = 0; i < lines.length; i += 2) {
    const lyrics = lines[i] ?? "";
    const comment = lines[i + 1] ?? "";
    rows.push({
      id: previousRows[Math.floor(i / 2)]?.id || createId(),
      lyrics,
      comment,
    });
  }

  if (rows.length === 0) {
    rows.push(createRow("", ""));
  }

  return rows;
}

function refreshLineNumbers() {
  const lineCount = Math.max(1, lyricsEditor.value.split("\n").length);
  const numbers = [];
  for (let i = 1; i <= lineCount; i += 1) {
    if (i % 2 === 1) {
      numbers.push(String((i + 1) / 2));
    } else {
      numbers.push("");
    }
  }
  lineNumbersContent.textContent = numbers.join("\n");
  const y = Math.round(lyricsEditor.scrollTop);
  lineNumbersContent.style.transform = `translateY(${-y}px)`;
  lineNumbers.style.backgroundPositionY = `${-y}px`;
}

function renderPreviewRows(file) {
  previewLyrics.innerHTML = "";

  for (const row of file.rows) {
    const wrap = document.createElement("div");
    wrap.className = "preview-row";

    const lyricLine = document.createElement("div");
    lyricLine.className = "preview-line lyric";
    lyricLine.innerHTML = renderLine(row.lyrics || " ");

    const commentLine = document.createElement("div");
    commentLine.className = "preview-line note";
    commentLine.innerHTML = renderLine(row.comment || " ");

    wrap.append(lyricLine, commentLine);
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
    lyricsEditor.value = "";
    lyricsEditor.disabled = true;
    refreshLineNumbers();
    previewTitle.textContent = "No file selected";
    previewLyrics.innerHTML = "";
    return;
  }

  fileNameInput.disabled = false;
  titleInput.disabled = false;
  lyricsEditor.disabled = false;

  fileNameInput.value = file.name;
  titleInput.value = file.title;
  lyricsEditor.value = rowsToEditorText(file.rows);
  refreshLineNumbers();
  previewTitle.textContent = file.title.trim() || "Untitled";

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

function syncEditorToSelectedFile() {
  const file = getSelectedFile();
  if (!file) {
    return;
  }
  file.rows = editorTextToRows(lyricsEditor.value, file.rows);
  renderPreviewRows(file);
  scheduleAutosave();
}

function wrapSelection(input, prefix, suffix) {
  const start = input.selectionStart ?? 0;
  const end = input.selectionEnd ?? 0;
  const selected = input.value.slice(start, end);
  input.setRangeText(`${prefix}${selected}${suffix}`, start, end, "select");
  input.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
  syncEditorToSelectedFile();
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

  const folder = {
    id: createId(),
    type: "folder",
    name: "new-folder",
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

  const file = {
    id: createId(),
    type: "file",
    name: "new-lyrics",
    title: "Untitled",
    rows: [createRow("", "")],
  };

  parentFolder.children.push(file);
  workspace.selectedFileId = file.id;
  workspace.selectedNodeId = file.id;
  expandedFolders.add(parentFolder.id);
  renderAll();
  scheduleAutosave();
}

function renameSelectedFolder() {
  const hit = findNodeWithParentById(workspace.tree, workspace.selectedNodeId);
  if (!hit || hit.node.type !== "folder") {
    showStatus("Select a folder to rename.");
    return;
  }

  if (hit.node.id === "root") {
    showStatus("Root folder cannot be renamed.");
    return;
  }

  const nextName = window.prompt("Folder name:", hit.node.name);
  if (!nextName) {
    return;
  }

  hit.node.name = nextName.trim() || hit.node.name;
  renderTree();
  scheduleAutosave();
}

function moveSelectedFile(delta) {
  const hit = findNodeWithParentById(workspace.tree, workspace.selectedNodeId);
  if (!hit || !hit.parent || hit.node.type !== "file") {
    showStatus("Select a file to reorder.");
    return;
  }

  const siblings = hit.parent.children;
  const index = siblings.findIndex((child) => child.id === hit.node.id);
  if (index === -1) {
    return;
  }

  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= siblings.length) {
    return;
  }

  const temp = siblings[index];
  siblings[index] = siblings[nextIndex];
  siblings[nextIndex] = temp;

  renderTree();
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

function moveNode(sourceId, targetId, options = {}) {
  const { dropInsideFolder = false, placeBefore = false } = options;
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
      const insertAt = placeBefore ? index : index + 1;
      parent.children.splice(insertAt, 0, sourceHit.node);
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
  const item = event.currentTarget;
  item.classList.remove("drag-over", "drag-over-before", "drag-over-after");

  const targetType = item.dataset.nodeType;
  if (targetType === "folder") {
    item.classList.add("drag-over");
    return;
  }

  const rect = item.getBoundingClientRect();
  const isBefore = event.clientY < rect.top + rect.height / 2;
  item.classList.add(isBefore ? "drag-over-before" : "drag-over-after");
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove("drag-over", "drag-over-before", "drag-over-after");
}

function handleDrop(event) {
  event.preventDefault();
  const item = event.currentTarget;
  const placeBefore = item.classList.contains("drag-over-before");
  item.classList.remove("drag-over", "drag-over-before", "drag-over-after");

  const targetId = item.dataset.nodeId;
  const targetType = item.dataset.nodeType;
  if (!dragSourceId || !targetId || dragSourceId === targetId) {
    dragSourceId = null;
    return;
  }

  moveNode(dragSourceId, targetId, {
    dropInsideFolder: targetType === "folder",
    placeBefore,
  });
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

function exportCurrentFileAsPdf() {
  const file = getSelectedFile();
  if (!file) {
    showStatus("Select a file first.");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    showStatus("Popup blocked. Please allow popups for PDF export.");
    return;
  }

  const rowsHtml = file.rows
    .map((row) => {
      const lyric = renderLine(row.lyrics || " ");
      const note = renderLine(row.comment || " ");
      return `
        <div class="row">
          <div class="lyric">${lyric}</div>
          <div class="note">${note}</div>
        </div>
      `;
    })
    .join("");

  const title = escapeHtml(file.title?.trim() || "Untitled");
  const fileName = escapeHtml(file.name || "untitled-file");

  printWindow.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body {
      margin: 0;
      color: #111;
      font-family: "Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", serif;
      line-height: 1.45;
      background: #fff;
    }
    h1 {
      margin: 0 0 4px;
      font-size: 22px;
      line-height: 1.2;
    }
    .meta {
      color: #555;
      font-family: "JetBrains Mono", "Consolas", "Menlo", "Monaco", monospace;
      font-size: 12px;
      margin-bottom: 6px;
    }
    .row {
      margin: 0 0 2px;
      break-inside: avoid;
    }
    .lyric {
      padding: 0;
      font-size: 15px;
      line-height: 1.45;
      white-space: pre-wrap;
    }
    .note {
      padding: 0 0 1px;
      color: #555;
      font-size: 12px;
      line-height: 1.25;
      white-space: pre-wrap;
    }
    ruby rt {
      font-size: 0.58em;
      color: #8a2a1a;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">File: ${fileName}</div>
  ${rowsHtml}
</body>
</html>`);

  printWindow.document.close();
  printWindow.focus();
  printWindow.onafterprint = () => {
    printWindow.close();
  };
  setTimeout(() => {
    printWindow.print();
  }, 120);
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
    colorNamesInput.value = colorNamesToEditorText(workspace.settings.customColors);
    saveSettingsToLocal(workspace.settings);
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

  lyricsEditor.addEventListener("input", () => {
    syncEditorToSelectedFile();
    refreshLineNumbers();
  });

  lyricsEditor.addEventListener("scroll", () => {
    const y = Math.round(lyricsEditor.scrollTop);
    lineNumbersContent.style.transform = `translateY(${-y}px)`;
    lineNumbers.style.backgroundPositionY = `${-y}px`;
  });

  lyricsEditor.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) {
      return;
    }

    const ctrl = event.ctrlKey || event.metaKey;
    if (!ctrl) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      wrapSelection(target, "**", "**");
      return;
    }

    if (key === "u") {
      event.preventDefault();
      wrapSelection(target, "__", "__");
      return;
    }

    if (key === "l") {
      event.preventDefault();
      const picked = window.prompt("Color token (#RRGGBB or custom name):", "#dEaD64");
      if (!picked) {
        return;
      }

      const token = picked.trim();
      if (!/^#[0-9a-fA-F]{6}$/.test(token) && !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(token)) {
        showStatus("Use #RRGGBB or a custom color name.");
        return;
      }

      wrapSelection(target, `{${token}}`, "{/color}");
    }
  });

}

function bindActionEvents() {
  newFolderButton.addEventListener("click", createFolder);
  newFileButton.addEventListener("click", createFile);
  renameFolderButton.addEventListener("click", renameSelectedFolder);
  deleteNodeButton.addEventListener("click", deleteSelectedNode);

  exportButton.addEventListener("click", exportWorkspace);
  importButton.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", importWorkspaceFromFile);

  toggleEditorLayoutButton.addEventListener("click", toggleEditorLayout);
  togglePreviewLayoutButton.addEventListener("click", togglePreviewLayout);
  compactPreviewButton.addEventListener("click", () => {
    setCompactPreview(!document.body.classList.contains("compact-preview"));
  });
  exportPdfButton.addEventListener("click", exportCurrentFileAsPdf);
  saveColorNamesButton.addEventListener("click", () => {
    const parsed = parseColorNamesEditorText(colorNamesInput.value || "");
    if (!parsed.ok) {
      showStatus(parsed.error);
      return;
    }
    workspace.settings.customColors = parsed.value;
    saveSettingsToLocal(workspace.settings);
    renderPreviewRows(getSelectedFile() || { rows: [] });
    scheduleAutosave();
    showStatus("Custom color names saved.");
  });

  window.addEventListener("beforeunload", (event) => {
    if (!hasUnsavedOversizeChanges) {
      return;
    }
    event.preventDefault();
    event.returnValue = "";
  });
}

function init() {
  try {
    const fromCookie = loadWorkspaceFromCookies();
    workspace = fromCookie || createDefaultWorkspace();

    normalizeWorkspaceData();
    const localSettings = loadSettingsFromLocal();
    if (localSettings && typeof localSettings === "object") {
      workspace.settings = {
        ...workspace.settings,
        ...localSettings,
        customColors: {
          ...(workspace.settings?.customColors || {}),
          ...(localSettings.customColors || {}),
        },
      };
      normalizeWorkspaceData();
    }
    ensureSelectedFile();
    expandedFolders.add("root");
    renderAll();
  } catch {
    clearWorkspaceCookies();
    workspace = createDefaultWorkspace();
    normalizeWorkspaceData();
    ensureSelectedFile();
    expandedFolders.add("root");
    renderAll();
    showStatus("Workspace data was corrupted and has been reset.");
  }

  colorNamesInput.value = colorNamesToEditorText(workspace.settings.customColors);

  bindEditorEvents();
  bindActionEvents();
  refreshLineNumbers();
  setCompactPreview(false);
  refreshLayoutToggleLabels();
}

init();
