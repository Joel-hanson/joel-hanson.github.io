---
title: "Mastering Integration Testing for Kafka Connectors: A Complete Guide"
date: 2025-07-13T21:40:00+05:30
slug: mastering-integration-testing-for-kafka-connectors-a-complete-guide
description: "Learn how to effectively test Kafka Connectors with integration tests, ensuring reliability and performance in production. This guide covers setup, testing strategies, and best practices."
author: "Joel Hanson"
summary: "Integration testing is crucial for Kafka Connectors to ensure they work correctly with external systems. This guide provides a comprehensive approach to setting up and executing integration tests for Kafka Connectors, covering everything from environment setup to best practices for testing source and sink connectors."
tags: ["Kafka Connect", "kafka", "template"]
categories: ["Kafka"]
showtoc: true
---

🔗 **GitHub Repository**: [github.com/Joel-hanson/kafka-connector-template](https://github.com/Joel-hanson/kafka-connector-template)  
⭐ **Star the repo** to stay updated!

In the [first part of this series](https://joel-hanson.github.io/posts/13-build-custom-kafka-connectors-fast-with-this-open-source-template/), we explored how an open-source Kafka Connector Template accelerates connector development. Now, let's tackle a critical next step: **writing integration tests** to ensure your connector works flawlessly in real-world scenarios. I recently enhanced the template with a testing framework ([see PR #1](https://github.com/Joel-hanson/kafka-connector-template/pull/1/files)), and here's how you can leverage it.

*Building on our [Kafka Connector Template](https://joel-hanson.github.io/posts/13-build-custom-kafka-connectors-fast-with-this-open-source-template/), this post dives deep into integration testing - the crucial but often overlooked aspect of connector development.*

## Why Integration Tests Are Critical for Kafka Connectors

The mental model for integration testing in Kafka Connect is to validate the end-to-end functionality of your connectors. This means testing how your connector interacts with a real Kafka cluster, ensuring it can produce and consume messages, handle errors, and manage configurations correctly.

The whole setup is designed to run integration tests against a real Kafka cluster using TestContainers, which provides a lightweight and isolated environment for testing. This allows you to focus on writing tests that validate your connector's functionality without worrying about the underlying infrastructure.

**Testing Framework Foundation**: The integration testing framework in our template is based on the robust testing approach from the [Aiven JDBC Connector for Apache Kafka](https://github.com/Aiven-Open/jdbc-connector-for-apache-kafka). This proven foundation provides battle-tested patterns for Kafka Connect integration testing, including TestContainers setup, embedded Connect runtime, and comprehensive test utilities. I have adapted and enhanced these patterns to create a reusable testing framework that works with any custom connector.

The integration test starts off with the AbstractIT.java class, which serves as the foundation for our integration tests and provides the necessary infrastructure for running tests against a real Kafka cluster. The ConnectRunner.java class is where the magic happens - it creates an embedded Kafka Connect runtime for testing. It also manages the lifecycle of connectors, allowing us to focus on writing tests without worrying about the underlying infrastructure.

`AbstractIT.java` - The `AbstractIT` class is the backbone of our integration testing framework. It provides:

`ConnectRunner.java` - The `ConnectRunner` class is where the magic happens - it creates an embedded Kafka Connect runtime for testing. It also manages the lifecycle of connectors, allowing us to focus on writing tests without worrying about the underlying infrastructure.

### The Reality of Kafka Connect Development

Building a Kafka connector isn't just about implementing the `SourceTask` and `SinkTask` interfaces. Real-world connectors must handle:

- **Complex Data Flows**: Data transformations, schema evolution, and error handling
- **Distributed Environments**: Multiple tasks, offset management, and fault tolerance
- **Kafka Integration**: Topic management, consumer group coordination, and serialization
- **External Systems**: Database connections, API calls, and network failures

Unit tests alone cannot validate these interactions. You need integration tests that verify your connector works end-to-end with:

- Real Kafka clusters
- Actual topic creation and message flow
- Connector lifecycle management
- Error scenarios and recovery

### What Integration Tests Catch That Unit Tests Miss

```java
// Unit test - tests in isolation
@Test
void testSinkTaskProcessRecord() {
    SinkRecord record = createTestRecord();
    task.put(Collections.singletonList(record));
    // Verify method calls, but not actual Kafka integration
}

// Integration test - tests real-world scenarios
@Test
void testSinkConnectorEndToEnd() throws Exception {
    // Start real Kafka cluster
    // Create connector with actual configuration
    getConnectRunner().createConnector(connectorConfig);
    
    // Send real messages to Kafka
    producer.send(new ProducerRecord<>(SINK_TOPIC_NAME, "key", jsonMessage));
    
    // Verify connector processes messages and interacts with external system
    await().atMost(Duration.ofSeconds(30))
           .untilAsserted(() -> assertThat(externalSystemCalls).isNotEmpty());
}

@Test
public void testSourceConnectorBasicFunctionality() throws Exception {
    // Create and start the source connector
    getConnectRunner().createConnector(connectorConfig);

    // Wait for connector to produce messages
    await().atMost(Duration.ofSeconds(30)).pollInterval(Duration.ofSeconds(2)).untilAsserted(() -> {
        ConsumerRecords<String, String> records = consumeFromSourceTopic();

        // Verify that messages were produced
        assertThat(records.count()).isGreaterThan(0);
    });
}
```

---

## Understanding Integration Tests in the Kafka Connect Context

### What Makes Kafka Connect Integration Testing Unique

Kafka Connect introduces several layers of complexity:

1. **Connector Framework**: The Connect runtime manages connector lifecycle
2. **Distributed Coordination**: Multiple workers coordinate through Kafka topics
3. **Offset Management**: Connector state is stored in Kafka topics
4. **Plugin System**: Connectors are loaded as plugins with class isolation
5. **REST API**: Configuration and monitoring through HTTP endpoints

### Integration Test Hierarchy

```text
┌─────────────────────────────────────────┐
│           Integration Tests             │
├─────────────────────────────────────────┤
│ • End-to-end connector behavior         │
│ • Real Kafka cluster interaction        │
│ • Configuration validation              │
│ • Error handling and recovery           │
│ • Performance under load                │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│             Unit Tests                  │
├─────────────────────────────────────────┤
│ • Individual method testing             │
│ • Configuration parsing                 │
│ • Data transformation logic             │
│ • Mocked external dependencies          │
└─────────────────────────────────────────┘
```

### Types of Integration Tests for Connectors

1. **Configuration Tests**: Validate connector configuration handling
2. **Functionality Tests**: Test core source/sink operations
3. **Error Handling Tests**: Verify graceful failure scenarios
4. **Performance Tests**: Ensure connector meets throughput requirements
5. **Compatibility Tests**: Test with different Kafka versions

---

## Writing Effective Integration Tests

### Test Structure Pattern

Our integration tests follow a consistent pattern:

```java
@Test
public void testConnectorFeature() throws Exception {
    // 1. Setup: Configure the connector
    Map<String, String> config = createConnectorConfig();
    
    // 2. Action: Start the connector
    getConnectRunner().createConnector(config);
    
    // 3. Interact: Send/receive data
    sendTestData();
    
    // 4. Verify: Assert expected behavior
    await().atMost(Duration.ofSeconds(30))
           .untilAsserted(() -> assertExpectedOutcome());
    
    // 5. Cleanup: Handled by @AfterEach
}
```

### Example: Source Connector Integration Test

```java
@Test
public void testSourceConnectorBasicFunctionality() throws Exception {
    log.info("Testing basic source connector functionality");

    // Create and start the source connector
    Map<String, String> connectorConfig = createSourceConnectorConfig();
    getConnectRunner().createConnector(connectorConfig);

    // Wait for connector to produce messages
    await().atMost(Duration.ofSeconds(30))
           .pollInterval(Duration.ofSeconds(2))
           .untilAsserted(() -> {
               // Consume messages from the source topic
               consumer.subscribe(Collections.singletonList(SOURCE_TOPIC_NAME));
               ConsumerRecords<String, String> records = consumer.poll(Duration.ofSeconds(5));
               
               assertThat(records).isNotEmpty();
               assertThat(records.count()).isGreaterThan(0);
               
               // Verify message structure
               for (ConsumerRecord<String, String> record : records) {
                   assertThat(record.key()).isNotNull();
                   assertThat(record.value()).isNotNull();
                   // Validate JSON structure
                   JsonNode jsonNode = objectMapper.readTree(record.value());
                   assertThat(jsonNode.has("id")).isTrue();
                   assertThat(jsonNode.has("timestamp")).isTrue();
               }
           });

    log.info("Basic source connector test completed successfully");
}
```

Now let's look at the `AbstractIT.java` class, which serves as the foundation for our integration tests and provides the necessary infrastructure for running tests against a real Kafka cluster. The `ConnectRunner.java` class is where the magic happens - it creates an embedded Kafka Connect runtime for testing. It also manages the lifecycle of connectors, allowing us to focus on writing tests without worrying about the underlying infrastructure.

---

## Deep Dive: AbstractIT.java - The Foundation

The `AbstractIT` class is the backbone of our integration testing framework. It provides:

### TestContainers Integration

```java
@Testcontainers
public abstract class AbstractIT {
    @Container
    protected static final KafkaContainer kafkaContainer = 
        new KafkaContainer(KAFKA_IMAGE_NAME)
            .withNetwork(Network.newNetwork())
            .withStartupTimeout(CONTAINER_STARTUP_TIMEOUT)
            .withExposedPorts(9092, 8083);
}
```

- **KafkaContainer**: Starts a real Kafka instance in Docker
- **Network Isolation**: Each test suite runs in its own Docker network
- **Exposed Ports**: Maps Kafka ports for communication, 9092 is the default Kafka port and 8083 is for Kafka Connect REST API
- **Startup Timeout**: Ensures Kafka is ready before tests run
- **Automatic Cleanup**: Containers are stopped after tests

**Why TestContainers?**

- **Real Kafka**: Not mocked, but actual Apache Kafka running in Docker
- **Isolation**: Each test suite gets a fresh Kafka cluster
- **Reproducibility**: Consistent environment across development and CI
- **Version Testing**: Easy to test against multiple Kafka versions

### Infrastructure Setup

The `AbstractIT` class handles complex setup in `setUp()`:

```java
@BeforeEach
void setUp() throws Exception {
    // 1. Initialize Kafka clients (producer, consumer, admin)
    setupKafkaClients();
    
    // 2. Create necessary topics
    setupTopics();
    
    // 3. Start embedded Kafka Connect runtime
    setupKafkaConnect();
}
```

- **Kafka Clients**: Initializes producer and consumer for test data generation and verification
- **Topic Management**: Creates required Kafka topics for testing
- **Plugin Directory**: Sets up the directory structure for connector plugins
- **Kafka Connect Initialization**: Starts the Connect runtime with the configured plugins

#### 1. Kafka Client Configuration

```java
private void setupKafkaClients() {
    // Producer configuration for test data generation
    Properties producerProps = new Properties();
    producerProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, 
                     kafkaContainer.getBootstrapServers());
    producerProps.put(ProducerConfig.ACKS_CONFIG, "all");
    producerProps.put(ProducerConfig.RETRIES_CONFIG, 3);
    producer = new KafkaProducer<>(producerProps);

    // Consumer configuration for result verification
    Properties consumerProps = new Properties();
    consumerProps.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
    consumerProps.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
    consumer = new KafkaConsumer<>(consumerProps);
}
```

- **Producer**: Sends test data to Kafka topics
- **Consumer**: Reads messages from Kafka topics for verification
- **Bootstrap Servers**: Connects to the Kafka cluster started by TestContainers
- **Acknowledgments**: Configured to wait for all replicas to acknowledge messages
- **Retries**: Configured to retry sending messages up to 3 times in case of transient errors
- **Auto Offset Reset**: Ensures the consumer starts reading from the earliest messages in the topic
- **Enable Auto Commit**: Disabled to manually control offset commits during tests
- **Consumer Group**: Each test can run in its own consumer group to isolate message consumption

#### 2. Topic Management

```java
private void setupTopics() throws ExecutionException, InterruptedException {
    List<String> topicNames = List.of(
        TEST_TOPIC_NAME, SINK_TOPIC_NAME, SOURCE_TOPIC_NAME,
        ConnectRunner.OFFSET_TOPIC,  // connect-offsets
        ConnectRunner.CONFIG_TOPIC,  // connect-configs  
        ConnectRunner.STATUS_TOPIC   // connect-status
    );

    List<NewTopic> topicsToCreate = topicNames.stream()
        .filter(name -> !existingTopics.contains(name))
        .map(name -> {
            NewTopic topic = new NewTopic(name, 1, (short) 1);
            // Special configuration for Connect internal topics
            if (isConnectInternalTopic(name)) {
                Map<String, String> configs = new HashMap<>();
                configs.put("cleanup.policy", "compact");
                topic.configs(configs);
            }
            return topic;
        })
        .collect(Collectors.toList());

    adminClient.createTopics(topicsToCreate).all().get();
}
```

- **Topic Creation**: Creates necessary topics for testing, including internal Kafka Connect topics
- **Compact Cleanup Policy**: Ensures that internal topics like offsets and configs are compacted
- **Existing Topics Check**: Avoids recreating topics that already exist, preventing errors

#### 3. Plugin Directory Setup

The plugin directory setup is crucial for loading the connector JARs:

```java
private static Path setupPluginDir() throws Exception {
    Path testDir = Files.createTempDirectory("kafka-connector-template-");
    String destFilePath = "./target/kafka-connector-template-0.0.2-jar-with-dependencies.jar";
    Path distFile = Paths.get(destFilePath);
    
    // Verify JAR exists (built by Maven)
    assert Files.exists(distFile);
    
    // Create plugin directory structure
    Path pluginDir = Paths.get(testDir.toString(), "plugins/kafka-connector-template/");
    Files.createDirectories(pluginDir);
    
    // Copy connector JAR to plugin directory
    Files.copy(distFile, pluginDir.resolve(distFile.getFileName()));
    
    return pluginDir;
}
```

This is done to ensure that the connector JAR is available for Kafka Connect to load during tests. The directory structure matches what Kafka Connect expects, allowing it to find and use the connector plugin.

- **Temporary Directory**: Creates a unique directory for each test run
- **JAR Verification**: Ensures the connector JAR is built and available
- **Directory Structure**: Sets up the expected plugin directory structure for Kafka Connect
- **JAR Copying**: Copies the connector JAR to the plugin directory for Kafka Connect to load
- **Plugin Path**: Kafka Connect uses this directory to load the connector plugin

#### 4. Kafka Connect Runtime Initialization

```java
private void setupKafkaConnect() throws Exception {
    Path pluginDir = setupPluginDir();
    
    // Create ConnectRunner instance
    connectRunner = new ConnectRunner(kafkaContainer.getBootstrapServers(), pluginDir);
    
    // Start the Connect runtime
    connectRunner.start();
}
```

- **ConnectRunner**: Manages the embedded Kafka Connect runtime
- **Plugin Directory**: Loads the connector JAR from the test resources
- **Kafka Connect Initialization**: Starts the Connect runtime with the configured plugins

#### 5. Cleanup

```java
@AfterEach
void tearDown() throws Exception {
    // Stop Kafka Connect runtime
    if (connectRunner != null) {
        connectRunner.stop();
    }
    
    // Close Kafka clients
    if (producer != null) {
        producer.close();
    }
    if (consumer != null) {
        consumer.close();
    }
    
    // Cleanup temporary directories
    if (pluginDir != null && Files.exists(pluginDir)) {
        Files.walk(pluginDir)
            .sorted(Comparator.reverseOrder())
            .map(Pa
            th::toFile)
            .forEach(File::delete);
    }
}
```

- **Resource Management**: Ensures all resources are cleaned up after each test
- **Kafka Connect Shutdown**: Stops the embedded Connect runtime
- **Kafka Client Cleanup**: Closes producer and consumer connections

### Helper Methods for Test Cases

```java
// Connector configuration builders
protected Map<String, String> createBasicSinkConnectorConfig() {
    Map<String, String> config = createBasicConnectorConfig();
    config.put("connector.class", "com.example.kafka.connect.sink.ExampleSinkConnector");
    config.put("topics", SINK_TOPIC_NAME);
    config.put("name", "test-sink-connector");
    return config;
}

// Topic creation utilities
protected void createTopic(String topicName, int partitions) 
        throws ExecutionException, InterruptedException {
    NewTopic topic = new NewTopic(topicName, partitions, (short) 1);
    adminClient.createTopics(List.of(topic)).all().get();
}
```

---

## Deep Dive: ConnectRunner.java - The Engine

The `ConnectRunner` class is where the magic happens - it creates an embedded Kafka Connect runtime for testing. It also manages the lifecycle of connectors, allowing us to focus on writing tests without worrying about the underlying infrastructure.

### Why Embedded Connect?

Instead of starting a separate Connect process, we embed the Connect runtime:

**Benefits:**

- **Control**: Direct access to Connect internals for testing
- **Speed**: No process startup overhead
- **Debugging**: Easy to debug connector issues
- **Isolation**: Each test gets a fresh Connect instance

**Trade-offs:**

- **Complexity**: More complex setup than REST API testing
- **Memory**: Higher memory usage during tests

### Connect Runtime Architecture

```java
public final class ConnectRunner {
    private Herder herder;              // Manages connector lifecycle
    private Worker worker;              // Executes connector tasks  
    private ConnectRestServer restServer; // HTTP API (optional for tests)
    private Connect<StandaloneHerder> connect; // Main Connect runtime
}
```

### Startup Process

```java
void start() {
    // 1. Create worker configuration
    Map<String, String> workerProps = createWorkerConfig();
    
    // 2. Initialize plugin system
    Plugins plugins = new Plugins(workerProps);
    DistributedConfig config = new DistributedConfig(workerProps);
    
    // 3. Create offset backing store (uses Kafka topics)
    OffsetBackingStore offsetBackingStore = createOffsetBackingStore(config, plugins);
    
    // 4. Create worker
    worker = new Worker(workerId, time, plugins, config, 
                       offsetBackingStore, overridePolicy);
    
    // 5. Create herder (standalone mode for testing)
    herder = new StandaloneHerder(worker, kafkaClusterId, overridePolicy);
    
    // 5. Initialize REST API (optional)
    final RestClient restClient = new RestClient(config);
    restServer = new ConnectRestServer(10, restClient, workerProps);
    restServer.initializeServer();
    restServer.initializeResources(herder);

    // 6. Start the Connect runtime
    connect = new Connect(herder, restServer);
    connect.start();
}
```

The code above outlines the key steps in starting the Connect runtime:

1. **Worker Configuration**: Sets up the worker properties, including Kafka connection and converters
1. **Plugin System**: Initializes the plugin system to load connectors
1. **Offset Backing Store**: Configures the offset storage using Kafka topics
1. **Header Creation**: Creates the herder instance that manages connector lifecycle and state. It handles connector configuration, status updates, and task management. Without this, the Connect runtime cannot function.
1. **Rest API Initialization**: Initializes the REST API for connector management (optional for tests) but useful for debugging and monitoring
1. **Worker Creation**: Creates the worker instance that executes connector tasks. Workers are responsible for running the connector tasks and managing their lifecycle. It handles task assignment, execution, and error recovery.

### Worker Configuration

The worker configuration is crucial for the Connect runtime to function correctly. Some of the key properties include:

```java
private Map<String, String> createWorkerConfig() {
    Map<String, String> workerProps = new HashMap<>();

    // Kafka connection
    workerProps.put(DistributedConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);

    // Default converters (connectors can override)
    workerProps.put(DistributedConfig.KEY_CONVERTER_CLASS_CONFIG, 
                   "org.apache.kafka.connect.json.JsonConverter");
    workerProps.put(DistributedConfig.VALUE_CONVERTER_CLASS_CONFIG, 
                   "org.apache.kafka.connect.json.JsonConverter");

    // Plugin system
    workerProps.put(DistributedConfig.PLUGIN_PATH_CONFIG, pluginDir.toString());

    // Connect internal topics
    workerProps.put(DistributedConfig.GROUP_ID_CONFIG, KAFKA_CONNECT_GROUP_ID);
    workerProps.put(DistributedConfig.OFFSET_STORAGE_TOPIC_CONFIG, OFFSET_TOPIC);
    workerProps.put(DistributedConfig.CONFIG_TOPIC_CONFIG, CONFIG_TOPIC);
    workerProps.put(DistributedConfig.STATUS_STORAGE_TOPIC_CONFIG, STATUS_TOPIC);

    return workerProps;
}
```

- **Kafka Connection**: Specifies the Kafka cluster to connect to
- **Default Converters**: Sets up JSON converters for key and value serialization
- **Plugin System**: Points to the directory containing connector plugins
- **Connect Internal Topics**: Configures topics for offsets, configs, and statuses

### Offset Storage Configuration

One of the most complex parts is setting up offset storage:

The following method creates an offset backing store that uses Kafka topics to store offsets, which is crucial for maintaining connector state across restarts and failures.

Why do we need this?

- It allows connectors to track their progress and resume from the last processed offset, ensuring no data loss or duplication.

```java
private OffsetBackingStore createOffsetBackingStore(DistributedConfig config, Plugins plugins) {
    // TopicAdmin for managing the offset topic
    Supplier<TopicAdmin> topicAdminSupplier = () -> {
        Map<String, Object> adminConfig = new HashMap<>();
        adminConfig.put("bootstrap.servers", bootstrapServers);
        adminConfig.put("client.id", "connect-worker-offset-admin");
        return new TopicAdmin(adminConfig);
    };
    
    // Key converter for offset serialization
    Converter keyConverter = plugins.newConverter(config, "key.converter",
                                                ClassLoaderUsage.CURRENT_CLASSLOADER);
    
    // Configure converter
    Map<String, Object> converterConfig = new HashMap<>();
    converterConfig.put("schemas.enable", "false");
    keyConverter.configure(converterConfig, true);
    
    // Create Kafka-based offset store
    KafkaOffsetBackingStore offsetBackingStore = new KafkaOffsetBackingStore(
        topicAdminSupplier, 
        () -> OFFSET_TOPIC, 
        keyConverter
    );
    
    offsetBackingStore.configure(config);
    return offsetBackingStore;
}
```

The code above outlines the key components involved in offset management, which are:

1. **TopicAdmin**: Manages the offset topic creation and configuration
1. **Key Converter**: Serializes keys for offset storage
1. **KafkaOffsetBackingStore**: Implements the offset storage using Kafka topics

### Connector Management

```java
public void createConnector(Map<String, String> config) 
        throws ExecutionException, InterruptedException {
    
    String connectorName = config.get(ConnectorConfig.NAME_CONFIG);
    
    // Use callback for async operation
    FutureCallback<Herder.Created<ConnectorInfo>> cb = new FutureCallback<>((error, info) -> {
        if (error != null) {
            LOGGER.error("Failed to create connector: {}", connectorName, error);
        } else {
            LOGGER.info("Created connector {}", info.result().name());
        }
    });
    
    // Submit connector creation to herder
    herder.putConnectorConfig(connectorName, config, false, cb);
    
    // Wait for completion
    Herder.Created<ConnectorInfo> connectorInfoCreated = cb.get();
    if (!connectorInfoCreated.created()) {
        throw new RuntimeException("Failed to create connector: " + connectorName);
    }
}
```

The `createConnector` method is responsible for creating a new connector in the Connect runtime. It uses the `Herder` to submit the connector configuration and waits for the operation to complete.

- **Connector Name**: Extracts the connector name from the configuration
- **FutureCallback**: Handles the asynchronous response from the herder
- **Herder Interaction**: Submits the connector configuration to the herder for processing
- **Error Handling**: Throws an exception if the connector creation fails

---

## TestContainers: Real Kafka in Tests

### Why TestContainers Over Embedded Kafka

Many Kafka testing frameworks use embedded Kafka, but TestContainers provides:

1. **Real Environment**: Actual Kafka Docker image, not a test simulation
2. **Version Flexibility**: Easy to test against different Kafka versions
3. **Network Isolation**: Each test suite gets isolated networking
4. **Resource Management**: Automatic cleanup of containers

### Container Configuration

```java
private static final String DEFAULT_KAFKA_TAG = "3.9.1";
private static final DockerImageName KAFKA_IMAGE_NAME = 
    DockerImageName.parse("apache/kafka").withTag(DEFAULT_KAFKA_TAG);

@Container
protected static final KafkaContainer kafkaContainer = 
    new KafkaContainer(KAFKA_IMAGE_NAME)
        .withNetwork(Network.newNetwork())
        .withStartupTimeout(CONTAINER_STARTUP_TIMEOUT)
        .withExposedPorts(9092, 8083);
```

- **Docker Image**: Uses the official Apache Kafka Docker image
- **Network Isolation**: Creates a new Docker network for the test suite
- **Startup Timeout**: Ensures Kafka is ready before tests run
- **Exposed Ports**: Maps Kafka ports for communication (9092 for Kafka, 8083 for Kafka Connect REST API)
- **Automatic Cleanup**: Containers are stopped after tests, ensuring no leftover state

### Container Lifecycle

```text
Test Suite Start
     ↓
┌─────────────────┐
│ Container Start │ ← Automatic (TestContainers)
└─────────────────┘
     ↓
┌─────────────────┐
│ Network Setup   │ ← Isolated Docker network
└─────────────────┘
     ↓
┌─────────────────┐
│ Port Mapping    │ ← Random host ports → container ports
└─────────────────┘
     ↓
┌─────────────────┐
│ Health Check    │ ← Wait for Kafka to be ready
└─────────────────┘
     ↓
Test Execution
     ↓ (after all tests)
┌─────────────────┐
│ Container Stop  │ ← Automatic cleanup
└─────────────────┘
```

### Advanced Container Configuration

For more complex scenarios, you can customize the container:

```java
@Container
protected static final KafkaContainer kafkaContainer = 
    new KafkaContainer(KAFKA_IMAGE_NAME)
        .withNetwork(Network.newNetwork())
        .withStartupTimeout(Duration.ofMinutes(5))
        .withExposedPorts(9092, 8083)
        // Custom environment variables
        .withEnv("KAFKA_AUTO_CREATE_TOPICS_ENABLE", "true")
        .withEnv("KAFKA_NUM_PARTITIONS", "3")
        // Custom startup command
        .withCommand("sh", "-c", "start-kafka.sh && tail -f /dev/null")
        // Volume mounting for custom configuration
        .withFileSystemBind("./config/server.properties", 
                           "/opt/kafka/config/server.properties");
```

---

## Configuration Deep Dive

### Connector Configuration Hierarchy

```text
Test Configuration Hierarchy:

1. Base Configuration (AbstractIT.createBasicConnectorConfig())
   ├── key.converter: StringConverter
   ├── value.converter: JsonConverter  
   ├── value.converter.schemas.enable: false
   └── tasks.max: 1

2. Connector-Specific Configuration
   ├── Sink: createBasicSinkConnectorConfig()
   │   ├── connector.class: ExampleSinkConnector
   │   ├── topics: sink-topic
   │   └── name: test-sink-connector
   │
   └── Source: createBasicSourceConnectorConfig()
       ├── connector.class: ExampleSourceConnector
       ├── topic: source-topic
       └── name: test-source-connector

3. Test-Specific Overrides
   ├── Custom batch sizes
   ├── Specific timeouts
   └── Test identifiers
```

### Worker Configuration

The Connect worker requires specific configuration for testing:

```java
// Essential worker configuration
workerProps.put(DistributedConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
workerProps.put(DistributedConfig.GROUP_ID_CONFIG, "connect-cluster");

// Offset management (where connector state is stored)
workerProps.put(DistributedConfig.OFFSET_STORAGE_TOPIC_CONFIG, "connect-offsets");
workerProps.put(DistributedConfig.CONFIG_TOPIC_CONFIG, "connect-configs");
workerProps.put(DistributedConfig.STATUS_STORAGE_TOPIC_CONFIG, "connect-status");

// Plugin loading
workerProps.put(DistributedConfig.PLUGIN_PATH_CONFIG, pluginDir.toString());

// Converters (can be overridden by connectors)
workerProps.put(DistributedConfig.KEY_CONVERTER_CLASS_CONFIG, 
               "org.apache.kafka.connect.json.JsonConverter");
workerProps.put(DistributedConfig.VALUE_CONVERTER_CLASS_CONFIG, 
               "org.apache.kafka.connect.json.JsonConverter");
```

These settings ensure that the Connect worker can communicate with the Kafka cluster, manage offsets, and load the necessary plugins for connector functionality.

### Connect Internal Topics

Kafka Connect uses three internal topics for coordination:

1. **connect-offsets**: Stores source connector offsets
   - Cleanup policy: `compact`
   - Contains: Source connector position tracking
   - The topic should be created with a compact cleanup policy to ensure that only the latest offsets are retained, preventing unnecessary data growth.

2. **connect-configs**: Stores connector configurations
   - Cleanup policy: `compact`  
   - Contains: Connector and task configurations

3. **connect-status**: Stores connector and task status
   - Cleanup policy: `compact`
   - Contains: Health and status information

### Topic Configuration in Tests

```java
private void setupTopics() throws ExecutionException, InterruptedException {
    List<NewTopic> topicsToCreate = topicNames.stream()
        .map(name -> {
            NewTopic topic = new NewTopic(name, 1, (short) 1);
            
            // Configure Connect internal topics
            if (name.equals(OFFSET_TOPIC) || 
                name.equals(CONFIG_TOPIC) || 
                name.equals(STATUS_TOPIC)) {
                
                Map<String, String> configs = new HashMap<>();
                configs.put("cleanup.policy", "compact");
                topic.configs(configs);
            }
            return topic;
        })
        .collect(Collectors.toList());
        
    adminClient.createTopics(topicsToCreate).all().get();
}
```

---

## Best Practices and Real-World Examples

### 1. Test Organization

Structure your integration tests by functionality:

### Test Organization Structure

```text
src/test/java/com/example/kafka/connect/integration/
├── AbstractIT.java                 # Base test infrastructure
├── ConnectRunner.java              # Embedded Connect runtime
├── ConnectorConfigurationIT.java   # Configuration validation tests
├── ExampleSinkConnectorIT.java     # Sink connector functionality
└── ExampleSourceConnectorIT.java   # Source connector functionality
```

### 2. Comprehensive Configuration Testing

```java
@Test
public void testConnectorConfigValidation() {
    ExampleSinkConnector connector = new ExampleSinkConnector();
    
    // Test valid configuration
    Map<String, String> validConfig = createValidSinkConfig();
    Config result = connector.validate(validConfig);
    assertThat(result.configValues()).allMatch(cv -> cv.errorMessages().isEmpty());
    
    // Test invalid configuration
    Map<String, String> invalidConfig = new HashMap<>();
    // Missing required 'topics' property
    Config invalidResult = connector.validate(invalidConfig);
    
    boolean hasTopicsError = invalidResult.configValues().stream()
        .anyMatch(cv -> cv.name().equals("topics") && !cv.errorMessages().isEmpty());
    assertThat(hasTopicsError).isTrue();
}
```

- **Valid Configuration**: Ensure the connector accepts valid configurations without errors
- **Invalid Configuration**: Test that missing or incorrect configurations produce appropriate error messages

### 3. Error Handling and Recovery

```java
@Test
public void testConnectorErrorHandling() throws Exception {
    // Start connector with configuration that will cause errors
    Map<String, String> config = createSinkConnectorConfig();
    config.put("external.system.url", "http://nonexistent-host:9999");
    
    connectRunner.createConnector(config);
    
    // Send messages that should trigger errors
    producer.send(new ProducerRecord<>(SINK_TOPIC_NAME, "key", "value")).get();
    
    // Verify connector handles errors gracefully
    await().atMost(Duration.ofSeconds(30))
           .untilAsserted(() -> {
               // Check connector status or error logs
               // Verify messages are retried or sent to DLQ
           });
}
```

- **Error Scenarios**: Simulate common error conditions (e.g., network failures, invalid data)
- **Graceful Recovery**: Ensure the connector can recover from errors without losing data

### 4. Performance Testing

```java
@Test
public void testSourceConnectorThroughput() throws Exception {
    Map<String, String> config = createSourceConnectorConfig();
    config.put("batch.size", "1000");
    config.put("poll.interval.ms", "100");
    
    connectRunner.createConnector(config);
    
    // Measure message production rate
    long startTime = System.currentTimeMillis();
    int expectedMessages = 10000;
    
    await().atMost(Duration.ofMinutes(2))
           .untilAsserted(() -> {
               consumer.subscribe(Collections.singletonList(SOURCE_TOPIC_NAME));
               ConsumerRecords<String, String> records = consumer.poll(Duration.ofSeconds(1));
               
               totalMessages += records.count();
               assertThat(totalMessages).isGreaterThanOrEqualTo(expectedMessages);
           });
    
    long duration = System.currentTimeMillis() - startTime;
    double messagesPerSecond = expectedMessages / (duration / 1000.0);
    
    log.info("Throughput: {} messages/second", messagesPerSecond);
    assertThat(messagesPerSecond).isGreaterThan(100); // Minimum expected throughput
}
```

### 5. Multi-Version Testing

Test your connector against multiple Kafka versions:

```java
@ParameterizedTest
@ValueSource(strings = {"3.8.1", "3.9.1", "4.0.0"})
public void testConnectorCompatibility(String kafkaVersion) {
    // Use different Kafka container versions
    try (KafkaContainer kafka = new KafkaContainer(
            DockerImageName.parse("apache/kafka").withTag(kafkaVersion))) {
        
        kafka.start();
        
        // Run connector tests against this Kafka version
        testBasicConnectorFunctionality(kafka.getBootstrapServers());
    }
}
```

---

## Conclusion

Integration testing for Kafka connectors is complex but essential. The framework we've built provides:

- **Real Kafka Environment**: Using TestContainers for authentic testing
- **Embedded Connect Runtime**: Full control over connector lifecycle
- **Comprehensive Coverage**: Configuration, functionality, and error scenarios
- **Developer Productivity**: Fast feedback and easy debugging

### Key Takeaways

1. **Start with the Template**: Use our [Kafka Connector Template](https://github.com/joel-hanson/kafka-connector-template) as your foundation
2. **Test Early and Often**: Don't wait until the end to add integration tests
3. **Test Real Scenarios**: Use actual Kafka, not mocks, for meaningful results
4. **Cover Edge Cases**: Test error conditions, high load, and configuration variants
5. **Automate Everything**: Include integration tests in your CI/CD pipeline

### Next Steps

- Clone the [Kafka Connector Template](https://github.com/joel-hanson/kafka-connector-template)
- Run the existing integration tests: `mvn verify`
- Adapt the tests for your specific connector requirements
- Add performance and compatibility tests as needed

Remember: Good integration tests are the difference between a connector that works in development and one that thrives in production. Invest the time upfront - your future self (and your operations team) will thank you.

---

*For more Kafka Connect tips and open-source tools, follow the [blog series](https://joel-hanson.github.io/posts/) and star the [template repository](https://github.com/joel-hanson/kafka-connector-template).*
