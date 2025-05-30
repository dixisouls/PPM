import json
import uuid
import weaviate
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from openai import OpenAI
import instructor
from weaviate.classes.config import Configure, Property, DataType
from weaviate.classes.query import Filter, MetadataQuery, Sort


class CollectedInfo(BaseModel):
    u1: Optional[str] = Field(None, description="First university name")
    c1: Optional[str] = Field(None, description="First university course")
    u2: Optional[str] = Field(None, description="Second university name")
    c2: Optional[str] = Field(None, description="Second university course")

    def is_complete(self) -> bool:
        return all([self.u1, self.c1, self.u2, self.c2])

    def get_next_field(self) -> Optional[str]:
        if not self.u1:
            return "u1"
        elif not self.c1:
            return "c1"
        elif not self.u2:
            return "u2"
        elif not self.c2:
            return "c2"
        return None


class InformationUpdate(BaseModel):
    """Model for extracting new information from user input"""

    new_university: Optional[str] = Field(
        None, description="New university name mentioned"
    )
    new_course: Optional[str] = Field(None, description="New course name mentioned")
    field_to_update: Optional[str] = Field(
        None, description="Which field should be updated: u1, c1, u2, or c2"
    )
    confidence: float = Field(
        description="Confidence level 0-1 that information was extracted correctly"
    )


