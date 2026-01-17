from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, users, workouts

app = FastAPI(title="AI Fitness Trainer")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(workouts.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Fitness Trainer API"}
