import requests
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from .weaviate_service import ConversationVectorDB


class OllamaChat:
    def __init__(self):
        self.model = "gemma3:4b"
        # Get Ollama URL from environment variable, default to localhost
        self.base_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.messages = []
        self.db = ConversationVectorDB()

        self.collected_info = {
            "U1": None,
            "C1": None,
            "U2": None,
            "C2": None,
        }
        self.field_order = ["U1", "C1", "U2", "C2"]
        self.field_names = {
            "U1": "First university name",
            "C1": "First university course",
            "U2": "Second university name",
            "C2": "Second university course",
        }

        self.system_message = """
You are a university course advisor assistant. Your task is to collect exactly 4 pieces of information from students:
1. First university name (U1)
2. First university course (C1)
3. Second university name (U2)
4. Second university course (C2)

Guidelines:
- Ask for one piece of information at a time
- Be conversational and helpful
- Confirm each piece of information before moving to the next
- Keep track of what you've already collected
- Once all 4 pieces are collected, summarize and ask for final confirmation

Current collected information:
{collected_info}

Next required information: {next_field}

After collecting all information, summarize and ask for confirmation.
Once confirmed, provide a summary of the collected information and let them know we will get back to them soon with the course equivalency results.
"""

    def initialize_chat(self, chat_id: str) -> Dict:
        """Initialize a new chat session"""
        self.chat_id = chat_id
        self.created_at = datetime.now().isoformat()
        self.messages = []
        self.collected_info = {
            "U1": None,
            "C1": None,
            "U2": None,
            "C2": None,
        }
        self._update_system_message()
        return {
            "chat_id": self.chat_id,
            "created_at": self.created_at,
            "message": "Hello! To get started, please tell me the name of your current university."
        }

    def load_chat_session(self, chat_id: str) -> bool:
        """Load an existing chat session"""
        try:
            self.chat_id = chat_id
            # Create collected_info directory if it doesn't exist
            os.makedirs("/app/collected_info", exist_ok=True)

            # Try to load existing collected info from a file
            try:
                with open(f"/app/collected_info/collected_info_{chat_id}.json", "r") as f:
                    data = json.load(f)
                    self.collected_info = data.get("collected_info", {
                        "U1": None, "C1": None, "U2": None, "C2": None
                    })
                    self.created_at = data.get("created_at", datetime.now().isoformat())
            except FileNotFoundError:
                # If no saved file, start fresh
                self.collected_info = {
                    "U1": None, "C1": None, "U2": None, "C2": None
                }
                self.created_at = datetime.now().isoformat()

            self.messages = []
            self._update_system_message()
            return True
        except Exception as e:
            print(f"Error loading chat session: {e}")
            return False

    def _update_system_message(self):
        collected_str = ""

        for field, value in self.collected_info.items():
            if value:
                collected_str += f"- {self.field_names[field]}: {value}\n"
        if not collected_str:
            collected_str = "None"

        # Determine the next field to ask for
        next_field = None
        for field in self.field_order:
            if self.collected_info[field] is None:
                next_field = f"{field} ({self.field_names[field]})"
                break
        if next_field is None:
            next_field = "All information collected - Summarize and confirm"

        # Update the system message with the current state
        new_system_message = self.system_message.format(
            collected_info=collected_str.strip(), next_field=next_field
        )

        # Add the system message to the conversation
        if self.messages and self.messages[0]["role"] == "system":
            self.messages[0]["content"] = new_system_message
        else:
            self.messages.insert(0, {"role": "system", "content": new_system_message})

    def _extract_and_validate_info(self, user_message, field):
        user_message = user_message.strip()
        if field in ["U1", "U2"]:
            # Validate university name
            if len(user_message) > 3 and not user_message.isdigit():
                return user_message
        elif field in ["C1", "C2"]:
            # Validate course name
            if len(user_message) > 3 and not user_message.isdigit():
                return user_message
        return None

    def _get_next_field(self):
        for field in self.field_order:
            if self.collected_info[field] is None:
                return field
        return None

    def save_info(self):
        """Save the collected information to a file with chat ID"""
        try:
            # Create collected_info directory if it doesn't exist
            os.makedirs("/app/collected_info", exist_ok=True)

            filename = f"/app/collected_info/collected_info_{self.chat_id}.json"
            data = {
                "chat_id": self.chat_id,
                "created_at": self.created_at,
                "collected_info": self.collected_info,
                "completion_time": datetime.now().isoformat(),
            }
            with open(filename, "w") as f:
                json.dump(data, f, indent=4)
            print(f"Saved collected information to {filename}")
        except Exception as e:
            print(f"Error saving info to file: {e}")

    def send_message(self, user_message: str) -> Tuple[str, bool]:
        """Send a message and return response with cache status"""
        # Track completion status before processing message
        was_complete_before = self.is_collection_complete()

        # Add user message to the conversation
        self.messages.append({"role": "user", "content": user_message})

        next_field = self._get_next_field()
        if next_field:
            extracted_info = self._extract_and_validate_info(user_message, next_field)
            if extracted_info:
                # Store the extracted information
                self.collected_info[next_field] = extracted_info
                self._update_system_message()

        # Check for similar conversations first
        similar = self.search_similar_in_chat(user_message)
        if similar:
            assistant_content = similar[0]["assistant_response"]
            # Add assistant message to conversation
            self.messages.append({"role": "assistant", "content": assistant_content})
            # Save to database
            self.db.add_conversation_pair(self.chat_id, user_message, assistant_content)

            # Check if collection just became complete and save if so
            if not was_complete_before and self.is_collection_complete():
                self.save_info()

            return assistant_content, True

        data = {
            "model": self.model,
            "messages": self.messages,
            "stream": False,
            "options": {
                "temperature": 0.4,
            },
        }

        headers = {
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/chat", headers=headers, data=json.dumps(data)
            )
            response.raise_for_status()

            if response.status_code == 200:
                result = response.json()
                assistant_message = result.get("message", {})
                assistant_content = assistant_message.get("content", "")

                # Add assistant message to the conversation
                self.messages.append(
                    {"role": "assistant", "content": assistant_content}
                )

                # Save to database with chat ID
                self.db.add_conversation_pair(
                    self.chat_id, user_message, assistant_content
                )

                # Check if collection just became complete and save if so
                if not was_complete_before and self.is_collection_complete():
                    self.save_info()

                return assistant_content, False
            else:
                return f"Error: {response.status_code} - {response.text}", False
        except requests.exceptions.ConnectionError:
            return "Error: Unable to connect to the Ollama server. Please check if it is running.", False
        except requests.exceptions.RequestException as e:
            return f"Error: {str(e)}", False

    def search_similar_in_chat(self, query: str, limit: int = 1) -> List[Dict]:
        """Search for similar conversations within this chat"""
        return self.db.search_similar_conversations_in_chat(self.chat_id, query, limit)

    def get_collected_info(self) -> Dict:
        """Return the collected information"""
        return self.collected_info

    def is_collection_complete(self) -> bool:
        """Check if all information has been collected"""
        return all(value is not None for value in self.collected_info.values())

    def get_conversation_history(self) -> List[Dict]:
        """Retrieve the conversation history for this chat"""
        return self.db.get_all_conversations(self.chat_id)

    def get_completion_status(self) -> Dict:
        """Get the completion status of information collection"""
        collected_count = sum(1 for value in self.collected_info.values() if value is not None)
        next_field = self._get_next_field()
        next_field_name = self.field_names.get(next_field) if next_field else None

        return {
            "is_complete": self.is_collection_complete(),
            "collected_count": collected_count,
            "total_required": len(self.field_order),
            "next_field": next_field_name
        }

    def close(self):
        """Close the database connection"""
        self.db.close()


