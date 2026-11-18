/**
 * BHARAT-VARSHA // Chart Rendering Engine
 * Built with Chart.js with Glassmorphism Theme, Dynamic Gradients, and Rich Tooltips
 */

window.AppCharts = (function () {
  // Chart Instances Registry
  const instances = {};

  // Color Constants matching CSS Design System
  const COLORS = {
    cyan: '#06B6D4',
    cyanAlpha: 'rgba(6, 182, 212, 0.25)',
    blue: '#3B82F6',
    blueAlpha: 'rgba(59, 130, 246, 0.25)',
    emerald: '#10B981',
    emeraldAlpha: 'rgba(16, 185, 129, 0.25)',
    amber: '#F59E0B',
    amberAlpha: 'rgba(245, 158, 11, 0.25)',
    rose: '#EF4444',
    roseAlpha: 'rgba(239, 68, 68, 0.25)',
    purple: '#8B5CF6',
    purpleAlpha: 'rgba(139, 92, 246, 0.25)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    gridLines: 'rgba(255, 255, 255, 0.07)'
  };

  // Base options for dark theme charts
  function getBaseOptions(titleText = '') {
    const isLight = document.body.classList.contains('light-theme');
    const textColor = isLight ? '#0F172A' : COLORS.textPrimary;
    const mutedColor = isLight ? '#64748B' : COLORS.textSecondary;
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.07)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 450,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: mutedColor,
            font: { family: 'Outfit', size: 12, weight: '500' },
            usePointStyle: true,
            boxWidth: 8
          }
        },
        tooltip: {
          backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15, 23, 42, 0.95)',
          titleColor: isLight ? '#0F172A' : '#F8FAFC',
          bodyColor: isLight ? '#334155' : '#CBD5E1',
          borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          titleFont: { family: 'Outfit', size: 13, weight: '700' },
          bodyFont: { family: 'Outfit', size: 12 }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: mutedColor, font: { family: 'Outfit', size: 11 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: mutedColor, font: { family: 'Outfit', size: 11 } }
        }
      }
    };
  }

  function destroyChart(id) {
    if (instances[id]) {
      instances[id].destroy();
      delete instances[id];
    }
  }

  // 1. Annual Rainfall Trendline (1901–2015)
  function renderAnnualTrend(canvasId, seriesData, lpaValue, overlays = { sma5: true, sma10: true, trendline: true, lpa: true }) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const labels = seriesData.map(d => d.year);
    const annualVals = seriesData.map(d => d.annual);
    const monsoonVals = seriesData.map(d => d.monsoon);

    // Dynamic linear regression trendline
    const n = seriesData.length;
    let trendlineVals = [];
    if (n > 1) {
      const sumX = seriesData.reduce((acc, d, i) => acc + i, 0);
      const sumY = annualVals.reduce((acc, v) => acc + v, 0);
      const sumXY = seriesData.reduce((acc, d, i) => acc + i * d.annual, 0);
      const sumX2 = seriesData.reduce((acc, d, i) => acc + i * i, 0);
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      trendlineVals = seriesData.map((d, i) => Math.round((intercept + slope * i) * 10) / 10);
    }

    const datasets = [
      {
        label: 'Annual Rainfall (mm)',
        data: annualVals,
        borderColor: COLORS.cyan,
        backgroundColor: COLORS.cyanAlpha,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.15,
        order: 3
      },
      {
        label: 'Monsoon Rain (Jun-Sep)',
        data: monsoonVals,
        borderColor: COLORS.blue,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [3, 3],
        pointRadius: 0,
        tension: 0.15,
        order: 4
      }
    ];

    if (overlays.sma5) {
      datasets.push({
        label: '5-Yr Moving Average',
        data: seriesData.map(d => d.sma_5),
        borderColor: COLORS.emerald,
        borderWidth: 2.5,
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 2
      });
    }

    if (overlays.sma10) {
      datasets.push({
        label: '10-Yr Moving Average',
        data: seriesData.map(d => d.sma_10),
        borderColor: COLORS.amber,
        borderWidth: 2.5,
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 2
      });
    }

    if (overlays.trendline && trendlineVals.length) {
      datasets.push({
        label: 'Linear Climate Trend',
        data: trendlineVals,
        borderColor: COLORS.purple,
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        order: 1
      });
    }

    if (overlays.lpa) {
      datasets.push({
        label: `LPA Baseline (${lpaValue} mm)`,
        data: seriesData.map(() => lpaValue),
        borderColor: COLORS.rose,
        borderWidth: 1.5,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        order: 1
      });
    }

    const options = getBaseOptions();
    options.scales.y.title = {
      display: true,
      text: 'Precipitation Depth (mm)',
      color: COLORS.textSecondary,
      font: { family: 'Outfit', size: 12, weight: '600' }
    };
    options.plugins.tooltip.callbacks = {
      label: function (ctx) {
        return `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} mm`;
      }
    };

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options
    });
  }

  // 2. Year-over-Year (YoY) Changes Bar Chart
  function renderYoYChanges(canvasId, seriesData) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const filtered = seriesData.slice(1); // skip year 0
    const labels = filtered.map(d => d.year);
    const values = filtered.map(d => d.yoy_change);
    const bgColors = values.map(v => v >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)');
    const borderColors = values.map(v => v >= 0 ? COLORS.emerald : COLORS.rose);

    const options = getBaseOptions();
    options.plugins.legend.display = false;
    options.scales.y.title = {
      display: true,
      text: 'Δ Change from Prior Year (mm)',
      color: COLORS.textSecondary
    };
    options.plugins.tooltip.callbacks = {
      label: function (ctx) {
        const val = ctx.parsed.y;
        const pct = filtered[ctx.dataIndex].yoy_pct;
        return `YoY Delta: ${val > 0 ? '+' : ''}${val.toFixed(1)} mm (${pct > 0 ? '+' : ''}${pct.toFixed(1)}%)`;
      }
    };

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 2
        }]
      },
      options
    });
  }

  // 3. Decadal Climatological Shift Bar Chart
  function renderDecadalShift(canvasId, decadalData) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const labels = decadalData.map(d => d.decade);
    const annuals = decadalData.map(d => d.avg_annual);
    const monsoons = decadalData.map(d => d.avg_monsoon);

    const options = getBaseOptions();
    options.scales.y.title = { display: true, text: 'Decadal Average (mm)', color: COLORS.textSecondary };
    options.plugins.tooltip.callbacks = {
      afterLabel: function (ctx) {
        const item = decadalData[ctx.dataIndex];
        return `Departure from 115Y LPA: ${item.departure_from_lpa > 0 ? '+' : ''}${item.departure_from_lpa}%`;
      }
    };

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Decadal Annual Average (mm)',
            data: annuals,
            backgroundColor: 'rgba(6, 182, 212, 0.7)',
            borderColor: COLORS.cyan,
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Decadal Monsoon Average (mm)',
            data: monsoons,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: COLORS.blue,
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options
    });
  }

  // 4. Subdivisions Ranking Horizontal Bar Chart (All 36 Zones)
  function renderSubdivisionsRanking(canvasId, subdivList, onBarClick) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    // Sort descending by LPA
    const sorted = [...subdivList].sort((a, b) => b.lpa - a.lpa);
    const labels = sorted.map(d => d.name);
    const data = sorted.map(d => d.lpa);

    // Color code according to climate precipitation tier
    const bgColors = sorted.map(d => {
      if (d.lpa > 2500) return 'rgba(6, 182, 212, 0.85)'; // Very Heavy
      if (d.lpa > 1500) return 'rgba(16, 185, 129, 0.85)'; // Heavy
      if (d.lpa > 750) return 'rgba(59, 130, 246, 0.85)';  // Moderate
      return 'rgba(245, 158, 11, 0.85)';                   // Arid / Semi-Arid
    });

    const options = getBaseOptions();
    options.indexAxis = 'y';
    options.plugins.legend.display = false;
    options.scales.x.title = { display: true, text: 'Long Period Average Annual Precipitation (mm)', color: COLORS.textSecondary };
    options.scales.y.ticks.font = { family: 'Outfit', size: 10, weight: '500' };

    options.onClick = (evt, elements) => {
      if (elements.length > 0 && typeof onBarClick === 'function') {
        const index = elements[0].index;
        const selectedSubdiv = sorted[index].name;
        onBarClick(selectedSubdiv);
      }
    };

    options.plugins.tooltip.callbacks = {
      label: function (ctx) {
        const item = sorted[ctx.dataIndex];
        return [
          `LPA: ${item.lpa.toLocaleString()} mm`,
          `Monsoon Share: ${item.monsoon_share}%`,
          `Volatility (CV): ${item.cv}%`,
          `Zone: ${item.region}`
        ];
      }
    };

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options
    });
  }

  // 5. Monthly Rainfall Climatology Curve (Jan - Dec)
  function renderMonthlyCurve(canvasId, monthlyClim) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const means = months.map(m => monthlyClim[m]?.mean || 0);
    const maxs = months.map(m => monthlyClim[m]?.max || 0);
    const mins = months.map(m => monthlyClim[m]?.min || 0);

    const options = getBaseOptions();
    options.scales.y.title = { display: true, text: 'Precipitation Depth (mm)', color: COLORS.textSecondary };

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Climatological Mean (mm)',
            data: means,
            borderColor: COLORS.cyan,
            backgroundColor: COLORS.cyanAlpha,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: COLORS.cyan,
            fill: true,
            tension: 0.3
          },
          {
            label: 'Historical Max (Peak Month)',
            data: maxs,
            borderColor: COLORS.blue,
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Historical Min (Driest Month)',
            data: mins,
            borderColor: COLORS.amber,
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options
    });
  }

  // 6. Seasonal Breakdown Donut Chart
  function renderSeasonalDonut(canvasId, seasonalClim) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const seasons = ['Jun-Sep', 'Oct-Dec', 'Mar-May', 'Jan-Feb'];
    const labels = [
      'Monsoon (Jun-Sep)',
      'Post-Monsoon (Oct-Dec)',
      'Pre-Monsoon (Mar-May)',
      'Winter (Jan-Feb)'
    ];
    const data = seasons.map(s => seasonalClim[s]?.mean || 0);
    const shares = seasons.map(s => seasonalClim[s]?.share_pct || 0);

    const isLight = document.body.classList.contains('light-theme');
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: isLight ? '#0F172A' : COLORS.textPrimary,
            font: { family: 'Outfit', size: 12, weight: '500' },
            usePointStyle: true,
            padding: 14
          }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              const val = ctx.parsed;
              const pct = shares[ctx.dataIndex];
              return ` ${ctx.label}: ${val.toFixed(1)} mm (${pct}%)`;
            }
          }
        }
      },
      cutout: '62%'
    };

    instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            'rgba(6, 182, 212, 0.85)',  // Monsoon Cyan
            'rgba(139, 92, 246, 0.85)', // Post-monsoon Purple
            'rgba(16, 185, 129, 0.85)', // Pre-monsoon Emerald
            'rgba(59, 130, 246, 0.85)'  // Winter Blue
          ],
          borderColor: isLight ? '#FFFFFF' : '#111827',
          borderWidth: 2
        }]
      },
      options
    });
  }

  // 7. Southwest Monsoon Historical Anomaly Chart (Jun-Sep)
  function renderMonsoonAnomaly(canvasId, seriesData, monsoonLPA) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const labels = seriesData.map(d => d.year);
    const monsoons = seriesData.map(d => d.monsoon);
    const excessLine = seriesData.map(() => Math.round(monsoonLPA * 1.10 * 10) / 10);
    const deficientLine = seriesData.map(() => Math.round(monsoonLPA * 0.90 * 10) / 10);
    const scantyLine = seriesData.map(() => Math.round(monsoonLPA * 0.80 * 10) / 10);

    const options = getBaseOptions();
    options.scales.y.title = { display: true, text: 'Monsoon Precipitation (mm)', color: COLORS.textSecondary };
    options.plugins.tooltip.callbacks = {
      afterLabel: function (ctx) {
        const item = seriesData[ctx.dataIndex];
        return [
          `Departure: ${item.monsoon_departure > 0 ? '+' : ''}${item.monsoon_departure}%`,
          `IMD Category: ${item.category}`
        ];
      }
    };

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Observed Monsoon Rainfall (mm)',
            data: monsoons,
            borderColor: COLORS.cyan,
            backgroundColor: COLORS.cyanAlpha,
            borderWidth: 2,
            pointRadius: 2.5,
            fill: true,
            tension: 0.2
          },
          {
            label: `Monsoon LPA (${monsoonLPA} mm)`,
            data: seriesData.map(() => monsoonLPA),
            borderColor: COLORS.textPrimary,
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Excess Threshold (+10%)',
            data: excessLine,
            borderColor: COLORS.emerald,
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Deficient Threshold (-10%)',
            data: deficientLine,
            borderColor: COLORS.amber,
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false
          },
          {
            label: 'Scanty / Drought Threshold (-20%)',
            data: scantyLine,
            borderColor: COLORS.rose,
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options
    });
  }

  // 8. Monsoon 4-Month Progression (Jun, Jul, Aug, Sep)
  function renderMonsoonProgression(canvasId, seriesData) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    // Decadal progression
    const decades = [];
    for (let yr = 1910; yr <= 2015; yr += 15) {
      const start = yr - 9;
      const end = yr;
      const subset = seriesData.filter(d => d.year >= start && d.year <= end);
      if (subset.length) {
        decades.push({
          label: `${start}-${end}`,
          jun: subset.reduce((acc, d) => acc + d.months.JUN, 0) / subset.length,
          jul: subset.reduce((acc, d) => acc + d.months.JUL, 0) / subset.length,
          aug: subset.reduce((acc, d) => acc + d.months.AUG, 0) / subset.length,
          sep: subset.reduce((acc, d) => acc + d.months.SEP, 0) / subset.length
        });
      }
    }

    const labels = decades.map(d => d.label);
    const options = getBaseOptions();
    options.scales.y.title = { display: true, text: 'Average Rainfall (mm)', color: COLORS.textSecondary };

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'June (Arrival)', data: decades.map(d => Math.round(d.jun)), backgroundColor: 'rgba(59, 130, 246, 0.8)' },
          { label: 'July (Peak Phase)', data: decades.map(d => Math.round(d.jul)), backgroundColor: 'rgba(6, 182, 212, 0.85)' },
          { label: 'August (Peak Phase)', data: decades.map(d => Math.round(d.aug)), backgroundColor: 'rgba(16, 185, 129, 0.85)' },
          { label: 'September (Withdrawal)', data: decades.map(d => Math.round(d.sep)), backgroundColor: 'rgba(245, 158, 11, 0.8)' }
        ]
      },
      options
    });
  }

  // 9. Climate Volatility (CV %) Ranking
  function renderVolatilityRanking(canvasId, subdivList) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const sorted = [...subdivList].sort((a, b) => b.cv - a.cv).slice(0, 15);
    const labels = sorted.map(d => d.name);
    const data = sorted.map(d => d.cv);

    const options = getBaseOptions();
    options.indexAxis = 'y';
    options.plugins.legend.display = false;
    options.scales.x.title = { display: true, text: 'Coefficient of Variation (CV %)', color: COLORS.textSecondary };

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: data.map(v => v > 30 ? 'rgba(239, 68, 68, 0.8)' : (v > 20 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(59, 130, 246, 0.8)')),
          borderRadius: 4
        }]
      },
      options
    });
  }

  // 10. Multi-Year Projections Horizon (2016–2025)
  function renderMultiYearProjections(canvasId, projectionsData, scenarioFactor = 1.0) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const labels = projectionsData.map(d => d.year);
    const forecasted = projectionsData.map(d => Math.round(d.ensemble_forecast * scenarioFactor * 10) / 10);
    const upperCI = projectionsData.map(d => Math.round(d.upper_ci_95 * scenarioFactor * 10) / 10);
    const lowerCI = projectionsData.map(d => Math.round(d.lower_ci_95 * scenarioFactor * 10) / 10);
    const trendline = projectionsData.map(d => Math.round(d.linear_trend * 10) / 10);

    const options = getBaseOptions();
    options.scales.y.title = { display: true, text: 'Projected Rainfall (mm)', color: COLORS.textSecondary };

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Upper 95% Confidence Band',
            data: upperCI,
            borderColor: 'rgba(139, 92, 246, 0.3)',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: '+1',
            pointRadius: 0,
            tension: 0.2
          },
          {
            label: 'Lower 95% Confidence Band',
            data: lowerCI,
            borderColor: 'rgba(139, 92, 246, 0.3)',
            backgroundColor: 'transparent',
            fill: false,
            pointRadius: 0,
            tension: 0.2
          },
          {
            label: 'ML Ensemble Prediction',
            data: forecasted,
            borderColor: COLORS.purple,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: COLORS.purple,
            fill: false,
            tension: 0.2
          },
          {
            label: 'Linear Baseline Projection',
            data: trendline,
            borderColor: COLORS.cyan,
            borderWidth: 1.5,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options
    });
  }

  // 11. Out-of-sample Backtesting Evaluation (Actual vs Predicted 2006-2015)
  function renderBacktestingChart(canvasId, testRecords) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const labels = testRecords.map(d => d.year);
    const actuals = testRecords.map(d => d.actual);
    const ensembles = testRecords.map(d => d.ensemble);
    const holts = testRecords.map(d => d.holt_exponential);
    const sma5s = testRecords.map(d => d.sma_5);

    const options = getBaseOptions();
    options.scales.y.title = { display: true, text: 'Annual Rainfall (mm)', color: COLORS.textSecondary };

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ground Truth Actual (mm)',
            data: actuals,
            borderColor: COLORS.textPrimary,
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: COLORS.textPrimary,
            tension: 0.1
          },
          {
            label: 'Ensemble Model Forecast',
            data: ensembles,
            borderColor: COLORS.purple,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: COLORS.purple,
            tension: 0.2
          },
          {
            label: 'Holt Exponential Smoothing',
            data: holts,
            borderColor: COLORS.cyan,
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0,
            tension: 0.2
          },
          {
            label: '5-Year Moving Average',
            data: sma5s,
            borderColor: COLORS.emerald,
            borderWidth: 1.5,
            borderDash: [3, 3],
            pointRadius: 0,
            tension: 0.2
          }
        ]
      },
      options
    });
  }

  // 12. Comparison Radar Chart
  function renderComparisonRadar(canvasId, name1, data1, name2, data2) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const labels = [
      'Annual LPA (/30)',
      'Monsoon Share %',
      'Winter Rain (mm)',
      'Pre-Monsoon (mm)',
      'Post-Monsoon (mm)',
      'Stability (100-CV)'
    ];

    const vals1 = [
      Math.round(data1.lpa / 30),
      data1.seasonal_climatology['Jun-Sep'].share_pct,
      data1.seasonal_climatology['Jan-Feb'].mean,
      data1.seasonal_climatology['Mar-May'].mean,
      data1.seasonal_climatology['Oct-Dec'].mean,
      Math.max(0, 100 - data1.cv)
    ];

    const vals2 = [
      Math.round(data2.lpa / 30),
      data2.seasonal_climatology['Jun-Sep'].share_pct,
      data2.seasonal_climatology['Jan-Feb'].mean,
      data2.seasonal_climatology['Mar-May'].mean,
      data2.seasonal_climatology['Oct-Dec'].mean,
      Math.max(0, 100 - data2.cv)
    ];

    const isLight = document.body.classList.contains('light-theme');
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          grid: { color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' },
          angleLines: { color: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' },
          pointLabels: { color: isLight ? '#0F172A' : COLORS.textPrimary, font: { family: 'Outfit', size: 11, weight: '600' } },
          ticks: { display: false }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: isLight ? '#0F172A' : COLORS.textPrimary, font: { family: 'Outfit', size: 12 } }
        }
      }
    };

    instances[canvasId] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: name1,
            data: vals1,
            borderColor: COLORS.cyan,
            backgroundColor: 'rgba(6, 182, 212, 0.3)',
            borderWidth: 2
          },
          {
            label: name2,
            data: vals2,
            borderColor: COLORS.amber,
            backgroundColor: 'rgba(245, 158, 11, 0.3)',
            borderWidth: 2
          }
        ]
      },
      options
    });
  }

  // 13. Comparison Annual Time Series
  function renderComparisonAnnual(canvasId, name1, timeline1, name2, timeline2) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const labels = timeline1.map(d => d.year);
    const options = getBaseOptions();
    options.scales.y.title = { display: true, text: 'Annual Rainfall (mm)', color: COLORS.textSecondary };

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: name1,
            data: timeline1.map(d => d.annual),
            borderColor: COLORS.cyan,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.15
          },
          {
            label: name2,
            data: timeline2.map(d => d.annual),
            borderColor: COLORS.amber,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.15
          }
        ]
      },
      options
    });
  }

  // 14. Historical Annual Rainfall & 2016 Prediction Continuous Trajectory Chart
  function renderHistoricalAndPredicted(canvasId, historicalSeries, forecastObj, modelKey = 'ensemble', lpaValue = 1417.3) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    const modelLabels = {
      'ensemble': 'Blended Ensemble Forecaster',
      'holt': "Holt's Linear Exponential Smoothing",
      'ridge': 'Autoregressive Ridge (Lag-3)',
      'linear': 'OLS Linear Trend Model',
      'sma5': '5-Year Rolling Moving Average'
    };

    const predKeyMap = {
      'ensemble': 'ensemble',
      'holt': 'holt_exponential',
      'ridge': 'ridge_lag',
      'linear': 'linear_trend',
      'sma5': 'sma_5'
    };

    const selectedKey = predKeyMap[modelKey] || 'ensemble';
    const predValue = forecastObj?.predictions?.[selectedKey] || 1339.9;
    const ciUpper = forecastObj?.confidence_interval_95?.upper || Math.round(predValue * 1.17);
    const ciLower = forecastObj?.confidence_interval_95?.lower || Math.round(predValue * 0.83);

    // Build timeline of 116 points: 1901 to 2016
    const labels = historicalSeries.map(d => d.year).concat([2016]);
    const histData = historicalSeries.map(d => d.annual).concat([null]);

    // Connect from 2015 to 2016 seamlessly
    const lastHistVal = historicalSeries[historicalSeries.length - 1]?.annual || 0;
    const predData = new Array(historicalSeries.length - 1).fill(null).concat([lastHistVal, predValue]);
    const upperCIData = new Array(historicalSeries.length - 1).fill(null).concat([lastHistVal, ciUpper]);
    const lowerCIData = new Array(historicalSeries.length - 1).fill(null).concat([lastHistVal, ciLower]);
    const lpaData = labels.map(() => lpaValue);

    // Point radius array for predicted line (0 for past years, 7 for 2016)
    const predPointRadius = new Array(historicalSeries.length).fill(0).concat([7]);

    const options = getBaseOptions();
    options.scales.y.title = { display: true, text: 'Annual Precipitation (mm)', color: COLORS.textSecondary };
    options.plugins.tooltip.callbacks = {
      label: function (ctx) {
        if (ctx.parsed.y === null) return '';
        const yr = labels[ctx.dataIndex];
        if (yr === 2016) {
          if (ctx.dataset.label.includes('Predicted')) {
            const dep = Math.round(((predValue - lpaValue) / lpaValue) * 1000) / 10;
            return `🎯 2016 Prediction: ${predValue.toLocaleString()} mm (${dep > 0 ? '+' : ''}${dep}% vs LPA)`;
          }
          if (ctx.dataset.label.includes('Upper')) return `Upper 95% Bound: ${ciUpper.toLocaleString()} mm`;
          if (ctx.dataset.label.includes('Lower')) return `Lower 95% Bound: ${ciLower.toLocaleString()} mm`;
        }
        return `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} mm`;
      }
    };

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Historical Observed Annual (1901–2015)',
            data: histData,
            borderColor: COLORS.cyan,
            backgroundColor: COLORS.cyanAlpha,
            borderWidth: 2,
            pointRadius: 1.5,
            pointHoverRadius: 5,
            fill: false,
            tension: 0.15,
            order: 3
          },
          {
            label: `2016 Predicted Rainfall (${modelLabels[modelKey] || 'Ensemble'})`,
            data: predData,
            borderColor: COLORS.purple,
            borderWidth: 3.5,
            borderDash: [5, 4],
            pointRadius: predPointRadius,
            pointBackgroundColor: COLORS.purple,
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointHoverRadius: 9,
            fill: false,
            tension: 0.15,
            order: 1
          },
          {
            label: 'Upper 95% Confidence Band',
            data: upperCIData,
            borderColor: 'rgba(168, 85, 247, 0.4)',
            borderDash: [3, 3],
            borderWidth: 1.5,
            fill: '+1',
            backgroundColor: 'rgba(168, 85, 247, 0.12)',
            pointRadius: 0,
            tension: 0.15,
            order: 2
          },
          {
            label: 'Lower 95% Confidence Band',
            data: lowerCIData,
            borderColor: 'rgba(168, 85, 247, 0.4)',
            borderDash: [3, 3],
            borderWidth: 1.5,
            fill: false,
            pointRadius: 0,
            tension: 0.15,
            order: 2
          },
          {
            label: `115-Year LPA Baseline (${lpaValue} mm)`,
            data: lpaData,
            borderColor: 'rgba(239, 68, 68, 0.7)',
            borderDash: [5, 5],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            order: 4
          }
        ]
      },
      options
    });
  }

  // 15. Top 5 Wettest vs Lowest 5 Driest Regions Comparison Bar Chart
  function renderTopVsLowestRegions(canvasId, topWet, topDry) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    // Take top 5 wettest and top 5 driest (reversed so lowest is at bottom)
    const wetItems = (topWet || []).slice(0, 5).map(d => ({ name: d.name, val: d.lpa, type: 'Wettest Pluvial Belt (+)' }));
    const dryItems = (topDry || []).slice(0, 5).reverse().map(d => ({ name: d.name, val: d.lpa, type: 'Driest Arid Belt (-)' }));
    const combined = [...wetItems, ...dryItems];

    const labels = combined.map(d => d.name);
    const data = combined.map(d => d.val);
    const bgColors = combined.map(d => d.type.startsWith('Wettest') ? 'rgba(6, 182, 212, 0.85)' : 'rgba(245, 158, 11, 0.85)');
    const borderColors = combined.map(d => d.type.startsWith('Wettest') ? COLORS.cyan : COLORS.amber);

    const options = getBaseOptions();
    options.indexAxis = 'y';
    options.plugins.legend.display = false;
    options.scales.x.title = { display: true, text: 'Long Period Average Annual Rainfall (mm)', color: COLORS.textSecondary };
    options.scales.y.ticks.font = { family: 'Outfit', size: 10, weight: '500' };

    options.plugins.tooltip.callbacks = {
      label: function(ctx) {
        const item = combined[ctx.dataIndex];
        return [
          `Classification: ${item.type}`,
          `Annual Precipitation LPA: ${item.val.toLocaleString()} mm`
        ];
      }
    };

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options
    });
  }

  // 16. IMD Macro-Climate Zones Climatology Bar Chart
  function renderRegionalZones(canvasId, regionalSummary) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || !regionalSummary) return;

    const zoneKeys = ['NORTH_WEST', 'CENTRAL', 'SOUTH_PENINSULA', 'EAST_NORTH_EAST'];
    const zoneLabels = ['North-West India', 'Central India', 'South Peninsula', 'East & North-East'];
    const annualLPAs = zoneKeys.map(k => regionalSummary[k]?.lpa || 0);
    const monsoonLPAs = zoneKeys.map(k => regionalSummary[k]?.monsoon_lpa || 0);

    const options = getBaseOptions();
    options.scales.y.title = { display: true, text: 'Long Period Average (mm)', color: COLORS.textSecondary };
    options.plugins.tooltip.callbacks = {
      afterLabel: function(ctx) {
        const k = zoneKeys[ctx.dataIndex];
        const share = regionalSummary[k]?.monsoon_share || 0;
        const count = regionalSummary[k]?.subdivision_count || 0;
        return [
          `Monsoon Share: ${share}% of Annual`,
          `Subdivisions in Zone: ${count}`
        ];
      }
    };

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: zoneLabels,
        datasets: [
          {
            label: 'Annual LPA Rainfall (mm)',
            data: annualLPAs,
            backgroundColor: 'rgba(6, 182, 212, 0.85)',
            borderColor: COLORS.cyan,
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Monsoon (Jun–Sep) LPA (mm)',
            data: monsoonLPAs,
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            borderColor: COLORS.blue,
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options
    });
  }

  // 17. AI & Machine Learning Models Accuracy Benchmark Chart
  function renderModelBenchmark(canvasId, metrics) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx || !metrics) return;

    const modelNames = [
      'Blended Ensemble',
      'Ridge AR(3)',
      'Holt Exponential',
      'Linear Trend',
      '5-Yr SMA'
    ];

    const dataKeys = [
      'Ensemble Forecaster',
      'Autoregressive AR(3)',
      'Holt Exponential Smoothing',
      'Linear Trend',
      '5-Year Moving Average'
    ];

    const rmseVals = dataKeys.map(k => metrics[k]?.rmse || 116.0);
    const mapeVals = dataKeys.map(k => metrics[k]?.mape || 7.5);

    const bgColors = [
      'rgba(139, 92, 246, 0.85)',  // Ensemble Purple (Primary)
      'rgba(6, 182, 212, 0.85)',   // Ridge Cyan
      'rgba(16, 185, 129, 0.85)',  // Holt Emerald
      'rgba(59, 130, 246, 0.85)',   // Linear Blue
      'rgba(245, 158, 11, 0.85)'   // SMA Amber
    ];

    const options = getBaseOptions();
    options.scales.y = {
      ...options.scales.y,
      min: 80,
      max: 135,
      title: { display: true, text: 'Out-of-Sample RMSE (mm) [Lower Error is Better]', color: COLORS.textSecondary }
    };

    options.plugins.legend.display = false;
    options.plugins.tooltip.callbacks = {
      label: function(ctx) {
        const val = ctx.parsed.y;
        const mape = mapeVals[ctx.dataIndex];
        return [
          `Root Mean Squared Error: ${val.toFixed(1)} mm`,
          `Mean Absolute % Error (MAPE): ${mape.toFixed(2)}%`,
          `Validation Period: 2006–2015 Holdout`
        ];
      }
    };

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: modelNames,
        datasets: [{
          data: rmseVals,
          backgroundColor: bgColors,
          borderWidth: 0,
          borderRadius: 4
        }]
      },
      options
    });
  }

  // Refresh all rendered charts when theme toggles
  function refreshTheme() {
    Object.keys(instances).forEach(key => {
      if (instances[key]) {
        instances[key].update();
      }
    });
  }

  return {
    renderAnnualTrend,
    renderYoYChanges,
    renderDecadalShift,
    renderSubdivisionsRanking,
    renderMonthlyCurve,
    renderSeasonalDonut,
    renderMonsoonAnomaly,
    renderMonsoonProgression,
    renderVolatilityRanking,
    renderMultiYearProjections,
    renderBacktestingChart,
    renderComparisonRadar,
    renderComparisonAnnual,
    renderHistoricalAndPredicted,
    renderTopVsLowestRegions,
    renderRegionalZones,
    renderModelBenchmark,
    refreshTheme,
    destroyChart
  };
})();
