import json
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator, field_validator
from openai import OpenAI
import instructor


class CollectedInfo(BaseModel):
    current_university: Optional[str] = Field(None, description="Current university name")
    current_program: Optional[str] = Field(None, description="Current program/degree")
    target_university: Optional[str] = Field(None, description="Target university name")
    target_program: Optional[str] = Field(None, description="Target program/degree")
    courses_taken: Optional[List[str]] = Field(default_factory=list, description="List of courses taken")
    completion_terms: Optional[int] = Field(None, description="Number of terms to complete target program")
    areas_of_interest: Optional[List[str]] = Field(default_factory=list, description="Areas of academic interest")

    @field_validator('completion_terms')
    def validate_terms(cls, v):
        if v is not None and (v < 1 or v > 20):
            raise ValueError('Number of terms must be between 1 and 20')
        return v

    @field_validator('courses_taken', 'areas_of_interest')
    def validate_lists(cls, v):
        if v is None:
            return []
        # Clean up list items - remove empty strings and strip whitespace
        return [item.strip() for item in v if item and item.strip()]

    def is_complete(self) -> bool:
        """Check if all required information has been collected"""
        required_fields = [
            self.current_university,
            self.current_program,
            self.target_university,
            self.target_program,
            self.completion_terms
        ]

        # Check required fields
        if not all(required_fields):
            return False

        # Check if lists have at least one item
        if not self.courses_taken or len(self.courses_taken) == 0:
            return False

        if not self.areas_of_interest or len(self.areas_of_interest) == 0:
            return False

        return True

    def get_next_field(self) -> Optional[str]:
        """Get the next field that needs to be collected"""
        if not self.current_university:
            return "current_university"
        elif not self.current_program:
            return "current_program"
        elif not self.target_university:
            return "target_university"
        elif not self.target_program:
            return "target_program"
        elif not self.courses_taken or len(self.courses_taken) == 0:
            return "courses_taken"
        elif self.completion_terms is None:
            return "completion_terms"
        elif not self.areas_of_interest or len(self.areas_of_interest) == 0:
            return "areas_of_interest"
        return None

    def get_collected_count(self) -> int:
        """Get count of collected fields"""
        count = 0

        if self.current_university:
            count += 1
        if self.current_program:
            count += 1
        if self.target_university:
            count += 1
        if self.target_program:
            count += 1
        if self.courses_taken and len(self.courses_taken) > 0:
            count += 1
        if self.completion_terms is not None:
            count += 1
        if self.areas_of_interest and len(self.areas_of_interest) > 0:
            count += 1

        return count


class InformationUpdate(BaseModel):
    """Model for extracting new information from user input"""

    new_university: Optional[str] = Field(None, description="New university name mentioned")
    new_program: Optional[str] = Field(None, description="New program/degree mentioned")
    new_courses: Optional[List[str]] = Field(default_factory=list, description="List of courses mentioned")
    new_terms: Optional[int] = Field(None, description="Number of terms mentioned")
    new_interests: Optional[List[str]] = Field(default_factory=list, description="Areas of interest mentioned")

    field_to_update: Optional[str] = Field(
        None,
        description="Which field should be updated: current_university, current_program, target_university, target_program, courses_taken, completion_terms, or areas_of_interest"
    )
    confidence: float = Field(description="Confidence level 0-1 that information was extracted correctly")

class AssistantResponse(BaseModel):
    """Complete response structure"""

    message: str = Field(description="Natural language response to user")
    collected_info: CollectedInfo = Field(description="Current state of collected information")
    is_complete: bool = Field(description="Whether all information has been collected")


