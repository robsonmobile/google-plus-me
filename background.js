/*
 * Filename:         background.js
 * More info, see:   gpme.js
 *
 * Web:              http://huyz.us/google-plus-me/
 * Source:           https://github.com/huyz/google-plus-me
 * Author:           Huy Z  http://huyz.us/
 */

// i18n messages
var i18nMessages = {};

var settings = new Store("settings", {
  /*
   * General
   */
  'nav_summaryIncludeThumbnails': false,
  'nav_summaryIncludeTime': false,
  'nav_previewEnableInExpanded': false,
  'nav_previewEnableInList': true,

  /*
   * Pages
   */
  'nav_global_commentsDefaultCollapsed': false,

  /*
   * Compatibility
   */
  'nav_compatSgp': true,
  'nav_compatSgpComments': false,
  'nav_compatSgpCache': false,
});

// Default options
if (localStorage.getItem('gpme_options_mode') == null)
  localStorage.setItem('gpme_options_mode', 'expanded');

// Check installed version
var oldVersion = localStorage.getItem('version');
var version = chrome.app.getDetails().version;
if (version != oldVersion) {
  // NOTE: we don't use the prefix 'gpme_' so that it doesn't get wiped out by a reset
  localStorage.setItem('version', version);

  // If first-time install, inject into any currently-open pages
  if (oldVersion === null) {
    console.log("gpme: looks like first-time install");
    chrome.windows.getAll({populate: true}, function(windows) {
      windows.forEach(function(w) {
        w.tabs.forEach(function(tab) {
          if (tab.url.match(/^https?:\/\/plus\.google\.com\//)) {
            //chrome.tabs.insertCSS(tab.id, {file: 'gpme.css', allFrames: true});
            chrome.tabs.executeScript(tab.id, {file: 'jquery.js', allFrames: true});
            chrome.tabs.executeScript(tab.id, {file: 'jquery.ba-throttle-debounce.js', allFrames: true});
            chrome.tabs.executeScript(tab.id, {file: 'jquery.hoverIntent.js', allFrames: true});
            chrome.tabs.executeScript(tab.id, {file: 'jquery.scrollintoview.js', allFrames: true});
            chrome.tabs.executeScript(tab.id, {file: 'jquery.actual.js', allFrames: true});
            chrome.tabs.executeScript(tab.id, {file: 'gpme.js', allFrames: true});
          }
        });
      });
    });
  }
}

// Listen to incoming messages from content scripts
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  switch (request.action) {
    case 'gpmeStatusUpdate':
      chrome.browserAction.setBadgeText({text: (request.count ? request.count.toString() : "")});
      break;
    case 'gpmeGetModeOption':
      sendResponse(localStorage.getItem('gpme_options_mode'));
      break;
    case 'gpmeGetSettings':
      sendResponse(settings.toObject());
      break;
    case 'gpmeGetMessages':
      MESSAGE_NAMES.forEach(function(name) {
        i18nMessages[name] = chrome.i18n.getMessage(name);
      });
      sendResponse(i18nMessages);
      break;
  }
});

// Listen to tab updates from Chrome, e.g. back and forward buttons
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete' && tab.url.match(/plus\.google\.com\//i)) {
    chrome.tabs.sendRequest(tabId, {action: 'gpmeTabUpdateComplete'});
  }
});
