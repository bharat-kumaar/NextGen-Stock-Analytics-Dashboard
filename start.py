
#!/usr/bin/env python3
import os
import sys

# Ensure we're in the right directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Add paths
sys.path.insert(0, '.')
sys.path.insert(0, 'ultra_stock_prediction')

try:
    from ultra_stock_prediction.app import app
    print("✅ Flask app loaded successfully!")
    
    if __name__ == '__main__':
        print("🚀 Starting Ultra Stock Prediction AI on http://0.0.0.0:5000")
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("📦 Installing required packages...")
    
    import subprocess
    packages = ['flask', 'yfinance', 'pandas', 'scikit-learn', 'ta', 'numpy', 'gunicorn']
    
    for package in packages:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
            print(f"✅ Installed {package}")
        except:
            print(f"❌ Failed to install {package}")
    
    print("🔄 Retrying import...")
    try:
        from ultra_stock_prediction.app import app
        print("✅ Flask app loaded successfully after package installation!")
        
        if __name__ == '__main__':
            print("🚀 Starting Ultra Stock Prediction AI on http://0.0.0.0:5000")
            app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
    except Exception as e2:
        print(f"❌ Still failing: {e2}")
        sys.exit(1)

except Exception as e:
    print(f"❌ Unexpected error: {e}")
    sys.exit(1)
