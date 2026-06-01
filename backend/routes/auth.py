from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import UserCreate, User, UserLogin, UserResponse
from utils.auth import get_password_hash, verify_password, create_access_token
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Dependency to get database
async def get_db():
    from server import db
    return db

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_dict = user_data.model_dump(exclude={"password"})
    user_dict["password_hash"] = get_password_hash(user_data.password)
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = str(result.inserted_id)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data.email, "role": user_data.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_dict["_id"],
            "email": user_dict["email"],
            "full_name": user_dict["full_name"],
            "role": user_dict["role"]
        }
    }

@router.post("/login", response_model=dict)
async def login(credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db.users.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if user.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active"
        )
    
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }