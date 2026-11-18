/**
 * BHARAT-VARSHA // Main Application Orchestrator
 * Connects UI controls, filters, chart rendering, ML forecasting, and data export
 */

(function () {
  'use strict';

  // Global State
  let DATA = null;
  let activeSubdivision = 'ALL_INDIA';
  let activeStartYear = 1901;
  let activeEndYear = 2015;
  let activeOverlays = {
    sma5: true,
    sma10: true,
    trendline: true,
    lpa: true
  };
  let compareSubdivision = null;
  let tableCurrentPage = 1;
  const tableRowsPerPage = 25;
  let tableFilteredRows = [];
  let activePredModel = 'ensemble';

  // Zone human-friendly names
  const REGION_NAMES = {
    'NORTH_WEST': 'North-West India',
    'CENTRAL': 'Central India',
    'SOUTH_PENINSULA': 'South Peninsula',
    'EAST_NORTH_EAST': 'East & North-East'
  };

  // Initialize Application
  async function init() {
    try {
      if (window.RAINFALL_DATA) {
        DATA = window.RAINFALL_DATA;
      } else {
        const resp = await fetch('data/rainfall_analytics.json');
        DATA = await resp.json();
      }

      console.log('Rainfall dataset successfully loaded:', DATA.metadata);

      setupThemeToggle();
      populateDropdowns();
      bindFilterEvents();
      bindTabNavigation();
      initGranularTable();

      // Initialize ML scenarios
      window.AppPredictions.initScenarios(() => {
        updateForecastCards();
        updateHistoricalAndPredictedChart();
        updateMultiYearChart();
      });

      // Initialize Model Selector
      setupModelSelector();

      // Initialize Presentation Deck
      window.AppPresentation.initPresentation();

      // Initial Render
      refreshDashboard();

    } catch (err) {
      console.error('Failed to initialize dashboard:', err);
    }
  }

  // Theme Toggle
  function setupThemeToggle() {
    const btnTheme = document.getElementById('btn-theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    // Check system preference or localStorage
    const savedTheme = localStorage.getItem('bv_theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      if (themeIcon) themeIcon.textContent = '☀️';
    }

    if (btnTheme) {
      btnTheme.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        if (themeIcon) themeIcon.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('bv_theme', isLight ? 'light' : 'dark');
        window.AppCharts.refreshTheme();
      });
    }
  }

  // Populate Dropdown Menus
  function populateDropdowns() {
    const subdivSelect = document.getElementById('select-subdivision');
    const compareSelect = document.getElementById('select-compare-subdivision');

    if (!subdivSelect) return;

    // Clear existing subdivision options except All-India
    subdivSelect.innerHTML = '<option value="ALL_INDIA" selected>🇮🇳 All-India National Composite</option>';
    if (compareSelect) {
      compareSelect.innerHTML = '<option value="">Select Target for Comparison...</option>';
    }

    // Group subdivisions by climate zone
    Object.keys(DATA.regions).forEach(regKey => {
      const optGroup = document.createElement('optgroup');
      optGroup.label = `── ${REGION_NAMES[regKey] || regKey} ──`;

      const compareOptGroup = document.createElement('optgroup');
      compareOptGroup.label = `── ${REGION_NAMES[regKey] || regKey} ──`;

      DATA.regions[regKey].forEach(subdiv => {
        if (DATA.subdivisions.includes(subdiv)) {
          const opt = document.createElement('option');
          opt.value = subdiv;
          opt.textContent = subdiv;
          optGroup.appendChild(opt);

          const cOpt = document.createElement('option');
          cOpt.value = subdiv;
          cOpt.textContent = subdiv;
          compareOptGroup.appendChild(cOpt);
        }
      });

      subdivSelect.appendChild(optGroup);
      if (compareSelect) compareSelect.appendChild(compareOptGroup);
    });
  }

  // Bind Filter Events
  function bindFilterEvents() {
    // 1. Subdivision Select
    const subdivSelect = document.getElementById('select-subdivision');
    if (subdivSelect) {
      subdivSelect.addEventListener('change', (e) => {
        activeSubdivision = e.target.value;
        refreshDashboard();
      });
    }

    // 2. Zone Filter
    const regionSelect = document.getElementById('select-region-filter');
    if (regionSelect) {
      regionSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val !== 'ALL' && DATA.regions[val]) {
          // Select the first subdivision in this zone
          const firstSubdiv = DATA.regions[val][0];
          if (firstSubdiv && subdivSelect) {
            subdivSelect.value = firstSubdiv;
            activeSubdivision = firstSubdiv;
            refreshDashboard();
          }
        }
      });
    }

    // 3. Year Range Slider
    const startSlider = document.getElementById('input-year-start');
    const endSlider = document.getElementById('input-year-end');
    const rangeLabel = document.getElementById('label-year-range');
    const countLabel = document.getElementById('label-year-count');

    function handleYearChange() {
      let s = parseInt(startSlider.value, 10);
      let e = parseInt(endSlider.value, 10);

      if (s > e) {
        // Prevent crossover
        if (this === startSlider) {
          startSlider.value = e;
          s = e;
        } else {
          endSlider.value = s;
          e = s;
        }
      }

      activeStartYear = s;
      activeEndYear = e;

      if (rangeLabel) rangeLabel.textContent = `${s} – ${e}`;
      if (countLabel) countLabel.textContent = e - s + 1;

      // Uncheck quick badges if custom
      document.querySelectorAll('.quick-year-btn').forEach(btn => {
        const bStart = parseInt(btn.dataset.start, 10);
        const bEnd = parseInt(btn.dataset.end, 10);
        if (bStart === s && bEnd === e) btn.classList.add('active');
        else btn.classList.remove('active');
      });

      refreshDashboard();
    }

    if (startSlider) startSlider.addEventListener('input', handleYearChange);
    if (endSlider) endSlider.addEventListener('input', handleYearChange);

    // 4. Quick Epoch Buttons
    const quickBtns = document.querySelectorAll('.quick-year-btn');
    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        quickBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const s = parseInt(btn.dataset.start, 10);
        const e = parseInt(btn.dataset.end, 10);

        if (startSlider) startSlider.value = s;
        if (endSlider) endSlider.value = e;
        activeStartYear = s;
        activeEndYear = e;

        if (rangeLabel) rangeLabel.textContent = `${s} – ${e}`;
        if (countLabel) countLabel.textContent = e - s + 1;

        refreshDashboard();
      });
    });

    // 5. Overlay Toggles
    const overlayToggles = [
      { id: 'toggle-sma5', key: 'sma5' },
      { id: 'toggle-sma10', key: 'sma10' },
      { id: 'toggle-trendline', key: 'trendline' },
      { id: 'toggle-lpa', key: 'lpa' }
    ];

    overlayToggles.forEach(t => {
      const el = document.getElementById(t.id);
      if (el) {
        el.addEventListener('click', () => {
          activeOverlays[t.key] = !activeOverlays[t.key];
          el.classList.toggle('active', activeOverlays[t.key]);
          updateAnnualChart();
        });
      }
    });

    // 6. Comparison Mode Controls
    const btnCompare = document.getElementById('btn-toggle-compare');
    const selectCompare = document.getElementById('select-compare-subdivision');
    const compModule = document.getElementById('card-comparison-module');
    const btnCloseComp = document.getElementById('btn-close-comparison');

    if (btnCompare && selectCompare) {
      btnCompare.addEventListener('click', () => {
        const isVisible = selectCompare.style.display !== 'none';
        selectCompare.style.display = isVisible ? 'none' : 'inline-block';
        if (isVisible) {
          compareSubdivision = null;
          if (compModule) compModule.style.display = 'none';
        }
      });

      selectCompare.addEventListener('change', (e) => {
        compareSubdivision = e.target.value;
        if (compareSubdivision && compModule) {
          compModule.style.display = 'block';
          updateComparisonCharts();
        } else if (compModule) {
          compModule.style.display = 'none';
        }
      });
    }

    if (btnCloseComp && compModule && selectCompare) {
      btnCloseComp.addEventListener('click', () => {
        compModule.style.display = 'none';
        compareSubdivision = null;
        selectCompare.value = '';
      });
    }

    // 7. CSV Export Buttons & Print Report
    const btnExportHeader = document.getElementById('btn-export-csv');
    const btnExportFiltered = document.getElementById('btn-export-filtered-csv');
    const btnPrintReport = document.getElementById('btn-print-report');

    if (btnExportHeader) btnExportHeader.addEventListener('click', exportActiveViewCSV);
    if (btnExportFiltered) btnExportFiltered.addEventListener('click', exportFilteredTableCSV);
    if (btnPrintReport) {
      btnPrintReport.addEventListener('click', () => {
        window.print();
      });
    }
  }

  // Bind Tab Navigation
  function bindTabNavigation() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const targetPanelId = tab.dataset.panel;
        const targetPanel = document.getElementById(targetPanelId);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }

        // Trigger chart redraw to adjust to panel width
        setTimeout(() => {
          window.AppCharts.refreshTheme();
        }, 50);
      });
    });
  }

  // Get current active series sliced by year range
  function getActiveTimeSeries() {
    if (activeSubdivision === 'ALL_INDIA') {
      return DATA.national_series.filter(d => d.year >= activeStartYear && d.year <= activeEndYear);
    } else {
      const details = DATA.subdivision_details[activeSubdivision];
      if (!details) return [];
      return details.timeline.filter(d => d.year >= activeStartYear && d.year <= activeEndYear);
    }
  }

  // Master Dashboard Refresh
  function refreshDashboard() {
    updateKPISection();
    updateAnnualChart();
    updateYoYChart();
    updateDecadalChart();
    updateSubdivisionRankings();
    updateMonthlyAndSeasonal();
    updateMonsoonSection();
    updateExtremesSection();
    updateHistoricalAndPredictedChart();
    updateForecastCards();
    updateMultiYearChart();
    updateBacktestingChart();
    if (compareSubdivision) {
      updateComparisonCharts();
    }
    filterGranularTable();
  }

  // 1. Update KPI Summary Section
  function updateKPISection() {
    const isNational = activeSubdivision === 'ALL_INDIA';
    const series = getActiveTimeSeries();

    let lpaVal, monsoonLPA, monsoonShare, cvVal, wettestYear, driestYear, wettestAmt, driestAmt, wettestDep, driestDep;

    if (isNational) {
      lpaVal = DATA.metadata.national_lpa;
      monsoonLPA = DATA.metadata.national_monsoon_lpa;
      monsoonShare = DATA.metadata.monsoon_share_national;
      cvVal = '8.4%';
      wettestYear = DATA.rankings.top_wettest_national_years[0].year;
      wettestAmt = DATA.rankings.top_wettest_national_years[0].annual + ' mm';
      wettestDep = '+' + DATA.rankings.top_wettest_national_years[0].departure + '%';
      driestYear = DATA.rankings.top_driest_national_years[0].year;
      driestAmt = DATA.rankings.top_driest_national_years[0].annual + ' mm';
      driestDep = DATA.rankings.top_driest_national_years[0].departure + '%';
    } else {
      const d = DATA.subdivision_details[activeSubdivision];
      lpaVal = d.lpa;
      monsoonLPA = d.monsoon_lpa;
      monsoonShare = d.monsoon_share;
      cvVal = d.cv + '%';
      wettestYear = d.top_wettest_years[0].year;
      wettestAmt = d.top_wettest_years[0].annual + ' mm';
      wettestDep = '+' + Math.round(((d.top_wettest_years[0].annual - d.lpa) / d.lpa) * 100) + '%';
      driestYear = d.top_driest_years[0].year;
      driestAmt = d.top_driest_years[0].annual + ' mm';
      driestDep = Math.round(((d.top_driest_years[0].annual - d.lpa) / d.lpa) * 100) + '%';
    }

    // Set DOM elements
    document.getElementById('kpi-val-lpa').textContent = lpaVal.toLocaleString();
    document.getElementById('kpi-val-monsoon').textContent = monsoonLPA.toLocaleString();
    document.getElementById('kpi-badge-monsoon-share').textContent = `${monsoonShare}% of Annual`;
    document.getElementById('kpi-val-wettest-year').textContent = wettestYear;
    document.getElementById('kpi-val-wettest-amt').textContent = wettestAmt;
    document.getElementById('kpi-badge-wettest-dep').textContent = wettestDep + ' vs LPA';
    document.getElementById('kpi-val-driest-year').textContent = driestYear;
    document.getElementById('kpi-val-driest-amt').textContent = driestAmt;
    document.getElementById('kpi-badge-driest-dep').textContent = driestDep + ' vs LPA';
    document.getElementById('kpi-val-cv').textContent = cvVal;

    // Scope Badge
    const scopeBadge = document.getElementById('badge-active-selection');
    if (scopeBadge) {
      scopeBadge.textContent = isNational ? 'Scope: All-India Composite' : `Scope: ${activeSubdivision}`;
    }

    // Slope Badge
    const slopeBadge = document.getElementById('badge-trend-slope');
    if (slopeBadge) {
      if (isNational) {
        slopeBadge.textContent = 'Slope: -0.82 mm / decade';
      } else {
        const d = DATA.subdivision_details[activeSubdivision];
        slopeBadge.textContent = `Slope: ${d.trend_slope_per_decade > 0 ? '+' : ''}${d.trend_slope_per_decade} mm / decade`;
      }
    }
  }

  // 2. Update Annual Trend Chart
  function updateAnnualChart() {
    const isNational = activeSubdivision === 'ALL_INDIA';
    const series = getActiveTimeSeries();
    const lpa = isNational ? DATA.metadata.national_lpa : DATA.subdivision_details[activeSubdivision].lpa;

    window.AppCharts.renderAnnualTrend('chart-annual-trend', series, lpa, activeOverlays);
  }

  // 3. Update YoY Dynamics Chart
  function updateYoYChart() {
    const series = getActiveTimeSeries();
    window.AppCharts.renderYoYChanges('chart-yoy-changes', series);
  }

  // 4. Update Decadal Climate Shift Chart
  function updateDecadalChart() {
    window.AppCharts.renderDecadalShift('chart-decadal-shift', DATA.decadal_trends);
  }

  // 5. Update Subdivision Rankings Chart
  function updateSubdivisionRankings() {
    const subdivList = Object.values(DATA.subdivision_details);
    window.AppCharts.renderSubdivisionsRanking('chart-subdivisions-ranking', subdivList, (selectedName) => {
      // When a bar is clicked, focus on that subdivision!
      activeSubdivision = selectedName;
      const selectEl = document.getElementById('select-subdivision');
      if (selectEl) selectEl.value = selectedName;
      refreshDashboard();
      // Scroll to top
      window.scrollTo({ top: 180, behavior: 'smooth' });
    });
  }

  // 6. Update Monthly and Seasonal Dynamics
  function updateMonthlyAndSeasonal() {
    const isNational = activeSubdivision === 'ALL_INDIA';
    let monthlyClim, seasonalClim;

    if (isNational) {
      monthlyClim = DATA.national_monthly_climatology;
      seasonalClim = DATA.national_seasonal_climatology;
    } else {
      const d = DATA.subdivision_details[activeSubdivision];
      monthlyClim = d.monthly_climatology;
      seasonalClim = d.seasonal_climatology;
    }

    window.AppCharts.renderMonthlyCurve('chart-monthly-curve', monthlyClim);
    if (document.getElementById('chart-monthly-curve-overview')) {
      window.AppCharts.renderMonthlyCurve('chart-monthly-curve-overview', monthlyClim);
    }
    window.AppCharts.renderSeasonalDonut('chart-seasonal-donut', seasonalClim);
    if (document.getElementById('chart-seasonal-donut-overview')) {
      window.AppCharts.renderSeasonalDonut('chart-seasonal-donut-overview', seasonalClim);
    }

    // Update Monthly Climatology Table
    const tbody = document.getElementById('tbody-monthly-climatology');
    if (tbody) {
      tbody.innerHTML = '';
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

      // Row 1: Active Selection Mean
      const trMean = document.createElement('tr');
      let trMeanHTML = `<td><strong>${isNational ? 'All-India LPA' : activeSubdivision} (Mean)</strong></td>`;
      let annSum = 0;
      months.forEach(m => {
        const v = monthlyClim[m]?.mean || 0;
        annSum += v;
        trMeanHTML += `<td style="color:${v > 200 ? 'var(--accent-cyan)' : 'inherit'}">${v.toFixed(1)}</td>`;
      });
      trMeanHTML += `<td><strong>${annSum.toFixed(1)}</strong></td>`;
      trMean.innerHTML = trMeanHTML;
      tbody.appendChild(trMean);

      // Row 2: 4 Climate Zones for reference
      Object.keys(DATA.regions).forEach(regKey => {
        const regSubdivs = DATA.regions[regKey];
        const trReg = document.createElement('tr');
        let regHTML = `<td>${REGION_NAMES[regKey] || regKey}</td>`;
        let regAnn = 0;
        months.forEach(m => {
          const sumM = regSubdivs.reduce((acc, s) => acc + (DATA.subdivision_details[s]?.monthly_climatology[m]?.mean || 0), 0);
          const avgM = sumM / regSubdivs.length;
          regAnn += avgM;
          regHTML += `<td>${avgM.toFixed(1)}</td>`;
        });
        regHTML += `<td>${regAnn.toFixed(1)}</td>`;
        trReg.innerHTML = regHTML;
        tbody.appendChild(trReg);
      });
    }
  }

  // 7. Update Monsoon Anomaly & Progression
  function updateMonsoonSection() {
    const isNational = activeSubdivision === 'ALL_INDIA';
    const series = getActiveTimeSeries();
    const monsoonLPA = isNational ? DATA.metadata.national_monsoon_lpa : DATA.subdivision_details[activeSubdivision].monsoon_lpa;

    window.AppCharts.renderMonsoonAnomaly('chart-monsoon-anomaly', series, monsoonLPA);
    if (document.getElementById('chart-monsoon-anomaly-overview')) {
      window.AppCharts.renderMonsoonAnomaly('chart-monsoon-anomaly-overview', series, monsoonLPA);
    }
    window.AppCharts.renderMonsoonProgression('chart-monsoon-months-progression', series);
  }

  // 8. Update Extremes & Rankings Section
  function updateExtremesSection() {
    const isNational = activeSubdivision === 'ALL_INDIA';

    // Wettest & Driest Years Tables
    const tbodyWet = document.getElementById('tbody-wettest-years');
    const tbodyDry = document.getElementById('tbody-driest-years');

    if (tbodyWet && tbodyDry) {
      tbodyWet.innerHTML = '';
      tbodyDry.innerHTML = '';

      let wetList, dryList;
      if (isNational) {
        wetList = DATA.rankings.top_wettest_national_years;
        dryList = DATA.rankings.top_driest_national_years;
      } else {
        const d = DATA.subdivision_details[activeSubdivision];
        wetList = d.top_wettest_years.map(x => ({
          year: x.year,
          annual: x.annual,
          monsoon: d.timeline.find(t => t.year === x.year)?.monsoon || 0,
          departure: Math.round(((x.annual - d.lpa) / d.lpa) * 100)
        }));
        dryList = d.top_driest_years.map(x => ({
          year: x.year,
          annual: x.annual,
          monsoon: d.timeline.find(t => t.year === x.year)?.monsoon || 0,
          departure: Math.round(((x.annual - d.lpa) / d.lpa) * 100)
        }));
      }

      wetList.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${item.year}</strong></td>
          <td style="color:var(--accent-cyan);">${item.annual} mm</td>
          <td>${item.monsoon} mm</td>
          <td><span class="kpi-badge badge-excess">+${item.departure}%</span></td>
        `;
        tbodyWet.appendChild(tr);
      });

      dryList.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${item.year}</strong></td>
          <td style="color:var(--accent-amber);">${item.annual} mm</td>
          <td>${item.monsoon} mm</td>
          <td><span class="kpi-badge badge-scanty">${item.departure}%</span></td>
        `;
        tbodyDry.appendChild(tr);
      });
    }

    // Wettest & Driest Subdivisions
    const tbodySubWet = document.getElementById('tbody-wettest-subdivs');
    const tbodySubDry = document.getElementById('tbody-driest-subdivs');

    if (tbodySubWet && tbodySubDry) {
      tbodySubWet.innerHTML = '';
      tbodySubDry.innerHTML = '';

      DATA.rankings.top_wettest_subdivisions.forEach((s, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${s.name}</strong></td>
          <td>${REGION_NAMES[s.region] || s.region}</td>
          <td style="color:var(--accent-cyan);">${s.lpa.toLocaleString()} mm</td>
          <td>${s.monsoon_share}%</td>
        `;
        tbodySubWet.appendChild(tr);
      });

      DATA.rankings.top_driest_subdivisions.forEach((s, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${s.name}</strong></td>
          <td>${REGION_NAMES[s.region] || s.region}</td>
          <td style="color:var(--accent-amber);">${s.lpa.toLocaleString()} mm</td>
          <td>${s.monsoon_share}%</td>
        `;
        tbodySubDry.appendChild(tr);
      });
    }

    // Volatility Ranking Chart
    const subdivList = Object.values(DATA.subdivision_details);
    window.AppCharts.renderVolatilityRanking('chart-volatility-ranking', subdivList);

    // Top vs Lowest Regions Comparison Chart (Overview)
    if (document.getElementById('chart-top-vs-lowest-regions')) {
      window.AppCharts.renderTopVsLowestRegions('chart-top-vs-lowest-regions', DATA.rankings.top_wettest_subdivisions, DATA.rankings.top_driest_subdivisions);
    }

    // Regional Climate Macro-Zones Climatology Chart (Overview)
    if (document.getElementById('chart-regional-zones-overview')) {
      window.AppCharts.renderRegionalZones('chart-regional-zones-overview', DATA.regional_summary);
    }
  }

  // Model Selector Setup
  function setupModelSelector() {
    const attachBtns = (selector) => {
      const modelBtns = document.querySelectorAll(selector);
      modelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          activePredModel = btn.dataset.predModel;
          // Sync all model button groups
          document.querySelectorAll('[data-pred-model]').forEach(b => {
            b.classList.toggle('active', b.dataset.predModel === activePredModel);
          });
          updateHistoricalAndPredictedChart();
          updateForecastCards();
        });
      });
    };
    attachBtns('#model-selector-toolbar button');
    attachBtns('#model-selector-toolbar-overview button');
  }

  // 9. Update Historical & Predicted Continuous Trajectory Chart
  function updateHistoricalAndPredictedChart() {
    const isNational = activeSubdivision === 'ALL_INDIA';
    let histSeries, forecastObj, lpa;

    if (isNational) {
      histSeries = DATA.national_series.map(d => ({ year: d.year, annual: d.annual }));
      forecastObj = DATA.national_annual_forecast_2016 || {
        predictions: {
          ensemble: 1339.88,
          holt_exponential: 1343.8,
          ridge_lag: 1335.8,
          linear_trend: 1407.9,
          sma_5: 1340.2
        },
        confidence_interval_95: { lower: 1107.7, upper: 1572.1, margin: 232.2 }
      };
      lpa = DATA.metadata.national_lpa;
    } else {
      const d = DATA.subdivision_details[activeSubdivision];
      histSeries = d.timeline.map(t => ({ year: t.year, annual: t.annual }));
      const sf = DATA.subdivision_annual_forecasts_2016?.[activeSubdivision];
      forecastObj = sf || {
        predictions: {
          ensemble: d.lpa,
          holt_exponential: d.lpa,
          ridge_lag: d.lpa,
          linear_trend: d.lpa,
          sma_5: d.lpa
        },
        confidence_interval_95: {
          lower: Math.round(d.lpa * 0.8),
          upper: Math.round(d.lpa * 1.2),
          margin: Math.round(d.lpa * 0.2)
        }
      };
      lpa = d.lpa;
    }

    // Apply scenario adjustment factor
    const factor = window.AppPredictions.getScenarioFactor();
    const adjustedForecastObj = JSON.parse(JSON.stringify(forecastObj));
    Object.keys(adjustedForecastObj.predictions).forEach(k => {
      adjustedForecastObj.predictions[k] = Math.round(adjustedForecastObj.predictions[k] * factor * 10) / 10;
    });
    if (adjustedForecastObj.confidence_interval_95) {
      adjustedForecastObj.confidence_interval_95.lower = Math.round(adjustedForecastObj.confidence_interval_95.lower * factor * 10) / 10;
      adjustedForecastObj.confidence_interval_95.upper = Math.round(adjustedForecastObj.confidence_interval_95.upper * factor * 10) / 10;
    }

    window.AppCharts.renderHistoricalAndPredicted(
      'chart-historical-and-predicted',
      histSeries,
      adjustedForecastObj,
      activePredModel,
      lpa
    );
    if (document.getElementById('chart-historical-and-predicted-overview')) {
      window.AppCharts.renderHistoricalAndPredicted(
        'chart-historical-and-predicted-overview',
        histSeries,
        adjustedForecastObj,
        activePredModel,
        lpa
      );
    }

    // Update Badges
    const predKeyMap = {
      'ensemble': 'ensemble',
      'holt': 'holt_exponential',
      'ridge': 'ridge_lag',
      'linear': 'linear_trend',
      'sma5': 'sma_5'
    };
    const currentPredVal = adjustedForecastObj.predictions[predKeyMap[activePredModel] || 'ensemble'];
    const badgePredVal = document.getElementById('badge-chart-pred-val');
    const badgePredFan = document.getElementById('badge-chart-pred-fan');
    const badgeLatestHist = document.getElementById('badge-latest-hist-val');
    const lastObserved = histSeries[histSeries.length - 1];

    if (badgePredVal) badgePredVal.textContent = `2016 → ${currentPredVal.toLocaleString()} mm`;
    if (badgePredFan) badgePredFan.textContent = `[${adjustedForecastObj.confidence_interval_95.lower.toLocaleString()} mm – ${adjustedForecastObj.confidence_interval_95.upper.toLocaleString()} mm]`;
    if (badgeLatestHist && lastObserved) badgeLatestHist.textContent = `${lastObserved.year}: ${lastObserved.annual.toLocaleString()} mm`;

    // Overview Badges
    const badgeOverLatest = document.getElementById('badge-overview-latest-val');
    const badgeOverPred = document.getElementById('badge-overview-pred-val');
    const badgeOverCI = document.getElementById('badge-overview-ci-val');
    if (badgeOverLatest && lastObserved) badgeOverLatest.textContent = `${lastObserved.year}: ${lastObserved.annual.toLocaleString()} mm`;
    if (badgeOverPred) badgeOverPred.textContent = `2016 → ${currentPredVal.toLocaleString()} mm`;
    if (badgeOverCI) badgeOverCI.textContent = `[${adjustedForecastObj.confidence_interval_95.lower.toLocaleString()} – ${adjustedForecastObj.confidence_interval_95.upper.toLocaleString()} mm]`;
  }

  // 10. Update Forecast Cards & Scenario Simulator
  function updateForecastCards() {
    const isNational = activeSubdivision === 'ALL_INDIA';
    let basePred, lpa;

    const predKeyMap = {
      'ensemble': 'ensemble',
      'holt': 'holt_exponential',
      'ridge': 'ridge_lag',
      'linear': 'linear_trend',
      'sma5': 'sma_5'
    };
    const modelKey = predKeyMap[activePredModel] || 'ensemble';

    if (isNational) {
      const natFc = DATA.national_annual_forecast_2016;
      basePred = natFc?.predictions?.[modelKey] || DATA.predictive_modeling.forecast_2016.ensemble_prediction;
      lpa = DATA.metadata.national_lpa;
    } else {
      const sf = DATA.subdivision_annual_forecasts_2016?.[activeSubdivision];
      basePred = sf?.predictions?.[modelKey] || DATA.subdivision_details[activeSubdivision].lpa;
      lpa = DATA.subdivision_details[activeSubdivision].lpa;
    }

    const calc = window.AppPredictions.calculatePrediction(basePred, lpa);

    // Update Hero Box
    const numEl = document.getElementById('hero-pred-number');
    const rangeEl = document.getElementById('hero-ci-range');
    const depEl = document.getElementById('hero-pred-departure');

    if (numEl) numEl.innerHTML = `${calc.predictedRainfall.toLocaleString()} <span style="font-size:1.5rem; font-weight:600; color:var(--text-secondary);">mm</span>`;
    if (rangeEl) rangeEl.textContent = `[${calc.lowerCI.toLocaleString()} mm – ${calc.upperCI.toLocaleString()} mm]`;
    if (depEl) depEl.innerHTML = `<span class="kpi-badge ${calc.badgeClass}">${calc.departurePct > 0 ? '+' : ''}${calc.departurePct}% (${calc.category})</span>`;

    // Update Top KPI Card
    const kpiForecast = document.getElementById('kpi-val-forecast');
    const kpiBadge = document.getElementById('kpi-badge-forecast-ci');
    if (kpiForecast) kpiForecast.textContent = calc.predictedRainfall.toLocaleString();
    if (kpiBadge) kpiBadge.textContent = `95% CI: [${Math.round(calc.lowerCI)} - ${Math.round(calc.upperCI)}]`;

    // Update Spectrum Gauge
    const gaugePointer = document.getElementById('forecast-gauge-pointer');
    const spectrumStatus = document.getElementById('hero-spectrum-status');
    if (gaugePointer) {
      // Map rainfall to gauge percentage: LPA * 0.7 to LPA * 1.3
      const minScale = lpa * 0.7;
      const maxScale = lpa * 1.3;
      const pct = Math.min(Math.max(((calc.predictedRainfall - minScale) / (maxScale - minScale)) * 100, 2), 98);
      gaugePointer.style.left = `${pct}%`;
      gaugePointer.title = `Forecast: ${calc.predictedRainfall.toLocaleString()} mm (${calc.departurePct > 0 ? '+' : ''}${calc.departurePct}% vs LPA)`;
    }
    if (spectrumStatus) {
      spectrumStatus.textContent = `Forecast: ${calc.category} (${calc.departurePct > 0 ? '+' : ''}${calc.departurePct}% vs LPA)`;
      spectrumStatus.style.color = calc.departurePct < -10 ? 'var(--accent-amber)' : (calc.departurePct > 10 ? 'var(--accent-cyan)' : 'var(--accent-purple)');
    }
  }

  // 10. Update Multi-Year Projections Chart
  function updateMultiYearChart() {
    const factor = window.AppPredictions.getScenarioFactor();
    window.AppCharts.renderMultiYearProjections('chart-multiyear-projections', DATA.predictive_modeling.multi_year_projections, factor);
    if (document.getElementById('chart-multiyear-projections-overview')) {
      window.AppCharts.renderMultiYearProjections('chart-multiyear-projections-overview', DATA.predictive_modeling.multi_year_projections, factor);
    }
  }

  // 11. Update Backtesting Test Chart
  function updateBacktestingChart() {
    window.AppCharts.renderBacktestingChart('chart-backtesting-test', DATA.predictive_modeling.backtesting.test_comparisons);
    if (document.getElementById('chart-ai-model-benchmark-overview')) {
      window.AppCharts.renderModelBenchmark('chart-ai-model-benchmark-overview', DATA.predictive_modeling.backtesting.metrics);
    }
  }

  // 12. Update Side-by-Side Comparison Charts
  function updateComparisonCharts() {
    if (!compareSubdivision) return;
    const name1 = activeSubdivision === 'ALL_INDIA' ? 'All-India' : activeSubdivision;
    const name2 = compareSubdivision;

    const data1 = activeSubdivision === 'ALL_INDIA' ? {
      lpa: DATA.metadata.national_lpa,
      cv: 8.4,
      seasonal_climatology: DATA.national_seasonal_climatology
    } : DATA.subdivision_details[activeSubdivision];

    const data2 = DATA.subdivision_details[compareSubdivision];
    if (!data1 || !data2) return;

    window.AppCharts.renderComparisonRadar('chart-compare-radar', name1, data1, name2, data2);

    const timeline1 = activeSubdivision === 'ALL_INDIA' ? DATA.national_series : data1.timeline;
    const timeline2 = data2.timeline;
    window.AppCharts.renderComparisonAnnual('chart-compare-annual', name1, timeline1, name2, timeline2);

    const labelHeader = document.getElementById('label-comparison-header');
    if (labelHeader) {
      labelHeader.textContent = `Comparing [${name1}] vs [${name2}]`;
    }
  }

  // 13. Granular Table Explorer
  function initGranularTable() {
    const searchInput = document.getElementById('table-search-input');
    const btnPrev = document.getElementById('btn-table-prev');
    const btnNext = document.getElementById('btn-table-next');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        tableCurrentPage = 1;
        filterGranularTable();
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (tableCurrentPage > 1) {
          tableCurrentPage--;
          renderGranularTable();
        }
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const maxPage = Math.ceil(tableFilteredRows.length / tableRowsPerPage);
        if (tableCurrentPage < maxPage) {
          tableCurrentPage++;
          renderGranularTable();
        }
      });
    }
  }

  function filterGranularTable() {
    const query = document.getElementById('table-search-input')?.value.toLowerCase().trim() || '';

    // Flatten all subdivision timeline records
    let rows = [];
    DATA.subdivisions.forEach(subdiv => {
      const d = DATA.subdivision_details[subdiv];
      if (!d) return;

      d.timeline.forEach(t => {
        if (t.year >= activeStartYear && t.year <= activeEndYear) {
          rows.push({
            subdivision: subdiv,
            year: t.year,
            annual: t.annual,
            monsoon: t.monsoon,
            yoy: t.yoy_change,
            departure: t.departure,
            months: d.monthly_climatology
          });
        }
      });
    });

    if (query) {
      rows = rows.filter(r => r.subdivision.toLowerCase().includes(query) || r.year.toString().includes(query));
    }

    tableFilteredRows = rows;
    renderGranularTable();
  }

  function renderGranularTable() {
    const tbody = document.getElementById('tbody-granular-explorer');
    const countLabel = document.getElementById('label-table-count');
    if (!tbody) return;

    tbody.innerHTML = '';
    const total = tableFilteredRows.length;
    const startIdx = (tableCurrentPage - 1) * tableRowsPerPage;
    const endIdx = Math.min(startIdx + tableRowsPerPage, total);

    if (countLabel) {
      countLabel.textContent = total > 0 ? `Showing ${startIdx + 1} to ${endIdx} of ${total} records` : 'No records match search filter';
    }

    const pageRows = tableFilteredRows.slice(startIdx, endIdx);
    pageRows.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${row.subdivision}</strong></td>
        <td><strong>${row.year}</strong></td>
        <td>${row.months.JAN.mean.toFixed(1)}</td>
        <td>${row.months.FEB.mean.toFixed(1)}</td>
        <td>${row.months.MAR.mean.toFixed(1)}</td>
        <td>${row.months.APR.mean.toFixed(1)}</td>
        <td>${row.months.MAY.mean.toFixed(1)}</td>
        <td>${row.months.JUN.mean.toFixed(1)}</td>
        <td>${row.months.JUL.mean.toFixed(1)}</td>
        <td>${row.months.AUG.mean.toFixed(1)}</td>
        <td>${row.months.SEP.mean.toFixed(1)}</td>
        <td>${row.months.OCT.mean.toFixed(1)}</td>
        <td>${row.months.NOV.mean.toFixed(1)}</td>
        <td>${row.months.DEC.mean.toFixed(1)}</td>
        <td style="color:var(--accent-cyan); font-weight:700;">${row.annual.toFixed(1)}</td>
        <td>${row.monsoon.toFixed(1)}</td>
        <td style="color:${row.yoy >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">${row.yoy > 0 ? '+' : ''}${row.yoy.toFixed(1)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // CSV Exporters
  function exportActiveViewCSV() {
    const series = getActiveTimeSeries();
    const subdivName = activeSubdivision;

    let csv = 'Subdivision,Year,Annual_Rainfall_mm,Monsoon_Jun_Sep_mm,YoY_Change_mm,SMA_5yr,SMA_10yr\n';
    series.forEach(d => {
      csv += `"${subdivName}",${d.year},${d.annual},${d.monsoon || ''},${d.yoy_change || 0},${d.sma_5 || ''},${d.sma_10 || ''}\n`;
    });

    downloadCSV(csv, `rainfall_${subdivName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${activeStartYear}_${activeEndYear}.csv`);
  }

  function exportFilteredTableCSV() {
    let csv = 'Subdivision,Year,Annual_mm,Monsoon_mm,YoY_Change_mm\n';
    tableFilteredRows.forEach(r => {
      csv += `"${r.subdivision}",${r.year},${r.annual},${r.monsoon},${r.yoy}\n`;
    });
    downloadCSV(csv, `rainfall_filtered_observations_${activeStartYear}_${activeEndYear}.csv`);
  }

  function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Kickstart on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
