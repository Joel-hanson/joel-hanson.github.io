---
title: "Setting Up a Kafka Cluster Without Zookeeper Using Docker"
date: 2024-10-05T23:14:04+05:30
draft: false 
---

### Introduction

In this post, we will walk through the process of setting up an Apache Kafka cluster **without using Zookeeper**, leveraging Kafka's **KRaft mode** for metadata management. Kafka no longer requires a Zookeeper instance, simplifying the cluster setup. We will use **Docker** to deploy this Kafka cluster with the latest version of Kafka.

### Prerequisites

Ensure that you have the following:

- Docker installed
- Docker compose installed
- Basic understanding of Kafka concepts (e.g., brokers, partitions)

### Step 1: Kafka Cluster Setup

Let’s use the following **Docker Compose** configuration to set up the Kafka broker in **KRaft mode**:

```yaml
version: '3'
services:
  broker:
    image: apache/kafka:latest
    container_name: broker
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller               # The node acts as both broker and controller
      KAFKA_LISTENERS: PLAINTEXT://localhost:9092,CONTROLLER://localhost:9093  # Ports for broker and controller
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092                  # External listener for clients
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER         # Listener name for inter-controller communication
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT  # Security protocol for listeners
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093    # Quorum voters for the controller in KRaft mode
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1           # Replication factor for the offsets topic
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1   # Replication factor for transaction logs
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1              # Minimum in-sync replicas for transactional logs
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0           # Initial delay before consumer group rebalancing
      KAFKA_NUM_PARTITIONS: 3                             # Default number of partitions for new topics
    ports:
      - "9092:9092"     # Port for Kafka broker
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "./opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 > /dev/null 2>&1",
        ]
      interval: 10s
      timeout: 10s
      retries: 5
```

### Step 2: Breakdown of Kafka Configuration

Let’s break down each configuration setting:

- **KAFKA_NODE_ID**: Specifies the unique ID of the node in the Kafka cluster. In KRaft mode, this ID identifies both brokers and controllers.

- **KAFKA_PROCESS_ROLES**: Defines the roles of the node. In this setup, the node will act as both a broker and a controller.

- **KAFKA_LISTENERS**: Specifies the endpoints that Kafka will bind to for communication. Here, we use port `9092` for the broker and `9093` for the controller.

- **KAFKA_ADVERTISED_LISTENERS**: This is the address that Kafka will advertise to clients for connecting to the broker. External clients use this address to connect.

- **KAFKA_CONTROLLER_LISTENER_NAMES**: Defines the listener name used for controller-to-controller communication. This is set to `CONTROLLER` for KRaft mode.

- **KAFKA_LISTENER_SECURITY_PROTOCOL_MAP**: Maps the listeners to their respective security protocols. In this case, both the controller and broker listeners use PLAINTEXT (i.e., no encryption).

- **KAFKA_CONTROLLER_QUORUM_VOTERS**: Specifies the quorum voters in the KRaft mode, which manage the metadata. Here, we define one controller voter on `localhost:9093`.

- **KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR**: Sets the replication factor for the Kafka consumer offsets topic, which tracks consumer progress. For simplicity, it's set to `1` in this single-node setup.

- **KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR**: Defines the replication factor for Kafka's transactional state logs. Since we are running a single broker, this is set to `1`.

- **KAFKA_TRANSACTION_STATE_LOG_MIN_ISR**: Specifies the minimum number of in-sync replicas required for transactional state logs. This is also set to `1` in a single-node cluster.

- **KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS**: Defines the initial delay (in milliseconds) before rebalancing consumer groups. Setting it to `0` minimizes the delay in group rebalancing.

- **KAFKA_NUM_PARTITIONS**: Defines the default number of partitions for new topics. We set this to `3`, but you can adjust it based on your needs.

### Step 3: Running the Kafka Cluster

To bring up the Kafka broker, follow these steps:

1. Save the above configuration into a `docker-compose.yml` file.
2. Run the following command in the same directory:

    ```bash
    docker-compose up -d
    ```

3. To verify that the Kafka broker is running, you can check the logs:

    ```bash
    docker logs broker
    ```

### Step 4: Interacting with Kafka

You can now interact with your Kafka cluster. For example, to create a topic or send messages, you can use Kafka CLI tools. Here’s how you can produce and consume messages.

#### Producing a message

```bash
docker exec -it broker ./opt/kafka/bin/kafka-console-producer.sh --broker-list localhost:9092 --topic test-topic
```

#### Consuming messages

```bash
docker exec -it broker ./opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-topic --from-beginning
```

### Conclusion

In this blog post, we demonstrated how to set up a Kafka cluster without Zookeeper using **KRaft mode** and **Docker**. KRaft simplifies the architecture by eliminating the need for an external Zookeeper service, making it easier to manage and scale Kafka clusters.

Please refer to the official docker [page](https://hub.docker.com/r/apache/kafka) for more detailed information.

Feel free to experiment with this setup and adjust the configuration for your specific use case!
