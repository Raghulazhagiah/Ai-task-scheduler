from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os.path
import base64
from email.mime.text import MIMEText

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes (consider restricting this in production)

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'agency_db'
}

# Gmail API scope
SCOPES = []


def get_gmail_service():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('cred.json', SCOPES)
            creds = flow.run_local_server(port=8081)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    service = build('gmail', 'v1', credentials=creds)
    return service

def create_message(sender, receiver, subject, message_text):
    message = MIMEText(message_text)
    message['to'] = receiver
    message['from'] = sender
    message['subject'] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    return {'raw': raw}

def send_message(service, user_id, message):
    try:
        message = service.users().messages().send(userId=user_id, body=message).execute()
        print('Message Id:', message['id'])
        return message
    except Exception as error:
        print(f'An error occurred: {error}')
        return None

@app.route('/get-email-details/<int:task_id>', methods=['GET'])
def get_email_details(task_id):
    # Fetch email details from the database based on task_id
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor(dictionary=True)
        
        query = '''
            SELECT sender, receiver, subject, response 
            FROM new_table1 
            WHERE id = %s
        '''
        cursor.execute(query, (task_id,))
        email_details = cursor.fetchone()

        if not email_details:
            return jsonify({'error': 'No data found for the provided ID'}), 404

        return jsonify(email_details)

    except mysql.connector.Error as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Failed to retrieve data from the database'}), 500
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/send-email/<int:task_id>', methods=['POST'])
def send_email(task_id):
    data = request.json
    message_text = data.get('message')
    
    if not message_text:
        return jsonify({'error': 'Message content is required'}), 400
    
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor(dictionary=True)
        
        query = '''
            SELECT sender, receiver, subject 
            FROM new_table1 
            WHERE id = %s
        '''
        cursor.execute(query, (task_id,))
        email_data = cursor.fetchone()

        if not email_data:
            return jsonify({'error': 'No data found for the provided ID'}), 404

        sender = email_data['receiver']
        receiver = email_data['sender']
        subject = email_data['subject']
        
        # Send the email using Gmail API
        service = get_gmail_service()
        message = create_message(sender, receiver, subject, message_text)
        send_message(service, 'me', message)
        
        return jsonify({'status': 'Email sent successfully!'}), 200

    except mysql.connector.Error as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Failed to retrieve data from the database'}), 500
    
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({'error': 'Failed to send email'}), 500
    
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8082, debug=True)
