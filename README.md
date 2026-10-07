# TaskFlow

**A full-stack project and task management application built with FastAPI, PostgreSQL, SQLAlchemy, and React.**

TaskFlow lets users organize work into projects, invite project members, create and assign tasks, discuss work through comments, and review task activity. Its backend separates HTTP routing, business rules, and persistence, with ownership and membership checks applied in service operations.

> **At a glance:** Python 3.10+ · FastAPI · SQLAlchemy async · PostgreSQL · Alembic · React 19 · TypeScript · Vite · Docker Compose

## What it does

- Register and log in with email and password; authenticated API requests use bearer JWTs.
- Create projects and manage project membership.
- Track tasks by status (`TODO`, `IN_PROGRESS`, `DONE`) and priority (`LOW`, `MEDIUM`, `HIGH`), with optional assignees and due dates.
- Add task comments and view task activity for task creation, assignment, status, priority, and comment events.
- Use a browser interface with dashboard, project, task, activity, profile, and settings views.

The repository does **not** currently contain AI, LLM, or agent components. The application is a conventional API-backed project management system.

## Architecture

```mermaid
flowchart LR
    Browser[React and TypeScript SPA] -->|/api requests| Nginx[Nginx in frontend container]
    Nginx -->|/api/* proxy| API[FastAPI application]
    API --> Routes[Versioned API routers]
    Routes --> Services[Service layer: access checks and business rules]
    Services --> Repositories[SQLAlchemy repositories]
    Repositories --> DB[(PostgreSQL)]
    Migrations[Alembic migrations] --> DB
```

The browser calls the API under `/api/v1`. In local Vite development, the Vite server proxies `/api` to `http://localhost:8000`; in the Docker frontend, Nginx serves the built application and proxies `/api/` to the `api` service. FastAPI routes delegate to services, which enforce business rules and use repositories for database operations. The API uses asynchronous SQLAlchemy sessions and a PostgreSQL driver.

### Request lifecycle

For a protected task operation, the request passes through bearer-token authentication, the task route, and `TaskService`. The service checks that the project exists and that the current user owns it or is a member; it then validates related records where needed, changes data through repositories, commits the session, and returns a response schema. Task creation and selected task changes also write activity rows in the same database session before commit.

