---
date: 2025-11-16T17:00:00+05:30
title: "From Celery to Restate: Rethinking Async Tasks in Django"
description: "Exploring the transition from Celery to Restate for async task processing in Django applications, with practical examples and real-world comparisons."
tags:
  [
    "Django",
    "Celery",
    "Restate",
    "Python",
    "Async Tasks",
    "Microservices",
    "Tutorial",
    "Backend",
    "Development",
    "PostgreSQL",
  ]
category: "Development"
author: "Joel Hanson"
canonical_url: "https://joel-hanson.github.io/posts/from-celery-to-restate-rethinking-async-tasks-in-django/"
keywords:
  [
    "Django Celery",
    "Django Restate",
    "Celery vs Restate",
    "Django async tasks",
    "Task queue comparison",
    "Celery migration",
    "Python task processing",
    "Django best practices",
  ]
---

## The Celery Question

For years, when someone asked "How do I handle background tasks in Django?", the answer was almost always "Use Celery". And for good reason. Celery is mature, battle-tested, and has solved async task processing for countless Django applications. It has extensive documentation, a large ecosystem of plugins, and most Django developers have at least some experience with it.

But Celery also brings complexity. You need a message broker like Redis or RabbitMQ. You need to manage worker processes. You need to implement your own progress tracking if tasks need to report status. You need to handle state persistence separately if your tasks need to remember things across restarts. As your application grows, this infrastructure overhead grows with it.

I recently rebuilt a Django application that used Celery for handling email tasks, file processing, and data analysis jobs. The application worked fine, but I kept thinking about the infrastructure I was maintaining. Redis for the message broker and results backend. Multiple Celery worker processes. Flower for monitoring. Custom database models for tracking task progress. It was a lot of moving parts for what should be a straightforward problem.

That's when I started experimenting with [Restate](https://restate.dev/) as an alternative approach to async task processing in Django.

## Understanding the Architecture Difference

Before diving into code, let's understand how these systems differ architecturally.

Celery uses a message queue pattern. Your Django application puts tasks into a queue, workers pull tasks from the queue, and results go into a backend. State management and progress tracking are your responsibility. You store that information in your database or Redis and query it when needed.

```
Django → Redis Queue → Celery Workers → Results Backend → Database
```

Restate uses a service invocation pattern with built-in state management. Your Django application calls Restate services via HTTP. Restate handles durability, retries, and state persistence internally. The services themselves are stateless, but Restate's virtual objects provide durable state storage.

```
Django → Restate Runtime → Restate Services → Database
```

The fundamental difference is where responsibility for reliability and state lives. In Celery, you build it yourself. In Restate, it's built into the runtime.

## A Typical Celery Task

Let's look at how you'd implement an email sending task with Celery. This is representative of real production code:

```python
from celery import shared_task
from django.conf import settings
from .models import EmailTask

@shared_task(bind=True)
def send_email(self, email_id):
    try:
        email_task = EmailTask.objects.get(id=email_id)
        email_task.task_id = self.request.id
        email_task.status = "PROGRESS"
        email_task.save()
        
        # Simulate email sending with progress updates
        for i in range(1, 6):
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': i,
                    'total': 5,
                    'status': f'Step {i}/5: Processing email...'
                }
            )
            time.sleep(1)
        
        # Send the email
        email_task.status = "SUCCESS"
        email_task.sent_at = datetime.now()
        email_task.save()
        
        return {'status': 'Email sent successfully'}
        
    except Exception as exc:
        email_task.status = "FAILURE"
        email_task.save()
        raise self.retry(exc=exc, countdown=60, max_retries=3)
```

This works, but notice what you're responsible for. You're managing the database model for tracking task state. You're manually updating progress in both Celery's state and your database. You're implementing retry logic. You're handling exceptions and state transitions. This is boilerplate that every task needs.

## The Same Task with Restate

Here's the equivalent task implemented with Restate:

