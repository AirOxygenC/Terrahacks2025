from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai import types

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all origins

# Configure Gemini API
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction="You are a child paediatrician helping new parents understand what's normal for their babies. Be friendly, explain clearly, and reassure them."
)

generation_config = types.GenerationConfig(temperature=0.7)

safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
]

# Global in-memory chat history (you could use session/user ID later)
chat_history = []

@app.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Server is running!"})

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message')

    if not user_message:
        return jsonify({"reply": "No message provided."}), 400

    # Append user message to chat history
    chat_history.append({"role": "user", "parts": [user_message]})

    try:
        # Generate Gemini response
        response = model.generate_content(
            chat_history,
            generation_config=generation_config,
            safety_settings=safety_settings
        )

        reply_text = response.text

        # Add model reply to chat history
        chat_history.append({"role": "model", "parts": [reply_text]})

        return jsonify({"reply": reply_text})
    except Exception as e:
        return jsonify({"reply": "An error occurred while generating the response."}), 500

if __name__ == '__main__':
    app.run(debug=True)
