import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field
from openai import OpenAI
import instructor

from app.models import CollectedInfo
from app.services.weaviate_service import WeaviateVectorDB


class InformationUpdate(BaseModel):
    """Model for extracting new information from user input"""
    new_university: Optional[str] = Field(
        None, description="New university name mentioned"
    )
    new_course: Optional[str] = Field(
        None, description="New course name mentioned"
    )
    field_to_update: Optional[str] = Field(
        None, description="Which field should be updated: u1, c1, u2, or c2"
    )
    confidence: float = Field(
        description="Confidence level 0-1 that information was extracted correctly"
    )


class StructuredOllamaChat:
    """Enhanced chat class with structured information extraction"""

    def __init__(self):
        # Get Ollama URL from environment
        ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")

        print(f"Initializing Ollama client with URL: {ollama_url}")

        # Setup instructor client with Ollama
        self.client = instructor.from_openai(
            OpenAI(
                base_url=f"{ollama_url}/v1",
                api_key="ollama",
            ),
            mode=instructor.Mode.JSON,
        )

        self.model = "gemma3:4b"
        self.chat_id = str(uuid.uuid4())
        self.collected_info = CollectedInfo()
        self.created_at = datetime.now().isoformat()

        # Initialize Weaviate DB
        self.db = WeaviateVectorDB()

        # Chat history for context
        self.chat_history = []

        # Field mappings
        self.field_names = {
            "u1": "First University name",
            "c1": "First University course",
            "u2": "Second University name",
            "c2": "Second University course",
        }

        print(f"🤖 Initialized StructuredOllamaChat - ID: {self.chat_id}")

    def initialize_chat(self, chat_id: str) -> Dict:
        """Initialize a new chat session"""
        self.chat_id = chat_id
        self.created_at = datetime.now().isoformat()
        self.chat_history = []
        self.collected_info = CollectedInfo()

        initial_message = (
            "Hi! I need to collect information about two universities and courses "
            "you're interested in. Let's start with the name of your first university."
        )

        # Add initial message to history
        self._add_to_history("assistant", initial_message)

        return {
            "chat_id": self.chat_id,
            "created_at": self.created_at,
            "message": initial_message
        }

    def load_chat_session(self, chat_id: str) -> bool:
        """Load an existing chat session"""
        try:
            self.chat_id = chat_id

            # Try to load existing collected info from file
            try:
                os.makedirs("/app/collected_info", exist_ok=True)
                with open(f"/app/collected_info/collected_info_{chat_id}.json", "r") as f:
                    data = json.load(f)
                    info_data = data.get("collected_info", {})
                    self.collected_info = CollectedInfo(**info_data)
                    self.created_at = data.get("created_at", datetime.now().isoformat())
            except FileNotFoundError:
                # If no saved file, start fresh
                self.collected_info = CollectedInfo()
                self.created_at = datetime.now().isoformat()

            self.chat_history = []
            print(f"📂 Loaded chat session: {chat_id}")
            return True
        except Exception as e:
            print(f"❌ Error loading chat session: {e}")
            return False

    def _add_to_history(self, role: str, content: str):
        """Add message to chat history"""
        self.chat_history.append({"role": role, "content": content})

        # Keep only last 20 messages to avoid context getting too long
        if len(self.chat_history) > 20:
            self.chat_history = self.chat_history[-20:]

    def _get_recent_history(self, last_n: int = 6) -> List[Dict]:
        """Get recent chat history for context"""
        return self.chat_history[-last_n:] if self.chat_history else []

    def _extract_information(self, user_message: str) -> InformationUpdate:
        """Extract information using instructor"""
        current_state = self.collected_info.model_dump()
        next_field = self.collected_info.get_next_field()

        if self.collected_info.is_complete():
            return InformationUpdate(confidence=0.0)

        # Determine what field we're looking for
        next_field_key = None
        if not self.collected_info.u1:
            next_field_key = "u1"
        elif not self.collected_info.c1:
            next_field_key = "c1"
        elif not self.collected_info.u2:
            next_field_key = "u2"
        elif not self.collected_info.c2:
            next_field_key = "c2"

        if not next_field_key:
            return InformationUpdate(confidence=0.0)

        prompt = f"""
        Analyze this user message for information: "{user_message}"

        Current collected information:
        - First university (u1): {current_state['u1'] or 'Not collected'}
        - First course (c1): {current_state['c1'] or 'Not collected'}
        - Second university (u2): {current_state['u2'] or 'Not collected'}
        - Second course (c2): {current_state['c2'] or 'Not collected'}

        Next field needed: {next_field_key} ({self.field_names.get(next_field_key, 'unknown')})

        IMPORTANT RULES:
        - If looking for a COURSE: Extract any academic subject, major, program, or field of study mentioned
        - If looking for a UNIVERSITY: Extract any college, university, or institution name mentioned
        - Set confidence HIGH (0.8+) if information is clearly present
        - Set field_to_update to: {next_field_key}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_model=InformationUpdate,
                temperature=0.1,
            )
            return response
        except Exception as e:
            print(f"❌ Extraction error: {e}")
            return InformationUpdate(confidence=0.0)

    def _get_response_message(self, user_message: str) -> str:
        """Get natural language response"""
        next_field = self.collected_info.get_next_field()

        context = f"""
        Your only task is to collect the information needed. Do not ask for anything else except for the four pieces of information below.

        IMPORTANT: Do not make assumptions about the user's information or intent.
        IMPORTANT: After all information is collected, summarize it and say "We will get back to you soon."
        IMPORTANT: If the user asks for the summary, provide it in a concise format.
        IMPORTANT: After all information is collected, do not answer any other questions. Just summarize the collected information and say "We will get back to you soon."
        IMPORTANT: Except for the information below, do not ask for any other information at all.

        Only collect one piece of information at a time.

        Currently collected:
        - First university: {self.collected_info.u1 or 'Still needed'}
        - First course: {self.collected_info.c1 or 'Still needed'}
        - Second university: {self.collected_info.u2 or 'Still needed'}
        - Second course: {self.collected_info.c2 or 'Still needed'}

        Next information needed: {next_field or 'All information collected'}

        IMPORTANT: Let the user know what information you need next.
        If one piece of information is missing, ask for that piece only and don't make assumptions about the user's information or intent.
        """

        try:
            # Build messages with chat history for context
            messages = [{"role": "system", "content": context}]

            # Add recent chat history
            recent_history = self._get_recent_history()
            messages.extend(recent_history)

            # Add current user message
            messages.append({"role": "user", "content": user_message})

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                response_model=None,
                temperature=0.9,
                top_p=0.8,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"I'm having trouble responding: {e}"

    def send_message(self, user_message: str) -> Dict:
        """Process message and return structured response"""
        # Add user message to history
        self._add_to_history("user", user_message)

        # Extract information if not complete
        if not self.collected_info.is_complete():
            extraction = self._extract_information(user_message)

            if (
                    extraction.new_university is None
                    and extraction.new_course is None
                    and not self.collected_info.is_complete()
            ):
                user_message = "Invalid input by the user, ask for the next piece of information needed."

            # Update collected info if extraction is confident
            if extraction.confidence > 0.5 and extraction.field_to_update:
                if extraction.new_university and extraction.field_to_update in ["u1", "u2"]:
                    setattr(
                        self.collected_info,
                        extraction.field_to_update,
                        extraction.new_university,
                    )
                elif extraction.new_course and extraction.field_to_update in ["c1", "c2"]:
                    setattr(
                        self.collected_info,
                        extraction.field_to_update,
                        extraction.new_course,
                    )

        # Check for similar conversations first
        similar = self.db.search_similar(self.chat_id, user_message)
        is_cached = False
        if similar:
            response_message = similar[0]["assistant_response"]
            is_cached = True
        else:
            response_message = self._get_response_message(user_message)

        # Add assistant response to history
        self._add_to_history("assistant", response_message)

        # Store conversation in Weaviate
        self.db.add_conversation(self.chat_id, user_message, response_message)

        # Save collected info if complete
        if self.collected_info.is_complete():
            self.save_info()

        return {
            "response": response_message,
            "collected_info": self.collected_info.model_dump(),
            "is_complete": self.collected_info.is_complete(),
            "is_cached": is_cached,
        }

    def get_chat_history(self) -> List[Dict]:
        """Get full chat history from Weaviate"""
        return self.db.get_chat_history(self.chat_id)

    def search_similar_conversations(self, query: str, limit: int = 1) -> List[Dict]:
        """Search for similar conversations"""
        return self.db.search_similar(self.chat_id, query, limit)

    def get_collected_info(self) -> Dict:
        """Return collected information"""
        return self.collected_info.model_dump()

    def get_completion_status(self) -> Dict:
        """Get completion status"""
        collected_count = sum(1 for value in self.collected_info.model_dump().values() if value)
        next_field = self.collected_info.get_next_field()

        return {
            "is_complete": self.collected_info.is_complete(),
            "collected_count": collected_count,
            "total_required": 4,
            "next_field": next_field
        }

    def save_info(self):
        """Save collected information to JSON file"""
        try:
            os.makedirs("/app/collected_info", exist_ok=True)
            filename = f"/app/collected_info/collected_info_{self.chat_id}.json"

            data = {
                "chat_id": self.chat_id,
                "created_at": self.created_at,
                "timestamp": datetime.now().isoformat(),
                "collected_info": self.collected_info.model_dump(),
            }

            with open(filename, "w") as f:
                json.dump(data, f, indent=2)
            print(f"💾 Saved collected information to {filename}")
        except Exception as e:
            print(f"❌ Error saving info: {e}")

    def close(self):
        """Clean up resources"""
        self.db.close()


class OllamaChatManager:
    """Manager for multiple chat sessions"""

    def __init__(self):
        self.active_chats: Dict[str, StructuredOllamaChat] = {}
        self.db = WeaviateVectorDB()
        print("🎯 OllamaChatManager initialized")

    def create_chat_session(self) -> Dict:
        """Create a new chat session"""
        chat_id = self.db.create_new_chat_session()
        chat = StructuredOllamaChat()
        result = chat.initialize_chat(chat_id)
        self.active_chats[chat_id] = chat
        return result

    def get_or_create_chat(self, chat_id: str) -> StructuredOllamaChat:
        """Get existing chat or create if not exists"""
        if chat_id not in self.active_chats:
            chat = StructuredOllamaChat()
            if chat.load_chat_session(chat_id):
                self.active_chats[chat_id] = chat
            else:
                # If loading fails, create new
                result = chat.initialize_chat(chat_id)
                self.active_chats[chat_id] = chat
        return self.active_chats[chat_id]

    def send_message_to_chat(self, chat_id: str, message: str) -> Dict:
        """Send message to specific chat"""
        chat = self.get_or_create_chat(chat_id)
        return chat.send_message(message)

    def get_chat_history(self, chat_id: str) -> List[Dict]:
        """Get conversation history for chat"""
        chat = self.get_or_create_chat(chat_id)
        return chat.get_chat_history()

    def get_collected_info(self, chat_id: str) -> Dict:
        """Get collected information for chat"""
        chat = self.get_or_create_chat(chat_id)
        return chat.get_collected_info()

    def get_completion_status(self, chat_id: str) -> Dict:
        """Get completion status for chat"""
        chat = self.get_or_create_chat(chat_id)
        return chat.get_completion_status()

    def search_similar_conversations(self, chat_id: str, query: str, limit: int = 1) -> List[Dict]:
        """Search similar conversations in chat"""
        chat = self.get_or_create_chat(chat_id)
        return chat.search_similar_conversations(query, limit)

    def close_chat(self, chat_id: str):
        """Close and remove chat from active chats"""
        if chat_id in self.active_chats:
            chat = self.active_chats[chat_id]
            if chat.collected_info.is_complete():
                chat.save_info()
            chat.close()
            del self.active_chats[chat_id]
            print(f"🗑️ Closed chat session: {chat_id}")

    def close_all_chats(self):
        """Close all active chats"""
        for chat_id, chat in self.active_chats.items():
            if chat.collected_info.is_complete():
                chat.save_info()
            chat.close()
        self.active_chats.clear()
        self.db.close()
        print("🧹 Closed all chat sessions")