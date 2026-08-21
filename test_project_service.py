import asyncio

from app.core.database import async_session
from app.schemas.project import ProjectCreate
from app.services.project import ProjectService


async def main():
    async with async_session() as session:

        service = ProjectService(session)

        project_data = ProjectCreate(
            name="Service Test Project",
            owner_id=2,
        )

        project = await service.create_project(
            project_data=project_data,
        )

        print(f"Project created: {project.name}")
        print(f"Owner ID: {project.owner_id}")


asyncio.run(main())