from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import base64
import io
from PIL import Image
import os
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

# In-memory storage for chat sessions (use Redis/Database in production)
chat_sessions = {}

class ChatSession:
    def __init__(self, session_id):
        self.session_id = session_id
        self.chat_history = []
        self.initial_assessment = None
        self.baby_info = None
        self.created_at = datetime.now()

def process_image(base64_string):
    """Convert base64 image to PIL Image for Gemini API"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 to bytes
        image_data = base64.b64decode(base64_string)
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_data))
        return image
    except Exception as e:
        print(f"Error processing image: {e}")
        return None

def create_baby_assessment_prompt(form_data):
    """Create a comprehensive prompt for baby health assessment"""

    prompt = """You are a pediatric health AI assistant who is trying to provide assistance
    to new parents regarding their child and its health. When speaking to the parents,
    remember to be respectful, sounding caring/genuine, and calming because they are more likely already nervous. 
    Please analyze the provided information about a baby and give a preliminary health assessment and keep responses concise/to the point
     while adhering to the below.

IMPORTANT DISCLAIMERS:
- This is NOT an official medical diagnosis
- Always recommend consulting a pediatrician for any health concerns
- If symptoms suggest urgent care is needed, clearly state this

ACCURACY RATING REQUIREMENT:
- For each possible condition or assessment you mention, include a confidence/accuracy rating in brackets
- Use percentages like [85% match], [72% confidence], [90% likely], etc.
- Base ratings on how well the symptoms align with typical presentations
- Be conservative with high percentages (90%+) and use them only for very clear symptom matches
- Use lower percentages (50-70%) when symptoms are ambiguous or could indicate multiple conditions

Baby Information:
"""
    
    # Location of issues
    if form_data.get('location'):
        locations = ', '.join(form_data['location'])
        prompt += f"• Affected body areas: {locations}\n"
    
    # Feeding and stool information
    if form_data.get('feedingType'):
        prompt += f"• Feeding type: {form_data['feedingType']}\n"
    
    if form_data.get('stoolColor'):
        prompt += f"• Stool color: {form_data['stoolColor']}\n"
    
    # Numerical data
    if form_data.get('numberText'):
        prompt += f"• Number/frequency details: {form_data['numberText']}\n"
    
    if form_data.get('durationText'):
        prompt += f"• Duration: {form_data['durationText']}\n"
    
    if form_data.get('temperatureText'):
        prompt += f"• Temperature: {form_data['temperatureText']}\n"
    
    # Extra notes
    if form_data.get('extraNotes'):
        prompt += f"• Additional notes: {form_data['extraNotes']}\n"
    
    prompt += """
Please provide:
1. A preliminary assessment of the symptoms with accuracy ratings [XX% match/confidence/likely]
2. Possible explanations (common, benign causes first) with confidence levels [XX%]
3. Warning signs that would require immediate medical attention
4. General care recommendations
5. When to contact a pediatrician

EXAMPLES of how to include accuracy ratings:
- "This appears to be normal infant skin irritation [82% match]"
- "Possible diaper rash [75% likely] based on the described symptoms"
- "The fever pattern suggests a viral infection [68% confidence]"

If an image is provided, please analyze any visible symptoms or conditions and include accuracy ratings for your visual assessment.

