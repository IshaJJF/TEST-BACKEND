# Todo Backend (Node + Express + MySQL)

REST API for the Todo app. Uses Express and `mysql2`, talks to a MySQL database
(e.g. XAMPP's MySQL).

## Setup

```bash
cp .env.example .env   # then edit .env for your MySQL credentials
npm install
npm run dev            # http://localhost:3000
```

On startup the server runs `CREATE TABLE IF NOT EXISTS tasks (...)`, so as long
as the database in `DB_NAME` exists, the schema is created automatically.

To create the database itself (one-time):

```sql
CREATE DATABASE todo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Environment

| Variable      | Default      |
| ------------- | ------------ |
| `PORT`        | `3000`       |
| `DB_HOST`     | `127.0.0.1`  |
| `DB_PORT`     | `3306`       |
| `DB_USER`     | `root`       |
| `DB_PASSWORD` | *(empty)*    |
| `DB_NAME`     | `todo_db`    |

## API

| Method | URL            | Body                                            | Purpose         |
| ------ | -------------- | ----------------------------------------------- | --------------- |
| GET    | `/tasks`       | —                                               | List all tasks  |
| POST   | `/tasks`       | `{ "title": "..." }`                            | Create task     |
| PUT    | `/tasks/:id`   | `{ "title": "..." }` / `{ "completed": true }`  | Update task     |
| DELETE | `/tasks/:id`   | —                                               | Delete task     |

Responses are JSON. `completed` is returned as a boolean.
