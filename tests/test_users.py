import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers

pytestmark = pytest.mark.asyncio


# --- POST /api/v1/users/ ---

async def test_create_user(client: AsyncClient):
    response = await client.post("/api/v1/users/", json={
        "username": "john",
        "email": "john@example.com",
        "password": "secret123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "john"
    assert data["email"] == "john@example.com"
    assert "password" not in data  # password should not be in response


async def test_create_user_duplicate_email(client: AsyncClient, create_user):
    await create_user(email="dupe@example.com")

    response = await client.post("/api/v1/users/", json={
        "username": "another",
        "email": "dupe@example.com",
        "password": "secret123",
    })
    assert response.status_code == 409


# --- GET /api/v1/users/ ---

async def test_get_all_users(client: AsyncClient, create_user):
    await create_user(username="user1", email="user1@example.com")
    await create_user(username="user2", email="user2@example.com")

    response = await client.get("/api/v1/users/")
    assert response.status_code == 200
    assert len(response.json()) >= 2


# --- GET /api/v1/users/me ---

async def test_get_me(client: AsyncClient, create_user):
    user = await create_user(email="me@example.com")

    response = await client.get(
        "/api/v1/users/me",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


async def test_get_me_no_token(client: AsyncClient):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


# --- GET /api/v1/users/{user_id} ---

async def test_get_user_by_id(client: AsyncClient, create_user):
    user = await create_user(email="findme@example.com")

    response = await client.get(f"/api/v1/users/{user.id}")
    assert response.status_code == 200
    assert response.json()["id"] == user.id


async def test_get_user_not_found(client: AsyncClient):
    response = await client.get("/api/v1/users/99999")
    assert response.status_code == 404


# --- PATCH /api/v1/users/{user_id} ---

async def test_update_user(client: AsyncClient, create_user):
    user = await create_user(email="update@example.com")

    response = await client.patch(
        f"/api/v1/users/{user.id}",
        json={"username": "updated_name"},
    )
    assert response.status_code == 200
    assert response.json()["username"] == "updated_name"


async def test_update_user_not_found(client: AsyncClient):
    response = await client.patch(
        "/api/v1/users/99999",
        json={"username": "ghost"},
    )
    assert response.status_code == 404


# --- DELETE /api/v1/users/{user_id} ---

async def test_delete_user(client: AsyncClient, create_user):
    user = await create_user(email="delete@example.com")

    response = await client.delete(f"/api/v1/users/{user.id}")
    assert response.status_code == 204


async def test_delete_user_not_found(client: AsyncClient):
    response = await client.delete("/api/v1/users/99999")
    assert response.status_code == 404


# --- POST /api/v1/users/login ---

async def test_login_success(client: AsyncClient, create_user):
    await create_user(email="login@example.com", password="mypassword")

    response = await client.post("/api/v1/users/login", data={
        "username": "login@example.com",  # OAuth2 form uses "username" field
        "password": "mypassword",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client: AsyncClient, create_user):
    await create_user(email="wrongpw@example.com", password="correct")

    response = await client.post("/api/v1/users/login", data={
        "username": "wrongpw@example.com",
        "password": "wrong",
    })
    assert response.status_code == 401


async def test_login_wrong_email(client: AsyncClient):
    response = await client.post("/api/v1/users/login", data={
        "username": "noone@example.com",
        "password": "whatever",
    })
    assert response.status_code == 401
