"""
Automatic script to update all tickets in Firebase (no confirmation needed)
1. Add unique ticket_id to tickets that don't have one
2. Set status to 'pending' for all tickets
"""

import firebase_admin
from firebase_admin import credentials, firestore
import time
import random
import string
from datetime import datetime
import os

# Initialize Firebase Admin SDK
script_dir = os.path.dirname(os.path.abspath(__file__))
service_account_path = os.path.join(script_dir, "serviceAccountKey.json")
cred = credentials.Certificate(service_account_path)
try:
    firebase_admin.initialize_app(cred)
except ValueError:
    pass

db = firestore.client()


def generate_ticket_id():
    """Generate unique ticket ID: TICKET-{timestamp}-{random_string}"""
    timestamp = int(time.time() * 1000)
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"TICKET-{timestamp}-{random_suffix}"


def main():
    """Update all tickets automatically"""
    tickets_ref = db.collection('tickets')
    tickets = tickets_ref.stream()
    
    updated = 0
    
    for ticket_doc in tickets:
        ticket_id = ticket_doc.id
        ticket_data = ticket_doc.to_dict()
        updates = {}
        
        # Add ticket_id if missing
        if 'ticket_id' not in ticket_data or not ticket_data.get('ticket_id'):
            updates['ticket_id'] = generate_ticket_id()
        
        # Set status to pending
        if ticket_data.get('status') != 'pending':
            updates['status'] = 'pending'
        
        # Update if needed
        if updates:
            updates['updated_at'] = datetime.utcnow().isoformat() + 'Z'
            tickets_ref.document(ticket_id).update(updates)
            updated += 1
            print(f"✓ Updated {ticket_id}")
    
    print(f"\n✅ Complete! Updated {updated} tickets")


if __name__ == "__main__":
    main()
