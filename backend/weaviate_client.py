import weaviate
from weaviate.classes.config import Configure
import json
from typing import List, Dict, Optional


class ConversationVectorDB:
    def __init__(self):
        self.client = weaviate.connect_to_local()
        self.collection_name = "ollama_conversation"
        self._setup_collection()

    def _setup_collection(self):
        try:
            if self.client.collections.exists(self.collection_name):
                print(f"Collection '{self.collection_name}' already exists.")
                return
            # Create a new collection
            self.client.collections.create(
                name=self.collection_name,
                vectorizer_config=Configure.Vectorizer.text2vec_ollama(
                    api_endpoint="http://host.docker.internal:11434",
                    model="nomic-embed-text",
                ),
            )
            print(f"Collection '{self.collection_name}' created successfully.")
        except Exception as e:
            print(f"Error creating collection: {e}")

    def add_conversation_pair(
        self, human_response: str, assistant_response: str
    ) -> bool:
        try:
            collection = self.client.collections.get(self.collection_name)
            result = collection.data.insert(
                {
                    "human_response": human_response,
                    "assistant_response": assistant_response,
                }
            )
            print(f"Added conversation pair to Weaviate: {result}")
            return True
        except Exception as e:
            print(f"Error adding conversation pair to Weaviate: {e}")
            return False

    def search_similar_conversations(self, query: str, limit: int = 1) -> List[Dict]:
        try:
            collection = self.client.collections.get(self.collection_name)
            response = collection.query.near_text(
                query=query,
                limit=limit,
            )
            results = []
            for obj in response.objects:
                results.append(
                    {
                        "id": str(obj.uuid),
                        "human_response": obj.properties["human_response"],
                        "assistant_response": obj.properties["assistant_response"],
                        "score": (
                            obj.metadata.distance
                            if hasattr(obj.metadata, "distance")
                            else None
                        ),
                    }
                )
            return results
        except Exception as e:
            print(f"Error searching similar conversations: {e}")
            return []

    def get_all_conversations(self, limit: int = 100) -> List[Dict]:
        try:
            collection = self.client.collections.get(self.collection_name)
            response = collection.query.fetch_objects(limit=limit)
            results = []
            for obj in response.objects:
                results.append(
                    {
                        "id": str(obj.uuid),
                        "human_response": obj.properties["human_response"],
                        "assistant_response": obj.properties["assistant_response"],
                    }
                )
            return results
        except Exception as e:
            print(f"Error getting all conversations: {e}")
            return []

    def delete_conversation(self, conversation_id: str) -> bool:
        try:
            collection = self.client.collections.get(self.collection_name)
            collection.data.delete_by_id(conversation_id)
            print(f"Deleted conversation with ID: {conversation_id}")
            return True
        except Exception as e:
            print(f"Error deleting conversation: {e}")
            return False

    def clear_all_conversations(self) -> bool:
        try:
            self.client.collections.delete(self.collection_name)
            self._setup_collection()
            print("Cleared all conversations.")
            return True
        except Exception as e:
            print(f"Error clearing all conversations: {e}")
            return False

    def get_collection_stats(self) -> Dict:
        try:
            collection = self.client.collections.get(self.collection_name)
            response = collection.query.fetch_objects(limit=1)

            return {
                "collection_exitsts": True,
                "collection_name": self.collection_name,
                "has_data": len(response.objects) > 0,
            }
        except Exception as e:
            print(f"Error getting collection stats: {e}")
            return {
                "collection_exitsts": False,
                "error": str(e),
            }

    def close(self):
        self.client.close()


if __name__ == "__main__":
    db = ConversationVectorDB()
    print("Weaviate client initialized.")
    example_pairs = [
        {
            "human_response": "What is the best university for computer science?",
            "assistant_response": "Some top universities for computer science include MIT, Stanford, Carnegie Mellon, UC Berkeley, and Harvard. The 'best' depends on your specific interests, research areas, and career goals.",
        },
        {
            "human_response": "I want to study machine learning",
            "assistant_response": "For machine learning, consider universities with strong AI programs like Stanford, MIT, CMU, UC Berkeley, or Georgia Tech. Look for faculty research in your areas of interest and available resources.",
        },
        {
            "human_response": "Tell me about undergraduate computer science courses",
            "assistant_response": "Typical CS undergraduate courses include programming fundamentals, data structures, algorithms, computer systems, software engineering, databases, and mathematics. Most programs also offer electives in AI, cybersecurity, graphics, and more.",
        },
    ]

    similar_search_query = input("Enter a search query: ")
    similar = db.search_similar_conversations(similar_search_query)
    for result in similar:
        print(f"Human: {result['human_response']}")
        print(f"Assistant: {result['assistant_response']}")
        print("---")

    print("\n--- Collection Stats ---")
    stats = db.get_collection_stats()
    print(json.dumps(stats, indent=4))

    db.clear_all_conversations()
    print("All conversations cleared.")

    db.close()
