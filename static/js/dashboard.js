// Initialize Socket.IO connection
const socket = io();

// Store monitoring data
let currentData = null;
let alertCount = 0;

// Socket.IO event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    updateConnectionStatus(true);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateConnectionStatus(false);
});

socket.on('monitoring_update', (data) => {
    console.log('Received monitoring update:', data);
    currentData = data;
    updateDashboard(data);
});

// Update connection status indicator
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    if (connected) {
        statusEl.textContent = '● Connected';
        statusEl.style.color = '#10b981';
    } else {
        statusEl.textContent = '● Disconnected';
        statusEl.style.color = '#ef4444';
    }
}

// Update the entire dashboard
function updateDashboard(data) {
    updateLastUpdateTime(data.timestamp);
    updateStatsOverview(data);
    updateServersGrid(data.servers);
    updateAlerts(data.alerts);
}

// Update last update timestamp
function updateLastUpdateTime(timestamp) {
    document.getElementById('last-update').textContent = `Last Update: ${timestamp}`;
}

// Update stats overview cards
function updateStatsOverview(data) {
    const servers = data.servers;

    // Calculate averages
    let totalCpu = 0;
    let totalMemory = 0;

    servers.forEach(server => {
        totalCpu += server.metrics.cpu_usage;
        totalMemory += server.metrics.memory_usage;
    });

    const avgCpu = (totalCpu / servers.length).toFixed(1);
    const avgMemory = (totalMemory / servers.length).toFixed(1);

    document.getElementById('avg-cpu').textContent = `${avgCpu}%`;
    document.getElementById('avg-memory').textContent = `${avgMemory}%`;

    // Update alert count
    const newAlertCount = data.alerts.length;
    document.getElementById('active-alerts').textContent = newAlertCount;

    const alertStatusEl = document.getElementById('alert-status');
    if (newAlertCount > 0) {
        alertStatusEl.textContent = `${newAlertCount} Active`;
        alertStatusEl.style.color = '#ef4444';

        // Show alert banner for new alerts
        if (newAlertCount > alertCount) {
            showAlertBanner(data.alerts[0]);
        }
    } else {
        alertStatusEl.textContent = 'No Issues';
        alertStatusEl.style.color = '#10b981';
    }

    alertCount = newAlertCount;
}

// Update servers grid
function updateServersGrid(servers) {
    const grid = document.getElementById('servers-grid');
    grid.innerHTML = '';

    servers.forEach(server => {
        const card = createServerCard(server);
        grid.appendChild(card);
    });
}

// Create server card element
function createServerCard(server) {
    const card = document.createElement('div');
    card.className = 'server-card';

    const metrics = server.metrics;
    const hasAlert = Object.entries(metrics).some(([key, value]) => {
        const thresholds = {
            cpu_usage: 80,
            memory_usage: 85,
            disk_usage: 90,
            network_traffic: 75
        };
        return value > thresholds[key];
    });

    if (hasAlert) {
        card.classList.add('alert');
    }

    card.innerHTML = `
        <div class="server-header">
            <h3>${server.name}</h3>
            <span class="status-badge ${server.status}">${server.status}</span>
        </div>
        <div class="metrics">
            ${createMetricBar('CPU', metrics.cpu_usage, 80)}
            ${createMetricBar('Memory', metrics.memory_usage, 85)}
            ${createMetricBar('Disk', metrics.disk_usage, 90)}
            ${createMetricBar('Network', metrics.network_traffic, 75)}
        </div>
    `;

    return card;
}

// Create metric progress bar
function createMetricBar(label, value, threshold) {
    const isAlert = value > threshold;
    const color = isAlert ? '#ef4444' : value > threshold - 10 ? '#f59e0b' : '#10b981';

    return `
        <div class="metric">
            <div class="metric-label">
                <span>${label}</span>
                <span class="metric-value ${isAlert ? 'alert' : ''}">${value.toFixed(1)}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${value}%; background-color: ${color};"></div>
            </div>
        </div>
    `;
}

// Update alerts section
function updateAlerts(alerts) {
    const container = document.getElementById('alerts-container');

    // Fetch all historical alerts
    fetch('/api/alerts')
        .then(response => response.json())
        .then(allAlerts => {
            if (allAlerts.length === 0) {
                container.innerHTML = '<p class="no-alerts">No alerts to display</p>';
                return;
            }

            container.innerHTML = '';
            allAlerts.slice(0, 10).forEach(alert => {
                const alertEl = createAlertElement(alert);
                container.appendChild(alertEl);
            });
        });
}

// Create alert element
function createAlertElement(alert) {
    const div = document.createElement('div');
    div.className = `alert-item ${alert.severity}`;

    const icon = alert.severity === 'critical' ? '🔴' : '⚠️';

    div.innerHTML = `
        <div class="alert-icon">${icon}</div>
        <div class="alert-content">
            <div class="alert-title">
                <strong>${alert.server}</strong> - ${alert.metric.replace('_', ' ').toUpperCase()}
            </div>
            <div class="alert-details">
                Value: ${alert.value.toFixed(1)}% (Threshold: ${alert.threshold}%)
            </div>
            <div class="alert-time">${alert.timestamp}</div>
        </div>
    `;

    return div;
}

// Show alert banner
function showAlertBanner(alert) {
    const banner = document.getElementById('alert-banner');
    const message = document.getElementById('alert-message');

    message.textContent = `⚠️ Alert: ${alert.server} - ${alert.metric.replace('_', ' ')} at ${alert.value.toFixed(1)}%`;
    banner.classList.remove('hidden');

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        dismissAlert();
    }, 5000);
}

// Dismiss alert banner
function dismissAlert() {
    const banner = document.getElementById('alert-banner');
    banner.classList.add('hidden');
}

// Load initial data
fetch('/api/current-data')
    .then(response => response.json())
    .then(data => {
        currentData = data;
        updateDashboard(data);
    })
    .catch(error => {
        console.error('Error loading initial data:', error);
    });
