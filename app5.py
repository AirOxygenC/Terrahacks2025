from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import google.generativeai as genai
import base64
import io
from PIL import Image
import os
from datetime import datetime, timedelta
import uuid
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///baby_health.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database Models
class ChatSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    last_activity = db.Column(db.DateTime, default=datetime.now)
    initial_assessment = db.Column(db.Text)
    baby_info = db.Column(db.JSON)
    responses = db.relationship('ChatResponse', backref='session', lazy=True, cascade='all, delete-orphan')

class ChatResponse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), db.ForeignKey('chat_session.session_id'), nullable=False)
    response_text = db.Column(db.Text, nullable=False)
    user_message = db.Column(db.Text)
    response_type = db.Column(db.String(20), default='chat')  # 'assessment' or 'chat'
    created_at = db.Column(db.DateTime, default=datetime.now)

# Create tables
with app.app_context():
    db.create_all()

# Configure Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

def cleanup_old_sessions():
    """Clean up sessions and responses older than 1 week"""
    try:
        one_week_ago = datetime.now() - timedelta(days=7)
        
        # Delete old responses first (due to foreign key constraint)
        old_responses = ChatResponse.query.join(ChatSession).filter(
            ChatSession.last_activity < one_week_ago
        ).delete(synchronize_session=False)
        
        # Delete old sessions
        old_sessions = ChatSession.query.filter(
            ChatSession.last_activity < one_week_ago
        ).delete()
        
        db.session.commit()
        print(f"Cleaned up {old_sessions} sessions and {old_responses} responses")
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.session.rollback()

def get_session_context(session_id, limit=5):
    """Get recent chat history for context"""
    try:
        recent_responses = ChatResponse.query.filter_by(
            session_id=session_id
        ).order_by(ChatResponse.created_at.desc()).limit(limit).all()
        
        context = []
        for response in reversed(recent_responses):  # Reverse to get chronological order
            if response.response_type == 'chat' and response.user_message:
                context.append({
                    'user_message': response.user_message,
                    'response': response.response_text,
                    'timestamp': response.created_at.isoformat()
                })
        
        return context
    except Exception as e:
        print(f"Error getting session context: {e}")
        return []

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

