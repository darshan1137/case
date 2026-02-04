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
allow_origins = ["*"]  # Add your frontend Render URL here

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
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


@router.post(
    "/validate-image-only",
    summary="Validate image without saving",
    description="Upload an image to validate for infrastructure issues WITHOUT creating a ticket (validation preview only)"
)
async def validate_image_only(
    file: UploadFile = File(..., description="Image file (JPG, PNG, etc.)"),
    latitude: Optional[float] = Form(None, description="Latitude of the location (optional)"),
    longitude: Optional[float] = Form(None, description="Longitude of the location (optional)"),
    description: Optional[str] = Form(None, description="Optional description from user"),
):
    """
    Validate an uploaded image for infrastructure issues WITHOUT saving to database.
    Returns the AI validation result for preview/confirmation before ticket creation.
    
    - **file**: Image file to validate
    - **latitude**: GPS latitude coordinate (optional)
    - **longitude**: GPS longitude coordinate (optional)
    - **description**: Optional user description
    
    Returns validation result (detected, issue_type, confidence_score, title, description, etc.)
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
                detail="File type not allowed. Use JPG, PNG, GIF, or WebP"
            )
        
        # Read file
        file_content = await file.read()
        if len(file_content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is empty"
            )
        
        # Validate image using AI service
        validation_result = ai_service.validate_image(file_content)
        
        # Return validation result ONLY - do not save to Firebase
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
            "error": validation_result.get("error"),
            "ticket_saved": False,
            "message": "Validation complete. No ticket created. Use /api/tickets/create-manual to save this as a ticket."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Server error: {str(e)}"
        )


@router.get(
    "/hotspots",
    summary="Get ticket hotspots with high density",
    description="Get locations with multiple tickets (2+) that should be highlighted"
)
async def get_ticket_hotspots(min_tickets: int = 2, radius_km: float = 0.5):
    """
    Get all ticket hotspots where multiple tickets exist within a radius.
    
    Args:
        min_tickets: Minimum number of tickets to be considered a hotspot (default 2)
        radius_km: Search radius in kilometers (default 0.5)
    
    Returns:
        List of hotspot locations with ticket counts and priority information
    """
    try:
        all_tickets = firebase_service.list_tickets()
        
        hotspots = []
        processed_coords = set()
        
        from math import radians, sin, cos, sqrt, atan2
        
        for ticket in all_tickets:
            if ticket.get("status") == "closed":
                continue
            
            ticket_lat = ticket.get("latitude")
            ticket_lon = ticket.get("longitude")
            
            if not ticket_lat or not ticket_lon:
                continue
            
            # Skip if already processed
            coord_key = (round(ticket_lat, 4), round(ticket_lon, 4))
            if coord_key in processed_coords:
                continue
            
            # Count nearby tickets
            R = 6371
            nearby_count = 0
            nearby_ticket_ids = []
            
            for other_ticket in all_tickets:
                if other_ticket.get("status") == "closed":
                    continue
                
                other_lat = other_ticket.get("latitude")
                other_lon = other_ticket.get("longitude")
                
                if not other_lat or not other_lon:
                    continue
                
                lat1, lon1 = radians(ticket_lat), radians(ticket_lon)
                lat2, lon2 = radians(other_lat), radians(other_lon)
                
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                
                a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                c = 2 * atan2(sqrt(a), sqrt(1-a))
                distance = R * c
                
                if distance <= radius_km:
                    nearby_count += 1
                    nearby_ticket_ids.append(other_ticket.get("ticket_id"))
            
            # Add to hotspots if meets threshold
            if nearby_count >= min_tickets:
                hotspots.append({
                    "latitude": ticket_lat,
                    "longitude": ticket_lon,
                    "ticket_count": nearby_count,
                    "tickets": nearby_ticket_ids,
                    "priority_level": "Critical" if nearby_count >= 5 else "High" if nearby_count >= 3 else "Medium",
                    "ward": ticket.get("ward"),
                    "search_radius_km": radius_km
                })
                processed_coords.add(coord_key)
        
        return {
            "success": True,
            "hotspot_count": len(hotspots),
            "hotspots": hotspots
        }
    
    except Exception as e:
        print(f"Error getting hotspots: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving hotspots: {str(e)}"
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


def _calculate_location_priority(latitude: float, longitude: float, radius_km: float = 0.5) -> dict:
    """
    Calculate priority score based on nearby tickets in the same location.
    
    Args:
        latitude: Ticket latitude
        longitude: Ticket longitude
        radius_km: Search radius in kilometers (default 0.5 km)
    
    Returns:
        dict with nearby_ticket_count, priority_boost, and highlighted status
    """
    try:
        # Get all tickets from Firebase
        all_tickets = firebase_service.list_tickets(limit=1000)
        
        # Calculate distance to other tickets using Haversine formula
        from math import radians, sin, cos, sqrt, atan2
        
        nearby_tickets = 0
        
        for ticket in all_tickets:
            if ticket.get("status") == "closed":
                continue  # Skip closed tickets
            
            ticket_lat = ticket.get("latitude")
            ticket_lon = ticket.get("longitude")
            
            if not ticket_lat or not ticket_lon:
                continue
            
            # Haversine formula to calculate distance
            R = 6371  # Earth's radius in km
            lat1, lon1 = radians(latitude), radians(longitude)
            lat2, lon2 = radians(ticket_lat), radians(ticket_lon)
            
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * atan2(sqrt(a), sqrt(1-a))
            distance = R * c
            
            if distance <= radius_km:
                nearby_tickets += 1
        
        # Calculate priority boost based on ticket density
        priority_boost = min(nearby_tickets * 0.15, 0.5)  # Max 50% boost
        is_highlighted = nearby_tickets >= 2  # Highlight if 2 or more tickets nearby
        
        return {
            "nearby_tickets": nearby_tickets,
            "priority_boost": priority_boost,
            "is_highlighted": is_highlighted,
            "search_radius_km": radius_km
        }
    except Exception as e:
        print(f"Error calculating location priority: {str(e)}")
        return {
            "nearby_tickets": 0,
            "priority_boost": 0,
            "is_highlighted": False,
            "search_radius_km": radius_km
        }


@router.post(
    "/create-manual",
    summary="Create a manual ticket with location priority",
    description="Create a ticket manually with automatic priority scoring based on location density"
)
async def create_manual_ticket(
    issue_type: str = Form(..., description="Type of issue: pothole, garbage, broken_pipe, etc."),
    title: str = Form(..., description="Ticket title"),
    description: str = Form(..., description="Detailed description"),
    latitude: float = Form(..., description="Latitude of the location"),
    longitude: float = Form(..., description="Longitude of the location"),
    severity_level: Optional[str] = Form("moderate", description="Severity: low, moderate, high, critical"),
    department: Optional[str] = Form(None, description="Department responsible"),
):
    """
    Create a manual ticket and calculate priority based on location density.
    If multiple tickets exist at the same location, priority is increased.
    
    Returns:
        Ticket object with priority_score and is_highlighted fields
    """
    try:
        # Validate coordinates
        if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid latitude or longitude"
            )
        
        # Validate severity level
        valid_severities = ["low", "moderate", "high", "critical"]
        if severity_level and severity_level.lower() not in valid_severities:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid severity level. Allowed: {', '.join(valid_severities)}"
            )
        
        # Generate ticket ID
        import uuid
        ticket_num = str(uuid.uuid4())[:8].upper()
        generated_ticket_id = f"TKT-{ticket_num}"
        
        # Get ward based on coordinates
        ward_code, ward_info = ward_service.get_ward_by_coordinates(latitude, longitude)
        
        # Calculate location-based priority
        location_priority = _calculate_location_priority(latitude, longitude)
        
        # Calculate final priority score (0-1)
        base_priority = 0.5  # Base priority for manual tickets
        priority_score = min(base_priority + location_priority["priority_boost"], 1.0)
        
        # Determine priority level
        if priority_score >= 0.85:
            priority_level = "Critical"
        elif priority_score >= 0.70:
            priority_level = "High"
        elif priority_score >= 0.50:
            priority_level = "Medium"
        else:
            priority_level = "Low"
        
        # Create ticket data
        ticket_data = {
            "ticket_id": generated_ticket_id,
            "issue_type": issue_type.lower(),
            "status": "open",
            "priority": priority_level,
            "priority_score": priority_score,
            
            "latitude": latitude,
            "longitude": longitude,
            "ward": ward_code if ward_code else "Unknown",
            
            "title": title,
            "description": description,
            "severity_level": severity_level.lower() if severity_level else "moderate",
            "department": department or "General",
            
            "location_priority_data": {
                "nearby_tickets": location_priority["nearby_tickets"],
                "is_highlighted": location_priority["is_highlighted"],
                "search_radius_km": location_priority["search_radius_km"]
            },
            
            "created_by": "manual",
            "source": "web-form"
        }
        
        # Save ticket to Firebase
        firebase_service.save_ticket(ticket_data)
        
        return {
            "success": True,
            "ticket_id": generated_ticket_id,
            "message": "Ticket created successfully",
            "data": {
                "ticket_id": generated_ticket_id,
                "title": title,
                "priority": priority_level,
                "priority_score": priority_score,
                "is_highlighted": location_priority["is_highlighted"],
                "nearby_tickets": location_priority["nearby_tickets"],
                "ward": ward_code,
                "latitude": latitude,
                "longitude": longitude
            }
        }
    
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        print(f"Error creating ticket: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating ticket: {str(e)}"
        )


# Include the router in the app
app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
