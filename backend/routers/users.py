from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth
from database import get_db
from .auth import oauth2_scheme
from jose import JWTError, jwt

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

def get_current_user(db: Session = Depends(get_db)):
    # DEV MODE: Bypass authentication
    # Return the first user in the database
    user = db.query(models.User).first()
    if not user:
        # Create a dummy user if none exists
        # This ensures the app works even with an empty DB
        hashed_password = auth.get_password_hash("password")
        user = models.User(
            email="dev@example.com",
            hashed_password=hashed_password,
            full_name="Developer",
            is_verified=True,
            subscription_tier="premium"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.delete("/me")
def delete_user(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(current_user)
    db.commit()
    return {"message": "User deleted successfully"}
