/**
 * Projekte CRUD View
 * Globaler Namespace: App.Views.Projekte
 */
var App = window.App || {};
App.Views = App.Views || {};
App.Views.Projekte = (function() {
  'use strict';

  var Store = App.Store;
  var Models = App.Models;
  var Modal = App.Components.Modal;
  var Notify = App.Components.Notify;
  var Table = App.Components.Table;
  var COLLECTION = 'projekte';

  var state = {
    sortCol: 'name',
    sortDir: 'asc'
  };

  function render(container) {
    var items = Store.getAll(COLLECTION);

    var html = '<div class="view-header">' +
      '<h2 class="view-header__title">Projekte</h2>' +
      '<button class="btn btn--primary" id="btn-add-projekt">+ Neues Projekt</button>' +
    '</div>';

    var columns = [
      { key: 'name', label: 'Name' },
      {
        key: 'status', label: 'Status', render: function(item) {
          var cls = 'badge--' + item.status.toLowerCase();
          return '<span class="badge ' + cls + '">' + Modal.escapeHtml(item.status) + '</span>';
        }
      },
      {
        key: 'startDatum', label: 'Start', render: function(item) {
          return Models.formatDatum(item.startDatum);
        }
      },
      {
        key: 'endDatum', label: 'Ende', render: function(item) {
          return Models.formatDatum(item.endDatum);
        }
      },
      {
        key: '_zuweisungen', label: 'Zuweisungen', render: function(item) {
          var count = Store.findWhere('zuweisungen', 'projektId', item.id).length;
          return '<span>' + count + '</span>';
        }
      }
    ];

    var tableOpts = {
      columns: columns,
      data: items,
      sortCol: state.sortCol,
      sortDir: state.sortDir,
      emptyText: 'Keine Projekte vorhanden. Erstellen Sie das erste!',
      onEdit: function(id) { openForm(id, container); },
      onDelete: function(id) { confirmDelete(id, container); },
      onSort: function(col, dir) {
        state.sortCol = col;
        state.sortDir = dir;
        render(container);
      }
    };

    html += Table.render(tableOpts);
    container.innerHTML = html;
    Table.bindEvents(container, tableOpts);

    document.getElementById('btn-add-projekt').addEventListener('click', function() {
      openForm(null, container);
    });
  }

  function openForm(id, container) {
    var item = id ? Store.getById(COLLECTION, id) : { status: 'Planung' };
    var isEdit = !!id;

    var statusOptions = ['Planung', 'Aktiv', 'Abgeschlossen', 'Pausiert'];
    var statusHtml = '';
    for (var i = 0; i < statusOptions.length; i++) {
      var sel = item.status === statusOptions[i] ? ' selected' : '';
      statusHtml += '<option value="' + statusOptions[i] + '"' + sel + '>' + statusOptions[i] + '</option>';
    }

    var body =
      '<div class="form-group">' +
        '<label for="prj-name">Name *</label>' +
        '<input type="text" id="prj-name" value="' + Modal.escapeHtml(item.name || '') + '" placeholder="Projektname">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="prj-beschreibung">Beschreibung</label>' +
        '<textarea id="prj-beschreibung" placeholder="Optionale Beschreibung">' + Modal.escapeHtml(item.beschreibung || '') + '</textarea>' +
      '</div>' +
      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label for="prj-startDatum">Startdatum *</label>' +
          '<input type="date" id="prj-startDatum" value="' + (item.startDatum || '') + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="prj-endDatum">Enddatum *</label>' +
          '<input type="date" id="prj-endDatum" value="' + (item.endDatum || '') + '">' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="prj-status">Status</label>' +
        '<select id="prj-status">' + statusHtml + '</select>' +
      '</div>';

    Modal.open({
      title: isEdit ? 'Projekt bearbeiten' : 'Neues Projekt',
      body: body,
      onSave: function(overlay) {
        var data = {
          id: id || undefined,
          name: overlay.querySelector('#prj-name').value,
          beschreibung: overlay.querySelector('#prj-beschreibung').value,
          startDatum: overlay.querySelector('#prj-startDatum').value,
          endDatum: overlay.querySelector('#prj-endDatum').value,
          status: overlay.querySelector('#prj-status').value
        };

        var validation = Models.validateProjekt(data);
        if (!validation.valid) {
          showFormErrors(overlay, validation.errors, 'prj-');
          return false;
        }

        var entity = Models.createProjekt(data);
        if (isEdit) {
          Store.update(COLLECTION, id, entity);
          Notify.success('Projekt aktualisiert');
        } else {
          Store.add(COLLECTION, entity);
          Notify.success('Projekt erstellt');
        }
        render(container);
        return true;
      }
    });
  }

  function confirmDelete(id, container) {
    var item = Store.getById(COLLECTION, id);
    if (!item) return;

    var zuweisungen = Store.findWhere('zuweisungen', 'projektId', id);
    var msg = 'Möchten Sie "' + item.name + '" wirklich löschen?';
    if (zuweisungen.length > 0) {
      msg += ' Es werden auch ' + zuweisungen.length + ' zugehörige Zuweisung(en) gelöscht.';
    }

    Modal.confirm({
      title: 'Projekt löschen',
      message: msg,
      onConfirm: function() {
        // Zugehörige Zuweisungen löschen
        for (var i = 0; i < zuweisungen.length; i++) {
          Store.remove('zuweisungen', zuweisungen[i].id);
        }
        Store.remove(COLLECTION, id);
        Notify.success('Projekt gelöscht');
        render(container);
      }
    });
  }

  function showFormErrors(overlay, errors, prefix) {
    var errorEls = overlay.querySelectorAll('.error-text');
    for (var i = 0; i < errorEls.length; i++) {
      errorEls[i].parentNode.removeChild(errorEls[i]);
    }
    var errorInputs = overlay.querySelectorAll('.error');
    for (var j = 0; j < errorInputs.length; j++) {
      errorInputs[j].classList.remove('error');
    }

    for (var field in errors) {
      var input = overlay.querySelector('#' + prefix + field);
      if (input) {
        input.classList.add('error');
        var span = document.createElement('span');
        span.className = 'error-text';
        span.textContent = errors[field];
        input.parentNode.appendChild(span);
      }
    }
  }

  return { render: render };
})();
