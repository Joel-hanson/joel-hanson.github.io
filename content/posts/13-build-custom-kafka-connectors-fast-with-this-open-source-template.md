---
title: "Build Custom Kafka Connectors Fast with This Open-Source Template"
date: 2025-04-14T16:19:42+05:30
summary: "Apache Kafka is a powerful distributed event streaming platform, and **Kafka Connect** makes it easy to integrate Kafka with external systems. While many pre-built connectors exist, real-world applications often need **custom connectors** tailored for proprietary systems, custom logic, or advanced error handling.

That’s where this **production-ready template** comes in—it removes the boilerplate and gives you everything you need to build, test, and deploy connectors with ease."
tags: ["Kafka Connect", "kafka", "template"]
categories: ["Kafka"]
---

🔗 **GitHub Repository**: [github.com/Joel-hanson/kafka-connector-template](https://github.com/Joel-hanson/kafka-connector-template)  
⭐ **Star the repo** to stay updated!

Apache Kafka is a powerful distributed event streaming platform, and **Kafka Connect** makes it easy to integrate Kafka with external systems. While many pre-built connectors exist, real-world applications often need **custom connectors** tailored for proprietary systems, custom logic, or advanced error handling.

That’s where this **production-ready template** comes in—it removes the boilerplate and gives you everything you need to build, test, and deploy connectors with ease.

### Use This Template to Kickstart Your Own Connector

Instead of cloning and manually renaming everything, you can use the **GitHub Template feature** to instantly create your own connector project with this structure.

#### Steps to Create Your Project from This Template

1. **Go to the Template Repo**  
   [github.com/Joel-hanson/kafka-connector-template](https://github.com/Joel-hanson/kafka-connector-template)

2. **Click “Use this template”**  
   At the top of the repo, hit the green `Use this template` button.

3. **Fill in Your Project Details**  
   - Set the **repository name**
   - Add a **description**
   - Choose if you want it to be public or private

4. **Click “Create repository from template”**

5. **Clone Your New Repo**

   ```bash
   git clone https://github.com/your-username/your-connector-repo.git
   cd your-connector-repo
   ```

6. **Start Building**
   - Modify the connector classes under `src/main/java`
   - Update your `pom.xml` with any new dependencies
   - Customize Docker configs and connector configs in `/config`

> 🧠 Tip: Don’t forget to replace package names (`com.example.kafka.connect`) with your own!

### Why Use This Template?

Building a Kafka connector from scratch can take days or even weeks. This open-source template gives you a **5-minute head start**:

✅ Skip complex setup – Docker, Kafka (KRaft), and CI/CD are preconfigured  
✅ Focus on logic – Just implement your business-specific code  
✅ Test confidently – Comes with ready-to-run test suites  
✅ Go production – Includes Docker health checks, error handling patterns, and more

### Tech Stack & Project Structure

This template includes:

- **Apache Kafka (KRaft mode)** – No ZooKeeper needed  
- **Kafka Connect** with both **source and sink** examples  
- **Docker** for running Kafka, Connect, and ZooKeeper-free clusters  
- **Maven** for dependency management  
- **GitHub Actions** for automated testing

📁 **Directory Layout:**

```text
kafka-connector-template/
├── .github/           # CI/CD workflows
├── config/            # Connector configs
├── docker/            # Docker setup (KRaft mode)
├── src/               # Java source and test code
│   ├── main/
│   └── test/
├── pom.xml            # Maven config
└── README.md
```

### Quick Start in 5 Minutes

#### 1. Clone and Build the Project

```bash
git clone https://github.com/Joel-hanson/kafka-connector-template.git
cd kafka-connector-template
mvn clean package
```

#### 2. Start Kafka + Connect (KRaft Mode)

```bash
cd docker
docker-compose up -d
```

#### 3. Deploy the Example Source Connector

```bash
curl -X POST -H "Content-Type: application/json" \
  --data @config/source-connector.json \
  http://localhost:8083/connectors
```

#### 4. Validate It’s Working

```bash
docker exec -it kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic example-source-topic
```

### 🧩 Building Your Own Connector

### 🔌 Implementing a Source Connector

A **source connector** pulls data from external systems into Kafka.

Edit:

```java
src/main/java/com/example/kafka/connect/source/ExampleSourceConnector.java
src/main/java/com/example/kafka/connect/source/ExampleSourceTask.java
```

Sample:

```java
public class MySourceConnector extends SourceConnector {
    @Override
    public void start(Map<String, String> props) {
        // Initialization logic
    }

    @Override
    public Class<? extends Task> taskClass() {
        return MySourceTask.class;
    }

    @Override
    public List<Map<String, String>> taskConfigs(int maxTasks) {
        // Configure tasks
    }
}
```

### 📥 Implementing a Sink Connector

A **sink connector** moves data from Kafka to an external system.

Edit:

```java
src/main/java/com/example/kafka/connect/sink/ExampleSinkConnector.java
src/main/java/com/example/kafka/connect/sink/ExampleSinkTask.java
```

Sample:

```java
public class MySinkTask extends SinkTask {
    @Override
    public void put(Collection<SinkRecord> records) {
        // Write to destination
    }
}
```

### Docker Highlights

Running Kafka with **KRaft** (no ZooKeeper) is easier than ever.

`docker/docker-compose.yml` includes:

```yaml
kafka:
  image: apache/kafka:3.6.0
  environment:
    KAFKA_PROCESS_ROLES: controller,broker
    KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
    ...
```

Start it with:

```bash
docker-compose up -d
```

### Testing Connectors

#### Run Unit Tests

```bash
mvn test
```

The template includes:

- Validation of connector configs
- Sample source/sink connector tests

### **Deploying the Connector via REST API**

Once Kafka Connect is running, deploy your connector:

#### **POST the Configuration**

```bash
curl -X POST -H "Content-Type: application/json" \
  --data '{
    "name": "source-connector",
    "config": {
      "connector.class": "com.example.kafka.connect.source.SourceConnector",
      "tasks.max": "1",
      "topic": "test-topic",
      "poll.interval.ms": "5000"
    }
  }' \
  http://localhost:8083/connectors
```

#### **Check Connector Status**

```bash
curl http://localhost:8083/connectors/source-connector/status | jq
```

### Common Issues & Fixes

**Docker Volume Issues:**

```bash
docker-compose down -v && docker-compose up --build
```

**Connector Doesn’t Load?**

- Ensure your `.jar` is in the right path
- Restart Kafka Connect:

```bash
docker restart connect
```

### Ready for Production?

Here’s how to take it to the next level:

✅ **Enable SSL and Auth** in `connect-distributed.properties`  
✅ Add **Prometheus metrics** for monitoring  
✅ Use **dead-letter queues and retry logic** for error handling  
✅ Set `config.storage.replication.factor=3` for HA setups

### Contributing

Want to improve the template or report a bug?  

1. Fork the repo  
2. Make your changes  
3. Open a PR!

### **Further Reading**

- [Kafka Connect Documentation](https://kafka.apache.org/documentation/#connect)

⭐ **Star the template** → [github.com/Joel-hanson/kafka-connector-template](https://github.com/Joel-hanson/kafka-connector-template)  
🐞 **Submit issues** → Help improve this for the whole Kafka community!
