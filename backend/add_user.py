from database import SessionLocal
import models
import auth

db = SessionLocal()

email = "abhinavthaj623@gmail.com"
password = "a"

# Check if user already exists
existing_user = db.query(models.User).filter(models.User.email == email).first()
if existing_user:
    print(f"User {email} already exists.")
else:
    print(f"Creating user {email}...")
    hashed_password = auth.get_password_hash(password)
    user = models.User(
        email=email,
        hashed_password=hashed_password,
        full_name="Abhinav",
        is_verified=True,
        subscription_tier="premium", # Defaulting to premium for dev
        height=175,
        weight=70,
        blood_group="O+"
    )
    db.add(user)
    db.commit()
    print(f"User {email} created successfully!")

db.close()
