from fastapi import FastAPI

from app.api.v1.users import router as user_router
from app.api.v1.projects import router as project_router


app = FastAPI()

app.include_router(
    user_router,
    prefix="/users",
    tags=["users"]
)

app.include_router(project_router)