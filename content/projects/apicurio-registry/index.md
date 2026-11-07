---
title: "Apicurio Registry"
date: 2026-07-04
draft: false
featured: true
weight: 1
category: "platform"
summary: "Schema registry migration and upstream MCP work for IBM Event Streams."
outcome: "V2→V3 · zero downtime · Event Streams v12.1 critical path"
tags: ["Schema Registry", "Kubernetes", "Java", "Open Source", "MCP"]
featureimage: "img/posts/apicurio-registry.png"
blogPost: "/posts/34-apicurio-registry-mcp-http-oauth-token-forwarding/"
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

### Upstream: HTTP MCP + OAuth forwarding (merged)

[PR #8460](https://github.com/Apicurio/apicurio-registry/pull/8460) (merged August 2026) adds optional HTTP MCP with inbound OIDC and per-caller bearer-token forwarding.

Stdio MCP used one shared service account for every tool call. HTTP mode lets clients log in as themselves; MCP forwards that token to Registry, so `sr-readonly` and `sr-admin` behave like the UI. Stdio stays the default. `/mcp` returns 404 until you opt in at runtime.

**Links:** [Repository](https://github.com/Apicurio/apicurio-registry) · [Merged PR #8460](https://github.com/Apicurio/apicurio-registry/pull/8460) · [Write-up](/posts/34-apicurio-registry-mcp-http-oauth-token-forwarding/)
