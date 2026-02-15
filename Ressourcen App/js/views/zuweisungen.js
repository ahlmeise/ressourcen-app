/**
 * Zuweisungen CRUD View mit Auslastungswarnung
 * Globaler Namespace: App.Views.Zuweisungen
 */
var App = window.App || {};
App.Views = App.Views || {};
App.Views.Zuweisungen = (function() {
  'use strict';

  var Store = App.Store;
  var Models = App.Models;
  var Modal = App.Components.Modal;
  var Notify = App.Components.Notify;
  var Table = App.Components.Table;
  var COLLECTION = 'zuweisungen';

  var state = {
    sortCol: 'startDatum',
    sortDir: 'asc'
  };

  function render(container) {
    var items = Store.getAll(COLLECTION);

    var html = '<div class="view-header">' +
      '<h2 class="view-header__title">Zuweisungen</h2>' +
      '<button class="btn btn--primary" id="btn-add-zuw">+ Neue Zuweisung</button>' +
    '</div>';

    var columns = [
      {
        key: 'mitarbeiterId', label: 'Mitarbeiter', render: function(item) {
          var ma = Store.getById('mitarbeiter', item.mitarbeiterId);
          return ma ? Modal.escapeHtml(ma.name) : '–';
        }
      },
      {
        key: 'projektId', label: 'Projekt', render: function(item) {
          var prj = Store.getById('projekte', item.projektId);
          return prj ? Modal.escapeHtml(prj.name) : '–';
        }
      },
      {
        key: 'stundenProWoche', label: 'Std./Woche', render: function(item) {
          return item.stundenProWoche + ' h';
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
        key: '_auslastung', label: 'Auslastung MA', sortable: false, render: function(item) {
          var ma = Store.getById('mitarbeiter', item.mitarbeiterId);
          if (!ma) return '–';
          var allZuw = Store.getAll(COLLECTION);
          var prozent = Models.berechneAuslastung(ma, allZuw);
          var cls = prozent <= 80 ? 'ok' : (prozent <= 100 ? 'warnung' : 'kritisch');
          return '<span class="badge badge--' + cls + '">' + prozent + '%</span>';
        }
      },
      {
        key: 'notiz', label: 'Notiz', render: function(item) {
          if (!item.notiz) return '–';
          var text = item.notiz.length > 30 ? item.notiz.substring(0, 30) + '…' : item.notiz;
          return '<span title="' + Modal.escapeHtml(item.notiz) + '">' + Modal.escapeHtml(text) + '</span>';
        }
      }
    ];

    var tableOpts = {
      columns: columns,
      data: items,
      sortCol: state.sortCol,
      sortDir: state.sortDir,
      emptyText: 'Keine Zuweisungen vorhanden. Erstellen Sie die erste!',
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

    document.getElementById('btn-add-zuw').addEventListener('click', function() {
      openForm(null, container);
    });
  }

  function openForm(id, container) {
    var item = id ? Store.getById(COLLECTION, id) : {};
    var isEdit = !!id;

    var mitarbeiterList = Store.getAll('mitarbeiter');
    var projekteList = Store.getAll('projekte');

    if (mitarbeiterList.length === 0) {
      Notify.warning('Bitte erstellen Sie zuerst einen Mitarbeiter.');
      return;
    }
    if (projekteList.length === 0) {
      Notify.warning('Bitte erstellen Sie zuerst ein Projekt.');
      return;
    }

    var maOptions = '<option value="">– Mitarbeiter wählen –</option>';
    for (var i = 0; i < mitarbeiterList.length; i++) {
      var selMa = item.mitarbeiterId === mitarbeiterList[i].id ? ' selected' : '';
      maOptions += '<option value="' + mitarbeiterList[i].id + '"' + selMa + '>' + Modal.escapeHtml(mitarbeiterList[i].name) + '</option>';
    }

    var prjOptions = '<option value="">– Projekt wählen –</option>';
    for (var j = 0; j < projekteList.length; j++) {
      var selPrj = item.projektId === projekteList[j].id ? ' selected' : '';
      prjOptions += '<option value="' + projekteList[j].id + '"' + selPrj + '>' + Modal.escapeHtml(projekteList[j].name) + '</option>';
    }

    var body =
      '<div class="form-group">' +
        '<label for="zuw-mitarbeiterId">Mitarbeiter *</label>' +
        '<select id="zuw-mitarbeiterId">' + maOptions + '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="zuw-projektId">Projekt *</label>' +
        '<select id="zuw-projektId">' + prjOptions + '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="zuw-stundenProWoche">Stunden pro Woche *</label>' +
        '<input type="number" id="zuw-stundenProWoche" value="' + (item.stundenProWoche || '') + '" min="0.5" step="0.5" placeholder="z.B. 20">' +
      '</div>' +
      '<div class="form-row">' +
        '<div class="form-group">' +
          '<label for="zuw-startDatum">Startdatum *</label>' +
          '<input type="date" id="zuw-startDatum" value="' + (item.startDatum || '') + '">' +
        '</div>' +
        '<div class="form-group">' +
          '<label for="zuw-endDatum">Enddatum *</label>' +
          '<input type="date" id="zuw-endDatum" value="' + (item.endDatum || '') + '">' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label for="zuw-notiz">Notiz</label>' +
        '<textarea id="zuw-notiz" placeholder="Optionale Notiz">' + Modal.escapeHtml(item.notiz || '') + '</textarea>' +
      '</div>' +
      '<div id="zuw-auslastung-preview" style="padding:10px;border-radius:6px;background:#f9fafb;display:none">' +
        '<strong>Auslastungsvorschau:</strong> <span id="zuw-auslastung-wert"></span>' +
      '</div>';

    var modal = Modal.open({
      title: isEdit ? 'Zuweisung bearbeiten' : 'Neue Zuweisung',
      body: body,
      onSave: function(overlay) {
        var data = {
          id: id || undefined,
          mitarbeiterId: overlay.querySelector('#zuw-mitarbeiterId').value,
          projektId: overlay.querySelector('#zuw-projektId').value,
          stundenProWoche: overlay.querySelector('#zuw-stundenProWoche').value,
          startDatum: overlay.querySelector('#zuw-startDatum').value,
          endDatum: overlay.querySelector('#zuw-endDatum').value,
          notiz: overlay.querySelector('#zuw-notiz').value
        };

        var validation = Models.validateZuweisung(data);
        if (!validation.valid) {
          showFormErrors(overlay, validation.errors, 'zuw-');
          return false;
        }

        var entity = Models.createZuweisung(data);
        if (isEdit) {
          Store.update(COLLECTION, id, entity);
          Notify.success('Zuweisung aktualisiert');
        } else {
          Store.add(COLLECTION, entity);
          Notify.success('Zuweisung erstellt');
        }
        render(container);
        return true;
      }
    });

    // Auslastungsvorschau aktualisieren
    var maSelect = modal.el.querySelector('#zuw-mitarbeiterId');
    var stundenInput = modal.el.querySelector('#zuw-stundenProWoche');

    function updatePreview() {
      var preview = modal.el.querySelector('#zuw-auslastung-preview');
      var wert = modal.el.querySelector('#zuw-auslastung-wert');
      var maId = maSelect.value;
      var stunden = parseFloat(stundenInput.value) || 0;

      if (!maId || stunden <= 0) {
        preview.style.display = 'none';
        return;
      }

      var ma = Store.getById('mitarbeiter', maId);
      if (!ma) { preview.style.display = 'none'; return; }

      var allZuw = Store.getAll(COLLECTION);
      // Bei Bearbeitung: aktuelle Zuweisung rausrechnen
      if (isEdit) {
        allZuw = allZuw.filter(function(z) { return z.id !== id; });
      }
      // Temporäre Zuweisung hinzufügen
      allZuw.push({ mitarbeiterId: maId, stundenProWoche: stunden });

      var prozent = Models.berechneAuslastung(ma, allZuw);
      var cls = prozent <= 80 ? 'ok' : (prozent <= 100 ? 'warnung' : 'kritisch');

      preview.style.display = 'block';
      wert.innerHTML = '<span class="badge badge--' + cls + '">' + prozent + '% (' + ma.verfuegbarkeitStunden + ' h verfügbar)</span>';

      if (prozent > 100) {
        wert.innerHTML += '<br><span style="color:#dc2626;font-size:13px;margin-top:4px;display:inline-block">⚠ Überbucht! Der Mitarbeiter wäre zu ' + prozent + '% ausgelastet.</span>';
      }
    }

    maSelect.addEventListener('change', updatePreview);
    stundenInput.addEventListener('input', updatePreview);

    // Initial preview bei Bearbeitung
    if (isEdit) updatePreview();
  }

  function confirmDelete(id, container) {
    var item = Store.getById(COLLECTION, id);
    if (!item) return;

    var ma = Store.getById('mitarbeiter', item.mitarbeiterId);
    var prj = Store.getById('projekte', item.projektId);
    var maName = ma ? ma.name : '?';
    var prjName = prj ? prj.name : '?';

    Modal.confirm({
      title: 'Zuweisung löschen',
      message: 'Möchten Sie die Zuweisung von "' + maName + '" zu "' + prjName + '" wirklich löschen?',
      onConfirm: function() {
        Store.remove(COLLECTION, id);
        Notify.success('Zuweisung gelöscht');
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
