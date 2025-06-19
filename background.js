const browserAPI = typeof chrome !== 'undefined' ? chrome : browser;

const SUPPORTED_URLS = [
  'https://chat.openai.com',
  'https://chatgpt.com',
  'https://claude.ai',
  'https://poe.com'
];

// Listen for tab updates
browserAPI.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    try {
      // Check if tab exists and has a valid URL
      if (tab && tab.url) {
        const currentUrl = tab.url.toLowerCase();
        const isSupported = SUPPORTED_URLS.some(url => currentUrl.includes(url));
        
        if (isSupported) {
          browserAPI.action.enable(tabId);
        } else {
          browserAPI.action.disable(tabId);
        }
      } else {
        // If tab URL isn't available, disable the action
        browserAPI.action.disable(tabId);
      }
    } catch (error) {
      console.error("Error checking tab URL:", error);
      browserAPI.action.disable(tabId);
    }
  }
});

// Keyboard shortcut to export current chat in Markdown
browserAPI.commands.onCommand.addListener(command => {
  if (command === 'quick_export') {
    browserAPI.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs && tabs.length > 0) {
        browserAPI.tabs.sendMessage(
          tabs[0].id,
          { action: 'extract', format: 'markdown' }
        );
      }
    });
  }
});

// Listen for messages from popup.js
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract") {
    browserAPI.tabs.query({active: true, currentWindow: true}, function(tabs) {
      try {
        if (tabs && tabs.length > 0) {
          browserAPI.tabs.sendMessage(tabs[0].id, {action: "extract", format: request.format}, function(response) {
            sendResponse(response || {success: false, error: "No response from content script"});
          });
        } else {
          sendResponse({success: false, error: "No active tab found"});
        }
      } catch (error) {
        console.error("Error in extract action:", error);
        sendResponse({success: false, error: error.message});
      }
    });
    return true;  // Indicates that we will send a response asynchronously
  } else if (request.action === "detectPlatform") {
    browserAPI.tabs.query({active: true, currentWindow: true}, function(tabs) {
      try {
        if (tabs && tabs.length > 0) {
          browserAPI.tabs.sendMessage(tabs[0].id, {action: "detectPlatform"}, function(response) {
            sendResponse(response || {success: false, error: "No response from content script"});
          });
        } else {
          sendResponse({success: false, error: "No active tab found"});
        }
      } catch (error) {
        console.error("Error in detectPlatform action:", error);
        sendResponse({success: false, error: error.message});
      }
    });
    return true;  // Indicates that we will send a response asynchronously
  }
});
