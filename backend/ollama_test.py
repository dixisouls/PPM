import requests
import json
from datetime import datetime
from weaviate_client import ConversationVectorDB


class OllamaChat:
    def __init__(self):
        self.model = "gemma3:4b"
        self.base_url = "http://localhost:11434"
        self.messages = []
        self.db = ConversationVectorDB()

        # Automatically create a new chat session
        self.chat_id = self.db.create_new_chat_session()
        self.created_at = datetime.now().isoformat()

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
Once confirmed, provide a summary of the collected information and suggest next steps.
"""
        # Initialize the conversation with the system message
        self._update_system_message()

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
        filename = f"collected_info_{self.chat_id}.json"
        data = {
            "chat_id": self.chat_id,
            "created_at": self.created_at,
            "collected_info": self.collected_info,
            "completion_time": datetime.now().isoformat(),
        }
        with open(filename, "w") as f:
            json.dump(data, f, indent=4)

    def send_message(self, user_message):
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
            return f"[CACHED] {assistant_content}"

        data = {
            "model": self.model,
            "messages": self.messages,
            "stream": False,
            "options": {
                "temperature": 0.1,
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
                return assistant_content
            else:
                return f"Error: {response.status_code} - {response.text}"
        except requests.exceptions.ConnectionError:
            return "Error: Unable to connect to the Ollama server. Please check if it is running."
        except requests.exceptions.RequestException as e:
            return f"Error: {str(e)}"

    def search_similar_in_chat(self, query):
        """Search for similar conversations within this chat"""
        return self.db.search_similar_conversations_in_chat(self.chat_id, query)

    def get_collected_info(self):
        """Return the collected information"""
        return self.collected_info

    def is_collection_complete(self):
        """Check if all information has been collected"""
        return all(value is not None for value in self.collected_info.values())

    def get_conversation_history(self):
        """Retrieve the conversation history for this chat"""
        return self.db.get_all_conversations(self.chat_id)

    def close(self):
        """Close the database connection"""
        self.db.close()


def main():
    """Simplified main function with automatic chat creation and streamlined flow"""
    print("Welcome to the University Course Advisor Assistant!")
    print("I'll help you collect information about your university courses.")
    print("Type '/exit' to quit the application")
    print()

    # Automatically create a new chat session
    chat = OllamaChat()

    print(
        "Assistant: Hello! To get started, please tell me the name of your current university."
    )

    while True:
        user_input = input(f"[{chat.chat_id[:8]}] You: ")

        if user_input.lower() == "/exit":
            print(f"[{chat.chat_id[:8]}] Goodbye!")
            chat.close()
            break

        if user_input.lower() == "/history":
            # Display conversation history
            history = chat.get_conversation_history()
            print(f"[{chat.chat_id[:8]}] Conversation History:")
            for msg in history:
                print(f"Human: {msg['human_response']}")
                print(f"Assistant: {msg['assistant_response']}")
                print(f"Timestamp: {msg['timestamp']}")
                print("---")
            continue

        # Send message and get response
        response = chat.send_message(user_input)
        print(f"[{chat.chat_id[:8]}] Assistant: {response}")

        # Check if collection is complete
        if chat.is_collection_complete():
            # Save the collected information
            chat.save_info()


if __name__ == "__main__":
    main()
