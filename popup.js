var bg = chrome.extension.getBackgroundPage();

function $(s) { return document.getElementById(s); }

function setKind() {
  var i = 0; radios = document.forms[0].kind;
  for (; i < radios.length; i++) {
    if (radios[i].checked) {
      bg.AdbData.popupForm.kind = radios[i].value;
      bg.AdbHelper.saveData();
      break;
    }
  }
}

function saveRule() {
  bg.AdbData.popupForm.rule = $('rule').value;
  bg.AdbHelper.saveData();
}

function testRule() {
  try {
    if (typeof bg.AdbData.popupForm === 'undefined') {
      throw "form is blank";
    }
    if (typeof bg.AdbData.popupForm.kind === 'undefined' ||
        (bg.AdbData.popupForm.kind != 'selector' &&
         bg.AdbData.popupForm.kind != 'xpath')) {
      throw "select xpath or selector";
    }
    if (typeof bg.AdbData.popupForm.rule === 'undefined') {
      throw "rule is blank";
    }
    var result = bg.AdbHelper.validateRule(bg.AdbData.popupForm.rule, bg.AdbData.popupForm.kind);
    if (result) { throw result; }
    bg.AdbHelper.testPopupRule();
    $('message').innerText = 'test ok: 3';
    window.setTimeout(function () { $('message').innerText = 'test ok: 2'; }, 1000);
    window.setTimeout(function () { $('message').innerText = 'test ok: 1'; }, 2000);
    window.setTimeout(function () { $('message').innerText = ''; }, 3000);
  } catch (e) {
    $('message').innerText = e;
  }
}

function addRule() {
  bg.AdbHelper.addPopupRule();
  $('rule').value = '';
  $('message').innerText = 'rule is added. please reload';
  window.setTimeout(function () { $('message').innerText = ''; }, 3000);
}

function prepareForm() {
  if (typeof bg.AdbData.popupForm !== 'undefined') {
    if (typeof bg.AdbData.popupForm.kind !== 'undefined') {
      $(bg.AdbData.popupForm.kind).checked = true;
    }
    if (typeof bg.AdbData.popupForm.rule !== 'undefined') {
      $('rule').value = bg.AdbData.popupForm.rule;
    }
  } else {
    bg.AdbData.popupForm = { kind: 'selector' };
    bg.AdbHelper.saveData();
  }
}

function onload() {
  prepareForm();
  $('rule').addEventListener('blur', saveRule);
  ['xpath', 'selector'].forEach(function (k) { $(k).addEventListener('click', setKind); });
  $('test').addEventListener('click', testRule);
  $('add').addEventListener('click', addRule);
  bg.AdbHelper.checkExcepted(function (response) {
    $('excepted').innerText = response.excepted ? 'Exception rule matched.  Nothing will be blocked on this page.' : '';
  });
}

window.addEventListener("load", onload);
