/**
 * Sortierbare Tabelle
 * Globaler Namespace: App.Components.Table
 */
var App = window.App || {};
App.Components = App.Components || {};
App.Components.Table = (function() {
  'use strict';

  /**
   * Erstellt eine sortierbare Tabelle
   * @param {Object} options
   * @param {Array} options.columns - [{key, label, render?, sortable?}]
   * @param {Array} options.data - Datenobjekte
   * @param {Function} options.onEdit - callback(item)
   * @param {Function} options.onDelete - callback(item)
   * @param {string} options.emptyText - Text bei leerer Tabelle
   */
  function render(options) {
    var columns = options.columns || [];
    var data = options.data || [];
    var onEdit = options.onEdit;
    var onDelete = options.onDelete;
    var emptyText = options.emptyText || 'Keine Daten vorhanden';
    var sortCol = options.sortCol || null;
    var sortDir = options.sortDir || 'asc';

    if (data.length === 0) {
      return '<div class="empty-state">' +
        '<div class="empty-state__icon">📋</div>' +
        '<div class="empty-state__text">' + emptyText + '</div>' +
      '</div>';
    }

    // Sort data
    if (sortCol) {
      data = data.slice().sort(function(a, b) {
        var va = a[sortCol] != null ? a[sortCol] : '';
        var vb = b[sortCol] != null ? b[sortCol] : '';
        if (typeof va === 'string') va = va.toLowerCase();
        if (typeof vb === 'string') vb = vb.toLowerCase();
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    var html = '<div class="table-wrapper"><table>';

    // Header
    html += '<thead><tr>';
    for (var c = 0; c < columns.length; c++) {
      var col = columns[c];
      var sortable = col.sortable !== false;
      var sortClass = '';
      if (sortCol === col.key) {
        sortClass = sortDir === 'asc' ? ' sorted-asc' : ' sorted-desc';
      }
      html += '<th' + (sortable ? ' data-sort="' + col.key + '"' : '') + ' class="' + sortClass + '">' + escapeHtml(col.label) + '</th>';
    }
    if (onEdit || onDelete) {
      html += '<th style="width:100px">Aktionen</th>';
    }
    html += '</tr></thead>';

    // Body
    html += '<tbody>';
    for (var i = 0; i < data.length; i++) {
      html += '<tr data-id="' + data[i].id + '">';
      for (var j = 0; j < columns.length; j++) {
        var content = '';
        if (columns[j].render) {
          content = columns[j].render(data[i]);
        } else {
          content = escapeHtml(String(data[i][columns[j].key] || ''));
        }
        html += '<td>' + content + '</td>';
      }
      if (onEdit || onDelete) {
        html += '<td class="table-actions">';
        if (onEdit) {
          html += '<button class="btn btn--icon btn--small table-edit" title="Bearbeiten">✏️</button>';
        }
        if (onDelete) {
          html += '<button class="btn btn--icon btn--small table-delete" title="Löschen">🗑️</button>';
        }
        html += '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';

    return html;
  }

  /**
   * Bindet Sort- und Action-Events
   */
  function bindEvents(container, options) {
    // Sort-Klick
    var ths = container.querySelectorAll('th[data-sort]');
    for (var i = 0; i < ths.length; i++) {
      ths[i].addEventListener('click', function() {
        var key = this.getAttribute('data-sort');
        var newDir = 'asc';
        if (options.sortCol === key && options.sortDir === 'asc') {
          newDir = 'desc';
        }
        options.sortCol = key;
        options.sortDir = newDir;
        if (options.onSort) options.onSort(key, newDir);
      });
    }

    // Edit/Delete Klicks
    if (options.onEdit) {
      var editBtns = container.querySelectorAll('.table-edit');
      for (var e = 0; e < editBtns.length; e++) {
        editBtns[e].addEventListener('click', function() {
          var id = this.closest('tr').getAttribute('data-id');
          options.onEdit(id);
        });
      }
    }

    if (options.onDelete) {
      var delBtns = container.querySelectorAll('.table-delete');
      for (var d = 0; d < delBtns.length; d++) {
        delBtns[d].addEventListener('click', function() {
          var id = this.closest('tr').getAttribute('data-id');
          options.onDelete(id);
        });
      }
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  return { render: render, bindEvents: bindEvents };
})();
