from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChatSessionResponse(BaseModel):
    chat_id: str
    created_at: str
    message: str

class MessageRequest(BaseModel):
    message: str

class MessageResponse(BaseModel):
    response: str
    chat_id: str
    is_cached: bool = False

class ConversationHistory(BaseModel):
    id: str
    chat_id: str
    human_response: str
    assistant_response: str
    timestamp: str

class ConversationHistoryResponse(BaseModel):
    chat_id: str
    conversations: List[ConversationHistory]

class CollectedInfo(BaseModel):
    U1: Optional[str] = None  # First university name
    C1: Optional[str] = None  # First university course
    U2: Optional[str] = None  # Second university name
    C2: Optional[str] = None  # Second university course

class CollectedInfoResponse(BaseModel):
    chat_id: str
    collected_info: CollectedInfo
    is_complete: bool

class SearchRequest(BaseModel):
    query: str
    limit: int = 1

class SimilarConversation(BaseModel):
    id: str
    chat_id: str
    human_response: str
    assistant_response: str
    timestamp: str
    distance: float

class SearchResponse(BaseModel):
    chat_id: str
    query: str
    results: List[SimilarConversation]

class CompletionStatus(BaseModel):
    chat_id: str
    is_complete: bool
    collected_count: int
    total_required: int
    next_field: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
    detail: str