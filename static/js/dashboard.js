// ===================================
// Ivanti-Style ITOM Dashboard JavaScript
// ===================================

// Initialize Socket.IO connection
const socket = io();

// Store monitoring data
let currentData = null;
let alertCount = 0;
let statusChart = null;

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

// ===================================
// Connection Status
// ===================================

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connection-status');
    const dotEl = document.getElementById('connection-dot');
    const badgeEl = statusEl.parentElement;

    if (connected) {
        statusEl.textContent = 'Connected';
        dotEl.style.background = '#00A651';
        badgeEl.style.background = '#E8F5E9';
        badgeEl.style.color = '#00A651';
    } else {
        statusEl.textContent = 'Disconnected';
        dotEl.style.background = '#E53935';
        badgeEl.style.background = '#FFEBEE';
        badgeEl.style.color = '#E53935';
    }
}

// ===================================
// Main Dashboard Update
// ===================================

function updateDashboard(data) {
    updateLastUpdateTime(data.timestamp);
    updateMetricTiles(data);
    updateResourceUtilization(data);
    updateStatusChart(data);
    updateAssetGrid(data.servers);
    updateAlertsList(data.alerts);
    updateActivityFeed(data);
    setupClickHandlers();
}

// ===================================
// Setup Click Handlers
// ===================================

function setupClickHandlers() {
    // Make the Critical Alerts tile clickable
    const alertsTile = document.getElementById('active-alerts');
    if (alertsTile && alertsTile.parentElement && alertsTile.parentElement.parentElement) {
        const tile = alertsTile.parentElement.parentElement;
        tile.style.cursor = 'pointer';
        tile.onclick = () => {
            window.location.href = '/events';
        };
    }
}

// ===================================
// Last Update Time
// ===================================

function updateLastUpdateTime(timestamp) {
    const updateEl = document.getElementById('last-update');
    updateEl.textContent = `Updated: ${timestamp}`;
}

// ===================================
// Metric Tiles (KPIs)
// ===================================

function updateMetricTiles(data) {
    const servers = data.servers;

    // Total Assets
    document.getElementById('total-servers').textContent = servers.length;

    // Critical Alerts
    const criticalAlerts = data.alerts.filter(a => a.severity === 'critical').length;
    document.getElementById('active-alerts').textContent = criticalAlerts;

    const alertStatusEl = document.getElementById('alert-status');
    const alertTrendEl = document.getElementById('alert-trend');
    if (criticalAlerts > 0) {
        alertStatusEl.textContent = `${criticalAlerts} Issues`;
        alertTrendEl.className = 'tile-trend negative';

        // Show alert banner for new alerts
        if (criticalAlerts > alertCount) {
            showAlertBanner(data.alerts[0]);
        }
    } else {
        alertStatusEl.textContent = 'No Issues';
        alertTrendEl.className = 'tile-trend positive';
    }
    alertCount = criticalAlerts;

    // System Health Score
    const healthScore = calculateHealthScore(servers);
    document.getElementById('health-score').textContent = `${healthScore}%`;

    // Average Response Time (simulated)
    const avgResponseTime = Math.floor(Math.random() * 30) + 30;
    document.getElementById('response-time').textContent = `${avgResponseTime}ms`;
}

function calculateHealthScore(servers) {
    if (servers.length === 0) return 100;

    let totalScore = 0;
    servers.forEach(server => {
        const metrics = server.metrics;
        let serverScore = 100;

        // Deduct points for high utilization
        if (metrics.cpu_usage > 80) serverScore -= 20;
        else if (metrics.cpu_usage > 70) serverScore -= 10;

        if (metrics.memory_usage > 85) serverScore -= 20;
        else if (metrics.memory_usage > 75) serverScore -= 10;

        if (metrics.disk_usage > 90) serverScore -= 20;
        else if (metrics.disk_usage > 80) serverScore -= 10;

        totalScore += Math.max(serverScore, 0);
    });

    return Math.round(totalScore / servers.length);
}

// ===================================
// Resource Utilization
// ===================================

