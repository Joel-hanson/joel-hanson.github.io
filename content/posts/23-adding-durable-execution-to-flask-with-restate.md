---
date: 2025-11-16T16:00:00+05:30
title: "Adding Durable Execution to Flask Applications with Restate"
description: "Learn how to enhance your Flask applications with Restate for reliable, fault-tolerant operations without changing your core application logic."
tags:
  [
    "Flask",
    "Restate",
    "Python",
    "Durable Execution",
    "Microservices",
    "Tutorial",
    "Backend",
    "Development",
    "PostgreSQL",
    "Docker",
  ]
category: "Development"
author: "Joel Hanson"
canonical_url: "https://joel-hanson.github.io/posts/adding-durable-execution-to-flask-with-restate/"
keywords:
  [
    "Flask Restate",
    "Durable execution",
    "Flask reliability",
    "Restate tutorial",
    "Python microservices",
    "Fault tolerance",
    "Flask best practices",
    "Service reliability",
  ]
---

## The Challenge of Reliable Background Operations

Building web applications with Flask is straightforward until you need to handle operations that can fail. Database operations timeout, external APIs become unavailable, and network connections drop. These failures are inevitable in production systems, yet handling them gracefully often requires significant engineering effort.

Recently, I was trying to build a Todo application where users could create, update, and delete tasks. On the surface, this seems simple. But when you start thinking about production scenarios, questions emerge. What happens if the database connection fails mid-operation? How do you handle retries without duplicating operations? What if the server crashes while processing a delete request?

I could have built custom retry logic, implemented a job queue, and added manual state tracking. But that would mean writing and maintaining infrastructure code instead of focusing on the application itself. That's when I discovered [Restate](https://restate.dev/) and its approach to durable execution.

## What is Durable Execution?

Before diving into the implementation, let's understand what durable execution means. When you mark an operation as durable, the system guarantees it will complete even if failures occur along the way. If your application crashes mid-execution, Restate picks up exactly where it left off once your service restarts. No lost operations, no duplicate executions, no manual recovery logic needed.

This is fundamentally different from traditional error handling. Instead of catching exceptions and implementing retry logic throughout your codebase, you declare operations as durable and let Restate handle the complexity of ensuring they complete successfully.

## Starting with a Basic Flask Application

Let's look at a standard Flask application that manages todos. Here's how a typical route handles creating a new todo:

```python
from flask import Blueprint, redirect, request, url_for
from models.database import db
from models.todo import Todo

todo_routes = Blueprint("todo_routes", __name__)

@todo_routes.route("/add", methods=["POST"])
def add_todo():
    task = request.form.get("task")
    if task:
        new_todo = Todo(task=task)
        db.session.add(new_todo)
        db.session.commit()
    return redirect(url_for("todo_routes.index"))
```

This code works fine in development, but in production, the `db.session.commit()` call can fail for numerous reasons. You could wrap it in a try-except block, implement retry logic, and add logging. But this approach has limitations. Each route needs its own error handling, retry policies must be carefully tuned, and you're still responsible for tracking operation state across failures.

## Introducing Restate to the Architecture

Rather than modifying every route with error handling code, we can introduce Restate as a reliability layer. The architecture becomes:

```
Flask Routes → Restate Services → Database Operations
```

Your Flask routes remain clean and focused on HTTP handling. Restate services encapsulate the actual database operations with built-in durability and retry capabilities.

## Creating Restate Services

First, let's define a Restate service that handles todo operations. Create a new file for your Restate services:

```python
import restate
from datetime import timedelta
from dataclasses import asdict
from pydantic import BaseModel
from models.todo import Todo
from services.flask_app import app, db

todo_service = restate.Service("TodoService")

class TodoRequest(BaseModel):
    task: str

@todo_service.handler()
async def add_todo(ctx: restate.Context, req: TodoRequest) -> dict:
    def db_operation():
        with app.app_context():
            todo = Todo(task=req.task)
            db.session.add(todo)
            db.session.commit()
            return asdict(todo)
    
    await ctx.run_typed("db_add", db_operation)
    return {"message": "Todo added successfully"}
```

Notice how the database operation is wrapped in `ctx.run_typed()`. This is where Restate's durability kicks in. The operation becomes atomic and recoverable. If it fails, Restate automatically retries with exponential backoff. If your application crashes, Restate persists the execution state and resumes when your service comes back online.

## Configuring Retry Policies

Different operations have different reliability requirements. For a delete operation, you might want more aggressive retry behavior:

```python
class TodoItemRequest(BaseModel):
    todo_id: int

@todo_service.handler()
async def delete_todo(ctx: restate.Context, req: TodoItemRequest) -> None:
    def db_operation():
        with app.app_context():
            todo = db.session.get(Todo, req.todo_id)
            if todo is None:
                raise ValueError(f"Todo with id {req.todo_id} not found")
            db.session.delete(todo)
            db.session.commit()
    
    await ctx.run_typed(
        "db_delete",
        db_operation,
        restate.RunOptions(max_attempts=3, max_retry_duration=timedelta(seconds=30))
    )
```

