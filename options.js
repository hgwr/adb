var bg = chrome.extension.getBackgroundPage(),
  checkBoxToTextarea = {
    enableXPathRules: 'xpathRules',
    enableSelectorRules: 'selectorRules',
    enableAdbCss: null,
    enableUserCss: 'userCss',
    enableExceptionRules: 'exceptionRules',
    enableAbbrevUrl: null
  },
  checkBoxes = [];

for (k in checkBoxToTextarea) {
  if (checkBoxToTextarea.hasOwnProperty(k)) {
    checkBoxes.push(k);
  }
}

function $(s) { return document.getElementById(s); }

function createCheckboxListener(name) {
  return function () {
    bg.AdbData[name] = $(name).checked;
    if (checkBoxToTextarea[name]) {
      $(checkBoxToTextarea[name]).disabled = !bg.AdbData[name];
    }
    bg.AdbHelper.saveData();
  };
}

function setBlockMethod() {
  var i = 0; radios = document.forms[0].blockMethod;
  for (; i < radios.length; i++) {
    if (radios[i].checked) {
      bg.AdbData.blockMethod = radios[i].value;
      bg.AdbHelper.saveData();
      break;
    }
  }
}

var ruleRe = new RegExp('^(?:{(.*?)}(?: *{(.+?)})?)? *(.+) *');

function isBlank (val) {
    return val.replace(/[ \t]+$/, '').replace(/^[ \t]+/, '').length === 0;
}

function updateRules(key, ruleEval) {
  return function () {
    var textarea = $(key),
        evaluationResult = $('evaluationResult'),
        newRule = null, newRules = [],
        text = textarea.value,
        lines = text.split("\n"),
        i = 0, j = 0, errors = [], m;
    for (; i < lines.length; i++) {
      if (isBlank(lines[i])) { continue; }
      if (lines[i][0] === '!') { continue; } // comment line
      m = lines[i].match(ruleRe);
      if (m && m[1] && m[2]) {
        newRule = [[m[1], m[2]], m[3]];
      } else if (m && m[1]) {
        newRule = [[m[1]], m[3]];
      } else {
        newRule = [[], lines[i]];
      }
      for (j = 0; j < newRule[0].length; j++) {
        try {
          new RegExp(newRule[0][j]);
        } catch (e) {
          errors.push(e + ", line " + (i+1) + ": " + newRule[0][j]);
        }
      }
      try {
        ruleEval(newRule[1]);
      } catch (e) {
        errors.push(e + ", line " + (i+1) + ": " + newRule[1]);
      }
      newRules.push(newRule);
    }
    if (errors.length > 0) {
      evaluationResult.innerHTML = "Failed to evaluate<br>" + errors.join("<br>\n");
    } else {
      evaluationResult.innerHTML = "Updated.";
      bg.AdbData[key] = newRules;
      bg.AdbData[key + "Text"] = text;
      bg.AdbHelper.saveData();
    }
    return false;
  };
}

function restoreRules(key, defaultValue, textValue) {
  return function () {
    if (! window.confirm('Restore ?')) {
      return false;
    }
    bg.AdbData[key] = JSON.parse(JSON.stringify(defaultValue));
    bg.AdbData[key + "Text"] = textValue;
    bg.AdbHelper.saveData();
    prepareForm();
    return false;
  };
}

function updateUserCss() {
  bg.AdbData.userCss = $('userCss').value;
  bg.AdbHelper.saveData();
  return false;  
}

function updateExceptionRules() {
  var evaluationResult = $('evaluationResult'),
      text = $('exceptionRules').value,
      lines = text.split("\n"),
      newRules = [],
      i = 0, errors = [];
  
  for (; i < lines.length; i++) {
    if (isBlank(lines[i])) { continue; }
    if (lines[i][0] === '!') { continue; } // comment line
    try {
      new RegExp(lines[i]);
    } catch (e) {
      errors.push(e + ", line " + (i+1) + ": " + lines[i]);
    }
    newRules.push(lines[i]);
  }
  if (errors.length > 0) {
    evaluationResult.innerHTML = "Failed to evaluate<br>" + errors.join("<br>\n");
  } else {
    evaluationResult.innerHTML = "Updated.";
    bg.AdbData.exceptionRules = newRules;
    bg.AdbData.exceptionRulesText = text;
    bg.AdbHelper.saveData();
  }
  return false;
}

function prepareForm() {
  checkBoxes.forEach(function (k) {
    $(k).checked = bg.AdbData[k];
    if (checkBoxToTextarea[k]) {
      $(checkBoxToTextarea[k]).disabled = !bg.AdbData[k];
    }
  });
  $(bg.AdbData.blockMethod).checked = true;
  $('xpathRules').innerText = bg.AdbData.xpathRulesText;
  $('selectorRules').innerText = bg.AdbData.selectorRulesText;
  $('userCss').innerText = bg.AdbData.userCss;
  $('exceptionRules').innerText = bg.AdbData.exceptionRulesText;
}

function xpathEval(r) {
  document.evaluate(r, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
}

function selectorEval(r) {
  document.querySelectorAll(r);  
}

function onload() {
  prepareForm();
  checkBoxes.forEach(function (k) { $(k).addEventListener('click', createCheckboxListener(k)); });
  ['removeChild', 'displayNone', 'highlight'].forEach(function (k) { $(k).addEventListener('click', setBlockMethod); });
  $('updateXPathRules').addEventListener('click', updateRules('xpathRules', xpathEval));
  $('restoreXPathRules').addEventListener('click', restoreRules('xpathRules', bg.AdbHelper.DEFAULT_XPATH_RULES, bg.AdbHelper.DEFAULT_XPATH_RULES_TEXT));
  $('updateSelectorRules').addEventListener('click', updateRules('selectorRules', selectorEval));
  $('restoreSelectorRules').addEventListener('click', restoreRules('selectorRules', bg.AdbHelper.DEFAULT_SELECTOR_RULES, bg.AdbHelper.DEFAULT_SELECTOR_RULES_TEXT));
  $('updateUserCss').addEventListener('click', updateUserCss);
  $('updateExceptionRules').addEventListener('click', updateExceptionRules);
  $('restoreExceptionRules').addEventListener('click', restoreRules('exceptionRules', bg.AdbHelper.DEFAULT_EXCEPTION_RULES, bg.AdbHelper.DEFAULT_EXCEPTION_RULES_TEXT));
}

window.addEventListener("load", onload);
