---
title: "Configuring Kafka Connector with Docker: A Step-by-Step Guide"
date: 2024-10-12T12:17:49+05:30
draft: false 
---

In this tutorial, we'll walk through the process of setting up a Kafka connector using Docker and docker-compose.yml. We'll focus on configuring a file connector, which is useful for reading data from files and writing data to files using Kafka.

> #### *[Link to repository](https://github.com/Joel-hanson/kafka-connector-docker-setup)*

## Prerequisites

- Docker and Docker Compose installed on your system
- Basic understanding of Kafka and Docker concepts

## Project Structure

Before we begin, let's look at the files we'll be working with:

1. `docker-compose.yml`: Defines our services (Kafka and Kafka Connect)
2. `Dockerfile`: Custom image for Kafka Connect
3. `entrypoint.sh`: Script to configure and start Kafka Connect
4. `plugins.sh`: Script to set up the necessary connector plugins
5. `custom-plugins/`: Directory for storing custom/external connector plugins

## Step 1: Setting up the Docker Compose File

Our `docker-compose.yml` file defines two services: `kafka` and `connect`. Here's a breakdown of the important configurations:

```yaml
version: "3"
services:
  kafka:
    image: apache/kafka:latest
    # ... (Kafka configuration)

  connect:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      kafka:
        condition: service_healthy
    ports:
      - 8083:8083
    environment:
      BOOTSTRAP_SERVERS: kafka:9092
      REST_ADVERTISED_HOST_NAME: connect
      REST_PORT: 8083
      GROUP_ID: compose-connect-group
      CONFIG_STORAGE_TOPIC: docker-connect-configs
      OFFSET_STORAGE_TOPIC: docker-connect-offsets
      STATUS_STORAGE_TOPIC: docker-connect-status
      KEY_CONVERTER: "org.apache.kafka.connect.storage.StringConverter"
      VALUE_CONVERTER: "org.apache.kafka.connect.json.JsonConverter"
      CONFIG_STORAGE_REPLICATION_FACTOR: 1
      OFFSET_STORAGE_REPLICATION_FACTOR: 1
      STATUS_STORAGE_REPLICATION_FACTOR: 1
      CONNECTOR_CLIENT_CONFIG_OVERRIDE_POLICY: All
      CONNECT_PLUGIN_PATH: "/opt/kafka/plugins"
    volumes:
      - ./data:/data
      - ./custom-plugins:/opt/kafka/custom-plugin
```

The `connect` service is built from our custom Dockerfile and depends on the `kafka` service. We've set up environment variables to configure Kafka Connect, including the bootstrap servers, storage topics, and converters.

## Step 2: Creating the Dockerfile

Our Dockerfile sets up the Kafka Connect image:

```dockerfile
FROM apache/kafka:latest

WORKDIR /opt/kafka

EXPOSE 8083

RUN mkdir /opt/kafka/plugins 

COPY plugins.sh .
RUN sh plugins.sh

COPY entrypoint.sh .

ENTRYPOINT ["./entrypoint.sh"]
CMD ["start"]
```

This Dockerfile:

1. Uses the latest Apache Kafka image as the base
2. Creates a plugins directory
3. Copies and runs the `plugins.sh` script to set up connectors
4. Copies the `entrypoint.sh` script
5. Sets the entrypoint to our custom script

## Step 3: Configuring the Entrypoint Script

The `entrypoint.sh` script is responsible for configuring and starting Kafka Connect. It:

1. Sets default environment variables
2. Configures logging
3. Processes Kafka Connect properties
4. Starts the Kafka Connect distributed worker

## Step 4: Setting up Connector Plugins

The `plugins.sh` script copies the necessary connector JARs to the plugins directory:

```bash
#!/bin/usr/env bash

set -eo pipefail

KAFKA_HOME=${KAFKA_HOME:-/opt/kafka}
KAFKA_CONNECT_PLUGINS_DIR=${KAFKA_CONNECT_PLUGINS_DIR:-/opt/kafka/plugins}

# Copy the necessary connector JARs
cp "$KAFKA_HOME"/libs/connect-file-*.jar "$KAFKA_CONNECT_PLUGINS_DIR"
cp "$KAFKA_HOME"/libs/kafka-clients-*.jar "$KAFKA_CONNECT_PLUGINS_DIR"
cp "$KAFKA_HOME"/libs/connect-api-*.jar "$KAFKA_CONNECT_PLUGINS_DIR"
cp "$KAFKA_HOME"/libs/connect-transforms-*.jar "$KAFKA_CONNECT_PLUGINS_DIR"

echo "Kafka File Source and Sink connectors have been set up in $KAFKA_CONNECT_PLUGINS_DIR"

# List the installed connector JARs
echo "Installed connector JARs:"
ls -1 "$KAFKA_CONNECT_PLUGINS_DIR"

echo "Done!"
```

This script ensures that the file connector and necessary dependencies are available in the plugins directory.

