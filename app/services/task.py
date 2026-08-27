from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.repositories.activity import ActivityRepository
from app.repositories.project import ProjectRepository
from app.repositories.project_member import ProjectMemberRepository
from app.repositories.task import TaskRepository
from app.repositories.user import UserRepository
from app.schemas.task import TaskCreate, TaskUpdate


class TaskService:

    def __init__(
        self,
        session: AsyncSession,
    ):
        self.session = session

        self.project_repository = ProjectRepository(
            session,
        )

        self.project_member_repository = ProjectMemberRepository(
            session,
        )

        self.task_repository = TaskRepository(
            session,
        )

        self.user_repository = UserRepository(
            session,
        )

        self.activity_repository = ActivityRepository(
            session,
        )

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

        # Project owner always has access
        if project.owner_id == user_id:
            return

        # Check whether the user is a project member
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

    async def _is_project_member_or_owner(
        self,
        project_id: int,
        user_id: int,
    ) -> bool:
        """Check if user is owner or member without raising exceptions."""

        project = await self.project_repository.get_by_id(
            project_id=project_id,
        )

        if project is None:
            return False

        if project.owner_id == user_id:
            return True

        member = (
            await self.project_member_repository.get_by_project_and_user(
                project_id=project_id,
                user_id=user_id,
            )
        )

        return member is not None

    async def create_task(
        self,
        project_id: int,
        task_data: TaskCreate,
        user_id: int,
    ) -> Task:

        # Check project exists and user has access
        await self._check_project_access(
            project_id=project_id,
            user_id=user_id,
        )

        # Validate assignee if provided
        if task_data.assignee_id is not None:
            await self._validate_assignee(
                project_id=project_id,
                assignee_id=task_data.assignee_id,
            )

        # Create the task with creator auto-set from authenticated user
        task = await self.task_repository.create(
            title=task_data.title,
            description=task_data.description,
            project_id=project_id,
            creator_id=user_id,
            priority=task_data.priority.value,
            assignee_id=task_data.assignee_id,
            due_date=task_data.due_date,
        )

        # Log activity
        await self.activity_repository.create(
            task_id=task.id,
            user_id=user_id,
            action="TASK_CREATED",
            detail=f"Task '{task.title}' created",
        )

        # Save transaction
        await self.session.commit()

        await self.session.refresh(task)

        return task

    async def get_all_tasks(
        self,
        project_id: int,
        user_id: int,
    ) -> list[Task]:

        await self._check_project_access(
            project_id=project_id,
            user_id=user_id,
        )

        return await self.task_repository.get_all_by_project_id(
            project_id=project_id,
        )

    async def get_my_tasks(
        self,
        user_id: int,
    ) -> list[Task]:
        """Return all tasks where the user is either the creator or assignee,
        irrespective of which project they belong to."""

        return await self.task_repository.get_all_by_user(
            user_id=user_id,
        )

    async def get_task_by_id(
        self,
        project_id: int,
        task_id: int,
        user_id: int,
    ) -> Task:

        await self._check_project_access(
            project_id=project_id,
            user_id=user_id,
        )

        task = await self.task_repository.get_by_id(
            task_id=task_id,
        )

        if task is None:
            raise ValueError("Task not found")

        if task.project_id != project_id:
            raise ValueError(
                "Task does not belong to this project"
            )

        return task

    async def update_task(
        self,
        project_id: int,
        task_id: int,
        task_data: TaskUpdate,
        user_id: int,
    ) -> Task:

        # Check project access
        await self._check_project_access(
            project_id=project_id,
            user_id=user_id,
        )

        # Find task
        task = await self.task_repository.get_by_id(
            task_id=task_id,
        )

        if task is None:
            raise ValueError("Task not found")

        # Make sure task belongs to this project
        if task.project_id != project_id:
            raise ValueError(
                "Task does not belong to this project"
            )

        # Get only fields sent by the user
        update_data = task_data.model_dump(
            exclude_unset=True,
        )

        # Prevent empty PATCH request
        if not update_data:
            raise ValueError(
                "At least one field must be provided for update"
            )

        # Validate assignee if provided
        if "assignee_id" in update_data and update_data["assignee_id"] is not None:
            await self._validate_assignee(
                project_id=project_id,
                assignee_id=update_data["assignee_id"],
            )

        # Track changes for activity history
        old_status = task.status
        old_priority = task.priority
        old_assignee_id = task.assignee_id

        # Prepare update kwargs
        update_kwargs = {}

        if "title" in update_data:
            update_kwargs["title"] = update_data["title"]

        if "description" in update_data:
            update_kwargs["description"] = update_data["description"]

        if "status" in update_data:
            update_kwargs["status"] = update_data["status"].value

        if "priority" in update_data:
            update_kwargs["priority"] = update_data["priority"].value

        if "assignee_id" in update_data:
            if update_data["assignee_id"] is None:
                update_kwargs["clear_assignee"] = True
            else:
                update_kwargs["assignee_id"] = update_data["assignee_id"]

        if "due_date" in update_data:
            if update_data["due_date"] is None:
                update_kwargs["clear_due_date"] = True
            else:
                update_kwargs["due_date"] = update_data["due_date"]

        # Update task
        updated_task = await self.task_repository.update(
            task=task,
            **update_kwargs,
        )

        # Log activity for specific changes
        if "status" in update_data and update_data["status"].value != old_status:
            await self.activity_repository.create(
                task_id=task.id,
                user_id=user_id,
                action="STATUS_CHANGED",
                detail=f"Status changed from {old_status} to {update_data['status'].value}",
            )

        if "priority" in update_data and update_data["priority"].value != old_priority:
            await self.activity_repository.create(
                task_id=task.id,
                user_id=user_id,
                action="PRIORITY_CHANGED",
                detail=f"Priority changed from {old_priority} to {update_data['priority'].value}",
            )

        if "assignee_id" in update_data and update_data["assignee_id"] != old_assignee_id:
            new_assignee = update_data["assignee_id"]
            if new_assignee is None:
                detail = "Task unassigned"
            else:
                detail = f"Task assigned to user {new_assignee}"
            await self.activity_repository.create(
                task_id=task.id,
                user_id=user_id,
                action="TASK_ASSIGNED",
                detail=detail,
            )

        # Log generic update if other fields changed (title, description, due_date)
        other_fields = {"title", "description", "due_date"}
        changed_other = other_fields.intersection(update_data.keys())
        if changed_other:
            await self.activity_repository.create(
                task_id=task.id,
                user_id=user_id,
                action="TASK_UPDATED",
                detail=f"Updated fields: {', '.join(changed_other)}",
            )

        await self.session.commit()

        await self.session.refresh(updated_task)

        return updated_task

    async def delete_task(
        self,
        project_id: int,
        task_id: int,
        user_id: int,
    ) -> None:

        # 1. Check project exists
        project = await self.project_repository.get_by_id(
            project_id=project_id,
        )

        if project is None:
            raise ValueError("Project not found")

        # 2. Only the project owner can delete tasks
        if project.owner_id != user_id:
            raise PermissionError(
                "You are not allowed to delete tasks from this project"
            )

        # 3. Find the task
        task = await self.task_repository.get_by_id(
            task_id=task_id,
        )

        if task is None:
            raise ValueError("Task not found")

        # 4. Make sure task belongs to this project
        if task.project_id != project_id:
            raise ValueError(
                "Task does not belong to this project"
            )

        # 5. Delete (cascade will remove comments and activities)
        await self.task_repository.delete(
            task=task,
        )

        # 6. Commit
        await self.session.commit()

    async def _validate_assignee(
        self,
        project_id: int,
        assignee_id: int,
    ) -> None:
        """Validate that the assignee exists and has access to the project."""

        user = await self.user_repository.get_by_id(
            user_id=assignee_id,
        )

        if user is None:
            raise ValueError("Assignee user not found")

        is_member = await self._is_project_member_or_owner(
            project_id=project_id,
            user_id=assignee_id,
        )

        if not is_member:
            raise PermissionError(
                "Assignee does not have access to this project"
            )

    async def _get_task_for_project(
        self,
        project_id: int,
        task_id: int,
        user_id: int,
    ) -> Task:
        """Check project access, fetch task, and verify it belongs to the project."""

        await self._check_project_access(
            project_id=project_id,
            user_id=user_id,
        )

        task = await self.task_repository.get_by_id(
            task_id=task_id,
        )

        if task is None:
            raise ValueError("Task not found")

        if task.project_id != project_id:
            raise ValueError(
                "Task does not belong to this project"
            )

        return task

    async def assign_task(
        self,
        project_id: int,
        task_id: int,
        assignee_id: int | None,
        user_id: int,
    ) -> Task:

        task = await self._get_task_for_project(
            project_id=project_id,
            task_id=task_id,
            user_id=user_id,
        )

        # Validate assignee if not unassigning
        if assignee_id is not None:
            await self._validate_assignee(
                project_id=project_id,
                assignee_id=assignee_id,
            )

        old_assignee_id = task.assignee_id

        if assignee_id == old_assignee_id:
            raise ValueError("Task is already assigned to this user")

        # Update
        if assignee_id is None:
            updated_task = await self.task_repository.update(
                task=task,
                clear_assignee=True,
            )
            detail = "Task unassigned"
        else:
            updated_task = await self.task_repository.update(
                task=task,
                assignee_id=assignee_id,
            )
            detail = f"Task assigned to user {assignee_id}"

        # Log activity
        await self.activity_repository.create(
            task_id=task.id,
            user_id=user_id,
            action="TASK_ASSIGNED",
            detail=detail,
        )

        await self.session.commit()
        await self.session.refresh(updated_task)

        return updated_task

    async def change_status(
        self,
        project_id: int,
        task_id: int,
        new_status: str,
        user_id: int,
    ) -> Task:

        task = await self._get_task_for_project(
            project_id=project_id,
            task_id=task_id,
            user_id=user_id,
        )

        old_status = task.status

        if new_status == old_status:
            raise ValueError(f"Task is already in {old_status} status")

        updated_task = await self.task_repository.update(
            task=task,
            status=new_status,
        )

        # Log activity
        await self.activity_repository.create(
            task_id=task.id,
            user_id=user_id,
            action="STATUS_CHANGED",
            detail=f"Status changed from {old_status} to {new_status}",
        )

        await self.session.commit()
        await self.session.refresh(updated_task)

        return updated_task

    async def change_priority(
        self,
        project_id: int,
        task_id: int,
        new_priority: str,
        user_id: int,
    ) -> Task:

        task = await self._get_task_for_project(
            project_id=project_id,
            task_id=task_id,
            user_id=user_id,
        )

        old_priority = task.priority

        if new_priority == old_priority:
            raise ValueError(f"Task already has {old_priority} priority")

        updated_task = await self.task_repository.update(
            task=task,
            priority=new_priority,
        )

        # Log activity
        await self.activity_repository.create(
            task_id=task.id,
            user_id=user_id,
            action="PRIORITY_CHANGED",
            detail=f"Priority changed from {old_priority} to {new_priority}",
        )

        await self.session.commit()
        await self.session.refresh(updated_task)

        return updated_task