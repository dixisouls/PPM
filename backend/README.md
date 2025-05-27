# PPM FastAPI Backend

This is the FastAPI backend for the Program Pathways Mapper (PPM) application. It provides a chat-based API for collecting university course information from students.

## Features

- **Chat Sessions**: Create and manage multiple chat sessions
- **Information Collection**: Automatically collect 4 pieces of information:
  - First university name (U1)
  - First university course (C1)
  - Second university name (U2)
  - Second university course (C2)
- **Vector Search**: Search for similar conversations using Weaviate
- **Conversation History**: Store and retrieve conversation history
- **Caching**: Cache similar responses for better performance

## Prerequisites

1. **Ollama**: Make sure Ollama is running locally on port 11434 with the `gemma3:4b` model
2. **Weaviate**: Make sure Weaviate is running (use the docker-compose.yml in the parent directory)
3. **Python 3.11+**

## Installation

1. Navigate to the backend/app directory:
```bash
cd backend/app
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

### Option 1: Using the run script
```bash
python run_server.py
```

### Option 2: Using uvicorn directly
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 3: Using Docker
```bash
docker build -t ppm-backend .
docker run -p 8000:8000 ppm-backend
```

## API Endpoints

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

## API Documentation

Once the server is running, you can access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Configuration

The application uses the following default configurations:
- **Ollama Model**: `gemma3:4b`
- **Ollama URL**: `http://localhost:11434`
- **Weaviate URL**: `http://localhost:8080`
- **FastAPI Port**: `8000`

## Project Structure

```
backend/app/
├── main.py                 # FastAPI application entry point
├── models.py              # Pydantic models for requests/responses
├── requirements.txt       # Python dependencies
├── run_server.py         # Server startup script
├── Dockerfile            # Docker configuration
├── routers/
│   ├── __init__.py
│   └── chat.py           # Chat-related API endpoints
└── services/
    ├── __init__.py
    ├── ollama_service.py  # Ollama chat logic
    └── weaviate_service.py # Weaviate database operations
```

## Usage Example

1. Create a new chat session:
```bash
curl -X POST http://localhost:8000/api/chat/sessions
```

2. Send a message:
```bash
curl -X POST http://localhost:8000/api/chat/sessions/{chat_id}/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "SFSU"}'
```

3. Get collected information:
```bash
curl http://localhost:8000/api/chat/sessions/{chat_id}/info
```

## Notes

- The application maintains the exact same functionality as the original `ollama_test.py` and `weaviate_client.py` files
- Each chat session automatically tracks the collection of the 4 required pieces of information
- The system uses vector search to find similar conversations and provide cached responses when appropriate
- All conversation data is stored in Weaviate for persistence and search capabilities