"""
Gmail Attachment Extractor to Google Drive

This script searches Gmail for emails with a specific subject and 
saves all attachments to Google Drive.

Prerequisites:
1. Install required packages:
   pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib

2. Enable Gmail API and Google Drive API in Google Cloud Console:
   - Go to https://console.cloud.google.com/
   - Create a new project or select an existing one
   - Enable Gmail API and Google Drive API
   - Create OAuth 2.0 credentials (Desktop app)
   - Download credentials and save as 'credentials.json' in the same folder

Usage:
    python gmail_attachment_extractor.py --subject "Invoice" --folder "Invoices"
"""

import os
import sys
import base64
import argparse
from pathlib import Path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from io import BytesIO

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent.absolute()

# If modifying these scopes, delete the file token.json
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/drive.file'
]


def authenticate():
    """Authenticates and returns Gmail and Drive service objects."""
    creds = None
    
    # Define paths relative to script directory
    credentials_path = SCRIPT_DIR / 'credentials.json'
    token_path = SCRIPT_DIR / 'token.json'
    
    print(f"Looking for credentials in: {SCRIPT_DIR}")
    
    # The file token.json stores the user's access and refresh tokens
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    
    # If there are no (valid) credentials available, let the user log in
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Error refreshing credentials: {e}")
                print("Deleting token.json and re-authenticating...")
                if token_path.exists():
                    token_path.unlink()
                creds = None
        
        if not creds or not creds.valid:
            if not credentials_path.exists():
                print(f"\nERROR: credentials.json not found at: {credentials_path}")
                print("\nPlease download OAuth credentials from Google Cloud Console")
                print("and save as 'credentials.json' in the same directory as this script:")
                print(f"  {SCRIPT_DIR}")
                print("\nSee README.md for detailed setup instructions.")
                sys.exit(1)
            
            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    str(credentials_path), SCOPES)
                # Use port=0 to automatically find an available port
                creds = flow.run_local_server(port=0, open_browser=True)
            except Exception as e:
                print(f"\nAuthentication failed: {e}")
                print("\nTroubleshooting tips:")
                print("1. Make sure credentials.json is valid")
                print("2. Check that Gmail API and Drive API are enabled")
                print("3. Try deleting token.json and re-authenticating")
                sys.exit(1)
        
        # Save the credentials for the next run
        with open(token_path, 'w') as token:
            token.write(creds.to_json())
    
    try:
        gmail_service = build('gmail', 'v1', credentials=creds)
        drive_service = build('drive', 'v3', credentials=creds)
    except Exception as e:
        print(f"Error building services: {e}")
        sys.exit(1)
    
    return gmail_service, drive_service


def find_or_create_folder(drive_service, folder_name):
    """Finds or creates a folder in Google Drive and returns its ID."""
    # Search for existing folder
    query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    results = drive_service.files().list(
        q=query,
        spaces='drive',
        fields='files(id, name)'
    ).execute()
    
    folders = results.get('files', [])
    
    if folders:
        print(f"Found existing folder: {folder_name}")
        return folders[0]['id']
    else:
        # Create new folder
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = drive_service.files().create(
            body=file_metadata,
            fields='id'
        ).execute()
        print(f"Created new folder: {folder_name}")
        return folder['id']


def search_emails(gmail_service, subject_query):
    """Searches for emails with the specified subject."""
    query = f'subject:"{subject_query}"'
    
    try:
        results = gmail_service.users().messages().list(
            userId='me',
            q=query
        ).execute()
        
        messages = results.get('messages', [])
        
        if not messages:
            print(f"No emails found with subject containing: {subject_query}")
            return []
        
        print(f"Found {len(messages)} email(s) matching the subject")
        return messages
    
    except Exception as e:
        print(f"An error occurred while searching emails: {e}")
        return []