The `RunOptions` parameter lets you control exactly how Restate handles failures for this specific operation. You can set maximum retry attempts, retry duration, and other policies without cluttering your business logic with retry code.

## Updating Flask Routes

Now update your Flask routes to call Restate services instead of directly manipulating the database:

```python
import requests
import os

RESTATE_ENDPOINT = os.environ.get("RESTATE_ENDPOINT", "http://restate:8080")

@todo_routes.route("/add", methods=["POST"])
def add_todo():
    task = request.form.get("task")
    if task:
        response = requests.post(
            f"{RESTATE_ENDPOINT}/TodoService/add_todo",
            json={"task": task}
        )
    return redirect(url_for("todo_routes.index"))
```

The route is now simpler and focused solely on HTTP concerns. It receives the request, forwards it to Restate, and returns a response. All reliability concerns are handled by Restate.

## Setting Up the Restate Server

You need a separate server process to host your Restate services. Create a `restate_server.py` file:

```python
import asyncio
import restate
from hypercorn.asyncio import serve
from hypercorn.config import Config
from services.todo_service import todo_service

app = restate.app(services=[todo_service])

def main():
    config = Config()
    config.bind = ["0.0.0.0:9080"]
    asyncio.run(serve(app, config))

if __name__ == "__main__":
    main()
```

This creates a separate service that runs alongside your Flask application. The Restate runtime sits between them, handling invocations, managing state, and ensuring durability.

## Docker Compose Configuration

The complete system involves three main components: your Flask application, the Restate service server, and the Restate runtime. Here's how they work together in Docker Compose:

```yaml
services:
  web:
    build: .
    ports:
      - "5050:5050"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/todos
      - RESTATE_ENDPOINT=http://restate:8080
    command: python src/app.py
    depends_on:
      - db
      - restate

  restate_app:
    build: .
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/todos
    command: python src/restate_server.py
    ports:
      - "9080:9080"
    depends_on:
      - db

  restate:
    image: docker.restate.dev/restatedev/restate:latest
    ports:
      - "8080:8080"
      - "9070:9070"
    depends_on:
      - restate_app

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=todos
    ports:
      - "5432:5432"
```

The `restate` service is the runtime that manages executions. Your Flask app (`web`) sends requests to it, and it forwards them to your Restate services (`restate_app`) with all the durability guarantees.

## Observability and Monitoring

One of Restate's strengths is its built-in observability. The runtime includes a dashboard accessible at `http://localhost:9070` that shows all service invocations, their current state, and execution history.

When an operation fails and retries, you can see exactly what happened in the dashboard. When your application crashes and resumes, you can track which operations were in-flight and how they completed. This visibility is invaluable for debugging production issues.

## Performance Considerations

Adding Restate introduces an extra network hop between your Flask application and your database operations. For most applications, this latency is negligible compared to the database operation itself. However, you should consider this trade-off.

The benefit is that Restate handles durability, retries, and state management that you would otherwise implement manually. For operations where reliability is critical, this is almost always a worthwhile trade-off. For simple read operations that don't require durability, you might keep them as direct database calls in your Flask routes.

## When to Use Restate with Flask

Restate shines in scenarios where operation reliability matters:

**Financial Transactions**: Operations that must complete exactly once, even if systems fail.

**External API Calls**: When your Flask application integrates with third-party services that might be unreliable.

**Multi-Step Workflows**: Complex operations that span multiple services or databases.

**Background Jobs**: Long-running tasks that need to survive application restarts.

For simple CRUD applications with low reliability requirements, Restate might be overkill. But for production systems where failures are costly, it provides a robust foundation for reliable operations.

## Getting Started

I've created a complete example with two implementations: a basic Flask application and the same application enhanced with Restate. The repository includes full Docker Compose configurations for both versions, making it easy to compare the approaches side by side.

The complete source code for both implementations is available on GitHub: [flask-restate-example](https://github.com/Joel-hanson/flask-restate-example)

To try it yourself:

```bash
# Basic Flask version
cd flask-todo
docker-compose up

# Flask with Restate version
cd flask-todo-restate
docker-compose up
```

The basic version demonstrates traditional Flask development with direct database operations. The Restate version shows how to add durability without changing your core application logic. Compare the two implementations to see how Restate changes the architecture and where the reliability benefits emerge.

## Conclusion

Building reliable systems is hard. Restate doesn't make the hard parts disappear, but it consolidates them into a well-tested runtime rather than scattering reliability concerns throughout your application code.

Your Flask routes stay focused on HTTP handling. Your business logic stays focused on application concerns. And Restate handles the complex problems of durability, retries, and state management.

This separation of concerns makes your code easier to understand, test, and maintain. More importantly, it makes your application more reliable in production without requiring you to become an expert in distributed systems.

The complete example implementations are available on GitHub at [flask-restate-example](https://github.com/Joel-hanson/flask-restate-example) for you to explore and experiment with.

