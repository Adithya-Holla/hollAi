from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    raise ValueError("MONGODB_URI environment variable is not set")

client = MongoClient(MONGODB_URI)
db = client.hollai_db
messages = db.messages

@app.route('/api/contact', methods=['POST'])
def contact():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        subject = data.get('subject')
        message = data.get('message')

        # Validate required fields
        if not all([name, email, message]):  # subject is optional
            return jsonify({'error': 'Name, email, and message are required'}), 400

        # Create message document
        message_doc = {
            'name': name,
            'email': email,
            'subject': subject or 'No subject',  # Default subject if not provided
            'message': message,
            'timestamp': datetime.utcnow()
        }

        # Insert into MongoDB
        result = messages.insert_one(message_doc)

        if result.inserted_id:
            return jsonify({
                'message': 'Message sent successfully',
                'id': str(result.inserted_id)
            }), 201
        else:
            return jsonify({'error': 'Failed to send message'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True) 