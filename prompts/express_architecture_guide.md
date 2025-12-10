# Express Architecture Guide

This guide outlines a clean, extensible, and scalable architecture pattern for **Express.js** applications. The structure is designed to support:

* Feature-Based Structure (FBS)
* Loose coupling between modules
* Full Dependency Composition (manual wiring, not decorators)
* Pluggable components (Event Bus, Cache, Queues)
* Internal API access with Gateway files
* Seamless migration from monolith to microservices

> ✅ **Designed to support automation, scalability, and feature isolation.**

---

## 🚨 CRITICAL RULES - DO NOT VIOLATE

### Code Quality Rules:
1. **NO unnecessary comments** - Only comment programming decisions that are non-obvious or have specific reasons
2. **NO premature optimization** - Don't create files/folders until the project scales
3. **NO unused methods in Gateway** - Only expose what other features actually need immediately
4. **Gateway is for SYNC operations only** - Use Event Bus for async operations
5. **Use existing infrastructure** - Don't modify shared/queue, shared/interfaces, container, or routes until you prove yourself

### Infrastructure Rules:
1. **Use existing queue implementations** in `src/shared/queue/`:
   - `BullScheduler` for scheduled jobs
   - `RabbitEventBus` for events
   - `RabbitTaskQueue` for task queues
2. **Add events ONLY to** `src/shared/queue/queue.constants.ts`
3. **Don't touch** `src/shared/`, `src/container/`, `src/routes/` until you prove yourself
4. **Use Prisma types conversion** in repositories to prevent TypeScript errors

### Validation & Error Handling Rules:
1. **Use Zod schemas** for validation in middleware
2. **Use shared validation middleware** - `src/shared/middlewares/validationErrorHandler.mw.ts`
3. **Use shared error handler** - `src/shared/middlewares/errorHandler.mw.ts`
4. **Use http-status-codes** for clean status codes
5. **NO validation in controllers** - Use middleware instead

### Logging Rules:
1. **Use request ID** from middleware for correlation
2. **Use appropriate log levels** (silly, debug, info, warn, error)
3. **NO unnecessary logs** - Only log important events and errors
4. **Use structured logging** with context

### Testing Rules:
1. **Unit tests** for each layer (Repository, Service, Facade, Gateway)
2. **Integration tests** for Controller and Gateway
3. **Use mocks** for external dependencies
4. **Test error scenarios** and edge cases

### Prisma & TypeScript Rules:
1. **Never return Prisma result directly** - Always map to DTO
2. **Always cast Prisma operations** - Use `as Prisma.X` for includes, orderBy, etc.
3. **Separate layers clearly** - DTO, Prisma Model, Mapping Function
4. **Use explicit mapping functions** - `toTaskDto(prismaTask)`
5. **Handle TypeScript strict mode** - Avoid generic helpers, prefer inline casting
6. **Use `jest.useFakeTimers()`** for time-sensitive tests
7. **Mock Prisma with `as unknown as PrismaClient`** - Not `jest.Mocked<PrismaClient>`
8. **Use factory functions** for test data to avoid repetition

### Logging & Error Handling Rules:
1. **NO try/catch in Repository/Service layers** - Only Facade/Controller should catch
2. **NO excessive logging** - Only meaningful business events
3. **Use appropriate log levels**:
   - `logger.info()` - Business events (task created, event published)
   - `logger.warn()` - Business warnings (task overdue)
   - `logger.error()` - Actual errors with context
   - `logger.debug()` - Only for debugging, not in production
4. **NO duplicate logs** - Don't log same event in multiple layers
5. **Structured logging** - Always include context and request ID

### TODO & Development Rules:
1. **Comment out unimplemented features** - Use `// notifications: Notification[];` with TODO
2. **Add TODO comments** - `// TODO: Implement notification DTO and mapping`
3. **Plan for future implementation** - Document what needs to be done
4. **Don't break existing tests** - Comment out dependencies that don't exist yet

### Module Testing Rules:
1. **Export `__testing__` object** in module factory for testing access
2. **Include all layers** in `__testing__` for comprehensive testing
3. **Use `__testing__` for integration tests** and module composition tests
4. **Keep `__testing__` internal** - Only for testing, not production use

---

## 🧠 Core Architectural Principles

