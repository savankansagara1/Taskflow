import asyncio

from app.core.database import async_session
from app.repositories.user import UserRepository


async def main():
    async with async_session() as db:
        repository = UserRepository(db)

        user = await repository.create(
            username="savan",
            email="savan@example.com",
        )

        print(user.id)
        print(user.username)
        print(user.email)


asyncio.run(main())

