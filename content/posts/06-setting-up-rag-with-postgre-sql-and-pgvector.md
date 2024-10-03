---
title: "Supercharging Your AI: Setting Up RAG with PostgreSQL and pgvector"
date: 2024-09-30T21:28:28+05:30
draft: false
ShowToc: true
TocOpen: false
summary: "Learn how to implement a powerful Retrieval-Augmented Generation (RAG) system using PostgreSQL and pgvector. This comprehensive guide covers everything from setting up a custom PostgreSQL Docker image to creating a fully functional RAG query system with vector embeddings and language model inference."
tags: ["PostgreSql", "PGVector", "RAG", "Vector Database", "AI", "NLP", "Docker", "GPT", "LLM"]
categories: ["Database", "Artificial Intelligence", "Tutorial"]
cover:
  image: ""
  alt: "Illustration of RAG system with PostgreSQL and pgvector"
  caption: "RAG: Empowering AI with Knowledge Retrieval"
  relative: true
  responsiveImages: true
---

## Introduction

Imagine having a conversation with an AI that not only understands your questions but also draws upon a vast repository of knowledge to provide accurate, contextually relevant answers. This isn't science fiction—it's the power of Retrieval-Augmented Generation (RAG) systems. In this blog post, we'll dive into the exciting world of RAG and show you how to harness this technology using PostgreSQL and pgvector.

## What is RAG, and Why Should You Care?

RAG is like giving your AI a photographic memory and the ability to instantly recall relevant information. It combines the power of large language models with a knowledge base, allowing the AI to provide more accurate, up-to-date, and contextually relevant responses. Whether you're building a chatbot, a question-answering system, or any AI application that requires access to specific knowledge, RAG is your secret weapon.

## Prerequisites

Before we embark on this RAG adventure, make sure you have:

- PostgreSQL 13 or later
- Python 3.7 or later
- pip (Python package manager)
- Docker (for building our custom PostgreSQL image)

## Step 1: Building a Custom PostgreSQL Image with pgvector

Let's start by creating a supercharged PostgreSQL image with the pgvector extension pre-installed. This will save us time and ensure consistency across different environments.

1. Create a new directory for your Dockerfile:

```bash
mkdir postgres-pgvector && cd postgres-pgvector
```

2. Create a file named `Dockerfile` with the following content:

```dockerfile
FROM postgres:14

ENV POSTGRES_DB=vectordb
ENV POSTGRES_USER=vectoruser
ENV POSTGRES_PASSWORD=vectorpass

RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    postgresql-server-dev-14

RUN git clone https://github.com/pgvector/pgvector.git

RUN cd pgvector && \
    make && \
    make install

RUN apt-get remove -y build-essential git postgresql-server-dev-14 && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /pgvector

RUN echo "CREATE EXTENSION vector;" > /docker-entrypoint-initdb.d/init.sql
```

3. Build the Docker image:

```bash
docker build -t postgres-pgvector .
```

4. Run the container:

```bash
docker run -d --name postgres-vector -p 5432:5432 postgres-pgvector
```

You now have a PostgreSQL instance running with pgvector ready to go.

## Step 2: Install Required Python Packages

Let's set up our Python environment:

```bash
pip install psycopg2-binary pgvector sentence-transformers torch transformers
```

## Step 3: Create a Table for Vector Storage

Connect to your PostgreSQL database and run:

```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(384)
);
```

## Step 4: Inserting Documents and Embeddings

Now, let's populate our database with some interesting facts:

```python
import psycopg2
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')

# Connect to the PostgreSQL database
conn = psycopg2.connect("dbname=vectordb user=vectoruser password=vectorpass host=localhost")
cur = conn.cursor()

# Sample documents
documents = [
    "The Great Wall of China is visible from space, but it's a common myth that it can be seen from the moon.",
    "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible.",
    "The world's oldest known living tree is a Great Basin Bristlecone Pine that is over 4,800 years old.",
    "Octopuses have three hearts: two pump blood through each of the two gills, while the third pumps blood through the body.",
    "The shortest war in history lasted only 38 minutes. It was between Britain and Zanzibar on August 27, 1896."
]

# Insert documents and their embeddings
for doc in documents:
    embedding = model.encode(doc)
    cur.execute("INSERT INTO documents (content, embedding) VALUES (%s, %s)",
                (doc, embedding.tolist()))

conn.commit()
cur.close()
conn.close()

print("Documents inserted successfully!")
```

## Step 5: Implementing RAG Query

Now for the exciting part—let's implement our RAG system:

```python
import psycopg2
from sentence_transformers import SentenceTransformer
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# Initialize models
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
llm_model = AutoModelForCausalLM.from_pretrained("gpt2")
tokenizer = AutoTokenizer.from_pretrained("gpt2")

# Connect to the PostgreSQL database
conn = psycopg2.connect("dbname=vectordb user=vectoruser password=vectorpass host=localhost")
cur = conn.cursor()

def query_similar_documents(query, top_k=1):
    query_embedding = embedding_model.encode(query)
    
    cur.execute("""
        SELECT content, 1 - (embedding <=> %s) AS similarity
        FROM documents
        ORDER BY similarity DESC
        LIMIT %s
    """, (query_embedding.tolist(), top_k))
    
    return cur.fetchall()

def generate_response(query, context):
    prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
    input_ids = tokenizer.encode(prompt, return_tensors="pt")
    
    with torch.no_grad():
        output = llm_model.generate(input_ids, max_length=100, num_return_sequences=1, no_repeat_ngram_size=2)
    
    return tokenizer.decode(output[0], skip_special_tokens=True)

# Example usage
user_query = "Tell me an interesting fact about nature."
similar_docs = query_similar_documents(user_query)
context = similar_docs[0][0]  # Use the most relevant document as context

response = generate_response(user_query, context)

print(f"User Query: {user_query}")
print(f"Context: {context}")
print(f"AI Response: {response}")

cur.close()
conn.close()
```

## Bringing It All Together

Congratulations! You've just built a RAG system that can:

1. Store and retrieve vector embeddings of documents efficiently using PostgreSQL and pgvector.
2. Find the most relevant context for a given query.
3. Generate human-like responses using a language model, augmented with retrieved information.

This system forms the foundation for creating intelligent chatbots, question-answering systems, and other AI applications that can tap into specific knowledge bases.

Happy coding!
