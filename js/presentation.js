/**
 * BHARAT-VARSHA // Internship Presentation Deck Module
 * Fullscreen and Embedded slide deck tailored for academic & internship evaluation presentations
 */

window.AppPresentation = (function () {
  let currentSlide = 0;

  const SLIDES = [
    {
      tag: "Slide 1 of 6 // Executive Summary",
      title: "1. Problem Formulation & Dataset Climatology",
      badge: "Scope & Objectives",
      content: `
        <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; align-items: start;">
          <div>
            <p>
              Precipitation variability is the foundational catalyst of India's agrarian economy, hydroelectric generation, and disaster management. This project conducts a rigorous empirical investigation of <strong>115 consecutive years (1901–2015)</strong> of IMD meteorological data across all <strong>36 subdivisions</strong>.
            </p>
            <ul class="slide-bullets">
              <li><strong>Temporal Breadth:</strong> 115 years covering colonial era, mid-century industrialization, and modern anthropocene.</li>
              <li><strong>Spatial Resolution:</strong> 36 distinct meteorological subdivisions encompassing 4 major climatic zones (North-West, Central, South Peninsula, East/North-East).</li>
              <li><strong>Data Completeness:</strong> 4,116 monthly observations with over 99.4% initial reporting integrity and rigorous imputation.</li>
              <li><strong>Core Mission:</strong> Analyze spatial-temporal trends, identify vulnerability extremes, and architect a robust machine learning prediction engine for the upcoming annual cycle.</li>
            </ul>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:1.25rem;">
            <h4 style="color:var(--accent-cyan); font-size:0.95rem; margin-bottom:0.75rem;">Key Climatological Benchmarks</h4>
            <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.85rem;">
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.3rem;">
                <span style="color:var(--text-secondary);">National LPA:</span>
                <strong style="color:#fff;">1,417.3 mm / yr</strong>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.3rem;">
                <span style="color:var(--text-secondary);">Monsoon LPA (Jun-Sep):</span>
                <strong style="color:var(--accent-cyan);">1,065.3 mm (75.2%)</strong>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.3rem;">
                <span style="color:var(--text-secondary);">Wettest Year on Record:</span>
                <strong style="color:var(--accent-emerald);">1961 (1,717.1 mm)</strong>
              </div>
              <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.3rem;">
                <span style="color:var(--text-secondary);">Driest Year on Record:</span>
                <strong style="color:var(--accent-rose);">1972 (1,146.5 mm)</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--text-secondary);">National Volatility (CV):</span>
                <strong style="color:var(--accent-amber);">8.4% (Stable Composite)</strong>
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      tag: "Slide 2 of 6 // Long-Term Climatology",
      title: "2. Historical Annual Rainfall Dynamics (1901–2015)",
      badge: "Decadal Trends & YoY",
      content: `
        <div>
          <p>
            An analysis of 115 years reveals distinct <strong>multi-decadal climate epochs</strong> rather than a uniform monotonic trajectory:
          </p>
          <ul class="slide-bullets">
            <li><strong>Colonial Dry Epoch (1901–1920):</strong> Marked by severe drought episodes, particularly the catastrophic 1905 (-16.3%) and 1918 (-15.1%) droughts coinciding with the global influenza epidemic.</li>
            <li><strong>The Mid-Century Wet Epoch (1940–1961):</strong> A sustained surplus phase with minimal major droughts, culminating in India's highest rainfall year on record: <strong>1961 (1,717.1 mm, +21.2% above LPA)</strong>.</li>
            <li><strong>Increased Volatility & Drought Clustering (1965–2015):</strong> Frequency of severe deficits accelerated with landmark droughts in 1965 (-16.4%), 1972 (-18.8%), 1987 (-14.3%), 2002 (-17.2%), 2009 (-15.6%), and back-to-back deficits in 2014–2015.</li>
            <li><strong>Secular Trendline:</strong> The 115-year linear regression slope displays a slight negative trajectory of <strong>-0.82 mm per decade</strong>, indicating subtle aridification accompanied by intensified localized storm bursts.</li>
          </ul>
        </div>
      `
    },
    {
      tag: "Slide 3 of 6 // Spatial Disparities",
      title: "3. Geographic Disparities & Regional Extremes",
      badge: "36 Meteorological Subdivisions",
      content: `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div style="background:rgba(6, 182, 212, 0.08); border:1px solid rgba(6, 182, 212, 0.25); border-radius:12px; padding:1.25rem;">
            <h4 style="color:var(--accent-cyan); font-size:1.1rem; margin-bottom:0.5rem;">The Pluvial Belt (Wettest Zones)</h4>
            <p style="font-size:0.875rem; margin-bottom:0.75rem;">
              Driven by intense orographic lifting against the Western Ghats and Himalayan foothills:
            </p>
            <ol style="padding-left:1.25rem; font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
              <li><strong>Arunachal Pradesh:</strong> 3,418.9 mm / yr</li>
              <li><strong>Coastal Karnataka:</strong> 3,408.4 mm / yr</li>
              <li><strong>Konkan & Goa:</strong> 2,977.7 mm / yr</li>
              <li><strong>Andaman & Nicobar:</strong> 2,927.4 mm / yr</li>
              <li><strong>Kerala:</strong> 2,925.5 mm / yr</li>
            </ol>
          </div>

          <div style="background:rgba(245, 158, 11, 0.08); border:1px solid rgba(245, 158, 11, 0.25); border-radius:12px; padding:1.25rem;">
            <h4 style="color:var(--accent-amber); font-size:1.1rem; margin-bottom:0.5rem;">The Arid Rain-Shadow (Driest Zones)</h4>
            <p style="font-size:0.875rem; margin-bottom:0.75rem;">
              Located in the Thar Desert and rain-shadow leeward zones:
            </p>
            <ol style="padding-left:1.25rem; font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
              <li><strong>West Rajasthan:</strong> 292.7 mm / yr</li>
              <li><strong>Saurashtra & Kutch:</strong> 495.2 mm / yr</li>
              <li><strong>Haryana Delhi Chandigarh:</strong> 530.5 mm / yr</li>
              <li><strong>Punjab:</strong> 593.5 mm / yr</li>
              <li><strong>East Rajasthan:</strong> 655.2 mm / yr</li>
            </ol>
          </div>
        </div>
        <p style="margin-top:1rem; font-size:0.9rem; color:var(--accent-purple); font-weight:600;">
          ⚡ The Disparity Factor: Arunachal Pradesh receives <strong>11.7 times</strong> more annual precipitation than West Rajasthan. Furthermore, West Rajasthan exhibits a Coefficient of Variation (CV) of <strong>42.8%</strong>, vs just 14.2% for Assam, demonstrating that drier regions face dramatically higher climate uncertainty.
        </p>
      `
    },
    {
      tag: "Slide 4 of 6 // Monsoon Vulnerability",
      title: "4. The Monsoon Lifeline & Historical Drought Epochs",
      badge: "SW Monsoon (Jun-Sep)",
      content: `
        <div>
          <p>
            The Southwest Monsoon (June–September) constitutes <strong>75.2%</strong> of India's annual water endowment. Climatological analysis reveals:
          </p>
          <ul class="slide-bullets">
            <li><strong>Intra-Monsoon Concentration:</strong> Precipitation surges exponentially in June (165 mm, onset), peaks concurrently in July (290 mm) and August (264 mm), before tapering off during September (175 mm, withdrawal).</li>
            <li><strong>Drought Severity Thresholds:</strong> Deficits exceeding 10% trigger severe agricultural stress. Notable national droughts:
              <br>• <strong>1965 Drought (-16.4%):</strong> Sparked chronic food shortages and catalyzed the Green Revolution.
              <br>• <strong>1972 Drought (-18.8%):</strong> Driest year in modern Indian history, devastating Maharashtra and Central India.
              <br>• <strong>2002 Drought (-17.2%):</strong> Worst July on record (-49%), reducing agricultural GDP by 3.1%.
              <br>• <strong>2009 Drought (-15.6%):</strong> Driven by a severe canonical El Niño event.
            </li>
            <li><strong>Consecutive Deficit Stress (2014–2015):</strong> 2014 (-12.8%) followed immediately by 2015 (-14.0%) represents a rare double-dip deficit, demonstrating amplified vulnerability at the terminus of our historical dataset.</li>
          </ul>
        </div>
      `
    },
    {
      tag: "Slide 5 of 6 // Predictive Analytics",
      title: "5. Machine Learning Annual Rainfall Modeling & 2016 Forecast",
      badge: "Scikit-Learn Modeling & Validation",
      content: `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start;">
          <div>
            <p>
              To forecast the annual precipitation for the year following the latest available year (<strong>Year 2016</strong>), we engineered and evaluated multiple models on the historical annual rainfall series (1901–2015):
            </p>
            <ul class="slide-bullets" style="font-size:0.875rem;">
              <li><strong>Historical Annual Data:</strong> 115 observed years (1901–2015) of annual precipitation. Out-of-sample test split: 2006–2015 (10 holdout years).</li>
              <li><strong>Blended Ensemble Forecaster:</strong> Synthesis of 35% Holt's Linear Trend + 35% Autoregressive Ridge Lag-3 + 30% 5-Yr Rolling Momentum, achieving <strong>RMSE of 114.7 mm</strong> and <strong>MAPE of 7.60%</strong>.</li>
              <li><strong>Upcoming Year (2016) Official Prediction:</strong> <strong>1,339.9 mm</strong> (95% CI: [1,107.7 mm – 1,572.1 mm]), projecting a transition out of the severe 2014-2015 consecutive deficit into near-normal climatology (-5.5% vs LPA).</li>
            </ul>
          </div>
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:1.25rem;">
            <h4 style="color:var(--accent-purple); font-size:0.95rem; margin-bottom:0.75rem;">Model Benchmarks (Test Set: 2006–2015)</h4>
            <table style="width:100%; font-size:0.8rem; border-collapse:collapse; text-align:left;">
              <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:var(--text-secondary);">
                <th style="padding:4px 0;">Model Architecture</th><th>RMSE</th><th>MAE</th><th>MAPE</th>
              </tr>
              <tr style="color:var(--accent-emerald); font-weight:700; border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:6px 0;">Blended Ensemble</td><td>114.7 mm</td><td>101.3 mm</td><td>7.60%</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:6px 0;">Autoregressive Ridge</td><td>112.0 mm</td><td>96.7 mm</td><td>7.35%</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:6px 0;">Holt's Linear Smoothing</td><td>116.0 mm</td><td>102.0 mm</td><td>7.57%</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                <td style="padding:6px 0;">Linear Trend (OLS)</td><td>116.9 mm</td><td>95.8 mm</td><td>7.38%</td>
              </tr>
              <tr>
                <td style="padding:6px 0;">5-Yr Rolling SMA</td><td>121.8 mm</td><td>106.0 mm</td><td>7.91%</td>
              </tr>
            </table>
          </div>
        </div>
      `
    },
    {
      tag: "Slide 6 of 6 // Conclusion & Policy",
      title: "6. Internship Key Findings & Strategic Recommendations",
      badge: "Actionable Insights",
      content: `
        <div>
          <p>
            Based on 115 years of empirical evidence and machine learning simulations, four strategic imperatives emerge for Indian water security and climate policy:
          </p>
          <ul class="slide-bullets">
            <li><strong>1. Inter-Basin Water Grid & Smart Storage:</strong> The 11.7x disparity between the Western Ghats/Northeast and the Thar desert underscores the absolute necessity of dynamic inter-basin river linkages and localized check-dam networks.</li>
            <li><strong>2. Decoupling Agrarian Reliance on Southwest Monsoon:</strong> With 75.2% of precipitation concentrated in 120 days, high-volatility zones (West Rajasthan, Saurashtra, Punjab) require targeted incentives for micro-irrigation and drought-resilient millets.</li>
            <li><strong>3. Consecutive Drought Preparedness Protocol:</strong> As evidenced by the 2014–2015 back-to-back deficit, emergency reservoir buffering policies must account for multi-year deficit probabilities rather than single-year anomalies.</li>
            <li><strong>4. Operationalizing AI Climate Forecasting:</strong> Integrating multi-model ensembles with real-time ENSO and Indian Ocean Dipole teleconnection tracking provides vital 6-month advance lead time for agricultural sowing planning.</li>
          </ul>
        </div>
      `
    }
  ];

  function renderSlide(slideIdx) {
    currentSlide = Math.max(0, Math.min(slideIdx, SLIDES.length - 1));
    const slide = SLIDES[currentSlide];

    // Update Embedded Slide
    const embedTag = document.getElementById('embed-slide-tag');
    const embedTitle = document.getElementById('embed-slide-title');
    const embedBody = document.getElementById('embed-slide-body');
    const embedNum = document.getElementById('embed-slide-num');

    if (embedTag) embedTag.textContent = slide.tag;
    if (embedTitle) embedTitle.textContent = slide.title;
    if (embedBody) embedBody.innerHTML = slide.content;
    if (embedNum) embedNum.textContent = `${currentSlide + 1} / ${SLIDES.length}`;

    // Update Modal Slide
    const modalTag = document.getElementById('modal-slide-tag');
    const modalTitle = document.getElementById('modal-slide-title');
    const modalBody = document.getElementById('modal-slide-body');
    const modalNum = document.getElementById('modal-slide-num');

    if (modalTag) modalTag.textContent = slide.tag;
    if (modalTitle) modalTitle.textContent = slide.title;
    if (modalBody) modalBody.innerHTML = slide.content;
    if (modalNum) modalNum.textContent = `${currentSlide + 1} / ${SLIDES.length}`;

    updateIndicators();
  }

  function updateIndicators() {
    ['embed-slide-indicators', 'modal-slide-indicators'].forEach(containerId => {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';
      SLIDES.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `dot-indicator ${idx === currentSlide ? 'active' : ''}`;
        dot.setAttribute('title', `Go to slide ${idx + 1}`);
        dot.addEventListener('click', () => renderSlide(idx));
        container.appendChild(dot);
      });
    });
  }

  function nextSlide() {
    if (currentSlide < SLIDES.length - 1) {
      renderSlide(currentSlide + 1);
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      renderSlide(currentSlide - 1);
    }
  }

  function openModal() {
    const modal = document.getElementById('modal-presentation');
    if (modal) {
      modal.classList.add('active');
      renderSlide(currentSlide);
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    const modal = document.getElementById('modal-presentation');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function initPresentation() {
    // Embedded controls
    document.getElementById('btn-embed-slide-prev')?.addEventListener('click', prevSlide);
    document.getElementById('btn-embed-slide-next')?.addEventListener('click', nextSlide);
    document.getElementById('btn-launch-fullscreen-deck')?.addEventListener('click', openModal);

    // Modal controls
    document.getElementById('btn-open-presentation')?.addEventListener('click', openModal);
    document.getElementById('btn-close-presentation-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-modal-prev')?.addEventListener('click', prevSlide);
    document.getElementById('btn-modal-next')?.addEventListener('click', nextSlide);

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('modal-presentation');
      const isModalActive = modal && modal.classList.contains('active');

      if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape' && isModalActive) {
        closeModal();
      }
    });

    renderSlide(0);
  }

  return {
    initPresentation,
    renderSlide,
    nextSlide,
    prevSlide,
    openModal,
    closeModal
  };
})();
