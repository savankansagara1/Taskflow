import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers

pytestmark = pytest.mark.asyncio


# --- POST /api/v1/projects/{project_id}/tasks/ ---

async def test_create_task(client: AsyncClient, create_user, create_project):
    user = await create_user(email="taskcreator@example.com")
    project = await create_project(name="Task Project", owner_id=user.id)

    response = await client.post(
        f"/api/v1/projects/{project.id}/tasks/",
        json={"title": "Build feature", "priority": "HIGH"},
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Build feature"
    assert data["priority"] == "HIGH"
    assert data["creator_id"] == user.id
    assert data["project_id"] == project.id


async def test_create_task_no_access(client: AsyncClient, create_user, create_project):
    owner = await create_user(email="taskowner@example.com")
    stranger = await create_user(email="taskstranger@example.com")
    project = await create_project(name="Private Project", owner_id=owner.id)

    response = await client.post(
        f"/api/v1/projects/{project.id}/tasks/",
        json={"title": "Sneaky task"},
        headers=auth_headers(stranger.id),
    )
    assert response.status_code == 403


# --- GET /api/v1/projects/{project_id}/tasks/ ---

async def test_get_all_tasks(client: AsyncClient, create_user, create_project, create_task):
    user = await create_user(email="tasklist@example.com")
    project = await create_project(name="List Tasks", owner_id=user.id)
    await create_task(title="Task 1", project_id=project.id, creator_id=user.id)
    await create_task(title="Task 2", project_id=project.id, creator_id=user.id)

    response = await client.get(
        f"/api/v1/projects/{project.id}/tasks/",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert len(response.json()) >= 2


# --- GET /api/v1/projects/{project_id}/tasks/{task_id} ---

async def test_get_task_by_id(client: AsyncClient, create_user, create_project, create_task):
    user = await create_user(email="taskget@example.com")
    project = await create_project(name="Get Task", owner_id=user.id)
    task = await create_task(title="Find Me", project_id=project.id, creator_id=user.id)

    response = await client.get(
        f"/api/v1/projects/{project.id}/tasks/{task.id}",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Find Me"


async def test_get_task_not_found(client: AsyncClient, create_user, create_project):
    user = await create_user(email="tasknf@example.com")
    project = await create_project(name="No Task", owner_id=user.id)

    response = await client.get(
        f"/api/v1/projects/{project.id}/tasks/99999",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 404


# --- PATCH /api/v1/projects/{project_id}/tasks/{task_id} ---

async def test_update_task(client: AsyncClient, create_user, create_project, create_task):
    user = await create_user(email="taskupd@example.com")
    project = await create_project(name="Update Task", owner_id=user.id)
    task = await create_task(title="Old Title", project_id=project.id, creator_id=user.id)

    response = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}",
        json={"title": "New Title"},
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"


# --- DELETE /api/v1/projects/{project_id}/tasks/{task_id} ---

async def test_delete_task(client: AsyncClient, create_user, create_project, create_task):
    user = await create_user(email="taskdel@example.com")
    project = await create_project(name="Delete Task", owner_id=user.id)
    task = await create_task(title="Delete Me", project_id=project.id, creator_id=user.id)

    response = await client.delete(
        f"/api/v1/projects/{project.id}/tasks/{task.id}",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Task deleted successfully"


async def test_delete_task_not_owner(client: AsyncClient, create_user, create_project, create_task):
    owner = await create_user(email="taskdelown@example.com")
    member = await create_user(email="taskdelmem@example.com")
    project = await create_project(name="Owner Only Delete", owner_id=owner.id)
    task = await create_task(title="Protected", project_id=project.id, creator_id=owner.id)

    response = await client.delete(
        f"/api/v1/projects/{project.id}/tasks/{task.id}",
        headers=auth_headers(member.id),
    )
    assert response.status_code == 403


# --- PATCH /api/v1/projects/{project_id}/tasks/{task_id}/assign ---

async def test_assign_task(client: AsyncClient, create_user, create_project, create_task):
    user = await create_user(email="taskassign@example.com")
    project = await create_project(name="Assign Project", owner_id=user.id)
    task = await create_task(title="Assign Me", project_id=project.id, creator_id=user.id)

    response = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/assign",
        json={"assignee_id": user.id},
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["assignee_id"] == user.id


async def test_unassign_task(client: AsyncClient, create_user, create_project, create_task):
    user = await create_user(email="taskunassign@example.com")
    project = await create_project(name="Unassign Project", owner_id=user.id)
    task = await create_task(
        title="Unassign Me", project_id=project.id,
        creator_id=user.id, assignee_id=user.id,
    )

    response = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/assign",
        json={"assignee_id": None},
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["assignee_id"] is None


# --- PATCH /api/v1/projects/{project_id}/tasks/{task_id}/status ---

async def test_change_task_status(client: AsyncClient, create_user, create_project, create_task):
    user = await create_user(email="taskstatus@example.com")
    project = await create_project(name="Status Project", owner_id=user.id)
    task = await create_task(title="Status Task", project_id=project.id, creator_id=user.id)

    response = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/status",
        json={"status": "IN_PROGRESS"},
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["status"] == "IN_PROGRESS"


async def test_change_task_status_same(client: AsyncClient, create_user, create_project, create_task):
    user = await create_user(email="taskstatussame@example.com")
    project = await create_project(name="Same Status", owner_id=user.id)
    task = await create_task(
        title="Same", project_id=project.id,
        creator_id=user.id, status="TODO",
    )

    response = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/status",
        json={"status": "TODO"},
        headers=auth_headers(user.id),
    )
    assert response.status_code == 400


# --- PATCH /api/v1/projects/{project_id}/tasks/{task_id}/priority ---

async def test_change_task_priority(client: AsyncClient, create_user, create_project, create_task):
    user = await create_user(email="taskprio@example.com")
    project = await create_project(name="Priority Project", owner_id=user.id)
    task = await create_task(title="Prio Task", project_id=project.id, creator_id=user.id)

    response = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/priority",
        json={"priority": "HIGH"},
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["priority"] == "HIGH"


async def test_change_task_priority_same(client: AsyncClient, create_user, create_project, create_task):
    user = await create_user(email="taskpriosame@example.com")
    project = await create_project(name="Same Priority", owner_id=user.id)
    task = await create_task(
        title="Same Prio", project_id=project.id,
        creator_id=user.id, priority="MEDIUM",
    )

    response = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/priority",
        json={"priority": "MEDIUM"},
        headers=auth_headers(user.id),
    )
    assert response.status_code == 400


# --- GET /api/v1/tasks/me ---

async def test_get_my_tasks(client: AsyncClient, create_user, create_project, create_task):
    user = await create_user(email="mytasks@example.com")
    proj_a = await create_project(name="My Proj A", owner_id=user.id)
    proj_b = await create_project(name="My Proj B", owner_id=user.id)
    await create_task(title="Task A", project_id=proj_a.id, creator_id=user.id)
    await create_task(title="Task B", project_id=proj_b.id, creator_id=user.id)

    response = await client.get(
        "/api/v1/tasks/me",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    data = response.json()
    titles = [t["title"] for t in data]
    assert "Task A" in titles
    assert "Task B" in titles


async def test_get_my_tasks_empty(client: AsyncClient, create_user):
    user = await create_user(email="notasks@example.com")

    response = await client.get(
        "/api/v1/tasks/me",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json() == []


async def test_get_my_tasks_no_auth(client: AsyncClient):
    response = await client.get("/api/v1/tasks/me")
    assert response.status_code == 401
