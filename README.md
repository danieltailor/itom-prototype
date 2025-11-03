# ITOM Prototype - IT Operations Management Dashboard

A real-time infrastructure monitoring dashboard prototype with alerting and visualization capabilities.

## Features

- **Real-time Monitoring**: Live updates every 60 seconds via WebSocket
- **Server Monitoring**: Track CPU, Memory, Disk, and Network metrics for 5 servers
- **Alerting System**: Automatic threshold-based alerts with severity levels
- **Visual Dashboard**: Clean, modern UI with progress bars and stats
- **Notifications**: Alert banner for new critical issues

## Quick Start

### 1. Install Dependencies

```bash
cd itom-prototype
pip install -r requirements.txt
```

### 2. Run the Application

```bash
python app.py
```

### 3. Open in Browser

Navigate to: **http://localhost:5000**

The dashboard will automatically load and start receiving updates every minute.

## How It Works

### Backend (app.py)
- Flask web server with Socket.IO for real-time communication
- Generates fake monitoring data every 60 seconds
- Monitors 5 servers: web-server-01, web-server-02, db-server-01, api-server-01, cache-server-01
- Tracks 4 metrics per server: CPU, Memory, Disk, Network usage
- Automatically creates alerts when metrics exceed thresholds

### Alert Thresholds
- CPU Usage: 80%
- Memory Usage: 85%
- Disk Usage: 90%
- Network Traffic: 75%

### Frontend
- Real-time dashboard updates via Socket.IO
- Server cards with color-coded metrics
- Alert banner for immediate notifications
- Historical alert log (last 20 alerts)
- Responsive design for mobile and desktop

## Project Structure

```
itom-prototype/
├── app.py                  # Flask backend server
├── requirements.txt        # Python dependencies
├── templates/
│   └── dashboard.html      # Main dashboard template
├── static/
│   ├── css/
│   │   └── style.css       # Dashboard styling
│   └── js/
│       └── dashboard.js    # Frontend logic and Socket.IO handling
└── README.md              # This file
```

## Demo Features

- Fake data generation for demo purposes
- Automatic updates every 60 seconds
- Random metric values to simulate real infrastructure
- Alerts triggered when thresholds are exceeded
- No real infrastructure required - perfect for demos!

## Technologies Used

- **Backend**: Python, Flask, Flask-SocketIO
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Real-time**: Socket.IO
- **Styling**: Custom CSS with gradient backgrounds

## Customization

You can modify the following in `app.py`:

- **Update frequency**: Change `time.sleep(60)` to adjust update interval
- **Servers**: Modify the `SERVERS` list to add/remove servers
- **Metrics**: Modify the `METRICS` list to track different metrics
- **Thresholds**: Adjust `THRESHOLDS` dictionary to change alert levels
