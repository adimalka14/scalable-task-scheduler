## 📌 Cursor Guidelines: Writing Repositories + Tests in Prisma + TypeScript (Strict Mode)

### 🔴 Common Mistakes and What to Avoid

| ❌ Issue                              | 🧨 What Happened                                  | ✅ What to Do                                             |
| ------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| `mockResolvedValue` on Prisma method | Error thrown – Prisma client methods aren't mocks | Wrap each `prisma.X.Y` method manually with `jest.fn()`  |
| Used `jest.Mocked<PrismaClient>`     | Incompatible with real PrismaClient instance      | Use `as unknown as PrismaClient` for mocking             |
| `new Date()` used multiple times     | Different timestamps broke test expectations      | Declare `const now = new Date()` and reuse it            |
| Repeating object structures          | Copied task objects over and over                 | Write reusable factory like `taskFactory(overrides?)`    |
| Missing error tests                  | No coverage for `update` or failed operations     | Always test failure cases (`throw`) in repository/facade |

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

#### 2. **Always cast **``**, **``**, and **``

Instead of:

```ts
include: { notifications: true }
```

Do:

```ts
include: { notifications: true } as Prisma.TaskInclude
```

#### 3. **Never use **``**, **``**, or generic Prisma helpers**

They break in `strict` mode or with Prisma extensions. Prefer inline `as Prisma.X`.

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

- Use `jest.useFakeTimers().setSystemTime(...)` to freeze `Date.now()`
- Make sure all `mockResolvedValue(...)` are on functions wrapped with `jest.fn()`
- Handle DTOs with clear and explicit types

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

🔒 Keep internal/external types separate\
🧼 Pass clean, validated data to DTOs only\
🧠 Think ahead about how TypeScript will infer and constrain types\
🧪 Write stable, time-frozen tests with intelligent mocks

