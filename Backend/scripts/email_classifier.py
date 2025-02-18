import os
import openai
import json
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import mysql.connector
from mysql.connector import Error
from datetime import datetime
import re

# Set up OpenAI API key
openai.api_key = ""

# Gmail API scope
SCOPES = []

def authenticate_gmail():
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

def classify_email_with_gpt(email_content):
    try:
        prompt = (
            "Classify the following email as 'important' or 'not important'. If the email is important, provide a meaningful task name that summarizes the action required. Additionally, generate an appropriate subject and a detailed body for a reply email. If the email is not important, indicate that no response is necessary.\n\n"
            f"Email Content: {email_content}\n\n"
            "Please provide the response in this format:\n"
            "- **Classification**: [important/not important]\n"
            "- **Task Name**: [Task name if important, or N/A if not important]\n"
            "- **Reply Subject**: [Subject of the reply email, without 'Re:', or N/A if not applicable]\n"
            "- **Summary**: [Provide a brief summary of the email content]\n"
            "- **To-Do List**: [List of actions required if important and multiple actions are necessary, or N/A if not applicable]\n"
            "- **Reply Body**: [Detailed body of the reply email, or N/A if not applicable]\n\n"
            "Guidelines:\n"
            "- **Summary**: Summarize the main points of the email briefly.\n"
            "- **To-Do List**: If the email requires multiple actions, list them as a to-do list. If only one action or none is required, indicate 'N/A'.\n\n"
            "Response:"
        )

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{
                "role": "user", 
                "content": prompt
            }],
            max_tokens=300,
            temperature=0.7,
        )

        content = response['choices'][0]['message']['content'].strip()
        print("Raw Response:", content)  # Debugging statement

        # Split the response by lines and strip extra whitespace
        lines = [line.strip() for line in content.splitlines() if line.strip()]

        # Initialize variables
        classification = None
        task_name = None
        reply_subject = None
        summary = None
        todo_list = None
        reply_body = None

        # Flags to track section parsing
        in_todo_list = False
        in_reply_body = False

        # Buffers to accumulate section content
        todo_list_lines = []
        reply_body_lines = []

        # Iterate through lines and extract data based on labels
        for line in lines:
            if line.startswith("- **Classification**:"):
                classification = line.split(": ")[1].strip().lower()
            elif line.startswith("- **Task Name**:"):
                task_name = line.split(": ")[1].strip() if classification == 'important' else 'N/A'
            elif line.startswith("- **Reply Subject**:"):
                reply_subject = line.split(": ")[1].strip() if classification == 'important' else 'N/A'
                if reply_subject.startswith("Re: "):
                    reply_subject = reply_subject[3:].strip()
            elif line.startswith("- **Summary**:"):
                summary = line.split(": ")[1].strip() if classification == 'important' else 'N/A'
            elif line.startswith("- **To-Do List**:"):
                in_todo_list = True
                todo_list_lines = []
            elif in_todo_list and not line.startswith("- **Reply Body**:"):
                todo_list_lines.append(line.strip())
            elif line.startswith("- **Reply Body**:"):
                in_todo_list = False
                in_reply_body = True
                # Collect all remaining lines for the reply body
                reply_body_lines = []
            elif in_reply_body:
                reply_body_lines.append(line.strip())

        todo_list = "\n".join(todo_list_lines).strip() if todo_list_lines else 'N/A'
        reply_body = "\n".join(reply_body_lines).strip() if reply_body_lines else 'N/A'

        return classification, task_name, reply_subject, summary, todo_list, reply_body

    except Exception as e:
        print(f"Error communicating with OpenAI API: {e}")
        return None, None, None, None, None, None


def get_processed_email_ids():
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='root',
            database='agency_db'
        )
        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute("SELECT email_id FROM processed_emails;")
            processed_ids = cursor.fetchall()
            return [id[0] for id in processed_ids]
    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
        return []
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals() and connection.is_connected():
            connection.close()

def mark_as_processed(email_id):
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='root',
            database='agency_db'
        )
        if connection.is_connected():
            cursor = connection.cursor()
            cursor.execute("INSERT INTO processed_emails (email_id) VALUES (%s)", (email_id,))
            connection.commit()
            print(f"Email ID {email_id} marked as processed.")
    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals() and connection.is_connected():
            connection.close()

def add_task_to_db(name, task_name, reply_subject, reply_body, sender, receiver, summary, to_do_list):
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='root',
            database='agency_db'
        )
        if connection.is_connected():
            def extract_email(full_string):
                 # Regular expression to match the email address within angle brackets
                 match = re.search(r'<(.*?)>', full_string)
                 if match:
                     return match.group(1).strip()
                 return full_string.strip()
            receiver = extract_email(receiver)
            cursor = connection.cursor()
            sql = 'INSERT INTO new_table1 (name, task, created_at, email, subject, response, sender, receiver, summary, to_do_list, email_id) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)'
            created_at = datetime.now()
            cursor.execute(sql, (name, task_name, created_at, 1, reply_subject, reply_body, sender, receiver, summary, to_do_list, receiver))
            connection.commit()
            print("Task added successfully!")
    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'connection' in locals() and connection.is_connected():
            connection.close()

def main():
    service = authenticate_gmail()

    processed_email_ids = get_processed_email_ids()
    results = service.users().messages().list(userId='me', maxResults=1).execute()
    messages = results.get('messages', [])

    if not messages: 
        print('No new messages.')
        return

    for message in messages:
        email_id = message['id']
        if email_id in processed_email_ids:
            continue
        
        msg = service.users().messages().get(userId='me', id=email_id).execute()
        snippet = msg['snippet']
        headers = msg['payload']['headers']
        
        sender = next((header['value'] for header in headers if header['name'].lower() == 'from'), 'Unknown Sender')
        receiver = next((header['value'] for header in headers if header['name'].lower() == 'to'), 'Unknown Receiver')
        subject = next((header['value'] for header in headers if header['name'].lower() == 'subject'), 'No Subject')

        email_content = f"Sender: {sender}\nSubject: {subject}\nContent: {snippet}"
        classification, task_name, reply_subject, summary, to_do_list, reply_body = classify_email_with_gpt(email_content)

        if classification.lower() == 'important':
            print('Important')
            add_task_to_db(sender, task_name, reply_subject, reply_body, sender, receiver, summary, to_do_list)
        else:
            print('Not Important')

        mark_as_processed(email_id)

        print(f"Email from: {sender}")
        print(f"Subject: {subject}")
        print(f"Classification: {classification}")
        if task_name:
            print(f"Task Name: {task_name}")
            print(f"Task Name: {summary}")
            print(f"Task Name: {to_do_list}")
        if reply_subject:
            print(f"Reply Subject: {reply_subject}")
            print(f"Reply Body: {reply_body}\n")
        else:
            print("No task created and no reply sent.\n")

if __name__ == '__main__':
    main()
