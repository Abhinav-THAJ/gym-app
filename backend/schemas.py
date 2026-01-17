from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    blood_group: Optional[str] = None
    subscription_tier: Optional[str] = "free"
    transaction_id: Optional[str] = None
    is_verified: Optional[bool] = False

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Workout Schemas
class WorkoutBase(BaseModel):
    exercise_type: str
    reps: int
    duration_seconds: float
    calories: Optional[float] = 0.0
    details: Optional[Any] = None

class WorkoutCreate(WorkoutBase):
    pass

class Workout(WorkoutBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserWithToken(BaseModel):
    user: User
    access_token: str
    token_type: str
