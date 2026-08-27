import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers

pytestmark = pytest.mark.asyncio


# --- GET /api/v1/projects/{pid}/tasks/{tid}/activity/ ---

async def test_get_activity_after_task_creation(
    client: AsyncClient, create_user, create_project,
):
    """Creating a task via API should auto-create a TASK_CREATED activity."""
    user = await create_user(email="activity@example.com")
    project = await create_project(name="Activity Project", owner_id=user.id)

    # create task via API so the service logs activity
    await client.post(
        f"/api/v1/projects/{project.id}/tasks/",
        json={"title": "Activity Task"},
        headers=auth_headers(user.id),
    )

    # the task id will be 1 for this test's session context
    # fetch tasks to get the actual id
    tasks_resp = await client.get(
        f"/api/v1/projects/{project.id}/tasks/",
        headers=auth_headers(user.id),
    )
    task_id = tasks_resp.json()[0]["id"]

    response = await client.get(
        f"/api/v1/projects/{project.id}/tasks/{task_id}/activity/",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data) >= 1
    assert data[0]["action"] == "TASK_CREATED"


async def test_get_activity_no_access(
    client: AsyncClient, create_user, create_project, create_task,
):
    owner = await create_user(email="actowner@example.com")
    stranger = await create_user(email="actstranger@example.com")
    project = await create_project(name="Private Activity", owner_id=owner.id)
    task = await create_task(title="Hidden Task", project_id=project.id, creator_id=owner.id)

    response = await client.get(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/activity/",
        headers=auth_headers(stranger.id),
    )
    assert response.status_code == 403


async def test_get_activity_task_not_found(
    client: AsyncClient, create_user, create_project,
):
    user = await create_user(email="actnf@example.com")
    project = await create_project(name="No Task Activity", owner_id=user.id)

    response = await client.get(
        f"/api/v1/projects/{project.id}/tasks/99999/activity/",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 404
