from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load secrets from .env
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains

# Gemini model setup
model = genai.GenerativeModel("gemini-pro")

@app.route("/api/ask", methods=["POST"])
def ask_gemini():
    try:
        data = request.get_json()
        user_input = data.get("message")

        response = model.generate_content(user_input)
        return jsonify({"reply": response.text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
