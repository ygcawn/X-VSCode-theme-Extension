chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ vscodeModeEnabled: true });
});

chrome.action.onClicked.addListener(async (tab) => {
  const result = await chrome.storage.local.get("vscodeModeEnabled");
  const current = result.vscodeModeEnabled ?? true;
  const next = !current;

  await chrome.storage.local.set({ vscodeModeEnabled: next });

  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, {
      type: "TOGGLE_VSCODE_MODE",
      enabled: next
    });
  }
});