window.AdbData = {
  enableXPathRules: true,
  enableSelectorRules: true,
  blockMethod: 'removeChild',     // or 'displayNone', 'highlight'
  enableAdbCss: true,
  enableUserCss: true,
  enableExceptionRules: true,
  xpathRules: [ ],
  selectorRules: [ ],
  userCss: "",
  exceptionRules: [ ]
};

window.AdbHelper = {
  saveData: function () {
    localStorage.AdbData = JSON.stringify(window.AdbData);
  }
};

function returnData(sendResponse) {
  sendResponse(JSON.stringify(window.AdbData));
}

function messageDispatcher(request, sender, sendResponse) {
  switch (request.action) {
  case "data":
    returnData(sendResponse);
    break;
  }
}

function onload () {
  if (! localStorage.AdbData) {
    window.AdbData.xpathRules = window.AdbHelper.DEFAULT_XPATH_RULES;
    window.AdbData.selectorRules = window.AdbHelper.DEFAULT_SELECTOR_RULES;
    window.AdbData.exceptionRules = window.AdbHelper.DEFAULT_EXCEPTION_RULES;
    localStorage.AdbData = JSON.stringify(window.AdbData);
  }
  window.AdbData = JSON.parse(localStorage.AdbData);
  chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
                                           messageDispatcher(request, sender, sendResponse);
                                         });
}

window.addEventListener("load", onload);

/*** default rules ***/

window.AdbHelper.DEFAULT_XPATH_RULES = [
  [[], '//*[@class="advertisement"]'],
  [[], '//*[contains(@src, "ad_script")]'],
  [[], '//img[contains(@src, "ad_banner")]'],
  [[], '//a[starts-with(@href, "http://rd") and contains(@href, "yahoo.co.jp/rd")]']
].concat(GENERATED_XPATHS);

window.AdbHelper.DEFAULT_SELECTOR_RULES = [
  [[], 'iframe[src*="adv"]'],
  [[], 'iframe[src*="ads"]'],
  [[], 'iframe[src*="doubleclick.net"]'],
  [[], 'param[src*="hitomedia.jp"][src*="uploads/banner"]'],
  [['mail.google.com'], 'div.oM div[id^=":"] div.vb'],
  [['yahoo.co.jp'], '#brandpanel'],
  [['yahoo.co.jp'], 'div#pos-sqm'],
  [['yahoo.co.jp'], 'div#myjsqb'],
  [['yahoo.co.jp'], 'div.adTyumoku'],
  [['yahoo.co.jp'], 'a[href^="http://ard.yahoo.co.jp/"]'],
  [['yahoo.co.jp'], 'div.myjcentertxt > span.myjct'],
  [['yahoo.co.jp'], '#pos-lrec'],
  [['yahoo.co.jp'], '#pos-ct'],
  [['yahoo.co.jp'], '#myyads'],
  [['yahoo.co.jp'], 'param[value*="ah.yimg.jp/bdv"]'],
  [[], '.adv']
].concat(GENERATED_SELECTORS);

window.AdbHelper.DEFAULT_EXCEPTION_RULES = [
  '^https?://[^/]+\\.go\\.jp/',
  '^https?://[^/]+\\.gov/'
];