def create_baby_assessment_prompt(form_data, historical_context=None):
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
        prompt += f"• Age (in months): {form_data['numberText']}\n"
    
    if form_data.get('durationText'):
        prompt += f"• Duration: {form_data['durationText']}\n"
    
    if form_data.get('temperatureText'):
        prompt += f"• Temperature: {form_data['temperatureText']} °C (Celsius)\n"
    
    # Extra notes
    if form_data.get('extraNotes'):
        prompt += f"• Additional notes: {form_data['extraNotes']}\n"
    
    # Add historical context if available
    if historical_context:
        prompt += f"\nPREVIOUS ASSESSMENTS FOR THIS BABY:\n{historical_context}\n"
    
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
        
        # Get or create session
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        # Check if session exists in database
        chat_session = ChatSession.query.filter_by(session_id=session_id).first()
        
        if not chat_session:
            # Create new session
            baby_info = {
                'location': data.get('location', []),
                'feedingType': data.get('feedingType', ''),
                'stoolColor': data.get('stoolColor', ''),
                'Age (in months)': data.get('numberText', ''),
                'durationText': data.get('durationText', ''),
                'temperatureText': data.get('temperatureText', ''),
                'extraNotes': data.get('extraNotes', ''),
                'hasImage': bool(data.get('image'))
            }
            
            chat_session = ChatSession(
                session_id=session_id,
                baby_info=baby_info
            )
            db.session.add(chat_session)
        else:
            # Update existing session activity
            chat_session.last_activity = datetime.now()
            baby_info = chat_session.baby_info or {}
        
        # Get historical context for this baby
        historical_context = None
        if chat_session.initial_assessment:
            historical_context = f"Previous assessment: {chat_session.initial_assessment[:500]}..."
        
        # Create assessment prompt
        prompt = create_baby_assessment_prompt(baby_info, historical_context)
        
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
            
            # Store initial assessment if this is first time
            if not chat_session.initial_assessment:
                chat_session.initial_assessment = assessment_result
            
            # Store response in database
            chat_response = ChatResponse(
                session_id=session_id,
                response_text=assessment_result,
                response_type='assessment'
            )
            db.session.add(chat_response)
            db.session.commit()
            
            # Clean up old sessions (run occasionally)
            # You might want to run this as a background job instead
            if datetime.now().hour == 2 and datetime.now().minute < 5:  # Run at 2 AM
                cleanup_old_sessions()
            
            return jsonify({
                'session_id': session_id,
                'assessment': assessment_result,
                'success': True
            })
            
        except Exception as e:
            db.session.rollback()
            print(f"Gemini API error: {e}")
            return jsonify({'error': 'Failed to generate assessment'}), 500
            
    except Exception as e:
        db.session.rollback()
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
        
        # Get chat session from database
        chat_session = ChatSession.query.filter_by(session_id=session_id).first()
        if not chat_session:
            return jsonify({'error': 'Invalid session_id'}), 404
        
        # Update last activity
        chat_session.last_activity = datetime.now()
        
        # Get recent chat history for context
        recent_history = get_session_context(session_id)
        
        # Create context-aware prompt for follow-up questions
        context_prompt = f"""You are continuing a conversation about a baby's health. 

IMPORTANT: When providing assessments or identifying conditions, always include accuracy/confidence ratings in brackets like [XX% match], [XX% confidence], or [XX% likely].

PREVIOUS ASSESSMENT CONTEXT:
{chat_session.initial_assessment}

BABY INFORMATION:
"""
        
        baby_info = chat_session.baby_info or {}
        for key, value in baby_info.items():
            if value and key != 'hasImage':
                context_prompt += f"• {key}: {value}\n"
        
        context_prompt += f"""
RECENT CHAT HISTORY:
"""
        
        # Add recent chat history
        for exchange in recent_history:
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
            
            # Store in database
            chat_response = ChatResponse(
                session_id=session_id,
                response_text=bot_response,
                user_message=user_message,
                response_type='chat'
            )
            db.session.add(chat_response)
            db.session.commit()
            
            return jsonify({
                'response': bot_response,
                'success': True
            })
            
        except Exception as e:
            db.session.rollback()
            print(f"Gemini API error in chat: {e}")
            return jsonify({'error': 'Failed to generate response'}), 500
            
    except Exception as e:
        db.session.rollback()
        print(f"Error in chat: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/get-session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get session information and chat history"""
    try:
        chat_session = ChatSession.query.filter_by(session_id=session_id).first()
        if not chat_session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Get all responses for this session
        responses = ChatResponse.query.filter_by(session_id=session_id).order_by(ChatResponse.created_at).all()
        
        chat_history = []
        for response in responses:
            chat_history.append({
                'type': response.response_type,
                'response': response.response_text,
                'user_message': response.user_message,
                'timestamp': response.created_at.isoformat()
            })
        
        return jsonify({
            'session_id': session_id,
            'initial_assessment': chat_session.initial_assessment,
            'baby_info': chat_session.baby_info,
            'chat_history': chat_history,
            'created_at': chat_session.created_at.isoformat(),
            'last_activity': chat_session.last_activity.isoformat()
        })
        
    except Exception as e:
        print(f"Error getting session: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/cleanup-old-sessions', methods=['POST'])
def manual_cleanup():
    """Manually trigger cleanup of old sessions"""
    try:
        cleanup_old_sessions()
        return jsonify({'message': 'Cleanup completed successfully'})
    except Exception as e:
        return jsonify({'error': f'Cleanup failed: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        session_count = ChatSession.query.count()
        response_count = ChatResponse.query.count()
        
        return jsonify({
            'status': 'healthy', 
            'timestamp': datetime.now().isoformat(),
            'database': 'connected',
            'sessions': session_count,
            'responses': response_count
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.now().isoformat(),
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Make sure GEMINI_API_KEY environment variable is set
    if not os.getenv('GEMINI_API_KEY'):
        print("WARNING: GEMINI_API_KEY environment variable not set!")
        print("Please set it with: export GEMINI_API_KEY='your-api-key-here'")
    
    app.run(debug=True, host='0.0.0.0', port=5000)