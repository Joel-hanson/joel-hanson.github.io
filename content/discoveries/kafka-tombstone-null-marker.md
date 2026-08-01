---
title: "Kafka tombstones via console producer"
date: 2025-04-22
draft: false
discoveryType: snippet
summary: "Key + null value = tombstone. Use null.marker so the CLI can send it."
tags: ["Kafka", "CLI"]
codeLang: bash
code: |
  bin/kafka-console-producer.sh --bootstrap-server localhost:9092 \
    --topic my-compacted-topic \
    --property parse.key=true \
    --property key.separator=: \
    --property null.marker=NULL

  # Then type: user123:NULL
relatedPost: "/posts/14-creating-tombstone-records-using-kafka-console-producer-sh-a-quick-guide/"
---

Compacted topics need a null value to delete a key. The console producer’s `null.marker` makes that one line instead of a custom producer.
