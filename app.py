
from flask import Flask, render_template, jsonify, request
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import mean_squared_error, r2_score
from datetime import datetime, timedelta
import json
import threading
import time
import signal
import os
from collections import deque
import ta

app = Flask(__name__)

# Global cache for real-time data
market_cache = {}
cache_lock = threading.Lock()
cache_thread = None

# Signal handler for graceful shutdown
def signal_handler(signum, frame):
    print(f"Received signal {signum}, shutting down gracefully...")
    if cache_thread and cache_thread.is_alive():
        cache_thread.join(timeout=2)
    os._exit(0)

# Register signal handlers
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)
if hasattr(signal, 'SIGWINCH'):
    signal.signal(signal.SIGWINCH, signal.SIG_IGN)  # Ignore window change signals

class AdvancedStockAnalyzer:
    def __init__(self):
        self.models = {
            'linear': LinearRegression(),
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42)
        }
        self.scaler = StandardScaler()
        
    def prepare_features(self, data):
        """Create advanced technical indicators"""
        df = data.copy()
        
        # Technical indicators
        df['SMA_5'] = ta.trend.sma_indicator(df['Close'], window=5)
        df['SMA_20'] = ta.trend.sma_indicator(df['Close'], window=20)
        df['EMA_12'] = ta.trend.ema_indicator(df['Close'], window=12)
        df['RSI'] = ta.momentum.rsi(df['Close'], window=14)
        df['MACD'] = ta.trend.macd_diff(df['Close'])
        df['BB_upper'] = ta.volatility.bollinger_hband(df['Close'])
        df['BB_lower'] = ta.volatility.bollinger_lband(df['Close'])
        df['Volume_SMA'] = ta.volume.volume_sma(df['Close'], df['Volume'], window=20)
        
        # Price features
        df['Price_Change'] = df['Close'].pct_change()
        df['High_Low_Ratio'] = df['High'] / df['Low']
        df['Volume_Change'] = df['Volume'].pct_change()
        
        # Lag features
        for i in [1, 2, 3, 5]:
            df[f'Close_lag_{i}'] = df['Close'].shift(i)
            df[f'Volume_lag_{i}'] = df['Volume'].shift(i)
        
        return df.dropna()
    
    def train_and_predict(self, data, days=7):
        """Advanced prediction with multiple models"""
        feature_cols = ['SMA_5', 'SMA_20', 'EMA_12', 'RSI', 'MACD', 'BB_upper', 'BB_lower',
                       'High_Low_Ratio', 'Volume_Change', 'Close_lag_1', 'Close_lag_2', 
                       'Close_lag_3', 'Close_lag_5', 'Volume_lag_1']
        
        X = data[feature_cols].values
        y = data['Close'].values
        
        # Split data
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        predictions = {}
        accuracies = {}
        
        for name, model in self.models.items():
            model.fit(X_train_scaled, y_train)
            test_pred = model.predict(X_test_scaled)
            accuracies[name] = r2_score(y_test, test_pred)
            
            # Future predictions
            last_features = X_test_scaled[-1:].reshape(1, -1)
            future_preds = []
            
            for _ in range(days):
                pred = model.predict(last_features)[0]
                future_preds.append(pred)
                
                # Update features for next prediction (simplified)
                new_features = last_features.copy()
                new_features[0, -1] = pred  # Update Close_lag_1
                last_features = new_features
            
            predictions[name] = future_preds
        
        # Ensemble prediction (weighted average based on accuracy)
        total_weight = sum(accuracies.values())
        if total_weight > 0:
            ensemble_pred = []
            for i in range(days):
                weighted_pred = sum(
                    predictions[name][i] * accuracies[name] 
                    for name in predictions
                ) / total_weight
                ensemble_pred.append(weighted_pred)
        else:
            ensemble_pred = predictions['linear']
        
        return ensemble_pred, max(accuracies.values()) if accuracies else 0.5

def update_market_cache():
    """Background thread to update market data"""
    trending_symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'AMD', 'NFLX', 'SPOT']
    
    while True:
        try:
            with cache_lock:
                for symbol in trending_symbols:
                    try:
                        stock = yf.Ticker(symbol)
                        hist = stock.history(period="1d", interval="1m")
                        if not hist.empty:
                            current_price = hist['Close'].iloc[-1]
                            prev_close = stock.history(period="2d")['Close'].iloc[-2]
                            change = ((current_price - prev_close) / prev_close) * 100
                            
                            market_cache[symbol] = {
                                'price': float(current_price),
                                'change': float(change),
                                'timestamp': datetime.now().isoformat(),
                                'volume': float(hist['Volume'].iloc[-1]) if not hist['Volume'].empty else 0
                            }
                    except Exception as e:
                        print(f"Error updating {symbol}: {e}")
            
            time.sleep(30)  # Update every 30 seconds
        except Exception as e:
            print(f"Cache update error: {e}")
            time.sleep(60)

