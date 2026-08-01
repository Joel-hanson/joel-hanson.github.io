---
# What If Your Kafka Producers Sent Half the Data Over the Network?
title: "Send Half the Bytes Over the Network: Cut Kafka Integer Payloads with Bijou64"
date: 2026-06-06
ctaProjects:
  - "bijou64"
aliases:
  - "/posts/shrink-kafka-integer-payloads-with-bijou64/"
summary: "Every Kafka record with a Long value you produce sends 8 bytes over the wire, even when the value is 42. Bijou64 encodes integers in 1–3 bytes with drop-in serializers, cutting network transfer and replication traffic on integer-heavy topics by up to 50% or more."
tags:
  - Kafka
  - Java
  - Performance
  - Serialization
  - Open Source
categories:
  - Kafka
  - Developer Tools
featureimage: "img/covers/bars.svg"
showHero: true
heroStyle: "background"
imagePosition: "center"
---

If you produce millions of Kafka messages where the **value is just a number** — counters, IDs, timestamps, sequence numbers — you're almost certainly paying for **8 bytes per message** whether the value is `1` or `1_000_000_000`.

Kafka's built-in `LongSerializer` is simple and correct. But simple also means fixed-width: every `long` becomes 8 bytes on the wire and on disk. On high-volume, integer-heavy topics, that adds up fast in **broker storage**, **replication traffic**, and **egress costs**.

