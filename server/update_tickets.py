"""
Script to update all tickets in Firebase:
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
    # App already initialized
    pass

db = firestore.client()


def generate_ticket_id():
    """
    Generate a unique ticket ID in format: TICKET-{timestamp}-{random_string}
    """
    timestamp = int(time.time() * 1000)  # Milliseconds
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"TICKET-{timestamp}-{random_suffix}"


def update_all_tickets():
    """
    Update all tickets in Firebase with ticket_id and status
    """
    try:
        # Get all tickets
        tickets_ref = db.collection('tickets')
        tickets = tickets_ref.stream()
        
        updated_count = 0
        skipped_count = 0
        
        print("Starting ticket update process...\n")
        
        for ticket_doc in tickets:
            ticket_id = ticket_doc.id
            ticket_data = ticket_doc.to_dict()
            
            updates = {}
            
            # Check if ticket_id field exists
            if 'ticket_id' not in ticket_data or not ticket_data.get('ticket_id'):
                new_ticket_id = generate_ticket_id()
                updates['ticket_id'] = new_ticket_id
                print(f"✓ Ticket {ticket_id}: Adding ticket_id = {new_ticket_id}")
            else:
                print(f"→ Ticket {ticket_id}: ticket_id already exists = {ticket_data['ticket_id']}")
            
            # Update status to 'pending'
            current_status = ticket_data.get('status', 'unknown')
            if current_status != 'pending':
                updates['status'] = 'pending'
                print(f"✓ Ticket {ticket_id}: Changing status from '{current_status}' to 'pending'")
            else:
                print(f"→ Ticket {ticket_id}: Status already 'pending'")
            
            # Add updated_at timestamp
            if updates:
                updates['updated_at'] = datetime.utcnow().isoformat() + 'Z'
                
                # Update the ticket in Firebase
                tickets_ref.document(ticket_id).update(updates)
                updated_count += 1
                print(f"✅ Updated ticket {ticket_id}\n")
            else:
                skipped_count += 1
                print(f"⊘ No updates needed for ticket {ticket_id}\n")
        
        print("="*60)
        print(f"Update Complete!")
        print(f"Total tickets updated: {updated_count}")
        print(f"Total tickets skipped (no changes needed): {skipped_count}")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error updating tickets: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("="*60)
    print("Firebase Ticket Update Script")
    print("="*60)
    print("This script will:")
    print("1. Add unique ticket_id to all tickets that don't have one")
    print("2. Set status to 'pending' for all tickets")
    print("="*60)
    
    # Ask for confirmation
    response = input("\nDo you want to proceed? (yes/no): ").strip().lower()
    
    if response in ['yes', 'y']:
        update_all_tickets()
    else:
        print("\n❌ Update cancelled by user")
