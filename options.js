var bg = chrome.extension.getBackgroundPage();

function $(s) { return document.getElementById(s); }

function createCheckboxListener(name) {
  return function () {
    bg.AdbData[name] = $(name).checked;
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
        lines = textarea.value.split("\n"),
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
      bg.AdbHelper.saveData();
    }
    return false;
  };
}

function restoreRules(key, defaultValue) {
  return function () {
    if (! window.confirm('Restore ?')) {
      return false;
    }
    bg.AdbData[key] = JSON.parse(JSON.stringify(defaultValue));
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
      lines = $('exceptionRules').value.split("\n"),
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
    bg.AdbHelper.saveData();
  }
  return false;
}

function rulesToText(rulesArray) {
  if (! rulesArray) return "";
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

var checkBoxes = ['enableXPathRules', 'enableSelectorRules', 'enableAdbCss', 'enableUserCss', 'enableExceptionRules'];

function prepareForm() {
  checkBoxes.forEach(function (k) { $(k).checked = bg.AdbData[k]; });
  $(bg.AdbData.blockMethod).checked = true;
  $('xpathRules').innerText = rulesToText(bg.AdbData.xpathRules);
  $('selectorRules').innerText = rulesToText(bg.AdbData.selectorRules);
  $('userCss').innerText = bg.AdbData.userCss;
  $('exceptionRules').innerText = bg.AdbData.exceptionRules.join("\n");
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

  ['removeChild', 'displayNone', 'highlight'
  ].forEach(function (k) { $(k).addEventListener('click', setBlockMethod); });

  $('updateXPathRules').addEventListener('click', updateRules('xpathRules', xpathEval));
  $('restoreXPathRules').addEventListener('click', restoreRules('xpathRules', bg.AdbHelper.DEFAULT_XPATH_RULES));
  $('updateSelectorRules').addEventListener('click', updateRules('selectorRules', selectorEval));
  $('restoreSelectorRules').addEventListener('click', restoreRules('selectorRules', bg.AdbHelper.DEFAULT_SELECTOR_RULES));
  $('updateUserCss').addEventListener('click', updateUserCss);
  $('updateExceptionRules').addEventListener('click', updateExceptionRules);
  $('restoreExceptionRules').addEventListener('click', restoreRules('exceptionRules', bg.AdbHelper.DEFAULT_EXCEPTION_RULES));
}

window.addEventListener("load", onload);
