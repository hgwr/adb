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
    var i = 0, j = 0, len, xpathResult;
    for (; i < rules.length; i++) {      
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
    var i = 0, j = 0, nodes, len;
    for (; i < rules.length; i++) {
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
  },

  onload: function () {
    chrome.extension.sendRequest({action: "data"},
                                 function(response) {
                                   Adb.applyData(JSON.parse(response));
                                 });
  }
};

document.addEventListener("DOMContentLoaded", Adb.onload);
// window.addEventListener("load", Adb.onload);
