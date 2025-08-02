from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from PIL import Image
import io
import base64
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        message = data.get('message', '')
        
        # Create a health-focused prompt
        health_prompt = f"""
        As a helpful health information assistant, please provide general guidance about the following question: {message}
        
        Important disclaimers to include:
        - This is general information only, not medical advice
        - Always consult healthcare professionals for proper diagnosis
        - Seek immediate medical attention for emergencies
        
        Please provide helpful, accurate information while emphasizing the importance of professional medical care.
        """
        
        response = model.generate_content(health_prompt)
        
        return jsonify({
            'success': True,
            'response': response.text
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    try:
        data = request.json
        image_data = data.get('image', '')
        additional_info = data.get('message', '')
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Create health assessment prompt
        health_prompt = f"""
        Please analyze this image for general health assessment purposes. 
        
        Additional context: {additional_info}
        
        Please provide:
        1. General observations about what you see
        2. Common signs that might suggest when to consult a healthcare provider
        3. General wellness tips
        
        IMPORTANT DISCLAIMERS TO ALWAYS INCLUDE:
        - This is NOT a medical diagnosis
        - Images cannot replace proper medical examination
        - Always consult qualified healthcare professionals for medical concerns
        - Seek immediate medical attention for serious symptoms or emergencies
        - This tool is for general information only
        
        Be helpful but emphasize the limitations of image-based assessment.
        """
        
        response = model.generate_content([health_prompt, image])
        
        return jsonify({
            'success': True,
            'response': response.text
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)