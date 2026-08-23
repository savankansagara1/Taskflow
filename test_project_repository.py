import asyncio
import selectors

from app.core.database import async_session
from app.repositories.project import ProjectRepository


async def main():
    async with async_session() as session:

        repository = ProjectRepository(session)

        # Create a temporary project
        project = await repository.create(
            name="Temporary Project To Delete",
            owner_id=1,
        )

        print(f"Created project: {project.id}")

        # # Delete it
        # await repository.delete(
        #     project=project,
        # )

        await session.commit()

        print("Project deleted successfully")


# asyncio.run(main())

if __name__ == "__main__":
    asyncio.run(
        main(),
        loop_factory=lambda: asyncio.SelectorEventLoop(
            selectors.SelectSelector()
        ),
    )