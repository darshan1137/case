import os
from dotenv import load_dotenv

load_dotenv()

# Groq Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Firebase Configuration
FIREBASE_CONFIG = {
    "apiKey": os.getenv("FIREBASE_API_KEY"),
    "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
    "projectId": os.getenv("FIREBASE_PROJECT_ID"),
    "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
    "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
    "appId": os.getenv("FIREBASE_APP_ID"),
    "measurementId": os.getenv("FIREBASE_MEASUREMENT_ID"),
}

# Model Configuration
ISSUE_TYPES = ["Pothole", "Garbage", "Broken Pipe", "Other"]
CONFIDENCE_THRESHOLD = 0.7

# Server Configuration
API_TITLE = "Citizen Reporting API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "AI-powered citizen reporting system for infrastructure issues"
