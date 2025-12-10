# Scalable Task Scheduler 📚

A learning project where I explored how to build a scalable system with queues, clean architecture, and integration between different services.

## 🎯 Project Goal

This project was created to learn and understand:
- **Scalable Architecture** - How to design a system that grows over time
- **Modular Monolith** - Architecture that can be split into microservices when needed
- **Working with Queues** - BullMQ for scheduled jobs and RabbitMQ for event bus
- **Feature-Based Structure** - Organizing code by features instead of layers
- **Dependency Injection** - Creating flexible and testable code
- **Caching** - Using Redis to improve performance
- **Error Handling** - Centralized error handling with custom error classes

## 📦 What Does the System Do?

A simple task management system with reminders:
1. **Create Task** - User creates a task with a due date
2. **Automatic Reminder** - System schedules a reminder using BullMQ
3. **Notification** - When the date arrives, a notification is sent via Event Bus

## 🏗️ Architecture

This project follows a **Modular Monolith** architecture pattern. The infrastructure and architecture are designed so that each feature can be extracted into a separate microservice when needed, without major refactoring.

### Current Structure (Monolith)
```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Express API    │
│  (Controllers)  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│    Facades      │─────▶│   Services   │
└──────┬──────────┘      └──────┬───────┘
       │                         │
       ├─────────────────────────┤
       │                         │
       ▼                         ▼
┌─────────────┐          ┌──────────────┐
│  BullMQ     │          │  Repository  │
│  Scheduler  │          │   (Prisma)   │
└──────┬──────┘          └──────┬───────┘
       │                         │
       │                         ▼
       │                  ┌──────────────┐
       │                  │  PostgreSQL  │
       │                  └───────────────┘
       │
       ▼
┌─────────────┐
│   Worker    │
│ (Reminder)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ RabbitMQ    │
│ Event Bus   │
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────┐    ┌──────────────┐
│Listener  │    │ Notification │
│(Future)  │    │   Service    │
└──────────┘    └──────────────┘
```

### Why Modular Monolith?

The architecture is designed with microservices in mind:
- **Feature Isolation** - Each feature is self-contained with its own controllers, services, and repositories
- **Event-Driven Communication** - Features communicate via Event Bus, making it easy to split later
- **Dependency Injection** - Dependencies are injected, not hardcoded, allowing easy extraction
- **Shared Infrastructure** - Common infrastructure (queues, cache, DB) is abstracted behind interfaces

When the time comes to split into microservices, each feature can become its own service with minimal changes to the code structure.

## 🛠️ Tech Stack

| Technology | Usage |
|-----------|-------|
| **Node.js + TypeScript** | Project foundation |
| **Express** | API layer |
| **BullMQ** | Scheduling reminders (scheduled jobs) |
| **RabbitMQ** | Event Bus for asynchronous communication |
| **Redis** | Cache for performance improvement |
| **PostgreSQL + Prisma** | Database and ORM |
| **Jest** | Unit and integration tests |
| **Zod** | Data validation |

## 📁 Project Structure

```
src/
├── features/              # Features organized by domain
│   ├── tasks/            # Task management
│   │   ├── tasks.controller.ts
│   │   ├── tasks.facade.ts      # Orchestration + caching
│   │   ├── tasks.service.ts
│   │   ├── tasks.repository.ts
│   │   └── __tests__/
│   └── notifications/    # Notification management
│       ├── notifications.controller.ts
│       ├── notifications.facade.ts
│       ├── notifications.service.ts
│       ├── notifications.repository.ts
│       └── __tests__/
│
├── shared/                # Shared infrastructure
│   ├── cache/            # Redis caching
│   ├── queue/             # Queues and events
│   │   ├── scheduler/    # BullMQ scheduler
│   │   ├── event-bus/    # RabbitMQ event bus
│   │   └── tasks/        # RabbitMQ task queue (not currently used)
│   ├── middlewares/      # Express middlewares
│   ├── config/           # Configuration (DB, Redis, RabbitMQ)
│   └── utils/            # Utilities (logger)
│
├── workers/               # Background workers
│   └── reminder/         # Worker that handles reminders
│
└── container/             # Dependency Injection
```

