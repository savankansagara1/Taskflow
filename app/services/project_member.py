from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project_member import ProjectMember
from app.repositories.project import ProjectRepository
from app.repositories.project_member import ProjectMemberRepository
from app.repositories.user import UserRepository


class ProjectMemberService:

    def __init__(self, session: AsyncSession):
        self.project_repository = ProjectRepository(session)
        self.user_repository = UserRepository(session)
        self.project_member_repository = ProjectMemberRepository(session)
        self.session = session



    async def add_member(
        self,
        project_id: int,
        user_id: int,
        owner_id: int,
    ) -> ProjectMember:

        project = await self.project_repository.get_by_id(
        project_id=project_id,
    )

        if project is None:
         raise ValueError("Project not found")

        if project.owner_id != owner_id:
         raise PermissionError(
        "You are not allowed to add members to this project"
    )

        user = await self.user_repository.get_by_id(
         user_id=user_id,
         )

        if user is None:
         raise ValueError("User not found")

        existing_member = (
          await self.project_member_repository.get_by_project_and_user(
            project_id=project_id,
            user_id=user_id,
        )
    )

        if existing_member is not None:
         raise ValueError("User is already a member of this project")

        project_member = await self.project_member_repository.create(
        project_id=project_id,
        user_id=user_id,
    )

        await self.session.commit()

        return project_member



    async def get_all_members(
        self,
        project_id: int,
        user_id: int,
    ) -> list[ProjectMember]:

        project = await self.project_repository.get_by_id(
            project_id=project_id,
    )

        if project is None:
            raise ValueError("Project not found")

        if project.owner_id != user_id:
            raise PermissionError(
                "You are not allowed to view members of this  project"
            )

        return await self.project_member_repository.get_all_by_project_id(
            project_id=project_id,
    )




    async def remove_member(
       self,
       project_id: int,
       user_id: int,
       owner_id: int,
    ) -> None:

     project = await self.project_repository.get_by_id(
        project_id=project_id,
    )

     if project is None:
        raise ValueError("Project not found")

     if project.owner_id != owner_id:
        raise PermissionError(
            "You are not allowed to remove members from this project"
        )

     project_member = (
        await self.project_member_repository.get_by_project_and_user(
            project_id=project_id,
            user_id=user_id,
        )
    )

     if project_member is None:
        raise ValueError("User is not a member of this project")

     await self.project_member_repository.delete(
        project_member=project_member,
    )

     await self.session.commit()