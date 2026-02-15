/**
 * SVG Balkendiagramm + Gantt-Timeline
 * Globaler Namespace: App.Components.Chart
 */
var App = window.App || {};
App.Components = App.Components || {};
App.Components.Chart = (function() {
  'use strict';

  /**
   * Horizontales Balkendiagramm (SVG)
   * @param {Array} data - [{label, value, color?}]
   * @param {Object} options - {maxValue?, height?, barHeight?, unit?}
   */
  function barChart(data, options) {
    options = options || {};
    if (!data || data.length === 0) {
      return '<div class="empty-state"><div class="empty-state__text">Keine Daten vorhanden</div></div>';
    }

    var barHeight = options.barHeight || 28;
    var gap = 8;
    var labelWidth = 140;
    var valueWidth = 60;
    var chartWidth = options.width || 500;
    var barAreaWidth = chartWidth - labelWidth - valueWidth;
    var maxValue = options.maxValue || 100;
    var unit = options.unit || '%';
    var totalHeight = data.length * (barHeight + gap) + gap;

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + chartWidth + '" height="' + totalHeight + '" viewBox="0 0 ' + chartWidth + ' ' + totalHeight + '" style="max-width:100%">';

    for (var i = 0; i < data.length; i++) {
      var y = i * (barHeight + gap) + gap;
      var item = data[i];
      var val = Math.min(item.value, maxValue * 1.5);
      var barW = Math.max((val / maxValue) * barAreaWidth, 0);
      var color = item.color || getAuslastungColor(item.value);

      // Label
      svg += '<text x="' + (labelWidth - 8) + '" y="' + (y + barHeight / 2 + 5) + '" text-anchor="end" font-size="13" fill="#374151">' + escapeXml(truncate(item.label, 18)) + '</text>';

      // Background bar
      svg += '<rect x="' + labelWidth + '" y="' + y + '" width="' + barAreaWidth + '" height="' + barHeight + '" rx="4" fill="#f3f4f6"/>';

      // 100% marker line
      var markerX = labelWidth + barAreaWidth;
      svg += '<line x1="' + markerX + '" y1="' + y + '" x2="' + markerX + '" y2="' + (y + barHeight) + '" stroke="#d1d5db" stroke-width="1" stroke-dasharray="4,2"/>';

      // Value bar
      var clampedBarW = Math.min(barW, barAreaWidth);
      svg += '<rect x="' + labelWidth + '" y="' + y + '" width="' + clampedBarW + '" height="' + barHeight + '" rx="4" fill="' + color + '"/>';

      // Value text
      svg += '<text x="' + (labelWidth + barAreaWidth + 8) + '" y="' + (y + barHeight / 2 + 5) + '" font-size="13" font-weight="600" fill="#374151">' + item.value + unit + '</text>';
    }

    svg += '</svg>';
    return '<div class="chart-container">' + svg + '</div>';
  }

  function getAuslastungColor(percent) {
    if (percent <= 80) return '#16a34a';
    if (percent <= 100) return '#f59e0b';
    return '#dc2626';
  }

  /**
   * Gantt-Timeline
   * @param {Array} projekte - Projektobjekte
   */
  function ganttTimeline(projekte) {
    if (!projekte || projekte.length === 0) {
      return '<div class="empty-state"><div class="empty-state__text">Keine Projekte vorhanden</div></div>';
    }

    // Zeitraum berechnen
    var allDates = [];
    projekte.forEach(function(p) {
      if (p.startDatum) allDates.push(new Date(p.startDatum));
      if (p.endDatum) allDates.push(new Date(p.endDatum));
    });

    if (allDates.length === 0) {
      return '<div class="empty-state"><div class="empty-state__text">Keine Datumsbereiche definiert</div></div>';
    }

    var minDate = new Date(Math.min.apply(null, allDates));
    var maxDate = new Date(Math.max.apply(null, allDates));

    // Auf Monatsanfang/-ende runden
    minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

    var months = getMonthsBetween(minDate, maxDate);
    var totalDays = daysBetween(minDate, maxDate) + 1;
    var pixelsPerDay = 4;
    var trackWidth = totalDays * pixelsPerDay;
    var monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

    var html = '<div class="gantt">';

    // Header: Monate
    html += '<div class="gantt__header">';
    html += '<div class="gantt__label" style="font-weight:600;border-right:1px solid #e5e7eb">Projekt</div>';
    html += '<div class="gantt__track" style="display:flex">';
    for (var m = 0; m < months.length; m++) {
      var mDate = months[m];
      var daysInMonth = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0).getDate();
      var mWidth = daysInMonth * pixelsPerDay;
      html += '<div class="gantt__month" style="width:' + mWidth + 'px">' + monthNames[mDate.getMonth()] + ' ' + mDate.getFullYear() + '</div>';
    }
    html += '</div></div>';

    // Rows
    html += '<div class="gantt__body">';
    for (var i = 0; i < projekte.length; i++) {
      var p = projekte[i];
      var pStart = p.startDatum ? new Date(p.startDatum) : null;
      var pEnd = p.endDatum ? new Date(p.endDatum) : null;

      html += '<div class="gantt__row">';
      html += '<div class="gantt__label" title="' + escapeHtml(p.name) + '">' + escapeHtml(truncate(p.name, 20)) + '</div>';
      html += '<div class="gantt__track" style="width:' + trackWidth + 'px">';

      if (pStart && pEnd) {
        var left = daysBetween(minDate, pStart) * pixelsPerDay;
        var width = (daysBetween(pStart, pEnd) + 1) * pixelsPerDay;
        var statusClass = 'gantt__bar--' + p.status.toLowerCase();
        html += '<div class="gantt__bar ' + statusClass + '" style="left:' + left + 'px;width:' + width + 'px" title="' + escapeHtml(p.name) + '">' + escapeHtml(truncate(p.name, 15)) + '</div>';
      }

      html += '</div></div>';
    }
    html += '</div></div>';

    return html;
  }

  // Hilfsfunktionen
  function daysBetween(d1, d2) {
    var ms = d2.getTime() - d1.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  function getMonthsBetween(start, end) {
    var months = [];
    var current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }

  function truncate(str, max) {
    if (str.length <= max) return str;
    return str.substring(0, max - 1) + '…';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function escapeXml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return {
    barChart: barChart,
    ganttTimeline: ganttTimeline,
    getAuslastungColor: getAuslastungColor
  };
})();
