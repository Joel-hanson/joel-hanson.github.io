---
title: "Building an MCP Server for Your Kafka Cluster"
date: 2025-06-07
summary: "A step‑by‑step guide to using FastMCP and the MCP protocol to expose Kafka operations (topic management, produce/consume, troubleshooting) as LLM‑accessible tools."
tags:
  - Kafka
  - MCP
  - FastMCP
  - Python
  - LLM
  - DevOps
categories:
  - Developer Tools
  - Kafka
  - Machine Learning
---

Ever wished you could talk to your Kafka cluster using natural language—or call it directly from Claude Desktop or any other LLM client? With [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol/python-sdk) and the FastMCP SDK, you can expose all your Kafka operations as discrete, promptable tools.

In this guide you’ll learn how to setup a MCP server to do the following:

* 🔍 List Kafka topics
* ➕ Create & delete topics
* 📤 Produce messages
* 🛠️ Troubleshoot issues via a free‑form prompt

🔗 **Try it out & contribute:** [GitHub Repo](https://github.com/Joel-hanson/kafka-mcp-server)

---

## 🛠️ Project Setup

```bash
git clone https://github.com/joel-hanson/kafka-mcp-server.git
cd kafka-mcp-server

# Create environment
conda create -n kafka-mcp python=3.10 -y
conda activate kafka-mcp

# Install dependencies
pip install -r requirements.txt
```

**Requirements:**

* Python 3.10+
* A running Kafka broker (e.g. `localhost:9092`; you can `docker compose up` a quick cluster)
* MCP CLI tools (`mcp[cli]`) and `kafka-python`
* Optional: Claude Desktop or any MCP‑compatible LLM client

---

## 📂 File Structure

```file
kafka-mcp-server/
├── server.py             # FastMCP entrypoint: registers @tool, @resource, @prompt
├── kafka_utils.py        # Connection loader & reusable KafkaManager
├── kafka_troubleshoot.py # Static troubleshooting guide constant
├── requirements.txt
└── README.md
```

* **`server.py`** – your main MCP server. Decorate functions with

  * `@mcp.tool()` for command‑style operations,
  * `@mcp.resource()` for raw JSON endpoints,
  * `@mcp.prompt()` for free‑form guidance.
* **`kafka_utils.py`** – handles parsing `kafka.properties`, instantiates and caches your KafkaAdminClient/Producer/Consumer, and stores it on `lifespan_context.kafka_manager`.
* – contains `KAFKA_TROUBLESHOOTING_GUIDE`, a templated Markdown guide you plug into your `@prompt()`.

---

## 🚀 Defining Your Tools

### 1. Initialize & Connect

```python
from mcp.server.fastmcp import Context, FastMCP

mcp = FastMCP("Kafka MCP Server", lifespan=kafka_lifespan)

@mcp.tool()
def kafka_initialize_connection(path: str) -> str:
    """Load kafka.properties and connect to the cluster."""
    try:
        manager = KafkaManager.from_properties(path)
        ctx.request_context.lifespan_context.kafka_manager = manager
        return "✅ Connected to Kafka cluster."
    except Exception as e:
        return f"❌ Connection failed: {e}"
```

### 2. List Topics (rich example)

```python
from mcp.server.fastmcp import Context, FastMCP

mcp = FastMCP("Kafka MCP Server", lifespan=kafka_lifespan)

@mcp.tool()
def kafka_list_topics(ctx: Context) -> str:
    """List all topics in the Kafka cluster"""
    manager = ctx.request_context.lifespan_context.kafka_manager
    if not manager:
        return "Error: Not connected. Use kafka_initialize_connection first."

    try:
        topics = manager.list_topics()
        if not topics:
            return "No topics found in the Kafka cluster."
        lines = [
            f"• {t['name']} (partitions: {t['partitions']}, replication: {t['replication_factor']})"
            for t in topics
        ]
        return "Topics in Kafka cluster:\n" + "\n".join(lines)
    except Exception as e:
        return f"Error listing topics: {e}"
```

### 3. Raw JSON Resource

```python
from mcp.server.fastmcp import Context, FastMCP

mcp = FastMCP("Kafka MCP Server", lifespan=kafka_lifespan)

@mcp.resource("kafka://topics")
def get_all_topics() -> str:
    """Provide all Kafka topics as JSON"""
    manager = mcp.get_context().request_context.lifespan_context.kafka_manager
    if not manager:
        return "Not connected to Kafka cluster"
    try:
        return json.dumps(manager.list_topics(), indent=2)
    except Exception as e:
        return f"Error fetching topics: {e}"
```

### 4. Troubleshooting Prompt

```python
from kafka_troubleshoot import KAFKA_TROUBLESHOOTING_GUIDE
from mcp.server.fastmcp import Context, FastMCP

mcp = FastMCP("Kafka MCP Server", lifespan=kafka_lifespan)

@mcp.prompt()
def kafka_troubleshoot(issue: str) -> str:
    """Get comprehensive troubleshooting guidance for Kafka issues"""
    return KAFKA_TROUBLESHOOTING_GUIDE.format(issue=issue)
```

### 5. (Bonus) Produce

```python
from mcp.server.fastmcp import Context, FastMCP

mcp = FastMCP("Kafka MCP Server", lifespan=kafka_lifespan)

@mcp.tool()
def kafka_produce(topic: str, message: str) -> str:
    """Send a message to a Kafka topic"""
    prod = ctx.request_context.lifespan_context.kafka_manager.producer
    try:
        prod.send(topic, message.encode('utf-8'))
        prod.flush()
        return f"Message sent to `{topic}`: {message}"
    except Exception as e:
        return f"Error producing message: {e}"
```

---

## 🔧 Running & Debugging

* **Dev Mode with Inspector**

  ```bash
  mcp dev server.py
  ```

  Opens the MCP Inspector UI—browse tools, read docstrings, send test prompts, view raw JSON.

* **Running the server**

  ```bash
  python server.py
  ```

Sprinkle `logging.debug(...)` in your tool functions to trace errors in real time.

---

### Example Usage Flow

1. First, connect to Kafka:

   ```text
   Use kafka_initialize_connection with your properties file <path>

   OR

   Initialize connection with kafka using the properties file <path>
   ```

2. List existing topics:

   ```text
   Use kafka_list_topics to see all topics

   OR

   List all the topics
   ```

3. Create a new topic:

   ```text
   Use kafka_create_topic with name "my-topic", partitions 3, replication_factor 1

   OR

   Create me a topic with name "my-topic"
   ```

4. Get topic details:

   ```text
   Use kafka_get_topic_info for "my-topic"

   OR

   Please share the topics details of "my-topics"
   ```

---

## 🔗 Integrating with Claude Desktop

**Configure** `claude_desktop_config.json`:

   ```json
   {
     "mcpServers": {
       "Kafka MCP Server": {
         "command": "/opt/miniconda3/envs/kafka-mcp/bin/python",
         "args": ["server.py"]
       }
     }
   }
   ```

Now Claude will auto‑discover and surface your new Kafka tools.

---

## 📸 Screenshots

### 1. Listing available tools  

![Listing tools](/images/kafka-mcp-server/list_tools.png "Listing tools")

### 2. Connecting to the Kafka cluster  

![Connecting to kafka cluster](/images/kafka-mcp-server/initialize_connection.png "Connecting to Kafka cluster")

### 3. Listing topics  

![Listing topics](/images/kafka-mcp-server/list_topics.png "Listing topics")

### 4. Deleting a topic  

![Deleting topics](/images/kafka-mcp-server/delete_topic.png "Deleting topics")

### 5. Detailed topic information  

![Listing detailed topics information](/images/kafka-mcp-server/list_detailed_topic_info.png "Listing detailed topic info")

### 6. Producing messages  

![Producer messages](/images/kafka-mcp-server/produce_messages.png "Producing messages")

### 7. Consuming messages via shell  

![Consumer messages via shell](/images/kafka-mcp-server/consume_messages_shell.png "Consuming messages via shell")

---

---

## 📚 Final Thoughts

You’ve just transformed your Kafka cluster into a first‑class, LLM‑driven API—ideal for internal dev‑tools, rapid troubleshooting, or even exposing safe, controlled access to non‑Kafka experts. Next up:

* Schema Registry & Avro/JSON serialization
* Consumer group and offset‑management tools
* Cluster‑wide metrics & health checks
* ACLs, security hardening, and multi‑tenant isolation

Feel free to fork, extend, and contribute back at [https://github.com/Joel-hanson/kafka-mcp-server](https://github.com/Joel-hanson/kafka-mcp-server). Happy building!
