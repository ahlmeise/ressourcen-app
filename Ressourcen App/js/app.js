/**
 * App-Init: Router, Navigation, Export/Import, Seed-Daten
 * Globaler Namespace: App
 */
var App = window.App || {};

(function() {
  'use strict';

  var mainContent = document.getElementById('main-content');
  var sidebar = document.getElementById('sidebar');
  var hamburger = document.getElementById('hamburger');

  var routes = {
    dashboard: App.Views.Dashboard,
    mitarbeiter: App.Views.Mitarbeiter,
    organisationseinheiten: App.Views.Organisationseinheiten,
    projekte: App.Views.Projekte,
    zuweisungen: App.Views.Zuweisungen
  };

  // ---- Router ----
  function navigate() {
    var hash = location.hash.replace('#', '') || 'dashboard';
    var view = routes[hash];

    if (!view) {
      hash = 'dashboard';
      view = routes.dashboard;
    }

    // Sidebar aktiven Link markieren
    var links = sidebar.querySelectorAll('.sidebar__link');
    for (var i = 0; i < links.length; i++) {
      links[i].classList.toggle('active', links[i].getAttribute('data-view') === hash);
    }

    // View rendern
    view.render(mainContent);

    // Sidebar auf Mobil schließen
    sidebar.classList.remove('open');
  }

  // ---- Hamburger ----
  hamburger.addEventListener('click', function() {
    sidebar.classList.toggle('open');
  });

  // Sidebar schließen bei Klick außerhalb (mobil)
  document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && e.target !== hamburger && !hamburger.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });

  // ---- Export/Import ----
  document.getElementById('btn-export').addEventListener('click', function() {
    App.Store.downloadExport();
    App.Components.Notify.success('Daten exportiert');
  });

  document.getElementById('btn-import').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(evt) {
      try {
        var data = JSON.parse(evt.target.result);
        App.Components.Modal.confirm({
          title: 'Daten importieren',
          message: 'Alle vorhandenen Daten werden durch den Import ersetzt. Fortfahren?',
          confirmLabel: 'Importieren',
          confirmClass: 'btn--primary',
          onConfirm: function() {
            App.Store.importData(data);
            App.Components.Notify.success('Daten erfolgreich importiert');
            navigate();
          }
        });
      } catch (err) {
        App.Components.Notify.error('Import fehlgeschlagen: Ungültige JSON-Datei');
      }
    };
    reader.readAsText(file);
    // Input zurücksetzen für erneuten Import
    e.target.value = '';
  });

  // ---- Seed-Daten ----
  function seedData() {
    if (!App.Store.isEmpty()) return;

    var orgDev = App.Models.createOrganisationseinheit({ name: 'Entwicklung', beschreibung: 'Software-Entwicklungsteam' });
    var orgDesign = App.Models.createOrganisationseinheit({ name: 'Design', beschreibung: 'UI/UX Design-Team' });
    var orgPM = App.Models.createOrganisationseinheit({ name: 'Projektmanagement', beschreibung: 'Projektleitung und Koordination' });

    App.Store.add('organisationseinheiten', orgDev);
    App.Store.add('organisationseinheiten', orgDesign);
    App.Store.add('organisationseinheiten', orgPM);

    var ma1 = App.Models.createMitarbeiter({ name: 'Anna Schmidt', rolle: 'Senior Entwicklerin', organisationseinheitId: orgDev.id, verfuegbarkeitStunden: 40, faehigkeiten: ['Java', 'React', 'SQL'] });
    var ma2 = App.Models.createMitarbeiter({ name: 'Max Müller', rolle: 'Frontend Entwickler', organisationseinheitId: orgDev.id, verfuegbarkeitStunden: 40, faehigkeiten: ['React', 'TypeScript', 'CSS'] });
    var ma3 = App.Models.createMitarbeiter({ name: 'Lisa Weber', rolle: 'UX Designerin', organisationseinheitId: orgDesign.id, verfuegbarkeitStunden: 32, faehigkeiten: ['Figma', 'User Research'] });
    var ma4 = App.Models.createMitarbeiter({ name: 'Tom Fischer', rolle: 'Projektleiter', organisationseinheitId: orgPM.id, verfuegbarkeitStunden: 40, faehigkeiten: ['Scrum', 'Jira', 'Stakeholder-Management'] });
    var ma5 = App.Models.createMitarbeiter({ name: 'Sarah Koch', rolle: 'Backend Entwicklerin', organisationseinheitId: orgDev.id, verfuegbarkeitStunden: 40, faehigkeiten: ['Python', 'Django', 'PostgreSQL'] });

    App.Store.add('mitarbeiter', ma1);
    App.Store.add('mitarbeiter', ma2);
    App.Store.add('mitarbeiter', ma3);
    App.Store.add('mitarbeiter', ma4);
    App.Store.add('mitarbeiter', ma5);

    var heute = new Date();
    var startStr = formatDateISO(heute);
    var ende3M = formatDateISO(addMonths(heute, 3));
    var ende6M = formatDateISO(addMonths(heute, 6));
    var start1M = formatDateISO(addMonths(heute, 1));
    var ende4M = formatDateISO(addMonths(heute, 4));
    var startMinus1M = formatDateISO(addMonths(heute, -1));

    var prj1 = App.Models.createProjekt({ name: 'Kundenportal Relaunch', beschreibung: 'Neugestaltung des Kundenportals', startDatum: startMinus1M, endDatum: ende3M, status: 'Aktiv' });
    var prj2 = App.Models.createProjekt({ name: 'Mobile App v2', beschreibung: 'Neue Version der Mobile App', startDatum: start1M, endDatum: ende6M, status: 'Planung' });
    var prj3 = App.Models.createProjekt({ name: 'API-Integration Partner X', beschreibung: 'Integration der Partner-Schnittstelle', startDatum: startStr, endDatum: ende4M, status: 'Aktiv' });

    App.Store.add('projekte', prj1);
    App.Store.add('projekte', prj2);
    App.Store.add('projekte', prj3);

    App.Store.add('zuweisungen', App.Models.createZuweisung({ mitarbeiterId: ma1.id, projektId: prj1.id, stundenProWoche: 24, startDatum: prj1.startDatum, endDatum: prj1.endDatum, notiz: 'Technische Leitung' }));
    App.Store.add('zuweisungen', App.Models.createZuweisung({ mitarbeiterId: ma2.id, projektId: prj1.id, stundenProWoche: 32, startDatum: prj1.startDatum, endDatum: prj1.endDatum, notiz: 'Frontend-Entwicklung' }));
    App.Store.add('zuweisungen', App.Models.createZuweisung({ mitarbeiterId: ma3.id, projektId: prj1.id, stundenProWoche: 20, startDatum: prj1.startDatum, endDatum: ende3M, notiz: 'UX Design & Prototyping' }));
    App.Store.add('zuweisungen', App.Models.createZuweisung({ mitarbeiterId: ma4.id, projektId: prj1.id, stundenProWoche: 16, startDatum: prj1.startDatum, endDatum: prj1.endDatum, notiz: '' }));
    App.Store.add('zuweisungen', App.Models.createZuweisung({ mitarbeiterId: ma1.id, projektId: prj3.id, stundenProWoche: 16, startDatum: prj3.startDatum, endDatum: prj3.endDatum, notiz: 'API-Architektur' }));
    App.Store.add('zuweisungen', App.Models.createZuweisung({ mitarbeiterId: ma5.id, projektId: prj3.id, stundenProWoche: 32, startDatum: prj3.startDatum, endDatum: prj3.endDatum, notiz: 'Backend-Entwicklung' }));
    App.Store.add('zuweisungen', App.Models.createZuweisung({ mitarbeiterId: ma4.id, projektId: prj2.id, stundenProWoche: 8, startDatum: prj2.startDatum, endDatum: prj2.endDatum, notiz: 'Planung & Koordination' }));
    App.Store.add('zuweisungen', App.Models.createZuweisung({ mitarbeiterId: ma3.id, projektId: prj2.id, stundenProWoche: 16, startDatum: prj2.startDatum, endDatum: prj2.endDatum, notiz: 'App-Design' }));
  }

  function addMonths(date, n) {
    var d = new Date(date);
    d.setMonth(d.getMonth() + n);
    return d;
  }

  function formatDateISO(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // ---- Init ----
  function init() {
    seedData();
    window.addEventListener('hashchange', navigate);
    navigate();
  }

  // Auf DOM-Ready warten (sollte bereits geladen sein da Script am Ende)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
