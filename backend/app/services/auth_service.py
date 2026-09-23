from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token, verify_token

def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password) or not user.is_active:
        return None
    return user

def create_tokens(user: User) -> dict:
    data = {"sub": str(user.id), "role": user.role.value}
    return {
        "access_token": create_access_token(data),
        "refresh_token": create_refresh_token(data),
        "token_type": "bearer",
    }

def refresh_access_token(refresh_token: str) -> dict | None:
    payload = verify_token(refresh_token, token_type="refresh")
    if payload is None:
        return None
    data = {"sub": payload.get("sub"), "role": payload.get("role")}
    return {"access_token": create_access_token(data), "token_type": "bearer"}
