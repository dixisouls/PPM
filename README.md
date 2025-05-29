# PPM - Program Pathways Mapper

A conversational AI application that collects university course information from
students through an intelligent chat interface. The system automatically gathers
four key pieces of information: two university names and their corresponding
courses, then provides course equivalency analysis.

## Overview

PPM uses a modern full-stack architecture with AI-powered conversation
management:

- **Frontend**: React-based chat interface with real-time messaging
- **Backend**: FastAPI server with intelligent conversation handling
- **AI Engine**: Ollama with Gemma 3 model for natural language processing
- **Vector Database**: Weaviate for conversation similarity search and caching
- **Containerization**: Docker Compose for easy deployment

## How It Works

1. **Chat Session Creation**: Each user gets a unique chat session for tracking
   their conversation
2. **Information Collection**: The AI assistant systematically collects:
   - First university name (U1)
   - First university course (C1)
   - Second university name (U2)
   - Second university course (C2)
3. **Smart Caching**: Similar conversations are cached using vector search to
   provide faster responses
4. **Data Persistence**: All conversations and collected information are stored
   for analysis
5. **Course Analysis**: Once complete, the system prepares the data for course
   equivalency analysis

## Prerequisites

Before running the application, ensure you have:

- **Docker** and **Docker Compose** installed
- **Ollama** installed locally with the `gemma3:4b` model and `nomic-embed-text` embedding model.

### Setting up Ollama

1. Install Ollama from [https://ollama.ai](https://ollama.ai)
2. Pull the required model:
   ```bash
   ollama pull gemma3:4b
   ```
3. Pull the required embedding model:
    ```bash
    ollama pull nomic-embed-text
    ```
4. Verify Ollama is running:
   ```bash
   ollama list
   ```

## Quick Start

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd PPM
   ```

2. **Start the services**:

   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Weaviate Console: http://localhost:8080/v1

## Docker Compose Services

The application runs four main services:

### Weaviate (Vector Database)

- **Port**: 8080
- **Purpose**: Stores conversation history and enables similarity search
- **Persistence**: Data persists in `weaviate_data` volume

### Backend (FastAPI)

- **Port**: 8000
- **Purpose**: API server handling chat logic and AI integration
- **Dependencies**: Connects to Weaviate and external Ollama service
- **Health Check**: Automated health monitoring

### Frontend (React)

- **Port**: 3000
- **Purpose**: User interface for chat interactions
- **Build**: Multi-stage Docker build with Nginx serving

### Volumes

- `weaviate_data`: Persistent storage for conversation data
- `collected_info`: Stored collected information files

## Usage

1. **Start a conversation**: Open http://localhost:3000 and begin chatting
2. **Provide information**: The assistant will guide you through providing:
   - Your current university name
   - Your current course name
   - Your target university name
   - Your target course name
3. **Review and confirm**: The system will summarize your information for
   confirmation
4. **Get results**: Your information is saved for course equivalency analysis

## Development

### Running Individual Components

**Backend only**:

```bash
cd backend
uvicorn app.main:app --reload
```

**Frontend only**:

```bash
cd frontend
npm start
```

### Environment Variables

Key environment variables (configured in docker-compose.yml):

- `OLLAMA_URL`: URL for Ollama service (default:
  http://host.docker.internal:11434)
- `WEAVIATE_URL`: URL for Weaviate service (default: http://weaviate:8080)
- `PYTHONPATH`: Python path configuration

### API Endpoints

- `POST /api/chat/sessions` - Create new chat session
- `POST /api/chat/sessions/{chat_id}/messages` - Send message
- `GET /api/chat/sessions/{chat_id}/info` - Get collected information
- `GET /api/chat/sessions/{chat_id}/completion` - Check completion status

## Troubleshooting

### Common Issues

1. **Ollama Connection Error**:

   - Ensure Ollama is running: `ollama serve`
   - Check if the model is available: `ollama list`
   - Verify port 11434 is accessible

2. **Weaviate Connection Issues**:

   - Check if Weaviate container is running: `docker-compose ps`
   - Restart Weaviate: `docker-compose restart weaviate`

3. **Frontend Not Loading**:
   - Check if backend is responding: `curl http://localhost:8000/health`
   - Verify all containers are running: `docker-compose ps`

### Logs

View service logs:

```bash
docker-compose logs -f [service-name]
# Examples:
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f weaviate
```

## Data Storage

- **Conversation History**: Stored in Weaviate vector database
- **Collected Information**: Saved as JSON files in `collected_info` volume
- **Chat Sessions**: Managed in-memory with database persistence

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Backend   │───▶│   Ollama    │
│   (React)   │    │  (FastAPI)  │    │  (LLM AI)   │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │  Weaviate   │
                   │ (Vector DB) │
                   └─────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `docker-compose up`
5. Submit a pull request

## License

This project is licensed under the MIT License.