## Data model

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : owns
    USERS ||--o{ PROJECT_MEMBERS : joins
    PROJECTS ||--o{ PROJECT_MEMBERS : includes
    PROJECTS ||--o{ TASKS : contains
    USERS ||--o{ TASKS : creates
    USERS o|--o{ TASKS : assigned_to
    TASKS ||--o{ COMMENTS : has
    USERS ||--o{ COMMENTS : authors
    TASKS ||--o{ ACTIVITIES : records
    USERS ||--o{ ACTIVITIES : performs
```

| Entity | Purpose and relationships |
| --- | --- |
| `User` | Account identity, unique email, and password hash. Owns projects and can create or be assigned tasks. |
| `Project` | Owned by one user; contains tasks and project membership records. |
| `ProjectMember` | Joins users to projects. A unique constraint on `(project_id, user_id)` prevents duplicate membership. |
| `Task` | Belongs to a project and has a creator, optional assignee, status, priority, and optional due date. |
| `Comment` | Belongs to a task and records its author and timestamps. |
| `Activity` | Belongs to a task and records the user, action, detail, and timestamp. |

Foreign keys represent the relationships above. Tasks cascade deletion to their comments and activity rows through ORM relationships. The project and user relationships do not declare ORM delete cascades. Schema history is maintained in `alembic/versions/`.

## Authentication and access control

Login accepts an OAuth2 password form (`username` carries the email) and returns a signed HS256 bearer token. Passwords are hashed and verified with `pwdlib`'s recommended hasher. Tokens encode the user ID as `sub` and expire after `ACCESS_TOKEN_EXPIRE_MINUTES`. `get_current_user` decodes the token and loads the user for protected requests.

Project, task, comment, and activity operations require authentication. Project owners can manage project metadata and membership. Project owners and members can access project tasks and comments; only the comment author can edit or delete their comment. Task assignees must be project members or the owner. Project listing and direct project retrieval are owner-scoped; membership does not make a project appear in that listing. User account collection and ID-based endpoints are not protected by `get_current_user` in the current routes.

Password reset is a demo flow: the API generates a six-digit OTP, stores it in process memory for five minutes, and returns the OTP in its response. There is no email delivery or persistent OTP store.

## API

All routes are under `/api/v1`. Protected routes require `Authorization: Bearer <access_token>`. Request and response schemas are defined under `app/schemas/`; FastAPI's interactive API documentation is available at `/docs` when the server is running.

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| `POST` | `/users/` | Register a user | No |
| `GET` | `/users/` | List users (used by assignee selection) | No |
| `GET` | `/users/me` | Return the current user | Yes |
| `GET` | `/users/{user_id}` | Fetch a user | No |
| `PATCH` | `/users/{user_id}` | Update username or email | No |
| `DELETE` | `/users/{user_id}` | Delete a user | No |
| `POST` | `/users/login` | Exchange OAuth2 form credentials for a bearer token | No |
| `POST` | `/users/forgot-password` | Generate and return a reset OTP | No |
| `POST` | `/users/verify-otp` | Verify a reset OTP | No |
| `POST` | `/users/reset-password` | Reset a password using an OTP | No |
| `POST` | `/projects/` | Create a project owned by the caller | Yes |
| `GET` | `/projects/` | List projects owned by the caller | Yes |
| `GET`, `PATCH`, `DELETE` | `/projects/{project_id}` | Read, update, or delete a project (owner only) | Yes |
| `POST` | `/projects/{project_id}/members?user_id={id}` | Add a member (owner only) | Yes |
| `GET` | `/projects/{project_id}/members` | List members (owner only) | Yes |
| `DELETE` | `/projects/{project_id}/members/{user_id}` | Remove a member (owner only) | Yes |
| `GET` | `/tasks/me` | List tasks created by or assigned to the caller | Yes |
| `GET`, `POST` | `/projects/{project_id}/tasks/` | List or create tasks in a project | Yes |
| `GET`, `PATCH`, `DELETE` | `/projects/{project_id}/tasks/{task_id}` | Read, update, or delete a task | Yes |
| `PATCH` | `/projects/{project_id}/tasks/{task_id}/assign` | Assign or unassign a task | Yes |
| `PATCH` | `/projects/{project_id}/tasks/{task_id}/status` | Change task status | Yes |
| `PATCH` | `/projects/{project_id}/tasks/{task_id}/priority` | Change task priority | Yes |
| `GET`, `POST` | `/projects/{project_id}/tasks/{task_id}/comments/` | List or add task comments | Yes |
| `GET`, `PATCH`, `DELETE` | `/projects/{project_id}/tasks/{task_id}/comments/{comment_id}` | Read, edit, or delete a comment | Yes |
| `GET` | `/projects/{project_id}/tasks/{task_id}/activity/` | List task activity | Yes |

The current API does not provide role-based project permissions: access is based on ownership or project membership, with owner-only project and membership administration.

## Tech stack

| Layer | Technology | Role |
| --- | --- | --- |
| Backend API | FastAPI, Python | Async HTTP API and request validation |
| Frontend | React 19, TypeScript, Vite | Single-page user interface |
| Client state and requests | TanStack Query, Zustand, Axios | Server data fetching, auth state, and HTTP requests |
| Database | PostgreSQL 16 | Persistent application data |
| ORM and driver | SQLAlchemy async, Psycopg 3 | Async database access |
| Migrations | Alembic | Versioned schema changes |
| Authentication | PyJWT, `pwdlib[argon2]` | HS256 bearer tokens and password hashing |
| Styling | Tailwind CSS | Frontend utility styling |
| Containers | Docker, Docker Compose, Nginx | API, database, and static frontend services |
| Tests | pytest, pytest-asyncio, HTTPX | Async API tests with an in-memory SQLite test setup |

## Repository layout

```text
.
├── app/
│   ├── api/v1/           # Versioned FastAPI route handlers
│   ├── core/             # Settings, database engine, JWT and password helpers
│   ├── dependencies/     # Database session dependency
│   ├── models/            # SQLAlchemy entities and relationships
│   ├── repositories/      # Database query and persistence operations
│   ├── schemas/           # Pydantic request and response models
│   └── services/          # Business logic and authorization checks
├── alembic/versions/      # Database migrations
├── frontend/src/          # React pages, components, API clients, and auth store
├── tests/                 # Async API tests
├── filetesting/           # Additional repository/service experiments
├── compose.yaml
├── Dockerfile
├── pyproject.toml
└── README.md
```

## Run locally

### Requirements

- Python 3.10 or newer
- [`uv`](https://docs.astral.sh/uv/) for Python dependency management
- Node.js and npm
- PostgreSQL

Create a PostgreSQL database, then create a root `.env` file with the settings consumed by `app/core/config.py`:

```dotenv
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@localhost:5432/taskflow_db
SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Use your own database credentials and secret. The values above are placeholders.

### Backend

```bash
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

The API listens on `http://localhost:8000`; interactive docs are at `http://localhost:8000/docs`.

### Frontend

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Vite serves the app at `http://localhost:5173` and proxies `/api` requests to the backend at port `8000`.

## Docker Compose

`compose.yaml` defines three services: `db` (PostgreSQL 16 with a named data volume), `api` (built from the root `Dockerfile`, port `8000`), and `frontend` (built from `frontend/Dockerfile`, served by Nginx on host port `5173`). The API service reads its settings from `.env.docker`.

The repository includes `.env.docker` for the compose configuration. Review it and replace development credentials and the JWT signing key before use beyond a local demo. Start the services and apply the migrations with:

```bash
docker compose up --build -d
docker compose exec api alembic upgrade head
```

Open `http://localhost:5173`. The compose file does not run Alembic automatically and does not define a database health check, so migration startup should follow database availability. Stop the stack with `docker compose down`; add `-v` only if you intend to remove the PostgreSQL data volume.

## Tests

The `tests/` suite uses pytest with async HTTPX clients against the FastAPI app and an in-memory SQLite database. Coverage includes users and login, project ownership and membership, task operations and access checks, comments, and task activity.

Run with:

```bash
uv run pytest
```

The test fixtures import `aiosqlite` and `pytest-asyncio`, but neither package is declared in `pyproject.toml` or `uv.lock` at present. A clean environment may need both installed before the suite can run. The separate `filetesting/` directory contains additional test-like scripts and is not included by default in pytest's `tests/` path.

## Engineering details

- **Authorization is checked in services.** Task, comment, and activity operations verify project access using the owner ID or a matching `ProjectMember` row, and verify that nested task/comment IDs belong to the supplied parent resource.
- **Task history shares the write transaction.** Task creation, assignment, status changes, priority changes, and comment creation add an `Activity` record and commit it through the same async session as the related data change.
- **Task assignment is constrained to project participants.** Service validation accepts the project owner or an existing member as an assignee.
- **Database access is async and layered.** Route handlers depend on an async SQLAlchemy session; services coordinate business rules and repositories encapsulate query and persistence calls.
- **Schema evolution is explicit.** Alembic revisions track user, project, membership, task, and later field/constraint changes.

### Design constraints and future work

The password reset OTP store is process-local and the endpoint returns the OTP directly, so it is suitable only as a demo flow. Future work could deliver OTPs through a mail provider and store short-lived challenges in a shared, expiring store. User listing and user ID CRUD routes currently lack authentication and self/owner authorization; tightening those boundaries is another concrete security improvement. The compose setup could also wait for database health before API startup and apply migrations through a controlled startup step.

## License

No license file is present in the repository.
