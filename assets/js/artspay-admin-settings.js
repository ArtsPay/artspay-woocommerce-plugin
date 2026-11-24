/**
 * ArtsPay settings: Test and Live tabs in Account details. The tabs only choose which details are
 * shown. Both sets are always saved, and only the Mode setting changes what customers get.
 */
(function () {
  'use strict';

  var account = document.querySelector('.artspay-account');
  if (!account) {
    return;
  }

  var tabs = Array.prototype.slice.call(account.querySelectorAll('.artspay-account__tab'));
  var panels = Array.prototype.slice.call(account.querySelectorAll('.artspay-account__panel'));

  function show(mode) {
    tabs.forEach(function (tab) {
      var on = tab.dataset.mode === mode;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.dataset.mode !== mode;
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      show(tab.dataset.mode);
    });
    tab.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
      }
      event.preventDefault();
      var next = tabs[(index + 1) % tabs.length];
      show(next.dataset.mode);
      next.focus();
    });
  });

  // Choosing a mode shows its details, so missing ones are seen before saving.
  Array.prototype.forEach.call(document.querySelectorAll('.artspay-mode input[type="radio"]'), function (radio) {
    radio.addEventListener('change', function () {
      if (radio.checked) {
        show(radio.value === 'yes' ? 'test' : 'live');
      }
    });
  });

  account.classList.add('artspay-account--tabs');
  show(account.dataset.active);
})();
