from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity


class ActivityRepository:

    def __init__(
        self,
        session: AsyncSession,
    ):
        self.session = session

    async def create(
        self,
        task_id: int,
        user_id: int,
        action: str,
        detail: str | None = None,
    ) -> Activity:

        activity = Activity(
            task_id=task_id,
            user_id=user_id,
            action=action,
            detail=detail,
        )

        self.session.add(activity)

        await self.session.flush()
        await self.session.refresh(activity)

        return activity

    async def get_all_by_task_id(
        self,
        task_id: int,
    ) -> list[Activity]:

        result = await self.session.execute(
            select(Activity)
            .where(Activity.task_id == task_id)
            .order_by(Activity.created_at.desc())
        )

        return list(result.scalars().all())
