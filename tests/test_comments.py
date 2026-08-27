import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers

pytestmark = pytest.mark.asyncio


# --- POST /api/v1/projects/{pid}/tasks/{tid}/comments/ ---

async def test_create_comment(client: AsyncClient, create_user, create_project, create_task):
    user = await create_user(email="comcreator@example.com")
    project = await create_project(name="Comment Project", owner_id=user.id)
    task = await create_task(title="Comment Task", project_id=project.id, creator_id=user.id)

    response = await client.post(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/comments/",
        json={"content": "Looks good!"},
        headers=auth_headers(user.id),
    )
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "Looks good!"
    assert data["author_id"] == user.id
    assert data["task_id"] == task.id


async def test_create_comment_no_access(
    client: AsyncClient, create_user, create_project, create_task,
):
    owner = await create_user(email="comowner@example.com")
    stranger = await create_user(email="comstranger@example.com")
    project = await create_project(name="Private Com", owner_id=owner.id)
    task = await create_task(title="Private Task", project_id=project.id, creator_id=owner.id)

    response = await client.post(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/comments/",
        json={"content": "Sneaky comment"},
        headers=auth_headers(stranger.id),
    )
    assert response.status_code == 403


# --- GET /api/v1/projects/{pid}/tasks/{tid}/comments/ ---

async def test_get_comments(
    client: AsyncClient, create_user, create_project, create_task, create_comment,
):
    user = await create_user(email="comlist@example.com")
    project = await create_project(name="List Comments", owner_id=user.id)
    task = await create_task(title="Commented Task", project_id=project.id, creator_id=user.id)
    await create_comment(content="First", task_id=task.id, author_id=user.id)
    await create_comment(content="Second", task_id=task.id, author_id=user.id)

    response = await client.get(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/comments/",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert len(response.json()) >= 2


# --- GET /api/v1/projects/{pid}/tasks/{tid}/comments/{cid} ---

async def test_get_comment_by_id(
    client: AsyncClient, create_user, create_project, create_task, create_comment,
):
    user = await create_user(email="comget@example.com")
    project = await create_project(name="Get Comment", owner_id=user.id)
    task = await create_task(title="Get Com Task", project_id=project.id, creator_id=user.id)
    comment = await create_comment(content="Find me", task_id=task.id, author_id=user.id)

    response = await client.get(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/comments/{comment.id}",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["content"] == "Find me"


async def test_get_comment_not_found(
    client: AsyncClient, create_user, create_project, create_task,
):
    user = await create_user(email="comnf@example.com")
    project = await create_project(name="No Comment", owner_id=user.id)
    task = await create_task(title="NF Com Task", project_id=project.id, creator_id=user.id)

    response = await client.get(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/comments/99999",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 404


# --- PATCH /api/v1/projects/{pid}/tasks/{tid}/comments/{cid} ---

async def test_update_comment(
    client: AsyncClient, create_user, create_project, create_task, create_comment,
):
    user = await create_user(email="comupd@example.com")
    project = await create_project(name="Update Comment", owner_id=user.id)
    task = await create_task(title="Upd Com Task", project_id=project.id, creator_id=user.id)
    comment = await create_comment(content="Old", task_id=task.id, author_id=user.id)

    response = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/comments/{comment.id}",
        json={"content": "Updated"},
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["content"] == "Updated"


async def test_update_comment_not_author(
    client: AsyncClient, create_user, create_project, create_task, create_comment,
    add_project_member,
):
    owner = await create_user(email="comupdown@example.com")
    other = await create_user(email="comupdoth@example.com")
    project = await create_project(name="Not Author Upd", owner_id=owner.id)
    await add_project_member(project_id=project.id, user_id=other.id)
    task = await create_task(title="Auth Com Task", project_id=project.id, creator_id=owner.id)
    comment = await create_comment(content="Mine", task_id=task.id, author_id=owner.id)

    response = await client.patch(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/comments/{comment.id}",
        json={"content": "Hacked"},
        headers=auth_headers(other.id),
    )
    assert response.status_code == 403


# --- DELETE /api/v1/projects/{pid}/tasks/{tid}/comments/{cid} ---

async def test_delete_comment(
    client: AsyncClient, create_user, create_project, create_task, create_comment,
):
    user = await create_user(email="comdel@example.com")
    project = await create_project(name="Delete Comment", owner_id=user.id)
    task = await create_task(title="Del Com Task", project_id=project.id, creator_id=user.id)
    comment = await create_comment(content="Delete me", task_id=task.id, author_id=user.id)

    response = await client.delete(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/comments/{comment.id}",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Comment deleted successfully"


async def test_delete_comment_not_author(
    client: AsyncClient, create_user, create_project, create_task, create_comment,
    add_project_member,
):
    owner = await create_user(email="comdelown@example.com")
    other = await create_user(email="comdeloth@example.com")
    project = await create_project(name="Not Author Del", owner_id=owner.id)
    await add_project_member(project_id=project.id, user_id=other.id)
    task = await create_task(title="Del Auth Task", project_id=project.id, creator_id=owner.id)
    comment = await create_comment(content="Not yours", task_id=task.id, author_id=owner.id)

    response = await client.delete(
        f"/api/v1/projects/{project.id}/tasks/{task.id}/comments/{comment.id}",
        headers=auth_headers(other.id),
    )
    assert response.status_code == 403
