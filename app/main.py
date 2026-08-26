from fastapi import APIRouter, FastAPI

from app.api.v1.users import router as user_router
from app.api.v1.projects import router as project_router
from app.api.v1.task import router as task_router
from app.api.v1.comments import router as comment_router
from app.api.v1.activities import router as activity_router


app = FastAPI(
    title="TaskFlow API",
    version="1.0.0",
)

# Group all v1 routes under /api/v1
api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(user_router)
api_v1_router.include_router(project_router)
api_v1_router.include_router(task_router)
api_v1_router.include_router(comment_router)
api_v1_router.include_router(activity_router)

app.include_router(api_v1_router)
