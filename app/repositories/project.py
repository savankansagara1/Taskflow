from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from sqlalchemy.orm import selectinload

class ProjectRepository:

        def __init__(self, session: AsyncSession):
            self.session = session

        async def create(
            self,
            name: str,
            description: str | None,
            owner_id: int,
            
        ) -> Project:
            project = Project(
                name=name,
                description=description,
                owner_id=owner_id,
            )

            self.session.add(project)

            await self.session.flush()

            await self.session.refresh(project)

            return project

        async def get_by_id(
            self,
            project_id: int,
        ) -> Project | None:
            result = await self.session.execute(
                select(Project).where(
                    Project.id == project_id,
                )
            )

            return result.scalar_one_or_none()

        async def get_all(
            self,
        ) -> list[Project]:
            result = await self.session.execute(select(Project))

            return list(result.scalars().all())

        async def get_by_owner_id(
            self,
            owner_id: int,
        ) -> list[Project]:
            result = await self.session.execute(
                select(Project).where(
                    Project.owner_id == owner_id,
                )
            )

            return list(result.scalars().all())

        async def update(
            self,
            project: Project,
            name: str | None = None,
            description: str | None = None,
        ) -> Project:

            if name is not None:
                project.name = name

            if description is not None:
                project.description = description

            await self.session.flush()

            await self.session.refresh(project)

            return project

        async def delete(
            self,
            project: Project,
        ) -> None:
            await self.session.delete(project)

            await self.session.flush()


            
        async def get_by_id_with_owner(
            self,
            project_id: int,
        ) -> Project | None:

            result = await self.session.execute(
                select(Project)
                .options(
                    selectinload(Project.owner)
                )
                .where(Project.id == project_id)
            )

            return result.scalar_one_or_none()    