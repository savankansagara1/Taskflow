from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    
class UserLogin(BaseModel):
    email: str
    password: str     

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    model_config = {
        "from_attributes": True
    }

class UserUpdate(BaseModel):
    username: str | None = None
    email: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ForgotPasswordVerify(BaseModel):
    email: str
    otp: str


class ForgotPasswordReset(BaseModel):
    email: str
    otp: str
    new_password: str