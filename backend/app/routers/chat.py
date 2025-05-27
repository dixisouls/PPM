from fastapi import APIRouter, HTTPException, status
from typing import List
import logging
from app.models import (
    ChatSessionResponse,
    MessageRequest,
    MessageResponse,
    ConversationHistoryResponse,
    ConversationHistory,
    CollectedInfoResponse,
    CollectedInfo,
    SearchRequest,
    SearchResponse,
    SimilarConversation,
    CompletionStatus,
    ErrorResponse
)
from app.services.ollama_service import OllamaChatManager

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Global chat manager instance
chat_manager = OllamaChatManager()

# Export chat_manager for main.py to access for shutdown
__all__ = ["router", "chat_manager"]


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session():
    """Create a new chat session"""
    try:
        result = chat_manager.create_chat_session()
        logger.info(f"Created new chat session: {result['chat_id']}")
        return ChatSessionResponse(**result)
    except Exception as e:
        logger.error(f"Error creating chat session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat session: {str(e)}"
        )


@router.post("/sessions/{chat_id}/messages", response_model=MessageResponse)
async def send_message(chat_id: str, request: MessageRequest):
    """Send a message to a specific chat session"""
    try:
        response, is_cached = chat_manager.send_message_to_chat(chat_id, request.message)
        logger.info(f"Message sent to chat {chat_id}, cached: {is_cached}")

        return MessageResponse(
            response=response,
            chat_id=chat_id,
            is_cached=is_cached
        )
    except Exception as e:
        logger.error(f"Error sending message to chat {chat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )


@router.get("/sessions/{chat_id}/messages", response_model=ConversationHistoryResponse)
async def get_conversation_history(chat_id: str):
    """Get conversation history for a specific chat session"""
    try:
        conversations = chat_manager.get_chat_history(chat_id)
        logger.info(f"Retrieved {len(conversations)} conversations for chat {chat_id}")

        conversation_objects = [
            ConversationHistory(**conv) for conv in conversations
        ]

        return ConversationHistoryResponse(
            chat_id=chat_id,
            conversations=conversation_objects
        )
    except Exception as e:
        logger.error(f"Error getting conversation history for chat {chat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get conversation history: {str(e)}"
        )


@router.get("/sessions/{chat_id}/info", response_model=CollectedInfoResponse)
async def get_collected_info(chat_id: str):
    """Get collected information for a specific chat session"""
    try:
        collected_info = chat_manager.get_collected_info(chat_id)
        completion_status = chat_manager.get_completion_status(chat_id)

        logger.info(f"Retrieved collected info for chat {chat_id}")

        return CollectedInfoResponse(
            chat_id=chat_id,
            collected_info=CollectedInfo(**collected_info),
            is_complete=completion_status["is_complete"]
        )
    except Exception as e:
        logger.error(f"Error getting collected info for chat {chat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get collected information: {str(e)}"
        )


@router.post("/sessions/{chat_id}/search", response_model=SearchResponse)
async def search_similar_conversations(chat_id: str, request: SearchRequest):
    """Search for similar conversations within a specific chat session"""
    try:
        results = chat_manager.search_similar_conversations(
            chat_id, request.query, request.limit
        )
        logger.info(f"Search found {len(results)} similar conversations for chat {chat_id}")

        similar_conversations = [
            SimilarConversation(**result) for result in results
        ]

        return SearchResponse(
            chat_id=chat_id,
            query=request.query,
            results=similar_conversations
        )
    except Exception as e:
        logger.error(f"Error searching conversations for chat {chat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search conversations: {str(e)}"
        )


@router.get("/sessions/{chat_id}/completion", response_model=CompletionStatus)
async def get_completion_status(chat_id: str):
    """Get completion status for information collection in a specific chat session"""
    try:
        status_info = chat_manager.get_completion_status(chat_id)
        logger.info(f"Retrieved completion status for chat {chat_id}")

        return CompletionStatus(
            chat_id=chat_id,
            **status_info
        )
    except Exception as e:
        logger.error(f"Error getting completion status for chat {chat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get completion status: {str(e)}"
        )


@router.delete("/sessions/{chat_id}")
async def close_chat_session(chat_id: str):
    """Close a specific chat session"""
    try:
        chat_manager.close_chat(chat_id)
        logger.info(f"Closed chat session {chat_id}")
        return {"message": f"Chat session {chat_id} closed successfully"}
    except Exception as e:
        logger.error(f"Error closing chat session {chat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to close chat session: {str(e)}"
        )


@router.get("/sessions/{chat_id}/status")
async def get_chat_status(chat_id: str):
    """Get general status of a chat session"""
    try:
        collected_info = chat_manager.get_collected_info(chat_id)
        completion_status = chat_manager.get_completion_status(chat_id)
        conversation_count = len(chat_manager.get_chat_history(chat_id))

        return {
            "chat_id": chat_id,
            "conversation_count": conversation_count,
            "collected_info": collected_info,
            "is_complete": completion_status["is_complete"],
            "collected_count": completion_status["collected_count"],
            "total_required": completion_status["total_required"],
            "next_field": completion_status["next_field"]
        }
    except Exception as e:
        logger.error(f"Error getting chat status for {chat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat status: {str(e)}"
        )

# Note: Cleanup should be handled at the app level in main.py