function updateResourceUtilization(data) {
    const servers = data.servers;

    if (servers.length === 0) return;

    // Calculate averages
    let totalCpu = 0, totalMemory = 0, totalDisk = 0, totalNetwork = 0;

    servers.forEach(server => {
        totalCpu += server.metrics.cpu_usage;
        totalMemory += server.metrics.memory_usage;
        totalDisk += server.metrics.disk_usage;
        totalNetwork += server.metrics.network_traffic;
    });

    const avgCpu = totalCpu / servers.length;
    const avgMemory = totalMemory / servers.length;
    const avgDisk = totalDisk / servers.length;
    const avgNetwork = totalNetwork / servers.length;

    // Update CPU
    updateResourceBar('cpu', avgCpu);
    document.getElementById('avg-cpu').textContent = `${avgCpu.toFixed(1)}%`;

    // Update Memory
    updateResourceBar('memory', avgMemory);
    document.getElementById('avg-memory').textContent = `${avgMemory.toFixed(1)}%`;

    // Update Disk
    updateResourceBar('disk', avgDisk);
    document.getElementById('avg-disk').textContent = `${avgDisk.toFixed(1)}%`;

    // Update Network
    updateResourceBar('network', avgNetwork);
    document.getElementById('avg-network').textContent = `${avgNetwork.toFixed(1)}%`;
}

function updateResourceBar(type, value) {
    const bar = document.getElementById(`${type}-bar`);
    bar.style.width = `${value}%`;

    // Color based on value
    if (value > 80) {
        bar.style.background = 'linear-gradient(90deg, #E53935, #C62828)';
    } else if (value > 70) {
        bar.style.background = 'linear-gradient(90deg, #FF9800, #F57C00)';
    } else {
        bar.style.background = 'linear-gradient(90deg, #0066CC, #00A9CE)';
    }
}

// ===================================
// Status Chart
// ===================================

function updateStatusChart(data) {
    const servers = data.servers;

    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    servers.forEach(server => {
        const metrics = server.metrics;
        const hasCritical = Object.entries(metrics).some(([key, value]) => {
            const criticalThresholds = {
                cpu_usage: 90,
                memory_usage: 90,
                disk_usage: 95,
                network_traffic: 85
            };
            return value > criticalThresholds[key];
        });

        const hasWarning = Object.entries(metrics).some(([key, value]) => {
            const warningThresholds = {
                cpu_usage: 70,
                memory_usage: 75,
                disk_usage: 80,
                network_traffic: 70
            };
            return value > warningThresholds[key];
        });

        if (hasCritical) {
            criticalCount++;
        } else if (hasWarning) {
            warningCount++;
        } else {
            healthyCount++;
        }
    });

    // Update legend counts
    document.getElementById('healthy-count').textContent = healthyCount;
    document.getElementById('warning-count').textContent = warningCount;
    document.getElementById('critical-count').textContent = criticalCount;

    // Create or update chart
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    if (statusChart) {
        statusChart.data.datasets[0].data = [healthyCount, warningCount, criticalCount];
        statusChart.update();
    } else {
        statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Healthy', 'Warning', 'Critical'],
                datasets: [{
                    data: [healthyCount, warningCount, criticalCount],
                    backgroundColor: ['#00A651', '#FF9800', '#E53935'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                cutout: '70%'
            }
        });
    }
}

// ===================================
// Asset Grid
// ===================================

function updateAssetGrid(servers) {
    const grid = document.getElementById('servers-grid');
    grid.innerHTML = '';

    servers.forEach(server => {
        const card = createAssetCard(server);
        grid.appendChild(card);
    });
}

