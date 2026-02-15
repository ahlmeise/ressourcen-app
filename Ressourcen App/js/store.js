/**
 * LocalStorage CRUD-Wrapper mit Export/Import
 * Globaler Namespace: App.Store
 */
var App = window.App || {};
App.Store = (function() {
  'use strict';

  var STORAGE_PREFIX = 'resplan_';
  var DATA_VERSION = 1;
  var COLLECTIONS = ['organisationseinheiten', 'mitarbeiter', 'projekte', 'zuweisungen'];

  function _key(collection) {
    return STORAGE_PREFIX + collection;
  }

  function _read(collection) {
    try {
      var data = localStorage.getItem(_key(collection));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Store: Fehler beim Lesen von ' + collection, e);
      return [];
    }
  }

  function _write(collection, items) {
    try {
      localStorage.setItem(_key(collection), JSON.stringify(items));
    } catch (e) {
      console.error('Store: Fehler beim Schreiben von ' + collection, e);
    }
  }

  // ---- CRUD ----
  function getAll(collection) {
    return _read(collection);
  }

  function getById(collection, id) {
    var items = _read(collection);
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function add(collection, item) {
    var items = _read(collection);
    items.push(item);
    _write(collection, items);
    return item;
  }

  function update(collection, id, updatedItem) {
    var items = _read(collection);
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        items[i] = updatedItem;
        _write(collection, items);
        return updatedItem;
      }
    }
    return null;
  }

  function remove(collection, id) {
    var items = _read(collection);
    var filtered = items.filter(function(item) { return item.id !== id; });
    _write(collection, filtered);
    return filtered.length < items.length;
  }

  // ---- Abfragen ----
  function findWhere(collection, field, value) {
    return _read(collection).filter(function(item) {
      return item[field] === value;
    });
  }

  // ---- Export ----
  function exportData() {
    var data = { version: DATA_VERSION };
    COLLECTIONS.forEach(function(col) {
      data[col] = _read(col);
    });
    return data;
  }

  function downloadExport() {
    var data = exportData();
    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ressourcenplanung_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- Import ----
  function importData(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Ungültiges Datenformat');
    }
    if (!jsonData.version) {
      throw new Error('Keine Versionsnummer gefunden');
    }
    COLLECTIONS.forEach(function(col) {
      if (Array.isArray(jsonData[col])) {
        _write(col, jsonData[col]);
      }
    });
  }

  // ---- Alle Daten löschen ----
  function clearAll() {
    COLLECTIONS.forEach(function(col) {
      localStorage.removeItem(_key(col));
    });
  }

  // ---- Prüfe ob Daten vorhanden ----
  function isEmpty() {
    for (var i = 0; i < COLLECTIONS.length; i++) {
      if (_read(COLLECTIONS[i]).length > 0) return false;
    }
    return true;
  }

  return {
    getAll: getAll,
    getById: getById,
    add: add,
    update: update,
    remove: remove,
    findWhere: findWhere,
    exportData: exportData,
    downloadExport: downloadExport,
    importData: importData,
    clearAll: clearAll,
    isEmpty: isEmpty
  };
})();
