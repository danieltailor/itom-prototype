from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import random
import threading
import time
from datetime import datetime
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'itom-demo-secret'
CORS(app)  # Enable CORS for Grafana integration
socketio = SocketIO(app, cors_allowed_origins="*")

# Infrastructure components to monitor
SERVERS = ['laptop-01', 'laptop-02', 'laptop-03', 'laptop-04', 'laptop-05']
METRICS = ['cpu_usage', 'memory_usage', 'disk_usage', 'network_traffic']

# Alert thresholds
THRESHOLDS = {
    'cpu_usage': 80,
    'memory_usage': 85,
    'disk_usage': 90,
    'network_traffic': 75
}

# Store recent alerts
recent_alerts = []

# Store events
events = []
event_counter = 1000

def generate_metric_value(metric_name):
    """Generate realistic fake metric values"""
    base_values = {
        'cpu_usage': (20, 95),
        'memory_usage': (30, 92),
        'disk_usage': (40, 88),
        'network_traffic': (10, 85)
    }
    min_val, max_val = base_values[metric_name]
    return round(random.uniform(min_val, max_val), 2)

def create_event_from_alert(alert):
    """Create an event from an alert"""
    global event_counter
    event_counter += 1

    event = {
        'id': f'EVT{event_counter}',
        'number': f'EVT{event_counter}',
        'title': f'{alert["metric"].replace("_", " ").title()} threshold exceeded on {alert["server"]}',
        'description': f'{alert["metric"].replace("_", " ").title()} usage at {alert["value"]:.1f}% exceeds threshold of {alert["threshold"]}%',
        'source': alert['server'],
        'severity': alert['severity'],
        'priority': 'high' if alert['severity'] == 'critical' else 'medium',
        'status': 'new',
        'category': 'Performance',
        'assigned_to': 'Unassigned',
        'created_at': alert['timestamp'],
        'updated_at': alert['timestamp'],
        'resolved_at': None,
        'notes': []
    }

    events.insert(0, event)
    return event

def check_alerts(server, metric, value):
    """Check if metric exceeds threshold and create alert"""
    threshold = THRESHOLDS[metric]
    if value > threshold:
        alert = {
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'server': server,
            'metric': metric,
            'value': value,
            'threshold': threshold,
            'severity': 'critical' if value > threshold + 10 else 'warning'
        }
        recent_alerts.insert(0, alert)
        # Keep only last 20 alerts
        if len(recent_alerts) > 20:
            recent_alerts.pop()

        # Auto-create event from alert
        create_event_from_alert(alert)

        return alert
    return None

def generate_monitoring_data():
    """Generate fake monitoring data for all laptops"""
    data = {
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'servers': []
    }

    alerts = []

    for server in SERVERS:
        server_data = {
            'name': server,
            'status': 'online',
            'metrics': {}
        }

        for metric in METRICS:
            value = generate_metric_value(metric)
            server_data['metrics'][metric] = value

            # Check for alerts
            alert = check_alerts(server, metric, value)
            if alert:
                alerts.append(alert)

        data['servers'].append(server_data)

    data['alerts'] = alerts
    return data

def background_data_generation():
    """Background thread to generate data every minute"""
    while True:
        time.sleep(60)  # Wait 1 minute
        data = generate_monitoring_data()
        socketio.emit('monitoring_update', data)

@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/events')
def events_page():
    return render_template('events.html')

@app.route('/api/current-data')
def get_current_data():
    """API endpoint to get current monitoring data"""
    return jsonify(generate_monitoring_data())

@app.route('/api/alerts')
def get_alerts():
    """API endpoint to get recent alerts"""
    return jsonify(recent_alerts)

@app.route('/api/events', methods=['GET'])
def get_events():
    """API endpoint to get all events"""
    return jsonify(events)

@app.route('/api/events', methods=['POST'])
def create_event():
    """API endpoint to create a new event"""
    global event_counter
    event_counter += 1

    data = request.json
    event = {
        'id': f'EVT{event_counter}',
        'number': f'EVT{event_counter}',
        'title': data.get('title', ''),
        'description': data.get('description', ''),
        'source': data.get('source', 'Manual'),
        'severity': data.get('severity', 'low'),
        'priority': data.get('priority', 'low'),
        'status': 'new',
        'category': data.get('category', 'Other'),
        'assigned_to': data.get('assigned_to', 'Unassigned'),
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'updated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'resolved_at': None,
        'notes': []
    }

    events.insert(0, event)
    socketio.emit('event_created', event)
    return jsonify(event), 201