class OllamaChatManager:
    """Manager class to handle multiple chat sessions"""

    def __init__(self):
        self.active_chats: Dict[str, OllamaChat] = {}
        self.db = ConversationVectorDB()

    def create_chat_session(self) -> Dict:
        """Create a new chat session"""
        chat_id = self.db.create_new_chat_session()
        chat = OllamaChat()
        result = chat.initialize_chat(chat_id)
        self.active_chats[chat_id] = chat
        return result

    def get_or_create_chat(self, chat_id: str) -> OllamaChat:
        """Get existing chat or create if not exists"""
        if chat_id not in self.active_chats:
            chat = OllamaChat()
            if chat.load_chat_session(chat_id):
                self.active_chats[chat_id] = chat
            else:
                # If loading fails, create new
                result = chat.initialize_chat(chat_id)
                self.active_chats[chat_id] = chat
        return self.active_chats[chat_id]

    def send_message_to_chat(self, chat_id: str, message: str) -> Tuple[str, bool]:
        """Send message to specific chat"""
        chat = self.get_or_create_chat(chat_id)
        return chat.send_message(message)

    def get_chat_history(self, chat_id: str) -> List[Dict]:
        """Get conversation history for chat"""
        chat = self.get_or_create_chat(chat_id)
        return chat.get_conversation_history()

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
        return chat.search_similar_in_chat(query, limit)

    def save_chat_info(self, chat_id: str) -> bool:
        """Manually save collected info for a specific chat"""
        try:
            chat = self.get_or_create_chat(chat_id)
            if chat.is_collection_complete():
                chat.save_info()
                return True
            return False
        except Exception as e:
            print(f"Error saving chat info: {e}")
            return False

    def close_chat(self, chat_id: str):
        """Close and remove chat from active chats"""
        if chat_id in self.active_chats:
            # Save info before closing if complete
            chat = self.active_chats[chat_id]
            if chat.is_collection_complete():
                chat.save_info()
            chat.close()
            del self.active_chats[chat_id]

    def close_all_chats(self):
        """Close all active chats"""
        for chat_id, chat in self.active_chats.items():
            # Save info before closing if complete
            if chat.is_collection_complete():
                chat.save_info()
            chat.close()
        self.active_chats.clear()
        self.db.close()