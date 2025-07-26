---
title: "Turn GitHub into Your Free Data Platform: Building APIs with GitHub Actions"
date: 2025-07-26T14:47:05+05:30
categories: [DevOps, GitHub Actions, Web Scraping, APIs]
tags: [github-actions, automation, data-scraping, free-hosting, api-development]
description: "Learn how to use GitHub as a complete data platform for scraping, processing, and serving APIs - all for free. A complete guide with real-world examples."
image: /assets/images/github-data-platform-hero.png
---

_What if I told you that you could build, host, and maintain data APIs completely free using just GitHub? Here's how I built a production-ready data platform without spending a penny on hosting._

## The Problem: APIs Are Expensive (Or Are They?)

Building data-driven applications usually means expensive cloud hosting, database costs, and server maintenance. Most developers assume they need AWS, Google Cloud, or Azure to run automated data collection and serve APIs. But what if there was a better way?

When I built my [Antarctic Iceberg Tracker](https://github.com/Joel-hanson/Iceberg-locations), I discovered that GitHub offers everything needed for a complete data platform:

- **Free automation** with GitHub Actions (2,000 minutes/month)
- **Free hosting** via GitHub Pages
- **Free CDN** through raw.githubusercontent.com URLs
- **Free storage** in repositories (up to 1GB per repo)

**That's when I realized GitHub isn't just for code—it's a powerful data platform.**

## The GitHub-as-a-Platform Architecture

Instead of traditional cloud infrastructure, this approach uses GitHub's native features as building blocks:

### **Data Collection Layer**

GitHub Actions serves as your cron job scheduler and processing engine. It can run Python scripts, install dependencies, and execute complex data workflows on Ubuntu virtual machines.

### **Data Storage Layer**

Your repository becomes the database. JSON files, CSVs, or any structured data format can be stored and versioned automatically. Every data update creates a commit, giving you complete audit trails.

### **API Layer**

Raw GitHub URLs become your API endpoints. Files like `api/latest.json` are instantly accessible via `https://raw.githubusercontent.com/<USERNAME>/<REPO>/main/api/latest.json` with built-in CDN caching.

### **Frontend Layer**

GitHub Pages hosts your interactive dashboards, documentation, and user interfaces. No separate hosting needed.

## Real-World Example: Weather Forecast to API in 30 Minutes

Let me show you exactly how to transform a weather website into a public API using this approach. We'll scrape weather data and serve it as a clean JSON API:

### **Step 1: Repository Structure**

```
weather-api-project/
├── .github/workflows/
│   └── hourly-weather.yml
├── src/
│   └── weather_scraper.py
├── api/
│   ├── current.json
│   └── forecast.json
├── data/
│   └── historical_weather.json
└── docs/
    └── index.html
```

### **Step 2: The Weather Scraper**

```python
import requests
import json
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import re

def scrape_weather_data():
    """Scrape weather data from a public weather service"""
    try:
        # Using OpenWeatherMap's free tier as an example
        # You can also scrape weather.com, weather.gov, etc.
        city = "New York"
        url = f"https://wttr.in/{city}?format=j1"  # JSON weather API

        response = requests.get(url, timeout=30)
        response.raise_for_status()

        weather_data = response.json()

        # Process and clean the data
        current_weather = extract_current_weather(weather_data)
        forecast_data = extract_forecast_data(weather_data)

        # Save current weather to API endpoint
        current_api = {
            "location": city,
            "last_updated": datetime.now().isoformat(),
            "current": current_weather
        }

        # Save forecast to API endpoint
        forecast_api = {
            "location": city,
            "last_updated": datetime.now().isoformat(),
            "forecast": forecast_data
        }

        # Write to API files
        with open('api/current.json', 'w') as f:
            json.dump(current_api, f, indent=2)

        with open('api/forecast.json', 'w') as f:
            json.dump(forecast_api, f, indent=2)

        print(f"Successfully updated weather data for {city}")
        return True

    except Exception as e:
        print(f"Error scraping weather data: {e}")
        return False

def extract_current_weather(data):
    """Extract current weather conditions"""
    current = data.get('current_condition', [{}])[0]

    return {
        "temperature_f": int(current.get('temp_F', 0)),
        "temperature_c": int(current.get('temp_C', 0)),
        "condition": current.get('weatherDesc', [{}])[0].get('value', 'Unknown'),
        "humidity": int(current.get('humidity', 0)),
        "wind_speed_mph": int(current.get('windspeedMiles', 0)),
        "wind_direction": current.get('winddir16Point', 'N'),
        "feels_like_f": int(current.get('FeelsLikeF', 0)),
        "uv_index": int(current.get('uvIndex', 0))
    }

def extract_forecast_data(data):
    """Extract 3-day forecast"""
    forecast = []

    for day_data in data.get('weather', [])[:3]:  # 3-day forecast
        date = day_data.get('date')

        forecast.append({
            "date": date,
            "max_temp_f": int(day_data.get('maxtempF', 0)),
            "min_temp_f": int(day_data.get('mintempF', 0)),
            "max_temp_c": int(day_data.get('maxtempC', 0)),
            "min_temp_c": int(day_data.get('mintempC', 0)),
            "condition": day_data.get('hourly', [{}])[0].get('weatherDesc', [{}])[0].get('value', 'Unknown'),
            "chance_of_rain": int(day_data.get('hourly', [{}])[0].get('chanceofrain', 0)),
            "sunrise": day_data.get('astronomy', [{}])[0].get('sunrise', ''),
            "sunset": day_data.get('astronomy', [{}])[0].get('sunset', '')
        })

    return forecast

if __name__ == "__main__":
    success = scrape_weather_data()
    exit(0 if success else 1)
```

### **Step 3: GitHub Actions Automation**

```yaml
name: Hourly Weather Update

on:
  schedule:
    - cron: "0 * * * *" # Every hour
  workflow_dispatch: # Manual trigger option

jobs:
  scrape-weather:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install requests beautifulsoup4 lxml

      - name: Run weather scraper
        run: python src/weather_scraper.py

      - name: Commit and push changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add api/
          git diff --staged --quiet || git commit -m "Weather update $(date)"
          git push

  scrape-and-update:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.12"

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install requests beautifulsoup4 lxml

      - name: Run data scraper
        run: python src/scraper.py

      - name: Commit and push changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add .
          git diff --staged --quiet || git commit -m "Automated data update $(date)"
          git push
```

### **Step 4: Instant Weather API Endpoints**

Once the workflow runs, your weather data becomes instantly accessible:

```javascript
// Get current weather
fetch(
  "https://raw.githubusercontent.com/<USERNAME>/weather-api/main/api/current.json"
)
  .then((response) => response.json())
  .then((data) => {
    console.log(`Current temperature: ${data.current.temperature_f}°F`);
    console.log(`Condition: ${data.current.condition}`);
  });

// Get 3-day forecast
fetch(
  "https://raw.githubusercontent.com/<USERNAME>/weather-api/main/api/forecast.json"
)
  .then((response) => response.json())
  .then((data) => {
    data.forecast.forEach((day) => {
      console.log(
        `${day.date}: ${day.min_temp_f}-${day.max_temp_f}°F, ${day.condition}`
      );
    });
  });
```

## Advanced Patterns for Production Use

### **Error Handling and Reliability**

```python
import time
import random

def scrape_with_retry(url, max_retries=3):
    """Robust scraping with exponential backoff"""
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                print(f"Attempt {attempt + 1} failed, retrying in {wait_time:.1f}s")
                time.sleep(wait_time)
            else:
                raise e
```

### **Data Validation and Quality**

```python
def validate_data(data):
    """Ensure data quality before publishing"""
    required_fields = ['id', 'latitude', 'longitude', 'date']

    for item in data:
        # Check required fields
        if not all(field in item for field in required_fields):
            raise ValueError(f"Missing required fields in: {item}")

        # Validate coordinates
        lat, lon = item['latitude'], item['longitude']
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValueError(f"Invalid coordinates: {lat}, {lon}")

    return True
```

### **Smart Caching and Updates**

```python
def should_update_data(current_data, new_data):
    """Only update if data has actually changed"""
    if not current_data:
        return True

    # Compare checksums or key metrics
    current_count = len(current_data.get('icebergs', []))
    new_count = len(new_data.get('icebergs', []))

    return current_count != new_count
```

## Beyond Basic Scraping: Advanced Use Cases

### **Multi-Source Data Aggregation**

```python
def aggregate_multiple_sources():
    """Combine data from multiple APIs/websites"""
    sources = [
        {'name': 'NASA', 'url': 'https://nasa.gov/api/data'},
        {'name': 'NOAA', 'url': 'https://noaa.gov/api/weather'},
        {'name': 'USGS', 'url': 'https://usgs.gov/api/earthquakes'}
    ]

    aggregated_data = {}
    for source in sources:
        try:
            data = fetch_and_process(source['url'])
            aggregated_data[source['name']] = data
        except Exception as e:
            print(f"Failed to fetch from {source['name']}: {e}")

    return aggregated_data
```

### **Time Series Data Management**

```python
def manage_historical_data(new_data):
    """Maintain rolling window of historical data"""
    try:
        with open('data/historical.json', 'r') as f:
            history = json.load(f)
    except FileNotFoundError:
        history = []

    # Add new data with timestamp
    history.append({
        'timestamp': datetime.now().isoformat(),
        'data': new_data
    })

    # Keep only last 30 days
    cutoff = datetime.now() - timedelta(days=30)
    history = [
        entry for entry in history
        if datetime.fromisoformat(entry['timestamp']) > cutoff
    ]

    with open('data/historical.json', 'w') as f:
        json.dump(history, f, indent=2)
```

## GitHub Pages: Your Free Frontend

Create an interactive dashboard using GitHub Pages:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Data Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  </head>
  <body>
    <div id="dashboard">
      <h1>Real-Time Data Dashboard</h1>
      <canvas id="dataChart"></canvas>
      <div id="stats"></div>
    </div>

    <script>
      async function loadData() {
        const response = await fetch(
          "https://raw.githubusercontent.com/<USERNAME>/<REPO>/main/api/latest.json"
        );
        const data = await response.json();

        // Update statistics
        document.getElementById("stats").innerHTML = `
                <p>Last Updated: ${new Date(
                  data.last_updated
                ).toLocaleString()}</p>
                <p>Total Items: ${data.total_icebergs}</p>
            `;

        // Create chart
        const ctx = document.getElementById("dataChart").getContext("2d");
        new Chart(ctx, {
          type: "line",
          data: {
            labels: data.icebergs.map((item) => item.date),
            datasets: [
              {
                label: "Data Points",
                data: data.icebergs.map((item) => item.value),
              },
            ],
          },
        });
      }

      loadData();
      // Refresh every 5 minutes
      setInterval(loadData, 5 * 60 * 1000);
    </script>
  </body>
</html>
```

## Real Success Stories: What You Can Build

### **Financial Data APIs**

- Stock market indicators from multiple sources
- Cryptocurrency price aggregation
- Economic indicators dashboard

### **Environmental Monitoring**

- Air quality data from government APIs
- Weather pattern analysis
- Climate change indicators

### **Social Media Analytics**

- Trending topics aggregation
- Sentiment analysis pipelines
- Social media metrics dashboards

### **Government Data Portals**

- Public records aggregation
- Legislative tracking systems
- Census data visualization

## Limitations and When to Graduate

### **GitHub Limits to Consider**

The free approach works great but has boundaries:

- **Repository size**: 1GB per repository
- **Actions minutes**: 2,000 minutes/month (about 67 minutes/day)
- **API rate limits**: 5,000 requests/hour/IP regardless of authentication
- **File size**: 100MB maximum per file

### **When to Move to Paid Services**

Consider upgrading when you need:

- **High-frequency updates** (more than hourly)
- **Large datasets** (multi-GB storage requirements)
- **Real-time processing** (sub-minute latency)
- **Advanced analytics** (machine learning pipelines)
- **Commercial reliability** (SLA guarantees)

## Getting Started: Your First Data Platform

### **1. Fork the Template**

I've created a complete template repository with:

- Pre-configured GitHub Actions workflows
- Example scraper with error handling
- API generation scripts
- Basic dashboard template
- Comprehensive documentation

**Template Repository**: `https://github.com/joel-hanson/github-data-platform-template`

### **2. Customize for Your Data Source**

```bash
git clone https://github.com/joel-hanson/github-data-platform-template.git
cd github-data-platform-template
# Update src/scraper.py with your data source
# Modify .github/workflows/daily-scrape.yml for your schedule
# Customize docs/index.html for your dashboard
```

### **3. Configure Repository Permissions**

Before your GitHub Actions can commit changes back to your repository, you need to enable the proper permissions:

1. Go to your repository settings
2. Navigate to **Actions** → **General**
3. Scroll down to **Workflow permissions**
4. Select **Read and write permissions**
5. Click **Save**

This allows your automated workflows to commit the scraped data back to your repository.

### **4. Deploy and Monitor**

```bash
git add .
git commit -m "Initial setup for my data platform"
git push origin main
# Enable GitHub Pages in repository settings
# Your API will be live at: https://username.github.io/repo-name/
```

## Best Practices for Sustainable Data Platforms

### **Respectful Scraping Ethics**

Always follow these principles when scraping data:

```python
# Include proper delays
time.sleep(random.uniform(1, 3))  # Random delay between requests

# Respect robots.txt
import urllib.robotparser
rp = urllib.robotparser.RobotFileParser()
rp.set_url("https://example.com/robots.txt")
rp.can_fetch("*", url)

# Use appropriate headers
headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; DataBot/1.0; +https://github.com/username/repo)',
    'Accept': 'text/html,application/json',
}
```

### **Monitoring and Alerting**

```yaml
# Add to your GitHub Actions workflow
- name: Notify on failure
  if: failure()
  uses: actions/github-script@v6
  with:
    script: |
      github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: 'Data scraping failed',
        body: 'Automated data collection workflow failed. Please check logs.'
      })
```

### **Documentation and Maintenance**

Create clear documentation for your data platform:

````markdown
# API Documentation

## Endpoints

### GET /api/latest.json

Returns the most recent dataset

**Response Format:**

```json
{
  "last_updated": "2025-07-26T12:00:00Z",
  "total_items": 97,
  "data": [...]
}
```
````

### Rate Limits

- No authentication required
- Cached for 5 minutes via GitHub CDN
- Updated daily at 6:00 AM UTC

## The Economics: Why This Matters

### **Cost Comparison**

**Traditional Cloud Approach:**

- AWS Lambda: $0.20 per 1M requests
- RDS Database: $25/month minimum
- CloudWatch: $10/month for logging
- API Gateway: $3.50 per million calls
- **Total: ~$40-100/month for basic setup**

**GitHub Approach:**

- GitHub Actions: Free (2,000 minutes/month for private repos)
- GitHub Pages: Free hosting
- Raw file CDN: Free bandwidth
- Version control: Free
- **Total: $0/month**

For small to medium-scale data projects, the savings are substantial while maintaining professional-grade reliability.

## What's Next: Advanced Automation

Once you master the basics, consider these advanced patterns:

### **Multi-Repository Data Pipelines**

- Source repo for raw data collection
- Processing repo for data transformation
- API repo for serving clean endpoints
- Dashboard repo for visualization

### **Cross-Repository Automation**

```yaml
- name: Trigger downstream processing
  uses: peter-evans/repository-dispatch@v2
  with:
    token: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
    repository: username/processing-repo
    event-type: data-updated
```

### **Webhook Integration**

```python
# Notify external services when data updates
def send_webhook_notification(data):
    webhook_url = "https://hooks.slack.com/services/..."
    requests.post(webhook_url, json={
        "text": f"Data updated: {len(data)} new records"
    })
```

## Conclusion: Your Free Data Empire

GitHub's combination of Actions, Pages, and raw file serving creates a surprisingly powerful data platform. You get enterprise-grade infrastructure, global CDN, automatic SSL, and professional reliability—all for free.

The approach I've outlined powers real production systems serving thousands of users. From tracking Antarctic icebergs to monitoring financial markets, the pattern scales beautifully for most data-driven applications.

**Ready to build your data platform?** Start with the template repository and customize it for your data source. Within an hour, you'll have a fully automated data collection and API serving system running on GitHub's infrastructure.

## Data Sources & Credits

This approach was inspired by real-world experience building the Antarctic Iceberg Tracker using NASA's publicly available data:

### **Original Project**

- **Antarctic Iceberg Tracker**: [https://github.com/Joel-hanson/Iceberg-locations](https://github.com/Joel-hanson/Iceberg-locations)
- **Live Demo**: [https://joel-hanson.github.io/Iceberg-locations/](https://joel-hanson.github.io/Iceberg-locations/)

### **Template Repositories**

I've created complete working examples that demonstrate this approach:

- **GitHub Data Platform Template**: [https://github.com/joel-hanson/github-data-platform-template](https://github.com/joel-hanson/github-data-platform-template)

  - Generic template with example scraper and dashboard
  - Pre-configured GitHub Actions workflows
  - Complete documentation and setup guide

- **Weather API Project**: [https://github.com/Joel-hanson/weather-api-project](https://github.com/Joel-hanson/weather-api-project)
  - Real-world example scraping weather data
  - Hourly automated updates
  - Interactive weather dashboard with charts

---

_Ready to transform GitHub into your personal data platform? Fork the template, customize for your data source, and launch your free API in minutes. The power of enterprise-grade data infrastructure is just a git push away._

_For more Kafka Connect tips and open-source tools, follow the [blog series](https://joel-hanson.github.io/posts/) and star the [repository](https://github.com/Joel-hanson/github-data-platform-template), [weather API project](https://github.com/Joel-hanson/weather-api-project), and [Iceberg Tracker](https://github.com/Joel-hanson/Iceberg-locations)._
