# PPM FastAPI Backend

Production-ready FastAPI backend for the Program Pathways Mapper (PPM) application. Features advanced **structured information extraction** using Instructor, **vector search** with Weaviate, and **intelligent conversation management**.

## 🚀 Key Features

### Core Capabilities
- **Structured Information Extraction**: Uses [Instructor](https://python.useinstructor.com/) with Pydantic models for reliable data parsing
- **Vector Search**: Powered by Weaviate with `nomic-embed-text` embeddings for conversation similarity
- **Chat Session Management**: Multi-session support with conversation history and persistence
- **Smart Caching**: Automatic response caching based on conversation similarity
- **Health Monitoring**: Comprehensive health checks and structured logging

### Information Collection
Systematically collects four pieces of student information:
- **u1**: First university name
- **c1**: First university course  
- **u2**: Second university name
- **c2**: Second university course

### AI Integration
- **LLM**: Qwen3 4B model via Ollama for natural language processing
- **Embeddings**: Nomic Embed Text for vector similarity search
- **Confidence Scoring**: Extraction confidence validation for data quality

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Routes    │───▶│   Services      │───▶│   Ollama LLM    │
│   (FastAPI)     │    │   (Business)    │    │   (qwen3:4b)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Pydantic      │    │   Weaviate      │
│   (Validation)  │    │   (Vector DB)   │
└─────────────────┘    └─────────────────┘
```

## 📦 Installation

### Prerequisites
```bash
# Python 3.11+
python --version

# Install Ollama and required models
ollama pull qwen3:4b
ollama pull nomic-embed-text
ollama serve  # Should run on localhost:11434

# Weaviate (via Docker recommended)
docker run -d \
  --name weaviate \
  -p 8080:8080 \
  -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
  -e PERSISTENCE_DATA_PATH=/var/lib/weaviate \
  -e ENABLE_MODULES=text2vec-ollama \
  cr.weaviate.io/semitechnologies/weaviate:1.30.4
```

### Local Development Setup
```bash
# Clone and navigate
cd backend

# Create virtual environment (best practice)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Set environment variables
export WEAVIATE_URL=http://localhost:8080
export OLLAMA_URL=http://localhost:11434
export PYTHONPATH=$(pwd)

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker Development
```bash
# Build local image
docker build -t ppm-backend:dev .

# Run with docker-compose (recommended)
cd ..  # Back to root
docker-compose up backend -d
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
WEAVIATE_URL=http://localhost:8080      # Weaviate connection
OLLAMA_URL=http://localhost:11434       # Ollama API endpoint
PYTHONPATH=/app                         # Python module path

# Optional  
LOG_LEVEL=INFO                          # Logging level
HEALTH_CHECK_INTERVAL=30               # Health check frequency
```

### Production Configuration
```python
# app/config.py (if needed)
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    weaviate_url: str = "http://localhost:8080"
    ollama_url: str = "http://localhost:11434"
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
```

## 📁 Project Structure

```
backend/
├── README.md                    # This documentation
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Container configuration
├── docker-compose.yml          # Local development compose
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry
│   ├── models.py               # Pydantic data models
│   ├── routers/
│   │   ├── __init__.py
│   │   └── chat.py            # Chat API endpoints
│   └── services/
│       ├── __init__.py
│       ├── ollama_service.py   # LLM integration & chat logic
│       └── weaviate_service.py # Vector database operations
├── collected_info/             # Output directory (auto-created)
└── tests/                      # Unit tests (recommended)
    ├── __init__.py
    ├── test_chat.py
    └── test_extraction.py
```

## 🌐 API Documentation

### Core Endpoints

#### Chat Sessions
```python
# Create new chat session
POST /api/chat/sessions
Response: {
    "chat_id": "uuid",
    "created_at": "2024-01-01T00:00:00Z",
    "message": "Welcome message"
}

# Close chat session  
DELETE /api/chat/sessions/{chat_id}
Response: {"message": "Session closed"}

# Get session status
GET /api/chat/sessions/{chat_id}/status
Response: {
    "chat_id": "uuid",
    "conversation_count": 5,
    "collected_info": {...},
    "is_complete": false,
    "next_field": "First university name"
}
```

#### Messaging
```python
# Send message
POST /api/chat/sessions/{chat_id}/messages
Body: {"message": "San Francisco State University"}
Response: {
    "response": "Great! Now tell me your course name.",
    "chat_id": "uuid", 
    "is_cached": false,
    "collected_info": {"u1": "San Francisco State University"},
    "is_complete": false
}

# Get conversation history
GET /api/chat/sessions/{chat_id}/messages
Response: {
    "chat_id": "uuid",
    "conversations": [...]
}
```

#### Information & Search
```python
# Get collected information
GET /api/chat/sessions/{chat_id}/info
Response: {
    "chat_id": "uuid",
    "collected_info": {
        "u1": "SFSU",
        "c1": "Computer Science", 
        "u2": null,
        "c2": null
    },
    "is_complete": false
}

# Search similar conversations
POST /api/chat/sessions/{chat_id}/search  
Body: {"query": "computer science", "limit": 3}
Response: {
    "results": [{"user_input": "...", "distance": 0.1}]
}
```

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## 🧪 Development Practices

### Code Quality Standards
```bash
# Install development dependencies
pip install black isort flake8 mypy pytest

# Format code (recommended)
black app/
isort app/

# Lint code
flake8 app/
mypy app/

# Run tests
pytest tests/ -v
```

### Testing
```python
# tests/test_chat.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_session():
    response = client.post("/api/chat/sessions")
    assert response.status_code == 200
    assert "chat_id" in response.json()

def test_send_message():
    # Create session first
    session_resp = client.post("/api/chat/sessions")
    chat_id = session_resp.json()["chat_id"]
    
    # Send message
    response = client.post(
        f"/api/chat/sessions/{chat_id}/messages",
        json={"message": "Stanford University"}
    )
    assert response.status_code == 200
    assert "response" in response.json()
```

### Logging Best Practices
```python
# Use structured logging
import logging

logger = logging.getLogger(__name__)

# In your code
logger.info(f"Created chat session: {chat_id}")
logger.error(f"Extraction failed: {error}", extra={"chat_id": chat_id})
```

## 🔍 Monitoring & Debugging

### Health Checks
```bash
# Application health
curl http://localhost:8000/health
# Expected: {"status": "healthy", "service": "ppm-backend-v3"}

# Detailed status check
curl http://localhost:8000/api/chat/sessions/{chat_id}/status
```

### Logging
```bash
# View application logs
docker-compose logs -f backend

# Filter for errors
docker-compose logs backend | grep ERROR

# Live tail in development
uvicorn app.main:app --reload --log-level debug
```

### Performance Monitoring
```python
# Add to main.py for production
import time
from fastapi import Request

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

## 🐛 Troubleshooting

### Common Issues

**Ollama Connection Failed**
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve

# Verify models
ollama list
# Should show: qwen3:4b, nomic-embed-text
```

**Weaviate Connection Issues** 
```bash
# Check Weaviate health
curl http://localhost:8080/v1/meta

# Restart Weaviate container
docker restart weaviate

# Check logs
docker logs weaviate
```

**Module Import Errors**
```bash
# Ensure PYTHONPATH is set
export PYTHONPATH=/path/to/backend
# or in Docker: PYTHONPATH=/app

# Verify Python path
python -c "import sys; print(sys.path)"
```

**Permission Errors**
```bash
# Create directories with proper permissions
mkdir -p collected_info
chmod 755 collected_info

# Fix in Docker
RUN chown -R appuser:appuser /app
```

### Development Debugging
```python
# Add to ollama_service.py for debugging
import logging
logging.basicConfig(level=logging.DEBUG)

# Enable debug mode
uvicorn app.main:app --reload --log-level debug

# Use pdb for step debugging
import pdb; pdb.set_trace()
```

## 🚀 Production Deployment

### Docker Production
```bash
# Build production image
docker build -t dixisouls/ppm-backend-v3:latest .

# Push to registry
docker push dixisouls/ppm-backend-v3:latest

# Deploy with compose
docker-compose -f docker-compose.prod.yml up -d
```

### Performance Optimization
```python
# main.py production settings
app = FastAPI(
    title="PPM Backend",
    docs_url=None,  # Disable docs in production
    redoc_url=None,
    debug=False
)

# Add proper CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)
```

### Environment-Specific Configs
```bash
# Production environment variables
WEAVIATE_URL=http://weaviate:8080
OLLAMA_URL=http://host.docker.internal:11434
LOG_LEVEL=WARNING
PYTHONPATH=/app
```

## 📊 Performance Metrics

### Expected Performance
- **Response Time**: < 2s for typical chat responses
- **Extraction Accuracy**: > 95% confidence on clear inputs
- **Vector Search**: < 100ms for similarity queries
- **Concurrent Users**: 50+ with proper resource allocation

### Optimization Tips
- Use connection pooling for Weaviate
- Implement response caching for common queries
- Add database indexing for conversation lookup
- Monitor memory usage with large chat histories

## 🔄 Version History

- **v3.0**: Structured extraction with Instructor, enhanced reliability
- **v2.0**: Weaviate integration, vector search capabilities  
- **v1.0**: Basic chat functionality with pattern matching

## 📞 Support

For backend-specific issues:
1. Check logs: `docker-compose logs backend`
2. Verify dependencies: Ollama models, Weaviate connection
3. Review API documentation: http://localhost:8000/docs
4. Check environment variables and Python path

---

**Developed by**: [dixisouls](https://github.com/dixisouls)  
**Backend Version**: 3.0 - Production Ready