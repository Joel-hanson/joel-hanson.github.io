---
title: "Tracking Antarctic Giants: Building a Real-Time Iceberg Monitor with NASA Data"
date: 2025-07-26T12:14:10+05:30
categories: [Python, Data Science, Web Development, NASA APIs]
tags: [geospatial, data-visualization, cli-tools, web-scraping, api-development]
description: "How I built a comprehensive system to track massive Antarctic icebergs using NASA satellite data, complete with interactive maps, APIs, and movement animations."
cover:
  image: "/images/18-iceberg-locations/iceberg-tracker.png"
  alt: "Antarctic iceberg tracking system visualization"
  caption: "_Real-time iceberg monitoring dashboard showing Antarctic giants drifting through the Southern Ocean_"
  relative: true
  responsiveImages: true
---

_Ever wondered where those massive icebergs the size of cities are drifting? I built a system to track them in real-time using NASA satellite data._

## The Problem: Lost Giants in the Southern Ocean

Antarctic icebergs are some of the most fascinating phenomena on Earth. These floating ice mountains—some larger than entire countries—break off from ice shelves and drift across the Southern Ocean for years. But tracking their movements has always been challenging.

When iceberg A23A (nicknamed the "world's largest iceberg") started moving again after being grounded for 30+ years, I realized there wasn't an easy way for curious people like me to follow these giants' journeys.

**That's when I decided to build one.**

