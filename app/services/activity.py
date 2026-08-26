from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity
from app.repositories.activity import ActivityRepository
from app.repositories.project import ProjectRepository
from app.repositories.project_member import ProjectMemberRepository
from app.repositories.task import TaskRepository


class ActivityService:

    def __init__(
        self,
        session: AsyncSession,
    ):
        self.session = session

        self.activity_repository = ActivityRepository(session)
        self.task_repository = TaskRepository(session)
        self.project_repository = ProjectRepository(session)
        self.project_member_repository = ProjectMemberRepository(session)

    async def _check_project_access(
        self,
        project_id: int,
        user_id: int,
    ) -> None:

        project = await self.project_repository.get_by_id(
            project_id=project_id,
        )

        if project is None:
            raise ValueError("Project not found")

        if project.owner_id == user_id:
            return

        project_member = (
            await self.project_member_repository.get_by_project_and_user(
                project_id=project_id,
                user_id=user_id,
            )
        )

        if project_member is None:
            raise PermissionError(
                "You do not have access to this project"
            )

    async def get_activities_for_task(
        self,
        project_id: int,
        task_id: int,
        user_id: int,
    ) -> list[Activity]:

        # Check project access
        await self._check_project_access(
            project_id=project_id,
            user_id=user_id,
        )

        # Verify task exists and belongs to project
        task = await self.task_repository.get_by_id(
            task_id=task_id,
        )

        if task is None:
            raise ValueError("Task not found")

        if task.project_id != project_id:
            raise ValueError(
                "Task does not belong to this project"
            )

        return await self.activity_repository.get_all_by_task_id(
            task_id=task_id,
        )