1. **Each Feature is Isolated** with logic, DTOs, interfaces, and tests.
2. **No cross-feature imports** — communication via `Gateway` or `Event Bus` only.
3. **Work with interfaces, not implementations.**
4. **No direct imports between layers. Use factories/composers.**
5. **All DB access must go through Service → Repository.**
6. **Only Facade may use Queues, Scheduler, Event Bus.**
7. **External APIs wrapped via adapters.**
8. **No vendor names in interfaces (e.g., Redis, Prisma, Bull).**
9. **All queue/event names must be constants.**
10. **Gateways never talk to Services, only Facades.**
11. **Service never depends on anything external.**

> **Gateway** = Entry point for internal features
> **Facade** = Main orchestrator of business logic and system calls

---

## 🧱 File Growth Strategy

**START FLAT** - Don't create folders until you need them:

* `users.types.ts`, `users.dto.ts`, `users.interfaces.ts`

When the system scales (many files):

* Split by **use case**, not type. For example:

```ts
features/users/use-cases/
├── create/
│   ├── create-user.dto.ts
│   ├── create-user.types.ts
│   ├── create-user.interface.ts
```

**Rule**: If you have less than 10 files in a feature, keep them flat.

---

## 🧠 Validation

Use Zod with shared validation middleware:

```ts
// users.validators.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().min(18),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  age: z.number().min(18).optional(),
});
```

```ts
// users.routes.ts
import { createUserSchema, updateUserSchema } from './users.validators';
import { validateRequest } from '../../shared/middlewares/validationErrorHandler.mw';

export function createUserRoutes(controller: UserController): Router {
  const router = Router();
  
  router.post('/', validateRequest(createUserSchema), (req, res) => controller.createUser(req, res));
  router.put('/:id', validateRequest(updateUserSchema), (req, res) => controller.updateUser(req, res));
  
  return router;
}
```

---

## 📝 Logging

Use structured logging with request ID:

```ts
// In controller
logger.info('User created', { 
  userId: user.id, 
  reqId: req.headers['x-request-id'] 
});

// In service
logger.debug('Processing user data', { userId });

// In repository
logger.silly('Database query executed', { query: 'SELECT * FROM users' });
```

---

## 🧪 Testing

Each feature should have comprehensive tests:

```ts
// __tests__/users.service.test.ts
import { UserService } from '../users.service';
import { UserRepository } from '../users.repository';

describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;
    
    service = new UserService(mockRepository);
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const dto = { name: 'John', email: 'john@example.com' };
      const expectedUser = { id: '1', ...dto };
      
      mockRepository.create.mockResolvedValue(expectedUser);
      
      const result = await service.createUser(dto);
      
      expect(result).toEqual(expectedUser);
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
    });
  });
});
```

---

## 🗄️ Prisma Repository Guidelines

### Standard Repository Pattern:

```ts
// users.repository.ts
import { PrismaClient, User as PrismaUser } from '@prisma/client';
import { User, CreateUserDto, UpdateUserDto } from './users.types';

export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(dto: CreateUserDto): Promise<User> {
    const result = await this.prisma.user.create({ data: dto }) as PrismaUser;
    return this.toUserDto(result);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const result = await this.prisma.user.update({
      where: { id },
      data: dto,
    }) as PrismaUser;
    return this.toUserDto(result);
  }

  async findMany(where: any): Promise<User[]> {
    const results = await this.prisma.user.findMany({
      where,
      include: { notifications: true } as Prisma.UserInclude,
      orderBy: { createdAt: 'desc' } as Prisma.UserOrderByWithRelationInput,
    });
    return results.map(r => this.toUserDto(r, r.notifications));
  }

  private toUserDto(user: PrismaUser, notifications: any[] = []): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      // TODO: Implement notification DTO and mapping
      // notifications: notifications.map(n => toNotificationDto(n)),
    };
  }
}
```

### Testing with Prisma:

```ts
// __tests__/users.repository.test.ts
describe('UserRepository', () => {
  let repository: UserRepository;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = {
      user: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    } as unknown as PrismaClient;
    
    repository = new UserRepository(mockPrisma);
  });

  it('should create user successfully', async () => {
    const dto = { name: 'John', email: 'john@example.com' };
    const now = new Date();
    
    const prismaUser = {
      id: 'user-1',
      ...dto,
      createdAt: now,
      updatedAt: now,
    };
    
    (mockPrisma.user.create as jest.Mock).mockResolvedValue(prismaUser);
    
    const result = await repository.create(dto);
    
    expect(result).toEqual({
      id: 'user-1',
      name: 'John',
      email: 'john@example.com',
    });
  });
});
```

