# PPM - Program Pathways Mapper

A modern conversational AI application that collects university course information from students through an intelligent chat interface. The system systematically gathers four key pieces of information and provides course equivalency analysis using advanced AI and vector search capabilities.

## 🚀 Overview

PPM uses a production-ready full-stack architecture with AI-powered conversation management:

- **Frontend**: React-based chat interface with real-time messaging and animations
- **Backend**: FastAPI server with structured information extraction using Instructor
- **AI Engine**: Ollama with Qwen3 4B model for natural language processing  
- **Vector Database**: Weaviate for conversation similarity search and intelligent caching
- **Containerization**: Docker Compose for seamless deployment

## 🎯 How It Works

1. **Session Creation**: Each user gets a unique chat session with conversation tracking
2. **Structured Collection**: AI assistant systematically collects:
   - First university name (u1)
   - First university course (c1)
   - Second university name (u2)
   - Second university course (c2)
3. **Intelligent Caching**: Similar conversations are cached using vector similarity search
4. **Data Persistence**: All conversations and extracted information are stored
5. **Real-time Progress**: Live progress tracking with animated UI components

## 📋 Prerequisites

### Required Dependencies

- **Docker** and **Docker Compose** (latest versions)
- **Ollama** installed locally with required models

### Ollama Setup

```bash
# Install Ollama from https://ollama.ai
# Pull required models
ollama pull qwen3:4b
ollama pull nomic-embed-text

# Verify installation
ollama list
ollama serve  # Ensure running on port 11434
```

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/dixisouls/PPM.git
cd PPM
```

### 2. Start Services
```bash
# Start all services with pre-built images
docker-compose up -d

# Check service status
docker-compose ps
```

### 3. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Weaviate Console**: http://localhost:8080/v1

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │───▶│   FastAPI       │───▶│   Ollama        │
│   (Port 3000)   │    │   (Port 8000)   │    │   (Port 11434)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Weaviate      │
                    │   (Port 8080)   │
                    └─────────────────┘
```

## 🐳 Docker Services

### Weaviate (Vector Database)
- **Image**: `cr.weaviate.io/semitechnologies/weaviate:1.30.4`
- **Ports**: 8080, 50051
- **Purpose**: Conversation storage and vector similarity search
- **Persistence**: `weaviate_data` volume

### Backend (FastAPI)
- **Image**: `dixisouls/ppm-backend-v3:latest`
- **Port**: 8000
- **Features**: Structured extraction, chat management, health monitoring
- **Dependencies**: Weaviate, Ollama

### Frontend (React)
- **Image**: `dixisouls/ppm-frontend:latest` 
- **Port**: 3000
- **Features**: Real-time chat, progress tracking, animations
- **Build**: Optimized production build with Nginx

## 📊 API Endpoints

### Chat Management
```
POST   /api/chat/sessions              # Create new session
DELETE /api/chat/sessions/{chat_id}    # Close session
GET    /api/chat/sessions/{chat_id}/status  # Get session status
```

### Messaging
```
POST   /api/chat/sessions/{chat_id}/messages     # Send message
GET    /api/chat/sessions/{chat_id}/messages     # Get history
```

### Data Collection
```
GET    /api/chat/sessions/{chat_id}/info         # Get collected info
GET    /api/chat/sessions/{chat_id}/completion   # Check completion
POST   /api/chat/sessions/{chat_id}/search       # Search similar
```

## 🔧 Development

### Local Development Setup

**Backend Development**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend Development**:
```bash
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

### Environment Variables

```bash
# Backend
WEAVIATE_URL=http://localhost:8080
OLLAMA_URL=http://localhost:11434
PYTHONPATH=/app

# Frontend  
REACT_APP_API_URL=http://localhost:8000
```

## 📁 Project Structure

```
PPM/
├── README.md                    # This file
├── docker-compose.yml          # Production orchestration
├── backend/
│   ├── README.md               # Backend documentation
│   ├── app/
│   │   ├── main.py            # FastAPI application
│   │   ├── models.py          # Pydantic data models
│   │   ├── routers/           # API route handlers
│   │   └── services/          # Business logic services
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile            # Backend container config
├── frontend/
│   ├── README.md              # Frontend documentation
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API integration
│   │   └── utils/            # Helper utilities
│   ├── package.json          # Node.js dependencies
│   └── Dockerfile           # Frontend container config
└── volumes/
    ├── weaviate_data/        # Vector database storage
    └── collected_info/       # Extracted information files
```

## 🛠️ Troubleshooting

### Common Issues

**Ollama Connection Error**:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama service
ollama serve
```

**Container Issues**:
```bash
# Check container logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f weaviate

# Restart specific service
docker-compose restart backend
```

**Model Issues**:
```bash
# Verify models are available
ollama list

# Re-pull if needed
ollama pull qwen3:4b
ollama pull nomic-embed-text
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health  
curl http://localhost:3000/health

# Weaviate health
curl http://localhost:8080/v1/meta
```

## 🔄 Production Deployment

### Pre-built Images
The application uses optimized production images:
- `dixisouls/ppm-backend-v3:latest` - FastAPI backend
- `dixisouls/ppm-frontend:latest` - React frontend with Nginx

### Scaling Considerations
- Backend supports horizontal scaling
- Weaviate provides high-availability configurations
- Frontend is stateless and CDN-ready

## 📝 Usage Flow

1. **Start Chat**: User clicks "Start Chat" on landing page
2. **Information Collection**: AI guides through systematic data collection
3. **Progress Tracking**: Real-time progress shown in sidebar
4. **Smart Responses**: Vector search provides intelligent cached responses
5. **Completion**: All information collected and saved for analysis

## 🚦 Environment Status

- ✅ **Production Ready**: Full containerization with health checks
- ✅ **AI Powered**: Advanced language model integration
- ✅ **Vector Search**: Intelligent conversation similarity matching
- ✅ **Modern UI**: React with animations and responsive design
- ✅ **Type Safe**: Full TypeScript/Pydantic validation

## 📞 Support

- **Backend Issues**: Check `backend/README.md` for detailed setup
- **Frontend Issues**: Check `frontend/README.md` for development guide
- **Docker Issues**: Verify all prerequisites are installed
- **AI Model Issues**: Ensure Ollama is running with required models

## 📄 License

MIT License - See LICENSE file for details.

---

**Developed by**: [dixisouls](https://github.com/dixisouls)
**Version**: 3.0.0 - Production Ready with Structured Extraction