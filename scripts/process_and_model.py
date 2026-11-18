import csv
import json
import math
import os

# Subdivisions mapping to geographical zones
REGIONS = {
    'NORTH_WEST': [
        'HARYANA DELHI & CHANDIGARH',
        'PUNJAB',
        'HIMACHAL PRADESH',
        'JAMMU & KASHMIR',
        'UTTARAKHAND',
        'WEST UTTAR PRADESH',
        'EAST RAJASTHAN',
        'WEST RAJASTHAN'
    ],
    'CENTRAL': [
        'EAST UTTAR PRADESH',
        'WEST MADHYA PRADESH',
        'EAST MADHYA PRADESH',
        'GUJARAT REGION',
        'SAURASHTRA & KUTCH',
        'KONKAN & GOA',
        'MADHYA MAHARASHTRA',
        'MATATHWADA',
        'VIDARBHA',
        'CHHATTISGARH'
    ],
    'SOUTH_PENINSULA': [
        'COASTAL ANDHRA PRADESH',
        'TELANGANA',
        'RAYALSEEMA',
        'TAMIL NADU',
        'COASTAL KARNATAKA',
        'NORTH INTERIOR KARNATAKA',
        'SOUTH INTERIOR KARNATAKA',
        'KERALA',
        'LAKSHADWEEP',
        'ANDAMAN & NICOBAR ISLANDS'
    ],
    'EAST_NORTH_EAST': [
        'ARUNACHAL PRADESH',
        'ASSAM & MEGHALAYA',
        'NAGA MANI MIZO TRIPURA',
        'SUB HIMALAYAN WEST BENGAL & SIKKIM',
        'GANGETIC WEST BENGAL',
        'ORISSA',
        'JHARKHAND',
        'BIHAR'
    ]
}

MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
SEASONS = ['Jan-Feb', 'Mar-May', 'Jun-Sep', 'Oct-Dec']
SEASON_LABELS = {
    'Jan-Feb': 'Winter (Jan-Feb)',
    'Mar-May': 'Pre-Monsoon / Summer (Mar-May)',
    'Jun-Sep': 'Monsoon (Jun-Sep)',
    'Oct-Dec': 'Post-Monsoon (Oct-Dec)'
}

def parse_float(val):
    if val is None:
        return None
    val = str(val).strip()
    if val in ('', 'NA', 'NaN', 'null'):
        return None
    try:
        return float(val)
    except ValueError:
        return None

def linear_regression(x, y):
    n = len(x)
    if n < 2:
        return 0, 0, 0, 0
    mean_x = sum(x) / n
    mean_y = sum(y) / n
    num = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
    den = sum((x[i] - mean_x) ** 2 for i in range(n))
    slope = num / den if den != 0 else 0
    intercept = mean_y - slope * mean_x
    
    # R2
    y_pred = [intercept + slope * x[i] for i in range(n)]
    ss_tot = sum((y[i] - mean_y) ** 2 for i in range(n))
    ss_res = sum((y[i] - y_pred[i]) ** 2 for i in range(n))
    r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
    
    # Residual std error
    se = math.sqrt(ss_res / (n - 2)) if n > 2 else 0
    return slope, intercept, r2, se

