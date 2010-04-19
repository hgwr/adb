var Adb = {
  addStyleSheet: function(url) {
		var head = document.getElementsByTagName("head")[0],
        link = document.createElement('link');
		link.rel = "stylesheet";
		link.type = "text/css";
		link.href = url;
    head.appendChild(link);
  },

  addUserStyleSheet: function(css) {
		var head = document.getElementsByTagName("head")[0],
        style = document.createElement('style'),
        styleBody = document.createTextNode(css);
		style.type = "text/css";
    style.appendChild(styleBody);
    head.appendChild(style);
  },

  nodeOperators: {
    removeChild: function (node) {
      var parent = node.parentNode || node.parentElement;
      parent.removeChild(node);
    },
    displayNone: function (node) {
      node.style.display = 'none';
    },
    highlight: function (node) {
      node.style.borderWidth = '3px';
      node.style.borderColor = 'red';
      node.style.borderStyle = 'solid';
    },
    test: function (node) {
      var origDisplay = node.style.display;
      node.style.display = 'none';
      window.setTimeout(function () { node.style.display = origDisplay; }, 3000);
    }
  },

  assertLocation: function(regexes) {
    var match = location.href.match(new RegExp(regexes[0]));
    if (match && regexes[1]) {
      match = ! location.href.match(new RegExp(regexes[1]));
    }
    return match;
  },

  applyNodeOperator: function (blockMethod, node) {
    var msg = arguments[2] || '';
    try {
      blockMethod(node);
    } catch (x) {
      console.log("applyNodeOperator(" + node + ") Error: " + x + msg);
    }    
  },

  applyXPathRules: function (blockMethod, rules) {
    var i = 0, j = 0, len, xpathResult, rules_len = rules.length;
    for (; i < rules_len; i++) {      
      if (! Adb.assertLocation(rules[i][0])) { continue; }
      xpathResult = null;
      try {
        xpathResult = document.evaluate(rules[i][1], document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      } catch (x) {
        console.log("document.evaluate() Error: " + x);
      }
      if (! xpathResult) { continue; }
      len = xpathResult.snapshotLength;
      for (j = 0; j < len; j++) {
        Adb.applyNodeOperator(blockMethod, xpathResult.snapshotItem(j), '  @XPath rule #' + i + '{' + rules[i][0] + '} ' + rules[i][1]);
      }
    }
  },

  applySelectorRules: function (blockMethod, rules) {
    var i = 0, j = 0, nodes, len, rules_len = rules.length;
    for (; i < rules_len; i++) {
      if (! Adb.assertLocation(rules[i][0])) { continue; }
      nodes = null;
      try {
        nodes = document.querySelectorAll(rules[i][1]);
      } catch (x) {
        console.log("document.querySelectorAll() Error: " + x);
      }
      if (! nodes) { continue; }
      len = nodes.length;
      for (j = 0; j < len; j++) {
        Adb.applyNodeOperator(blockMethod, nodes[j], '  @Selector rule #' + i + ' {' + rules[i][0] + '} ' + rules[i][1]);
      }
    }
  },

  abbrevRules: [
    [ 'a[href*="amazon.co.jp"], a[href*="amazon.jp"], a[href*="amazon.com"], a[href*="amazon.co.uk"]',
      new RegExp('^https?://(?:www.)?amazon(\\.co\\.jp|\\.jp|\\.com|\\.co\\.uk)/.*/?(?:exec/obidos/ASIN|o/ASIN|dp)/([0-9A-Z]{10,})/?.*'),
      'http://www.amazon$1/dp/$2/' ],
    [ 'a[href*="afl.rakuten.co.jp/"]',
      new RegExp('^https?://[^/]+?\\.afl\\.rakuten\\.co\\.jp/.*(?:url|pc)=(http[^&]+)&?.*'),
      '$1',
      function (s) { return decodeURIComponent(s); } ]
  ],
  
  abbrevUrl: function() {
    var nodes, a, i = 0, j = 0, selector, r, s, f, newUrl, rules_len = Adb.abbrevRules.length;
    for (; i < rules_len; i++) {
      selector = Adb.abbrevRules[i][0];
      r = Adb.abbrevRules[i][1];
      s = Adb.abbrevRules[i][2];
      f = Adb.abbrevRules[i][3];
      nodes = document.querySelectorAll(selector);
      for (j = 0; j < nodes.length; j++) {
        a = nodes[j];
        newUrl = a.href.replace(r, s);
        if (f) { newUrl = f(newUrl); }
        a.setAttribute("href", newUrl);
      }
    }
  },

  applyData: function (data) {
    var blockMethod = Adb.nodeOperators[data.blockMethod],
      i = 0, len = 0;
    
    if (data.enableExceptionRules) {
      len = data.exceptionRules.length;
      for (; i < len; i++) {
        if (Adb.assertLocation([data.exceptionRules[i]])) {
          return;
        }
      }
    }

    if (data.enableXPathRules && blockMethod) {
      Adb.applyXPathRules(blockMethod, data.xpathRules);
    }
    if (data.enableSelectorRules && blockMethod) {
      Adb.applySelectorRules(blockMethod, data.selectorRules);
    }
    if (data.enableAdbCss) {
      Adb.addStyleSheet(chrome.extension.getURL("adb.css"));
    }
    if (data.enableUserCss) {
      Adb.addUserStyleSheet(data.userCss);
    }
    if (data.enableAbbrevUrl) {
      Adb.abbrevUrl();
    }
  },

  requestHandler: function(request, sender, sendResponse) {
    if (request.action == "test") {
      if (request.kind == 'xpath') {
        Adb.applyXPathRules(Adb.nodeOperators.test, [ [[], request.rule] ]);
      } else if (request.kind == 'selector') {
        Adb.applySelectorRules(Adb.nodeOperators.test, [ [[], request.rule] ]);
      }
      sendResponse({});    
    } else if (request.action == "check_excepted") {
      var i = 0, len = request.exceptionRules.length;
      for (; i < len; i++) {
        if (Adb.assertLocation([request.exceptionRules[i]])) {
          sendResponse({ excepted: true });
          return;
        }
      }      
      sendResponse({ excepted: false });
    } else {
      sendResponse({});
    }
  },

  onload: function () {
    chrome.extension.sendRequest({action: "data"}, function (response) { Adb.applyData(response); });
    chrome.extension.onRequest.addListener(Adb.requestHandler);
  }
};

document.addEventListener("DOMContentLoaded", Adb.onload);
// window.addEventListener("load", Adb.onload);