@app.route('/api/events/<event_id>', methods=['PUT'])
def update_event(event_id):
    """API endpoint to update an event"""
    data = request.json

    for event in events:
        if event['id'] == event_id:
            # Update fields
            if 'title' in data:
                event['title'] = data['title']
            if 'description' in data:
                event['description'] = data['description']
            if 'severity' in data:
                event['severity'] = data['severity']
            if 'priority' in data:
                event['priority'] = data['priority']
            if 'status' in data:
                event['status'] = data['status']
                if data['status'] == 'resolved' or data['status'] == 'closed':
                    event['resolved_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            if 'category' in data:
                event['category'] = data['category']
            if 'assigned_to' in data:
                event['assigned_to'] = data['assigned_to']
            if 'note' in data:
                note = {
                    'text': data['note'],
                    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
                event['notes'].append(note)

            event['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            socketio.emit('event_updated', event)
            return jsonify(event)

    return jsonify({'error': 'Event not found'}), 404

@app.route('/api/events/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    """API endpoint to delete an event"""
    global events
    events = [e for e in events if e['id'] != event_id]
    socketio.emit('event_deleted', {'id': event_id})
    return jsonify({'success': True})

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')
    # Send initial data
    emit('monitoring_update', generate_monitoring_data())

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

# ===================================
# Grafana Integration API Endpoints
# ===================================

@app.route('/grafana/health', methods=['GET'])
def grafana_health():
    """Health check endpoint for Grafana"""
    return jsonify({'status': 'ok'})

@app.route('/grafana/search', methods=['POST'])
def grafana_search():
    """Return available metrics for Grafana"""
    metrics = [
        'cpu_usage',
        'memory_usage',
        'disk_usage',
        'network_traffic',
        'alerts_count',
        'events_count',
        'critical_alerts',
        'health_score'
    ]
    return jsonify(metrics)

@app.route('/grafana/query', methods=['POST'])
def grafana_query():
    """Query endpoint for Grafana time series data"""
    req = request.json
    targets = req.get('targets', [])
    time_range = req.get('range', {})

    results = []

    for target in targets:
        metric_name = target.get('target', '')

        if metric_name in ['cpu_usage', 'memory_usage', 'disk_usage', 'network_traffic']:
            # Generate time series data for resource metrics
            datapoints = []
            data = generate_monitoring_data()

            for server in data['servers']:
                value = server['metrics'].get(metric_name, 0)
                timestamp = int(datetime.now().timestamp() * 1000)
                datapoints.append([value, timestamp])

            results.append({
                'target': metric_name,
                'datapoints': datapoints
            })

        elif metric_name == 'alerts_count':
            timestamp = int(datetime.now().timestamp() * 1000)
            results.append({
                'target': 'alerts_count',
                'datapoints': [[len(recent_alerts), timestamp]]
            })

        elif metric_name == 'events_count':
            timestamp = int(datetime.now().timestamp() * 1000)
            results.append({
                'target': 'events_count',
                'datapoints': [[len(events), timestamp]]
            })

        elif metric_name == 'critical_alerts':
            timestamp = int(datetime.now().timestamp() * 1000)
            critical_count = len([a for a in recent_alerts if a['severity'] == 'critical'])
            results.append({
                'target': 'critical_alerts',
                'datapoints': [[critical_count, timestamp]]
            })

        elif metric_name == 'health_score':
            timestamp = int(datetime.now().timestamp() * 1000)
            # Calculate average health score
            data = generate_monitoring_data()
            total_score = 0
            for server in data['servers']:
                score = 100
                metrics = server['metrics']
                if metrics.get('cpu_usage', 0) > 80: score -= 20
                if metrics.get('memory_usage', 0) > 85: score -= 20
                if metrics.get('disk_usage', 0) > 90: score -= 20
                total_score += max(score, 0)

            avg_score = total_score / len(data['servers']) if data['servers'] else 100
            results.append({
                'target': 'health_score',
                'datapoints': [[avg_score, timestamp]]
            })

    return jsonify(results)

@app.route('/grafana/annotations', methods=['POST'])
def grafana_annotations():
    """Return annotations (alerts/events) for Grafana"""
    req = request.json
    annotations = []

    # Add recent alerts as annotations
    for alert in recent_alerts[:10]:
        try:
            alert_time = datetime.strptime(alert['timestamp'], '%Y-%m-%d %H:%M:%S')
            annotations.append({
                'annotation': 'alerts',
                'time': int(alert_time.timestamp() * 1000),
                'title': f"{alert['server']} - {alert['metric']}",
                'tags': [alert['severity'], alert['server']],
                'text': f"{alert['metric']} at {alert['value']:.1f}% (threshold: {alert['threshold']}%)"
            })
        except:
            pass

    return jsonify(annotations)

@app.route('/grafana/metrics', methods=['GET'])
def grafana_metrics():
    """Return current metrics in Prometheus-like format for Grafana"""
    data = generate_monitoring_data()
    metrics = []

    for server in data['servers']:
        server_name = server['name']
        for metric, value in server['metrics'].items():
            metrics.append({
                'metric': metric,
                'server': server_name,
                'value': value,
                'timestamp': datetime.now().isoformat()
            })

    # Add aggregate metrics
    metrics.append({
        'metric': 'total_alerts',
        'value': len(recent_alerts),
        'timestamp': datetime.now().isoformat()
    })

    metrics.append({
        'metric': 'total_events',
        'value': len(events),
        'timestamp': datetime.now().isoformat()
    })

    critical_alerts = len([a for a in recent_alerts if a['severity'] == 'critical'])
    metrics.append({
        'metric': 'critical_alerts',
        'value': critical_alerts,
        'timestamp': datetime.now().isoformat()
    })

    return jsonify(metrics)

if __name__ == '__main__':
    # Start background data generation thread
    thread = threading.Thread(target=background_data_generation)
    thread.daemon = True
    thread.start()

    print('Starting ITOM Prototype Server...')
    print('Access the dashboard at: http://localhost:5000')
    socketio.run(app, debug=True, port=5000)
