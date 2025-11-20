# MindCubes Architecture

Detailed architecture documentation for the MindCubes AI Agent Platform.

## System Overview

MindCubes is a three-tier application consisting of:

1. **AI Engine (Python)** - Core AI agent framework with training capabilities
2. **Backend API (Node.js)** - RESTful API server with database integration
3. **Frontend (React)** - Web-based user interface

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  - Dashboard, Agent Management, Task Monitoring          │
└───────────────────────────┬─────────────────────────────┘
                            │ REST API
┌───────────────────────────┴─────────────────────────────┐
│                   Backend API (Node.js)                  │
│  - Authentication, Database, Business Logic              │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────┴────────┐  ┌──────┴──────┐  ┌────────┴────────┐
│   MongoDB      │  │   Redis     │  │  AI Engine      │
│   (Database)   │  │   (Cache)   │  │  (Python)       │
└────────────────┘  └─────────────┘  └─────────────────┘
```

## AI Engine Architecture (Python)

### Core Components

#### 1. Base Classes (`ai-engine/core/`)

**BaseAgent**
- Abstract base class for all agents
- Handles LLM communication
- Manages tools and memory
- Tracks execution statistics

**BaseTool**
- Abstract base class for tools
- Parameter validation
- Execution tracking
- Error handling

**LLMProvider**
- Abstraction for different LLM backends
- OpenAI, Anthropic, Local models
- Streaming support
- Token tracking

**Memory**
- Conversation history storage
- Semantic search (vector memory)
- Persistent storage options

**Task & Orchestrator**
- Task lifecycle management
- Priority-based queuing
- Multi-agent orchestration
- Concurrent execution

#### 2. Specialized Agents (`ai-engine/agents/`)

Each agent is highly specialized for specific tasks:

- **CodeAgent**: Code generation, debugging, refactoring
- **DataAnalysisAgent**: Data processing, visualization, insights
- **ResearchAgent**: Information gathering, summarization
- **TaskPlannerAgent**: Task decomposition, workflow planning

**Agent Lifecycle:**
```
Create → Register → Execute Tasks → Update Stats → Archive
```

#### 3. Tools (`ai-engine/tools/`)

Tools extend agent capabilities:

- **WebSearchTool**: Internet search
- **CodeExecutorTool**: Safe code execution
- **FileManagerTool**: File operations
- **APICallerTool**: HTTP requests
- **DataProcessorTool**: Data transformation

**Tool Execution Flow:**
```
Validate Params → Execute → Track Stats → Return Result
```

#### 4. Model Management (`ai-engine/models/`)

**ModelTrainer**
- Full model training from scratch
- Dataset preparation
- Training loop management
- Checkpoint saving

**FineTuner**
- Fine-tuning pre-trained models
- Task-specific adaptation
- Multiple task types support

**LoRAAdapter**
- Parameter-efficient fine-tuning
- Low resource requirements
- Quick adaptation

**ModelManager**
- Model registry
- Lifecycle management
- Loading/unloading
- Usage tracking

### Data Flow

```
User Input → Agent Selection → Tool Usage → LLM Processing → Output
     ↓             ↓              ↓            ↓              ↓
  Memory ←─── Task Queue ←─── Orchestrator ←─ Statistics ← History
```

## Backend API Architecture (Node.js)

### Layer Structure

```
┌─────────────────────────────────────────┐
│         Routes (API Endpoints)           │
│  /api/v1/agents, /tasks, /models        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│           Controllers                    │
│  Business Logic & Request Handling       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│          Models (Mongoose)               │
│  Agent, Task, Model, User schemas       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│            Database (MongoDB)            │
└─────────────────────────────────────────┘
```

### Key Components

#### 1. Models (`backend/src/models/`)

**Agent Model**
```javascript
{
  name, type, description, status,
  configuration: { llmProvider, modelName, temperature },
  tools: [],
  stats: { totalTasks, completedTasks, failedTasks }
}
```

**Task Model**
```javascript
{
  title, description, agent, status, priority,
  inputData, outputData, errorMessage,
  retryCount, startedAt, completedAt, duration
}
```

**Model Model**
```javascript
{
  modelId, name, type, modelPath,
  status, metadata, trainingConfig,
  usage: { totalRequests, totalTokens, averageLatency }
}
```

**User Model**
```javascript
{
  username, email, password (hashed),
  role, isActive, lastLogin, apiKey
}
```

#### 2. Authentication Flow

```
Request → JWT/API Key Check → User Verification → Role Check → Allow/Deny
```

**JWT Flow:**
1. User logs in with credentials
2. Server validates and generates JWT
3. Client stores JWT
4. JWT sent with each request
5. Server verifies JWT

**API Key Flow:**
1. User generates API key
2. API key stored in database
3. Client sends API key in header
4. Server validates against database

#### 3. Middleware Stack

```
Request
  → Rate Limiting
  → CORS
  → Body Parsing
  → Authentication
  → Authorization
  → Route Handler
  → Error Handler
Response
```

### API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/api-key` - Generate API key

#### Agents
- `GET /api/v1/agents` - List agents
- `GET /api/v1/agents/:id` - Get agent details
- `POST /api/v1/agents` - Create agent
- `PUT /api/v1/agents/:id` - Update agent
- `DELETE /api/v1/agents/:id` - Delete agent
- `GET /api/v1/agents/:id/stats` - Get agent statistics

