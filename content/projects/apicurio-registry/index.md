---
title: "Apicurio Registry"
date: 2026-07-04
draft: false
featured: true
weight: 1
category: "platform"
summary: "Led Apicurio Registry V2→V3 for Event Streams; upstream HTTP MCP + OAuth forwarding is an open PR under review."
tags: ["Schema Registry", "Kubernetes", "Java", "Open Source", "MCP"]
---

[Apicurio Registry](https://github.com/Apicurio/apicurio-registry) is the API and schema registry used across event-driven systems — including IBM Event Streams.

### V2 → V3 migration (Event Streams)

As lead developer for the Event Streams schema-registry migration (Oct 2025–Jan 2026), I coordinated work across **5+ repos** to move customers off Apicurio V2 (approaching EOL) without data loss or forced lockstep upgrades.

**Problem:** Thousands of schemas in customer environments; V3 needed for auth and performance, but some deployments still required V2-style auth after the cutover.

**What I did:**
- **Hybrid auth chain** so V2-style and V3-style auth coexist for gradual rollout
- Upgraded Apicurio **2.x → 3.1.4** with container hardening for Kubernetes/OpenShift (JVM container-awareness, GC tuning, Java as PID 1 for SIGTERM)
- CLI export/import that detects registry version and calls the correct APIs so existing customer scripts keep working
- Migration sequencing and validation so V3 schemas could not be created before V2 checks completed

**Why it matters:** Shipped with **zero data loss** and **no customer service interruption** — on the critical path for Event Streams **v12.1.0**.

### Upstream: HTTP MCP + OAuth forwarding (in progress)

I'm also working on an **open pull request** that adds an HTTP transport for the Registry MCP server with inbound OIDC and per-caller bearer-token forwarding — so remote MCP clients authenticate as themselves and Registry applies their RBAC (same as the UI), instead of sharing a single service account over stdio. Not merged yet; still under maintainer review.

**Links:** [Repository](https://github.com/Apicurio/apicurio-registry) · [Open PR #8460](https://github.com/Apicurio/apicurio-registry/pull/8460)
