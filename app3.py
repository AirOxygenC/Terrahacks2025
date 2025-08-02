from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai import types


# Load env and config
load_dotenv()
app = Flask(__name__)
CORS(app)
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

model = genai.GenerativeModel(
    model_name="gemini-pro-vision",
    system_instruction="You are a pediatrician helping parents understand baby health issues from symptoms and images. Be warm and informative."
)

generation_config = types.GenerationConfig(temperature=0.7)
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]

@app.route("/chat", methods=["POST"])
def chat():
    message = request.form.get("message", "")
    image = request.files.get("image")
    
    use_vision = bool(image)

    # Start history from session
    chat_history = session.get("chat_history", [])

    user_parts = []
    if message:
        user_parts.append(types.Part(text=message))
    if image:
        # You could compress the image here before reading
        user_parts.append(types.Part(
            inline_data=types.Blob(mime_type=image.mimetype, data=image.read())
        ))

    chat_history.append(types.Content(role="user", parts=user_parts))

    # Dynamically choose model
    model_name = "gemini-pro-vision" if use_vision else "gemini-2.5-flash"
    model = genai.GenerativeModel(model_name=model_name)

    # Optional: trim history to reduce context tokens
    trimmed_history = chat_history[-4:] if use_vision else chat_history

    try:
        response = model.generate_content(
            trimmed_history,
            generation_config=generation_config,
            safety_settings=safety_settings,
        )

        chat_history.append(types.Content(role="model", parts=[types.Part(text=response.text)]))
        session["chat_history"] = chat_history

        return jsonify({"reply": response.text})
    except Exception as e:
        print("❌ Gemini API error:", e)
        return jsonify({"reply": "⚠️ Error processing request."}), 500

if __name__ == "__main__":
    app.run(debug=True)
