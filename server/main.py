from fastapi import FastAPI, APIRouter, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import Optional
import os

from config import API_TITLE, API_VERSION, API_DESCRIPTION
from services.ai_services import ai_service
from services.firebase_service import firebase_service
from services.ward_service import ward_service
# from models.ticket import AIValidationResponse, TicketResponse  # Uncomment when models are created


# Initialize FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Root endpoint - API information"""
    return {
        "name": API_TITLE,
        "version": API_VERSION,
        "description": API_DESCRIPTION,
        "features": [
            "Citizen Reporting with AI Validation (Feature 1)",
            "Resource Optimization with IoT Dashboard (Feature 3)"
        ],
        "endpoints": {
            "health": "/health",
            "validate_image": "/api/tickets/validate-image",
            "get_ticket": "/api/tickets/{ticket_id}",
            "list_tickets": "/api/tickets/",
            "update_ticket": "/api/tickets/{ticket_id}",
        }
    }


# Health check endpoint
@app.get("/health", tags=["health"])
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "version": API_VERSION}


# Tickets Router
router = APIRouter(prefix="/api/tickets", tags=["tickets"])


@router.post(
    "/validate-image",
    summary="Validate image and create ticket",
    description="Upload an image to validate for infrastructure issues (Pothole, Garbage, Broken Pipe)"
)
async def validate_image_and_create_ticket(
    file: UploadFile = File(..., description="Image file (JPG, PNG, etc.)"),
    latitude: float = Form(..., description="Latitude of the location"),
    longitude: float = Form(..., description="Longitude of the location"),
    description: Optional[str] = Form(None, description="Optional description from user"),
):
    """
    Validate an uploaded image for infrastructure issues and automatically create a ticket if detected.
    
    - **file**: Image file to validate
    - **latitude**: GPS latitude coordinate
    - **longitude**: GPS longitude coordinate
    - **description**: Optional user description
    
    Returns validation result and ticket ID if detected
    """
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )
        
        # Validate file extension
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File format not supported. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Validate file size (max 10MB)
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size too large. Maximum 10MB allowed"
            )
        
        # Validate coordinates
        if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid latitude or longitude"
            )
        
        # Call AI validation service
        validation_result = ai_service.validate_image(file_content)
        
        # If detected, save ticket to Firebase
        ticket_id = None
        if validation_result.get("detected"):
            # Generate ticket ID
            import uuid
            ticket_num = str(uuid.uuid4())[:8].upper()
            generated_ticket_id = f"TKT-{ticket_num}"
            
            # Get ward based on coordinates
            ward_code, ward_info = ward_service.get_ward_by_coordinates(latitude, longitude)
            
            ticket_data = {
                "ticket_id": generated_ticket_id,
                "issue_type": validation_result.get("issue_type"),
                "status": "open",
                "priority": _determine_priority(validation_result.get("confidence_score")),
                
                "latitude": latitude,
                "longitude": longitude,
                "area_name": "Unknown",  # Can be enhanced with reverse geocoding
                "ward": ward_code if ward_code else "Unknown",
                
                "title": validation_result.get("title", "Infrastructure Issue Reported"),
                "description": description or validation_result.get("description"),
                "severity_level": validation_result.get("severity_level", "moderate"),
                
                "department": validation_result.get("department", "Other"),
                "sub_department": validation_result.get("sub_department", "Other"),
                
                "image_url": [file.filename],
                "ai_confidence_score": validation_result.get("confidence_score"),
                
                "reported_by_user_id": "anonymous_user",
                "anonymous": True,
            }
            
            ticket_id = firebase_service.save_ticket(ticket_data)
        
        return {
            "detected": validation_result.get("detected"),
            "issue_type": validation_result.get("issue_type"),
            "confidence_score": validation_result.get("confidence_score"),
            "title": validation_result.get("title"),
            "description": validation_result.get("description"),
            "severity_level": validation_result.get("severity_level"),
            "department": validation_result.get("department"),
            "sub_department": validation_result.get("sub_department"),
            "reasoning": validation_result.get("reasoning"),
            "ticket_id": ticket_id,
            "error": validation_result.get("error")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server error: {str(e)}"
        )


@router.get(
    "/{ticket_id}",
    summary="Get ticket details",
    description="Retrieve details of a specific ticket"
)
async def get_ticket(ticket_id: str):
    """
    Get details of a specific ticket by ID
    
    - **ticket_id**: The ID of the ticket to retrieve
    """
    try:
        ticket_data = firebase_service.get_ticket(ticket_id)
        
        if not ticket_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        
        # Add ID to response
        ticket_data["id"] = ticket_id
        return ticket_data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server error: {str(e)}"
        )


@router.get(
    "/",
    summary="List tickets",
    description="List all tickets with optional filters"
)
async def list_tickets(
    status_filter: Optional[str] = None,
    issue_type: Optional[str] = None
):
    """
    List all tickets with optional filtering
    
    - **status_filter**: Filter by status (pending, resolved, etc.)
    - **issue_type**: Filter by issue type (Pothole, Garbage, Broken Pipe)
    """
    try:
        filters = {}
        if status_filter:
            filters["status"] = status_filter
        if issue_type:
            filters["issue_type"] = issue_type
        
        tickets = firebase_service.list_tickets(filters)
        return {"success": True, "count": len(tickets), "tickets": tickets}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server error: {str(e)}"
        )


@router.patch(
    "/{ticket_id}",
    summary="Update ticket",
    description="Update ticket status or other details"
)
async def update_ticket(
    ticket_id: str,
    status: Optional[str] = None,
    priority: Optional[str] = None
):
    """
    Update ticket information
    
    - **ticket_id**: The ID of the ticket to update
    - **status**: New status (pending, resolved, rejected, etc.)
    - **priority**: New priority level (Low, Medium, High)
    """
    try:
        update_data = {}
        if status:
            update_data["status"] = status
        if priority:
            update_data["priority"] = priority
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        success = firebase_service.update_ticket(ticket_id, update_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found or update failed"
            )
        
        return {"success": True, "message": "Ticket updated successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server error: {str(e)}"
        )


def _determine_priority(confidence_score: float) -> str:
    """
    Determine ticket priority based on confidence score
    
    Args:
        confidence_score: AI confidence score (0-1)
    
    Returns:
        Priority level: High, Medium, or Low
    """
    if confidence_score >= 0.85:
        return "High"
    elif confidence_score >= 0.70:
        return "Medium"
    else:
        return "Low"


# Include the router in the app
app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
