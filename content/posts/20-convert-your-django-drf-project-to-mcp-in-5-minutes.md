---
date: 2025-08-03T15:20:06+05:30
title: "Convert Your Django DRF Project to MCP in 5 Minutes"
description: "Transform your existing Django REST Framework APIs into Model Context Protocol (MCP) tools that AI assistants like Claude can use - with zero configuration required."
tags:
  [
    "Django",
    "MCP",
    "AI",
    "API",
    "Python",
    "Claude",
    "REST Framework",
    "Tutorial",
    "Automation",
    "Development",
  ]
category: "Development"
author: "Joel Hanson"
canonical_url: "https://joel-hanson.github.io/posts/convert-your-django-drf-project-to-mcp-in-5-minutes/"
keywords:
  [
    "Django REST Framework",
    "Model Context Protocol",
    "MCP server",
    "AI integration",
    "Claude AI",
    "API automation",
    "Django tutorial",
    "Python development",
  ]
---

## The Problem: When APIs Meet AI Assistants

A few weeks ago, I was experimenting with [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) for a [Kafka integration project](/posts/16-breaking-kafka-walls-building-an-mcp-server-for-your-kafka-cluster/). The experience was eye-opening - being able to interact with complex systems through natural language felt like a glimpse into the future of development workflows.

After successfully getting MCP working with Kafka, I started thinking about other systems I could connect. That's when I looked at one of my old [Django](https://www.djangoproject.com/) projects.

The question hit me: "What if I could expose my existing Django APIs to [Claude](https://claude.ai/) through MCP or any other MCP client?"

My first instinct was to start mapping out individual MCP tools for each endpoint. But as I began sketching out the implementation, I realized I was about to rebuild everything I already had: well-tested ViewSets, comprehensive serializers, validated business logic.

Then it occurred to me - what if this could be completely automatic? What if any Django developer could add MCP support to their existing project with minimal changes? The more I thought about it, the more convinced I became that this should be a easy solution.

