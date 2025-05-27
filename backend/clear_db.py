from weaviate_client import ConversationVectorDB

db = ConversationVectorDB()

db.clear_all_conversations()
db.close()