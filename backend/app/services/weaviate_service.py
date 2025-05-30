import weaviate
import os
import uuid
from datetime import datetime, timezone
from typing import List, Dict
from weaviate.classes.config import Configure, Property, DataType
from weaviate.classes.query import Filter, MetadataQuery, Sort


class WeaviateVectorDB:
    """Weaviate client for conversation storage and vector search"""

    def __init__(self):
        # Get Weaviate and Ollama URLs from environment
        weaviate_url = os.getenv("WEAVIATE_URL", "http://localhost:8080")
        ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")

        print(f"Connecting to Weaviate at: {weaviate_url}")
        print(f"Using Ollama at: {ollama_url}")

        # Parse Weaviate URL for connection
        if "://" in weaviate_url:
            protocol, rest = weaviate_url.split("://", 1)
            is_secure = protocol == "https"

            if ":" in rest:
                host, port_str = rest.split(":", 1)
                port = int(port_str)
            else:
                host = rest
                port = 443 if is_secure else 8080
        else:
            host = "localhost"
            port = 8080
            is_secure = False

        # Connect to Weaviate
        try:
            self.client = weaviate.connect_to_custom(
                http_host=host,
                http_port=port,
                http_secure=is_secure,
                grpc_host=host,
                grpc_port=50051,
                grpc_secure=is_secure
            )
            print(f"✅ Connected to Weaviate at {host}:{port}")
        except Exception as e:
            print(f"❌ Failed to connect to Weaviate: {e}")
            raise

        self.collection_name = "instructor_conversation"
        self.ollama_url = ollama_url
        self._setup_collection()

    def _setup_collection(self):
        """Setup Weaviate collection with proper schema"""
        try:
            if self.client.collections.exists(self.collection_name):
                print(f"Collection '{self.collection_name}' already exists.")
                return

            print(f"Creating collection with Ollama endpoint: {self.ollama_url}")

            # Create collection with text2vec-ollama vectorizer
            self.client.collections.create(
                name=self.collection_name,
                vectorizer_config=Configure.Vectorizer.text2vec_ollama(
                    api_endpoint=self.ollama_url,
                    model="nomic-embed-text",
                ),
                properties=[
                    Property(
                        name="chat_id",
                        data_type=DataType.UUID,
                        skip_vectorization=True
                    ),
                    Property(
                        name="user_input",
                        data_type=DataType.TEXT
                    ),
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
            print(f"✅ Collection '{self.collection_name}' created successfully.")
        except Exception as e:
            print(f"❌ Error creating collection: {e}")
            raise

    def create_new_chat_session(self) -> str:
        """Create a new chat session and return its ID"""
        chat_id = str(uuid.uuid4())
        print(f"📝 Created new chat session: {chat_id}")
        return chat_id

    def add_conversation(self, chat_id: str, user_input: str, assistant_response: str) -> bool:
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
            print(f"❌ Error adding conversation to Weaviate: {e}")
            return False

    def search_similar(self, chat_id: str, query: str, limit: int = 1) -> List[Dict]:
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
            print(f"❌ Error searching conversations: {e}")
            return []

    def get_chat_history(self, chat_id: str) -> List[Dict]:
        """Get all conversations for a chat session"""
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
                        "id": str(obj.uuid),
                        "chat_id": obj.properties["chat_id"],
                        "user_input": obj.properties["user_input"],
                        "assistant_response": obj.properties["assistant_response"],
                        "timestamp": obj.properties["timestamp"],
                    }
                )
            return conversations
        except Exception as e:
            print(f"❌ Error retrieving chat history: {e}")
            return []

    def clear_all_conversations(self) -> bool:
        """Clear all conversations in the collection"""
        try:
            self.client.collections.delete(self.collection_name)
            self._setup_collection()
            print("🧹 Cleared all conversations.")
            return True
        except Exception as e:
            print(f"❌ Error clearing conversations: {e}")
            return False

    def close(self):
        """Close Weaviate connection"""
        try:
            self.client.close()
            print("🔌 Weaviate connection closed.")
        except Exception as e:
            print(f"❌ Error closing Weaviate connection: {e}")