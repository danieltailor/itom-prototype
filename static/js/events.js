// Initialize Socket.IO connection
const socket = io();

// Store events and current event
let allEvents = [];
let currentEvent = null;

// Socket.IO event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    updateConnectionStatus(true);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    updateConnectionStatus(false);
});

socket.on('event_created', (event) => {
    console.log('Event created:', event);
    loadEvents();
});

socket.on('event_updated', (event) => {
    console.log('Event updated:', event);
    loadEvents();
});

socket.on('event_deleted', (data) => {
    console.log('Event deleted:', data);
    loadEvents();
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

// Load events from API
function loadEvents() {
    fetch('/api/events')
        .then(response => response.json())
        .then(events => {
            allEvents = events;
            updateStats(events);
            // Apply URL filters if present (only on first load)
            if (!window.filtersApplied) {
                applyUrlFilters();
                window.filtersApplied = true;
            }
            filterEvents();
        })
        .catch(error => {
            console.error('Error loading events:', error);
        });
}

// Update statistics
function updateStats(events) {
    const total = events.length;
    const newCount = events.filter(e => e.status === 'new').length;
    const inProgressCount = events.filter(e => e.status === 'in-progress').length;
    const resolvedCount = events.filter(e => e.status === 'resolved').length;

    document.getElementById('total-events').textContent = total;
    document.getElementById('new-events').textContent = newCount;
    document.getElementById('in-progress-events').textContent = inProgressCount;
    document.getElementById('resolved-events').textContent = resolvedCount;
}

// Get URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        severity: params.get('severity'),
        status: params.get('status'),
        priority: params.get('priority')
    };
}

// Apply URL parameters to filters
function applyUrlFilters() {
    const params = getUrlParams();

    if (params.severity) {
        document.getElementById('filter-severity').value = params.severity;
    }

    if (params.status) {
        // Map 'unresolved' to filter for new and in-progress events
        if (params.status === 'unresolved') {
            document.getElementById('filter-status').value = '';
        } else {
            document.getElementById('filter-status').value = params.status;
        }
    }

    if (params.priority) {
        document.getElementById('filter-priority').value = params.priority;
    }

    // Show filter info banner
    updateFilterInfoBanner(params);
}

// Update filter info banner
function updateFilterInfoBanner(params) {
    const banner = document.getElementById('filter-info-banner');
    const bannerText = document.getElementById('filter-info-text');

    if (!params) {
        params = getUrlParams();
    }

    // Check if any filters are active
    if (params.severity || params.status || params.priority) {
        let filterText = 'Active Filters: ';
        const filters = [];

        if (params.severity) {
            filters.push(`Severity: ${params.severity.charAt(0).toUpperCase() + params.severity.slice(1)}`);
        }

        if (params.status === 'unresolved') {
            filters.push('Status: Unresolved (New & In Progress)');
        } else if (params.status) {
            filters.push(`Status: ${params.status.charAt(0).toUpperCase() + params.status.slice(1)}`);
        }

        if (params.priority) {
            filters.push(`Priority: ${params.priority.charAt(0).toUpperCase() + params.priority.slice(1)}`);
        }

        filterText += filters.join(' | ');
        bannerText.textContent = filterText;
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }
}

// Clear all filters
function clearFilters() {
    // Clear dropdown values
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-severity').value = '';
    document.getElementById('filter-priority').value = '';
    document.getElementById('search-box').value = '';

    // Remove URL parameters and reload
    window.location.href = '/events';
}

// Filter events based on filters and search
function filterEvents() {
    const statusFilter = document.getElementById('filter-status').value;
    const severityFilter = document.getElementById('filter-severity').value;
    const priorityFilter = document.getElementById('filter-priority').value;
    const searchText = document.getElementById('search-box').value.toLowerCase();

    // Check if we need to filter for unresolved (from URL)
    const params = getUrlParams();
    const unresolvedFilter = params.status === 'unresolved';

    let filtered = allEvents.filter(event => {
        // Status filter
        if (unresolvedFilter) {
            // Unresolved means not 'resolved' and not 'closed'
            if (event.status === 'resolved' || event.status === 'closed') return false;
        } else if (statusFilter && event.status !== statusFilter) {
            return false;
        }

        // Severity filter
        if (severityFilter && event.severity !== severityFilter) return false;

        // Priority filter
        if (priorityFilter && event.priority !== priorityFilter) return false;

        // Search filter
        if (searchText) {
            const searchableText = `${event.number} ${event.title} ${event.description} ${event.source}`.toLowerCase();
            if (!searchableText.includes(searchText)) return false;
        }

        return true;
    });

    renderEventsTable(filtered);
}

