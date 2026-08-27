import asyncio
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.database import Base
from app.core.security import create_access_token
from app.dependencies.database import get_db
from app.main import app


# --- Test database setup (in-memory SQLite instead of real Postgres) ---

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)

TestingSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# --- Event loop for the entire test session ---

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# --- Create all tables once before tests, drop after ---

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    import app.models  # noqa: F401 — registers all models with Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# --- Fresh DB session per test (rolls back after each test) ---

@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()


# --- HTTP client that talks to our FastAPI app using the test DB ---

@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# --- Helper: generate auth headers for a user ---

def auth_headers(user_id: int) -> dict[str, str]:
    token = create_access_token(user_id)
    return {"Authorization": f"Bearer {token}"}


# --- Factory fixture: create a user in the DB ---

@pytest_asyncio.fixture
async def create_user(db_session: AsyncSession):
    from app.core.password import hash_password
    from app.models.user import User

    async def _create(
        username: str = "testuser",
        email: str = "test@example.com",
        password: str = "password123",
    ) -> User:
        user = User(
            username=username,
            email=email,
            password_hash=hash_password(password),
        )
        db_session.add(user)
        await db_session.flush()
        await db_session.refresh(user)
        return user

    return _create


# --- Factory fixture: create a project in the DB ---

@pytest_asyncio.fixture
async def create_project(db_session: AsyncSession):
    from app.models.project import Project

    async def _create(
        name: str = "Test Project",
        description: str | None = None,
        owner_id: int = 1,
    ) -> Project:
        project = Project(
            name=name,
            description=description,
            owner_id=owner_id,
        )
        db_session.add(project)
        await db_session.flush()
        await db_session.refresh(project)
        return project

    return _create


# --- Factory fixture: create a task in the DB ---

@pytest_asyncio.fixture
async def create_task(db_session: AsyncSession):
    from app.models.task import Task

    async def _create(
        title: str = "Test Task",
        description: str | None = None,
        project_id: int = 1,
        creator_id: int = 1,
        assignee_id: int | None = None,
        priority: str = "MEDIUM",
        status: str = "TODO",
    ) -> Task:
        task = Task(
            title=title,
            description=description,
            project_id=project_id,
            creator_id=creator_id,
            assignee_id=assignee_id,
            priority=priority,
            status=status,
        )
        db_session.add(task)
        await db_session.flush()
        await db_session.refresh(task)
        return task

    return _create


# --- Factory fixture: create a comment in the DB ---

@pytest_asyncio.fixture
async def create_comment(db_session: AsyncSession):
    from app.models.comment import Comment

    async def _create(
        content: str = "Test comment",
        task_id: int = 1,
        author_id: int = 1,
    ) -> Comment:
        comment = Comment(
            content=content,
            task_id=task_id,
            author_id=author_id,
        )
        db_session.add(comment)
        await db_session.flush()
        await db_session.refresh(comment)
        return comment

    return _create


# --- Factory fixture: add a project member in the DB ---

@pytest_asyncio.fixture
async def add_project_member(db_session: AsyncSession):
    from app.models.project_member import ProjectMember

    async def _create(
        project_id: int,
        user_id: int,
    ) -> ProjectMember:
        member = ProjectMember(
            project_id=project_id,
            user_id=user_id,
        )
        db_session.add(member)
        await db_session.flush()
        await db_session.refresh(member)
        return member

    return _create
