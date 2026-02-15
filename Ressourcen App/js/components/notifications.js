/**
 * Toast-Benachrichtigungen
 * Globaler Namespace: App.Components.Notify
 */
var App = window.App || {};
App.Components = App.Components || {};
App.Components.Notify = (function() {
  'use strict';

  var container = document.getElementById('notification-root');
  var DURATION = 3500;

  function show(message, type) {
    type = type || 'info';
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.innerHTML =
      '<span class="toast__message">' + escapeHtml(message) + '</span>' +
      '<button class="toast__close">&times;</button>';

    container.appendChild(toast);

    var closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', function() { remove(toast); });

    setTimeout(function() { remove(toast); }, DURATION);
  }

  function remove(toast) {
    if (!toast.parentNode) return;
    toast.style.animation = 'fadeOut 200ms ease forwards';
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  }

  function success(msg) { show(msg, 'success'); }
  function error(msg) { show(msg, 'error'); }
  function warning(msg) { show(msg, 'warning'); }
  function info(msg) { show(msg, 'info'); }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  return { show: show, success: success, error: error, warning: warning, info: info };
})();
