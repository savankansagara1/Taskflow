# import asyncio

# from app.core.database import async_session
# from app.schemas.project import ProjectCreate
# from app.services.project import ProjectService


# async def main():
#     async with async_session() as session:

#         service = ProjectService(session)

#         project_data = ProjectCreate(
#             name="Service Test Project",
#             owner_id=2,
#         )

#         project = await service.create_project(
#             project_data=project_data,
#         )

#         print(f"Project created: {project.name}")
#         print(f"Owner ID: {project.owner_id}")


# asyncio.run(main())


import asyncio

from app.core.database import async_session
from app.services.project import ProjectService
from app.repositories.project import ProjectRepository
from app.repositories.user import UserRepository

async def main():
    async with async_session() as session:

        repository = UserRepository(session)

        user = await repository.get_by_id_with_projects(
            user_id=2,
        )

        if user is not None:
            print(f"User: {user.username}")

            for project in user.projects:
                print(
                    f"Project ID: {project.id} | "
                    f"Name: {project.name}"
                )

        else:
            print("User not found")
        

if __name__ == "__main__":
    asyncio.set_event_loop_policy(
        asyncio.WindowsSelectorEventLoopPolicy()
    )

    asyncio.run(main())