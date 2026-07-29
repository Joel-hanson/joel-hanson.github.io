---
title: "Apicurio Registry"
date: 2026-07-04
draft: true
featured: true
weight: 1
summary: "Open-source contribution: HTTP MCP transport with OAuth token forwarding for Apicurio Registry."
tags: ["Open Source", "MCP", "Java", "OAuth"]
---

Contribution to [Apicurio Registry](https://github.com/Apicurio/apicurio-registry) — an API and schema registry used across event-driven systems.

I added an **HTTP transport** for the Registry MCP server with inbound OIDC and per-caller bearer-token forwarding. That lets remote MCP clients authenticate as themselves so Registry applies their RBAC (same as the UI), instead of sharing a single service account over stdio.

**Links:** [Pull request](https://github.com/Apicurio/apicurio-registry/pull/8460) · [Repository](https://github.com/Apicurio/apicurio-registry)
