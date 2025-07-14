
// Global variables and state
let state = {
    totalAnalyzed: 0,
    currentStock: null,
    selectedStocks: [],
    multiStockData: {},
    charts: {
        prediction: null,
        realtime: null,
        mini: null,
        comparison: null
    },
    realTimeInterval: null,
    isLoading: false,
    currentTab: 'overview',
    currentView: 'grid'
};

// Popular stock symbols for autocomplete
const popularStocks = [
    'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'AMD', 
    'NFLX', 'SPOT', 'UBER', 'SNAP', 'TWTR', 'COIN', 'RBLX', 'PYPL',
    'SHOP', 'SQ', 'ROKU', 'ZM', 'DOCU', 'PTON', 'ABNB', 'DKNG'
];

// DOM Elements
const elements = {
    stockInput: document.getElementById('stockInput'),
    searchBtn: document.getElementById('searchBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    stockResult: document.getElementById('stockResult'),
    predictionResult: document.getElementById('predictionResult'),
    trendingList: document.getElementById('trendingList'),
    toastContainer: document.getElementById('toastContainer'),
    searchSuggestions: document.getElementById('searchSuggestions'),
    progressBar: document.getElementById('progressBar'),
    loadingText: document.getElementById('loadingText')
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    initializeParticles();
    startRealTimeUpdates();
    updateMarketSentiment();
});

function initializeApp() {
    // Load initial data
    loadTrendingStocks();
    updateStats();
    
    // Set initial status
    updateConnectionStatus(true);
    
    // Initialize charts
    Chart.defaults.color = '#cbd5e1';
    Chart.defaults.borderColor = '#334155';
    Chart.defaults.backgroundColor = 'rgba(99, 102, 241, 0.1)';
}

function setupEventListeners() {
    // Search functionality
    elements.searchBtn.addEventListener('click', handleStockSearch);
    elements.stockInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleStockSearch();
        }
    });
    
    // Search suggestions
    elements.stockInput.addEventListener('input', handleSearchInput);
    elements.stockInput.addEventListener('focus', showSuggestions);
    document.addEventListener('click', hideSuggestions);
    
    // Multi-stock selection
    setupMultiStockSelection();
    
    // Navigation
    setupNavigation();
    
    // Tab switching
    setupTabSwitching();
    
    // Filter buttons
    setupFilterButtons();
    
    // Comparison view switching
    setupComparisonViews();
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function initializeParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: '#6366f1' },
                shape: { type: 'circle' },
                opacity: { value: 0.5, random: false },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#6366f1',
                    opacity: 0.4,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 6,
                    direction: 'none',
                    random: false,
                    straight: false,
                    out_mode: 'out',
                    bounce: false
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: { enable: true, mode: 'repulse' },
                    onclick: { enable: true, mode: 'push' },
                    resize: true
                }
            },
            retina_detect: true
        });
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Smooth scroll to section
            const target = this.getAttribute('href');
            if (target.startsWith('#')) {
                const element = document.querySelector(target);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

function setupTabSwitching() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    state.currentTab = tabId;
    
    // Update button states
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    
    // Load specific tab data
    if (tabId === 'realtime' && state.currentStock) {
        loadRealTimeData(state.currentStock.symbol);
    }
}

function setupFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            filterTrendingStocks(filter);
        });
    });
}

function setupMultiStockSelection() {
    // Stock tag selection
    document.querySelectorAll('.stock-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            const symbol = this.getAttribute('data-symbol');
            toggleStockSelection(symbol, this);
        });
    });
    
    // Clear all button
    const clearBtn = document.getElementById('clearSelected');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllSelected);
    }
    
    // Analyze multiple button
    const analyzeBtn = document.getElementById('analyzeMultipleBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeMultipleStocks);
    }
}

function setupComparisonViews() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const view = this.getAttribute('data-view');
            switchComparisonView(view);
        });
    });
}

function toggleStockSelection(symbol, element) {
    const index = state.selectedStocks.indexOf(symbol);
    
    if (index > -1) {
        // Remove from selection
        state.selectedStocks.splice(index, 1);
        element.classList.remove('selected');
    } else {
        // Add to selection (max 8 stocks)
        if (state.selectedStocks.length < 8) {
            state.selectedStocks.push(symbol);
            element.classList.add('selected');
        } else {
            showToast('Maximum 8 stocks can be selected at once', 'warning');
            return;
        }
    }
    
    updateSelectedDisplay();
    updateAnalyzeButton();
}

