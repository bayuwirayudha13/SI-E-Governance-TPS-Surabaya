from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, DateTime, Integer, func, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel, ConfigDict
from typing import Optional
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os
from dotenv import load_dotenv
from auth.routes import router as auth_router
from core.database import engine, SessionLocal, Base, get_db
from auth.otp import generate_otp, save_otp
from services.email_service import send_otp_email
from routes.tps_routes import router as tps_router
from routes.wilayah_routes import router as wilayah_router
from routes.laporan_routes import router as laporan_router
from routes.setoran_routes import router as setoran_router
from routes.jadwal_routes import router as jadwal_router
from routes.admin_routes import router as admin_router
# Import models untuk registrasi
from models.warga import Warga
from models.tps import TPS
from models.wilayah import Kecamatan, Kelurahan
from models.users import User
from models.laporan import LaporanWarga
from models.setoran import SetoranSampah
from models.jadwal import JadwalPengambilan

load_dotenv()

# Config
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Setup
app = FastAPI(title="SampahPintar API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database
Base.metadata.create_all(bind=engine)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Schemas
class RegisterRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    email: str
    password: str
    full_name: str

class LoginRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    email: str
    password: str
    username: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    nama: str
    total_poin: int
    created_at: datetime | None = None

# Utilities
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(Warga).filter(Warga.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Routes
@app.get("/")
def root():
    return {"message": "SampahPintar API - Connected to MySQL"}


@app.post("/api/auth/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    try:
        # Check if user exists
        existing_user = db.query(Warga).filter(
            Warga.email == request.email
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email sudah terdaftar"
            )

        # Hash password
        hashed_password = get_password_hash(request.password)

        # Create user
        user = Warga(
            email=request.email,
            password_hash=hashed_password,
            nama=request.full_name,
            email_verified=0
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        # Generate OTP
        otp = generate_otp()

        # Save OTP
        save_otp(
            user.email,
            otp
        )

        # Send OTP
        try:
            send_otp_email(
                user.email,
                otp
            )

        except Exception as e:
            db.delete(user)
            db.commit()

            raise HTTPException(
                status_code=500,
                detail=f"Gagal mengirim OTP: {str(e)}"
            )

        return {
            "message": "Registrasi berhasil. OTP telah dikirim ke email.",
            "email": user.email
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Error register: {str(e)}"
        )

@app.post("/api/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    try:
        login_id = request.email or request.username
        if not login_id:
            raise HTTPException(status_code=400, detail="Email atau username wajib diisi")

        # Cek di tabel users (admin, petugas, driver, superadmin)
        user = db.query(User).filter(
            (User.email == login_id) | (User.username == login_id)
        ).first()
        
        if user and verify_password(request.password, user.hashed_password):
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": user.email, "role": user.role},
                expires_delta=access_token_expires
            )
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.nama_lengkap,
                    "role": user.role
                }
            }

        # Fallback: cek Warga (Email)
        warga = db.query(Warga).filter(Warga.email == login_id).first()
        if warga and verify_password(request.password, warga.password_hash):
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": warga.email, "role": "warga"},
                expires_delta=access_token_expires
            )
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": warga.id,
                    "email": warga.email,
                    "full_name": warga.nama,
                    "role": "warga",
                    "total_poin": warga.total_poin
                }
            }

        raise HTTPException(status_code=401, detail="Email/Username atau password salah")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error login: {str(e)}")

from fastapi import Header

@app.get("/api/auth/me")
def get_me(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    user = get_current_user(token, db)
    return user

@app.post("/api/auth/logout")
def logout():
    return {"message": "Logged out successfully"}

app.include_router(auth_router, prefix="/api")
app.include_router(tps_router, prefix="/api")
app.include_router(wilayah_router, prefix="/api")
app.include_router(laporan_router, prefix="/api")
app.include_router(setoran_router, prefix="/api")
app.include_router(jadwal_router, prefix="/api")
app.include_router(admin_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)