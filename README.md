
```
GABAI-BACKEND
├─ nodemon.json
├─ package-lock.json
├─ package.json
├─ prisma
│  ├─ migrations
│  │  ├─ 20260724091835_init
│  │  │  └─ migration.sql
│  │  ├─ 20260918170804_add_tasks
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
│  ├─ migrations.prisma
│  └─ schema.prisma
├─ prisma.config.ts
├─ src
│  ├─ app.ts
│  ├─ config
│  │  ├─ env.ts
│  │  └─ prisma.ts
│  ├─ controllers
│  │  ├─ auth.controller.ts
│  │  └─ task.controller.ts
│  ├─ lib
│  │  └─ prisma.ts
│  ├─ middleware
│  │  ├─ auth.middleware.ts
│  │  ├─ error.middleware.ts
│  │  ├─ notFound.middleware.ts
│  │  └─ validation.middleware.ts
│  ├─ middlewares
│  │  ├─ authenticate-token.ts
│  │  ├─ error.middleware.ts
│  │  ├─ notFound.middleware.ts
│  │  └─ validate-schema.ts
│  ├─ repositories
│  │  ├─ auth.repository.ts
│  │  ├─ task.repository.ts
│  │  └─ user.repository.ts
│  ├─ routes
│  │  ├─ auth.routes.ts
│  │  ├─ index.ts
│  │  └─ task.routes.ts
│  ├─ server.ts
│  ├─ services
│  │  ├─ auth.service.ts
│  │  └─ task.service.ts
│  ├─ types
│  │  ├─ auth.types.ts
│  │  ├─ express.d.ts
│  │  ├─ task.types.ts
│  │  └─ user.types.ts
│  └─ utils
│     ├─ date.ts
│     ├─ helper.ts
│     ├─ jwt.ts
│     ├─ logger.ts
│     └─ response.ts
└─ tsconfig.json

```