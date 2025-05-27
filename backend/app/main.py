from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.chat import router as chat_router, chat_manager

app = FastAPI(
    title="PPM - Program Pathways Mapper API",
    description="University Course Advisor Assistant API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])

@app.get("/")
async def root():
    return {"message": "PPM - Program Pathways Mapper API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    chat_manager.close_all_chats()