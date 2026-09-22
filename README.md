
```
├── prisma
│   ├── migrations
│   │   ├── 20260724091835_init
│   │   │   └── migration.sql
│   │   ├── 20260918170804_add_tasks
│   │   │   └── migration.sql
│   │   ├── 20260921091423_add_notifications
│   │   │   └── migration.sql
│   │   ├── 20260921095832_add_notifications
│   │   │   └── migration.sql
│   │   ├── 20260921103501_add_focus_sessions
│   │   │   └── migration.sql
│   │   ├── 20260921135109_add_recent_activities
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   ├── migrations.prisma
│   └── schema.prisma
├── src
│   ├── config
│   │   ├── env.ts
│   │   └── prisma.ts
│   ├── controllers
│   │   ├── academic-pressure.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── focus-session.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── recent-activity.controller.ts
│   │   ├── smart-reminder.controller.ts
│   │   ├── subject-progress.controller.ts
│   │   └── task.controller.ts
│   ├── lib
│   │   └── prisma.ts
│   ├── middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── notFound.middleware.ts
│   │   └── validation.middleware.ts
│   ├── repositories
│   │   ├── academic-pressure.repository.ts
│   │   ├── auth.repository.ts
│   │   ├── dashboard.repository.ts
│   │   ├── focus-session.repository.ts
│   │   ├── notification.repository.ts
│   │   ├── recent-activity.repository.ts
│   │   ├── smart-reminder.repository.ts
│   │   ├── subject-progress.repository.ts
│   │   ├── task.repository.ts
│   │   └── user.repository.ts
│   ├── routes
│   │   ├── academic-pressure.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── focus-session.routes.ts
│   │   ├── index.ts
│   │   ├── notification.routes.ts
│   │   ├── recent-activity.routes.ts
│   │   ├── smart-reminder.routes.ts
│   │   ├── subject-progress.routes.ts
│   │   └── task.routes.ts
│   ├── services
│   │   ├── academic-pressure.service.ts
│   │   ├── auth.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── focus-session.service.ts
│   │   ├── notification.service.ts
│   │   ├── recent-activity.service.ts
│   │   ├── smart-reminder.service.ts
│   │   ├── subject-progress.service.ts
│   │   └── task.service.ts
│   ├── types
│   │   ├── academic-pressure.types.ts
│   │   ├── auth.types.ts
│   │   ├── express.d.ts
│   │   ├── focus-session.types.ts
│   │   ├── notification.types.ts
│   │   ├── recent-activity.types.ts
│   │   ├── smart-reminder.types.ts
│   │   ├── subject-progress.types.ts
│   │   ├── task.types.ts
│   │   └── user.types.ts
│   ├── utils
│   │   ├── date.ts
│   │   ├── helper.ts
│   │   ├── jwt.ts
│   │   ├── logger.ts
│   │   └── response.ts
│   ├── app.ts
│   └── server.ts
├── .gitignore
├── README.md
├── nodemon.json
├── package-lock.json
├── package.json
├── prisma.config.ts
└── tsconfig.json
```