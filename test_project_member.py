import asyncio

from app.core.database import async_session
from app.services.project_member import ProjectMemberService


async def main():
    async with async_session() as db:
        service = ProjectMemberService(db)

        project_member = await service.add_member(
            project_id=46,
            user_id=9,
            owner_id=10
        )

        print("Project Member Created")
        print("ID:", project_member.id)
        print("Project ID:", project_member.project_id)
        print("User ID:", project_member.user_id)


asyncio.run(main())