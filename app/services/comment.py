from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment
from app.repositories.activity import ActivityRepository
from app.repositories.comment import CommentRepository
from app.repositories.project import ProjectRepository
from app.repositories.project_member import ProjectMemberRepository
from app.repositories.task import TaskRepository
from app.schemas.comment import CommentCreate, CommentUpdate


class CommentService:

    def __init__(
        self,
        session: AsyncSession,
    ):
        self.session = session

        self.comment_repository = CommentRepository(session)
        self.task_repository = TaskRepository(session)
        self.project_repository = ProjectRepository(session)
        self.project_member_repository = ProjectMemberRepository(session)
        self.activity_repository = ActivityRepository(session)

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

    async def _get_task_or_raise(
        self,
        project_id: int,
        task_id: int,
    ):
        """Get a task and verify it belongs to the project."""

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

    async def create_comment(
        self,
        project_id: int,
        task_id: int,
        comment_data: CommentCreate,
        user_id: int,
    ) -> Comment:

        # Check project access
        await self._check_project_access(
            project_id=project_id,
            user_id=user_id,
        )

        # Verify task exists and belongs to project
        task = await self._get_task_or_raise(
            project_id=project_id,
            task_id=task_id,
        )

        # Create comment with author auto-set from authenticated user
        comment = await self.comment_repository.create(
            content=comment_data.content,
            task_id=task_id,
            author_id=user_id,
        )

        # Log activity
        await self.activity_repository.create(
            task_id=task_id,
            user_id=user_id,
            action="COMMENT_ADDED",
            detail=f"Comment added on task '{task.title}'",
        )

        await self.session.commit()

        await self.session.refresh(comment)

        return comment

    async def get_comments_for_task(
        self,
        project_id: int,
        task_id: int,
        user_id: int,
    ) -> list[Comment]:

        # Check project access
        await self._check_project_access(
            project_id=project_id,
            user_id=user_id,
        )

        # Verify task exists and belongs to project
        await self._get_task_or_raise(
            project_id=project_id,
            task_id=task_id,
        )

        return await self.comment_repository.get_all_by_task_id(
            task_id=task_id,
        )

    async def get_comment_by_id(
        self,
        project_id: int,
        task_id: int,
        comment_id: int,
        user_id: int,
    ) -> Comment:

        # Check project access
        await self._check_project_access(
            project_id=project_id,
            user_id=user_id,
        )

        # Verify task exists and belongs to project
        await self._get_task_or_raise(
            project_id=project_id,
            task_id=task_id,
        )

        comment = await self.comment_repository.get_by_id(
            comment_id=comment_id,
        )

        if comment is None:
            raise ValueError("Comment not found")

        if comment.task_id != task_id:
            raise ValueError(
                "Comment does not belong to this task"
            )

        return comment

    async def update_comment(
        self,
        project_id: int,
        task_id: int,
        comment_id: int,
        comment_data: CommentUpdate,
        user_id: int,
    ) -> Comment:

        # Check project access
        await self._check_project_access(
            project_id=project_id,
            user_id=user_id,
        )

        # Verify task exists and belongs to project
        await self._get_task_or_raise(
            project_id=project_id,
            task_id=task_id,
        )

        comment = await self.comment_repository.get_by_id(
            comment_id=comment_id,
        )

        if comment is None:
            raise ValueError("Comment not found")

        if comment.task_id != task_id:
            raise ValueError(
                "Comment does not belong to this task"
            )

        # Only the author can update their comment
        if comment.author_id != user_id:
            raise PermissionError(
                "You can only edit your own comments"
            )

        updated_comment = await self.comment_repository.update(
            comment=comment,
            content=comment_data.content,
        )

        await self.session.commit()

        await self.session.refresh(updated_comment)

        return updated_comment

    async def delete_comment(
        self,
        project_id: int,
        task_id: int,
        comment_id: int,
        user_id: int,
    ) -> None:

        # Check project access
        await self._check_project_access(
            project_id=project_id,
            user_id=user_id,
        )

        # Verify task exists and belongs to project
        await self._get_task_or_raise(
            project_id=project_id,
            task_id=task_id,
        )

        comment = await self.comment_repository.get_by_id(
            comment_id=comment_id,
        )

        if comment is None:
            raise ValueError("Comment not found")

        if comment.task_id != task_id:
            raise ValueError(
                "Comment does not belong to this task"
            )

        # Only the author can delete their comment
        if comment.author_id != user_id:
            raise PermissionError(
                "You can only delete your own comments"
            )

        await self.comment_repository.delete(
            comment=comment,
        )

        await self.session.commit()
