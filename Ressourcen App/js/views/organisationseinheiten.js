/**
 * Organisationseinheiten CRUD View
 * Globaler Namespace: App.Views.Organisationseinheiten
 */
var App = window.App || {};
App.Views = App.Views || {};
App.Views.Organisationseinheiten = (function() {
  'use strict';

  var Store = App.Store;
  var Models = App.Models;
  var Modal = App.Components.Modal;
  var Notify = App.Components.Notify;
  var Table = App.Components.Table;
  var COLLECTION = 'organisationseinheiten';

  var state = {
    sortCol: 'name',
    sortDir: 'asc'
  };

  function render(container) {
    var items = Store.getAll(COLLECTION);

    var html = '<div class="view-header">' +
      '<h2 class="view-header__title">Organisationseinheiten</h2>' +
      '<button class="btn btn--primary" id="btn-add-org">+ Neue Einheit</button>' +
    '</div>';

    var columns = [
      { key: 'name', label: 'Name' },
      { key: 'beschreibung', label: 'Beschreibung' },
      {
        key: '_count', label: 'Mitarbeiter', render: function(item) {
          var count = Store.findWhere('mitarbeiter', 'organisationseinheitId', item.id).length;
          return '<span>' + count + '</span>';
        }
      }
    ];

    var tableOpts = {
      columns: columns,
      data: items,
      sortCol: state.sortCol,
      sortDir: state.sortDir,
      emptyText: 'Keine Organisationseinheiten vorhanden. Erstellen Sie die erste!',
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

    document.getElementById('btn-add-org').addEventListener('click', function() {
      openForm(null, container);
    });
  }

  function openForm(id, container) {
    var item = id ? Store.getById(COLLECTION, id) : {};
    var isEdit = !!id;

    var body =
      '<div class="form-group">' +
        '<label for="org-name">Name *</label>' +
        '<input type="text" id="org-name" value="' + Modal.escapeHtml(item.name || '') + '" placeholder="z.B. Entwicklung">' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="org-beschreibung">Beschreibung</label>' +
        '<textarea id="org-beschreibung" placeholder="Optionale Beschreibung">' + Modal.escapeHtml(item.beschreibung || '') + '</textarea>' +
      '</div>';

    Modal.open({
      title: isEdit ? 'Organisationseinheit bearbeiten' : 'Neue Organisationseinheit',
      body: body,
      onSave: function(overlay) {
        var data = {
          id: id || undefined,
          name: overlay.querySelector('#org-name').value,
          beschreibung: overlay.querySelector('#org-beschreibung').value
        };

        var validation = Models.validateOrganisationseinheit(data);
        if (!validation.valid) {
          showFormErrors(overlay, validation.errors);
          return false;
        }

        var entity = Models.createOrganisationseinheit(data);
        if (isEdit) {
          Store.update(COLLECTION, id, entity);
          Notify.success('Organisationseinheit aktualisiert');
        } else {
          Store.add(COLLECTION, entity);
          Notify.success('Organisationseinheit erstellt');
        }
        render(container);
        return true;
      }
    });
  }

  function confirmDelete(id, container) {
    var item = Store.getById(COLLECTION, id);
    if (!item) return;

    var mitarbeiter = Store.findWhere('mitarbeiter', 'organisationseinheitId', id);
    if (mitarbeiter.length > 0) {
      Notify.error('Diese Einheit hat ' + mitarbeiter.length + ' Mitarbeiter und kann nicht gelöscht werden.');
      return;
    }

    Modal.confirm({
      title: 'Organisationseinheit löschen',
      message: 'Möchten Sie "' + item.name + '" wirklich löschen?',
      onConfirm: function() {
        Store.remove(COLLECTION, id);
        Notify.success('Organisationseinheit gelöscht');
        render(container);
      }
    });
  }

  function showFormErrors(overlay, errors) {
    // Clear previous errors
    var errorEls = overlay.querySelectorAll('.error-text');
    for (var i = 0; i < errorEls.length; i++) {
      errorEls[i].parentNode.removeChild(errorEls[i]);
    }
    var errorInputs = overlay.querySelectorAll('.error');
    for (var j = 0; j < errorInputs.length; j++) {
      errorInputs[j].classList.remove('error');
    }

    for (var field in errors) {
      var input = overlay.querySelector('#org-' + field);
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
