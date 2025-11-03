// Store assets and current asset
let allAssets = [];
let currentAsset = null;

// Load assets from API
function loadAssets() {
    fetch('/api/assets')
        .then(response => response.json())
        .then(assets => {
            allAssets = assets;
            updateSummary(assets);
            filterAssets();
        })
        .catch(error => {
            console.error('Error loading assets:', error);
        });
}

// Update summary statistics
function updateSummary(assets) {
    const total = assets.length;
    document.getElementById('result-count').textContent = total;
}

// Filter assets based on filters and search
function filterAssets() {
    const statusFilter = document.getElementById('filter-status').value;
    const brandFilter = document.getElementById('filter-brand').value;
    const typeFilter = document.getElementById('filter-type').value;
    const searchText = document.getElementById('search-box').value.toLowerCase();

    let filtered = allAssets.filter(asset => {
        // Status filter
        if (statusFilter && asset.status !== statusFilter) return false;

        // Brand filter
        if (brandFilter && asset.brand !== brandFilter) return false;

        // Type filter
        if (typeFilter && asset.type !== typeFilter) return false;

        // Search filter
        if (searchText) {
            const searchableText = `${asset.id} ${asset.name} ${asset.model} ${asset.serial_number} ${asset.assigned_to} ${asset.location}`.toLowerCase();
            if (!searchableText.includes(searchText)) return false;
        }

        return true;
    });

    renderAssetsTable(filtered);
}

// Render assets table
function renderAssetsTable(assets) {
    const tbody = document.getElementById('assets-table-body');

    // Update result count
    document.getElementById('result-count').textContent = assets.length;

    if (assets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="no-data">No assets found</td></tr>';
        return;
    }

    tbody.innerHTML = assets.map(asset => {
        const statusClass = asset.status.toLowerCase().replace(' ', '-');
        return `
            <tr onclick="showAssetDetails('${asset.id}')">
                <td><input type="checkbox" class="checkbox-row" onclick="event.stopPropagation()"></td>
                <td><strong class="asset-name">${asset.name}</strong></td>
                <td class="asset-id">${asset.id}</td>
                <td>${asset.type}</td>
                <td>${asset.brand}</td>
                <td>${asset.model}</td>
                <td class="serial-number">${asset.serial_number}</td>
                <td><span class="status-badge status-${statusClass}">${asset.status}</span></td>
                <td>${asset.location}</td>
                <td>${asset.assigned_to}</td>
            </tr>
        `;
    }).join('');
}

// Show asset details modal
function showAssetDetails(assetId) {
    const asset = allAssets.find(a => a.id === assetId);
    if (!asset) return;

    currentAsset = asset;

    // Populate details
    document.getElementById('asset-detail-id').textContent = asset.id;
    document.getElementById('detail-id').textContent = asset.id;
    document.getElementById('detail-name').textContent = asset.name;
    document.getElementById('detail-type').textContent = asset.type;

    const statusClass = asset.status.toLowerCase().replace(' ', '-');
    document.getElementById('detail-status').innerHTML = `<span class="status-badge status-${statusClass}">${asset.status}</span>`;

    document.getElementById('detail-brand').textContent = asset.brand;
    document.getElementById('detail-model').textContent = asset.model;
    document.getElementById('detail-serial').textContent = asset.serial_number;
    document.getElementById('detail-os').textContent = asset.os;
    document.getElementById('detail-ip').textContent = asset.ip_address;
    document.getElementById('detail-location').textContent = asset.location;
    document.getElementById('detail-assigned').textContent = asset.assigned_to;
    document.getElementById('detail-purchase').textContent = asset.purchase_date;
    document.getElementById('detail-warranty').textContent = asset.warranty_expiry;

    // Show modal
    document.getElementById('asset-details-modal').classList.remove('hidden');
}

// Hide asset details modal
function hideAssetDetailsModal() {
    document.getElementById('asset-details-modal').classList.add('hidden');
    currentAsset = null;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('asset-details-modal');
    if (event.target === modal) {
        hideAssetDetailsModal();
    }
}

// Initial load
loadAssets();