---

## 💡 Naming Rules

* Prefer abstract names, never tied to implementation:

  * ✅ `ITaskQueue`, `ICache`, `IDatabaseClient`
  * ❌ `RedisCache`, `BullQueue`, `Prisma`

* Use shared constants for all queue/event names:

  * `TASK_QUEUE_NAMES.WELCOME_EMAIL`
  * `SCHEDULER_QUEUE_NAMES.FOLLOW_UP`
  * `EVENT_TYPES.USER_CREATED`

---

## 🧩 Composition Modules

Manual composition using simple factories:

```ts
// users.module.ts
interface UsersModuleDeps {
  db: IDatabaseClient;
  taskQueue: ITaskQueue;
  scheduler: ISchedulerQueue;
  eventBus: IEventBus;
}

export function createUsersModule(deps: UsersModuleDeps) {
  const repo = new UsersRepository(deps.db);
  const service = new UsersService(repo);
  const facade = new UsersFacade(service, deps.taskQueue, deps.scheduler, deps.eventBus);
  const gateway = new UsersGateway(facade);

  return {
    controller: createUsersController(facade),
    gateway,
    __testing__: {
      repository: repo,
      service,
      facade,
      controller,
    },
  };
}
```

---

## 🧨 Common Mistakes (Anti-Patterns)

🚫 `Service` calling another `Gateway`

* ❌ `UsersService` → `OrdersGateway`
* ✅ Must go: `UsersFacade` → `OrdersGateway`

🚫 `Facade` skipping `Service` layer

* ❌ `Facade` → `Repository`
* ✅ Must go: `Facade` → `Service` → `Repository`

🚫 `Service` triggering queues/events

* ❌ `Service` → `taskQueue.add()`
* ✅ Only `Facade` can touch external systems

🚫 `Feature A` importing `Feature B` code directly

* ❌ Importing `UsersService` in `OrdersFacade`
* ✅ Use `OrdersGateway` instead

🚫 Validation in controllers

* ❌ `if (!email) return res.status(400).json({ error: 'Email required' })`
* ✅ Use Zod middleware

🚫 Unstructured logging

* ❌ `console.log('User created')`
* ✅ Use logger with context and request ID

🚫 Returning Prisma results directly

* ❌ `return await prisma.user.create({ data })`
* ✅ Always map to DTO: `return toUserDto(await prisma.user.create({ data }))`

🚫 Not handling unimplemented features

