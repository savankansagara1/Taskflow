from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )

    payload = {
        "sub": str(user_id),
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    
    
def decode_access_token(token: str) -> int:
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=["HS256"],
    )

    user_id = payload.get("sub")

    if user_id is None:
        raise ValueError("Invalid token")

    return int(user_id)    