function updateSelectedDisplay() {
    const selectedList = document.getElementById('selectedList');
    if (!selectedList) return;
    
    selectedList.innerHTML = '';
    
    state.selectedStocks.forEach(symbol => {
        const stockElement = document.createElement('div');
        stockElement.className = 'selected-stock';
        stockElement.innerHTML = `
            <span>${symbol}</span>
            <i class="fas fa-times remove-stock" onclick="removeStock('${symbol}')"></i>
        `;
        selectedList.appendChild(stockElement);
    });
}

function removeStock(symbol) {
    const index = state.selectedStocks.indexOf(symbol);
    if (index > -1) {
        state.selectedStocks.splice(index, 1);
        
        // Update UI
        const tag = document.querySelector(`[data-symbol="${symbol}"]`);
        if (tag) tag.classList.remove('selected');
        
        updateSelectedDisplay();
        updateAnalyzeButton();
    }
}

function clearAllSelected() {
    state.selectedStocks = [];
    document.querySelectorAll('.stock-tag').forEach(tag => {
        tag.classList.remove('selected');
    });
    updateSelectedDisplay();
    updateAnalyzeButton();
}

function updateAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyzeMultipleBtn');
    if (!analyzeBtn) return;
    
    analyzeBtn.disabled = state.selectedStocks.length === 0;
    analyzeBtn.textContent = state.selectedStocks.length > 0 
        ? `Analyze ${state.selectedStocks.length} Stocks` 
        : 'Select Stocks to Analyze';
}

async function analyzeMultipleStocks() {
    if (state.selectedStocks.length === 0) {
        showToast('Please select at least one stock', 'warning');
        return;
    }
    
    showAdvancedLoading(true);
    state.multiStockData = {};
    
    try {
        elements.loadingText.textContent = 'Analyzing multiple stocks...';
        
        // Fetch data for all selected stocks
        const promises = state.selectedStocks.map(async (symbol, index) => {
            elements.loadingText.textContent = `Analyzing ${symbol}... (${index + 1}/${state.selectedStocks.length})`;
            elements.progressBar.style.width = `${((index + 1) / state.selectedStocks.length) * 100}%`;
            
            const [stockData, predictionData] = await Promise.all([
                fetch(`/api/stock/${symbol}`).then(r => r.json()),
                fetch(`/api/predict/${symbol}`).then(r => r.json())
            ]);
            
            return {
                symbol,
                stock: stockData,
                prediction: predictionData
            };
        });
        
        const results = await Promise.all(promises);
        
        // Process results
        results.forEach(result => {
            if (result.stock.status === 'success' && result.prediction.status === 'success') {
                state.multiStockData[result.symbol] = {
                    stock: result.stock,
                    prediction: result.prediction
                };
            }
        });
        
        displayMultiStockComparison();
        showToast(`✨ Successfully analyzed ${Object.keys(state.multiStockData).length} stocks`, 'success');
        
    } catch (error) {
        console.error('Multi-stock analysis error:', error);
        showToast('❌ Failed to analyze stocks', 'error');
    } finally {
        showAdvancedLoading(false);
    }
}

