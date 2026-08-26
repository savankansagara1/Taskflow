from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project_member import ProjectMember

from sqlalchemy import select


class ProjectMemberRepository:

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        project_id: int,
        user_id: int,
    ) -> ProjectMember:

        project_member = ProjectMember(
            project_id=project_id,
            user_id=user_id,
        )

        self.session.add(project_member)

        return project_member
    

    async def get_by_project_and_user(
      self,
      project_id: int,
      user_id: int,
    ) -> ProjectMember | None:

     result = await self.session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )

     return result.scalar_one_or_none()


    async def get_all_by_project_id(
        self,
        project_id: int,
    ) -> list[ProjectMember]:

        result = await self.session.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
        )
    )

        return list(result.scalars().all())



    async def delete(
        self,
        project_member: ProjectMember,
    ) -> None:

        await self.session.delete(project_member)   