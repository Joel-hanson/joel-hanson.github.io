---
title: "About"
date: 2026-07-29
draft: false
showReadingTime: false
showWordCount: false
showTableOfContents: false
showTaxonomies: false
showPagination: false
showEdit: false
sharingLinks: false
---

**Open to global and remote roles.**  
[Resume (PDF)](/files/Resume%20-%20Joel%20Hanson.pdf) · hello [at] joelhanson.com · [LinkedIn](https://linkedin.com/in/joel-hanson/) · [GitHub](https://github.com/Joel-hanson)

## About me

Hey, I am Joel.  
distributed systems, event streaming, and production backends. usually shipping something.

I am a software engineer with about eight years in production systems. Currently I work at IBM on Event Streams, Kafka on Kubernetes and OpenShift. That means Kafka Connect and enterprise connectors (IBM MQ source/sink, Connectivity Pack), schema registry work including leading the Apicurio Registry V2 to V3 migration across multiple repos, Kubernetes operators, auth (Keycloak, SCRAM), and the customer production issues that come with running this for real. Recent Connect hardening covered poison-message isolation (DLQ, ErrantRecordReporter), idle-poll heartbeats, and exactly-once under reconnect.

On the side I build open source around the same themes: [ContextLayer](https://github.com/Joel-hanson/contextlayer) (turn a REST API into an MCP server), [kafka-mcp-server](https://github.com/Joel-hanson/kafka-mcp-server) so assistants can manage clusters, and an [SSE to Kafka connector](https://github.com/Joel-hanson/sse-kafka-connector) that ended up in Event Streams demo materials. I also contribute upstream around Apicurio and Kafka Connect (including outside IBM, like the Aiven JDBC connector).

Previously I was at impress.ai in Singapore, first as a software engineer and later as an AI engineer. Python backends on Django, Celery, and Redis, AWS pipelines, later Docker and EKS. One of the larger pieces was an ML essay-scoring system for Ngee Ann Polytechnic that cut marking from about 470 hours to about 2. Before that, early startup work at Travidux and Mobishala: full-stack web, CRM, Postgres performance, and deploy automation.

I mentor engineers through pairing and PR review, help with customer-facing connector issues, and keep a few side projects going. Some are useful, some are just for learning. I write here about Kafka failure modes, Connect quirks, MCP tooling, and the messy parts of shipping real systems.

Looking at senior software engineer or backend roles, global or remote.

## Experience

**IBM, Event Streams** (2021-present)  
Schema registry (Apicurio V2→V3 migration lead), Connectivity Pack and MQ source/sink connectors (exactly-once, DLQ, heartbeats), Event Streams operator and platform work, Keycloak SSO, Go SCRAM CLI, plus mentoring engineers and supporting customers.

**impress.ai** (2018-2021)  
AI and platform engineering. Built an essay ML evaluation platform that cut marking time from ~470 hours to ~2 hours. Stack was Django, Celery, Redis, and AWS, later moved to Docker/EKS.

Earlier: full-stack web and CRM work at Travidux and Mobishala.

## Selected impact

- Led Apicurio Registry V2→V3 across multiple repos with hybrid auth, zero data loss, and no customer service interruption. This was on the critical path for Event Streams v12.1.0.
- Connectivity Pack / MQ connectors: poison-message isolation (ErrantRecordReporter, DLQ), idle-poll heartbeats, and exactly-once under reconnect
- Eureka Incite Gold: ACL-aware RAG over Box Notes (retrieval filtered by document permissions)
- Open source: ContextLayer, Kafka MCP Server, and SSE→Kafka connector (adopted in Event Streams demo materials)

## Open source

- [Apicurio Registry](/projects/apicurio-registry/): V2→V3 migration lead for Event Streams; upstream HTTP MCP + OAuth PR in progress
- [ibm-messaging](https://github.com/ibm-messaging): maintainer-level work on MQ Kafka source/sink, XML converter, kafka-java-vertx-starter
- [Aiven JDBC connector](https://github.com/Aiven-Open/jdbc-connector-for-apache-kafka): contributions outside the IBM ecosystem
- Personal OSS: [ContextLayer](https://github.com/Joel-hanson/contextlayer), [kafka-mcp-server](https://github.com/Joel-hanson/kafka-mcp-server), [sse-kafka-connector](https://github.com/Joel-hanson/sse-kafka-connector)

## Skills

Kafka · Kafka Connect · Kubernetes operators · Python · Java · Go · MCP · RAG · Django · PostgreSQL · OpenShift · AWS

[Credly profile](https://www.credly.com/users/joelhanson)

## Contact

- **Email:** hello [at] joelhanson.com
- **LinkedIn:** [joel-hanson](https://linkedin.com/in/joel-hanson/)
- **GitHub:** [Joel-hanson](https://github.com/Joel-hanson)
- **Medium:** [joel-hanson.medium.com](https://joel-hanson.medium.com/)
