from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    height = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)
    blood_group = Column(String, nullable=True)
    subscription_tier = Column(String, default="free") # free, pro, premium
    transaction_id = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    workouts = relationship("Workout", back_populates="user", cascade="all, delete-orphan")

class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    exercise_type = Column(String, nullable=False)
    reps = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0.0)
    calories = Column(Float, default=0.0)  # Calories burned during the workout
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Store summary stats or specific details if needed
    details = Column(JSON, nullable=True)

    user = relationship("User", back_populates="workouts")
    events = relationship("WorkoutEvent", back_populates="workout", cascade="all, delete-orphan")

class WorkoutEvent(Base):
    __tablename__ = "workout_events"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"))
    event_type = Column(String, nullable=False) # e.g., "repetition", "posture_error"
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    data = Column(JSON, nullable=True) # e.g., {"error": "Back too arched", "angle": 170}

    workout = relationship("Workout", back_populates="events")
