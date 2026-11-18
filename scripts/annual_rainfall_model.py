"""
BHARAT-VARSHA // Machine Learning Annual Rainfall Prediction Engine
Trained on Historical ANNUAL Rainfall Data (1901–2015) using Scikit-Learn, Pandas & NumPy
Predicts Annual Rainfall for the Year Following the Latest Available Year: 2016
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

CSV_PATH = r"c:\Rainfall-Prediction-Dashboard\rainfall in india 1901-2015.csv"
if not os.path.exists(CSV_PATH):
    CSV_PATH = r"c:\Rainfall-Prediction-Dashboard\projects\india_rainfall_prediction\sources\rainfall in india 1901-2015.csv"

def holt_linear_forecast(series, alpha=0.25, beta=0.08, steps=1):
    """Holt's Linear Exponential Smoothing forecasting."""
    n = len(series)
    if n < 2:
        return [series[-1]] * steps if n else [0] * steps
    
    level = series[0]
    trend = series[1] - series[0]
    for i in range(1, n):
        val = series[i]
        last_level = level
        level = alpha * val + (1 - alpha) * (last_level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend
        
    forecasts = [level + (h * trend) for h in range(1, steps + 1)]
    return forecasts

def create_lag_features(df_series, max_lags=3):
    """Engineer autoregressive lag features from annual rainfall series."""
    df = pd.DataFrame({'year': df_series['year'].values, 'annual': df_series['annual'].values})
    for lag in range(1, max_lags + 1):
        df[f'lag_{lag}'] = df['annual'].shift(lag)
    df['rolling_3'] = df['annual'].shift(1).rolling(3).mean()
    df['rolling_5'] = df['annual'].shift(1).rolling(5).mean()
    df['year_idx'] = df['year'] - df['year'].min()
    return df.dropna().reset_index(drop=True)

def train_and_evaluate_models(annual_df):
    """
    Train models on 1901-2005 (105 years) and evaluate on 2006-2015 (10 test years).
    """
    train_mask = annual_df['year'] <= 2005
    test_mask = annual_df['year'] >= 2006
    
    y_train = annual_df.loc[train_mask, 'annual'].values
    y_test = annual_df.loc[test_mask, 'annual'].values
    years_train = annual_df.loc[train_mask, 'year'].values
    years_test = annual_df.loc[test_mask, 'year'].values
    
    # 1. Linear Regression (OLS Trend Model)
    lr_model = LinearRegression()
    lr_model.fit(years_train.reshape(-1, 1), y_train)
    pred_lr_test = lr_model.predict(years_test.reshape(-1, 1))
    
    # 2. 5-Year Rolling Moving Average
    pred_sma5_test = []
    for yr in years_test:
        sub = annual_df[(annual_df['year'] >= yr - 5) & (annual_df['year'] < yr)]['annual']
        pred_sma5_test.append(sub.mean())
    pred_sma5_test = np.array(pred_sma5_test)
    
    # 3. Holt's Linear Exponential Smoothing
    pred_holt_test = []
    for yr in years_test:
        hist = annual_df[annual_df['year'] < yr]['annual'].values
        h_pred = holt_linear_forecast(hist, alpha=0.25, beta=0.08, steps=1)[0]
        pred_holt_test.append(h_pred)
    pred_holt_test = np.array(pred_holt_test)
    
    # 4. Autoregressive Ridge Regression with Lag Features
    lag_df = create_lag_features(annual_df, max_lags=3)
    lag_train = lag_df[lag_df['year'] <= 2005]
    lag_test = lag_df[lag_df['year'] >= 2006]
    
    feature_cols = ['lag_1', 'lag_2', 'lag_3', 'rolling_3', 'rolling_5', 'year_idx']
    ridge_model = Ridge(alpha=10.0)
    ridge_model.fit(lag_train[feature_cols], lag_train['annual'])
    pred_ridge_test = ridge_model.predict(lag_test[feature_cols])
    
    # 5. Ensemble Forecaster (Weighted Blend)
    pred_ensemble_test = (0.35 * pred_holt_test + 0.35 * pred_ridge_test + 0.30 * pred_sma5_test)
    
    def calc_metrics(actual, pred):
        rmse = float(np.sqrt(mean_squared_error(actual, pred)))
        mae = float(mean_absolute_error(actual, pred))
        mape = float(np.mean(np.abs((actual - pred) / actual)) * 100)
        r2 = float(r2_score(actual, pred))
        return {
            'rmse': round(rmse, 2),
            'mae': round(mae, 2),
            'mape': round(mape, 2),
            'r2': round(r2, 3)
        }
        
    metrics = {
        'Ensemble Forecaster (Recommended)': calc_metrics(y_test, pred_ensemble_test),
        'Holt Linear Exponential Smoothing': calc_metrics(y_test, pred_holt_test),
        'Autoregressive Ridge Model': calc_metrics(y_test, pred_ridge_test),
        'Linear Trend (OLS)': calc_metrics(y_test, pred_lr_test),
        '5-Year Rolling Moving Average': calc_metrics(y_test, pred_sma5_test)
    }
    
    backtest_comparison = []
    for i in range(len(years_test)):
        backtest_comparison.append({
            'year': int(years_test[i]),
            'actual': round(float(y_test[i]), 2),
            'ensemble': round(float(pred_ensemble_test[i]), 2),
            'holt': round(float(pred_holt_test[i]), 2),
            'ridge_lag': round(float(pred_ridge_test[i]), 2),
            'linear_trend': round(float(pred_lr_test[i]), 2),
            'sma_5': round(float(pred_sma5_test[i]), 2)
        })
        
    return metrics, backtest_comparison

def forecast_year_2016(annual_df):
    """
    Train models on the complete 115-year dataset (1901-2015)
    and predict annual rainfall for 2016 (year following the latest available year).
    """
    years_all = annual_df['year'].values
    y_all = annual_df['annual'].values
    lpa = float(np.mean(y_all))
    
    # Model 1: Full Linear Regression
    lr = LinearRegression()
    lr.fit(years_all.reshape(-1, 1), y_all)
    pred_2016_lr = float(lr.predict([[2016]])[0])
    
    # Model 2: Full Holt's Exponential Smoothing
    pred_2016_holt = float(holt_linear_forecast(y_all, alpha=0.25, beta=0.08, steps=1)[0])
    
    # Model 3: 5-Year SMA
    pred_2016_sma5 = float(np.mean(y_all[-5:]))
    
    # Model 4: Full Autoregressive Ridge
    lag_df = create_lag_features(annual_df, max_lags=3)
    feature_cols = ['lag_1', 'lag_2', 'lag_3', 'rolling_3', 'rolling_5', 'year_idx']
    ridge = Ridge(alpha=10.0)
    ridge.fit(lag_df[feature_cols], lag_df['annual'])
    
    # Feature row for 2016:
    x_2016 = pd.DataFrame([{
        'lag_1': y_all[-1],
        'lag_2': y_all[-2],
        'lag_3': y_all[-3],
        'rolling_3': np.mean(y_all[-3:]),
        'rolling_5': np.mean(y_all[-5:]),
        'year_idx': 2016 - years_all.min()
    }])
    pred_2016_ridge = float(ridge.predict(x_2016[feature_cols])[0])
    
    # Ensemble Forecast
    pred_2016_ensemble = 0.35 * pred_2016_holt + 0.35 * pred_2016_ridge + 0.30 * pred_2016_sma5
    
    # Residual standard error and 95% Confidence Interval
    residuals = y_all - lr.predict(years_all.reshape(-1, 1))
    se = float(np.std(residuals, ddof=2))
    ci_margin = float(1.96 * se)
    ci_lower = max(0.0, pred_2016_ensemble - ci_margin)
    ci_upper = pred_2016_ensemble + ci_margin
    
    departure_from_lpa = ((pred_2016_ensemble - lpa) / lpa) * 100
    
    # IMD Category
    if departure_from_lpa >= 10.0:
        cat = 'Above Normal / Surplus'
    elif departure_from_lpa <= -10.0 and departure_from_lpa > -20.0:
        cat = 'Deficient (Moderate Deficit)'
    elif departure_from_lpa <= -20.0:
        cat = 'Scanty (Severe Deficit)'
    else:
        cat = 'Near Normal (Within ±10%)'
        
    # Multi-Year Projections (2016 to 2025)
    projections = []
    for step, yr in enumerate(range(2016, 2026), 1):
        lr_v = float(lr.predict([[yr]])[0])
        # Transition weight to long-term trend
        w = min(1.0, (yr - 2015) * 0.12)
        ens_v = (1 - w) * pred_2016_ensemble + w * lr_v
        # Expanding uncertainty
        exp_margin = ci_margin * np.sqrt(1 + (step * 0.08))
        projections.append({
            'year': yr,
            'forecast': round(ens_v, 2),
            'linear_trend': round(lr_v, 2),
            'lower_ci': round(max(0.0, ens_v - exp_margin), 2),
            'upper_ci': round(ens_v + exp_margin, 2)
        })
        
    return {
        'target_year': 2016,
        'latest_historical_year': 2015,
        'lpa': round(lpa, 2),
        'predictions': {
            'ensemble': round(pred_2016_ensemble, 2),
            'holt_exponential': round(pred_2016_holt, 2),
            'ridge_lag': round(pred_2016_ridge, 2),
            'linear_trend': round(pred_2016_lr, 2),
            'sma_5': round(pred_2016_sma5, 2)
        },
        'confidence_interval_95': {
            'lower': round(ci_lower, 2),
            'upper': round(ci_upper, 2),
            'margin': round(ci_margin, 2)
        },
        'departure_from_lpa_pct': round(departure_from_lpa, 2),
        'imd_category': cat,
        'multi_year_projections': projections
    }

def main():
    print("Reading dataset from:", CSV_PATH)
    raw_df = pd.read_csv(CSV_PATH)
    
    # Clean column names
    raw_df.columns = [c.strip() for c in raw_df.columns]
    raw_df['SUBDIVISION'] = raw_df['SUBDIVISION'].str.strip()
    raw_df['YEAR'] = raw_df['YEAR'].astype(int)
    
    # Months list
    months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    
    # Impute missing monthly values by subdivision mean
    for m in months:
        raw_df[m] = raw_df.groupby('SUBDIVISION')[m].transform(lambda x: x.fillna(x.mean()))
        
    # Recompute ANNUAL rainfall (sum of 12 months)
    raw_df['ANNUAL'] = raw_df[months].sum(axis=1)
    
    # Compute All-India National Composite Annual Rainfall (1901-2015)
    national_annual = raw_df.groupby('YEAR')['ANNUAL'].mean().reset_index()
    national_annual.rename(columns={'ANNUAL': 'annual', 'YEAR': 'year'}, inplace=True)
    national_annual = national_annual.sort_values('year').reset_index(drop=True)
    
    print(f"Loaded {len(national_annual)} years of National Annual Rainfall (1901 to 2015).")
    
    # Train & Evaluate National Models
    print("\n--- Evaluating Models on Test Period (2006-2015) ---")
    metrics, backtest_comparison = train_and_evaluate_models(national_annual)
    for model_name, m_scores in metrics.items():
        print(f"  {model_name}: RMSE={m_scores['rmse']} mm, MAE={m_scores['mae']} mm, MAPE={m_scores['mape']}%, R2={m_scores['r2']}")
        
    # Forecast 2016 for National
    nat_forecast = forecast_year_2016(national_annual)
    print(f"\n--- National 2016 Forecast ---")
    print(f"  Ensemble Forecast for 2016: {nat_forecast['predictions']['ensemble']} mm")
    print(f"  95% Confidence Interval: [{nat_forecast['confidence_interval_95']['lower']} mm, {nat_forecast['confidence_interval_95']['upper']} mm]")
    print(f"  Departure from LPA ({nat_forecast['lpa']} mm): {nat_forecast['departure_from_lpa_pct']}% ({nat_forecast['imd_category']})")
    
    # Now compute 2016 forecasts for ALL 36 Subdivisions
    subdiv_forecasts = {}
    subdiv_names = sorted(raw_df['SUBDIVISION'].unique())
    print(f"\nComputing forecasts for all {len(subdiv_names)} subdivisions...")
    
    for s_name in subdiv_names:
        s_df = raw_df[raw_df['SUBDIVISION'] == s_name][['YEAR', 'ANNUAL']].rename(columns={'YEAR': 'year', 'ANNUAL': 'annual'})
        s_df = s_df.sort_values('year').reset_index(drop=True)
        s_fc = forecast_year_2016(s_df)
        subdiv_forecasts[s_name] = s_fc
        
    # Export dedicated prediction documentation & data payload
    output_payload = {
        'documentation': {
            'objective': 'Predict annual rainfall for the year 2016 (following the latest available year 2015) using historical annual rainfall data (1901-2015).',
            'historical_data_used': {
                'source': 'India Meteorological Department (IMD) Climatological Records',
                'granularity': 'Annual Precipitation (ANNUAL column) across 115 consecutive years (1901–2015)',
                'observations_count': len(raw_df),
                'subdivisions_count': len(subdiv_names),
                'latest_historical_year': 2015,
                'forecast_target_year': 2016
            },
            'methodologies_used': [
                {
                    'model_name': 'Ordinary Least Squares (OLS) Linear Trend',
                    'formula': 'y_hat = beta_0 + beta_1 * Year',
                    'description': 'Captures secular century-long trend slope and long-term climate trajectory.'
                },
                {
                    'model_name': 'Autoregressive Ridge Regression with Lag Features',
                    'formula': 'y_hat_t = w_0 + w_1*y_{t-1} + w_2*y_{t-2} + w_3*y_{t-3} + w_4*SMA_3 + w_5*SMA_5',
                    'description': 'Models short-memory autoregressive cycles and multi-year inter-annual momentum.'
                },
                {
                    'model_name': "Holt's Linear Exponential Smoothing",
                    'formula': 'Level: L_t = alpha*y_t + (1-alpha)*(L_{t-1} + b_{t-1}); Trend: b_t = beta*(L_t - L_{t-1}) + (1-beta)*b_{t-1}',
                    'description': 'Adapts dynamically to recent rainfall velocity without assuming rigid linearity.'
                },
                {
                    'model_name': '5-Year Rolling Moving Average (SMA)',
                    'formula': 'y_hat_t = (1/5) * sum_{i=1}^5 y_{t-i}',
                    'description': 'Non-parametric moving baseline filtering high-frequency noise.'
                },
                {
                    'model_name': 'Blended Ensemble Forecaster (Selected)',
                    'formula': '0.35 * Holt + 0.35 * Ridge_Lag + 0.30 * SMA_5',
                    'description': 'Optimal bias-variance trade-off balancing trend, autoregression, and recent momentum.'
                }
            ],
            'validation_protocol': {
                'train_period': '1901–2005 (105 years)',
                'test_period': '2006–2015 (10 out-of-sample test years)',
                'metrics': metrics
            }
        },
        'national': {
            'historical_series': national_annual.to_dict(orient='records'),
            'backtest_comparison': backtest_comparison,
            'forecast_2016': nat_forecast
        },
        'subdivisions': subdiv_forecasts
    }
    
    out_path = r"c:\Rainfall-Prediction-Dashboard\data\annual_prediction_results.json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output_payload, f, indent=2)
    print(f"\nSaved prediction results to: {out_path}")

if __name__ == '__main__':
    main()