function displayMultiStockComparison() {
    const multiStockResult = document.getElementById('multiStockResult');
    if (!multiStockResult) return;
    
    multiStockResult.classList.remove('hidden');
    
    // Display based on current view
    switchComparisonView(state.currentView);
    
    // Scroll to results
    multiStockResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function switchComparisonView(view) {
    state.currentView = view;
    
    // Update content visibility
    document.querySelectorAll('.comparison-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${view}View`).classList.add('active');
    
    // Render based on view
    switch (view) {
        case 'grid':
            renderGridView();
            break;
        case 'chart':
            renderChartView();
            break;
        case 'table':
            renderTableView();
            break;
    }
}

function renderGridView() {
    const stocksGrid = document.getElementById('stocksGrid');
    if (!stocksGrid) return;
    
    stocksGrid.innerHTML = '';
    
    Object.entries(state.multiStockData).forEach(([symbol, data]) => {
        const card = document.createElement('div');
        card.className = 'stock-comparison-card';
        
        const changePercent = data.stock.change_percent || 0;
        const trend = data.prediction.trend || 'NEUTRAL';
        const trendClass = trend.toLowerCase();
        
        card.innerHTML = `
            <div class="stock-header">
                <div class="stock-symbol">${symbol}</div>
                <div class="stock-price">$${formatPrice(data.stock.current_price)}</div>
            </div>
            
            <div class="stock-metrics">
                <div class="metric">
                    <div class="metric-label">Change</div>
                    <div class="metric-value ${changePercent >= 0 ? 'positive' : 'negative'}">
                        ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
                    </div>
                </div>
                <div class="metric">
                    <div class="metric-label">P/E Ratio</div>
                    <div class="metric-value">${formatNumber(data.stock.pe_ratio)}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">Market Cap</div>
                    <div class="metric-value">${formatLargeNumber(data.stock.market_cap)}</div>
                </div>
                <div class="metric">
                    <div class="metric-label">AI Confidence</div>
                    <div class="metric-value">${data.prediction.confidence}</div>
                </div>
            </div>
            
            <div class="stock-trend ${trendClass}">
                <i class="fas ${trend === 'BULLISH' ? 'fa-arrow-up' : trend === 'BEARISH' ? 'fa-arrow-down' : 'fa-minus'}"></i>
                <span>${trend}</span>
            </div>
        `;
        
        card.addEventListener('click', () => {
            elements.stockInput.value = symbol;
            handleStockSearch();
        });
        
        stocksGrid.appendChild(card);
    });
}

function renderChartView() {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (state.charts.comparison) {
        state.charts.comparison.destroy();
    }
    
    const symbols = Object.keys(state.multiStockData);
    const prices = symbols.map(symbol => state.multiStockData[symbol].stock.current_price);
    const changes = symbols.map(symbol => state.multiStockData[symbol].stock.change_percent || 0);
    
    state.charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: symbols,
            datasets: [{
                label: 'Current Price ($)',
                data: prices,
                backgroundColor: symbols.map(symbol => {
                    const change = state.multiStockData[symbol].stock.change_percent || 0;
                    return change >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)';
                }),
                borderColor: symbols.map(symbol => {
                    const change = state.multiStockData[symbol].stock.change_percent || 0;
                    return change >= 0 ? '#22c55e' : '#ef4444';
                }),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#cbd5e1' }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 33, 57, 0.95)',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        afterLabel: function(context) {
                            const symbol = context.label;
                            const change = state.multiStockData[symbol].stock.change_percent || 0;
                            return `Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1' }
                },
                y: {
                    grid: { color: '#334155' },
                    ticks: { 
                        color: '#cbd5e1',
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

function renderTableView() {
    const tableBody = document.getElementById('comparisonTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    Object.entries(state.multiStockData).forEach(([symbol, data]) => {
        const row = document.createElement('tr');
        
        const changePercent = data.stock.change_percent || 0;
        const trend = data.prediction.trend || 'NEUTRAL';
        const riskLevel = data.prediction.risk_level || 'MEDIUM';
        
        row.innerHTML = `
            <td><strong>${symbol}</strong></td>
            <td>$${formatPrice(data.stock.current_price)}</td>
            <td class="${changePercent >= 0 ? 'positive' : 'negative'}">
                ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
            </td>
            <td>${formatLargeNumber(data.stock.market_cap)}</td>
            <td>${formatNumber(data.stock.pe_ratio)}</td>
            <td>
                <span class="table-trend ${trend.toLowerCase()}">
                    ${trend}
                </span>
            </td>
            <td>
                <span class="table-trend ${riskLevel.toLowerCase()}">
                    ${riskLevel}
                </span>
            </td>
            <td>
                <button class="table-action-btn" onclick="analyzeStock('${symbol}')">
                    Analyze
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function analyzeStock(symbol) {
    elements.stockInput.value = symbol;
    handleStockSearch();
}

// Make functions globally accessible
window.removeStock = removeStock;
window.analyzeStock = analyzeStock;

// Search functionality
function handleSearchInput(e) {
    const value = e.target.value.toUpperCase();
    if (value.length > 0) {
        const suggestions = popularStocks.filter(stock => 
            stock.startsWith(value)
        ).slice(0, 5);
        
        displaySuggestions(suggestions);
    } else {
        hideSuggestions();
    }
}

function displaySuggestions(suggestions) {
    const container = elements.searchSuggestions;
    container.innerHTML = '';
    
    if (suggestions.length > 0) {
        suggestions.forEach(symbol => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = symbol;
            item.addEventListener('click', () => {
                elements.stockInput.value = symbol;
                hideSuggestions();
                handleStockSearch();
            });
            container.appendChild(item);
        });
        container.style.display = 'block';
    }
}

function showSuggestions() {
    if (elements.stockInput.value.length > 0) {
        handleSearchInput({ target: elements.stockInput });
    }
}

function hideSuggestions(e) {
    if (!e || !elements.searchSuggestions.contains(e.target)) {
        elements.searchSuggestions.style.display = 'none';
    }
}

// Enhanced stock search with advanced loading
async function handleStockSearch() {
    const symbol = elements.stockInput.value.trim().toUpperCase();
    
    if (!symbol) {
        showToast('Please enter a stock symbol', 'error');
        return;
    }
    
    if (!/^[A-Z]{1,5}$/.test(symbol)) {
        showToast('Please enter a valid stock symbol (1-5 letters)', 'error');
        return;
    }
    
    showAdvancedLoading(true);
    
    try {
        // Simulate AI analysis steps
        const analysisSteps = [
            'Connecting to market data streams...',
            'Gathering historical price data...',
            'Computing technical indicators...',
            'Training neural network models...',
            'Analyzing market sentiment...',
            'Generating predictions...',
            'Finalizing AI analysis...'
        ];
        
        // Fetch data with progress simulation
        const [stockData, predictionData] = await Promise.all([
            fetchWithProgress('/api/stock/' + symbol, analysisSteps),
            fetchWithProgress('/api/predict/' + symbol, analysisSteps)
        ]);
        
        if (stockData.status === 'success' && predictionData.status === 'success') {
            displayAdvancedStockData(stockData);
            displayAdvancedPredictionData(predictionData);
            
            state.totalAnalyzed++;
            updateStats();
            
            showToast(`✨ AI analysis complete for ${symbol}`, 'success');
            
            // Auto-switch to real-time tab after 2 seconds
            setTimeout(() => {
                if (state.currentTab === 'overview') {
                    switchTab('realtime');
                }
            }, 2000);
            
        } else {
            throw new Error(stockData.error || predictionData.error || 'Analysis failed');
        }
    } catch (error) {
        console.error('Search error:', error);
        showToast('❌ ' + (error.message || 'Failed to analyze stock'), 'error');
        hideResults();
    } finally {
        showAdvancedLoading(false);
    }
}

async function fetchWithProgress(url, steps) {
    // Show progress steps
    for (let i = 0; i < steps.length; i++) {
        elements.loadingText.textContent = steps[i];
        elements.progressBar.style.width = `${(i + 1) / steps.length * 100}%`;
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const response = await fetch(url);
    return await response.json();
}

function showAdvancedLoading(show) {
    state.isLoading = show;
    elements.loadingOverlay.classList.toggle('hidden', !show);
    
    if (show) {
        elements.progressBar.style.width = '0%';
        elements.loadingText.textContent = 'Initializing AI analysis...';
    }
}

// Advanced stock data display
function displayAdvancedStockData(data) {
    state.currentStock = data;
    
    // Update basic info
    document.getElementById('stockSymbol').textContent = data.symbol;
    document.getElementById('stockName').textContent = data.company_name;
    document.getElementById('currentPrice').textContent = formatPrice(data.current_price);
    
    // Update price change
    const changePercent = data.change_percent || 0;
    const priceChange = document.getElementById('priceChange');
    const changeClass = changePercent >= 0 ? 'positive' : 'negative';
    const changeIcon = changePercent >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    priceChange.className = `price-change ${changeClass}`;
    priceChange.innerHTML = `
        <i class="fas ${changeIcon}"></i>
        <span>${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%</span>
    `;
    
    // Update metrics
    document.getElementById('marketCap').textContent = formatLargeNumber(data.market_cap);
    document.getElementById('peRatio').textContent = formatNumber(data.pe_ratio);
    document.getElementById('beta').textContent = formatNumber(data.beta);
    document.getElementById('dividendYield').textContent = formatPercent(data.dividend_yield);
    document.getElementById('high52w').textContent = formatPrice(data.high_52w);
    document.getElementById('low52w').textContent = formatPrice(data.low_52w);
    
    // Update volatility meter
    const volatility = data.volatility || 20;
    const volatilityFill = document.getElementById('volatilityFill');
    const volatilityValue = document.getElementById('volatilityValue');
    
    if (volatilityFill && volatilityValue) {
        volatilityFill.style.width = `${Math.min(volatility, 100)}%`;
        volatilityValue.textContent = `${volatility.toFixed(1)}%`;
        
        // Color based on volatility level
        if (volatility > 30) {
            volatilityFill.style.background = 'var(--danger)';
        } else if (volatility > 15) {
            volatilityFill.style.background = 'var(--warning)';
        } else {
            volatilityFill.style.background = 'var(--success)';
        }
    }
    
    // Update badges
    const marketCapValue = data.market_cap;
    let capBadge = 'Small Cap';
    if (marketCapValue > 200000000000) capBadge = 'Large Cap';
    else if (marketCapValue > 10000000000) capBadge = 'Mid Cap';
    
    document.getElementById('marketCapBadge').textContent = capBadge;
    
    // Create mini chart
    createMiniChart(data);
    
    // Show result
    elements.stockResult.classList.remove('hidden');
    elements.stockResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function displayAdvancedPredictionData(data) {
    // Update trend information
    const trendIcon = document.getElementById('trendIcon');
    const trendDirection = document.getElementById('trendDirection');
    const trendStrength = document.getElementById('trendStrength');
    
    trendDirection.textContent = data.trend;
    trendStrength.textContent = data.trend_strength > 5 ? 'Strong' : 'Moderate';
    
    // Update trend icon and styling
    const trendCard = trendIcon.closest('.trend-card');
    if (data.trend === 'BULLISH') {
        trendIcon.className = 'trend-icon';
        trendIcon.innerHTML = '<i class="fas fa-arrow-up"></i>';
        trendCard.style.borderColor = 'var(--success)';
    } else {
        trendIcon.className = 'trend-icon bearish';
        trendIcon.innerHTML = '<i class="fas fa-arrow-down"></i>';
        trendCard.style.borderColor = 'var(--danger)';
    }
    
    // Update confidence
    document.getElementById('confidenceText').textContent = data.confidence;
    
    // Update target price
    document.getElementById('targetPrice').textContent = formatPrice(data.target_price);
    
    const targetChange = ((data.target_price - data.current_price) / data.current_price) * 100;
    const targetChangeEl = document.getElementById('targetChange');
    targetChangeEl.textContent = `${targetChange >= 0 ? '+' : ''}${targetChange.toFixed(1)}%`;
    targetChangeEl.className = `target-change ${targetChange >= 0 ? 'positive' : 'negative'}`;
    
    // Update risk indicator
    const riskIndicator = document.getElementById('riskIndicator');
    if (riskIndicator) {
        riskIndicator.innerHTML = `<span class="risk-label">${data.risk_level}</span>`;
        
        const riskColors = {
            'LOW': 'var(--success)',
            'MEDIUM': 'var(--warning)',
            'HIGH': 'var(--danger)'
        };
        riskIndicator.style.color = riskColors[data.risk_level] || 'var(--warning)';
    }
    
    // Display AI signals
    displayAISignals(data.signals || []);
    
    // Create prediction chart
    createAdvancedPredictionChart(data);
    
    // Show result
    elements.predictionResult.classList.remove('hidden');
    elements.predictionResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function displayAISignals(signals) {
    const container = document.getElementById('signalsContainer');
    container.innerHTML = '';
    
    signals.forEach(signal => {
        const signalCard = document.createElement('div');
        signalCard.className = 'signal-card';
        
        const iconClass = signal.type.toLowerCase();
        const iconMap = {
            'buy': 'fa-arrow-up',
            'sell': 'fa-arrow-down',
            'hold': 'fa-minus'
        };
        
        signalCard.innerHTML = `
            <div class="signal-icon ${iconClass}">
                <i class="fas ${iconMap[iconClass] || 'fa-minus'}"></i>
            </div>
            <div class="signal-content">
                <h5>${signal.type} Signal - ${signal.strength}</h5>
                <p>${signal.reason}</p>
            </div>
        `;
        
        container.appendChild(signalCard);
        
        // Animate signal cards
        setTimeout(() => {
            signalCard.style.animation = 'slideInLeft 0.5s ease';
        }, 100);
    });
}

// Advanced chart creation
function createMiniChart(data) {
    const canvas = document.getElementById('miniChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (state.charts.mini) {
        state.charts.mini.destroy();
    }
    
    // Create simple price trend chart
    const mockData = Array.from({length: 20}, (_, i) => {
        const variation = (Math.random() - 0.5) * 10;
        return data.current_price + variation;
    });
    
    state.charts.mini = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 20}, (_, i) => ''),
            datasets: [{
                data: mockData,
                borderColor: 'rgba(99, 102, 241, 1)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}

function createAdvancedPredictionChart(data) {
    const canvas = document.getElementById('predictionChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (state.charts.prediction) {
        state.charts.prediction.destroy();
    }
    
    const currentPrice = data.current_price;
    const predictions = data.predictions;
    const labels = ['Today', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    const allPrices = [currentPrice, ...predictions];
    
    state.charts.prediction = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Predicted Price',
                data: allPrices,
                borderColor: data.trend === 'BULLISH' ? '#10b981' : '#ef4444',
                backgroundColor: data.trend === 'BULLISH' ? 
                    'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: data.trend === 'BULLISH' ? '#10b981' : '#ef4444',
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#cbd5e1' }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 33, 57, 0.95)',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1',
                    borderColor: '#334155',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1' }
                },
                y: {
                    grid: { color: '#334155' },
                    ticks: { 
                        color: '#cbd5e1',
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Real-time functionality
function startRealTimeUpdates() {
    // Update trending stocks every 30 seconds
    setInterval(loadTrendingStocks, 30000);
    
    // Update market sentiment every minute
    setInterval(updateMarketSentiment, 60000);
    
    // Update connection status
    setInterval(() => updateConnectionStatus(true), 5000);
}

async function loadRealTimeData(symbol) {
    try {
        const response = await fetch(`/api/realtime/${symbol}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            createRealTimeChart(data);
        }
    } catch (error) {
        console.error('Real-time data error:', error);
    }
}

function createRealTimeChart(data) {
    const canvas = document.getElementById('realtimeChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (state.charts.realtime) {
        state.charts.realtime.destroy();
    }
    
    state.charts.realtime = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.timestamps,
            datasets: [{
                label: 'Real-time Price',
                data: data.prices,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 750 },
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: '#334155' },
                    ticks: { color: '#cbd5e1', maxTicksLimit: 10 }
                },
                y: {
                    grid: { color: '#334155' },
                    ticks: { 
                        color: '#cbd5e1',
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

async function updateMarketSentiment() {
    try {
        const response = await fetch('/api/market-sentiment');
        const data = await response.json();
        
        if (data.status === 'success') {
            const sentimentEl = document.getElementById('marketSentiment');
            if (sentimentEl) {
                sentimentEl.textContent = data.sentiment;
                
                const colors = {
                    'BULLISH': '#10b981',
                    'BEARISH': '#ef4444',
                    'NEUTRAL': '#f59e0b'
                };
                sentimentEl.style.color = colors[data.sentiment] || '#f59e0b';
            }
        }
    } catch (error) {
        console.error('Market sentiment error:', error);
    }
}

// Trending stocks functionality
async function loadTrendingStocks() {
    try {
        const response = await fetch('/api/trending');
        const data = await response.json();
        
        if (data.status === 'success') {
            displayTrendingStocks(data.trending_stocks);
            updateLastUpdate();
        }
    } catch (error) {
        console.error('Failed to load trending stocks:', error);
        updateConnectionStatus(false);
    }
}

function displayTrendingStocks(stocks) {
    if (!elements.trendingList) return;
    
    elements.trendingList.innerHTML = '';
    
    stocks.forEach((stock, index) => {
        const item = document.createElement('div');
        item.className = 'trending-item';
        item.style.animationDelay = `${index * 0.1}s`;
        
        item.onclick = () => {
            elements.stockInput.value = stock.symbol;
            handleStockSearch();
        };
        
        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        const changeSymbol = stock.change >= 0 ? '+' : '';
        const changeIcon = stock.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        
        item.innerHTML = `
            <div class="symbol">${stock.symbol}</div>
            <div class="price">$${stock.price}</div>
            <div class="change ${changeClass}">
                <i class="fas ${changeIcon}"></i>
                ${changeSymbol}${stock.change.toFixed(2)}%
            </div>
            <div class="volume">Vol: ${formatLargeNumber(stock.volume || 0)}</div>
        `;
        
        elements.trendingList.appendChild(item);
    });
}

function filterTrendingStocks(filter) {
    const items = elements.trendingList.querySelectorAll('.trending-item');
    
    items.forEach(item => {
        const changeEl = item.querySelector('.change');
        const isPositive = changeEl.classList.contains('positive');
        const isNegative = changeEl.classList.contains('negative');
        
        let show = true;
        
        switch (filter) {
            case 'gainers':
                show = isPositive;
                break;
            case 'losers':
                show = isNegative;
                break;
            case 'volume':
                // Show all for now, could implement volume filtering
                show = true;
                break;
            default:
                show = true;
        }
        
        item.style.display = show ? 'block' : 'none';
    });
}

// Utility functions
function updateStats() {
    const elements = {
        totalAnalyzed: document.getElementById('totalAnalyzed'),
        accuracyRate: document.getElementById('accuracyRate'),
        modelPerformance: document.getElementById('modelPerformance'),
        dataPoints: document.getElementById('dataPoints')
    };
    
    if (elements.totalAnalyzed) {
        elements.totalAnalyzed.textContent = state.totalAnalyzed.toLocaleString();
    }
    
    // Simulate real-time updates
    if (elements.dataPoints) {
        const currentValue = parseFloat(elements.dataPoints.textContent.replace('M', '')) || 2.4;
        elements.dataPoints.textContent = (currentValue + Math.random() * 0.1).toFixed(1) + 'M';
    }
}

function updateLastUpdate() {
    const lastUpdateEl = document.getElementById('lastUpdate');
    if (lastUpdateEl) {
        lastUpdateEl.textContent = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function updateConnectionStatus(isConnected) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (statusDot && statusText) {
        if (isConnected) {
            statusDot.style.background = '#10b981';
            statusText.textContent = 'Live';
        } else {
            statusDot.style.background = '#ef4444';
            statusText.textContent = 'Offline';
        }
    }
}

function hideResults() {
    elements.stockResult?.classList.add('hidden');
    elements.predictionResult?.classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

function toggleTheme() {
    // This could implement light/dark theme switching
    console.log('Theme toggle clicked');
}

// Formatting utilities
function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) return 'N/A';
    return price.toFixed(2);
}

function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    return num.toFixed(2);
}

function formatPercent(num) {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    return (num * 100).toFixed(2) + '%';
}

function formatLargeNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    
    if (num >= 1e12) {
        return (num / 1e12).toFixed(1) + 'T';
    } else if (num >= 1e9) {
        return (num / 1e9).toFixed(1) + 'B';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(1) + 'M';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(1) + 'K';
    }
    
    return num.toString();
}

// CSS for additional styles (add to existing CSS)
const additionalCSS = `
.suggestion-item {
    padding: 0.75rem 1rem;
    cursor: pointer;
    border-bottom: 1px solid var(--border);
    transition: var(--transition);
}

.suggestion-item:hover {
    background: var(--bg-tertiary);
}

.suggestion-item:last-child {
    border-bottom: none;
}

.volume {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
}

@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(-30px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}
`;

// Add additional CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalCSS;
document.head.appendChild(styleSheet);
