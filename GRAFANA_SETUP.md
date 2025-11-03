# Grafana Integration for ITOM Prototype

This guide will help you set up Grafana (free version) to visualize metrics from your ITOM prototype application.

## Prerequisites

- Docker and Docker Compose installed on your system
- Python 3.x with pip
- ITOM Prototype application running

## Quick Start

### 1. Install Dependencies

First, install the required Python packages:

```bash
pip install -r requirements.txt
```

This will install Flask-CORS which is needed for Grafana integration.

### 2. Start the ITOM Application

Start your ITOM prototype application:

```bash
python app.py
```

The application should be running at `http://localhost:5000`

### 3. Start Grafana with Docker Compose

In a new terminal window, start Grafana:

```bash
docker-compose up -d
```

This will:
- Pull the latest Grafana OSS (free) image
- Install the SimpleJSON datasource plugin
- Start Grafana on port 3000
- Auto-configure the ITOM JSON API datasource
- Load the pre-built ITOM Overview dashboard

### 4. Access Grafana

Open your web browser and navigate to:

```
http://localhost:3000
```

**Default Login Credentials:**
- Username: `admin`
- Password: `admin`

You will be prompted to change the password on first login (optional).

### 5. View the Dashboard

Once logged in:

1. Go to **Dashboards** → **Browse**
2. Click on **ITOM Overview Dashboard**
3. You should see real-time metrics from your ITOM application!

## What's Included

### Metrics Available in Grafana

The following metrics are available for visualization:

1. **cpu_usage** - CPU utilization percentage per server
2. **memory_usage** - Memory utilization percentage per server
3. **disk_usage** - Disk utilization percentage per server
4. **network_traffic** - Network traffic percentage per server
5. **alerts_count** - Total number of active alerts
6. **events_count** - Total number of events
7. **critical_alerts** - Number of critical severity alerts
8. **health_score** - Overall system health score (0-100)

### Pre-configured Dashboard Panels

The ITOM Overview Dashboard includes:

- **System Health Score** - Pie chart showing overall system health
- **Total Alerts** - Gauge showing current alert count
- **Critical Alerts** - Gauge showing critical alerts count
- **CPU Usage** - Time series graph of CPU utilization
- **Memory Usage** - Time series graph of memory utilization
- **Disk Usage** - Time series graph of disk utilization
- **Network Traffic** - Time series graph of network traffic

## API Endpoints

The following endpoints are available for Grafana integration:

- `GET /grafana/health` - Health check endpoint
- `POST /grafana/search` - Returns available metrics
- `POST /grafana/query` - Query time series data
- `POST /grafana/annotations` - Returns alert annotations
- `GET /grafana/metrics` - Returns current metrics snapshot

## Customizing Your Dashboard

### Creating New Panels

1. Click the **+** icon in the top right corner
2. Select **Add visualization**
3. Choose **ITOM JSON API** as the datasource
4. Select a metric from the dropdown
5. Configure visualization type (Graph, Gauge, Stat, etc.)
6. Click **Apply** to save

### Available Visualization Types

- **Time Series** - Best for CPU, Memory, Disk, Network metrics
- **Gauge** - Best for alert counts and health scores
- **Stat** - Best for single numeric values
- **Bar Chart** - Best for comparing metrics across servers
- **Pie Chart** - Best for distribution visualizations

### Setting Up Alerts in Grafana

1. Edit a panel
2. Go to the **Alert** tab
3. Click **Create alert rule from this panel**
4. Configure alert conditions (e.g., CPU > 80%)
5. Set up notification channels (email, Slack, etc.)

## Troubleshooting

### Grafana Can't Connect to ITOM API

1. Ensure your ITOM app is running on port 5000
2. Check if Flask-CORS is installed: `pip list | grep Flask-CORS`
3. Verify the datasource URL in Grafana:
   - Go to **Configuration** → **Data Sources**
   - Click **ITOM JSON API**
   - URL should be: `http://host.docker.internal:5000`
   - Click **Save & Test**

### No Data Showing in Panels

1. Check that the ITOM application is generating data
2. Verify the time range in Grafana (top right corner)
3. Set refresh interval to 5 seconds or lower
4. Check browser console for errors

### Dashboard Not Loading

1. Restart Grafana: `docker-compose restart`
2. Check Grafana logs: `docker-compose logs grafana`
3. Verify dashboard files exist in `grafana/dashboards/`

### Docker Issues

If Docker is not running or you get connection errors:

```bash
# Stop Grafana
docker-compose down

# Remove volumes and restart
docker-compose down -v
docker-compose up -d
```

## Advanced Configuration

### Changing Grafana Port

Edit `docker-compose.yml` and change the port mapping:

```yaml
ports:
  - "3001:3000"  # Access Grafana on port 3001 instead
```

### Persistent Data

Grafana data is stored in a Docker volume named `grafana-storage`. To reset Grafana:

```bash
docker-compose down -v
docker-compose up -d
```

### Adding More Dashboards

1. Create a new JSON file in `grafana/dashboards/`
2. Restart Grafana or wait for auto-refresh (10 seconds)
3. The dashboard will appear automatically

## Stopping Grafana

To stop Grafana:

```bash
docker-compose down
```

To stop and remove all data:

```bash
docker-compose down -v
```

## Additional Resources

- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [SimpleJSON Datasource Plugin](https://grafana.com/grafana/plugins/simpod-json-datasource/)
- [Creating Dashboards in Grafana](https://grafana.com/docs/grafana/latest/dashboards/)

## Support

For issues related to:
- **ITOM Application**: Check the main README.md
- **Grafana Setup**: Review this guide
- **Docker Issues**: Visit [Docker Documentation](https://docs.docker.com/)

## Next Steps

1. Explore the pre-built dashboard
2. Create custom panels for specific metrics
3. Set up alerting rules
4. Share dashboards with your team
5. Integrate with other monitoring tools

Enjoy visualizing your ITOM metrics with Grafana!
