from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task


class TaskRepository:

    def __init__(
        self,
        session: AsyncSession,
    ):
        self.session = session

    async def create(
        self,
        title: str,
        description: str | None,
        project_id: int,
        creator_id: int,
        priority: str = "MEDIUM",
        assignee_id: int | None = None,
        due_date: datetime | None = None,
    ) -> Task:

        task = Task(
            title=title,
            description=description,
            project_id=project_id,
            creator_id=creator_id,
            priority=priority,
            assignee_id=assignee_id,
            due_date=due_date,
        )

        self.session.add(task)

        await self.session.flush()
        await self.session.refresh(task)

        return task

    async def get_by_id(
        self,
        task_id: int,
    ) -> Task | None:

        result = await self.session.execute(
            select(Task).where(
                Task.id == task_id,
            )
        )

        return result.scalar_one_or_none()

    async def get_all_by_project_id(
        self,
        project_id: int,
    ) -> list[Task]:

        result = await self.session.execute(
            select(Task).where(
                Task.project_id == project_id,
            )
        )

        return list(result.scalars().all())

    async def update(
        self,
        task: Task,
        title: str | None = None,
        description: str | None = None,
        status: str | None = None,
        priority: str | None = None,
        assignee_id: int | None = None,
        due_date: datetime | None = None,
        clear_assignee: bool = False,
        clear_due_date: bool = False,
    ) -> Task:

        if title is not None:
            task.title = title

        if description is not None:
            task.description = description

        if status is not None:
            task.status = status

        if priority is not None:
            task.priority = priority

        if clear_assignee:
            task.assignee_id = None
        elif assignee_id is not None:
            task.assignee_id = assignee_id

        if clear_due_date:
            task.due_date = None
        elif due_date is not None:
            task.due_date = due_date

        await self.session.flush()
        await self.session.refresh(task)

        return task

    async def delete(
        self,
        task: Task,
    ) -> None:

        await self.session.delete(task)