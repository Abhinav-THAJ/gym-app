from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any
from datetime import datetime, timedelta
import calendar

import models, schemas
from database import get_db
from .users import get_current_user

router = APIRouter(
    prefix="/workouts",
    tags=["workouts"]
)

@router.post("/", response_model=schemas.Workout)
def create_workout(workout: schemas.WorkoutCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_workout = models.Workout(**workout.dict(), user_id=current_user.id)
    db.add(db_workout)
    db.commit()
    db.refresh(db_workout)
    return db_workout

@router.get("/", response_model=List[schemas.Workout])
def read_workouts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workouts = db.query(models.Workout).filter(models.Workout.user_id == current_user.id).order_by(desc(models.Workout.timestamp)).offset(skip).limit(limit).all()
    return workouts

@router.get("/stats", response_model=Dict[str, Any])
def get_workout_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Total stats
    total_workouts = db.query(models.Workout).filter(models.Workout.user_id == current_user.id).count()
    
    total_reps = db.query(func.sum(models.Workout.reps)).filter(models.Workout.user_id == current_user.id).scalar() or 0
    
    total_duration = db.query(func.sum(models.Workout.duration_seconds)).filter(models.Workout.user_id == current_user.id).scalar() or 0.0
    
    total_calories = db.query(func.sum(models.Workout.calories)).filter(models.Workout.user_id == current_user.id).scalar() or 0.0

    # Today's stats
    today = datetime.now().date()
    start_of_day = datetime.combine(today, datetime.min.time())
    
    today_reps = db.query(func.sum(models.Workout.reps)).filter(
        models.Workout.user_id == current_user.id,
        models.Workout.timestamp >= start_of_day
    ).scalar() or 0
    
    today_duration = db.query(func.sum(models.Workout.duration_seconds)).filter(
        models.Workout.user_id == current_user.id,
        models.Workout.timestamp >= start_of_day
    ).scalar() or 0.0

    today_calories = db.query(func.sum(models.Workout.calories)).filter(
        models.Workout.user_id == current_user.id,
        models.Workout.timestamp >= start_of_day
    ).scalar() or 0.0

    # Streak Calculation
    # Get all unique dates with workouts for this user, ordered by date desc
    dates_query = db.query(func.date(models.Workout.timestamp)).filter(
        models.Workout.user_id == current_user.id
    ).group_by(func.date(models.Workout.timestamp)).order_by(desc(func.date(models.Workout.timestamp))).all()
    
    workout_dates = [d[0] for d in dates_query]
    
    streak = 0
    if workout_dates:
        # Check if the most recent workout was today or yesterday to keep streak alive
        last_workout_date = workout_dates[0]
        if last_workout_date == today or last_workout_date == (today - timedelta(days=1)):
            streak = 1
            # Check previous days
            current_check_date = last_workout_date
            for i in range(1, len(workout_dates)):
                prev_date = workout_dates[i]
                if prev_date == (current_check_date - timedelta(days=1)):
                    streak += 1
                    current_check_date = prev_date
                else:
                    break
        else:
            streak = 0

    return {
        "total_workouts": total_workouts,
        "total_reps": total_reps,
        "total_duration": total_duration,
        "total_calories": total_calories,
        "today_reps": today_reps,
        "today_duration": today_duration,
        "today_calories": today_calories,
        "streak": streak
    }

@router.get("/weekly", response_model=List[Dict[str, Any]])
def get_weekly_activity(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    today = datetime.now().date()
    start_of_week = today - timedelta(days=6) # Last 7 days including today
    
    weekly_data = []
    
    for i in range(7):
        day = start_of_week + timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        
        day_name = day.strftime("%a") # Mon, Tue, etc.
        
        # Exercise duration for the day
        duration = db.query(func.sum(models.Workout.duration_seconds)).filter(
            models.Workout.user_id == current_user.id,
            models.Workout.timestamp >= day_start,
            models.Workout.timestamp <= day_end
        ).scalar() or 0.0
        
        # Move (reps) for the day
        reps = db.query(func.sum(models.Workout.reps)).filter(
            models.Workout.user_id == current_user.id,
            models.Workout.timestamp >= day_start,
            models.Workout.timestamp <= day_end
        ).scalar() or 0
        
        # Calories for the day
        calories = db.query(func.sum(models.Workout.calories)).filter(
            models.Workout.user_id == current_user.id,
            models.Workout.timestamp >= day_start,
            models.Workout.timestamp <= day_end
        ).scalar() or 0.0
        
        weekly_data.append({
            "day": day_name,
            "date": day.isoformat(),
            "exercise_min": int(duration / 60),
            "move_reps": reps,
            "calories": round(calories, 1)
        })
        
    return weekly_data

@router.get("/challenge", response_model=Dict[str, Any])
def get_monthly_challenge(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    today = datetime.now().date()
    current_month = today.month
    
    # Different challenges based on the month
    challenges = [
        {"title": "Perfect Week", "description": "Work out for 7 days in a row to earn this badge.", "type": "streak_days", "target": 7, "unit": "days"},
        {"title": "Rep Master", "description": "Complete 500 total reps this week.", "type": "total_reps", "target": 500, "unit": "reps"},
        {"title": "Calorie Crusher", "description": "Burn 1000 calories this week.", "type": "total_calories", "target": 1000, "unit": "kcal"},
        {"title": "Workout Warrior", "description": "Complete 10 workout sessions this week.", "type": "total_workouts", "target": 10, "unit": "sessions"},
        {"title": "Endurance King", "description": "Exercise for 120 minutes this week.", "type": "total_duration", "target": 120, "unit": "min"},
    ]
    
    # Select challenge based on month (rotates through challenges)
    challenge = challenges[current_month % len(challenges)]
    
    # Calculate progress based on challenge type
    start_of_week = today - timedelta(days=6)
    start_of_week_dt = datetime.combine(start_of_week, datetime.min.time())
    
    progress = 0
    
    if challenge["type"] == "streak_days":
        # Count active days in last 7 days
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day, datetime.max.time())
            
            count = db.query(models.Workout).filter(
                models.Workout.user_id == current_user.id,
                models.Workout.timestamp >= day_start,
                models.Workout.timestamp <= day_end
            ).count()
            
            if count > 0:
                progress += 1
                
    elif challenge["type"] == "total_reps":
        progress = db.query(func.sum(models.Workout.reps)).filter(
            models.Workout.user_id == current_user.id,
            models.Workout.timestamp >= start_of_week_dt
        ).scalar() or 0
        
    elif challenge["type"] == "total_calories":
        progress = db.query(func.sum(models.Workout.calories)).filter(
            models.Workout.user_id == current_user.id,
            models.Workout.timestamp >= start_of_week_dt
        ).scalar() or 0.0
        progress = round(progress, 0)
        
    elif challenge["type"] == "total_workouts":
        progress = db.query(models.Workout).filter(
            models.Workout.user_id == current_user.id,
            models.Workout.timestamp >= start_of_week_dt
        ).count()
        
    elif challenge["type"] == "total_duration":
        duration = db.query(func.sum(models.Workout.duration_seconds)).filter(
            models.Workout.user_id == current_user.id,
            models.Workout.timestamp >= start_of_week_dt
        ).scalar() or 0.0
        progress = int(duration / 60)  # Convert to minutes
    
    # Check if challenge is completed
    is_completed = progress >= challenge["target"]
    
    return {
        "title": challenge["title"],
        "description": challenge["description"],
        "progress": int(progress),
        "target": challenge["target"],
        "unit": challenge["unit"],
        "is_completed": is_completed,
        "type": challenge["type"]
    }

