/**
 * Dashboard View - Statistik-Karten, Auslastungs-Chart, Projekt-Timeline, Warnungen
 * Globaler Namespace: App.Views.Dashboard
 */
var App = window.App || {};
App.Views = App.Views || {};
App.Views.Dashboard = (function() {
  'use strict';

  var Store = App.Store;
  var Models = App.Models;
  var Chart = App.Components.Chart;
  var Modal = App.Components.Modal;

  function render(container) {
    var mitarbeiter = Store.getAll('mitarbeiter');
    var projekte = Store.getAll('projekte');
    var zuweisungen = Store.getAll('zuweisungen');
    var orgEinheiten = Store.getAll('organisationseinheiten');

    var aktiveProjekte = projekte.filter(function(p) { return p.status === 'Aktiv'; });

    // Statistik-Karten
    var html = '<h2 class="view-header__title" style="margin-bottom:20px">Dashboard</h2>';
    html += '<div class="stats-grid">';
    html += statCard('Mitarbeiter', mitarbeiter.length, 'Gesamt');
    html += statCard('Projekte', projekte.length, aktiveProjekte.length + ' aktiv');
    html += statCard('Zuweisungen', zuweisungen.length, 'Gesamt');
    html += statCard('Org.-Einheiten', orgEinheiten.length, 'Gesamt');
    html += '</div>';

    // Zweispaltiges Layout
    html += '<div class="grid-2">';

    // Auslastungs-Chart
    html += '<div class="card">';
    html += '<div class="card__header"><h3 class="card__title">Auslastung pro Mitarbeiter</h3></div>';
    if (mitarbeiter.length > 0) {
      var chartData = mitarbeiter.map(function(ma) {
        var prozent = Models.berechneAuslastung(ma, zuweisungen);
        return { label: ma.name, value: prozent };
      }).sort(function(a, b) { return b.value - a.value; });

      html += Chart.barChart(chartData, { maxValue: 100, width: 480 });
    } else {
      html += '<div class="empty-state"><div class="empty-state__text">Keine Mitarbeiter vorhanden</div></div>';
    }
    html += '</div>';

    // Warnungen
    html += '<div class="card">';
    html += '<div class="card__header"><h3 class="card__title">Warnungen</h3></div>';
    html += renderWarnungen(mitarbeiter, zuweisungen, projekte);
    html += '</div>';

    html += '</div>'; // grid-2

    // Projekt-Timeline (volle Breite)
    html += '<div class="card mt-16">';
    html += '<div class="card__header"><h3 class="card__title">Projekt-Timeline</h3></div>';
    var zeitlinieProjekte = projekte.filter(function(p) { return p.startDatum && p.endDatum; });
    html += Chart.ganttTimeline(zeitlinieProjekte);
    html += '</div>';

    container.innerHTML = html;
  }

  function statCard(label, value, sub) {
    return '<div class="stat-card">' +
      '<div class="stat-card__label">' + label + '</div>' +
      '<div class="stat-card__value">' + value + '</div>' +
      '<div class="stat-card__sub">' + sub + '</div>' +
    '</div>';
  }

  function renderWarnungen(mitarbeiter, zuweisungen, projekte) {
    var warnungen = [];

    // Überbuchte Mitarbeiter
    for (var i = 0; i < mitarbeiter.length; i++) {
      var ma = mitarbeiter[i];
      var prozent = Models.berechneAuslastung(ma, zuweisungen);
      if (prozent > 100) {
        warnungen.push({
          type: 'danger',
          text: Modal.escapeHtml(ma.name) + ' ist zu ' + prozent + '% ausgelastet (überbucht!)'
        });
      } else if (prozent > 80) {
        warnungen.push({
          type: 'warning',
          text: Modal.escapeHtml(ma.name) + ' ist zu ' + prozent + '% ausgelastet'
        });
      }
    }

    // Projekte die bald enden (nächste 14 Tage)
    var heute = new Date();
    var inZweiWochen = new Date(heute.getTime() + 14 * 24 * 60 * 60 * 1000);
    for (var j = 0; j < projekte.length; j++) {
      var p = projekte[j];
      if (p.status === 'Aktiv' && p.endDatum) {
        var endDate = new Date(p.endDatum);
        if (endDate >= heute && endDate <= inZweiWochen) {
          warnungen.push({
            type: 'warning',
            text: 'Projekt "' + Modal.escapeHtml(p.name) + '" endet am ' + Models.formatDatum(p.endDatum)
          });
        }
        if (endDate < heute) {
          warnungen.push({
            type: 'danger',
            text: 'Projekt "' + Modal.escapeHtml(p.name) + '" ist überfällig (Ende: ' + Models.formatDatum(p.endDatum) + ')'
          });
        }
      }
    }

    // Mitarbeiter ohne Zuweisungen
    for (var k = 0; k < mitarbeiter.length; k++) {
      var maZuw = zuweisungen.filter(function(z) { return z.mitarbeiterId === mitarbeiter[k].id; });
      if (maZuw.length === 0) {
        warnungen.push({
          type: 'warning',
          text: Modal.escapeHtml(mitarbeiter[k].name) + ' hat keine Zuweisungen'
        });
      }
    }

    if (warnungen.length === 0) {
      return '<div class="empty-state" style="padding:20px"><div class="empty-state__text">Keine Warnungen – alles in Ordnung!</div></div>';
    }

    var html = '<ul class="warning-list">';
    for (var w = 0; w < warnungen.length; w++) {
      var warn = warnungen[w];
      var iconCls = warn.type === 'danger' ? 'warning-item__icon--danger' : 'warning-item__icon--warning';
      var icon = warn.type === 'danger' ? '!' : '⚠';
      html += '<li class="warning-item">' +
        '<div class="warning-item__icon ' + iconCls + '">' + icon + '</div>' +
        '<span>' + warn.text + '</span>' +
      '</li>';
    }
    html += '</ul>';
    return html;
  }

  return { render: render };
})();