# Start background thread with better error handling
def start_cache_thread():
    global cache_thread
    if cache_thread is None or not cache_thread.is_alive():
        cache_thread = threading.Thread(target=update_market_cache, daemon=True)
        cache_thread.start()
        print("Market cache thread started")

# Initialize cache thread
start_cache_thread()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/health')
def health_check():
    return {'status': 'healthy', 'message': 'Ultra Stock Prediction AI is running', 'cache_size': len(market_cache)}

@app.route('/api/realtime/<symbol>')
def get_realtime_data(symbol):
    """Get real-time price data"""
    try:
        stock = yf.Ticker(symbol.upper())
        hist = stock.history(period="1d", interval="1m")
        
        if hist.empty:
            return jsonify({'error': 'No real-time data available', 'status': 'error'}), 400
        
        # Get last 60 minutes of data
        recent_data = hist.tail(60)
        timestamps = [ts.strftime('%H:%M') for ts in recent_data.index]
        prices = recent_data['Close'].tolist()
        volumes = recent_data['Volume'].tolist()
        
        return jsonify({
            'symbol': symbol.upper(),
            'timestamps': timestamps,
            'prices': [float(p) for p in prices],
            'volumes': [float(v) for v in volumes],
            'current_price': float(prices[-1]) if prices else 0,
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 400

@app.route('/api/stock/<symbol>')
def get_stock_data(symbol):
    try:
        stock = yf.Ticker(symbol.upper())
        info = stock.info
        hist = stock.history(period="1mo")
        
        if hist.empty:
            return jsonify({'error': 'No data available', 'status': 'error'}), 400
        
        current_price = hist['Close'].iloc[-1]
        prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
        change_percent = ((current_price - prev_close) / prev_close) * 100
        
        # Calculate volatility
        returns = hist['Close'].pct_change().dropna()
        volatility = returns.std() * np.sqrt(252) * 100  # Annualized volatility
        
        # Support and resistance levels
        high_52w = hist['High'].max()
        low_52w = hist['Low'].min()
        
        return jsonify({
            'symbol': symbol.upper(),
            'current_price': float(current_price),
            'change_percent': float(change_percent),
            'company_name': info.get('longName', 'N/A'),
            'market_cap': info.get('marketCap', 'N/A'),
            'pe_ratio': info.get('trailingPE', 'N/A'),
            'dividend_yield': info.get('dividendYield', 'N/A'),
            'volatility': float(volatility),
            'high_52w': float(high_52w),
            'low_52w': float(low_52w),
            'avg_volume': float(hist['Volume'].mean()),
            'beta': info.get('beta', 'N/A'),
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 400

@app.route('/api/predict/<symbol>')
def predict_stock(symbol):
    try:
        stock = yf.Ticker(symbol.upper())
        hist = stock.history(period="1y")  # More data for better predictions
        
        if len(hist) < 50:
            return jsonify({'error': 'Insufficient data for analysis', 'status': 'error'}), 400
        
        analyzer = AdvancedStockAnalyzer()
        featured_data = analyzer.prepare_features(hist)
        
        if len(featured_data) < 30:
            return jsonify({'error': 'Insufficient data after feature engineering', 'status': 'error'}), 400
        
        predictions, confidence = analyzer.train_and_predict(featured_data, days=7)
        current_price = hist['Close'].iloc[-1]
        
        # Calculate trend and signals
        trend = "BULLISH" if predictions[-1] > current_price else "BEARISH"
        trend_strength = abs((predictions[-1] - current_price) / current_price) * 100
        
        # Risk assessment
        volatility = hist['Close'].pct_change().std() * np.sqrt(252) * 100
        risk_level = "HIGH" if volatility > 30 else "MEDIUM" if volatility > 15 else "LOW"
        
        # Generate signals
        signals = []
        if trend == "BULLISH" and confidence > 0.7:
            signals.append({"type": "BUY", "strength": "STRONG", "reason": "AI predicts strong upward trend"})
        elif trend == "BEARISH" and confidence > 0.7:
            signals.append({"type": "SELL", "strength": "STRONG", "reason": "AI predicts strong downward trend"})
        else:
            signals.append({"type": "HOLD", "strength": "NEUTRAL", "reason": "Mixed signals detected"})
        
        return jsonify({
            'symbol': symbol.upper(),
            'current_price': float(current_price),
            'predictions': [float(p) for p in predictions],
            'trend': trend,
            'trend_strength': float(trend_strength),
            'confidence': f"{confidence * 100:.1f}%",
            'risk_level': risk_level,
            'volatility': float(volatility),
            'signals': signals,
            'target_price': float(predictions[-1]),
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 400

@app.route('/api/trending')
def get_trending_stocks():
    with cache_lock:
        cached_data = market_cache.copy()
    
    if not cached_data:
        # Fallback to direct fetch
        trending = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'AMD']
        stocks_data = []
        
        for symbol in trending:
            try:
                stock = yf.Ticker(symbol)
                hist = stock.history(period="2d")
                if len(hist) >= 2:
                    current = hist['Close'].iloc[-1]
                    prev = hist['Close'].iloc[-2]
                    change = ((current - prev) / prev) * 100
                    
                    stocks_data.append({
                        'symbol': symbol,
                        'price': round(float(current), 2),
                        'change': round(float(change), 2),
                        'volume': float(hist['Volume'].iloc[-1])
                    })
            except:
                continue
    else:
        stocks_data = [
            {
                'symbol': symbol,
                'price': round(data['price'], 2),
                'change': round(data['change'], 2),
                'volume': data.get('volume', 0)
            }
            for symbol, data in cached_data.items()
        ]
    
    # Sort by absolute change for most active stocks
    stocks_data.sort(key=lambda x: abs(x['change']), reverse=True)
    
    return jsonify({
        'trending_stocks': stocks_data[:12], 
        'last_updated': datetime.now().isoformat(),
        'status': 'success'
    })

@app.route('/api/market-sentiment')
def get_market_sentiment():
    """Get overall market sentiment"""
    try:
        # Analyze major indices
        indices = ['^GSPC', '^DJI', '^IXIC']  # S&P 500, Dow Jones, NASDAQ
        sentiment_data = []
        
        for index in indices:
            stock = yf.Ticker(index)
            hist = stock.history(period="5d")
            if len(hist) >= 2:
                current = hist['Close'].iloc[-1]
                prev = hist['Close'].iloc[-2]
                change = ((current - prev) / prev) * 100
                sentiment_data.append(change)
        
        overall_sentiment = np.mean(sentiment_data) if sentiment_data else 0
        sentiment_label = "BULLISH" if overall_sentiment > 0.5 else "BEARISH" if overall_sentiment < -0.5 else "NEUTRAL"
        
        return jsonify({
            'sentiment': sentiment_label,
            'sentiment_score': float(overall_sentiment),
            'market_indicators': {
                'sp500_change': float(sentiment_data[0]) if len(sentiment_data) > 0 else 0,
                'dow_change': float(sentiment_data[1]) if len(sentiment_data) > 1 else 0,
                'nasdaq_change': float(sentiment_data[2]) if len(sentiment_data) > 2 else 0
            },
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 400

@app.route('/api/bulk-analyze', methods=['POST'])
def bulk_analyze_stocks():
    """Analyze multiple stocks at once"""
    try:
        data = request.get_json()
        symbols = data.get('symbols', [])
        
        if not symbols or len(symbols) > 10:
            return jsonify({'error': 'Please provide 1-10 stock symbols', 'status': 'error'}), 400
        
        results = {}
        
        for symbol in symbols:
            try:
                stock = yf.Ticker(symbol.upper())
                info = stock.info
                hist = stock.history(period="1mo")
                
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
                    change_percent = ((current_price - prev_close) / prev_close) * 100
                    
                    # Basic analysis
                    results[symbol.upper()] = {
                        'current_price': float(current_price),
                        'change_percent': float(change_percent),
                        'company_name': info.get('longName', 'N/A'),
                        'market_cap': info.get('marketCap', 'N/A'),
                        'pe_ratio': info.get('trailingPE', 'N/A'),
                        'volume': float(hist['Volume'].iloc[-1]) if not hist['Volume'].empty else 0,
                        'status': 'success'
                    }
            except Exception as e:
                results[symbol.upper()] = {
                    'error': str(e),
                    'status': 'error'
                }
        
        return jsonify({
            'results': results,
            'total_analyzed': len([r for r in results.values() if r.get('status') == 'success']),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
