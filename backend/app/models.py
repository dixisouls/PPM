from pydantic import BaseModel, Field
from typing import Optional, List


# Request Models
class MessageRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User message content")


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Search query")
    limit: int = Field(default=1, ge=1, le=10, description="Maximum number of results")


# Core Data Models
class CollectedInfo(BaseModel):
    u1: Optional[str] = Field(None, description="First university name")
    c1: Optional[str] = Field(None, description="First university course")
    u2: Optional[str] = Field(None, description="Second university name")
    c2: Optional[str] = Field(None, description="Second university course")

    def is_complete(self) -> bool:
        return all([self.u1, self.c1, self.u2, self.c2])

    def get_next_field(self) -> Optional[str]:
        field_names = {
            "u1": "First university name",
            "c1": "First university course",
            "u2": "Second university name",
            "c2": "Second university course"
        }

        if not self.u1:
            return field_names["u1"]
        elif not self.c1:
            return field_names["c1"]
        elif not self.u2:
            return field_names["u2"]
        elif not self.c2:
            return field_names["c2"]
        return None


class ConversationHistory(BaseModel):
    id: str = Field(..., description="Conversation ID")
    chat_id: str = Field(..., description="Chat session ID")
    user_input: str = Field(..., description="User message")
    assistant_response: str = Field(..., description="Assistant response")
    timestamp: str = Field(..., description="Conversation timestamp")


class SimilarConversation(BaseModel):
    user_input: str = Field(..., description="Similar user input")
    assistant_response: str = Field(..., description="Assistant response")
    timestamp: str = Field(..., description="Conversation timestamp")
    distance: float = Field(..., description="Similarity distance")


# Response Models
class ChatSessionResponse(BaseModel):
    chat_id: str = Field(..., description="Unique chat session ID")
    created_at: str = Field(..., description="Session creation timestamp")
    message: str = Field(..., description="Initial assistant message")


class MessageResponse(BaseModel):
    response: str = Field(..., description="Assistant response")
    chat_id: str = Field(..., description="Chat session ID")
    is_cached: bool = Field(default=False, description="Whether response was cached")
    collected_info: CollectedInfo = Field(..., description="Current collected information")
    is_complete: bool = Field(..., description="Whether all information is collected")


class ConversationHistoryResponse(BaseModel):
    chat_id: str = Field(..., description="Chat session ID")
    conversations: List[ConversationHistory] = Field(..., description="List of conversations")


class CollectedInfoResponse(BaseModel):
    chat_id: str = Field(..., description="Chat session ID")
    collected_info: CollectedInfo = Field(..., description="Collected information")
    is_complete: bool = Field(..., description="Whether collection is complete")


class CompletionStatus(BaseModel):
    chat_id: str = Field(..., description="Chat session ID")
    is_complete: bool = Field(..., description="Whether collection is complete")
    collected_count: int = Field(..., description="Number of fields collected")
    total_required: int = Field(default=4, description="Total fields required")
    next_field: Optional[str] = Field(None, description="Next field to collect")


class SearchResponse(BaseModel):
    chat_id: str = Field(..., description="Chat session ID")
    query: str = Field(..., description="Search query")
    results: List[SimilarConversation] = Field(..., description="Similar conversations")


class ChatStatusResponse(BaseModel):
    chat_id: str = Field(..., description="Chat session ID")
    conversation_count: int = Field(..., description="Number of conversations")
    collected_info: CollectedInfo = Field(..., description="Current collected information")
    is_complete: bool = Field(..., description="Whether collection is complete")
    collected_count: int = Field(..., description="Number of fields collected")
    total_required: int = Field(default=4, description="Total fields required")
    next_field: Optional[str] = Field(None, description="Next field to collect")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error type")
    detail: str = Field(..., description="Error details")