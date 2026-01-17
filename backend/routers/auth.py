from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from fastapi.responses import HTMLResponse
import models, schemas, auth
from database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

import resend

# Initialize Resend with your API Key
# You can get one at https://resend.com
resend.api_key = "re_hrT3JNUB_sywS6pwmuLUxPj3iiTXDyHTr" # Replace with your actual Resend API Key

def send_verification_email(user: models.User):
    admin_email = "cocp31669@gmail.com"
    verify_link = f"http://192.168.1.7:8000/auth/verify/{user.id}"
    
    try:
        print(f"--- ATTEMPTING TO SEND EMAIL TO {admin_email} ---")
        params = {
            "from": "FitAI <onboarding@resend.dev>",
            "to": [admin_email],
            "subject": f"Action Required: Verify New User - {user.full_name}",
            "html": f"""
            <html>
              <body style="font-family: sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; border: 1px solid #ddd;">
                  <h2 style="color: #333;">New User Registration</h2>
                  <p>A new user has registered and is waiting for payment verification.</p>
                  <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Name:</strong> {user.full_name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Tier:</strong> <span style="text-transform: uppercase; font-weight: bold;">{user.subscription_tier}</span></p>
                    <p><strong>Transaction ID:</strong> {user.transaction_id}</p>
                  </div>
                  <a href="{verify_link}" style="display: inline-block; background: #000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify & Activate User</a>
                </div>
              </body>
            </html>
            """,
        }

        email_response = resend.Emails.send(params)
        print(f"--- RESEND SUCCESS: {email_response} ---")
    except Exception as e:
        print(f"--- RESEND ERROR: {str(e)} ---")
        # Fallback to console print if Resend fails
        print(f"--- FALLBACK: VERIFICATION LINK ---")
        print(f"Link: {verify_link}")
        print("--- END FALLBACK ---")

@router.post("/register", response_model=schemas.UserWithToken)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email, 
        hashed_password=hashed_password, 
        full_name=user.full_name,
        height=user.height,
        weight=user.weight,
        blood_group=user.blood_group,
        subscription_tier=user.subscription_tier,
        transaction_id=user.transaction_id,
        is_verified=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # send_verification_email(db_user)
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    return {
        "user": db_user,
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/verify/{user_id}")
def verify_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_verified = True
    db.commit()
    
    return HTMLResponse(content=f"""
        <html>
            <head>
                <title>Verification Successful</title>
                <style>
                    body {{ font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff; margin: 0; }}
                    .card {{ background: #111; padding: 3rem; border-radius: 1.5rem; border: 1px solid #333; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }}
                    h1 {{ color: #4ade80; font-size: 2.5rem; margin-bottom: 1rem; }}
                    p {{ color: #888; font-size: 1.1rem; line-height: 1.6; }}
                    .user-info {{ background: #1a1a1a; padding: 1rem; border-radius: 0.75rem; margin: 1.5rem 0; border: 1px solid #222; }}
                    .tier {{ display: inline-block; padding: 0.25rem 0.75rem; border-radius: 99px; background: #333; color: #fff; font-size: 0.8rem; text-transform: uppercase; font-weight: bold; margin-top: 0.5rem; }}
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>User Verified!</h1>
                    <p>The transaction has been confirmed and the account is now active.</p>
                    <div class="user-info">
                        <div style="font-weight: bold; font-size: 1.2rem;">{user.full_name}</div>
                        <div style="color: #666;">{user.email}</div>
                        <div class="tier">{user.subscription_tier}</div>
                    </div>
                    <p>The user can now access their dashboard.</p>
                </div>
            </body>
        </html>
    """)

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