## 🎓 What I Learned in This Project

### 1. Feature-Based Structure (FBS) & Modular Monolith
Instead of organizing by layers (controllers, services, repositories), I organized by features. Each feature contains all its layers, which makes it easier to:
- Understand the code - everything related to a task is in one place
- Add new features - just add a new folder
- Separate features - easier to migrate to microservices in the future

The architecture is designed as a **modular monolith** - all features run in the same process now, but the infrastructure (Event Bus, interfaces, dependency injection) is set up so that each feature can be extracted into its own microservice when needed, without major refactoring.

### 2. Dependency Injection
Instead of direct imports, each feature receives its dependencies through the constructor. This allows:
- Easier testing - can pass mocks
- Replacing implementations - for example, swap Event Bus without changing code
- Cleaner code - fewer hidden dependencies

### 3. Working with Queues
- **BullMQ** - For scheduled tasks (scheduled jobs). Learned how to schedule a task for the future and cancel it
- **RabbitMQ Event Bus** - For asynchronous communication between features. Learned how to publish and consume events
- **RabbitMQ Task Queue** - Implemented as future infrastructure (not currently used). Includes retry mechanism and dead letter queue

### 4. Caching with Redis
Learned how to add caching properly:
- Cache-aside pattern - first check cache, if not found - fetch from DB and store in cache
- Cache invalidation - delete cache when data changes
- Non-blocking - cache errors don't break the system

### 5. Centralized Error Handling
- Custom error classes (`NotFoundError`, `ValidationError`)
- Error middleware that handles all errors in one place
- Structured logging with request ID

### 6. Testing
- Unit tests for each layer
- Integration tests for controllers
- Coverage of 91%+

## 🔧 Special Features

### Caching Strategy
The system uses Redis for caching:
- **Task by ID** - `task:{id}` with 1 hour TTL
- **User Tasks** - `tasks:user:{userId}` with 1 hour TTL
- **Cache Invalidation** - Automatically deletes when a task is created/updated/deleted

### Error Handling
- All errors go through `errorHandlerMW`
- Custom errors with appropriate status codes
- Built-in logging with request ID

### Validation
- Zod schemas for all inputs
- Middleware that handles validation errors
- Type-safe with TypeScript

## 📝 Important Notes

### Consumer/Producer Infrastructure
The project includes a fully implemented `RabbitTaskQueue` (consumer/producer) infrastructure that is **not currently used**. The infrastructure includes:
- Retry mechanism (up to 3 attempts)
- Dead Letter Queue (DLQ) for failed tasks
- Prefetch count for concurrency management

This infrastructure is ready for future use, for example if we want to add background processing of heavy tasks.

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run migrations
npm run prisma:migrate

# Run server
npm run dev

# Run worker (in separate terminal)
npm run worker:dev
```

## 🧪 Testing

```bash
# Run all tests
npm test

# With coverage
npm test -- --coverage
```

**Current Coverage: 91.69%** ✅

## 📚 Learning Resources

During the project I learned from:
- [BullMQ Documentation](https://docs.bullmq.io/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [Feature-Based Structure Patterns](https://khalilstemmler.com/articles/domain-driven-design/feature-based-structure/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## 🎯 What's Next?

Ideas for continued learning:
- [ ] Add authentication & authorization
- [ ] Use RabbitTaskQueue for heavy tasks
- [ ] Add monitoring (Prometheus/Grafana)
- [ ] Add rate limiting
- [ ] Add WebSocket for real-time updates

## 📄 License

MIT

---

**Note:** This is a learning project. The code was written to learn and understand principles of scalable architecture, not as a production-ready solution.