class WeaviateVectorDB:
    """Simple Weaviate client for conversation storage and search"""

    def __init__(self):
        self.client = weaviate.connect_to_local()
        self.collection_name = "instructor_conversation"
        self._setup_collection()

    def _setup_collection(self):
        try:
            if self.client.collections.exists(self.collection_name):
                print(f"Collection '{self.collection_name}' already exists.")
                return

            # Create collection with text2vec-ollama vectorizer
            self.client.collections.create(
                name=self.collection_name,
                vectorizer_config=Configure.Vectorizer.text2vec_ollama(
                    api_endpoint="http://host.docker.internal:11434",
                    model="nomic-embed-text",
                ),
                properties=[
                    Property(
                        name="chat_id", data_type=DataType.UUID, skip_vectorization=True
                    ),
                    Property(name="user_input", data_type=DataType.TEXT),
                    Property(
                        name="assistant_response",
                        data_type=DataType.TEXT,
                        skip_vectorization=True,
                    ),
                    Property(
                        name="timestamp",
                        data_type=DataType.DATE,
                        skip_vectorization=True,
                    ),
                ],
            )
            print(f"Collection '{self.collection_name}' created successfully.")
        except Exception as e:
            print(f"Error creating collection: {e}")

    def add_conversation(
        self, chat_id: str, user_input: str, assistant_response: str
    ) -> bool:
        """Add conversation pair to Weaviate"""
        try:
            collection = self.client.collections.get(self.collection_name)
            collection.data.insert(
                {
                    "chat_id": chat_id,
                    "user_input": user_input,
                    "assistant_response": assistant_response,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            )
            return True
        except Exception as e:
            print(f"Error adding conversation to Weaviate: {e}")
            return False

    def search_similar(self, chat_id: str, query: str, limit: int = 1) -> List[dict]:
        """Search for similar conversations in this chat"""
        try:
            collection = self.client.collections.get(self.collection_name)

            response = collection.query.near_text(
                query=query,
                limit=limit,
                filters=Filter.by_property("chat_id").equal(chat_id),
                distance=0.3,
                return_metadata=MetadataQuery(distance=True),
            )

            results = []
            for obj in response.objects:
                results.append(
                    {
                        "user_input": obj.properties["user_input"],
                        "assistant_response": obj.properties["assistant_response"],
                        "timestamp": obj.properties.get("timestamp", ""),
                        "distance": obj.metadata.distance,
                    }
                )
            return results
        except Exception as e:
            print(f"Error searching conversations: {e}")
            return []

    def get_chat_history(self, chat_id: str) -> List[dict]:
        """Get all conversations for a chat"""
        try:
            collection = self.client.collections.get(self.collection_name)
            response = collection.query.fetch_objects(
                filters=Filter.by_property("chat_id").equal(chat_id),
                sort=Sort.by_property(name="timestamp", ascending=True),
            )

            conversations = []
            for obj in response.objects:
                conversations.append(
                    {
                        "user_input": obj.properties["user_input"],
                        "assistant_response": obj.properties["assistant_response"],
                        "timestamp": obj.properties["timestamp"],
                    }
                )
            return conversations
        except Exception as e:
            print(f"Error retrieving chat history: {e}")
            return []

    def close(self):
        """Close Weaviate connection"""
        self.client.close()


class StructuredOllamaChat:
    def __init__(self):
        # Setup instructor client with Ollama
        self.client = instructor.from_openai(
            OpenAI(
                base_url="http://localhost:11434/v1",
                api_key="ollama",
            ),
            mode=instructor.Mode.JSON,
        )

        self.model = "gemma3:4b"
        self.chat_id = str(uuid.uuid4())
        self.collected_info = CollectedInfo()

        # Initialize Weaviate DB
        self.db = WeaviateVectorDB()

        # Simple chat history - just a list of messages (fetched from Weaviate)
        self.chat_history = []

        # Field mappings
        self.field_names = {
            "u1": "First University name",
            "c1": "First University course",
            "u2": "Second University name",
            "c2": "Second University course",
        }

        print(f"Chat ID: {self.chat_id}")

    def _add_to_history(self, role: str, content: str):
        """Add message to chat history and Weaviate"""
        # Add to local history
        self.chat_history.append({"role": role, "content": content})

        # Keep only last 20 messages to avoid context getting too long
        if len(self.chat_history) > 20:
            self.chat_history = self.chat_history[-20:]

    def _get_recent_history(self, last_n: int = 6) -> List[dict]:
        """Get recent chat history for context"""
        return self.chat_history[-last_n:] if self.chat_history else []

    def _extract_information(self, user_message: str) -> InformationUpdate:
        """Extract information using instructor"""
        current_state = self.collected_info.model_dump()
        next_field = self.collected_info.get_next_field()

        if not next_field:
            return InformationUpdate(confidence=0.0)

        prompt = f"""
        Analyze this user message for information: "{user_message}"

        Current collected information:
        - First university (u1): {current_state['u1'] or 'Not collected'}
        - First course (c1): {current_state['c1'] or 'Not collected'}
        - Second university (u2): {current_state['u2'] or 'Not collected'}
        - Second course (c2): {current_state['c2'] or 'Not collected'}

        Next field needed: {next_field} ({self.field_names.get(next_field, 'unknown')})

        IMPORTANT RULES:
        - If looking for a COURSE: Extract any academic subject, major, program, or field of study mentioned
        - If looking for a UNIVERSITY: Extract any college, university, or institution name mentioned
        - Set confidence HIGH (0.8+) if information is clearly present
        - Set field_to_update to: {next_field}
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
            print(f"Extraction error: {e}")
            return InformationUpdate(confidence=0.0)

    def _get_response_message(self, user_message: str) -> str:
        """Get natural language response"""
        next_field = self.collected_info.get_next_field()
        next_name = self.field_names.get(next_field, "All information collected")

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

            Next information needed: {next_name}

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

    def send_message(self, user_message: str) -> dict:
        """Process message and return response"""
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
                user_message = f"Invalid input by the user, ask for the next piece of information needed."

            # Update collected info if extraction is confident
            if extraction.confidence > 0.5 and extraction.field_to_update:
                if extraction.new_university and extraction.field_to_update in [
                    "u1",
                    "u2",
                ]:
                    setattr(
                        self.collected_info,
                        extraction.field_to_update,
                        extraction.new_university,
                    )
                elif extraction.new_course and extraction.field_to_update in [
                    "c1",
                    "c2",
                ]:
                    setattr(
                        self.collected_info,
                        extraction.field_to_update,
                        extraction.new_course,
                    )

        # Get natural response
        similar = self.db.search_similar(self.chat_id, user_message)
        if similar:
            response_message = similar[0]["assistant_response"]
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
            "is_cached": False,
        }

    def get_chat_history(self) -> List[dict]:
        """Get full chat history"""
        return self.db.get_chat_history(self.chat_id)

    def save_info(self):
        """Save collected information to JSON"""
        filename = f"collected_info_{self.chat_id}.json"
        data = {
            "chat_id": self.chat_id,
            "timestamp": datetime.now().isoformat(),
            "collected_info": self.collected_info.model_dump(),
        }

        with open(filename, "w") as f:
            json.dump(data, f, indent=2)
        print(f"✅ Saved collected information to {filename}")

    def close(self):
        """Clean up resources"""
        self.db.close()


def main():
    print("University Information Collector (Instructor + Weaviate)")
    print("Commands: 'exit', '/history'")
    print("-" * 60)

    chat = StructuredOllamaChat()

    initial_message = "Hi! I need to collect information about two universities and courses you're interested in. Let's start with the name of your first university."
    print(f"Assistant: {initial_message}")

    # Add initial message to history
    chat._add_to_history("assistant", initial_message)

    while True:
        user_input = input(f"\n[{chat.chat_id[:8]}] You: ").strip()

        if user_input.lower() == "exit":
            print("Goodbye!")
            chat.close()
            break

        if user_input == "/history":
            history = chat.get_chat_history()
            print(f"\n📜 Chat History ({len(history)} conversations):")
            for i, conv in enumerate(history, 1):
                print(f"{i}. You: {conv['user_input']}")
                print(f"   Assistant: {conv['assistant_response']}")
                print("-" * 40)
            continue

        if not user_input:
            continue

        try:
            # Get structured response
            result = chat.send_message(user_input)

            # Display response
            print(f"\nAssistant: {result['response']}")

            # Show progress
            info = result["collected_info"]
            collected = [k for k, v in info.items() if v]
            print(f"\n📊 Progress: {len(collected)}/4 fields collected")

            if result["is_complete"]:
                print("✅ All information collected!")

        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    main()