## Step 5: Running the Setup

To start the Kafka and Kafka Connect services:

1. Make sure all files (`docker-compose.yml`, `Dockerfile`, `entrypoint.sh`, and `plugins.sh`) are in the same directory.
2. Create a `data` directory in the same location for file connector data.
3. Run the following command:

```bash
docker-compose up -d
```

This command will build the custom Kafka Connect image and start both the Kafka and Kafka Connect services.

## Step 6: Configuring a File Connector

Now that our services are running, we can configure a file connector. Here's an example of how to create a file source connector:

1. Create a file named `source.txt` in the `data` directory with some sample content.

2. Use the following curl command to create the connector:

```bash
curl -X POST http://localhost:8083/connectors -H "Content-Type: application/json" -d '{
  "name": "file-source",
  "config": {
    "connector.class": "org.apache.kafka.connect.file.FileStreamSourceConnector",
    "file": "/data/source.txt",
    "topic": "file-topic"
  }
}'
```

This will create a source connector that reads from `/data/source.txt` and writes to the `file-topic` Kafka topic.

To create a file sink connector, use:

```bash
curl -X POST http://localhost:8083/connectors -H "Content-Type: application/json" -d '{
  "name": "file-sink",
  "config": {
    "connector.class": "org.apache.kafka.connect.file.FileStreamSinkConnector",
    "file": "/data/sink.txt",
    "topics": "file-topic"
  }
}'
```

This will create a sink connector that reads from the `file-topic` Kafka topic and writes to `/data/sink.txt`.

## Step 7: Verifying the Setup

After setting up your connectors, it's important to verify that everything is working correctly. Here are some ways to do that:

### Checking Topics

To verify if the topic is created, you can list all topics:

```bash
docker-compose exec kafka ./opt/kafka/bin/kafka-topics.sh --list --bootstrap-server localhost:9092
```

You should see `file-topic` in the list of topics.

### Consuming Messages

To verify that messages are being produced to the topic, you can use the Kafka console consumer:

```bash
docker exec -it kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic file-topic --from-beginning
```

This command will display all messages in the `file-topic` from the beginning.

### Checking Connector Status

You can use the Kafka Connect REST API to check the status of your connectors. Here are some useful curl commands:

1. List all connectors:

   ```bash
   curl http://localhost:8083/connectors
   ```

2. Check the status of a specific connector (e.g., file-source):

   ```bash
   curl http://localhost:8083/connectors/file-source/status
   ```

3. Check the offsets of a specific connector:

   ```bash
   curl http://localhost:8083/connectors/file-source/offsets
   ```

These commands will help you verify that your connectors are running correctly and processing data as expected.

## Adding Custom Connector Plugins

While our setup includes the file connector by default, you might want to add other custom connector plugins. You can do this easily using Docker volumes. Here's how:

1. Create a directory for your custom plugins:

   ```bash
   mkdir -p custom-plugins
   ```

2. Add your custom connector JAR files to this directory.

3. Modify the `docker-compose.yml` file to add a volume for the custom plugins. Add the following under the `volumes` section of the `connect` service:

   ```yaml
   volumes:
     - ./data:/data
     - ./custom-plugins:/opt/kafka/custom-plugins
   ```

4. Update the `CONNECT_PLUGIN_PATH` environment variable in the `docker-compose.yml` file:

   ```yaml
   environment:
     # ... other environment variables ...
     CONNECT_PLUGIN_PATH: "/opt/kafka/plugins,/opt/kafka/custom-plugins"
   ```

5. Restart your services:

   ```bash
   docker-compose down
   docker-compose up -d
   ```

6. Verify the plugins:

  ```bash
  curl http://localhost:8083/connector-plugins/
  ```

Now, Kafka Connect will load any connector plugins found in your `custom-plugins` directory.

Example: Adding the Aiven JDBC connector:

1. Download the connector JAR from the Aiven JDBC connector releases.
2. Place the JAR file in your `custom-plugins` directory.
3. Restart the services as described above.
4. You should now be able to use the JDBC connector in your Kafka Connect setup.

Remember to check the documentation of any custom connectors you add, as they may require additional configuration or dependencies.

## Conclusion

In this tutorial, we've walked through the process of setting up Kafka and Kafka Connect using Docker and docker-compose.yml. We've also demonstrated how to configure file source and sink connectors. This setup provides a flexible foundation for building data pipelines with Kafka, allowing you to easily connect various data sources and sinks to your Kafka cluster.

For a more comprehensive approach to Kafka connector development, including extensive integration testing with TestContainers, check out our [Kafka Connector Template](https://github.com/Joel-hanson/kafka-connector-template) which includes a complete testing framework based on proven patterns from production connectors.

Remember to monitor your connectors and Kafka cluster for performance and adjust configurations as needed for your specific use case.

---

*For more Kafka Connect tips and open-source tools, follow the [blog series](/posts/)*