**Try it out & contribute:** [GitHub Repo](https://github.com/Joel-hanson/Iceberg-locations)

## The Original Motivation: Tracking Iceberg A68

My journey began with a specific goal: tracking [Iceberg A68](https://www.scp.byu.edu/data/iceberg/A68tracking.html), which was once the world's largest iceberg. When A68 calved from the Larsen C ice shelf in 2017, it captured global attention as it began its epic journey across the Southern Ocean.

The challenge was that while NASA's Scatterometer Climate Record Pathfinder (SCP) database at BYU provided excellent tracking data, it wasn't easily accessible to developers or the general public. The data existed, but there was no programmatic way to access it or integrate it into applications.

I wanted to:

- **Create an API** that could programmatically access A68's location data
- **Demonstrate web scraping techniques** for extracting scientific data
- **Build a reusable system** that could track not just A68, but any iceberg in the database
- **Make the data accessible** through modern web technologies (JSON APIs, interactive maps)

What started as a focused effort to track one remarkable iceberg evolved into a comprehensive system capable of monitoring 97+ icebergs across multiple observation periods. The project became a perfect example of how to transform static scientific data into dynamic, accessible information.

## What I Built: A Complete Iceberg Tracking Ecosystem

The [Antarctic Iceberg Tracker](https://github.com/Joel-hanson/Iceberg-locations) isn't just a simple data scraper—it's a comprehensive system that:

### **Real-Time Data Collection**

The system automatically scrapes NASA's Scatterometer Climate Record Pathfinder (SCP) database, tracking 97+ unique icebergs across 37 observation dates. It processes over 1,800 location records with precise GPS coordinates, ensuring comprehensive coverage of Antarctic iceberg movements.

### **Interactive Visualization**

I built a beautiful web-based map with a professional UI inspired by shadcn/ui design principles. The interface features real-time iceberg positions with color-coded series (A, B, C, D series) and detailed popup information showing coordinates, observation dates, and data freshness indicators.

### **Movement Animations**

- Integration with NASA SCP historical movement GIFs
- Visual drift patterns showing years of iceberg journeys
- Direct links to animation files for each tracked iceberg

### **API for Developers**

The system provides RESTful JSON endpoints for external integrations with real-time data access via GitHub raw URLs. It includes JSONP support for cross-origin requests, making it easy for web applications to integrate iceberg tracking data.

**Available API Endpoints:**

- **Latest Data**: <https://raw.githubusercontent.com/Joel-hanson/Iceberg-locations/main/api/latest.json>
- **All Historical Data**: <https://raw.githubusercontent.com/Joel-hanson/Iceberg-locations/main/iceberg_location.json>
- **JSONP Support**: <https://raw.githubusercontent.com/Joel-hanson/Iceberg-locations/main/api/latest.jsonp>

## The Technical Journey: From Monolith to Modular

After the initial version was working, I identified several areas that needed improvement to make the system more robust and maintainable:

### **Problem 1: Inconsistent NASA Data Handling**

The original version had issues with NASA's SCP database because it contains mixed coordinate formats—some in decimal degrees, others in degrees-minutes-seconds (DMS). This caused positioning errors on the map. I updated the system with a smart parser:

```python
def convert_coordinates(lat, lon):
    # Handle both -7545.0 (DMS) and -75.75 (decimal) formats
    if abs(lat) >= 100:  # DMS format detected
        degrees = int(abs(lat) / 100)
        minutes = abs(lat) % 100
        return -(degrees + minutes/60) if lat < 0 else (degrees + minutes/60)
    return lat  # Already decimal
```

### **Problem 2: Incorrect Date Ordering**

The previous version used simple string sorting for dates, which made "11/11/21" appear "newer" than "01/04/22", showing outdated data as current. I fixed this with proper datetime parsing:

```python
def get_latest_date(data):
    dates_with_dt = [(d, datetime.strptime(d, "%m/%d/%y")) for d in data.keys()]
    dates_with_dt.sort(key=lambda x: x[1])  # Sort by actual datetime
    return dates_with_dt[-1][0]  # Return latest date string
```

## Automated Data Updates with GitHub Actions

One of the most powerful features of this system is its automated data collection pipeline. Instead of manually checking for new iceberg data, the system runs autonomously:

```yaml
name: Daily Data Collection

on:
  schedule:
    - cron: "0 0 * * *" # Every day at midnight

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: "3.9"

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt

      - name: Run data scraper
        run: python main.py scrape
```

### **How It Works**

The system uses scheduled GitHub Actions to run the scraper daily, automatically checking for new iceberg data from NASA's database. This automated data processing workflow collects, validates, and updates iceberg positions without any manual intervention, then regenerates the interactive map with the latest information.

### **Daily Data Collection**

GitHub Actions automatically runs the scraper every day at a configured time, ensuring the interactive map and API always reflect the latest available NASA data. Once configured, the system operates with zero maintenance required.

### **Smart Update Process**

The automated workflow performs these steps:

1. **Scrapes the NASA SCP database** for new iceberg positions
2. **Processes and validates** the collected data for accuracy
3. **Updates JSON APIs** with the latest information
4. **Regenerates the interactive map** with new positions
5. **Commits changes** back to the repository automatically

### **Reliability Features**

The system includes comprehensive error handling that gracefully retries if NASA's servers are temporarily unavailable. It validates all data for malformed coordinates or missing information before publishing, maintains previous data if new collection fails, and provides detailed logs to monitor automation health.

### **Benefits of Automation**

This automated approach ensures visitors always see the most recent iceberg positions without delays. The system can easily scale to track hundreds of icebergs without increasing maintenance burden, provides complete transparency through GitHub commit history, and leverages free GitHub Actions instead of costly hosting solutions.

This automation transforms a manual data collection task into a reliable, self-maintaining system that keeps iceberg tracking data current 24/7.

## See It In Action

### **Try the Live Demo**

Visit the interactive map: [View Iceberg Locations](https://joel-hanson.github.io/Iceberg-locations/output/iceberg_map.html)

### **Use the API**

```javascript
// Get latest iceberg data
fetch(
  "https://raw.githubusercontent.com/Joel-hanson/Iceberg-locations/main/api/latest.json"
)
  .then((response) => response.json())
  .then((data) => console.log(`Tracking ${data.total_icebergs} icebergs!`));
```

### **Install & Run Locally**

```bash
git clone https://github.com/Joel-hanson/Iceberg-locations.git
cd Iceberg-locations
pip install -r requirement.txt

# Generate interactive map
python main.py map

# Show current stats
python main.py info

# View animation URLs
python main.py animations
```

## Data Sources & Credits

This project wouldn't be possible without the excellent work of researchers and institutions who make iceberg tracking data publicly available:

### **Primary Data Source**

- **NASA Scatterometer Climate Record Pathfinder (SCP)** - Hosted by Brigham Young University
- **Website**: [https://www.scp.byu.edu/](https://www.scp.byu.edu/)
- **Iceberg Database**: [https://www.scp.byu.edu/data/iceberg/](https://www.scp.byu.edu/data/iceberg/)
- **A68 Tracking**: [https://www.scp.byu.edu/data/iceberg/A68tracking.html](https://www.scp.byu.edu/data/iceberg/A68tracking.html)

### **Research Credit**

Special thanks to the researchers at BYU's Microwave Earth Remote Sensing (MERS) Laboratory who maintain this valuable dataset and make it freely accessible for research and educational purposes.

### **Important Note**

This project is built for educational and research purposes. All data is sourced from publicly available NASA/BYU databases. If you use this project or its data, please consider citing the original SCP database in your work.

---

_Interested in tracking Earth's giants? Fork the repo, contribute improvements, or just explore the fascinating world of Antarctic icebergs through the interactive map!_

_For more Kafka Connect tips and open-source tools, follow the [blog series](https://joel-hanson.github.io/posts/) and star the [repository](https://github.com/Joel-hanson/Iceberg-locations)._