```python
import restate
from datetime import datetime
from typing import Dict, Any

email_service = restate.Service("EmailService")
task_tracker = restate.VirtualObject("TaskTracker")

@email_service.handler("send_email")
async def send_email_handler(ctx: restate.Context, task_data: Dict[str, Any]) -> Dict[str, Any]:
    task_id = task_data.get("task_id")
    to_email = task_data.get("to_email")
    subject = task_data.get("subject")
    message = task_data.get("message")
    
    # Simulate email sending with progress updates
    for i in range(1, 6):
        await ctx.object_client(task_tracker).set_state(
            f"email_progress_{task_id}",
            {"current": i, "total": 5, "status": f"Step {i}/5: Processing email..."}
        )
        await asyncio.sleep(1)
    
    # Send the email
    result = {
        "status": "Email sent successfully",
        "to": to_email,
        "subject": subject,
        "completed_at": datetime.now().isoformat()
    }
    
    await ctx.object_client(task_tracker).set_state(
        f"email_result_{task_id}",
        result
    )
    
    return result
```

The difference is subtle but significant. There's no explicit exception handling for retries because Restate handles that automatically. Progress tracking happens through virtual objects, which persist state durably without requiring a database model. The code focuses purely on the email sending logic.

## State Management: The Key Difference

In the Celery version, if you want to track task progress, you typically create a Django model:

```python
class EmailTask(models.Model):
    task_id = models.CharField(max_length=255, blank=True)
    to_email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, default='PENDING')
    sent_at = models.DateTimeField(null=True, blank=True)
```

Then you query this model to check task status. If your worker crashes mid-task, you need recovery logic to detect and handle stale tasks.

Restate's virtual objects provide durable state without database models. State persists across restarts automatically. If your service crashes mid-execution, Restate resumes exactly where it left off when the service restarts. You don't write recovery logic because the runtime guarantees completion.

## Invoking Tasks from Django Views

In Celery, you invoke tasks with `.delay()` or `.apply_async()`:

```python
from tasks.tasks import send_email

def create_email(request):
    email_task = EmailTask.objects.create(
        to_email=request.POST['email'],
        subject=request.POST['subject'],
        message=request.POST['message']
    )
    
    result = send_email.delay(email_task.id)
    email_task.task_id = result.id
    email_task.save()
    
    return redirect('email_list')
```

With Restate, you make HTTP calls to the runtime:

```python
import requests

RESTATE_ENDPOINT = os.environ.get("RESTATE_ENDPOINT", "http://restate:8080")

def create_email(request):
    email_task = EmailTask.objects.create(
        to_email=request.POST['email'],
        subject=request.POST['subject'],
        message=request.POST['message']
    )
    
    response = requests.post(
        f"{RESTATE_ENDPOINT}/EmailService/send_email",
        json={
            "task_id": str(email_task.id),
            "to_email": email_task.to_email,
            "subject": email_task.subject,
            "message": email_task.message
        }
    )
    
    return redirect('email_list')
```

The Restate approach is more explicit about being a remote call, which some developers prefer. It's clear that you're invoking a separate service rather than a Python function.

## Complex Workflows and Orchestration

Where Restate particularly shines is in complex, multi-step workflows. Imagine a file processing pipeline that validates a file, processes its contents, generates a report, and sends notifications.

In Celery, you'd use chains or chords:

```python
from celery import chain

workflow = chain(
    validate_file.s(file_id),
    process_contents.s(),
    generate_report.s(),
    send_notification.s()
)
workflow.apply_async()
```

This works, but error handling across steps is tricky. If step 3 fails, you need custom logic to determine what to retry and what to skip. State tracking across the workflow requires careful planning.

Restate has built-in workflow support:

```python
workflow_orchestrator = restate.Workflow("WorkflowOrchestrator")

@workflow_orchestrator.main()
async def run_file_workflow(ctx: restate.WorkflowContext, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
    file_id = workflow_data.get("file_id")
    
    # Each step is durable and resumable
    validation_result = await ctx.service_client(file_service).validate_file({"file_id": file_id})
    
    if validation_result["valid"]:
        processing_result = await ctx.service_client(file_service).process_contents({"file_id": file_id})
        report_result = await ctx.service_client(report_service).generate_report(processing_result)
        await ctx.service_client(notification_service).send_notification(report_result)
    
    return {"status": "completed", "file_id": file_id}
```

If this workflow crashes at any point, Restate resumes from the last completed step. You don't need to track which steps completed manually. The workflow is just async Python code, making it easier to understand and maintain than Celery's chain/chord abstractions.

