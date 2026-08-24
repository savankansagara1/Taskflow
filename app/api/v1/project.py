# from fastapi import APIRouter, Depends
# from sqlalchemy.ext.asyncio import AsyncSession

# from app.core.database import get_db
# from app.schemas.project import ProjectCreate, ProjectResponse
# from app.services.project import ProjectService

# from app.api.dependencies import get_current_user
# from app.models.user import User
# import inspect

# router = APIRouter(
#     prefix="/projects",
#     tags=["Projects"],
# )

# @router.post(
#     "",
#     response_model=ProjectResponse,
# )
# async def create_project(
#     project_data: ProjectCreate,
#     current_user: User = Depends(get_current_user),
#     session: AsyncSession = Depends(get_db),
# ):
#     service = ProjectService(session)
#     print(inspect.signature(service.create_project))
#     print(inspect.getsource(service.create_project))

#     return await service.create_project(
#         project_data=project_data,
#         owner_id=current_user.id,
#     )




