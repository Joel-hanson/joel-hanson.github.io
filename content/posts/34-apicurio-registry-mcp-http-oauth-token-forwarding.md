---
title: "Apicurio Registry MCP: HTTP Transport with Per-User OAuth"
date: 2026-11-07T09:00:00+05:30
draft: false
series: ["MCP"]
series_order: 5
summary: "Upstream PR that adds HTTP MCP to Apicurio Registry with OIDC and bearer-token forwarding, so remote clients act as themselves instead of one shared service account."
description: "What Apicurio Registry PR #8460 does: optional HTTP MCP with inbound OIDC and per-caller token forwarding, so Registry RBAC matches the UI."
tags:
  - Apicurio
  - MCP
  - OAuth
  - Schema Registry
  - Java
  - Open Source
categories:
  - MCP
  - Open Source
author: "Joel Hanson"
showHero: true
heroStyle: "basic"
imagePosition: "center"
featureimage: "img/covers/34-apicurio-registry-mcp-http-oauth-token-forwarding.svg"
---

Apicurio Registry’s MCP server used to work like this: your desktop client spawns a local process, and that process talks to Registry with one shared service-account token. Fine on a laptop. Bad when two people share a URL.

Say Alice is `sr-readonly` and Bob is `sr-admin`. Over stdio, both tool calls hit Registry as the same service account. Alice can create groups because Bob’s setup leaked into the shared credential. Registry never sees Alice.

[PR #8460](https://github.com/Apicurio/apicurio-registry/pull/8460) (merged August 2026) adds an optional HTTP path where the caller’s own token goes the whole way.

```text
Before (stdio)
  Client ──spawn──► MCP ──service account──► Registry
                         (one identity for everyone)

After (HTTP)
  Client ──Bearer──► MCP ──same Bearer──► Registry
     │                 ▲
     └── OAuth ──► Keycloak
```

MCP validates the Bearer token (OIDC / Keycloak), then forwards that same token to Registry. Alice’s create-group call fails. Bob’s succeeds. Same roles as the UI.

Stdio is unchanged and still the default. HTTP is in the image but off until you set `apicurio.mcp.http.enabled=true` and wire Quarkus OIDC; otherwise `/mcp` returns 404. You do not expose it by accident.

To run HTTP mode: stand up secured Registry + Keycloak (see `examples/mcp-keycloak` in the repo), enable HTTP + OIDC on MCP, point the client at `http://<host>:8082/mcp` with the `apicurio-mcp` OAuth client, and log in. The knobs that matter are `APICURIO_MCP_HTTP_ENABLED`, `APICURIO_MCP_HTTP_FORWARD_TOKEN`, and `QUARKUS_OIDC_*`. Stdio setups keep those off and keep using `APICURIO_MCP_AUTH_*` client credentials.

I work on schema registry for Event Streams. An MCP server that always acts as admin is not useful once more than one person (or a remote agent) is on the other end. Forward the caller’s token and you get one auth story for the UI and for agents.

If you already use stdio, nothing changes. If you need a URL with real roles, opt into HTTP.

**Links:** [PR #8460](https://github.com/Apicurio/apicurio-registry/pull/8460) · [Apicurio Registry](https://github.com/Apicurio/apicurio-registry) · [Project page](/projects/apicurio-registry/)