## Monitoring and Observability

Celery typically uses Flower for monitoring. Flower provides a web interface showing active tasks, completed tasks, and worker status. It's a separate application you need to deploy and maintain.

Restate includes a dashboard at port 9070 that shows all service invocations, their status, and execution history. It's built into the runtime, so there's nothing extra to deploy.

For basic monitoring, Restate's built-in dashboard is often sufficient. For advanced use cases like custom metrics or alerting, both systems require integration with external monitoring tools.

## Performance Considerations

Celery is highly optimized for throughput. If you're processing thousands of simple tasks per second, Celery's message queue architecture is hard to beat. It's been refined over many years to handle high-volume task processing efficiently.

Restate adds durability guarantees that come with some overhead. Each service invocation is persisted, which ensures reliability but takes time. For tasks where you need absolute guarantees of completion, this overhead is worthwhile. For simple, stateless tasks that can be retried without consequences, Celery might be faster.

The trade-off is reliability versus raw throughput. Restate prioritizes reliability. Celery prioritizes throughput but leaves reliability concerns to you.

## Infrastructure Requirements

A Celery setup needs:
- Message broker (Redis or RabbitMQ)
- Celery worker processes
- Results backend (typically Redis or your database)
- Monitoring (Flower)
- Your Django application

A Restate setup needs:
- Restate runtime
- Restate service process
- Your Django application

Restate has fewer components, but the runtime is a new dependency you might not be familiar with. Celery's components are well-understood by most Django developers.

## When to Choose What

After rebuilding my Django application with both approaches, here's my perspective on when each makes sense.

Choose Celery when you need high-throughput task processing and are comfortable managing the infrastructure. If your tasks are relatively simple and you don't need complex state management, Celery's maturity and ecosystem make it a solid choice. If your team already knows Celery, the learning curve for staying with it is zero.

Choose Restate when you have complex workflows with significant state management needs. If your tasks must complete reliably even through failures, Restate's durability guarantees simplify your code significantly. If you're building something new and can adopt modern patterns, Restate reduces the infrastructure complexity you need to manage.

For existing applications already using Celery, migration to Restate requires careful planning. You're changing architecture fundamentally, not just swapping libraries. The benefits are real, but so is the effort of migration.

## Running Both Implementations

I've created two complete implementations of the same Django application. One uses Celery, the other uses Restate. Both handle email tasks, file processing, and data analysis with progress tracking.

The complete source code for both implementations is available on GitHub: [django-celery-restate-example](https://github.com/Joel-hanson/django-celery-restate-example)

To try the Celery version:

```bash
cd django-celery
docker-compose up
```

Access the application at http://localhost:8000 and Flower monitoring at http://localhost:5555.

To try the Restate version:

```bash
cd django-restate
docker-compose up
```

Access the application at http://localhost:8000 and Restate dashboard at http://localhost:9070.

Compare how the two implementations handle the same features. Look at the task definitions, how progress is tracked, how errors are handled, and how monitoring works. The differences become clear when you see them side by side.

## Migration Strategy

If you're considering moving from Celery to Restate, start small. Pick a single task type, implement it with Restate, and run both systems in parallel. Monitor how the Restate version performs and how your team adapts to the different patterns.

The service-based architecture of Restate actually makes this parallel operation straightforward. Your Django views can choose to invoke either Celery tasks or Restate services based on feature flags or environment configuration. This lets you migrate incrementally rather than all at once.

## Conclusion

Celery isn't going away, nor should it. It's a mature, capable system that serves Django applications well. But Restate represents a different philosophy about reliability and state management that's worth understanding.

Celery says "here's a powerful task queue, build your reliability layer on top of it". Restate says "reliability and state management are hard problems, we'll handle them so you can focus on your application logic".

Both approaches work. The right choice depends on your specific needs, your team's experience, and what trade-offs make sense for your application. Understanding both options helps you make that decision thoughtfully.

The complete examples for both implementations are available on GitHub at [django-celery-restate-example](https://github.com/Joel-hanson/django-celery-restate-example) for you to explore and compare. See how each approach handles the same problems and decide which patterns resonate with how you think about building reliable systems.