// Render events table
function renderEventsTable(events) {
    const tbody = document.getElementById('events-table-body');

    if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="no-data">No events found</td></tr>';
        return;
    }

    tbody.innerHTML = events.map(event => {
        return `
            <tr onclick="showEventDetails('${event.id}')">
                <td><span class="event-number">${event.number}</span></td>
                <td class="event-title-cell">${event.title}</td>
                <td>${event.source}</td>
                <td><span class="badge severity-${event.severity}">${event.severity}</span></td>
                <td><span class="badge priority-${event.priority}">${event.priority}</span></td>
                <td><span class="badge status-${event.status}">${event.status.replace('-', ' ')}</span></td>
                <td>${event.assigned_to}</td>
                <td>${event.created_at}</td>
                <td>
                    <button class="btn-icon" onclick="event.stopPropagation(); showEventDetails('${event.id}')" title="View Details">👁️</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Show create event modal
function showCreateEventModal() {
    document.getElementById('create-event-modal').classList.remove('hidden');
}

// Hide create event modal
function hideCreateEventModal() {
    document.getElementById('create-event-modal').classList.add('hidden');
    document.getElementById('create-event-form').reset();
}

// Create new event
function createEvent() {
    const title = document.getElementById('event-title').value;
    const description = document.getElementById('event-description').value;
    const source = document.getElementById('event-source').value;
    const category = document.getElementById('event-category').value;
    const severity = document.getElementById('event-severity').value;
    const priority = document.getElementById('event-priority').value;
    const assigned_to = document.getElementById('event-assigned').value;

    if (!title || !description) {
        alert('Please fill in all required fields');
        return;
    }

    const eventData = {
        title,
        description,
        source,
        category,
        severity,
        priority,
        assigned_to
    };

    fetch('/api/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
    })
    .then(response => response.json())
    .then(event => {
        console.log('Event created:', event);
        hideCreateEventModal();
        loadEvents();
    })
    .catch(error => {
        console.error('Error creating event:', error);
        alert('Error creating event');
    });
}

// Show event details modal
function showEventDetails(eventId) {
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return;

    currentEvent = event;

    // Populate details
    document.getElementById('event-detail-number').textContent = event.number;
    document.getElementById('detail-title').textContent = event.title;
    document.getElementById('detail-description').textContent = event.description;
    document.getElementById('detail-source').textContent = event.source;
    document.getElementById('detail-category').textContent = event.category;
    document.getElementById('detail-severity').innerHTML = `<span class="badge severity-${event.severity}">${event.severity}</span>`;
    document.getElementById('detail-priority').innerHTML = `<span class="badge priority-${event.priority}">${event.priority}</span>`;
    document.getElementById('detail-status').innerHTML = `<span class="badge status-${event.status}">${event.status.replace('-', ' ')}</span>`;
    document.getElementById('detail-assigned').textContent = event.assigned_to;
    document.getElementById('detail-created').textContent = event.created_at;
    document.getElementById('detail-updated').textContent = event.updated_at;

    // Set status dropdown
    document.getElementById('update-status').value = event.status;

    // Render notes
    renderNotes(event.notes);

    // Show modal
    document.getElementById('event-details-modal').classList.remove('hidden');
}

// Hide event details modal
function hideEventDetailsModal() {
    document.getElementById('event-details-modal').classList.add('hidden');
    currentEvent = null;
}

// Render notes
function renderNotes(notes) {
    const container = document.getElementById('notes-container');

    if (!notes || notes.length === 0) {
        container.innerHTML = '<p class="no-notes">No notes yet</p>';
        return;
    }

    container.innerHTML = notes.map(note => `
        <div class="note-item">
            <div class="note-text">${note.text}</div>
            <div class="note-time">${note.timestamp}</div>
        </div>
    `).join('');
}

// Update event status
function updateEventStatus() {
    if (!currentEvent) return;

    const newStatus = document.getElementById('update-status').value;

    fetch(`/api/events/${currentEvent.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(updatedEvent => {
        console.log('Event updated:', updatedEvent);
        currentEvent = updatedEvent;
        showEventDetails(updatedEvent.id);
        loadEvents();
    })
    .catch(error => {
        console.error('Error updating event:', error);
        alert('Error updating event');
    });
}

// Add note to event
function addNote() {
    if (!currentEvent) return;

    const noteText = document.getElementById('new-note').value.trim();
    if (!noteText) {
        alert('Please enter a note');
        return;
    }

    fetch(`/api/events/${currentEvent.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note: noteText })
    })
    .then(response => response.json())
    .then(updatedEvent => {
        console.log('Note added:', updatedEvent);
        currentEvent = updatedEvent;
        document.getElementById('new-note').value = '';
        renderNotes(updatedEvent.notes);
    })
    .catch(error => {
        console.error('Error adding note:', error);
        alert('Error adding note');
    });
}

// Delete event
function deleteEvent() {
    if (!currentEvent) return;

    if (!confirm(`Are you sure you want to delete event ${currentEvent.number}?`)) {
        return;
    }

    fetch(`/api/events/${currentEvent.id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(() => {
        console.log('Event deleted');
        hideEventDetailsModal();
        loadEvents();
    })
    .catch(error => {
        console.error('Error deleting event:', error);
        alert('Error deleting event');
    });
}

// Close modals when clicking outside
window.onclick = function(event) {
    const createModal = document.getElementById('create-event-modal');
    const detailsModal = document.getElementById('event-details-modal');

    if (event.target === createModal) {
        hideCreateEventModal();
    }
    if (event.target === detailsModal) {
        hideEventDetailsModal();
    }
}

// Initial load
loadEvents();