* ❌ `notifications: Notification[]` (when Notification doesn't exist)
* ✅ `// notifications: Notification[]; // TODO: Implement notification DTO`

🚫 Missing `__testing__` export in modules

* ❌ No access to internal components for testing
* ✅ Export `__testing__` object with all layers

---

## 🧩 Feature Layer Structure

**START FLAT** (for small features):

```
features/users/
├── users.controller.ts
├── users.facade.ts
├── users.gateway.ts
├── users.module.ts
├── users.service.ts
├── users.repository.ts
├── users.types.ts
├── users.dto.ts
├── users.interfaces.ts
├── users.validators.ts
└── __tests__/
    ├── users.gateway.integration.test.ts
    ├── users.controller.integration.test.ts
    ├── users.repository.unit.test.ts
    ├── users.facade.unit.test.ts
    └── users.service.unit.test.ts
```

**When scaling** (many files):

```
features/users/
├── users.controller.ts
├── users.facade.ts
├── users.gateway.ts
├── users.module.ts
├── users.service.ts
├── users.repository.ts
├── users.types.ts
├── dto/
│   └── create-user.dto.ts
├── interfaces/
│   ├── user-repository.interface.ts
│   ├── user-service.interface.ts
│   ├── user-gateway.interface.ts
│   └── user-facade.interface.ts
├── validators/
│   └── create-user.validator.ts
└── __tests__/
    ├── users.gateway.integration.test.ts
    ├── users.controller.integration.test.ts
    ├── users.repository.unit.test.ts
    ├── users.facade.unit.test.ts
    └── users.service.unit.test.ts
```

---

## 📥 Request Flow – External

```
Controller → Facade → Service → Repository
```

```ts
// users.controller.ts
export function createUsersController(facade: IUserFacade) {
  const router = require('express').Router();

  router.post('/', async (req, res) => {
    const user = await facade.createUser(req.body);
    res.json(user);
  });

  return router;
}
```

---

## 🔁 Request Flow – Internal

```
Facade A → Gateway B → Facade B → Service → Repository
```

```ts
// some.feature.ts
await ordersGateway.getOrdersByUser(userId);
```

---

## 🧠 Facade – Central Logic

```ts
export class UsersFacade {
  constructor(
    private service: IUserService,
    private taskQueue: ITaskQueue,
    private scheduler: ISchedulerQueue,
    private eventBus: IEventBus
  ) {}

  async createUser(dto: CreateUserDto) {
    const user = await this.service.createUser(dto);
    await this.taskQueue.add(TASK_QUEUE_NAMES.WELCOME_EMAIL, { userId: user.id });
    await this.scheduler.schedule(SCHEDULER_QUEUE_NAMES.FOLLOW_UP, { userId: user.id }, 60000);
    await this.eventBus.publish({ type: EVENT_TYPES.USER_CREATED, payload: user });
    return user;
  }
}
```

---

## 📡 Gateway – Internal Communication

```ts
export class UsersGateway {
  constructor(private facade: IUserFacade) {}

  async getUserById(id: string) {
    return this.facade.getUserById(id);
  }
}
```

---

## 🛠️ Service – Pure Logic

```ts
export class UsersService {
  constructor(private repo: IUserRepository) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    return this.repo.save(dto);
  }
}
```

---

## 🧰 Repository – Data Layer

```ts
export class UsersRepository {
  constructor(private db: IDatabaseClient) {}

  async save(dto: CreateUserDto): Promise<User> {
    const result = await this.db.users.create({ data: dto }) as PrismaUser;
    return this.toUserDto(result);
  }

  private toUserDto(user: PrismaUser): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      // TODO: Add notifications when implemented
    };
  }
}
```

---

## 📦 Queue & Event Examples

### Using Existing Infrastructure

**Add events to** `src/shared/queue/queue.constants.ts`:

```ts
export const EVENTS = {
    TASK_QUEUE: {
        TASK_REMINDER: 'task-reminder',
    },
    SCHEDULER_QUEUE: {
        TASK_REMINDER: 'task-reminder',
    },
    EVENT_BUS_QUEUE: {
        TASK_CREATED: 'task.created',
        TASK_UPDATED: 'task.updated',
        TASK_DELETED: 'task.deleted',
    },
};
```

### Task Queue

```ts
await taskQueue.add(EVENTS.TASK_QUEUE.TASK_REMINDER, { userId: '123' });
```

### Scheduler

```ts
await scheduler.schedule(EVENTS.SCHEDULER_QUEUE.TASK_REMINDER, { userId }, 3600000);
```

### Event Bus

```ts
await eventBus.publish(EVENTS.EVENT_BUS_QUEUE.TASK_CREATED, { userId });
```

### 🔁 Reusable Workflow Example

```ts
// helpers/triggerWelcomeFlow.ts
export async function triggerWelcomeFlow(userId: string) {
  await taskQueue.add(EVENTS.TASK_QUEUE.WELCOME_EMAIL, { userId });
  await scheduler.schedule(EVENTS.SCHEDULER_QUEUE.FOLLOW_UP, { userId }, 3600000);
  await eventBus.publish(EVENTS.EVENT_BUS_QUEUE.USER_SIGNED_UP, { userId });
}
```

---

## 🧠 Communication Cheat Sheet

| Use Case        | Flow                                 | Why                                                         |
| --------------- | ------------------------------------ | ----------------------------------------------------------- |
| External API    | Controller → Facade → Service → Repo | Standard REST                                               |
| Internal Call   | Facade A → Gateway B → Facade B      | Feature isolation; direct sync call needed                  |
| Async Jobs      | Facade → Task Queue                  | Offload heavy/parallel work to worker                       |
| Delayed Work    | Facade → Scheduler Queue             | Time-based triggers; retry/follow-up logic                  |
| Broadcast Event | Facade → Event Bus                   | Publish for multiple systems; decoupled observers (pub/sub) |

---

## ✅ Summary

* Manual composition, no decorators
* Only Facade accesses queues/events/schedulers
* Each feature is isolated with Gateway for internal API
* Communication is explicit and safe for automation
* Constants used for all event/queue names
* Features can be moved to microservices easily
* Use Zod validation with shared middleware
* Use structured logging with request ID
* Comprehensive testing with mocks
* Always map Prisma results to DTOs
* Comment out unimplemented features with TODO
* Export `__testing__` object in modules for testing access

> Designed to be **extendable**, **modular**, and **agent-friendly**