Keep your response clear, reassuring when appropriate, but always err on the side of caution regarding baby health.
"""
    
    return prompt

@app.route('/submit-assessment', methods=['POST'])
def submit_assessment():
    """Handle initial baby health assessment submission"""
    try:
        data = request.get_json()
        
        # Create new chat session
        session_id = str(uuid.uuid4())
        chat_session = ChatSession(session_id)
        
        # Store baby information
        baby_info = {
            'location': data.get('location', []),
            'feedingType': data.get('feedingType', ''),
            'stoolColor': data.get('stoolColor', ''),
            'numberText': data.get('numberText', ''),
            'durationText': data.get('durationText', ''),
            'temperatureText': data.get('temperatureText', ''),
            'extraNotes': data.get('extraNotes', ''),
            'hasImage': bool(data.get('image'))
        }
        
        chat_session.baby_info = baby_info
        
        # Create assessment prompt
        prompt = create_baby_assessment_prompt(baby_info)
        
        # Process image if provided
        image = None
        if data.get('image'):
            image = process_image(data['image'])
            if image is None:
                return jsonify({'error': 'Failed to process image'}), 400
        
        # Generate response from Gemini
        try:
            if image:
                response = model.generate_content([prompt, image])
            else:
                response = model.generate_content(prompt)
            
            assessment_result = response.text
            
            # Store initial assessment and conversation
            chat_session.initial_assessment = assessment_result
            chat_session.chat_history.append({
                'type': 'assessment',
                'prompt': prompt,
                'response': assessment_result,
                'timestamp': datetime.now().isoformat()
            })
            
            # Store session
            chat_sessions[session_id] = chat_session
            
            return jsonify({
                'session_id': session_id,
                'assessment': assessment_result,
                'success': True
            })
            
        except Exception as e:
            print(f"Gemini API error: {e}")
            return jsonify({'error': 'Failed to generate assessment'}), 500
            
    except Exception as e:
        print(f"Error in submit_assessment: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """Handle follow-up chat messages"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        user_message = data.get('message')
        
        if not session_id or not user_message:
            return jsonify({'error': 'Missing session_id or message'}), 400
        
        # Get chat session
        if session_id not in chat_sessions:
            return jsonify({'error': 'Invalid session_id'}), 404
        
        chat_session = chat_sessions[session_id]
        
        # Create context-aware prompt for follow-up questions
        context_prompt = f"""You are continuing a conversation about a baby's health. 

IMPORTANT: When providing assessments or identifying conditions, always include accuracy/confidence ratings in brackets like [XX% match], [XX% confidence], or [XX% likely].

PREVIOUS ASSESSMENT CONTEXT:
{chat_session.initial_assessment}

BABY INFORMATION:
"""
        
        baby_info = chat_session.baby_info
        for key, value in baby_info.items():
            if value and key != 'hasImage':
                context_prompt += f"• {key}: {value}\n"
        
        context_prompt += f"""
CHAT HISTORY:
"""
        
        # Add recent chat history (last 5 exchanges)
        recent_history = chat_session.chat_history[-5:]
        for exchange in recent_history:
            if exchange['type'] == 'chat':
                context_prompt += f"User: {exchange['user_message']}\n"
                context_prompt += f"Assistant: {exchange['response']}\n"
        
        context_prompt += f"""
CURRENT USER QUESTION: {user_message}

Please respond to the user's question while maintaining context of the baby's condition and previous conversation. 
Continue to emphasize that this is not medical advice and recommend consulting a pediatrician when appropriate.
REMEMBER: Include accuracy/confidence ratings in brackets [XX%] for any medical assessments or condition identifications.

EXAMPLES:
- "That symptom could indicate teething [75% likely]"
- "The described behavior is typical for this age [88% normal]"
- "This might be a growth spurt [70% confidence]"
"""
        
        # Generate response
        try:
            response = model.generate_content(context_prompt)
            bot_response = response.text
            
            # Store in chat history
            chat_session.chat_history.append({
                'type': 'chat',
                'user_message': user_message,
                'response': bot_response,
                'timestamp': datetime.now().isoformat()
            })
            
            return jsonify({
                'response': bot_response,
                'success': True
            })
            
        except Exception as e:
            print(f"Gemini API error in chat: {e}")
            return jsonify({'error': 'Failed to generate response'}), 500
            
    except Exception as e:
        print(f"Error in chat: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/get-session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get session information and chat history"""
    if session_id not in chat_sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    chat_session = chat_sessions[session_id]
    
    return jsonify({
        'session_id': session_id,
        'initial_assessment': chat_session.initial_assessment,
        'baby_info': chat_session.baby_info,
        'chat_history': chat_session.chat_history,
        'created_at': chat_session.created_at.isoformat()
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    # Make sure GEMINI_API_KEY environment variable is set
    if not os.getenv('GEMINI_API_KEY'):
        print("WARNING: GEMINI_API_KEY environment variable not set!")
        print("Please set it with: export GEMINI_API_KEY='your-api-key-here'")
    
    app.run(debug=True, host='0.0.0.0', port=5000)