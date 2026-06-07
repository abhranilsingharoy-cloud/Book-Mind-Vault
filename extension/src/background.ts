const API_URL = 'http://localhost:3000/api/bookmarks'; // Use prod URL in production

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-quote",
    title: "Save to MindVault",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "save-quote" && info.selectionText) {
    saveToMindVault({
      url: tab?.url || '',
      title: tab?.title || '',
      selectedText: info.selectionText
    }, tab?.id);
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "save-bookmark") {
    saveToMindVault({
      url: tab?.url || '',
      title: tab?.title || '',
      selectedText: ''
    }, tab?.id);
  }
});

async function saveToMindVault(data: { url: string, title: string, selectedText: string }, tabId?: number) {
  try {
    const { token } = await chrome.storage.local.get('token');
    
    // Fallback logic for auth would be more robust in prod
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });

    if (response.ok && tabId) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content.ts']
      }).then(() => {
        chrome.tabs.sendMessage(tabId, { action: "show-toast", message: "Saved ✓" });
      }).catch(e => console.error("Scripting error", e));
    } else {
      console.error('Failed to save to MindVault', await response.text());
    }
  } catch (error) {
    console.error('Error saving:', error);
  }
}