function createAssetCard(server) {
    const card = document.createElement('div');
    card.className = 'asset-card';

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
        <div class="asset-header">
            <h4>${server.name}</h4>
            <span class="asset-status-badge ${server.status}">${server.status}</span>
        </div>
        <div class="asset-metrics">
            ${createAssetMetric('CPU', metrics.cpu_usage, 80)}
            ${createAssetMetric('Memory', metrics.memory_usage, 85)}
            ${createAssetMetric('Disk', metrics.disk_usage, 90)}
            ${createAssetMetric('Network', metrics.network_traffic, 75)}
        </div>
    `;

    return card;
}

function createAssetMetric(label, value, threshold) {
    const isAlert = value > threshold;
    const color = isAlert ? '#E53935' : value > threshold - 10 ? '#FF9800' : '#00A651';

    return `
        <div class="asset-metric">
            <div class="asset-metric-label">
                <span>${label}</span>
                <span class="asset-metric-value ${isAlert ? 'alert' : ''}">${value.toFixed(1)}%</span>
            </div>
            <div class="asset-progress-bar">
                <div class="asset-progress-fill" style="width: ${value}%; background-color: ${color};"></div>
            </div>
        </div>
    `;
}

// ===================================
// Alerts List
// ===================================

function updateAlertsList(alerts) {
    const container = document.getElementById('alerts-container');

    // Fetch all historical alerts
    fetch('/api/alerts')
        .then(response => response.json())
        .then(allAlerts => {
            if (allAlerts.length === 0) {
                container.innerHTML = '<p class="no-data">No alerts to display</p>';
                return;
            }

            container.innerHTML = '';
            allAlerts.slice(0, 5).forEach(alert => {
                const alertEl = createAlertEntry(alert);
                container.appendChild(alertEl);
            });
        })
        .catch(error => {
            console.error('Error fetching alerts:', error);
        });
}

function createAlertEntry(alert) {
    const div = document.createElement('div');
    div.className = `alert-entry ${alert.severity} clickable`;
    div.style.cursor = 'pointer';

    const icon = alert.severity === 'critical' ? '🔴' : '⚠️';

    div.innerHTML = `
        <div class="alert-entry-icon">${icon}</div>
        <div class="alert-entry-content">
            <div class="alert-entry-title">
                ${alert.server} - ${alert.metric.replace('_', ' ').toUpperCase()}
            </div>
            <div class="alert-entry-details">
                Value: ${alert.value.toFixed(1)}% (Threshold: ${alert.threshold}%)
            </div>
            <div class="alert-entry-time">${alert.timestamp}</div>
        </div>
        <div class="alert-entry-action">→</div>
    `;

    // Add click handler to navigate to events page
    div.addEventListener('click', () => {
        // Navigate to events page
        window.location.href = '/events';
    });

    return div;
}

// ===================================
// Activity Feed
// ===================================

function updateActivityFeed(data) {
    const feed = document.getElementById('activity-feed');

    // Add new activity when there are updates
    if (data.alerts && data.alerts.length > 0) {
        const latestAlert = data.alerts[0];
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <span class="activity-icon">⚡</span>
            <div class="activity-content">
                <div class="activity-text">Alert triggered on ${latestAlert.server}</div>
                <div class="activity-time">${latestAlert.timestamp}</div>
            </div>
        `;

        // Insert at the beginning
        if (feed.firstChild) {
            feed.insertBefore(activityItem, feed.firstChild);
        } else {
            feed.appendChild(activityItem);
        }

        // Keep only last 5 items
        while (feed.children.length > 5) {
            feed.removeChild(feed.lastChild);
        }
    }
}

// ===================================
// Alert Banner
// ===================================

function showAlertBanner(alert) {
    const banner = document.getElementById('alert-banner');
    const message = document.getElementById('alert-message');

    message.textContent = `Alert: ${alert.server} - ${alert.metric.replace('_', ' ')} at ${alert.value.toFixed(1)}% (Threshold: ${alert.threshold}%)`;
    banner.classList.remove('hidden');

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        dismissAlert();
    }, 5000);
}

function dismissAlert() {
    const banner = document.getElementById('alert-banner');
    banner.classList.add('hidden');
}

// ===================================
// Search and Filter Functionality
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Asset search
    const searchInput = document.getElementById('asset-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const assetCards = document.querySelectorAll('.asset-card');

            assetCards.forEach(card => {
                const assetName = card.querySelector('h4').textContent.toLowerCase();
                if (assetName.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // View filter
    const viewFilter = document.getElementById('view-filter');
    if (viewFilter) {
        viewFilter.addEventListener('change', (e) => {
            const filterValue = e.target.value;
            const assetCards = document.querySelectorAll('.asset-card');

            assetCards.forEach(card => {
                const hasAlert = card.classList.contains('alert');

                if (filterValue === 'Critical Only' && !hasAlert) {
                    card.style.display = 'none';
                } else if (filterValue === 'Healthy Only' && hasAlert) {
                    card.style.display = 'none';
                } else {
                    card.style.display = 'block';
                }
            });
        });
    }

    // Refresh interval
    const refreshInterval = document.getElementById('refresh-interval');
    if (refreshInterval) {
        refreshInterval.addEventListener('change', (e) => {
            console.log(`Refresh interval set to ${e.target.value} seconds`);
            // Implement refresh logic if needed
        });
    }
});

// ===================================
// Initial Data Load
// ===================================

fetch('/api/current-data')
    .then(response => response.json())
    .then(data => {
        currentData = data;
        updateDashboard(data);
    })
    .catch(error => {
        console.error('Error loading initial data:', error);
    });