That's the problem [Bijou64](https://www.inkandswitch.com/tangents/bijou64/) solves. It's a compact, variable-length encoding for unsigned 64-bit integers from [Ink & Switch](https://www.inkandswitch.com/). I wrapped it as a **Java library with Kafka serializers** so you can swap it in without changing your application logic.

**GitHub repo:** [github.com/Joel-hanson/bijou64](https://github.com/Joel-hanson/bijou64)

---

## What Is Bijou64?

**bijou64** (pronounced "bee-zoo-sixty-four") stands for **BIJ**ective **O**ffset **U64**. It's a way to encode integers into **1–9 bytes** instead of always using 8.

The idea is straightforward:

| Value range   | Bytes on the wire | Example                              |
| ------------- | ----------------- | ------------------------------------ |
| 0 – 247       | **1 byte**        | `42` → `[0x2A]`                      |
| 248 – 503     | **2 bytes**       | `300` → `[0xF8, 0x34]`               |
| Larger values | 3–9 bytes         | Uses a tag byte + big-endian payload |

Small numbers stay small. Big numbers grow only as much as they need to. And unlike some varint formats, bijou64 is **canonically unique** — each number has exactly one valid encoding, so you don't get ambiguous "overlong" forms.

If you want the deep dive on the wire format, Ink & Switch's [bijou64 write-up](https://www.inkandswitch.com/tangents/bijou64/) and the [upstream spec](https://github.com/inkandswitch/bijou/tree/main/bijou64) are excellent.

---

## Why Should Kafka Users Care?

Think about topics like:

- Event counters and metrics
- Monotonic sequence numbers (`1`, `2`, `3`, …)
- Numeric IDs that start small and grow over time
- Timestamp-like values where most records cluster in a range

For these workloads, **most values are small**. Bijou64 encodes them in 1–3 bytes instead of 8.

### What you gain

- **Smaller payloads** → less disk on brokers, less data to replicate
- **Less network I/O** → especially on producer-heavy pipelines
- **Potential throughput bump** → less bytes to serialize, compress, and ship

### What you don't get

Bijou64 is **not** a replacement for Avro, Protobuf, or JSON. It's not for arbitrary structured objects. If your values are complex records, stick with schema-based serialization (and enable Kafka compression first).

---

## When to Use It (and When Not To)

**Use Bijou64 when:**

- Your Kafka **values are mostly numeric** (`Long` / `Integer`)
- The topic is **high volume** and storage or egress costs matter
- You control **both producer and consumer** serialization

**Skip Bijou64 when:**

- Payloads are JSON, Avro, Protobuf, or other structured formats
- Producers and consumers can't share the same serializer/deserializer pair
- Topics are low volume and the savings aren't worth the migration

Rule of thumb: if you'd reach for `LongSerializer` today and your numbers are often small, Bijou64 is worth a look.

---

## Know the Limits (Quick Gist)

Bijou64 is narrow on purpose — that's what makes it fast and simple:

- **Range:** unsigned **0 → 2⁶⁴ − 1** (Java `long` is treated as unsigned on the wire)
- **Size:** **1–9 bytes** per value — small ints save the most; very large values can use **9 bytes** (slightly more than Long's fixed 8)
- **Signed negatives:** if you rely on negative `Long` values, stick with `LongSerializer` — Bijou64 does not preserve signed semantics the same way
- **Kafka contract:** producer and consumer must both use `Bijou64Serializer` / `Bijou64Deserializer` on the same field
- **Payload shape:** one integer per message — not JSON, Avro, Protobuf, or nested objects
- **Migration:** existing topics written with `LongSerializer` need a coordinated rollout or a new topic

If your topic is counters, sequence numbers, or IDs that stay non-negative and mostly small, you're in the sweet spot for cutting network transfer.

---

## How It Works in Java

The library exposes a simple encode/decode API:

```java
// Encode 300 → [0xF8, 0x34]
byte[] encoded = Bijou64.encode(300);

// Decode back to 300
long value = Bijou64.decode(encoded);
```

Under the hood there are two implementations:

- **Native (JNI)** — wraps the upstream Rust crate for maximum speed
- **Pure Java fallback** — used automatically if the native library isn't available

Force pure Java if you need it:

```properties
bijou64.useJava=true
```

---

## Drop-In Kafka Integration

This is the part that matters for day-to-day use. Swap your serializers — no schema registry changes, no payload restructuring.

**Producer:**

```properties
key.serializer=org.bijou64.perf.kafka.Bijou64Serializer
value.serializer=org.bijou64.perf.kafka.Bijou64Serializer
```

**Consumer:**

```properties
key.deserializer=org.bijou64.perf.kafka.Bijou64Deserializer
value.deserializer=org.bijou64.perf.kafka.Bijou64Deserializer
```

**Maven:**

```xml
<dependency>
  <groupId>org.bijou64</groupId>
  <artifactId>bijou64</artifactId>
  <version>0.2.0</version>
</dependency>

<dependency>
  <groupId>org.bijou64</groupId>
  <artifactId>bijou64-kafka-serializers</artifactId>
  <version>0.2.0</version>
</dependency>
```

Build from source (includes the Rust native library via submodule):

```bash
git clone https://github.com/Joel-hanson/bijou64.git
cd bijou64
git submodule update --init --recursive
mvn -B clean package
```

---

## Does It Actually Help? Benchmark Numbers

I run an end-to-end Kafka producer benchmark in CI on every push to `main`: 50,000 sequential integers (`1..N`), Kafka 4.3 (KRaft), Java 17, comparing `LongSerializer` vs Bijou64 (JNI and pure Java), with and without `zstd` compression.

Results from the [2026-06-06 CI run](https://github.com/Joel-hanson/bijou64/actions/runs/27060603235):

| Mode           | Compression | Median throughput | Avg payload |
| -------------- | ----------- | ----------------- | ----------- |
| Long           | none        | 102,849 msg/s     | 8.0 bytes   |
| Long           | zstd        | 94,099 msg/s      | 8.0 bytes   |
| Bijou64 (JNI)  | none        | 114,590 msg/s     | 3.0 bytes   |
| Bijou64 (JNI)  | zstd        | 98,789 msg/s      | 3.0 bytes   |
| Bijou64 (Java) | none        | 116,683 msg/s     | 3.0 bytes   |
| Bijou64 (Java) | zstd        | 108,589 msg/s     | 3.0 bytes   |

**Takeaways:**

- **62% smaller payloads** on sequential integers (3 vs 8 bytes)
- **~11–14% higher producer throughput** vs `LongSerializer` without compression
- Pure Java is competitive with JNI on the CI runner — you won't necessarily need native libs everywhere

These are full producer runs (client + broker + network), not isolated microbenchmarks. Run the same test locally for your hardware:

```bash
cd perf/kafka
docker compose up -d
./scripts/compare-benchmarks.sh --ci --distribution sequential 50000 2 \
  bijou64-benchmark-topic localhost:9092
```

For encode/decode-only numbers:

```bash
./scripts/run-jmh.sh
```

---

## A Mental Model

```
Standard LongSerializer          Bijou64
─────────────────────────        ─────────────────────────
value: 42                        value: 42
wire:  [8 fixed bytes]           wire:  [1 byte]

value: 300                       value: 300
wire:  [8 fixed bytes]           wire:  [2 bytes]

value: 1_000_000                 value: 1_000_000
wire:  [8 fixed bytes]           wire:  [3 bytes]
```

You're not changing _what_ you send — just _how many bytes_ it takes to represent the same number.

---

## Try It in 5 Minutes

Artifacts are published to [GitHub Packages](https://github.com/Joel-hanson/bijou64/packages) on every release tag (`v0.2.0`, etc.). You can pull them into an existing Kafka app without cloning the repo.

### 1. Authenticate with GitHub Packages

GitHub Packages requires a personal access token, even for public repos.

1. Create a [classic PAT](https://github.com/settings/tokens) with the **`read:packages`** scope (or a fine-grained token with **Packages: Read** on `Joel-hanson/bijou64`).
2. Add credentials to `~/.m2/settings.xml`:

   ```xml
   <settings xmlns="http://maven.apache.org/SETTINGS/1.2.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.2.0 https://maven.apache.org/xsd/settings-1.2.0.xsd">
     <servers>
       <server>
         <id>github</id>
         <username>YOUR_GITHUB_USERNAME</username>
         <password>YOUR_GITHUB_PAT</password>
       </server>
     </servers>
   </settings>
   ```

   The `<id>github</id>` must match the repository `<id>` in your `pom.xml` below.

### 2. Add the dependency to your Maven project

Point Maven at the package registry and pull in the Kafka serializers (which transitively includes the core library):

```xml
<repositories>
  <repository>
    <id>github</id>
    <url>https://maven.pkg.github.com/Joel-hanson/bijou64</url>
  </repository>
</repositories>

<dependencies>
  <dependency>
    <groupId>org.bijou64</groupId>
    <artifactId>bijou64-kafka-serializers</artifactId>
    <version>0.2.0</version>
  </dependency>
</dependencies>
```

If you only need encode/decode outside Kafka, depend on `bijou64` instead of `bijou64-kafka-serializers`.

**Gradle (Kotlin DSL):**

```kotlin
repositories {
    maven {
        url = uri("https://maven.pkg.github.com/Joel-hanson/bijou64")
        credentials {
            username = providers.gradleProperty("gpr.user").get()
            password = providers.gradleProperty("gpr.key").get()
        }
    }
}

dependencies {
    implementation("org.bijou64:bijou64-kafka-serializers:0.2.0")
}
```

Set `gpr.user` and `gpr.key` in `~/.gradle/gradle.properties` to your GitHub username and PAT.

### 3. Wire up your Kafka producer and consumer

Swap the serializers in your existing app — no changes to your `Long` business logic.

**`producer.properties`:**

```properties
bootstrap.servers=localhost:9092
key.serializer=org.apache.kafka.common.serialization.StringSerializer
value.serializer=org.bijou64.perf.kafka.Bijou64Serializer
```

**`consumer.properties`:**

```properties
bootstrap.servers=localhost:9092
group.id=my-app
key.deserializer=org.apache.kafka.common.serialization.StringDeserializer
value.deserializer=org.bijou64.perf.kafka.Bijou64Deserializer
auto.offset.reset=earliest
```

**Or in Java:**

```java
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, Bijou64Serializer.class.getName());

try (KafkaProducer<String, Long> producer = new KafkaProducer<>(props)) {
    producer.send(new ProducerRecord<>("counters", "page-views", 42L));
}
```

Both producer and consumer must use Bijou64 serializers on the same topic. Mixing `LongSerializer` on one side and `Bijou64Serializer` on the other will corrupt your data.

### 4. Run it

```bash
mvn clean package
# start your app, or use kafka-console-producer/consumer with the properties above
```

The library falls back to pure Java automatically if the native JNI library isn't on your classpath — no extra setup required for most deployments.

### Want to run the benchmarks locally?

Clone the repo, start Kafka with Docker, and compare `LongSerializer` vs Bijou64:

```bash
git clone https://github.com/Joel-hanson/bijou64.git
cd bijou64
git submodule update --init --recursive
mvn -B clean package

cd perf/kafka
docker compose up -d
./scripts/compare-benchmarks.sh sequential 10000 2 \
  my-benchmark-topic localhost:9092
```

---

## Credits

This project implements the [bijou64 wire format](https://github.com/inkandswitch/bijou/tree/main/bijou64) from [Bijou](https://github.com/inkandswitch/bijou) by Ink & Switch. The native path uses their Rust crate via a git submodule and JNI. My repo adds the Java/Kafka layer, benchmarks, and CI.

---

## Final Thoughts

Kafka compression (`lz4`, `zstd`, `gzip`) is the first knob most teams turn. That's the right default for general payloads. But when your topic is **integer-heavy**, you're compressing 8-byte values that didn't need to be 8 bytes in the first place.

Bijou64 attacks the problem at the serialization layer: same semantics, fewer bytes, drop-in Kafka integration. If your pipeline looks like counters, IDs, or sequential numbers at scale, it's worth benchmarking on your own cluster.

Star the repo if it's useful → [github.com/Joel-hanson/bijou64](https://github.com/Joel-hanson/bijou64)

---

_For more Kafka tips and open-source tools, follow the [blog series](/posts/)_
