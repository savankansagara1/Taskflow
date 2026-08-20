from fastapi import FastAPI

from app.api.v1.users import router as user_router

app = FastAPI()

app.include_router(
    user_router,
    prefix="/users",
    tags=["users"]
)