After some experimentation, I built exactly that: a universal bridge that transforms any [Django REST Framework](https://www.django-rest-framework.org/) project into an MCP-compatible server in under five minutes, without changing a single line of existing code.

## What You'll Achieve

This comprehensive guide will show you how to add Model Context Protocol support to your existing Django DRF project, enabling AI assistants to:

- **Interact with all your models** through your existing ViewSets
- **Execute custom business logic** you've defined with `@action` decorators
- **Understand your data structures** automatically from DRF serializers
- **Respect your validation rules** using your existing DRF validation logic

By the end of this tutorial, you'll have a fully functional MCP server that works with [Claude Desktop](https://claude.ai/), [VS Code](https://code.visualstudio.com/), [Warp Terminal](https://www.warp.dev/), and any other MCP-compatible client.

## Prerequisites

This guide assumes you have:

- A Django project with [Django REST Framework](https://www.django-rest-framework.org/) installed
- At least one `ModelViewSet` defined in your application
- Basic familiarity with Django URL configuration
- [Python 3.8+](https://www.python.org/downloads/) and Django 3.2+ installed

Here's an example of what we'll be working with:

```python
# Your existing ViewSet (remains completely unchanged)
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'status': 'activated'})
```

## Step 1: Add the MCP View

Download the MCP view class and add it to your Django project:

```bash
# In your Django project root
wget https://raw.githubusercontent.com/Joel-hanson/django-drf-mcp/main/mcp_view.py
```

This single file contains everything needed to convert your ViewSets to MCP tools. The implementation is lightweight and follows Django best practices for maximum compatibility.

> **Note**: You can also manually download the file from the [django-drf-mcp repository](https://github.com/Joel-hanson/django-drf-mcp) if you prefer.

## Step 2: Update Your URL Configuration

Add the MCP endpoint to your main `urls.py`:

```python
# urls.py
from django.contrib import admin
from django.urls import path, include
from mcp_view import MCPView  # Add this import

urlpatterns = [
    path('admin/', admin.site.urls),
    path('mcp/', MCPView.as_view(), name='mcp'),  # Add this line
    path('api/', include('your_app.urls')),  # Your existing URLs
]
```

**That's it.** No configuration files, no setup scripts, no database changes. The system will automatically discover all your ViewSets.

## Step 3: Test Your MCP Endpoint

Start your Django development server and verify the MCP endpoint:

```bash
python manage.py runserver
```

Test the tools discovery:

```bash
curl -X POST http://127.0.0.1:8000/mcp/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}'
```

You should see tools automatically generated for all your ViewSets.

## What Gets Auto-Discovered

The system automatically finds and converts:

### **All Your ViewSets**

```python
# These ViewSets automatically become MCP tools:
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class ProductViewSet(ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class OrderViewSet(ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
```

### **CRUD Operations**

Each ViewSet automatically gets these MCP tools:

- `list_{app}_{model}` - List all objects
- `create_{app}_{model}` - Create new object
- `retrieve_{app}_{model}` - Get object by ID
- `update_{app}_{model}` - Update existing object
- `destroy_{app}_{model}` - Delete object

### **Custom Actions**

Your `@action` methods become MCP tools automatically:

```python
class UserViewSet(ModelViewSet):
    # ... standard ViewSet code ...

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        # This becomes: activate_users_user
        pass

    @action(detail=False)
    def active_users(self, request):
        # This becomes: active_users_users_user
        pass
```

### **Schema Generation**

JSON schemas are automatically created from your DRF serializers:

```python
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name']

# Automatically generates:
# {
#   "type": "object",
#   "properties": {
#     "username": {"type": "string", "maxLength": 150},
#     "email": {"type": "string", "format": "email"},
#     "first_name": {"type": "string", "maxLength": 30},
#     "last_name": {"type": "string", "maxLength": 30}
#   },
#   "required": ["username", "email"]
# }
```

## Complete Example: Before and After

Let's examine a typical Django application to see exactly what changes:

### Before: Standard DRF API

```python
# models.py
class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField()
    is_active = models.BooleanField(default=True)

# serializers.py
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active']

# views.py
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'status': 'activated'})

# urls.py
router = DefaultRouter()
router.register(r'users', UserViewSet)
urlpatterns = [path('api/', include(router.urls))]
```

### After: Same Code + MCP Support

```python
# models.py - UNCHANGED
class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField()
    is_active = models.BooleanField(default=True)

# serializers.py - UNCHANGED
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active']

# views.py - UNCHANGED
class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'status': 'activated'})

# urls.py - ONE LINE ADDED
from mcp_view import MCPView  # Added

router = DefaultRouter()
router.register(r'users', UserViewSet)
urlpatterns = [
    path('api/', include(router.urls)),
    path('mcp/', MCPView.as_view(), name='mcp'),  # Added
]
```

### Result: Auto-Generated MCP Tools

```json
{
  "tools": [
    {
      "name": "list_your_app_user",
      "description": "List User in your_app"
    },
    {
      "name": "create_your_app_user",
      "description": "Create User in your_app"
    },
    {
      "name": "retrieve_your_app_user",
      "description": "Retrieve User in your_app"
    },
    {
      "name": "update_your_app_user",
      "description": "Update User in your_app"
    },
    {
      "name": "destroy_your_app_user",
      "description": "Destroy User in your_app"
    },
    {
      "name": "activate_your_app_user",
      "description": "Activate a user"
    }
  ]
}
```

## Step 4: Configure Claude Desktop

Create or update your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "my-django-project": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://127.0.0.1:8000/mcp/"]
    }
  }
}
```

Save this as `claude_desktop_config.json` in:

- **macOS**: `~/Library/Application Support/Claude/`
- **Windows**: `%APPDATA%/Claude/`
- **Linux**: `~/.config/Claude/`

**Important Notes:**

- Install `mcp-remote` first: `npm install -g mcp-remote`
- Restart Claude Desktop after configuration changes
- Ensure your Django server is running on `http://127.0.0.1:8000`
- Make sure your Django project has `CORS_ALLOW_ALL_ORIGINS = True` in settings for local development

For production deployments, consider using [django-cors-headers](https://pypi.org/project/django-cors-headers/) for proper CORS configuration.

### Warp Terminal Configuration

[Warp Terminal](https://www.warp.dev/) supports MCP through its AI features. Configure it by adding this to your Warp MCP configuration:

```json
{
  "django-project": {
    "command": "npx",
    "args": ["-y", "mcp-remote", "http://127.0.0.1:8000/mcp/"],
    "env": {},
    "working_directory": null
  }
}
```

### VS Code Configuration

Configure [VS Code](https://code.visualstudio.com/) to work with your MCP server using the official MCP extension:

**Create VS Code settings** (`.vscode/mcp.json`):

```json
{
  "servers": {
    "django-project": {
      "type": "http",
      "url": "http://127.0.0.1:8000/mcp/"
    }
  }
}
```

### Alternative: Direct HTTP Configuration

For any MCP client that supports HTTP endpoints directly:

```json
{
  "servers": {
    "django-project": {
      "type": "http",
      "url": "http://127.0.0.1:8000/mcp/",
      "headers": {
        "Content-Type": "application/json"
      }
    }
  }
}
```

### Testing Your Configuration

Verify your setup works across all clients:

```bash
# Test the endpoint directly
curl -X POST http://127.0.0.1:8000/mcp/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}'
```

You should see a list of your auto-generated Django tools.

## Step 5: Start Using AI with Your Data

Restart Claude Desktop and begin interacting with your Django data through natural language:

**List your data:**

> "Show me all users in the system"

**Create records:**

> "Create a new user with username 'johndoe' and email 'john@example.com'"

**Execute custom actions:**

> "Activate the user with ID 5"

**Complex operations:**

> "Show me all inactive users and then activate them one by one"

Claude will automatically use your MCP tools to interact with your Django data while respecting all your existing validation rules and business logic.

## Advanced Configuration Options

### ViewSet Compatibility

The current implementation works specifically with **`ModelViewSet`** classes. Here's the compatibility breakdown:

| View Type              | Support Status   | Notes                            |
| ---------------------- | ---------------- | -------------------------------- |
| `ModelViewSet`         | ✅ Full support  | Automatic CRUD + custom actions  |
| `ReadOnlyModelViewSet` | ⚠️ Partial       | Only list/retrieve operations    |
| `ViewSet`              | ❌ Not supported | No standard CRUD pattern         |
| `APIView`              | ❌ Not supported | No auto-discovery possible       |
| `GenericAPIView`       | ❌ Not supported | Would need custom implementation |

### Extending Support for Other ViewSet Types

You can extend the implementation to support other ViewSet types:

```python
from rest_framework.viewsets import ViewSet, ReadOnlyModelViewSet
from mcp_view import CustomMCPView

class ExtendedMCPView(CustomMCPView):
    def get_viewset_classes(self):
        """Support multiple ViewSet types."""
        viewset_classes = []

        for app_config in apps.get_app_configs():
            if app_config.name.startswith("django."):
                continue

            try:
                views_module = importlib.import_module(f"{app_config.name}.views")

                for attr_name in dir(views_module):
                    attr = getattr(views_module, attr_name)

                    if inspect.isclass(attr):
                        # Support ModelViewSet (full CRUD)
                        if issubclass(attr, ModelViewSet) and attr != ModelViewSet:
                            viewset_classes.append((attr, app_config.name, 'full'))

                        # Support ReadOnlyModelViewSet (list/retrieve only)
                        elif issubclass(attr, ReadOnlyModelViewSet) and attr != ReadOnlyModelViewSet:
                            viewset_classes.append((attr, app_config.name, 'readonly'))

                        # Support custom ViewSet with @action methods
                        elif issubclass(attr, ViewSet) and attr != ViewSet:
                            viewset_classes.append((attr, app_config.name, 'custom'))

            except (ImportError, AttributeError):
                continue

        return viewset_classes

    def generate_tools_for_viewset(self, viewset_class, app_name, viewset_type):
        """Generate tools based on ViewSet type."""
        tools = []

        if viewset_type == 'full':
            # Full CRUD for ModelViewSet
            tools.extend(self.get_crud_tools(viewset_class, app_name))
        elif viewset_type == 'readonly':
            # Only list and retrieve for ReadOnlyModelViewSet
            tools.extend(self.get_readonly_tools(viewset_class, app_name))
        elif viewset_type == 'custom':
            # Only @action methods for custom ViewSet
            tools.extend(self.get_action_tools(viewset_class, app_name))

        return tools
```

### Working with APIView Classes

For `APIView` classes, you'd need a different approach since they don't follow standard patterns:

```python
class APIViewMCPView(CustomMCPView):
    def get_custom_tools(self):
        """Manually define tools for APIView endpoints."""
        return [
            {
                "name": "custom_api_endpoint",
                "description": "Call a custom API endpoint",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "data": {"type": "object", "description": "Request data"}
                    }
                }
            }
        ]

    def handle_custom_tool(self, tool_name: str, arguments: dict) -> str:
        """Handle custom APIView calls."""
        if tool_name == "custom_api_endpoint":
            # Create a request and call your APIView manually
            factory = RequestFactory()
            request = factory.post('/custom/', data=arguments.get('data', {}))

            from myapp.views import MyCustomAPIView
            view = MyCustomAPIView()
            response = view.post(request)

            return json.dumps(response.data)
```

### Adding Custom Business Logic Tools

Extend the system with your own custom tools:

```python
class MyProjectMCPView(CustomMCPView):
    def get_custom_tools(self):
        return [
            {
                "name": "user_statistics",
                "description": "Get user statistics for the platform",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "period": {
                            "type": "string",
                            "enum": ["day", "week", "month"],
                            "description": "Statistics period"
                        }
                    }
                }
            }
        ]

    def handle_custom_tool(self, tool_name: str, arguments: dict) -> str:
        if tool_name == "user_statistics":
            period = arguments.get("period", "month")
            active_users = User.objects.filter(is_active=True).count()
            total_users = User.objects.count()

            return f"Statistics for {period}: {active_users}/{total_users} users active"
```

## Common Use Cases

### **Content Management Systems**

> "Show me all blog posts published this month"
> "Create a new blog post with title 'Django MCP Integration'"

_Similar to how we automated [Markdown publishing workflows](/posts/how-i-automated-my-markdown-publishing-on-medium-no-more-manual-work/), this approach streamlines content management through AI._

### **Data Analysis and Reporting**

> "How many orders were placed yesterday?"
> "Show me users who haven't logged in for 30 days"

_For complex data processing tasks, consider combining this with [real-time processing solutions](/posts/deduplication-for-kafka-using-flink/) or [RAG systems](/posts/setting-up-rag-with-postgre-sql-and-pgvector/) for enhanced analytics._

### **Administrative Tasks**

> "Deactivate all users with invalid email addresses"
> "Generate a report of recent product orders"

### **Customer Support Operations**

> "Find user with email john@example.com"
> "Show all orders for user ID 123"

## Troubleshooting Common Issues

### Tool Not Found Error

```
Error: Tool 'list_myapp_user' not found
```

**Solution:** Verify that your ViewSet inherits from `ModelViewSet` and has a `queryset` attribute properly defined.

### Schema Validation Error

```
Error: Required field 'username' missing
```

**Solution:** Your DRF serializer validation rules are working correctly. Ensure all required fields are provided when creating or updating records.

### Import Error

```
ImportError: cannot import name 'MCPView'
```

**Solution:** Confirm that `mcp_view.py` is in your project root directory or accessible in your Python path.

## Production Considerations

### Performance Optimization

- **Caching**: ViewSet discovery occurs once at startup, minimizing runtime overhead
- **Security**: Consider adding authentication middleware if your MCP endpoint needs access control. Learn more about [Django authentication](https://docs.djangoproject.com/en/stable/topics/auth/)
- **Rate Limiting**: Implement rate limiting for production APIs to prevent abuse using [django-ratelimit](https://pypi.org/project/django-ratelimit/)
- **Database Optimization**: Use `select_related()` and `prefetch_related()` in your ViewSets for better query performance

### Scaling for Large Projects

```python
# For projects with many ViewSets, consider selective exposure
class OptimizedMCPView(CustomMCPView):
    def get_viewset_classes(self):
        # Only expose ViewSets you actually want as MCP tools
        from myapp.views import UserViewSet, ProductViewSet
        return [
            (UserViewSet, 'myapp'),
            (ProductViewSet, 'myapp'),
        ]
```

## Why This Approach Works

### **Zero Breaking Changes**

Your existing DRF APIs continue to function exactly as before. MCP support is purely additive, requiring no modifications to your existing codebase.

### **Leverages Existing Infrastructure**

- Uses your existing models, serializers, and ViewSets without modification
- Respects your validation rules and business logic
- Works seamlessly with your existing authentication and permission systems

### **Automatic Scaling**

- Adding new ViewSets automatically creates new MCP tools
- Custom actions become MCP tools instantly
- No configuration files to maintain or update

### **Production Ready**

- Type-safe implementation with comprehensive error handling
- Follows Django and DRF best practices
- Minimal performance impact on your existing APIs

## Developer Experience Transformation

### Before MCP Integration

```bash
# Manual API testing required multiple steps
curl -X POST http://localhost:8000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com"}'
```

### After MCP Integration

> **Developer:** "Create a user named John with email john@example.com"  
> **Claude:** "I'll create that user for you right now."
>
> User created successfully with ID 42

### Complex Operations Comparison

**Before (Multiple API calls):**

```bash
curl http://localhost:8000/api/users/
curl -X POST http://localhost:8000/api/users/5/activate/
curl http://localhost:8000/api/orders/?user=5
```

**After (Natural language):**

> **Developer:** "Show me user 5, activate them, then show their orders"  
> **Claude:** "Here's user 5's details... Now activating them... Here are their 3 orders..."

## Real Project Examples

### E-commerce Platform

```python
# Existing ViewSets automatically become:
# - list_products_product
# - create_orders_order
# - update_inventory_item
# - activate_users_user

# AI can now:
# "Show me low-stock products"
# "Create an order for user@example.com with product ID 123"
# "Find all orders from the last week"
```

### Content Management System

```python
# Existing ViewSets:
# - BlogPostViewSet
# - CategoryViewSet
# - CommentViewSet

# AI workflows:
# "Create a blog post about Django MCP integration"
# "Show me all unpublished posts from this month"
# "Moderate comments on post 'MCP Tutorial'"
```

### Customer Support Platform

```python
# Existing ViewSets:
# - TicketViewSet
# - CustomerViewSet
# - AgentViewSet

# AI assistance:
# "Show me all open tickets assigned to John"
# "Create a high-priority ticket for customer@email.com"
# "Find tickets about billing issues"
```

## Resources & Links

- **Complete Implementation**: [django-drf-mcp repository](https://github.com/Joel-hanson/django-drf-mcp)
- **MCP View Source**: [mcp_view.py](https://github.com/Joel-hanson/django-drf-mcp/blob/main/django_mcp_project/mcp_view.py)
- **Usage Examples**: [mcp_usage_example.py](https://github.com/Joel-hanson/django-drf-mcp/blob/main/mcp_usage_example.py)
- **Model Context Protocol**: [Official MCP Documentation](https://modelcontextprotocol.io/)
- **Django REST Framework**: [Official DRF Documentation](https://www.django-rest-framework.org/)
- **Claude AI**: [Claude Desktop Application](https://claude.ai/)

### Related Tools and Libraries

- **mcp-remote**: [NPM Package for HTTP MCP Servers](https://www.npmjs.com/package/mcp-remote)
- **django-cors-headers**: [CORS Handling for Django](https://pypi.org/project/django-cors-headers/)
- **django-ratelimit**: [Rate Limiting for Django](https://pypi.org/project/django-ratelimit/)

## Conclusion

Converting your Django DRF project to support MCP takes **less than 5 minutes** and opens up powerful AI-assisted workflows. You don't need to change any existing code - just add one file and one URL pattern.

The beauty of this approach is that it:

- **Respects your existing architecture**
- **Scales with your project growth**
- **Requires zero maintenance**
- **Enables powerful AI workflows**

Whether you're managing users, processing orders, or handling content, AI assistants can now interact with your Django data using natural language - while respecting all your existing business logic and validation rules.

This integration represents a significant step forward in making APIs more accessible and user-friendly through natural language interfaces. As AI continues to evolve, having your Django applications MCP-ready positions you at the forefront of this technological shift.

---

_Ready to give your Django project AI superpowers? [Download the MCP view](https://github.com/Joel-hanson/django-drf-mcp) and let me know how it transforms your development workflow!_

---

## Related Articles

### AI & Development Integration

- **[Breaking Kafka Walls: Building an MCP Server for Your Kafka Cluster](/posts/16-breaking-kafka-walls-building-an-mcp-server-for-your-kafka-cluster/)** - Learn how to integrate Kafka with AI assistants using MCP
- **[Build Real-Time Web Apps with Minimal Code](/posts/11-build-real-time-web-apps-with-minimal-code/)** - Discover modern approaches to building responsive applications

### API Development & Integration

- **[Build Custom Kafka Connectors Fast with This Open Source Template](/posts/13-build-custom-kafka-connectors-fast-with-this-open-source-template/)** - Streamline your data pipeline development
- **[Turn GitHub into Your Free Data Platform: Building APIs with GitHub Actions](/posts/19-turn-git-hub-into-your-free-data-platform-building-ap-is-with-git-hub-actions/)** - Create powerful APIs using GitHub's infrastructure

### Automation & Productivity

- **[How I Automated My Markdown Publishing on Medium: No More Manual Work](/posts/15-how-i-automated-my-markdown-publishing-on-medium-no-more-manual-work/)** - Automate your content publishing workflow
- **[Useful Git Aliases for a Productive Workflow](/posts/05-useful-git-aliases-for-a-productive-workflow/)** - Boost your development productivity with Git shortcuts

### Data Engineering & Processing

- **[Setting Up RAG with PostgreSQL and pgvector](/posts/06-setting-up-rag-with-postgre-sql-and-pgvector/)** - Build intelligent data retrieval systems
- **[Deduplication for Kafka Using Flink](/posts/10-deduplication-for-kafka-using-flink/)** - Handle duplicate data in real-time streaming

---

## Stay Connected

- **Blog**: [https://joel-hanson.github.io/](/)
- **GitHub**: [Joel-hanson](https://github.com/Joel-hanson)
- **LinkedIn**: [Joel-hanson](https://www.linkedin.com/in/joel-hanson/)

_Found this tutorial helpful? Share it with your fellow developers and help them supercharge their Django projects with AI capabilities!_