def holt_linear(series, alpha=0.3, beta=0.1):
    n = len(series)
    if n < 2:
        return series[-1] if n else 0
    level = series[0]
    trend = series[1] - series[0]
    for i in range(1, n):
        val = series[i]
        last_level = level
        level = alpha * val + (1 - alpha) * (last_level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend
    return level + trend

def run_analytics():
    csv_path = r"c:\Rainfall-Prediction-Dashboard\rainfall in india 1901-2015.csv"
    if not os.path.exists(csv_path):
        csv_path = r"c:\Rainfall-Prediction-Dashboard\projects\india_rainfall_prediction\sources\rainfall in india 1901-2015.csv"
        
    raw_data = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_data.append(row)
            
    # Group by subdivision to calculate monthly means for clean imputation
    subdiv_rows = {}
    for r in raw_data:
        s = r['SUBDIVISION'].strip()
        subdiv_rows.setdefault(s, []).append(r)
        
    subdiv_monthly_means = {}
    for s, rows in subdiv_rows.items():
        subdiv_monthly_means[s] = {}
        for m in MONTHS:
            vals = [parse_float(r[m]) for r in rows if parse_float(r[m]) is not None]
            subdiv_monthly_means[s][m] = sum(vals) / len(vals) if vals else 0.0
            
    # Clean records
    clean_records = []
    for r in raw_data:
        s = r['SUBDIVISION'].strip()
        y = int(r['YEAR'].strip())
        
        m_vals = {}
        for m in MONTHS:
            v = parse_float(r[m])
            if v is None:
                v = subdiv_monthly_means[s][m]
            m_vals[m] = round(v, 2)
            
        annual = sum(m_vals.values())
        jan_feb = m_vals['JAN'] + m_vals['FEB']
        mar_may = m_vals['MAR'] + m_vals['APR'] + m_vals['MAY']
        jun_sep = m_vals['JUN'] + m_vals['JUL'] + m_vals['AUG'] + m_vals['SEP']
        oct_dec = m_vals['OCT'] + m_vals['NOV'] + m_vals['DEC']
        
        clean_records.append({
            'subdivision': s,
            'year': y,
            'months': m_vals,
            'seasons': {
                'Jan-Feb': round(jan_feb, 2),
                'Mar-May': round(mar_may, 2),
                'Jun-Sep': round(jun_sep, 2),
                'Oct-Dec': round(oct_dec, 2)
            },
            'annual': round(annual, 2)
        })
        
    all_subdivs = sorted(list(subdiv_rows.keys()))
    all_years = sorted(list(set(r['year'] for r in clean_records)))
    
    # 1. National Annual Series
    national_series = []
    for y in all_years:
        y_recs = [r for r in clean_records if r['year'] == y]
        avg_annual = sum(r['annual'] for r in y_recs) / len(y_recs)
        
        # Monthly averages
        m_avgs = {}
        for m in MONTHS:
            m_avgs[m] = round(sum(r['months'][m] for r in y_recs) / len(y_recs), 2)
            
        s_avgs = {}
        for szn in SEASONS:
            s_avgs[szn] = round(sum(r['seasons'][szn] for r in y_recs) / len(y_recs), 2)
            
        national_series.append({
            'year': y,
            'annual': round(avg_annual, 2),
            'months': m_avgs,
            'seasons': s_avgs,
            'monsoon': s_avgs['Jun-Sep'],
            'monsoon_share': round((s_avgs['Jun-Sep'] / avg_annual) * 100, 2)
        })
        
    nat_annual_vals = [d['annual'] for d in national_series]
    nat_lpa = round(sum(nat_annual_vals) / len(nat_annual_vals), 2)
    nat_monsoon_vals = [d['monsoon'] for d in national_series]
    nat_monsoon_lpa = round(sum(nat_monsoon_vals) / len(nat_monsoon_vals), 2)
    
    # Add departures and YoY to national
    for i, d in enumerate(national_series):
        d['annual_departure'] = round(((d['annual'] - nat_lpa) / nat_lpa) * 100, 2)
        d['monsoon_departure'] = round(((d['monsoon'] - nat_monsoon_lpa) / nat_monsoon_lpa) * 100, 2)
        if i == 0:
            d['yoy_change'] = 0.0
            d['yoy_pct'] = 0.0
        else:
            prev = national_series[i-1]['annual']
            d['yoy_change'] = round(d['annual'] - prev, 2)
            d['yoy_pct'] = round(((d['annual'] - prev) / prev) * 100, 2)
            
        # IMD Classification
        mon_dep = d['monsoon_departure']
        if mon_dep >= 10.0:
            d['category'] = 'Excess Monsoon'
        elif mon_dep >= -10.0:
            d['category'] = 'Normal Monsoon'
        elif mon_dep >= -20.0:
            d['category'] = 'Deficient (Moderate Drought)'
        else:
            d['category'] = 'Scanty (Severe Drought)'
            
    # Add Moving Averages (5-year, 10-year)
    for i in range(len(national_series)):
        start_5 = max(0, i - 4)
        slice_5 = [national_series[k]['annual'] for k in range(start_5, i + 1)]
        national_series[i]['sma_5'] = round(sum(slice_5) / len(slice_5), 2)
        
        start_10 = max(0, i - 9)
        slice_10 = [national_series[k]['annual'] for k in range(start_10, i + 1)]
        national_series[i]['sma_10'] = round(sum(slice_10) / len(slice_10), 2)

    # National Monthly Climatology (115-year mean, min, max, std)
    national_monthly_clim = {}
    for m in MONTHS:
        vals = [d['months'][m] for d in national_series]
        mean_v = sum(vals) / len(vals)
        std_v = math.sqrt(sum((v - mean_v) ** 2 for v in vals) / len(vals))
        national_monthly_clim[m] = {
            'mean': round(mean_v, 2),
            'min': round(min(vals), 2),
            'max': round(max(vals), 2),
            'std': round(std_v, 2)
        }
        
    # National Seasonal Climatology
    national_seasonal_clim = {}
    for szn in SEASONS:
        vals = [d['seasons'][szn] for d in national_series]
        mean_v = sum(vals) / len(vals)
        national_seasonal_clim[szn] = {
            'label': SEASON_LABELS[szn],
            'mean': round(mean_v, 2),
            'share_pct': round((mean_v / nat_lpa) * 100, 2)
        }

    # 2. Subdivision Analytics
    subdiv_details = {}
    for s in all_subdivs:
        s_recs = sorted([r for r in clean_records if r['subdivision'] == s], key=lambda x: x['year'])
        annuals = [r['annual'] for r in s_recs]
        years_s = [r['year'] for r in s_recs]
        
        mean_ann = sum(annuals) / len(annuals)
        std_ann = math.sqrt(sum((a - mean_ann) ** 2 for a in annuals) / len(annuals))
        cv_ann = (std_ann / mean_ann * 100) if mean_ann > 0 else 0
        
        # Monthly climatology
        m_clim = {}
        for m in MONTHS:
            vals = [r['months'][m] for r in s_recs]
            m_clim[m] = {
                'mean': round(sum(vals) / len(vals), 2),
                'min': round(min(vals), 2),
                'max': round(max(vals), 2)
            }
            
        # Seasonal climatology
        s_clim = {}
        for szn in SEASONS:
            vals = [r['seasons'][szn] for r in s_recs]
            mean_szn = sum(vals) / len(vals)
            s_clim[szn] = {
                'label': SEASON_LABELS[szn],
                'mean': round(mean_szn, 2),
                'share_pct': round((mean_szn / mean_ann) * 100, 2) if mean_ann > 0 else 0
            }
            
        # Linear trend
        slope, intercept, r2, se = linear_regression(years_s, annuals)
        
        # Time series with YoY and moving averages
        timeline = []
        for i, r in enumerate(s_recs):
            yoy = 0.0 if i == 0 else round(r['annual'] - s_recs[i-1]['annual'], 2)
            yoy_pct = 0.0 if i == 0 or s_recs[i-1]['annual'] == 0 else round(((r['annual'] - s_recs[i-1]['annual']) / s_recs[i-1]['annual']) * 100, 2)
            
            s5 = max(0, i - 4)
            s10 = max(0, i - 9)
            sma5 = sum(s_recs[k]['annual'] for k in range(s5, i + 1)) / (i - s5 + 1)
            sma10 = sum(s_recs[k]['annual'] for k in range(s10, i + 1)) / (i - s10 + 1)
            
            timeline.append({
                'year': r['year'],
                'annual': r['annual'],
                'monsoon': r['seasons']['Jun-Sep'],
                'departure': round(((r['annual'] - mean_ann) / mean_ann) * 100, 2) if mean_ann > 0 else 0,
                'yoy_change': yoy,
                'yoy_pct': yoy_pct,
                'sma_5': round(sma5, 2),
                'sma_10': round(sma10, 2)
            })
            
        # Wettest and driest years
        sorted_by_val = sorted(s_recs, key=lambda x: x['annual'])
        top_dry = [{'year': x['year'], 'annual': x['annual']} for x in sorted_by_val[:5]]
        top_wet = [{'year': x['year'], 'annual': x['annual']} for x in sorted_by_val[-5:]][::-1]
        
        # Find zone
        region_name = 'OTHER'
        for reg, subdiv_list in REGIONS.items():
            if s in subdiv_list:
                region_name = reg
                break
                
        subdiv_details[s] = {
            'name': s,
            'region': region_name,
            'lpa': round(mean_ann, 2),
            'median': round(sorted(annuals)[len(annuals)//2], 2),
            'std': round(std_ann, 2),
            'cv': round(cv_ann, 2),
            'min': round(min(annuals), 2),
            'max': round(max(annuals), 2),
            'trend_slope_per_decade': round(slope * 10, 2),
            'trend_r2': round(r2, 4),
            'monsoon_lpa': s_clim['Jun-Sep']['mean'],
            'monsoon_share': s_clim['Jun-Sep']['share_pct'],
            'monthly_climatology': m_clim,
            'seasonal_climatology': s_clim,
            'top_wettest_years': top_wet,
            'top_driest_years': top_dry,
            'timeline': timeline
        }
        
    # 3. Regional Summaries
    regional_summary = {}
    for reg, subdiv_list in REGIONS.items():
        reg_subdivs = [s for s in subdiv_list if s in subdiv_details]
        if reg_subdivs:
            avg_lpa = sum(subdiv_details[s]['lpa'] for s in reg_subdivs) / len(reg_subdivs)
            avg_monsoon = sum(subdiv_details[s]['monsoon_lpa'] for s in reg_subdivs) / len(reg_subdivs)
            regional_summary[reg] = {
                'subdivision_count': len(reg_subdivs),
                'subdivisions': reg_subdivs,
                'lpa': round(avg_lpa, 2),
                'monsoon_lpa': round(avg_monsoon, 2),
                'monsoon_share': round((avg_monsoon / avg_lpa) * 100, 2)
            }
            
    # 4. Decadal Trends
    decades = []
    decade_starts = list(range(1901, 2015, 10))
    for d_start in decade_starts:
        d_end = min(d_start + 9, 2015)
        d_recs = [d for d in national_series if d_start <= d['year'] <= d_end]
        avg_d = sum(d['annual'] for d in d_recs) / len(d_recs)
        avg_mon = sum(d['monsoon'] for d in d_recs) / len(d_recs)
        decades.append({
            'decade': f"{d_start}-{d_end}",
            'avg_annual': round(avg_d, 2),
            'avg_monsoon': round(avg_mon, 2),
            'departure_from_lpa': round(((avg_d - nat_lpa) / nat_lpa) * 100, 2)
        })

    # 5. Rankings & Extremes
    sorted_by_lpa = sorted(subdiv_details.values(), key=lambda x: x['lpa'], reverse=True)
    top_wettest_subdivs = [{
        'name': x['name'],
        'region': x['region'],
        'lpa': x['lpa'],
        'monsoon_share': x['monsoon_share'],
        'cv': x['cv']
    } for x in sorted_by_lpa[:10]]
    
    top_driest_subdivs = [{
        'name': x['name'],
        'region': x['region'],
        'lpa': x['lpa'],
        'monsoon_share': x['monsoon_share'],
        'cv': x['cv']
    } for x in sorted_by_lpa[-10:]][::-1]
    
    sorted_by_cv = sorted(subdiv_details.values(), key=lambda x: x['cv'], reverse=True)
    highest_volatility_subdivs = [{
        'name': x['name'],
        'region': x['region'],
        'lpa': x['lpa'],
        'cv': x['cv']
    } for x in sorted_by_cv[:10]]

    # All-India Top 10 Wettest and Driest Years
    sorted_nat_years = sorted(national_series, key=lambda x: x['annual'], reverse=True)
    top_wettest_nat_years = [{
        'year': x['year'],
        'annual': x['annual'],
        'monsoon': x['monsoon'],
        'departure': x['annual_departure']
    } for x in sorted_nat_years[:10]]
    
    top_driest_nat_years = [{
        'year': x['year'],
        'annual': x['annual'],
        'monsoon': x['monsoon'],
        'departure': x['annual_departure']
    } for x in sorted_nat_years[-10:]][::-1]

    # Major Drought Years and Flood Years
    drought_years = [x for x in national_series if x['monsoon_departure'] <= -10.0]
    flood_years = [x for x in national_series if x['monsoon_departure'] >= 10.0]

    # 6. Forecasting & Machine Learning Validation
    # Backtesting on National series:
    # Train: 1901 to 2005 (105 years), Test: 2006 to 2015 (10 years)
    train_nat = [d for d in national_series if d['year'] <= 2005]
    test_nat = [d for d in national_series if d['year'] >= 2006]
    
    y_train = [d['annual'] for d in train_nat]
    x_train = [d['year'] for d in train_nat]
    y_test = [d['annual'] for d in test_nat]
    x_test = [d['year'] for d in test_nat]
    
    # Model 1: Linear Regression
    lr_slope, lr_inter, _, _ = linear_regression(x_train, y_train)
    pred_lr_test = [round(lr_inter + lr_slope * yr, 2) for yr in x_test]
    
    # Model 2: Moving Average (5-year SMA rolling)
    pred_sma5_test = []
    for yr in x_test:
        prev_5 = [d['annual'] for d in national_series if yr - 5 <= d['year'] < yr]
        pred_sma5_test.append(round(sum(prev_5) / len(prev_5), 2))
        
    # Model 3: Holt's Linear Exponential Smoothing
    pred_holt_test = []
    for yr in x_test:
        hist = [d['annual'] for d in national_series if d['year'] < yr]
        pred_holt_test.append(round(holt_linear(hist, alpha=0.25, beta=0.08), 2))
        
    # Model 4: Autoregressive AR(3) + SMA(5) with OLS weights
    # Fit AR on train: y_t = w0 + w1*y_{t-1} + w2*y_{t-2} + w3*y_{t-3}
    ar_x = []
    ar_y = []
    for i in range(3, len(train_nat)):
        ar_x.append([1.0, train_nat[i-1]['annual'], train_nat[i-2]['annual'], train_nat[i-3]['annual']])
        ar_y.append(train_nat[i]['annual'])
        
    # Simple pseudo-inverse or normal eq for AR(3):
    # Using gradient descent or analytical normal equation
    # Let's solve normal equations X^T X W = X^T Y
    p = 4
    xtx = [[sum(ar_x[k][i] * ar_x[k][j] for k in range(len(ar_x))) for j in range(p)] for i in range(p)]
    xty = [sum(ar_x[k][i] * ar_y[k] for k in range(len(ar_x))) for i in range(p)]
    
    # Gaussian elimination for 4x4 matrix
    def solve_linear_system(A, b):
        n = len(b)
        M = [row[:] + [b[i]] for i, row in enumerate(A)]
        for i in range(n):
            # Pivot
            max_r = max(range(i, n), key=lambda r: abs(M[r][i]))
            M[i], M[max_r] = M[max_r], M[i]
            diag = M[i][i]
            if abs(diag) < 1e-9:
                return [0.0] * n
            for j in range(i, n + 1):
                M[i][j] /= diag
            for r in range(n):
                if r != i:
                    factor = M[r][i]
                    for j in range(i, n + 1):
                        M[r][j] -= factor * M[i][j]
        return [M[i][-1] for i in range(n)]
        
    ar_weights = solve_linear_system(xtx, xty)
    pred_ar_test = []
    for yr in x_test:
        prev = [d['annual'] for d in national_series if d['year'] < yr]
        val = ar_weights[0] + ar_weights[1]*prev[-1] + ar_weights[2]*prev[-2] + ar_weights[3]*prev[-3]
        pred_ar_test.append(round(val, 2))
        
    # Model 5: Blended Ensemble (0.35 Holt + 0.35 SMA5 + 0.30 AR3)
    pred_ensemble_test = [
        round(0.35 * pred_holt_test[i] + 0.35 * pred_sma5_test[i] + 0.30 * pred_ar_test[i], 2)
        for i in range(len(x_test))
    ]
    
    # Calculate metrics function
    def calc_metrics(actual, pred):
        n = len(actual)
        rmse = math.sqrt(sum((actual[i] - pred[i]) ** 2 for i in range(n)) / n)
        mae = sum(abs(actual[i] - pred[i]) for i in range(n)) / n
        mape = sum(abs((actual[i] - pred[i]) / actual[i]) for i in range(n)) / n * 100
        mean_act = sum(actual) / n
        ss_tot = sum((actual[i] - mean_act) ** 2 for i in range(n))
        ss_res = sum((actual[i] - pred[i]) ** 2 for i in range(n))
        r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0
        return {
            'rmse': round(rmse, 2),
            'mae': round(mae, 2),
            'mape': round(mape, 2),
            'r2': round(r2, 3)
        }
        
    models_evaluation = {
        'Linear Trend': calc_metrics(y_test, pred_lr_test),
        '5-Year Moving Average': calc_metrics(y_test, pred_sma5_test),
        'Holt Exponential Smoothing': calc_metrics(y_test, pred_holt_test),
        'Autoregressive AR(3)': calc_metrics(y_test, pred_ar_test),
        'Ensemble Forecaster': calc_metrics(y_test, pred_ensemble_test)
    }
    
    # Backtest comparison records
    backtest_records = []
    for i, yr in enumerate(x_test):
        backtest_records.append({
            'year': yr,
            'actual': y_test[i],
            'linear_regression': pred_lr_test[i],
            'sma_5': pred_sma5_test[i],
            'holt_exponential': pred_holt_test[i],
            'ar_3': pred_ar_test[i],
            'ensemble': pred_ensemble_test[i]
        })
        
    # FORECAST FOR 2016 (UPCOMING YEAR) & BEYOND (2016-2025)
    # Using full 1901-2015 historical data
    full_slope, full_inter, _, full_se = linear_regression([d['year'] for d in national_series], [d['annual'] for d in national_series])
    full_holt_2016 = holt_linear([d['annual'] for d in national_series], alpha=0.25, beta=0.08)
    recent_5_avg = sum(d['annual'] for d in national_series[-5:]) / 5.0
    recent_10_avg = sum(d['annual'] for d in national_series[-10:]) / 10.0
    
    # AR fit on full
    ar_x_full = []
    ar_y_full = []
    for i in range(3, len(national_series)):
        ar_x_full.append([1.0, national_series[i-1]['annual'], national_series[i-2]['annual'], national_series[i-3]['annual']])
        ar_y_full.append(national_series[i]['annual'])
    xtx_f = [[sum(ar_x_full[k][i] * ar_x_full[k][j] for k in range(len(ar_x_full))) for j in range(4)] for i in range(4)]
    xty_f = [sum(ar_x_full[k][i] * ar_y_full[k] for k in range(len(ar_x_full))) for i in range(4)]
    ar_weights_f = solve_linear_system(xtx_f, xty_f)
    full_ar_2016 = ar_weights_f[0] + ar_weights_f[1]*nat_annual_vals[-1] + ar_weights_f[2]*nat_annual_vals[-2] + ar_weights_f[3]*nat_annual_vals[-3]
    
    pred_2016_ensemble = round(0.35 * full_holt_2016 + 0.35 * recent_5_avg + 0.30 * full_ar_2016, 2)
    pred_2016_lr = round(full_inter + full_slope * 2016, 2)
    
    # 95% Confidence Interval for 2016
    ci_margin = round(1.96 * full_se, 2)
    ci_lower = round(pred_2016_ensemble - ci_margin, 2)
    ci_upper = round(pred_2016_ensemble + ci_margin, 2)
    
    # Multi-year projection 2016-2025
    projection_years = list(range(2016, 2026))
    projections = []
    for y in projection_years:
        lr_v = round(full_inter + full_slope * y, 2)
        # decaying to LPA with dampening
        weight_lr = min(1.0, (y - 2015) * 0.15)
        ens_v = round((1 - weight_lr) * pred_2016_ensemble + weight_lr * lr_v, 2)
        projections.append({
            'year': y,
            'ensemble_forecast': ens_v,
            'linear_trend': lr_v,
            'lower_ci_95': round(ens_v - ci_margin, 2),
            'upper_ci_95': round(ens_v + ci_margin, 2)
        })
        
    # Precompute per-subdivision 2016 forecast
    subdiv_forecasts_2016 = {}
    for s, data in subdiv_details.items():
        ann_vals = [t['annual'] for t in data['timeline']]
        yrs = [t['year'] for t in data['timeline']]
        s_slope, s_inter, _, s_se = linear_regression(yrs, ann_vals)
        s_holt = holt_linear(ann_vals, alpha=0.25, beta=0.08)
        s_5avg = sum(ann_vals[-5:]) / 5.0
        
        s_pred = round(0.5 * s_holt + 0.5 * s_5avg, 2)
        s_dep = round(((s_pred - data['lpa']) / data['lpa']) * 100, 2) if data['lpa'] > 0 else 0
        s_margin = round(1.96 * s_se, 2)
        
        subdiv_forecasts_2016[s] = {
            'predicted_annual': s_pred,
            'linear_trend_pred': round(s_inter + s_slope * 2016, 2),
            'departure_from_lpa': s_dep,
            'lower_ci_95': round(max(0, s_pred - s_margin), 2),
            'upper_ci_95': round(s_pred + s_margin, 2),
            'category': 'Normal' if abs(s_dep) <= 10 else ('Surplus' if s_dep > 10 else 'Deficit')
        }

    # Consolidated output payload
    dashboard_data = {
        'metadata': {
            'title': 'India Historical Rainfall Analysis & Prediction Engine (1901-2015)',
            'start_year': min(all_years),
            'end_year': max(all_years),
            'total_years': len(all_years),
            'total_subdivisions': len(all_subdivs),
            'national_lpa': nat_lpa,
            'national_monsoon_lpa': nat_monsoon_lpa,
            'monsoon_share_national': round((nat_monsoon_lpa / nat_lpa) * 100, 2),
            'generated_at': '2026-10-07'
        },
        'regions': REGIONS,
        'regional_summary': regional_summary,
        'subdivisions': all_subdivs,
        'subdivision_details': subdiv_details,
        'national_series': national_series,
        'national_monthly_climatology': national_monthly_clim,
        'national_seasonal_climatology': national_seasonal_clim,
        'decadal_trends': decades,
        'rankings': {
            'top_wettest_subdivisions': top_wettest_subdivs,
            'top_driest_subdivisions': top_driest_subdivs,
            'highest_volatility_subdivisions': highest_volatility_subdivs,
            'top_wettest_national_years': top_wettest_nat_years,
            'top_driest_national_years': top_driest_nat_years,
            'drought_years_count': len(drought_years),
            'flood_years_count': len(flood_years)
        },
        'predictive_modeling': {
            'backtesting': {
                'train_period': '1901-2005',
                'test_period': '2006-2015',
                'metrics': models_evaluation,
                'test_comparisons': backtest_records
            },
            'forecast_2016': {
                'upcoming_year': 2016,
                'ensemble_prediction': pred_2016_ensemble,
                'linear_trend_prediction': pred_2016_lr,
                'holt_prediction': round(full_holt_2016, 2),
                'recent_5yr_avg': round(recent_5_avg, 2),
                'confidence_interval_95': {
                    'lower': ci_lower,
                    'upper': ci_upper,
                    'margin': ci_margin
                },
                'departure_from_lpa': round(((pred_2016_ensemble - nat_lpa) / nat_lpa) * 100, 2),
                'subdivision_forecasts': subdiv_forecasts_2016
            },
            'multi_year_projections': projections
        }
    }
    
    # Save into output files
    out_dir = r"c:\Rainfall-Prediction-Dashboard\data"
    os.makedirs(out_dir, exist_ok=True)
    out_json = os.path.join(out_dir, "rainfall_analytics.json")
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(dashboard_data, f, indent=2)
        
    print(f"Successfully generated {out_json} (size: {os.path.getsize(out_json) / 1024:.1f} KB)")
    print(f"National LPA: {nat_lpa} mm, Monsoon LPA: {nat_monsoon_lpa} mm")
    print(f"2016 Ensemble Forecast: {pred_2016_ensemble} mm (95% CI: [{ci_lower}, {ci_upper}])")
    print("Backtesting Performance Metrics:")
    for m_name, m_stats in models_evaluation.items():
        print(f"  {m_name}: RMSE={m_stats['rmse']} mm, MAE={m_stats['mae']} mm, MAPE={m_stats['mape']}%, R2={m_stats['r2']}")

if __name__ == '__main__':
    run_analytics()
