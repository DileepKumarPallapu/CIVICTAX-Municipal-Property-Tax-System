# CivicTax Revenue Forecasting & Predictive Modeling Methodology

## 1. Forecasting Principles & Scope

The CivicTax Revenue Forecasting engine models future municipal tax revenues by synthesizing historical payment ledgers. 

> [!IMPORTANT]
> **Data Guardrail**: Revenue forecasting strictly executes over **verified, successful historical payment records only**. Pending, rejected, failed, or simulated payment drafts are explicitly excluded.
> **Estimate Notice**: All generated forecasts are clearly identified in the UI and reports as **statistical estimates** subject to municipal demographic and economic variances.

---

## 2. Mathematical Models

### 2.1 Simple Moving Average (SMA)
For a window of $k$ periods (months or quarters):

$$\text{SMA}_t = \frac{1}{k} \sum_{i=1}^{k} R_{t-i}$$

*Use Case*: Baseline short-term revenue smoothing, removing transient single-month tax collection spikes (e.g. quarterly advance rebates).

### 2.2 Weighted Moving Average (WMA)
Applies linearly increasing weights to recent observations to capture current trends:

$$\text{WMA}_t = \frac{\sum_{i=1}^{k} w_i \cdot R_{t-k+i}}{\sum_{i=1}^{k} w_i} \quad \text{where } w_i = i$$

*Use Case*: Capturing recent seasonal spikes or recent enforcement drives where recent collections carry higher predictive value.

### 2.3 Linear Trend Line (Ordinary Least Squares Regression)
Fits a linear equation $y = mx + c$ through historical periods $t = 1, 2, \dots, n$:

$$m = \frac{n \sum (t \cdot R_t) - (\sum t)(\sum R_t)}{n \sum t^2 - (\sum t)^2}$$

$$c = \frac{\sum R_t - m \sum t}{n}$$

$$\text{Forecast}_{n+h} = m(n+h) + c$$

*Use Case*: Long-range multi-quarter capital expenditure and budget planning.

---

## 3. Assumptions and Model Limitations

1. **Observation Threshold**: A minimum of 3 historical periods is strictly required before any statistical model is computed. When fewer observations exist, the engine displays an informative fallback: *"Insufficient Historical Baseline Data (Minimum 3 periods required)"*.
2. **Economic Shocks**: The models assume continuous municipal operation without accounting for unannounced tax rate amendments, natural disasters, or macroeconomic policy shifts.
3. **Seasonal Adjustment**: Property tax collections typically surge in Q1 (due to early bird rebate incentives) and Q4 (fiscal year-end enforcement). Linear models may underestimate mid-year collections if trained purely on Q1.
