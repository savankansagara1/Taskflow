import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers

pytestmark = pytest.mark.asyncio


# --- POST /api/v1/projects/ ---

async def test_create_project(client: AsyncClient, create_user):
    user = await create_user(email="projowner@example.com")

    response = await client.post("/api/v1/projects/", json={
        "name": "My Project",
        "description": "A cool project",
    }, headers=auth_headers(user.id))

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "My Project"
    assert data["owner_id"] == user.id


async def test_create_project_no_auth(client: AsyncClient):
    response = await client.post("/api/v1/projects/", json={
        "name": "Unauthorized",
    })
    assert response.status_code == 401


# --- GET /api/v1/projects/ ---

async def test_get_all_projects(client: AsyncClient, create_user, create_project):
    user = await create_user(email="listproj@example.com")
    await create_project(name="Proj A", owner_id=user.id)
    await create_project(name="Proj B", owner_id=user.id)

    response = await client.get(
        "/api/v1/projects/",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert len(response.json()) >= 2


# --- GET /api/v1/projects/{project_id} ---

async def test_get_project_by_id(client: AsyncClient, create_user, create_project):
    user = await create_user(email="getproj@example.com")
    project = await create_project(name="Find Me", owner_id=user.id)

    response = await client.get(
        f"/api/v1/projects/{project.id}",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Find Me"


async def test_get_project_not_found(client: AsyncClient, create_user):
    user = await create_user(email="noproj@example.com")

    response = await client.get(
        "/api/v1/projects/99999",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 404


async def test_get_project_not_owner(client: AsyncClient, create_user, create_project):
    owner = await create_user(email="realowner@example.com")
    other = await create_user(email="stranger@example.com")
    project = await create_project(name="Private", owner_id=owner.id)

    response = await client.get(
        f"/api/v1/projects/{project.id}",
        headers=auth_headers(other.id),
    )
    assert response.status_code == 403


# --- PATCH /api/v1/projects/{project_id} ---

async def test_update_project(client: AsyncClient, create_user, create_project):
    user = await create_user(email="updateproj@example.com")
    project = await create_project(name="Old Name", owner_id=user.id)

    response = await client.patch(
        f"/api/v1/projects/{project.id}",
        json={"name": "New Name"},
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


async def test_update_project_not_owner(client: AsyncClient, create_user, create_project):
    owner = await create_user(email="updowner@example.com")
    other = await create_user(email="updother@example.com")
    project = await create_project(name="Locked", owner_id=owner.id)

    response = await client.patch(
        f"/api/v1/projects/{project.id}",
        json={"name": "Hacked"},
        headers=auth_headers(other.id),
    )
    assert response.status_code == 403


async def test_update_project_not_found(client: AsyncClient, create_user):
    user = await create_user(email="updghost@example.com")

    response = await client.patch(
        "/api/v1/projects/99999",
        json={"name": "Ghost"},
        headers=auth_headers(user.id),
    )
    assert response.status_code == 400


# --- DELETE /api/v1/projects/{project_id} ---

async def test_delete_project(client: AsyncClient, create_user, create_project):
    user = await create_user(email="delproj@example.com")
    project = await create_project(name="Delete Me", owner_id=user.id)

    response = await client.delete(
        f"/api/v1/projects/{project.id}",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Project deleted successfully"


async def test_delete_project_not_owner(client: AsyncClient, create_user, create_project):
    owner = await create_user(email="delowner@example.com")
    other = await create_user(email="delother@example.com")
    project = await create_project(name="Not Yours", owner_id=owner.id)

    response = await client.delete(
        f"/api/v1/projects/{project.id}",
        headers=auth_headers(other.id),
    )
    assert response.status_code == 403


async def test_delete_project_not_found(client: AsyncClient, create_user):
    user = await create_user(email="delnf@example.com")

    response = await client.delete(
        "/api/v1/projects/99999",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 404


# --- POST /api/v1/projects/{project_id}/members ---

async def test_add_member(client: AsyncClient, create_user, create_project):
    owner = await create_user(email="memowner@example.com")
    member = await create_user(email="newmember@example.com")
    project = await create_project(name="Team Project", owner_id=owner.id)

    response = await client.post(
        f"/api/v1/projects/{project.id}/members?user_id={member.id}",
        headers=auth_headers(owner.id),
    )
    assert response.status_code == 200


async def test_add_member_not_owner(client: AsyncClient, create_user, create_project):
    owner = await create_user(email="memowner2@example.com")
    other = await create_user(email="notowner@example.com")
    member = await create_user(email="wannabe@example.com")
    project = await create_project(name="Restricted", owner_id=owner.id)

    response = await client.post(
        f"/api/v1/projects/{project.id}/members?user_id={member.id}",
        headers=auth_headers(other.id),
    )
    assert response.status_code == 403


async def test_add_member_user_not_found(client: AsyncClient, create_user, create_project):
    owner = await create_user(email="memowner3@example.com")
    project = await create_project(name="No Such User", owner_id=owner.id)

    response = await client.post(
        f"/api/v1/projects/{project.id}/members?user_id=99999",
        headers=auth_headers(owner.id),
    )
    assert response.status_code == 400


async def test_add_member_already_member(
    client: AsyncClient, create_user, create_project, add_project_member,
):
    owner = await create_user(email="memowner4@example.com")
    member = await create_user(email="already@example.com")
    project = await create_project(name="Dupe Member", owner_id=owner.id)
    await add_project_member(project_id=project.id, user_id=member.id)

    response = await client.post(
        f"/api/v1/projects/{project.id}/members?user_id={member.id}",
        headers=auth_headers(owner.id),
    )
    assert response.status_code == 400


# --- GET /api/v1/projects/{project_id}/members ---

async def test_get_members(
    client: AsyncClient, create_user, create_project, add_project_member,
):
    owner = await create_user(email="listmem@example.com")
    member = await create_user(email="listed@example.com")
    project = await create_project(name="List Members", owner_id=owner.id)
    await add_project_member(project_id=project.id, user_id=member.id)

    response = await client.get(
        f"/api/v1/projects/{project.id}/members",
        headers=auth_headers(owner.id),
    )
    assert response.status_code == 200
    assert len(response.json()) >= 1


async def test_get_members_not_owner(client: AsyncClient, create_user, create_project):
    owner = await create_user(email="listmemown@example.com")
    other = await create_user(email="listmemoth@example.com")
    project = await create_project(name="No Peek", owner_id=owner.id)

    response = await client.get(
        f"/api/v1/projects/{project.id}/members",
        headers=auth_headers(other.id),
    )
    assert response.status_code == 403


# --- DELETE /api/v1/projects/{project_id}/members/{user_id} ---

async def test_remove_member(
    client: AsyncClient, create_user, create_project, add_project_member,
):
    owner = await create_user(email="remmemown@example.com")
    member = await create_user(email="remmem@example.com")
    project = await create_project(name="Remove Member", owner_id=owner.id)
    await add_project_member(project_id=project.id, user_id=member.id)

    response = await client.delete(
        f"/api/v1/projects/{project.id}/members/{member.id}",
        headers=auth_headers(owner.id),
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Member removed successfully"


async def test_remove_member_not_owner(
    client: AsyncClient, create_user, create_project, add_project_member,
):
    owner = await create_user(email="remmemown2@example.com")
    member = await create_user(email="remmem2@example.com")
    other = await create_user(email="remmemoth@example.com")
    project = await create_project(name="Cant Remove", owner_id=owner.id)
    await add_project_member(project_id=project.id, user_id=member.id)

    response = await client.delete(
        f"/api/v1/projects/{project.id}/members/{member.id}",
        headers=auth_headers(other.id),
    )
    assert response.status_code == 403


async def test_remove_member_not_a_member(client: AsyncClient, create_user, create_project):
    owner = await create_user(email="remmemown3@example.com")
    project = await create_project(name="No Member", owner_id=owner.id)

    response = await client.delete(
        f"/api/v1/projects/{project.id}/members/99999",
        headers=auth_headers(owner.id),
    )
    assert response.status_code == 404
