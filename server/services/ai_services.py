import base64
import io
import json
from typing import Dict, Any, Tuple
from groq import Groq
from PIL import Image
from config import GROQ_API_KEY, ISSUE_TYPES, CONFIDENCE_THRESHOLD


class AIValidationService:
    """Service to handle AI-based image validation"""
    
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model = "meta-llama/llama-4-scout-17b-16e-instruct"
        self.confidence_threshold = CONFIDENCE_THRESHOLD
        self.issue_types = ISSUE_TYPES
    
    def validate_image(self, image_data: bytes) -> Dict[str, Any]:
        """
        Validate an image using Groq's Vision API
        
        Args:
            image_data: Image file in bytes
            
        Returns:
            Dictionary with validation results
        """
        try:
            # Convert image to base64
            base64_image = base64.standard_b64encode(image_data).decode("utf-8")
            
            # Verify image format
            try:
                Image.open(io.BytesIO(image_data))
            except Exception as e:
                return {
                    "detected": False,
                    "issue_type": None,
                    "confidence_score": 0.0,
                    "reasoning": f"Invalid image format: {str(e)}",
                    "error": "Image validation failed"
                }
            
            # Call Groq Vision API
            message = self.client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": self._build_validation_prompt()
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                temperature=0.3,
                max_completion_tokens=500,
            )
            
            # Parse AI response
            response_text = message.choices[0].message.content
            return self._parse_ai_response(response_text)
        
        except Exception as e:
            return {
                "detected": False,
                "issue_type": None,
                "confidence_score": 0.0,
                "reasoning": f"Error processing image: {str(e)}",
                "error": str(e)
            }
    
    def _build_validation_prompt(self) -> str:
        """Build the validation prompt for the AI model"""
        return f"""Analyze this image and determine if it contains any of the following infrastructure issues:
{', '.join(self.issue_types)}

Respond in JSON format with the following structure:
{{
    "detected": true/false,
    "issue_type": "Pothole|Garbage|Broken Pipe|Other|None",
    "confidence_score": 0.0-1.0,
    "title": "Brief title of the issue",
    "description": "Detailed description of the issue observed",
    "severity_level": "critical|dangerous|moderate|minor",
    "department": "Roads & Traffic|Waste Management|Water Supply|Other",
    "sub_department": "Road Maintenance|Pothole Repair|Street Cleaning|Pipe Repair|Other",
    "reasoning": "Brief explanation of your detection and severity assessment"
}}

Rules:
1. Only classify as one of the specified issue types
2. Confidence score should be between 0 and 1
3. If confidence is below {self.confidence_threshold}, set detected to false
4. Be strict: only detect clear infrastructure issues, not general photos
5. Assess severity level based on potential danger/impact
6. Assign appropriate department based on issue type
7. Return ONLY valid JSON, no additional text

Analyze carefully and respond with only the JSON object."""
    
    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse AI response and extract validation results
        
        Args:
            response_text: Raw text response from AI
            
        Returns:
            Parsed validation results
        """
        try:
            # Try to extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                return {
                    "detected": False,
                    "issue_type": None,
                    "confidence_score": 0.0,
                    "reasoning": "Could not parse AI response",
                    "error": "Invalid response format"
                }
            
            json_str = response_text[json_start:json_end]
            parsed_response = json.loads(json_str)
            
            # Validate and clean response
            detected = parsed_response.get("detected", False)
            issue_type = parsed_response.get("issue_type", "None")
            confidence = float(parsed_response.get("confidence_score", 0.0))
            reasoning = parsed_response.get("reasoning", "")
            
            # Extract additional fields
            title = parsed_response.get("title", "Infrastructure Issue Reported")
            description = parsed_response.get("description", reasoning)
            severity_level = parsed_response.get("severity_level", "moderate")
            department = parsed_response.get("department", "Other")
            sub_department = parsed_response.get("sub_department", "Other")
            
            # Apply confidence threshold
            if confidence < self.confidence_threshold:
                detected = False
                issue_type = None
            
            return {
                "detected": detected,
                "issue_type": issue_type if detected else None,
                "confidence_score": confidence,
                "title": title,
                "description": description,
                "severity_level": severity_level,
                "department": department,
                "sub_department": sub_department,
                "reasoning": reasoning,
                "error": None
            }
        
        except json.JSONDecodeError as e:
            return {
                "detected": False,
                "issue_type": None,
                "confidence_score": 0.0,
                "reasoning": f"JSON parsing error: {str(e)}",
                "error": "Response parsing failed"
            }
        except Exception as e:
            return {
                "detected": False,
                "issue_type": None,
                "confidence_score": 0.0,
                "reasoning": f"Unexpected error: {str(e)}",
                "error": str(e)
            }


ai_service = AIValidationService()
