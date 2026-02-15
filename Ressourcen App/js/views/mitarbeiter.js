/**
 * Mitarbeiter CRUD View
 * Globaler Namespace: App.Views.Mitarbeiter
 */
var App = window.App || {};
App.Views = App.Views || {};
App.Views.Mitarbeiter = (function() {
  'use strict';

  var Store = App.Store;
  var Models = App.Models;
  var Modal = App.Components.Modal;
  var Notify = App.Components.Notify;
  var Table = App.Components.Table;
  var COLLECTION = 'mitarbeiter';

  var state = {
    sortCol: 'name',
    sortDir: 'asc'
  };

  function render(container) {
    var items = Store.getAll(COLLECTION);
    var zuweisungen = Store.getAll('zuweisungen');

    var html = '<div class="view-header">' +
      '<h2 class="view-header__title">Mitarbeiter</h2>' +
      '<button class="btn btn--primary" id="btn-add-ma">+ Neuer Mitarbeiter</button>' +
    '</div>';

    var columns = [
      { key: 'name', label: 'Name' },
      { key: 'rolle', label: 'Rolle' },
      {
        key: 'organisationseinheitId', label: 'Org.-Einheit', render: function(item) {
          var org = Store.getById('organisationseinheiten', item.organisationseinheitId);
          return org ? Modal.escapeHtml(org.name) : '–';
        }
      },
      {
        key: 'verfuegbarkeitStunden', label: 'Verfügbarkeit', render: function(item) {
          return item.verfuegbarkeitStunden + ' h/Woche';
        }
      },
      {
        key: '_auslastung', label: 'Auslastung', sortable: false, render: function(item) {
          var prozent = Models.berechneAuslastung(item, zuweisungen);
          var cls = prozent <= 80 ? 'ok' : (prozent <= 100 ? 'warnung' : 'kritisch');
          var barCls = 'auslastung-bar__fill--' + cls;
          return '<div style="min-width:100px">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:2px">' +
              '<span class="badge badge--' + cls + '">' + prozent + '%</span>' +
            '</div>' +
            '<div class="auslastung-bar"><div class="auslastung-bar__fill ' + barCls + '" style="width:' + Math.min(prozent, 100) + '%"></div></div>' +
          '</div>';
        }
      },
      {
        key: 'faehigkeiten', label: 'Fähigkeiten', render: function(item) {
          if (!item.faehigkeiten || item.faehigkeiten.length === 0) return '–';
          return item.faehigkeiten.map(function(f) {
            return '<span class="tag">' + Modal.escapeHtml(f) + '</span>';
          }).join('');
        }
      }
    ];

    var tableOpts = {
      columns: columns,
      data: items,
      sortCol: state.sortCol,
      sortDir: state.sortDir,
      emptyText: 'Keine Mitarbeiter vorhanden. Erstellen Sie den ersten!',
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

    document.getElementById('btn-add-ma').addEventListener('click', function() {
      openForm(null, container);
    });
  }

  function openForm(id, container) {
    var item = id ? Store.getById(COLLECTION, id) : { verfuegbarkeitStunden: 40 };
    var isEdit = !!id;

    var orgEinheiten = Store.getAll('organisationseinheiten');
    var orgOptions = '<option value="">– Bitte wählen –</option>';
    for (var i = 0; i < orgEinheiten.length; i++) {
      var sel = item.organisationseinheitId === orgEinheiten[i].id ? ' selected' : '';
      orgOptions += '<option value="' + orgEinheiten[i].id + '"' + sel + '>' + Modal.escapeHtml(orgEinheiten[i].name) + '</option>';
    }

    if (orgEinheiten.length === 0) {
      Notify.warning('Bitte erstellen Sie zuerst eine Organisationseinheit.');
      return;
    }

    var faehigkeitenStr = item.faehigkeiten ? item.faehigkeiten.join(', ') : '';

    var body =
      '<div class="form-group">' +
        '<label for="ma-name">Name *</label>' +
        '<input type="text" id="ma-name" value="' + Modal.escapeHtml(item.name || '') + '" placeholder="Vor- und Nachname">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="ma-rolle">Rolle</label>' +
        '<input type="text" id="ma-rolle" value="' + Modal.escapeHtml(item.rolle || '') + '" placeholder="z.B. Entwickler, Designer">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="ma-organisationseinheitId">Organisationseinheit *</label>' +
        '<select id="ma-organisationseinheitId">' + orgOptions + '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="ma-verfuegbarkeitStunden">Verfügbarkeit (Stunden/Woche) *</label>' +
        '<input type="number" id="ma-verfuegbarkeitStunden" value="' + (item.verfuegbarkeitStunden || 40) + '" min="1" max="168" step="0.5">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="ma-faehigkeiten">Fähigkeiten (kommagetrennt)</label>' +
        '<input type="text" id="ma-faehigkeiten" value="' + Modal.escapeHtml(faehigkeitenStr) + '" placeholder="z.B. Java, React, SQL">' +
      '</div>';

    Modal.open({
      title: isEdit ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter',
      body: body,
      onSave: function(overlay) {
        var data = {
          id: id || undefined,
          name: overlay.querySelector('#ma-name').value,
          rolle: overlay.querySelector('#ma-rolle').value,
          organisationseinheitId: overlay.querySelector('#ma-organisationseinheitId').value,
          verfuegbarkeitStunden: overlay.querySelector('#ma-verfuegbarkeitStunden').value,
          faehigkeiten: overlay.querySelector('#ma-faehigkeiten').value
        };

        var validation = Models.validateMitarbeiter(data);
        if (!validation.valid) {
          showFormErrors(overlay, validation.errors, 'ma-');
          return false;
        }

        var entity = Models.createMitarbeiter(data);
        if (isEdit) {
          Store.update(COLLECTION, id, entity);
          Notify.success('Mitarbeiter aktualisiert');
        } else {
          Store.add(COLLECTION, entity);
          Notify.success('Mitarbeiter erstellt');
        }
        render(container);
        return true;
      }
    });
  }

  function confirmDelete(id, container) {
    var item = Store.getById(COLLECTION, id);
    if (!item) return;

    var zuweisungen = Store.findWhere('zuweisungen', 'mitarbeiterId', id);
    var msg = 'Möchten Sie "' + item.name + '" wirklich löschen?';
    if (zuweisungen.length > 0) {
      msg += ' Es werden auch ' + zuweisungen.length + ' zugehörige Zuweisung(en) gelöscht.';
    }

    Modal.confirm({
      title: 'Mitarbeiter löschen',
      message: msg,
      onConfirm: function() {
        for (var i = 0; i < zuweisungen.length; i++) {
          Store.remove('zuweisungen', zuweisungen[i].id);
        }
        Store.remove(COLLECTION, id);
        Notify.success('Mitarbeiter gelöscht');
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