def get_attachments(gmail_service, msg_id):
    """Extracts attachments from a specific email."""
    try:
        message = gmail_service.users().messages().get(
            userId='me',
            id=msg_id
        ).execute()
        
        attachments = []
        
        # Check if message has parts
        if 'parts' in message['payload']:
            for part in message['payload']['parts']:
                if part.get('filename'):
                    attachment = {
                        'filename': part['filename'],
                        'mimeType': part['mimeType'],
                        'attachmentId': part['body'].get('attachmentId')
                    }
                    attachments.append(attachment)
                
                # Check for nested parts (e.g., in multipart/alternative)
                if 'parts' in part:
                    for subpart in part['parts']:
                        if subpart.get('filename'):
                            attachment = {
                                'filename': subpart['filename'],
                                'mimeType': subpart['mimeType'],
                                'attachmentId': subpart['body'].get('attachmentId')
                            }
                            attachments.append(attachment)
        
        return attachments, message
    
    except Exception as e:
        print(f"An error occurred while getting attachments: {e}")
        return [], None


def download_attachment(gmail_service, msg_id, attachment_id):
    """Downloads an attachment from Gmail."""
    try:
        attachment = gmail_service.users().messages().attachments().get(
            userId='me',
            messageId=msg_id,
            id=attachment_id
        ).execute()
        
        data = attachment['data']
        file_data = base64.urlsafe_b64decode(data)
        
        return file_data
    
    except Exception as e:
        print(f"An error occurred while downloading attachment: {e}")
        return None


def upload_to_drive(drive_service, filename, file_data, mime_type, folder_id):
    """Uploads a file to Google Drive."""
    try:
        file_metadata = {
            'name': filename,
            'parents': [folder_id]
        }
        
        media = MediaIoBaseUpload(
            BytesIO(file_data),
            mimetype=mime_type,
            resumable=True
        )
        
        file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink'
        ).execute()
        
        print(f"  ✓ Uploaded: {filename}")
        print(f"    Link: {file.get('webViewLink')}")
        
        return file
    
    except Exception as e:
        print(f"  ✗ Failed to upload {filename}: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(
        description='Extract attachments from Gmail and save to Google Drive'
    )
    parser.add_argument(
        '--subject',
        required=True,
        help='Subject line to search for (e.g., "Invoice")'
    )
    parser.add_argument(
        '--folder',
        default='Email Attachments',
        help='Google Drive folder name (default: "Email Attachments")'
    )
    parser.add_argument(
        '--limit',
        type=int,
        default=None,
        help='Maximum number of emails to process (optional)'
    )
    
    args = parser.parse_args()
    
    print("Authenticating...")
    gmail_service, drive_service = authenticate()
    
    print(f"\nSearching for emails with subject: '{args.subject}'")
    messages = search_emails(gmail_service, args.subject)
    
    if not messages:
        return
    
    # Limit the number of messages if specified
    if args.limit:
        messages = messages[:args.limit]
        print(f"Processing first {args.limit} email(s)")
    
    print(f"\nFinding or creating Drive folder: '{args.folder}'")
    folder_id = find_or_create_folder(drive_service, args.folder)
    
    print("\nProcessing emails and extractments...")
    total_attachments = 0
    
    for i, message in enumerate(messages, 1):
        msg_id = message['id']
        attachments, msg_data = get_attachments(gmail_service, msg_id)
        
        if attachments:
            # Get email subject for display
            headers = msg_data['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
            
            print(f"\nEmail {i}/{len(messages)}: {subject}")
            print(f"Found {len(attachments)} attachment(s)")
            
            for attachment in attachments:
                if attachment['attachmentId']:
                    file_data = download_attachment(
                        gmail_service,
                        msg_id,
                        attachment['attachmentId']
                    )
                    
                    if file_data:
                        upload_to_drive(
                            drive_service,
                            attachment['filename'],
                            file_data,
                            attachment['mimeType'],
                            folder_id
                        )
                        total_attachments += 1
        else:
            print(f"\nEmail {i}/{len(messages)}: No attachments found")
    
    print(f"\n{'='*60}")
    print(f"Complete! Processed {total_attachments} attachment(s)")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()