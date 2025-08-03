import os
import google.generativeai as genai
from google.generativeai import types
from dotenv import load_dotenv

load_dotenv()

# Rolling chat history
chat_history = []

# Configure API key
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Set up the model
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction="You are a child paediatrician helping new parents understand what's normal for their babies. Be friendly, explain clearly, and reassure them."
)

# Generation settings
generation_config = types.GenerationConfig(
    temperature=0
)

safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
]

def chat():
    print("👶 Welcome to ParentPal! Ask me anything about your baby's health.")
    while True:
        user_input = input("\nYou: ")
        if user_input.lower() in {"exit", "quit"}:
            print("👋 Goodbye! Stay calm and parent on.")
            break

        # Add user message to chat history
        chat_history.append({"role": "user", "parts": [user_input]})

        # Get model response
        response = model.generate_content(
            chat_history,
            generation_config=generation_config,
            safety_settings=safety_settings
        )

        # Print and add model response
        print("\nParentPal:", response.text)
        chat_history.append({"role": "model", "parts": [response.text]})

if __name__ == "__main__":
    chat()