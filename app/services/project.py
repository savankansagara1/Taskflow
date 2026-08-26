from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.repositories.project import ProjectRepository
# from app.repositories.user import UserRepository
from app.schemas.project import ProjectCreate,ProjectUpdate


class ProjectService:

    def __init__(self, session: AsyncSession):
        # self.user_repository = UserRepository(session)
        self.project_repository = ProjectRepository(session)
        self.session = session

    async def create_project(
          self,
          project_data : ProjectCreate,
          owner_id :int,
    ) -> Project:

       project = await self.project_repository.create(
          name=project_data.name,
          description=project_data.description,
          owner_id=owner_id,
       )
       await self.session.commit()

       return project
    
    
    async def get_project_by_id(
        self,
        project_id:int,
        owner_id:int,
    ) -> Project:
        
        project = await self.project_repository.get_by_id(
            project_id=project_id
        )
        
        if project is None:
            raise ValueError("Project not found")

        if project.owner_id != owner_id:
           raise PermissionError("You do not have permission to access this project")
        
        return project
    
    
    async def get_all_projects(
     self,
     owner_id: int,
    )-> list[Project]:

     project = await self.project_repository.get_by_owner_id(owner_id=owner_id)

     return project
 

    async def update_project(
        self,
        project_id: int,
        project_data: ProjectUpdate,
        owner_id: int,
    ) -> Project:

        # 1. Check whether the project exists
        project = await self.project_repository.get_by_id(
            project_id=project_id,
        )

        if project is None:
            raise ValueError("Project not found")

        # 2. Check whether the current user owns the project
        if project.owner_id != owner_id:
            raise PermissionError(
                "You are not allowed to update this project"
            )

        # 3. Get only fields actually sent by the client
        update_data = project_data.model_dump(
            exclude_unset=True,
        )

        # 4. Prevent empty PATCH request
        if not update_data:
            raise ValueError(
                "At least one field must be provided for update"
            )

        # 5. Update through repository
        updated_project = await self.project_repository.update(
            project=project,
            name=update_data.get("name"),
            description=update_data.get("description"),
        )

        # 6. Save transaction
        await self.session.commit()

        # 7. Refresh after commit
        await self.session.refresh(updated_project)

        return updated_project

    
    async def delete_project(
     self,
     project_id: int,
     owner_id: int,
    ) -> None:

     project = await self.  project_repository.get_by_id(
        project_id=project_id,
    )
     print(project)

     if project is None:
        raise ValueError("Project not found")

     if project.owner_id != owner_id:
        raise PermissionError(
            "You are not allowed to delete this project"
        )

     await self.project_repository.  delete(
        project=project,
    )

     await self.session.commit() 