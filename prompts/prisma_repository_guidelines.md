## 📌 Cursor Guidelines: Writing Repositories + Tests in Prisma + TypeScript (Strict Mode)

### 🔴 Common Mistakes and What to Avoid

| ❌ Issue                              | 🧨 What Happened                                  | ✅ What to Do                                               |
| ------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------- |
| `mockResolvedValue` on Prisma method | Error thrown – Prisma client methods aren't mocks | Wrap each `prisma.X.Y` method manually with `jest.fn()`    |
| Used `jest.Mocked<PrismaClient>`     | Incompatible with real PrismaClient instance      | Use `as unknown as PrismaClient` for mocking               |
| `new Date()` used multiple times     | Different timestamps broke test expectations      | Declare `const now = new Date()` and reuse it              |
| Repeating object structures          | Copied task objects over and over                 | Write reusable factory like `taskFactory(overrides?)`      |
| Missing error tests                  | No coverage for `update` or failed operations     | Always test failure cases (`throw`) in repository/facade   |
| Excessive or misplaced logging       | Logs everywhere with no filtering or value        | Log only meaningful business events in Facade or Gateway   |
| Redundant try/catch in inner layers  | Unnecessary wrapping of DB logic in service layer | Only Facade or Controller should catch and classify errors |

---

### ✅ Core Principles for Working with Prisma + DTOs

#### 1. **Never return Prisma result directly**

⛔ Avoid:

```ts
return await prisma.task.create({ ... });
```

✅ Instead:

```ts
const result = await prisma.task.create({ ... }) as PrismaTask;
return toTaskDto(result);
```

#### 2. **Always cast `include`, `orderBy`, and `select` objects**

Instead of:

```ts
include: { notifications: true }
```

✅ Do:

```ts
include: { notifications: true } as Prisma.TaskInclude
```

#### 3. **Never use `SelectSubset`, `Parameters<...>`, or Prisma generics**

They break in `strict` mode or with Prisma extensions. Prefer inline `as Prisma.X` casting.

#### 4. **Always separate the following layers:**

| Layer              | What it Contains                 | How to Write It                        |
| ------------------ | -------------------------------- | -------------------------------------- |
| ✅ DTO              | Public model returned from logic | `Task`, `OrderDto`                     |
| ✅ Prisma Model     | Raw Prisma schema types          | `PrismaTask`, `Order`                  |
| ✅ Mapping Function | Maps from DB model to DTO        | `toTaskDto(prismaTask, notifications)` |

---

### 🧱 Standard Code Templates

#### CREATE

```ts
const entity = await prisma.entity.create({ data }) as Prisma.Entity;
return toDto(entity);
```

#### UPDATE

```ts
const updated = await prisma.entity.update({ where, data }) as Prisma.Entity;
return toDto(updated);
```

#### FIND MANY + INCLUDE

```ts
const results = await prisma.entity.findMany({
  where,
  include: { relation: true } as Prisma.EntityInclude,
  orderBy: { createdAt: 'desc' } as Prisma.EntityOrderByWithRelationInput,
});
return results.map((r) => toDto(r, r.relation));
```

---

### 🧪 Testing Guidelines

* Use `jest.useFakeTimers().setSystemTime(...)` to freeze `Date.now()`
* Make sure all `mockResolvedValue(...)` are on functions wrapped with `jest.fn()`
* Handle DTOs with clear and explicit types
* Test error flows for each DB operation: `.update`, `.findUnique`, etc.
* Mock `Date` consistently to ensure test reliability

---

### 🪵 Logging and Error Handling

#### ❌ Don't:

* Spam logs inside Service or Repository layers
* Duplicate `logger.info()` and `logger.debug()` for the same event
* Add try/catch around DB calls just to log the error and rethrow

#### ✅ Do:

| Layer          | Logging Responsibility                              | Error Handling Responsibility                     |
| -------------- | --------------------------------------------------- | ------------------------------------------------- |
| **Facade**     | Business-level logs: job scheduled, event published | Catch and classify known errors (`throw 400/404`) |
| **Service**    | No logs (unless extremely necessary for debugging)  | Let errors bubble up                              |
| **Controller** | Optionally log request-level context                | Convert errors to HTTP status codes               |

💡 Use meaningful log levels:

```ts
logger.info('TASK_CREATED', { taskId });
logger.warn('TASK_OVERDUE', { taskId });
logger.error('TASK_FAILED', { error });
```

Avoid:

```ts
logger.debug('entered function...');
logger.info('still in function...');
logger.debug('left function...');
```

---

## 🧩 Recommended Code Comment

```ts
/**
 * @description Maps a Prisma Task entity to public-facing DTO.
 * @note Always prefer explicit mapping to avoid leaking internal fields.
 */
function toTaskDto(task: PrismaTask, notifications: Notification[] = []): Task { ... }
```

---

## ✅ Summary: Code Like Infra, Not Like Feature

🔒 Keep internal/external types separate
🧼 Pass clean, validated data to DTOs only
🧠 Think ahead about how TypeScript will infer and constrain types
🧪 Write stable, time-frozen tests with intelligent mocks
🚫 Don't access folders outside the feature unless explicitly allowed
📂 Limit access to `/shared`, `/config`, or `/core` folders until more proficiency is demonstrated
