from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers.chat import router as chat_router, chat_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    chat_manager.close_all_chats()

app = FastAPI(
    title="PPM - Program Pathways Mapper API v2",
    description="University Course Advisor Assistant API with Structured Information Extraction",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])

@app.get("/")
async def root():
    return {
        "message": "PPM - Program Pathways Mapper API v2",
        "version": "2.0.0",
        "description": "Structured information extraction with Instructor + Weaviate"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ppm-backend-v2"}