// Settings Page JavaScript

// Load saved settings on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupFormHandler();
});

// Load settings from backend
function loadSettings() {
    fetch('/api/settings/grafana')
        .then(response => response.json())
        .then(data => {
            if (data.url) {
                document.getElementById('grafana-url').value = data.url;
            }
            if (data.api_key) {
                document.getElementById('grafana-api-key').value = data.api_key;
                updateConnectionStatus(data.connected || false);
            }
        })
        .catch(error => {
            console.error('Error loading settings:', error);
        });
}

// Setup form submission handler
function setupFormHandler() {
    const form = document.getElementById('grafana-config-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveConfiguration();
    });
}

// Save Grafana configuration
function saveConfiguration() {
    const url = document.getElementById('grafana-url').value;
    const apiKey = document.getElementById('grafana-api-key').value;

    if (!url || !apiKey) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    const config = {
        url: url,
        api_key: apiKey
    };

    fetch('/api/settings/grafana', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Configuration saved successfully!', 'success');
            // Test connection after saving
            setTimeout(() => testConnection(), 1000);
        } else {
            showMessage('Error saving configuration: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error saving configuration:', error);
        showMessage('Error saving configuration', 'error');
    });
}

// Test Grafana connection
function testConnection() {
    const url = document.getElementById('grafana-url').value;
    const apiKey = document.getElementById('grafana-api-key').value;

    if (!url || !apiKey) {
        showMessage('Please enter both URL and API key first', 'error');
        return;
    }

    showMessage('Testing connection...', 'info');

    fetch('/api/settings/grafana/test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: url,
            api_key: apiKey
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Connection successful!', 'success');
            updateConnectionStatus(true);
            displayConnectionInfo(data.info);
        } else {
            showMessage('Connection failed: ' + (data.error || 'Unknown error'), 'error');
            updateConnectionStatus(false);
        }
    })
    .catch(error => {
        console.error('Error testing connection:', error);
        showMessage('Error testing connection: ' + error.message, 'error');
        updateConnectionStatus(false);
    });
}

// Update connection status badge
function updateConnectionStatus(connected) {
    const statusBadge = document.getElementById('grafana-status');
    if (connected) {
        statusBadge.textContent = 'Connected';
        statusBadge.className = 'status-badge connected';
    } else {
        statusBadge.textContent = 'Not Connected';
        statusBadge.className = 'status-badge disconnected';
    }
}

// Display connection information
function displayConnectionInfo(info) {
    const statusCard = document.getElementById('connection-status-card');
    statusCard.style.display = 'block';

    document.getElementById('connection-status-text').textContent = 'Connected';
    document.getElementById('connection-status-text').style.color = '#00A651';

    if (info) {
        document.getElementById('grafana-version').textContent = info.version || '-';
        document.getElementById('grafana-org').textContent = info.org || '-';
    }

    document.getElementById('last-tested').textContent = new Date().toLocaleString();
}

// Toggle password visibility
function togglePasswordVisibility() {
    const input = document.getElementById('grafana-api-key');
    const button = document.querySelector('.btn-toggle-password');

    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

// Show message banner
function showMessage(message, type = 'info') {
    const banner = document.getElementById('message-banner');
    const messageText = document.getElementById('message-text');

    messageText.textContent = message;
    banner.className = `message-banner ${type}`;
    banner.classList.remove('hidden');

    // Auto-dismiss after 5 seconds for success/info messages
    if (type !== 'error') {
        setTimeout(() => {
            dismissMessage();
        }, 5000);
    }
}

// Dismiss message banner
function dismissMessage() {
    const banner = document.getElementById('message-banner');
    banner.classList.add('hidden');
}

// Open Grafana in new tab
function openGrafana() {
    const url = document.getElementById('grafana-url').value || 'http://localhost:3000';
    window.open(url, '_blank');
}

// Show API key help modal
function showAPIKeyHelp() {
    const modal = document.getElementById('api-key-modal');
    modal.classList.remove('hidden');
}

// Close API key help modal
function closeAPIKeyModal() {
    const modal = document.getElementById('api-key-modal');
    modal.classList.add('hidden');
}

// Open documentation
function openDocumentation() {
    window.open('https://github.com/danieltailor/itom-prototype/blob/main/GRAFANA_SETUP.md', '_blank');
}

// Reset configuration
function resetConfiguration() {
    if (!confirm('Are you sure you want to reset the Grafana configuration? This will clear all saved settings.')) {
        return;
    }

    fetch('/api/settings/grafana', {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('Configuration reset successfully', 'success');
            document.getElementById('grafana-url').value = 'http://localhost:3000';
            document.getElementById('grafana-api-key').value = '';
            updateConnectionStatus(false);
            document.getElementById('connection-status-card').style.display = 'none';
        } else {
            showMessage('Error resetting configuration', 'error');
        }
    })
    .catch(error => {
        console.error('Error resetting configuration:', error);
        showMessage('Error resetting configuration', 'error');
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('api-key-modal');
    if (event.target === modal) {
        closeAPIKeyModal();
    }
}
