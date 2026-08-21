import asyncio

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import async_session
from app.models.user import User


async def main():
    async with async_session() as session:

        result = await session.execute(
            select(User).options(
                selectinload(User.projects)
            )
        )

        user = result.scalars().first()

        if user is None:
            print("No user found")
            return

        print(f"User: {user.username}")
        print(f"User ID: {user.id}")

        print("\nProjects:")

        for project in user.projects:
            print(
                f"- {project.id}: {project.name}"
            )


asyncio.run(main())