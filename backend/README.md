# PPM FastAPI Backend v2

Enhanced backend for the Program Pathways Mapper (PPM) application with **Instructor-based structured information extraction** and **Weaviate vector search**.

## 🚀 New Features (v2)

- **Structured Information Extraction**: Uses [Instructor](https://python.useinstructor.com/) with Pydantic models for reliable data extraction
- **Enhanced Accuracy**: Confidence-based extraction with validation
- **Vector Search**: Powered by Weaviate with `nomic-embed-text` embeddings
- **Improved Context**: Better conversation history management
- **Production Ready**: Enhanced error handling and logging

## 📋 Features

- **Chat Sessions**: Create and manage multiple chat sessions
- **Structured Collection**: Automatically collect 4 pieces of information:
  - First university name (u1)
  - First university course (c1) 
  - Second university name (u2)
  - Second university course (c2)
- **Vector Search**: Search for similar conversations using Weaviate
- **Conversation History**: Store and retrieve conversation history
- **Smart Caching**: Cache similar responses for better performance
- **Confidence Scoring**: Extraction confidence validation

## 🛠 Prerequisites

1. **Ollama**: Running locally on port 11434 with required models
2. **Weaviate**: Running on port 8080 (use docker-compose)
3. **Python 3.11+**

### Required Ollama Models

```bash
ollama pull gemma3:4b
ollama pull nomic-embed-text
```

## 📦 Installation

1. **Navigate to the backend directory**:
```bash
cd backend
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Set environment variables**:
```bash
export WEAVIATE_URL=http://localhost:8080
export OLLAMA_URL=http://localhost:11434
```

## 🚀 Running the Server


### Option 1: Using uvicorn directly
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 2: Using Docker
```bash
# Build the image
docker build -t dixisouls/ppm-backend-v2:latest .

# Run with docker-compose
docker-compose up backend -d
```

## 🌐 API Endpoints

### Chat Sessions
- `POST /api/chat/sessions` - Create a new chat session
- `DELETE /api/chat/sessions/{chat_id}` - Close a chat session
- `GET /api/chat/sessions/{chat_id}/status` - Get chat status

### Messages
- `POST /api/chat/sessions/{chat_id}/messages` - Send a message to a chat
- `GET /api/chat/sessions/{chat_id}/messages` - Get conversation history

### Information Collection
- `GET /api/chat/sessions/{chat_id}/info` - Get collected information
- `GET /api/chat/sessions/{chat_id}/completion` - Get completion status

### Search
- `POST /api/chat/sessions/{chat_id}/search` - Search similar conversations

## 📚 API Documentation

Once the server is running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## ⚙️ Configuration

The application uses these default configurations:
- **Ollama Model**: `gemma3:4b` (for chat responses)
- **Embedding Model**: `nomic-embed-text` (for vector search)
- **Ollama URL**: `http://localhost:11434`
- **Weaviate URL**: `http://localhost:8080`
- **FastAPI Port**: `8000`

## 📁 Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── models.py              # Pydantic models for requests/responses
├── requirements.txt       # Python dependencies
├── run_server.py         # Development server startup script
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker services configuration
├── routers/
│   ├── __init__.py
│   └── chat.py           # Chat-related API endpoints
├── services/
│   ├── __init__.py
│   ├── ollama_service.py  # Structured chat logic with Instructor
│   └── weaviate_service.py # Weaviate database operations
└── collected_info/       # Saved information files (auto-created)
```

## 🔧 Usage Example

### 1. Create a new chat session
```bash
curl -X POST http://localhost:8000/api/chat/sessions
```

### 2. Send a message
```bash
curl -X POST http://localhost:8000/api/chat/sessions/{chat_id}/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "SFSU"}'
```

### 3. Get collected information
```bash
curl http://localhost:8000/api/chat/sessions/{chat_id}/info
```

### 4. Check completion status
```bash
curl http://localhost:8000/api/chat/sessions/{chat_id}/completion
```

## 🆚 Improvements over v1

| Feature | v1 (Original) | v2 (Enhanced) |
|---------|---------------|---------------|
| Information Extraction | Manual pattern matching | Instructor + Pydantic models |
| Confidence Scoring | None | Built-in confidence validation |
| Data Validation | Basic string checks | Structured Pydantic validation |
| Context Management | Simple message history | Enhanced context with recent history |
| Error Handling | Basic try-catch | Comprehensive error handling |
| Logging | Minimal | Structured logging with levels |
| Type Safety | Limited | Full type hints with Pydantic |

## 🐛 Troubleshooting

### Common Issues

1. **Ollama connection failed**
   ```bash
   # Check if Ollama is running
   curl http://localhost:11434/api/tags
   
   # Start Ollama if not running
   ollama serve
   ```

2. **Missing models**
   ```bash
   # Install required models
   ollama pull gemma3:4b
   ollama pull nomic-embed-text
   ```

3. **Weaviate connection failed**
   ```bash
   # Start Weaviate with docker-compose
   docker-compose up weaviate -d
   
   # Check Weaviate status
   curl http://localhost:8080/v1/meta
   ```

4. **Permission errors on collected_info directory**
   ```bash
   # Create directory with proper permissions
   mkdir -p collected_info
   chmod 755 collected_info
   ```

## 🔄 Migration from v1

The v2 backend maintains API compatibility with v1, so the frontend requires no changes. However, v2 provides:

- Better extraction accuracy
- Improved conversation understanding
- Enhanced error handling
- More reliable information collection

## 🏗 Development

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Environment Variables
```bash
# Development
export WEAVIATE_URL=http://localhost:8080
export OLLAMA_URL=http://localhost:11434
export PYTHONPATH=/path/to/backend

# Production
export WEAVIATE_URL=http://weaviate:8080
export OLLAMA_URL=http://host.docker.internal:11434
```

## 📊 Monitoring

The application provides structured logging for monitoring:

- **Info Level**: Normal operation, chat creation, message processing
- **Error Level**: Failures, connection issues, extraction errors
- **Debug Level**: Detailed extraction results, confidence scores

---

**Note**: This is v2 of the PPM backend, enhanced with Instructor-based structured extraction for improved accuracy and reliability in information collection.