const ROOT_CLASS = "x-vscode-mode";

const IDS = {
  activityBar: "x-ide-activitybar",
  explorer: "x-ide-explorer",
  topTabs: "x-ide-toptabs",
  editorHeader: "x-ide-editor-header",
  statusBar: "x-ide-statusbar",
  terminal: "x-ide-terminal"
};

let observerStarted = false;
let refreshTimer = null;

function setMode(enabled) {
  if (enabled) {
    document.documentElement.classList.add(ROOT_CLASS);
    document.documentElement.classList.add("x-hide-original-left");
    injectIDEUI();
    refreshTweets();
    hideTrendBlocksKeepSearch();
  } else {
    document.documentElement.classList.remove(ROOT_CLASS);
    document.documentElement.classList.remove("x-hide-original-left");
    removeIDEUI();
    resetCompactTweets();
  }
}

function injectIDEUI() {
  addActivityBar();
  addExplorerPanel();
  addTopTabs();
  addEditorHeader();
  addStatusBar();
  addTerminalPanel();
}

function removeIDEUI() {
  Object.values(IDS).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}

function addActivityBar() {
  if (document.getElementById(IDS.activityBar) || !document.body) return;

  const bar = document.createElement("div");
  bar.id = IDS.activityBar;
  bar.innerHTML = `
    <div class="x-ide-ab-top">
      <button class="x-ide-ab-btn active">≣</button>
      <button class="x-ide-ab-btn">⌕</button>
      <button class="x-ide-ab-btn">⑂</button>
      <button class="x-ide-ab-btn">▷</button>
      <button class="x-ide-ab-btn">▦</button>
    </div>
    <div class="x-ide-ab-bottom">
      <button class="x-ide-ab-btn">◉</button>
      <button class="x-ide-ab-btn">⚙</button>
    </div>
  `;
  document.body.appendChild(bar);
}

function addExplorerPanel() {
  if (document.getElementById(IDS.explorer) || !document.body) return;

  const panel = document.createElement("div");
  panel.id = IDS.explorer;
  panel.innerHTML = `
    <div class="x-ide-panel-title">EXPLORER</div>
    <div class="x-ide-section">
      <div class="x-ide-section-header">OPEN EDITORS</div>
      <div class="x-ide-file active">home.tsx</div>
      <div class="x-ide-file">timeline.json</div>
      <div class="x-ide-file">profile.md</div>
    </div>
    <div class="x-ide-section">
      <div class="x-ide-section-header">WORKSPACE</div>
      <div class="x-ide-folder">src</div>
      <div class="x-ide-file nested">home.tsx</div>
      <div class="x-ide-file nested">notifications.ts</div>
      <div class="x-ide-file nested">messages.ts</div>
      <div class="x-ide-folder">public</div>
      <div class="x-ide-file nested">index.html</div>
      <div class="x-ide-file nested">manifest.json</div>
    </div>
  `;
  document.body.appendChild(panel);
}

function addTopTabs() {
  const primaryColumn = document.querySelector('div[data-testid="primaryColumn"]');
  if (!primaryColumn || document.getElementById(IDS.topTabs)) return;

  const tabs = document.createElement("div");
  tabs.id = IDS.topTabs;
  tabs.innerHTML = `
    <div class="x-ide-tab active"><span>home.tsx</span><span class="x-ide-tab-close">×</span></div>
    <div class="x-ide-tab"><span>explore.ts</span><span class="x-ide-tab-close">×</span></div>
    <div class="x-ide-tab"><span>notifications.ts</span><span class="x-ide-tab-close">×</span></div>
  `;
  primaryColumn.prepend(tabs);
}

function addEditorHeader() {
  if (document.getElementById(IDS.editorHeader)) return;

  const tabs = document.getElementById(IDS.topTabs);
  if (!tabs) return;

  const header = document.createElement("div");
  header.id = IDS.editorHeader;
  header.innerHTML = `
    <span class="x-ide-breadcrumb">src</span>
    <span class="x-ide-breadcrumb-sep">></span>
    <span class="x-ide-breadcrumb">timeline</span>
    <span class="x-ide-breadcrumb-sep">></span>
    <span class="x-ide-breadcrumb current">home.tsx</span>
  `;
  tabs.insertAdjacentElement("afterend", header);
}

