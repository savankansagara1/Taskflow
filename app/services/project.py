from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.repositories.project import ProjectRepository
from app.repositories.user import UserRepository
from app.schemas.project import ProjectCreate


class ProjectService:

    def __init__(self, session: AsyncSession):
        self.user_repository = UserRepository(session)
        self.project_repository = ProjectRepository(session)
        self.session = session

    async def create_project(
        self,
        project_data: ProjectCreate,
    ) -> Project:

        user = await self.user_repository.get_by_id(
            user_id=project_data.owner_id,
        )

        if user is None:
            raise ValueError("Owner does not exist")

        project = await self.project_repository.create(
            name=project_data.name,
            owner_id=project_data.owner_id,
        )

        await self.session.commit()

        return project