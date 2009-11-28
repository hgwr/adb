window.AdbData = {
  enableXPathRules: false,
  enableSelectorRules: true,
  blockMethod: 'removeChild',     // or 'displayNone', 'highlight'
  enableAdbCss: true,
  enableUserCss: true,
  enableExceptionRules: true,
  enableAbbrevUrl: false,
  xpathRules: [ ],
  xpathRulesText: "",
  selectorRules: [ ],
  selectorRulesText: "",
  userCss: "",
  exceptionRules: [ ],
  exceptionRulesText: "",
  popupForm: { kind: 'selector' }
};

window.AdbHelper = {
  validateRule: function (rule, kind) {
    var result = false;
    try {
      if (kind == 'selector') {
        document.querySelectorAll(rule);
      } else {
        document.evaluate(rule, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      }
    } catch (x) {
      result = x;
    }
    return result;
  },
  
  testPopupRule: function () {
    chrome.tabs.getSelected(null, function (tab) {
      chrome.tabs.sendRequest(tab.id, { action: 'test',
                                        rule: window.AdbData.popupForm.rule,
                                        kind: window.AdbData.popupForm.kind });
    });
  },

  addPopupRule: function () {
    var result, kind = window.AdbData.popupForm.kind,
      rule = window.AdbData.popupForm.rule;
    if (kind != 'xpath' && kind != 'selector') {
      return false;
    }
    result = window.AdbHelper.validateRule(kind, rule);
    if (result) { return; }
    window.AdbData[kind + 'Rules'].unshift([ [], rule ]);
    window.AdbData[kind + 'RulesText'] = rule + "\n" + window.AdbData[kind + 'RulesText'];
    window.AdbData.popupForm.rule = '';
    window.AdbHelper.saveData();
  },

  checkExcepted: function (callback) {
    chrome.tabs.getSelected(null, function (tab) {
      chrome.tabs.sendRequest(tab.id, { action: 'check_excepted',
                                        exceptionRules: window.AdbData.exceptionRules },
                              function (response) { callback(response); });
    });
  },
  
  saveData: function () {
    localStorage.AdbData = JSON.stringify(window.AdbData);
  },
  
  rulesToText: function(rulesArray) {
    if (! rulesArray) { return ""; }
    var rulesText = [],
      i = 0; len = rulesArray.length;
    for (; i < len; i++) {
      if (rulesArray[i][0] && rulesArray[i][0].length > 0) {
        rulesText[i] = ['{', rulesArray[i][0].join('} {'), '} ', rulesArray[i][1]].join('');
      } else {
        rulesText[i] = rulesArray[i][1];
      }
    }
    return rulesText.join("\n");
  }
};

function messageDispatcher(request, sender, sendResponse) {
  if (request.action == 'data') {
    sendResponse(window.AdbData);
  }
}

function onload () {
  if (! localStorage.AdbData) {
    window.AdbData.xpathRules = window.AdbHelper.DEFAULT_XPATH_RULES;
    window.AdbData.xpathRulesText = window.AdbHelper.rulesToText(window.AdbData.xpathRules);
    window.AdbData.selectorRules = window.AdbHelper.DEFAULT_SELECTOR_RULES;
    window.AdbData.selectorRulesText = window.AdbHelper.rulesToText(window.AdbData.selectorRules);
    window.AdbData.exceptionRules = window.AdbHelper.DEFAULT_EXCEPTION_RULES;
    window.AdbData.exceptionRulesText = window.AdbData.exceptionRules.join("\n");
    window.AdbData.popupForm = { };
    localStorage.AdbData = JSON.stringify(window.AdbData);
  }
  window.AdbData = JSON.parse(localStorage.AdbData);
  chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
                                           messageDispatcher(request, sender, sendResponse);
                                         });
}

window.addEventListener("load", onload);

/*** default rules ***/
MARKER = "\n\n!----------------- default values -----------------\n\n";

window.AdbHelper.DEFAULT_XPATH_RULES = [
  [[], '//*[@class="advertisement"]'],
  [[], '//*[contains(@src, "ad_script")]'],
  [[], '//img[contains(@src, "ad_banner")]'],
  [[], '//embed[contains(@src, "clickTAG")]/..'],
  [[], '//a[starts-with(@href, "http://rd") and contains(@href, "yahoo.co.jp/rd")]']
].concat(GENERATED_XPATHS);
window.AdbHelper.DEFAULT_XPATH_RULES_TEXT = MARKER +
  window.AdbHelper.rulesToText(window.AdbHelper.DEFAULT_XPATH_RULES);

window.AdbHelper.DEFAULT_SELECTOR_RULES = [
  [[], 'iframe[src*="adv"]'],
  [[], 'iframe[src*="ads"]'],
  [[], 'iframe[src*="doubleclick.net"]'],
  [[], '.adv']
].concat(GENERATED_SELECTORS);
window.AdbHelper.DEFAULT_SELECTOR_RULES_TEXT = MARKER +
  window.AdbHelper.rulesToText(window.AdbHelper.DEFAULT_SELECTOR_RULES);

window.AdbHelper.DEFAULT_EXCEPTION_RULES = [
  '^https?://[^/]+\\.playstation\\.com/',
  '^https?://[^/]+\\.xbox\\.com/',
  '^https?://[^/]+\\.amazon\\.co\\.jp/',
  '^https?://[^/]+\\.amazon\\.com/',
  '^https?://[^/]+\\.go\\.jp/',
  '^https?://[^/]+\\.gov/'
];
window.AdbHelper.DEFAULT_EXCEPTION_RULES_TEXT = MARKER +
  window.AdbHelper.DEFAULT_EXCEPTION_RULES.join("\n");