function addStatusBar() {
  if (document.getElementById(IDS.statusBar) || !document.body) return;

  const bar = document.createElement("div");
  bar.id = IDS.statusBar;
  bar.innerHTML = `
    <div class="x-ide-status-left">
      <span>X</span><span>main</span><span>0 errors</span><span>0 warnings</span>
    </div>
    <div class="x-ide-status-right">
      <span>UTF-8</span><span>TypeScript React</span><span>Ln 1, Col 1</span><span>Spaces: 2</span>
    </div>
  `;
  document.body.appendChild(bar);
}

function addTerminalPanel() {
  if (document.getElementById(IDS.terminal) || !document.body) return;

  const panel = document.createElement("div");
  panel.id = IDS.terminal;
  panel.innerHTML = `
    <div class="x-ide-terminal-header">
      <span class="active">TERMINAL</span><span>PROBLEMS</span><span>OUTPUT</span><span>DEBUG CONSOLE</span>
    </div>
    <div class="x-ide-terminal-body">
      <div><span class="prompt">PS C:\\Users\\user\\x-project&gt;</span> npm run dev</div>
      <div>Starting development server...</div>
      <div>Compiled successfully.</div>
      <div>Watching timeline.tsx</div>
    </div>
  `;
  document.body.appendChild(panel);
}

function refreshTweets() {
  markTweetsAsEditorLines();
  normalizeTweetHeader();
  compactTweets();
}

function markTweetsAsEditorLines() {
  document.querySelectorAll("article").forEach((article, index) => {
    article.classList.add("x-ide-editor-line");

    let line = article.querySelector(".x-ide-line-number");
    if (!line) {
      line = document.createElement("div");
      line.className = "x-ide-line-number";
      article.prepend(line);
    }
    line.textContent = String(index + 1);
  });
}

function normalizeTweetHeader() {
  document.querySelectorAll("article").forEach((article) => {
    const userName = article.querySelector('[data-testid="User-Name"]');
    if (userName) userName.classList.add("x-ide-userline");
  });
}

/* 핵심: 이모지/프로필이 아니라 실제 사진·비디오 블록만 잡음 */
function getMediaBlocks(article) {
  const set = new Set();

  article.querySelectorAll('[data-testid="tweetPhoto"]').forEach((photo) => {
    const block =
      photo.closest('[data-testid="tweetPhoto"]')?.parentElement ||
      photo.closest('[data-testid="tweetPhoto"]') ||
      photo;

    if (block && block !== article) set.add(block);
  });

  article.querySelectorAll('video').forEach((video) => {
    const block =
      video.closest('[data-testid="videoComponent"]') ||
      video.closest('[aria-label*="동영상"]') ||
      video.closest('[aria-label*="Video"]') ||
      video.parentElement;

    if (block && block !== article) set.add(block);
  });

  return Array.from(set).filter((el) => {
    if (!el) return false;
    if (el.closest('[data-testid="UserAvatar-Container"]')) return false;
    if (el.closest('[data-testid="User-Name"]')) return false;
    if (el.closest(".x-ide-compact-controls")) return false;
    return true;
  });
}

function getQuoteCount(article) {
  const quoteCandidates = Array.from(article.querySelectorAll('a[href*="/status/"]'));

  return quoteCandidates.filter((a) => {
    const text = (a.textContent || "").trim();
    const href = a.getAttribute("href") || "";

    const isTimeLink =
      a.querySelector("time") ||
      text.includes("초") ||
      text.includes("분") ||
      text.includes("시간") ||
      text.includes("일") ||
      text.includes("월") ||
      text.includes("년");

    const isHeader = !!a.closest('[data-testid="User-Name"]');

    return /\/status\/\d+/.test(href) && !isTimeLink && !isHeader;
  }).length;
}

