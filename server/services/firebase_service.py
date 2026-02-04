import firebase_admin
from firebase_admin import credentials, firestore
from typing import Dict, Any, Optional
from datetime import datetime
import json
import os
from config import FIREBASE_CONFIG


class FirebaseService:
    """Service to handle Firebase operations"""
    
    _instance = None
    _db = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Firebase connection"""
        if self._db is None:
            try:
                # Initialize Firebase Admin SDK
                if not firebase_admin._apps:
                    # Try to use service account JSON file first
                    service_account_path = os.path.join(os.path.dirname(__file__), "..", "serviceAccountKey.json")
                    if os.path.exists(service_account_path):
                        cred = credentials.Certificate(service_account_path)
                    else:
                        # Fallback to config dictionary
                        cred = credentials.Certificate(FIREBASE_CONFIG)
                    firebase_admin.initialize_app(cred)
                self._db = firestore.client()
                print("Firebase initialized successfully")
            except Exception as e:
                print(f"Firebase initialization error: {e}")
                self._db = None
    
    def save_ticket(self, ticket_data: Dict[str, Any]) -> Optional[str]:
        """
        Save a ticket to Firestore
        
        Args:
            ticket_data: Dictionary containing ticket information
            
        Returns:
            Ticket ID if successful, None otherwise
        """
        try:
            if self._db is None:
                raise Exception("Firebase not initialized")
            
            # Add timestamps
            ticket_data["created_at"] = datetime.utcnow()
            ticket_data["updated_at"] = datetime.utcnow()
            
            # Save to Firestore
            doc_ref = self._db.collection("tickets").add(ticket_data)
            ticket_id = doc_ref[1].id
            
            print(f"Ticket saved successfully with ID: {ticket_id}")
            return ticket_id
        except Exception as e:
            print(f"Error saving ticket to Firebase: {e}")
            return None
    
    def get_ticket(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a ticket from Firestore
        
        Args:
            ticket_id: ID of the ticket
            
        Returns:
            Ticket data if found, None otherwise
        """
        try:
            if self._db is None:
                raise Exception("Firebase not initialized")
            
            doc = self._db.collection("tickets").document(ticket_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"Error fetching ticket from Firebase: {e}")
            return None
    
    def update_ticket(self, ticket_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update a ticket in Firestore
        
        Args:
            ticket_id: ID of the ticket
            update_data: Data to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if self._db is None:
                raise Exception("Firebase not initialized")
            
            update_data["updated_at"] = datetime.utcnow()
            self._db.collection("tickets").document(ticket_id).update(update_data)
            print(f"Ticket {ticket_id} updated successfully")
            return True
        except Exception as e:
            print(f"Error updating ticket: {e}")
            return False
    
    def list_tickets(self, filters: Optional[Dict[str, Any]] = None) -> list:
        """
        List tickets from Firestore
        
        Args:
            filters: Optional filters to apply
            
        Returns:
            List of tickets
        """
        try:
            if self._db is None:
                raise Exception("Firebase not initialized")
            
            query = self._db.collection("tickets")
            
            if filters:
                for key, value in filters.items():
                    query = query.where(key, "==", value)
            
            docs = query.stream()
            tickets = []
            for doc in docs:
                ticket = doc.to_dict()
                ticket["id"] = doc.id
                tickets.append(ticket)
            
            return tickets
        except Exception as e:
            print(f"Error listing tickets: {e}")
            return []


firebase_service = FirebaseService()
