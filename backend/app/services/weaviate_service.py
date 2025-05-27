import weaviate
from weaviate.classes.config import Configure, Property, DataType
from weaviate.classes.query import Filter, MetadataQuery, Sort
import uuid
from typing import List, Dict
from datetime import datetime, timezone


class ConversationVectorDB:
    """A class to manage conversation data in Weaviate with vector search capabilities"""

    def __init__(self):
        self.client = weaviate.connect_to_local()
        self.collection_name = "ollama_conversation"
        self._setup_collection()

    def _setup_collection(self):
        try:
            if self.client.collections.exists(self.collection_name):
                print(f"Collection '{self.collection_name}' already exists.")
                return
            # Create a new collection with chat_id field
            self.client.collections.create(
                name=self.collection_name,
                vectorizer_config=Configure.Vectorizer.text2vec_ollama(
                    api_endpoint="http://host.docker.internal:11434",
                    model="snowflake-arctic-embed",
                ),
                properties=[
                    Property(
                        name="chat_id", data_type=DataType.UUID, skip_vectorization=True
                    ),
                    Property(name="human_response", data_type=DataType.TEXT),
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

    def create_new_chat_session(self) -> str:
        """Create a new chat session and return its ID"""
        chat_id = str(uuid.uuid4())
        print(f"Created new chat session: {chat_id}")
        return chat_id

    def add_conversation_pair(
        self, chat_id: str, human_response: str, assistant_response: str
    ) -> bool:
        """Add a conversation pair to a specific chat session"""
        try:
            collection = self.client.collections.get(self.collection_name)
            result = collection.data.insert(
                {
                    "chat_id": chat_id,
                    "human_response": human_response,
                    "assistant_response": assistant_response,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            )
            return True
        except Exception as e:
            print(f"Error adding conversation pair to Weaviate: {e}")
            return False

    def search_similar_conversations_in_chat(
        self, chat_id: str, query: str, limit: int = 1
    ) -> List[Dict]:
        """Search for similar conversations within a specific chat session"""
        try:
            collection = self.client.collections.get(self.collection_name)

            # Do semantic search first, then filter results manually
            response = collection.query.near_text(
                query=query,
                limit=limit,
                filters=Filter.by_property("chat_id").equal(chat_id),
                distance=0.5,
                return_metadata=MetadataQuery(distance=True),
            )

            # Filter results to only this chat_id
            results = []
            for obj in response.objects:
                results.append(
                    {
                        "id": str(obj.uuid),
                        "chat_id": obj.properties["chat_id"],
                        "human_response": obj.properties["human_response"],
                        "assistant_response": obj.properties["assistant_response"],
                        "timestamp": obj.properties.get("timestamp", ""),
                        "distance": obj.metadata.distance,
                    }
                )
            return results
        except Exception as e:
            print(f"Error searching similar conversations in chat: {e}")
            return []

    def get_all_conversations(self, chat_id: str) -> List[Dict]:
        """Retrieve all conversations for a specific chat session"""
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
                        "human_response": obj.properties["human_response"],
                        "assistant_response": obj.properties["assistant_response"],
                        "timestamp": obj.properties["timestamp"],
                    }
                )
            return conversations
        except Exception as e:
            print(f"Error retrieving conversations: {e}")
            return []

    def clear_all_conversations(self) -> bool:
        """Clear all conversations in the collection"""
        try:
            self.client.collections.delete(self.collection_name)
            self._setup_collection()
            print("Cleared all conversations.")
            return True
        except Exception as e:
            print(f"Error clearing all conversations: {e}")
            return False

    def close(self):
        """Close the Weaviate client connection"""
        self.client.close()