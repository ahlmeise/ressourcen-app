/**
 * Datenmodelle, Validierung und ID-Generierung
 * Globaler Namespace: App.Models
 */
var App = window.App || {};
App.Models = (function() {
  'use strict';

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // ---- Organisationseinheit ----
  function createOrganisationseinheit(data) {
    return {
      id: data.id || generateId(),
      name: (data.name || '').trim(),
      beschreibung: (data.beschreibung || '').trim()
    };
  }

  function validateOrganisationseinheit(data) {
    var errors = {};
    if (!data.name || !data.name.trim()) {
      errors.name = 'Name ist erforderlich';
    }
    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  // ---- Mitarbeiter ----
  function createMitarbeiter(data) {
    return {
      id: data.id || generateId(),
      name: (data.name || '').trim(),
      rolle: (data.rolle || '').trim(),
      organisationseinheitId: data.organisationseinheitId || '',
      verfuegbarkeitStunden: parseFloat(data.verfuegbarkeitStunden) || 40,
      faehigkeiten: Array.isArray(data.faehigkeiten) ? data.faehigkeiten : parseFaehigkeiten(data.faehigkeiten)
    };
  }

  function parseFaehigkeiten(str) {
    if (!str) return [];
    return str.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  }

  function validateMitarbeiter(data) {
    var errors = {};
    if (!data.name || !data.name.trim()) {
      errors.name = 'Name ist erforderlich';
    }
    if (!data.organisationseinheitId) {
      errors.organisationseinheitId = 'Organisationseinheit ist erforderlich';
    }
    var stunden = parseFloat(data.verfuegbarkeitStunden);
    if (isNaN(stunden) || stunden <= 0 || stunden > 168) {
      errors.verfuegbarkeitStunden = 'Stunden müssen zwischen 1 und 168 liegen';
    }
    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  // ---- Projekt ----
  function createProjekt(data) {
    return {
      id: data.id || generateId(),
      name: (data.name || '').trim(),
      beschreibung: (data.beschreibung || '').trim(),
      startDatum: data.startDatum || '',
      endDatum: data.endDatum || '',
      status: data.status || 'Planung'
    };
  }

  function validateProjekt(data) {
    var errors = {};
    if (!data.name || !data.name.trim()) {
      errors.name = 'Name ist erforderlich';
    }
    if (!data.startDatum) {
      errors.startDatum = 'Startdatum ist erforderlich';
    }
    if (!data.endDatum) {
      errors.endDatum = 'Enddatum ist erforderlich';
    }
    if (data.startDatum && data.endDatum && data.startDatum > data.endDatum) {
      errors.endDatum = 'Enddatum muss nach Startdatum liegen';
    }
    var validStatus = ['Planung', 'Aktiv', 'Abgeschlossen', 'Pausiert'];
    if (validStatus.indexOf(data.status) === -1) {
      errors.status = 'Ungültiger Status';
    }
    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  // ---- Zuweisung ----
  function createZuweisung(data) {
    return {
      id: data.id || generateId(),
      mitarbeiterId: data.mitarbeiterId || '',
      projektId: data.projektId || '',
      stundenProWoche: parseFloat(data.stundenProWoche) || 0,
      startDatum: data.startDatum || '',
      endDatum: data.endDatum || '',
      notiz: (data.notiz || '').trim()
    };
  }

  function validateZuweisung(data) {
    var errors = {};
    if (!data.mitarbeiterId) {
      errors.mitarbeiterId = 'Mitarbeiter ist erforderlich';
    }
    if (!data.projektId) {
      errors.projektId = 'Projekt ist erforderlich';
    }
    var stunden = parseFloat(data.stundenProWoche);
    if (isNaN(stunden) || stunden <= 0) {
      errors.stundenProWoche = 'Stunden pro Woche müssen größer als 0 sein';
    }
    if (!data.startDatum) {
      errors.startDatum = 'Startdatum ist erforderlich';
    }
    if (!data.endDatum) {
      errors.endDatum = 'Enddatum ist erforderlich';
    }
    if (data.startDatum && data.endDatum && data.startDatum > data.endDatum) {
      errors.endDatum = 'Enddatum muss nach Startdatum liegen';
    }
    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  // ---- Auslastungsberechnung ----
  function berechneAuslastung(mitarbeiter, zuweisungen) {
    var summeStunden = 0;
    for (var i = 0; i < zuweisungen.length; i++) {
      if (zuweisungen[i].mitarbeiterId === mitarbeiter.id) {
        summeStunden += zuweisungen[i].stundenProWoche;
      }
    }
    if (mitarbeiter.verfuegbarkeitStunden <= 0) return 0;
    return Math.round((summeStunden / mitarbeiter.verfuegbarkeitStunden) * 100);
  }

  // ---- Datum formatieren ----
  var dateFormatter = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  function formatDatum(dateStr) {
    if (!dateStr) return '–';
    var d = new Date(dateStr + 'T00:00:00');
    return dateFormatter.format(d);
  }

  return {
    generateId: generateId,
    createOrganisationseinheit: createOrganisationseinheit,
    validateOrganisationseinheit: validateOrganisationseinheit,
    createMitarbeiter: createMitarbeiter,
    validateMitarbeiter: validateMitarbeiter,
    parseFaehigkeiten: parseFaehigkeiten,
    createProjekt: createProjekt,
    validateProjekt: validateProjekt,
    createZuweisung: createZuweisung,
    validateZuweisung: validateZuweisung,
    berechneAuslastung: berechneAuslastung,
    formatDatum: formatDatum
  };
})();