#### Tasks
- `GET /api/v1/tasks` - List tasks
- `GET /api/v1/tasks/:id` - Get task details
- `POST /api/v1/tasks` - Create task
- `PUT /api/v1/tasks/:id` - Update task
- `POST /api/v1/tasks/:id/cancel` - Cancel task
- `POST /api/v1/tasks/:id/retry` - Retry failed task
- `GET /api/v1/tasks/stats` - Get task statistics

#### Models
- `GET /api/v1/models` - List models
- `GET /api/v1/models/:id` - Get model details
- `POST /api/v1/models` - Register model
- `PUT /api/v1/models/:id` - Update model
- `DELETE /api/v1/models/:id` - Delete model
- `GET /api/v1/models/:id/stats` - Get model statistics

## Frontend Architecture (React)

### Component Structure

```
App
├── Layout (Sidebar + Header)
│   ├── Dashboard
│   ├── Agents
│   │   └── AgentDetail
│   ├── Tasks
│   │   └── TaskDetail
│   └── Models
├── Login
└── Register
```

### State Management

**Zustand Stores:**
- `authStore` - Authentication state and methods

**React Query:**
- Server state caching
- Automatic refetching
- Optimistic updates
- Error handling

### Data Flow

```
Component → API Service → Backend API → Database
    ↑                                      │
    └──────── React Query Cache ──────────┘
```

### Key Features

#### 1. Authentication
- JWT-based authentication
- Protected routes
- Persistent login state
- Auto-redirect on 401

#### 2. Real-time Updates
- Polling for task status
- React Query auto-refresh
- Optimistic UI updates

#### 3. Responsive Design
- Mobile-first approach
- Tailwind CSS
- Modern UI components

## Database Schema

### MongoDB Collections

**users**
```javascript
{
  _id: ObjectId,
  username: String,
  email: String (unique),
  password: String (hashed),
  role: String,
  isActive: Boolean,
  lastLogin: Date,
  apiKey: String,
  createdAt: Date,
  updatedAt: Date
}
```

**agents**
```javascript
{
  _id: ObjectId,
  name: String (unique),
  type: String,
  description: String,
  status: String,
  configuration: Object,
  tools: Array,
  stats: Object,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

**tasks**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  agent: ObjectId (ref: Agent),
  status: String,
  priority: String,
  inputData: Object,
  outputData: Object,
  errorMessage: String,
  retryCount: Number,
  maxRetries: Number,
  startedAt: Date,
  completedAt: Date,
  duration: Number,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

**models**
```javascript
{
  _id: ObjectId,
  modelId: String (unique),
  name: String,
  type: String,
  baseModel: String,
  modelPath: String,
  status: String,
  metadata: Object,
  trainingConfig: Object,
  usage: Object,
  isPublic: Boolean,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes

**Performance Optimization:**
- `users.email` (unique)
- `agents.name` (unique)
- `agents.type`
- `tasks.agent + tasks.status`
- `tasks.status + tasks.priority`
- `models.modelId` (unique)

## Security Architecture

### Authentication & Authorization
- JWT tokens with expiration
- Bcrypt password hashing
- API key support
- Role-based access control (RBAC)

### API Security
- Rate limiting
- CORS configuration
- Helmet security headers
- Input validation (Joi)
- SQL injection prevention (Mongoose)
- XSS protection

### Best Practices
- Environment variables for secrets
- No sensitive data in logs
- Secure password requirements
- HTTPS in production
- Security headers

## Scalability Considerations

### Horizontal Scaling
- Stateless backend servers
- Load balancer ready
- Database connection pooling
- Redis for session storage

### Performance Optimization
- Database indexing
- Query optimization
- Caching strategies
- Lazy loading
- Code splitting

### Monitoring
- Application logs (Winston)
- Error tracking
- Performance metrics
- Resource usage monitoring

## Future Enhancements

### Planned Features
1. **WebSocket Support** - Real-time task updates
2. **Task Queuing** - Bull/Redis queue for task processing
3. **Model Serving** - Dedicated model inference service
4. **Monitoring Dashboard** - System health and metrics
5. **Plugin System** - Custom agent/tool plugins
6. **Multi-tenancy** - Organization support
7. **API Rate Limiting** - Per-user quotas
8. **Audit Logging** - Complete audit trail

### Scalability Roadmap
1. Microservices architecture
2. Message queue integration
3. Distributed training
4. Multi-region deployment
5. CDN integration
6. Database sharding

## Development Guidelines

### Code Organization
- Follow OOP principles
- Separate concerns
- DRY (Don't Repeat Yourself)
- Single Responsibility Principle
- Interface segregation

### Testing Strategy
- Unit tests for core logic
- Integration tests for APIs
- E2E tests for critical flows
- Mock external services
- Test coverage > 80%

### Documentation
- Code comments for complex logic
- API documentation (OpenAPI/Swagger)
- Architecture decision records
- Inline documentation
- README files

### Version Control
- Feature branches
- Pull request reviews
- Semantic versioning
- Changelog maintenance
- Git commit conventions