function getReplyCount(article) {
  const replyButton =
    article.querySelector('[data-testid="reply"]') ||
    article.querySelector('[aria-label*="답글"]') ||
    article.querySelector('[aria-label*="Reply"]');

  if (!replyButton) return 0;

  const label = replyButton.getAttribute("aria-label") || replyButton.textContent || "";
  const match = label.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function compactTweets() {
  document.querySelectorAll("article").forEach((article) => {
    if (article.dataset.compactified === "true") return;
    article.dataset.compactified = "true";
    article.classList.add("x-ide-compact-tweet");

    const textNode = article.querySelector('[data-testid="tweetText"]');
    const anchorTarget =
      textNode ||
      article.querySelector('[data-testid="User-Name"]') ||
      article.firstElementChild;

    if (!anchorTarget) return;

    const mediaBlocks = getMediaBlocks(article);
    const quoteCount = getQuoteCount(article);
    const replyCount = getReplyCount(article);

    const actionGroups = article.querySelectorAll('[role="group"]');
    actionGroups.forEach((el) => el.classList.add("x-ide-actions-hidden"));

    mediaBlocks.forEach((el) => {
      el.classList.add("x-ide-media-block");
      el.classList.add("x-ide-media-collapsed");
    });

    const controls = document.createElement("div");
    controls.className = "x-ide-compact-controls";

    if (mediaBlocks.length > 0) {
      controls.appendChild(createMediaToggle(mediaBlocks));
    }

    if (replyCount > 0) {
      controls.appendChild(createInfoBadge("reply", replyCount));
    }

    if (quoteCount > 0) {
      controls.appendChild(createInfoBadge("quote", quoteCount));
    }

    if (controls.children.length > 0) {
      anchorTarget.insertAdjacentElement("afterend", controls);
    }
  });
}

function createMediaToggle(mediaBlocks) {
  const button = document.createElement("button");
  button.className = "x-ide-inline-toggle";
  button.dataset.open = "false";
  button.textContent = `[media ${mediaBlocks.length}]`;

  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const open = button.dataset.open === "true";

    mediaBlocks.forEach((block) => {
      if (open) {
        block.classList.add("x-ide-media-collapsed");
        block.classList.remove("x-ide-media-expanded");
      } else {
        block.classList.remove("x-ide-media-collapsed");
        block.classList.add("x-ide-media-expanded");
      }
    });

    button.dataset.open = String(!open);
    button.textContent = open ? `[media ${mediaBlocks.length}]` : `[hide media]`;
  });

  return button;
}

function createInfoBadge(type, count) {
  const badge = document.createElement("span");
  badge.className = "x-ide-inline-badge";
  badge.textContent = `[${type} ${count}]`;
  return badge;
}

function resetCompactTweets() {
  document.querySelectorAll(".x-ide-compact-controls").forEach((el) => el.remove());
  document.querySelectorAll(".x-ide-line-number").forEach((el) => el.remove());

  document.querySelectorAll(".x-ide-media-block").forEach((el) => {
    el.classList.remove("x-ide-media-block", "x-ide-media-collapsed", "x-ide-media-expanded");
  });

  document.querySelectorAll(".x-ide-actions-hidden").forEach((el) => {
    el.classList.remove("x-ide-actions-hidden");
  });

  document.querySelectorAll("article").forEach((article) => {
    article.dataset.compactified = "false";
    article.classList.remove("x-ide-editor-line", "x-ide-compact-tweet");
  });
}

function hideTrendBlocksKeepSearch() {
  const sidebar = document.querySelector('div[data-testid="sidebarColumn"]');
  if (!sidebar) return;

  sidebar.querySelectorAll("section, div[data-testid='trend']").forEach((el) => {
    const text = (el.textContent || "").trim();
    const hasSearchInput =
      el.querySelector("input") ||
      el.querySelector('[aria-label*="검색"]') ||
      el.querySelector('[aria-label*="Search"]');

    const isTrend =
      text.includes("트렌드") ||
      text.includes("대한민국에서 트렌드 중") ||
      text.includes("Trending");

    if (isTrend && !hasSearchInput) {
      el.style.display = "none";
    }
  });
}

function applyStoredMode() {
  chrome.storage.local.get("vscodeModeEnabled", (result) => {
    setMode(result.vscodeModeEnabled ?? true);
  });
}

function scheduleRefresh() {
  if (!document.documentElement.classList.contains(ROOT_CLASS)) return;

  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    document.documentElement.classList.add("x-hide-original-left");
    addTopTabs();
    addEditorHeader();
    refreshTweets();
    hideTrendBlocksKeepSearch();
  }, 300);
}

function observePage() {
  if (observerStarted || !document.body) return;
  observerStarted = true;

  const observer = new MutationObserver(() => {
    scheduleRefresh();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE_VSCODE_MODE") {
    setMode(message.enabled);
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    applyStoredMode();
    observePage();
  });
} else {
  applyStoredMode();
  observePage();
}