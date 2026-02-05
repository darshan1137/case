"""
CASE Platform - Telegram Bot for Image Validation
Validates infrastructure issue images using the AI validation endpoint
"""

import os
import logging
import requests
from io import BytesIO
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    filters,
    ContextTypes,
    ConversationHandler,
)
from telegram.error import TelegramError

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8005")
VALIDATE_ENDPOINT = f"{API_BASE_URL}/api/tickets/validate-image-only"

# Conversation states
WAITING_FOR_IMAGE = 1
WAITING_FOR_LOCATION = 2
WAITING_FOR_DESCRIPTION = 3
WAITING_FOR_TICKET_ID = 4

class ImageValidationBot:
    """Telegram bot for validating infrastructure issue images"""

    def __init__(self):
        self.api_base_url = API_BASE_URL
        self.validate_endpoint = VALIDATE_ENDPOINT
        self.bot_token = TELEGRAM_BOT_TOKEN

    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Start command handler"""
        try:
            user = update.effective_user
            logger.info(f"User {user.id} ({user.first_name}) triggered /start")
            
            keyboard = [
                [InlineKeyboardButton("📸 Validate Image", callback_data='validate')],
                [InlineKeyboardButton("🔍 Check Ticket Status", callback_data='status')],
                [InlineKeyboardButton("ℹ️ Help", callback_data='help')],
                [InlineKeyboardButton("❓ About", callback_data='about')],
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

            await update.message.reply_text(
                f"🏛️ Welcome to CASE Infrastructure Bot, {user.first_name}!\n\n"
                "I help you validate infrastructure issue images using AI and check ticket status.\n\n"
                "📸 Send me a photo of an infrastructure issue and I'll analyze it.\n"
                "🔍 Check the status of your reports using ticket ID.\n\n"
                "What would you like to do?",
                reply_markup=reply_markup
            )
            logger.info(f"Welcome message sent to {user.id}")
            return WAITING_FOR_IMAGE
        except Exception as e:
            logger.error(f"Error in start handler: {e}", exc_info=True)
            raise

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Help command"""
        help_text = """
🆘 **HOW TO USE THIS BOT:**

1. **Send an Image**: Upload a clear photo of an infrastructure issue (pothole, garbage, broken pipe, etc.)
2. **Optional - Add Location**: Reply with GPS coordinates (latitude, longitude) when prompted
3. **Optional - Add Description**: Provide additional details about the issue
4. **Get Results**: The bot will analyze the image and return:
   - Issue type detected
   - Confidence score
   - Severity level
   - Recommended department
   - Ward information (if location provided)

📸 **Supported Issues:**
- 🕳️ Pothole/Road damage
- 🗑️ Garbage/Waste
- 🚰 Broken pipes/Water leaks
- ⚡ Electrical issues
- 🛣️ Other infrastructure problems

💡 **Tips:**
- Use clear, well-lit photos
- Include the full affected area
- GPS coordinates are optional but helpful
- You can skip the description if image is clear

⚙️ **Commands:**
- /start - Start the bot
- /help - Show this help message
- /about - About this bot
- /validate - Start validation process
        """
        await update.message.reply_text(help_text, parse_mode="Markdown")

    async def about_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """About command"""
        about_text = """
🏛️ **CASE - Citizen Assistance & Service Enhancement**

This bot is part of the CASE Platform, a municipal infrastructure management system.

✨ **Features:**
- AI-powered image validation using Groq Vision API
- Automatic issue categorization
- Location-based ward assignment
- Real-time severity assessment
- Integration with municipal departments

🔧 **Technology:**
- AI Model: Groq Llama Vision Scout
- Backend: FastAPI
- Database: Firebase
- Platform: Telegram

📞 **Support:**
For issues or feedback, contact your municipal support team.

Version: 1.0.0
Platform: CASE v2.2
        """
        await update.message.reply_text(about_text, parse_mode="Markdown")

    async def validate_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Start validation process"""
        await update.message.reply_text(
            "📸 **Please send me a photo of the infrastructure issue.**\n\n"
            "The image should clearly show:\n"
            "- The problem area\n"
            "- Surrounding context\n"
            "- Good lighting\n\n"
            "Send /cancel to stop.",
            parse_mode="Markdown"
        )
        return WAITING_FOR_IMAGE

    async def handle_photo(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle photo upload"""
        try:
            # Get the photo
            photo = update.message.photo[-1]  # Get the highest resolution photo
            
            # Download the photo
            file = await context.bot.get_file(photo.file_id)
            photo_bytes = await file.download_as_bytearray()
            
            # Clear old data and store new photo
            context.user_data.clear()
            context.user_data['photo_bytes'] = photo_bytes
            context.user_data['photo_file_id'] = photo.file_id
            
            logger.info(f"Photo received from {update.effective_user.id}, size: {len(photo_bytes)} bytes")
            
            await update.message.reply_text(
                "✅ Photo received!\n\n"
                "📍 **Now send location and description together:**\n\n"
                "**Option 1 - Manual entry:**\n"
                "`latitude,longitude,description`\n\n"
                "Example:\n"
                "`19.0760,72.8777,Large pothole`\n\n"
                "**Option 2 - Device GPS:**\n"
                "Tap 📎 → Location → then send description",
                parse_mode="Markdown"
            )
            return WAITING_FOR_LOCATION
            
        except Exception as e:
            logger.error(f"Error handling photo: {e}", exc_info=True)
            await update.message.reply_text(
                f"❌ Error processing photo: {str(e)}\n\n"
                "Please try again with a different image."
            )
            return WAITING_FOR_IMAGE

    async def handle_device_location(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle device location sharing"""
        try:
            # Handle both regular message and edited message
            message = update.message or update.edited_message
            if not message or not message.location:
                logger.warning("No location data in message")
                return WAITING_FOR_LOCATION
            
            location = message.location
            context.user_data['latitude'] = location.latitude
            context.user_data['longitude'] = location.longitude
            
            logger.info(f"Device location received: {location.latitude}, {location.longitude}, photo_in_context={'photo_bytes' in context.user_data}")
            
            await message.reply_text(
                f"✅ Location received!\n\n"
                f"📍 Coordinates: {location.latitude:.4f}, {location.longitude:.4f}\n\n"
                "📝 **Now, please add a description of the issue**\n\n"
                "What's the problem? (e.g., 'Large pothole on Main Street')",
                parse_mode="Markdown"
            )
            return WAITING_FOR_DESCRIPTION
            
        except Exception as e:
            logger.error(f"Error handling device location: {e}", exc_info=True)
            try:
                message = update.message or update.edited_message
                if message:
                    await message.reply_text(
                        f"❌ Error processing location: {str(e)}\n\n"
                        "Please try entering manually:\n"
                        "`latitude,longitude,description`",
                        parse_mode="Markdown"
                    )
            except:
                pass
            return WAITING_FOR_LOCATION

    async def handle_location(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle location input (manual coordinates and description)"""
        try:
            location_text = update.message.text.strip()
            
            # Parse: latitude,longitude,description
            parts = location_text.split(',')
            
            if len(parts) < 2:
                await update.message.reply_text(
                    "❌ Invalid format. Please use:\n\n"
                    "`latitude,longitude,description`\n\n"
                    "Example:\n"
                    "`19.0760,72.8777,Large pothole`\n\n"
                    "Or just coordinates:\n"
                    "`19.0760,72.8777`",
                    parse_mode="Markdown"
                )
                return WAITING_FOR_LOCATION
            
            try:
                latitude = float(parts[0].strip())
                longitude = float(parts[1].strip())
            except ValueError:
                await update.message.reply_text(
                    "❌ Invalid numbers. Make sure coordinates are numbers:\n\n"
                    "`19.0760,72.8777,Your description`",
                    parse_mode="Markdown"
                )
                return WAITING_FOR_LOCATION
            
            # Validate coordinates
            if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
                await update.message.reply_text(
                    "❌ Invalid coordinates!\n"
                    "Latitude: -90 to 90\n"
                    "Longitude: -180 to 180"
                )
                return WAITING_FOR_LOCATION
            
            context.user_data['latitude'] = latitude
            context.user_data['longitude'] = longitude
            
            # Extract description if provided
            if len(parts) >= 3:
                description = ','.join(parts[2:]).strip()
                context.user_data['description'] = description
                logger.info(f"Coordinates and description received: {latitude}, {longitude}, {description}")
                # Go directly to validation
                return await self.validate_and_send(update, context)
            else:
                context.user_data['description'] = None
                logger.info(f"Coordinates received: {latitude}, {longitude}")
                # Ask for description
                await update.message.reply_text(
                    "✅ Coordinates received!\n\n"
                    "📝 **Now, please add a description of the issue**\n\n"
                    "What's the problem? (e.g., 'Large pothole on Main Street')",
                    parse_mode="Markdown"
                )
                return WAITING_FOR_DESCRIPTION
            
        except Exception as e:
            logger.error(f"Error in handle_location: {e}", exc_info=True)
            await update.message.reply_text(
                f"❌ Error: {str(e)}\n\n"
                "Please try again with:\n"
                "`latitude,longitude,description`",
                parse_mode="Markdown"
            )
            return WAITING_FOR_LOCATION

    async def skip_to_description(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Skip location and move to description"""
        try:
            context.user_data['latitude'] = None
            context.user_data['longitude'] = None
            
            logger.info("Location skipped by user")
            
            await update.message.reply_text(
                "⏭️ Location skipped.\n\n"
                "📝 **Optional: Add a description**\n"
                "Describe the issue in detail or type /skip",
                parse_mode="Markdown"
            )
            return WAITING_FOR_DESCRIPTION
            
        except Exception as e:
            logger.error(f"Error in skip_to_description: {e}", exc_info=True)
            await update.message.reply_text(
                f"❌ Error: {str(e)}\n\n"
                "Please try again"
            )
            return WAITING_FOR_LOCATION

    async def handle_description(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle description and validate image"""
        try:
            description_text = update.message.text.strip()
            
            logger.info(f"[DESCRIPTION HANDLER] Received: {description_text}, context keys: {list(context.user_data.keys())}")
            
            # Safety check: only proceed if we have photo data
            if 'photo_bytes' not in context.user_data:
                logger.warning(f"[DESCRIPTION HANDLER] No photo data! This might be a ticket ID or other input. Ignoring.")
                # Don't process - let it fall through
                await update.message.reply_text(
                    "❌ Please upload a photo first or use /start to begin"
                )
                return WAITING_FOR_IMAGE
            
            if description_text.lower() != '/skip':
                context.user_data['description'] = description_text
            else:
                context.user_data['description'] = None
            
            logger.info(f"[DESCRIPTION HANDLER] Processing description: {context.user_data.get('description')}")
            
            # Validate and send
            return await self.validate_and_send(update, context)
            
        except Exception as e:
            logger.error(f"Error in handle_description: {e}", exc_info=True)
            await update.message.reply_text(
                f"❌ Error: {str(e)}\n\n"
                "Please try again with /validate"
            )
            return WAITING_FOR_IMAGE

    async def validate_and_send(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Validate image and send results"""
        try:
            # Show loading message
            processing_msg = await update.message.reply_text(
                "⏳ **Processing image...**\n"
                "🤖 Running AI validation\n"
                "Please wait...",
                parse_mode="Markdown"
            )
            
            # Call validation endpoint
            result = await self.validate_image(context.user_data)
            
            # Delete loading message
            try:
                await processing_msg.delete()
            except:
                pass
            
            # Format and send response
            await self.send_validation_results(update, result)
            
            # Ask if user wants to validate another image
            keyboard = [
                [InlineKeyboardButton("📸 Validate Another", callback_data='validate')],
                [InlineKeyboardButton("🏠 Main Menu", callback_data='menu')],
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(
                "Would you like to validate another image?",
                reply_markup=reply_markup
            )
            
            return WAITING_FOR_IMAGE
            
        except Exception as e:
            logger.error(f"Error in validate_and_send: {e}", exc_info=True)
            await update.message.reply_text(
                f"❌ Error: {str(e)}\n\n"
                "Please try again"
            )
            return WAITING_FOR_IMAGE

    async def validate_image(self, user_data: dict) -> dict:
        """Call the validation endpoint"""
        try:
            photo_bytes = user_data.get('photo_bytes')
            latitude = user_data.get('latitude')
            longitude = user_data.get('longitude')
            description = user_data.get('description')
            
            if not photo_bytes:
                raise ValueError("No photo data available")
            
            # Prepare files for multipart upload
            files = {
                'file': ('image.jpg', BytesIO(photo_bytes), 'image/jpeg'),
            }
            
            # Prepare data
            data = {}
            if latitude is not None:
                data['latitude'] = latitude
            if longitude is not None:
                data['longitude'] = longitude
            if description:
                data['description'] = description
            
            logger.info(f"Calling validation endpoint: {self.validate_endpoint}")
            logger.info(f"Request data: lat={latitude}, lon={longitude}, desc={description}, photo_size={len(photo_bytes)}")
            
            response = requests.post(
                self.validate_endpoint,
                files=files,
                data=data,
                timeout=30
            )
            
            logger.info(f"API Response Status: {response.status_code}")
            logger.info(f"API Response Body: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Parsed JSON: {result}")
                return result
            else:
                logger.error(f"API Error: {response.status_code} - {response.text}")
                raise Exception(f"API Error: {response.status_code}")
                
        except requests.exceptions.Timeout:
            raise Exception("Request timeout. Server took too long to respond.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {e}")
            raise Exception(f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Validation error: {e}")
            raise

    async def send_validation_results(self, update: Update, result: dict) -> None:
        """Format and send validation results"""
        try:
            logger.info(f"Full API result: {result}")
            
            # Map backend response fields to expected fields
            detected_issue = result.get('issue_type') or result.get('detected_issue', 'Unknown')
            confidence = result.get('confidence_score') or result.get('confidence', 0)
            severity = result.get('severity_level') or result.get('severity', 'Unknown')
            ward = result.get('ward', 'N/A')
            
            # For notes, try to get from description or notes field
            notes = result.get('description') or result.get('notes', '')
            if not notes and result.get('title'):
                notes = result.get('title')
            
            logger.info(f"Mapped: issue={detected_issue}, conf={confidence}, sev={severity}, ward={ward}")
            
            # Format confidence as percentage
            confidence_pct = f"{confidence * 100:.1f}%" if confidence else "0%"
            
            # Create emoji based on confidence
            if confidence >= 0.85:
                confidence_emoji = "🟢"
            elif confidence >= 0.60:
                confidence_emoji = "🟡"
            else:
                confidence_emoji = "🔴"
            
            # Severity emoji
            severity_emoji = {
                'critical': '🔴',
                'dangerous': '🟠',
                'moderate': '🟡',
                'minor': '🟢',
            }.get(severity.lower(), '⚪')
            
            # Get additional info
            department = result.get('department', 'N/A')
            sub_department = result.get('sub_department', 'N/A')
            title = result.get('title', '')
            
            # Build response message
            response_text = f"""
✅ **VALIDATION RESULTS**

🎯 **Issue Type:** {detected_issue}
{confidence_emoji} **Confidence:** {confidence_pct}
{severity_emoji} **Severity:** {severity.capitalize()}
🏢 **Department:** {department}
📋 **Sub-Department:** {sub_department}

**Title:** {title}

📝 **Analysis:**
{notes if notes else 'No additional notes'}

---
✨ **What's Next?**
1. Report will be reviewed by municipal officers
2. Appropriate contractor will be assigned
3. You'll receive updates on progress
4. Issue will be resolved and verified
            """
            
            await update.message.reply_text(
                response_text,
                parse_mode="Markdown"
            )
            
            logger.info(f"Validation results sent. Confidence: {confidence}, Issue: {detected_issue}")
            
        except Exception as e:
            logger.error(f"Error sending results: {e}")
            await update.message.reply_text(
                f"✅ Image validated successfully!\n\n"
                f"Issue Type: {result.get('detected_issue', 'Unknown')}\n"
                f"Confidence: {result.get('confidence', 'N/A')}\n\n"
                f"Full Response:\n`{str(result)}`",
                parse_mode="Markdown"
            )

    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle button clicks"""
        query = update.callback_query
        await query.answer()
        
        if query.data == 'validate':
            # Clear context for new validation
            context.user_data.clear()
            await query.edit_message_text(
                text="📸 **Please send me a photo of the infrastructure issue.**\n\n"
                "The image should clearly show the problem area.",
                parse_mode="Markdown"
            )
            return WAITING_FOR_IMAGE
        
        elif query.data == 'status':
            # Clear context for ticket status check
            context.user_data.clear()
            await query.edit_message_text(
                text="🔍 **Check Ticket Status**\n\n"
                "Please send me your ticket ID to check the status.\n"
                "Example: 6ABjjJ28kJNadStPf2rr",
                parse_mode="Markdown"
            )
            return WAITING_FOR_TICKET_ID
        
        elif query.data == 'share_location':
            await query.edit_message_text(
                text="📍 **Please share your device location**\n\n"
                "Tap the attachment button (📎) and select 'Location' to share your GPS coordinates.\n\n"
                "After sharing location, I'll ask for a description."
            )
            return WAITING_FOR_LOCATION
        
        elif query.data == 'skip_location':
            context.user_data['latitude'] = None
            context.user_data['longitude'] = None
            await query.edit_message_text(
                text="⏭️ Location skipped.\n\n"
                "📝 **Optional: Add a description**\n"
                "Describe the issue in detail or type /skip",
                parse_mode="Markdown"
            )
            return WAITING_FOR_DESCRIPTION
        
        elif query.data == 'help':
            await query.edit_message_text(
                text="🆘 **HOW TO USE THIS BOT:**\n\n"
                "1. Send a photo of an infrastructure issue\n"
                "2. Share device location (optional)\n"
                "3. Add a description (optional)\n"
                "4. Get instant AI analysis!\n\n"
                "Or check ticket status with your ticket ID.\n\n"
                "/help for more information"
            )
            return WAITING_FOR_IMAGE
        
        elif query.data == 'about':
            await query.edit_message_text(
                text="🏛️ **CASE Platform**\n\n"
                "Municipal Infrastructure Management System\n"
                "Powered by AI\n\n"
                "/about for more details"
            )
            return WAITING_FOR_IMAGE
        
        elif query.data == 'menu':
            await query.edit_message_text(
                text="🏛️ CASE Infrastructure Bot\n\n"
                "What would you like to do?"
            )
            return await self.start(update, context)
        
        return WAITING_FOR_IMAGE

    async def handle_ticket_id(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Handle ticket ID input"""
        try:
            ticket_id = update.message.text.strip()
            
            logger.info(f"[TICKET_ID HANDLER] Received: {ticket_id}, context keys: {list(context.user_data.keys())}")
            
            if ticket_id.lower() == '/cancel':
                await update.message.reply_text("❌ Cancelled.")
                return ConversationHandler.END
            
            # Show loading message
            loading_msg = await update.message.reply_text(
                "⏳ **Fetching ticket status...**\n"
                "Please wait...",
                parse_mode="Markdown"
            )
            
            # Fetch ticket status
            ticket_data = await self.get_ticket_status(ticket_id)
            
            # Delete loading message
            try:
                await loading_msg.delete()
            except:
                pass
            
            # Format and send response
            await self.send_ticket_status(update, ticket_data)
            
            # Ask if user wants to check another ticket
            keyboard = [
                [InlineKeyboardButton("🔍 Check Another", callback_data='status')],
                [InlineKeyboardButton("🏠 Main Menu", callback_data='menu')],
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(
                "Would you like to check another ticket?",
                reply_markup=reply_markup
            )
            
            return WAITING_FOR_IMAGE
            
        except Exception as e:
            logger.error(f"Error in handle_ticket_id: {e}")
            await update.message.reply_text(
                f"❌ Error: {str(e)}\n\n"
                "Please try again with /status"
            )
            return WAITING_FOR_TICKET_ID

    async def get_ticket_status(self, ticket_id: str) -> dict:
        """Fetch ticket status from API"""
        try:
            endpoint = f"{self.api_base_url}/api/tickets/{ticket_id}"
            logger.info(f"Calling endpoint: {endpoint}")
            
            response = requests.get(
                endpoint,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                raise Exception(f"Ticket '{ticket_id}' not found")
            else:
                logger.error(f"API Error: {response.status_code} - {response.text}")
                raise Exception(f"API Error: {response.status_code}")
                
        except requests.exceptions.Timeout:
            raise Exception("Request timeout. Server took too long to respond.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {e}")
            raise Exception(f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Fetch ticket error: {e}")
            raise

    async def send_ticket_status(self, update: Update, ticket: dict) -> None:
        """Format and send ticket status"""
        try:
            # Extract ticket information
            ticket_id = ticket.get('ticket_id', 'Unknown')
            status = ticket.get('status', 'Unknown').upper()
            issue_type = ticket.get('issue_type', 'Unknown')
            severity = ticket.get('severity_level', 'Unknown')
            title = ticket.get('title', 'No title')
            description = ticket.get('description', 'No description')
            department = ticket.get('department', 'N/A')
            sub_department = ticket.get('sub_department', 'N/A')
            ward = ticket.get('ward', 'N/A')
            
            # Status emoji
            status_emoji = {
                'PENDING': '⏳',
                'ASSIGNED': '👷',
                'IN_PROGRESS': '🔧',
                'COMPLETED': '✅',
                'VERIFIED': '✔️',
                'RESOLVED': '✅',
                'REJECTED': '❌',
            }.get(status, '❓')
            
            # Severity emoji
            severity_emoji = {
                'critical': '🔴',
                'dangerous': '🟠',
                'moderate': '🟡',
                'minor': '🟢',
            }.get(severity.lower(), '⚪')
            
            # Build response
            response_text = f"""
🎫 **TICKET STATUS**

**Ticket ID:** `{ticket_id}`
{status_emoji} **Status:** {status}

📋 **Details:**
🎯 **Issue Type:** {issue_type}
{severity_emoji} **Severity:** {severity.capitalize()}
📍 **Ward:** {ward}
🏢 **Department:** {department} / {sub_department}

📝 **Title:** {title}

📄 **Description:**
{description[:200]}{'...' if len(description) > 200 else ''}

---
⏰ **Timeline:**
"""
            
            # Add timeline information
            created_at = ticket.get('created_at')
            if created_at:
                response_text += f"\n📅 **Created:** {created_at}"
            
            assigned_at = ticket.get('assigned_at')
            if assigned_at:
                response_text += f"\n👷 **Assigned:** {assigned_at}"
            
            in_progress = ticket.get('in_progress_start_at')
            if in_progress:
                response_text += f"\n🔧 **Started:** {in_progress}"
            
            resolved_at = ticket.get('resolved_at')
            if resolved_at:
                response_text += f"\n✅ **Resolved:** {resolved_at}"
            
            # Add resolution notes if available
            if status.lower() == 'resolved' or status.lower() == 'completed' or status.lower() == 'verified':
                resolution_notes = ticket.get('resolution_notes')
                if resolution_notes:
                    response_text += f"\n\n📝 **Resolution Notes:**\n{resolution_notes}"
                
                # Show proof of work if available
                proof_of_work = ticket.get('proof_of_work')
                if proof_of_work:
                    response_text += f"\n\n📸 **Proof of Work:** [View Image]({proof_of_work})"
            
            # Add assignee information
            assigned_to = ticket.get('assigned_to')
            if assigned_to:
                response_text += f"\n\n👷 **Assigned to (Contractor ID):** `{assigned_to}`"
            
            # Add citizen information
            citizen_name = ticket.get('citizen_name')
            if citizen_name:
                response_text += f"\n👤 **Reported by:** {citizen_name}"
            
            citizen_phone = ticket.get('citizen_phone')
            if citizen_phone:
                response_text += f"\n📞 **Phone:** {citizen_phone}"
            
            response_text += "\n\n---\n✨ **Next Steps:**\nYour ticket is being processed and tracked. You'll receive updates as the status changes."
            
            await update.message.reply_text(
                response_text,
                parse_mode="Markdown",
                disable_web_page_preview=True
            )
            
            logger.info(f"Ticket status sent for: {ticket_id}")
            
        except Exception as e:
            logger.error(f"Error sending ticket status: {e}")
            await update.message.reply_text(
                f"✅ Ticket found!\n\n"
                f"Status: {ticket.get('status', 'Unknown')}\n"
                f"Issue Type: {ticket.get('issue_type', 'Unknown')}\n\n"
                f"Full Data:\n`{str(ticket)}`",
                parse_mode="Markdown"
            )

    async def cancel(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
        """Cancel operation"""
        await update.message.reply_text(
            "❌ Cancelled.\n\n"
            "Use /validate to start again or /help for assistance."
        )
        return ConversationHandler.END

    async def error_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle errors"""
        logger.error(f"Update {update} caused error {context.error}")
        try:
            await update.message.reply_text(
                "❌ An unexpected error occurred.\n\n"
                "Please try again or use /help"
            )
        except:
            pass


async def main():
    """Start the bot"""
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN not set in environment variables")
    
    logger.info(f"Starting CASE Telegram Bot...")
    logger.info(f"API Endpoint: {VALIDATE_ENDPOINT}")
    
    # Create bot instance
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Initialize handler
    bot_handler = ImageValidationBot()
    
    # Add conversation handler
    conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler("validate", bot_handler.validate_start),
            CallbackQueryHandler(bot_handler.button_callback),
        ],
        states={
            WAITING_FOR_IMAGE: [
                MessageHandler(filters.PHOTO, bot_handler.handle_photo),
                MessageHandler(filters.LOCATION, bot_handler.handle_device_location),
                CallbackQueryHandler(bot_handler.button_callback),
                CommandHandler("help", bot_handler.help_command),
                CommandHandler("about", bot_handler.about_command),
            ],
            WAITING_FOR_LOCATION: [
                MessageHandler(filters.LOCATION, bot_handler.handle_device_location),
                MessageHandler(filters.TEXT & ~filters.COMMAND, bot_handler.handle_location),
                CommandHandler("skip", bot_handler.validate_start),
                CallbackQueryHandler(bot_handler.button_callback),
            ],
            WAITING_FOR_DESCRIPTION: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, bot_handler.handle_description),
                CommandHandler("skip", bot_handler.handle_description),
            ],
            WAITING_FOR_TICKET_ID: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, bot_handler.handle_ticket_id),
                CommandHandler("cancel", bot_handler.cancel),
            ],
        },
        fallbacks=[CommandHandler("cancel", bot_handler.cancel)],
    )
    
    # Add handlers
    application.add_handler(conv_handler)
    
    # Add /start handler OUTSIDE conversation handler so it always responds
    application.add_handler(CommandHandler("start", bot_handler.start))
    
    # Add other command handlers
    application.add_handler(CommandHandler("help", bot_handler.help_command))
    application.add_handler(CommandHandler("about", bot_handler.about_command))
    application.add_handler(CallbackQueryHandler(bot_handler.button_callback))
    
    # Add error handler
    application.add_error_handler(bot_handler.error_handler)
    
    # Start polling
    logger.info("Bot is running and polling for messages...")
    async with application:
        await application.start()
        await application.updater.start_polling()
        logger.info("Bot polling started")
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            pass
        finally:
            await application.updater.stop()
            await application.stop()


if __name__ == "__main__":
    import asyncio
    import sys
    
    # Windows-specific event loop handling
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
