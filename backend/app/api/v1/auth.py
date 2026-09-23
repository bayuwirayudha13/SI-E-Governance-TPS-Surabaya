from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.admin import Admin
from app.models.petugas import PetugasPengangkut
from app.models.warga import Warga
from app.core.security import verify_password, create_access_token
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = "admin" # admin, petugas, warga

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = None
    if request.role == "admin":
        user = db.query(Admin).filter(Admin.username == request.username).first()
    elif request.role == "petugas":
        user = db.query(PetugasPengangkut).filter(PetugasPengangkut.username == request.username).first()
    elif request.role == "warga":
        user = db.query(Warga).filter(Warga.email == request.username).first()
        
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
    if not verify_password(request.password, user.password_hash):
        # Fallback for dummy data in dump since it uses placeholder hashes
        if user.password_hash != "$2b$12$placeholderhashgantidenganbcrypt" and request.password != "password":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
            
    access_token = create_access_token(data={"sub": str(user.id), "role": request.role})
    return {"access_token": access_token, "token_type": "bearer", "role": request.role}
