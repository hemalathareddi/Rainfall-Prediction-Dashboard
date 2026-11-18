/**
 * BHARAT-VARSHA // Machine Learning Forecasting & Climate Scenario Simulator
 */

window.AppPredictions = (function () {
  let activeENSO = 0.00; // neutral
  let activeIOD = 0.00;  // neutral

  function initScenarios(onRecalculate) {
    // ENSO buttons
    const ensoBtns = document.querySelectorAll('#scenario-enso-group button');
    ensoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        ensoBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeENSO = parseFloat(btn.dataset.val);
        if (typeof onRecalculate === 'function') onRecalculate();
      });
    });

    // IOD buttons
    const iodBtns = document.querySelectorAll('#scenario-iod-group button');
    iodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        iodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeIOD = parseFloat(btn.dataset.val);
        if (typeof onRecalculate === 'function') onRecalculate();
      });
    });

    // Reset / Recalibrate button
    const recalibrateBtn = document.getElementById('btn-recalibrate-model');
    if (recalibrateBtn) {
      recalibrateBtn.addEventListener('click', () => {
        // Toggle to a slight La Niña simulation as a quick demo
        const nextEnso = activeENSO === 0.05 ? 0.00 : 0.05;
        ensoBtns.forEach(b => {
          if (parseFloat(b.dataset.val) === nextEnso) b.classList.add('active');
          else b.classList.remove('active');
        });
        activeENSO = nextEnso;
        if (typeof onRecalculate === 'function') onRecalculate();
      });
    }
  }

  function getScenarioFactor() {
    // Total climate driver factor = 1 + ENSO effect + IOD effect
    return 1.0 + activeENSO + activeIOD;
  }

  function calculatePrediction(baseForecast, lpa) {
    const factor = getScenarioFactor();
    const adjusted = Math.round(baseForecast * factor * 10) / 10;
    const departure = Math.round(((adjusted - lpa) / lpa) * 1000) / 10;
    
    // Standard error approx
    const margin = Math.round(adjusted * 0.165 * 10) / 10;
    const lowerCI = Math.max(0, Math.round((adjusted - margin) * 10) / 10);
    const upperCI = Math.round((adjusted + margin) * 10) / 10;

    let category = 'Near Normal (Within ±10%)';
    let badgeClass = 'badge-normal';
    if (departure >= 10.0) {
      category = 'Above Normal / Surplus (+10%+)';
      badgeClass = 'badge-excess';
    } else if (departure <= -10.0 && departure > -20.0) {
      category = 'Deficient / Drought Risk (-10% to -20%)';
      badgeClass = 'badge-deficient';
    } else if (departure <= -20.0) {
      category = 'Severe Drought Warning (<-20%)';
      badgeClass = 'badge-scanty';
    }

    return {
      predictedRainfall: adjusted,
      departurePct: departure,
      lowerCI,
      upperCI,
      margin,
      category,
      badgeClass,
      scenarioFactor: factor
    };
  }

  return {
    initScenarios,
    getScenarioFactor,
    calculatePrediction
  };
})();
