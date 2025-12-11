# Scalable Task Scheduler

A modular-monolith system demonstrating scalable architecture, queues, caching, workers, and clean feature boundaries.

## Overview

A task management system that automatically schedules reminders, processes them in background workers, triggers notifications, and keeps high performance using caching and event-driven communication.

## System Architecture

### Key Concepts

- **Modular Monolith Architecture** – Each feature is isolated and ready to become a standalone microservice
- **Event-Driven Communication (RabbitMQ)** – Features communicate asynchronously
- **Scheduled Jobs (BullMQ)** – Reminder scheduling and delay-based execution
- **Background Workers** – Handle timed events reliably
- **Caching Layer (Redis)** – Cache-aside pattern with automatic invalidation
- **Feature-Based Structure (FBS)** – Controller → Facade → Service → Repository inside each feature
- **Dependency Injection** – Replaceable implementations (cache, queue, DB, event bus)
- **Centralized Error Handling & Logging** – Request-ID tracing, typed errors

### Architecture Diagram

![System Architecture](public/Architecture.png)

### Why Modular Monolith?

The architecture is designed with microservices in mind:
- **Feature Isolation** - Each feature is self-contained with its own controllers, services, and repositories
- **Event-Driven Communication** - Features communicate via Event Bus, making it easy to split later
- **Dependency Injection** - Dependencies are injected, not hardcoded, allowing easy extraction
- **Shared Infrastructure** - Common infrastructure (queues, cache, DB) is abstracted behind interfaces

When the time comes to split into microservices, each feature can become its own service with minimal changes to the code structure.

## What the System Does

1. User creates a task with a due date
2. A reminder job is scheduled via BullMQ
3. When the time arrives, a worker publishes a `TASK_TIMED_ARRIVAL` event
4. Notification feature listens and creates a notification
5. System keeps performance high using Redis caching

## Project Structure

```
src/
├── features/
│   ├── tasks/               # Task module (full flow + caching)
│   └── notifications/       # Notification module (event-driven)
│
├── shared/
│   ├── cache/               # Redis wrapper
│   ├── queue/               # BullMQ + RabbitMQ infra
│   │   ├── scheduler/       # BullMQ scheduler
│   │   ├── event-bus/       # RabbitMQ event bus
│   │   └── tasks/           # RabbitMQ task queue (not currently used)
│   ├── middlewares/         # Express middlewares
│   ├── config/              # Configuration
│   └── utils/               # Logger, errors
│
└── workers/
    └── reminder/            # Handles reminder events
```

## Production-Ready Features

### 1. Event Bus (RabbitMQ)
- Pub/Sub fan-out architecture ready for multi-service split
- Consumer-level acknowledgment and retries
- Dead letter queue for failed messages

### 2. Scheduler (BullMQ)
- Delayed jobs with precise timing
- Job cancellation on task update
- Idempotent scheduling

### 3. Redis Cache Layer
- Cache-aside pattern
- Safe fallback (non-fatal errors)
- Auto invalidation on writes

### 4. Dependency Injection
- Replace queue/cache/db with any implementation
- Enables future microservice extraction

### 5. Feature Isolation
- Each feature can be lifted and moved to a new repo with 90% code reuse
- No cross-feature imports
- Communication via Event Bus only

### 6. Background Worker with Retry Logic
- Infrastructure for retries, dead letter queue, and backoff strategies
- `RabbitTaskQueue` implemented but not currently used (ready for future heavy processing)

### 7. Testing
- 91.69% coverage
- Unit tests + integration flows
- All tests passing (150 tests)

## Tech Stack

| Technology | Usage |
|-----------|-------|
| Node.js + TypeScript | Project foundation |
| Express | API layer |
| BullMQ | Scheduling reminders (scheduled jobs) |
| RabbitMQ | Event Bus for asynchronous communication |
| Redis | Cache for performance improvement |
| PostgreSQL + Prisma | Database and ORM |
| Jest | Unit and integration tests |
| Zod | Data validation |
| Swagger | API documentation |

## What I Learned

- Building scalable architectures with clear feature boundaries
- Event-driven design with RabbitMQ
- Scheduling workflows (delay-based jobs)
- Redis caching strategies & invalidation
- Dependency Injection in Node.js
- Clean Architecture in a real project
- Writing testable, modular backend code
- Designing systems that can evolve into microservices

## Running Locally

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

## Testing

```bash
# Run all tests
npm test

# With coverage
npm test -- --coverage
```

**Coverage: 91.69%**

## Important Notes

### Consumer/Producer Infrastructure

The project includes a fully implemented `RabbitTaskQueue` (consumer/producer) infrastructure that is **not currently used**. The infrastructure includes:
- Retry mechanism (up to 3 attempts)
- Dead Letter Queue (DLQ) for failed tasks
- Prefetch count for concurrency management

This infrastructure is ready for future use, for example if we want to add background processing of heavy tasks.

---

**Note:** This is a learning project. The code was written to learn and understand principles of scalable architecture, not as a production-ready solution.

## API Documentation

The API is fully documented with Swagger. Once the server is running, visit:

```
http://localhost:3000/api-docs
```

![Swagger API Documentation](public/localhost_3000_api-docs.png)
