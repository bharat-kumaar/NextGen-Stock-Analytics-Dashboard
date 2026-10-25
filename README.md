<div align="center">

# 📊 NextGen Stock Analytics & Intelligence Dashboard

### ⚡ Full-Stack Financial Market Telemetry • Technical Indicators • Machine Learning Predictor

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-2.x-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Scikit--Learn-Machine_Learning-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="Scikit-Learn" />
  <img src="https://img.shields.io/badge/Yahoo_Finance-Real_Time_Data-720e9e?style=for-the-badge&logo=yahoo&logoColor=white" alt="Yahoo Finance" />
</p>

---

</div>

## 📌 Overview

**NextGen Stock Analytics Dashboard** is a high-performance web platform for real-time equity market analysis, technical indicator computation, and machine learning price projection. Built with a responsive dark cyberpunk UI, it enables traders and analysts to track live market trends, calculate overbought/oversold oscillators, and forecast closing prices using advanced statistical algorithms.

---

## 🚀 Key Features

* **Real-Time Market Ingestion:** Live price streaming for equities, indices, and tech stocks via the Yahoo Finance API.
* **Algorithmic Technical Indicators:**
  * **Relative Strength Index (RSI)** with momentum bounds (30/70)
  * **Moving Average Convergence Divergence (MACD)** and Signal divergence
  * **Bollinger Bands** (Upper, Lower, and Moving Average envelopes)
  * **Exponential Moving Averages** (EMA 12, 26) & Simple Moving Averages (SMA 20, 50)
* **Embedded Machine Learning Models:**
  * Linear Regression trend baseline
  * Random Forest Ensemble regression with feature importance scaling
* **Interactive Financial Charting:**
  * Dynamic interactive charts with panning, zoom, volume subplots, and responsive layout.
* **Multi-threaded Background Cache:**
  * In-memory market caching with threading locks to ensure rapid response times and reduce upstream API throttling.

---

## 🛠️ Tech Stack

* **Backend:** Python, Flask, Gunicorn
* **Data Processing & ML:** Pandas, NumPy, Scikit-Learn, `ta` (Technical Analysis Library), Yahoo Finance (`yfinance`)
* **Frontend:** Modern Vanilla JavaScript (ES6+), HTML5, Custom Cyberpunk CSS3 Glassmorphism
* **Visualization:** Plotly.js / Chart.js integration

---

## 📂 Project Structure

```
NextGen-Stock-Analytics-Dashboard/
├── app.py              # Main Flask application & ML backend service
├── main.py             # Entry point runner
├── start.py            # Startup script with environment verification
├── requirements.txt    # Python dependencies
├── .gitignore          # Git exclusion rules
├── static/
│   ├── script.js       # Client-side UI logic, API fetchers, charting
│   └── style.css       # Cyberpunk dark mode styling & animations
└── templates/
    └── index.html      # Responsive dashboard interface
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/bharat-kumaar/NextGen-Stock-Analytics-Dashboard.git
cd NextGen-Stock-Analytics-Dashboard
```

### 2. Create and Activate Virtual Environment
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 3. Install Required Dependencies
```bash
pip install -r requirements.txt
```

### 4. Launch the Application
```bash
python app.py
```
Or use the launch helper:
```bash
python start.py
```

Open your browser and navigate to: **`http://localhost:5000`**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Renders the primary dashboard UI |
| `GET` | `/api/stock/<ticker>` | Fetches real-time price, volume, and company overview |
| `GET` | `/api/history/<ticker>` | Retrieves historical candles with technical indicators |
| `GET` | `/api/predict/<ticker>` | Runs Scikit-Learn ML regression model to forecast future prices |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Developed with ⚡ by <a href="https://github.com/bharat-kumaar"><strong>Bharat Kumar</strong></a>
</p>