class EnhancedInstructorChat:
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
        self.chat_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.collected_info = CollectedInfo()

        # Chat history
        self.chat_history = []

        # Field mappings with detailed descriptions
        self.field_names = {
            "current_university": "Current University",
            "current_program": "Current Program/Degree",
            "target_university": "Target University",
            "target_program": "Target Program/Degree",
            "courses_taken": "Courses Taken (provide as a list)",
            "completion_terms": "Number of Terms to Complete Target Program",
            "areas_of_interest": "Areas of Interest (provide as a list)"
        }

        self.field_instructions = {
            "current_university": "Please provide the name of the university you currently attend.",
            "current_program": "What program or degree are you currently pursuing?",
            "target_university": "Which university are you planning to transfer to?",
            "target_program": "What program or degree do you want to pursue at the target university?",
            "courses_taken": "Please list the courses you have completed. Provide it as a list.",
            "completion_terms": "How many terms (semesters/quarters) do you plan to take to complete your target program?",
            "areas_of_interest": "What are your academic areas of interest? Please provide them as a list."
        }

    def _add_to_history(self, role: str, content: str):
        """Add message to chat history"""
        self.chat_history.append({"role": role, "content": content})
        if len(self.chat_history) > 20:
            self.chat_history = self.chat_history[-20:]

    def _get_recent_history(self, last_n: int = 10) -> List[dict]:
        """Get recent chat history for context"""
        return self.chat_history[-last_n:] if self.chat_history else []

    def _extract_information(self, user_message: str) -> InformationUpdate:
        """Extract information using instructor"""
        current_state = self.collected_info.model_dump()
        next_field = self.collected_info.get_next_field()

        if not next_field:
            return InformationUpdate(confidence=0.0)

        # Build extraction prompt based on the field type
        field_type_instructions = {
            "current_university": "Extract university or college name",
            "current_program": "Extract academic program, major, degree, or field of study",
            "target_university": "Extract university or college name",
            "target_program": "Extract academic program, major, degree, or field of study",
            "courses_taken": "Extract course names, subjects, or class titles. Return as a list even if only one course is mentioned.",
            "completion_terms": "Extract number of terms, semesters, quarters, or years. Convert to number of terms.",
            "areas_of_interest": "Extract academic subjects, fields, or areas of interest. Return as a list."
        }

        prompt = f"""
        Analyze this user message for information: "{user_message}"

        Current collected information:
        - Current University: {current_state['current_university'] or 'Not collected'}
        - Current Program: {current_state['current_program'] or 'Not collected'}
        - Target University: {current_state['target_university'] or 'Not collected'}
        - Target Program: {current_state['target_program'] or 'Not collected'}
        - Courses Taken: {current_state['courses_taken'] or 'Not collected'}
        - Completion Terms: {current_state['completion_terms'] or 'Not collected'}
        - Areas of Interest: {current_state['areas_of_interest'] or 'Not collected'}

        Next field needed: {next_field} ({self.field_names.get(next_field, 'unknown')})

        EXTRACTION RULES for {next_field}:
        {field_type_instructions.get(next_field, 'Extract relevant information')}

        IMPORTANT GUIDELINES:
        - Set confidence HIGH (0.8+) if information is clearly present and relevant
        - Set field_to_update to: {next_field}
        - For list fields (courses_taken, areas_of_interest): extract ALL items mentioned
        - For completion_terms: convert any time references to number of terms/semesters
        - Only extract {next_field} information, do not assume or infer other fields
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_model=InformationUpdate,
                temperature=0.1,
            )
            print(response)
            return response
        except Exception as e:
            print(f"Extraction error: {e}")
            return InformationUpdate(confidence=0.0)

    def _get_response_message(self, user_message: str) -> str:
        """Get natural language response"""
        next_field = self.collected_info.get_next_field()

        if not next_field:
            # All information collected
            context = f"""
            All required information has been collected. Provide a summary of the collected information and inform the user that we will get back to them soon.

            Collected Information:
            - Current University: {self.collected_info.current_university}
            - Current Program: {self.collected_info.current_program}
            - Target University: {self.collected_info.target_university}
            - Target Program: {self.collected_info.target_program}
            - Courses Taken: {', '.join(self.collected_info.courses_taken)}
            - Completion Terms: {self.collected_info.completion_terms}
            - Areas of Interest: {', '.join(self.collected_info.areas_of_interest)}

            IMPORTANT: Summarize this information clearly and say "We will get back to you soon with your pathway analysis."
            """
        else:
            # Still collecting information
            context = f"""
            You are collecting academic pathway information from a student. Your ONLY task is to collect the required information systematically.

            IMPORTANT GUIDELINES:
            - Collect information in the specified order
            - Ask for ONE piece of information at a time
            - Be encouraging and helpful
            - Do not make assumptions about the student's information

            Currently collected:
            - Current University: {self.collected_info.current_university or 'Still needed'}
            - Current Program: {self.collected_info.current_program or 'Still needed'}
            - Target University: {self.collected_info.target_university or 'Still needed'}
            - Target Program: {self.collected_info.target_program or 'Still needed'}
            - Courses Taken: {self.collected_info.courses_taken or 'Still needed'}
            - Completion Terms: {self.collected_info.completion_terms or 'Still needed'}
            - Areas of Interest: {self.collected_info.areas_of_interest or 'Still needed'}

            Next information needed: {self.field_names.get(next_field)}
            Instructions: {self.field_instructions.get(next_field)}

            Progress: {self.collected_info.get_collected_count()}/7 fields completed
            """

        try:
            messages = [{"role": "system", "content": context}]
            recent_history = self._get_recent_history()
            messages.extend(recent_history)
            messages.append({"role": "user", "content": user_message})

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                response_model=None,
                temperature=0.5,
                top_p=0.9,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"I'm having trouble responding: {e}"

    def send_message(self, user_message: str) -> AssistantResponse:
        """Process message and return structured response"""
        self._add_to_history("user", user_message)

        # Extract information if not complete
        if not self.collected_info.is_complete():
            extraction = self._extract_information(user_message)

            if (
                 extraction.new_university is None
                 and extraction.new_program is None
                 and extraction.new_courses is None
                 and extraction.new_terms is None
                 and extraction.new_interests is None
                 and not self.collected_info.is_complete()
             ):
                user_message = "Invalid input by the user, ask again for the same piece of information needed."

            # Update collected info if extraction is confident
            if extraction.confidence > 0.5 and extraction.field_to_update:
                field = extraction.field_to_update

                if field == "current_university" and extraction.new_university:
                    self.collected_info.current_university = extraction.new_university
                elif field == "current_program" and extraction.new_program:
                    self.collected_info.current_program = extraction.new_program
                elif field == "target_university" and extraction.new_university:
                    self.collected_info.target_university = extraction.new_university
                elif field == "target_program" and extraction.new_program:
                    self.collected_info.target_program = extraction.new_program
                elif field == "courses_taken" and extraction.new_courses:
                    self.collected_info.courses_taken = extraction.new_courses
                elif field == "completion_terms" and extraction.new_terms:
                    self.collected_info.completion_terms = extraction.new_terms
                elif field == "areas_of_interest" and extraction.new_interests:
                    self.collected_info.areas_of_interest = extraction.new_interests

        # Get natural response
        message = self._get_response_message(user_message)
        self._add_to_history("assistant", message)

        return AssistantResponse(
            message=message,
            collected_info=self.collected_info,
            is_complete=self.collected_info.is_complete(),
        )

    def save_info(self):
        """Save collected information to JSON"""
        filename = f"collected_pathway_info_{self.chat_id}.json"
        data = {
            "chat_id": self.chat_id,
            "timestamp": datetime.now().isoformat(),
            "collected_info": self.collected_info.model_dump(),
            "total_fields": 7,
            "collected_fields": self.collected_info.get_collected_count(),
            "completion_status": self.collected_info.is_complete()
        }

        with open(filename, "w") as f:
            json.dump(data, f, indent=2)
        print(f"✅ Saved pathway information to {filename}")

    def get_completion_status(self) -> dict:
        """Get detailed completion status"""
        return {
            "is_complete": self.collected_info.is_complete(),
            "collected_count": self.collected_info.get_collected_count(),
            "total_required": 7,
            "next_field": self.collected_info.get_next_field(),
            "next_field_name": self.field_names.get(self.collected_info.get_next_field(), "All fields collected")
        }


def main():
    print("Enhanced University Pathway Information Collector")
    print("Collecting: University info, Programs, Courses, Timeline, and Interests")
    print("Type 'exit' to quit, '/status' for progress")
    print("-" * 70)

    chat = EnhancedInstructorChat()

    initial_message = (
        "Hi! I'm here to help you plan your academic pathway. I'll need to collect some information "
        "about your current situation and your goals. Let's start with your current university - "
        "which university are you currently attending?"
    )
    print(f"Assistant: {initial_message}")
    chat._add_to_history("assistant", initial_message)

    while True:
        user_input = input(f"\nYou: ").strip()

        if user_input.lower() == "exit":
            print("Goodbye! Your information has been saved.")
            if chat.collected_info.is_complete():
                chat.save_info()
            break

        if user_input == "/status":
            status = chat.get_completion_status()
            print(f"\n📊 Progress: {status['collected_count']}/{status['total_required']} fields")
            print(f"Next: {status['next_field_name']}")
            print(f"Complete: {'Yes' if status['is_complete'] else 'No'}")
            continue

        if not user_input:
            continue

        try:
            response = chat.send_message(user_input)
            print(f"\nAssistant: {response.message}")

            # Show progress
            status = chat.get_completion_status()
            print(f"\n📈 Progress: {status['collected_count']}/7 fields collected")

            if response.is_complete:
                print("🎉 All information collected!")
                chat.save_info()

        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    main()