/**
 * Wiederverwendbarer Modal-Dialog
 * Globaler Namespace: App.Components.Modal
 */
var App = window.App || {};
App.Components = App.Components || {};
App.Components.Modal = (function() {
  'use strict';

  var root = document.getElementById('modal-root');

  function open(options) {
    var title = options.title || '';
    var bodyHtml = options.body || '';
    var onSave = options.onSave || null;
    var saveLabel = options.saveLabel || 'Speichern';
    var saveClass = options.saveClass || 'btn--primary';

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal">' +
        '<div class="modal__header">' +
          '<h3 class="modal__title">' + escapeHtml(title) + '</h3>' +
          '<button class="modal__close" aria-label="Schließen">&times;</button>' +
        '</div>' +
        '<div class="modal__body">' + bodyHtml + '</div>' +
        '<div class="modal__footer">' +
          '<button class="btn btn--secondary modal__cancel">Abbrechen</button>' +
          '<button class="btn ' + saveClass + ' modal__save">' + escapeHtml(saveLabel) + '</button>' +
        '</div>' +
      '</div>';

    root.appendChild(overlay);

    var closeBtn = overlay.querySelector('.modal__close');
    var cancelBtn = overlay.querySelector('.modal__cancel');
    var saveBtn = overlay.querySelector('.modal__save');

    function close() {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }

    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });

    saveBtn.addEventListener('click', function() {
      if (onSave) {
        var result = onSave(overlay);
        if (result !== false) close();
      } else {
        close();
      }
    });

    // Focus first input
    var firstInput = overlay.querySelector('input, select, textarea');
    if (firstInput) {
      setTimeout(function() { firstInput.focus(); }, 50);
    }

    return { close: close, el: overlay };
  }

  function confirm(options) {
    var title = options.title || 'Bestätigung';
    var message = options.message || 'Sind Sie sicher?';
    var onConfirm = options.onConfirm || function() {};
    var confirmLabel = options.confirmLabel || 'Bestätigen';
    var confirmClass = options.confirmClass || 'btn--danger';

    return open({
      title: title,
      body: '<p style="margin:0">' + escapeHtml(message) + '</p>',
      saveLabel: confirmLabel,
      saveClass: confirmClass,
      onSave: function() {
        onConfirm();
        return true;
      }
    });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  return {
    open: open,
    confirm: confirm,
    escapeHtml: escapeHtml
  };
})();
