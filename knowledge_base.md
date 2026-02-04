# CASE Platform Knowledge Base

## Overview
CASE (Citizen Assistance & Service Enhancement) is a comprehensive Municipal Infrastructure Management Platform designed to streamline citizen grievance reporting, ticket management, and infrastructure maintenance workflows.

## User Roles

### 1. Citizen
**Purpose**: Report infrastructure issues and track their resolution

**Access**: 
- Register/Login at /auth/register and /auth/login
- Dashboard at /citizen/dashboard

**Key Features**:
- **Report Issues**: Submit tickets with photos, location, and description
- **Track Status**: Real-time status updates (Pending → Assigned → In Progress → Completed)
- **View History**: Access all past reports and their outcomes
- **Profile Management**: Update personal information and contact details

**Workflow**:
1. Citizen spots an infrastructure issue (pothole, streetlight, waste, etc.)
2. Opens mobile app or website
3. Takes photo of issue
4. Adds description and location
5. Submits ticket
6. Receives unique Ticket ID
7. Gets notifications on status updates

### 2. Officer (Municipal Officer)
**Purpose**: Review, validate, and assign citizen tickets to contractors

**Access**: 
- Dashboard at /officer/dashboard
- Tickets at /officer/tickets
- Work Orders at /officer/work-orders
- Reports at /officer/reports

**Key Features**:
- **AI-Powered Validation**: Automatic image analysis to verify issue authenticity
- **Ward Detection**: Automatic geographic assignment based on location
- **Ticket Assignment**: Assign verified tickets to qualified contractors
- **Work Order Creation**: Convert tickets into formal work orders with deadlines
- **Contractor Management**: View contractor availability, specializations, and performance
- **Analytics Dashboard**: View statistics on ticket volume, resolution times, and trends

**Workflow**:
1. Officer logs in and sees pending tickets
2. Reviews AI validation results (checks if image matches reported issue type)
3. Verifies location and ward assignment
4. Assigns ticket to appropriate contractor based on:
   - Contractor specialization (roads, electrical, waste, water)
   - Current workload
   - Geographic proximity
5. Sets priority level (Low, Medium, High, Critical)
6. Adds notes or special instructions
7. Creates work order with deadline
8. Monitors progress until completion

### 3. Contractor
**Purpose**: Execute repair/maintenance work assigned by officers

**Access**: 
- Dashboard at /contractor/dashboard
- Jobs at /contractor/jobs
- Profile at /contractor/profile

**Key Features**:
- **Job Queue**: View all assigned work orders
- **Status Updates**: Update job progress (Accepted → In Progress → Completed)
- **Photo Documentation**: Upload before/after photos of completed work
- **Route Optimization**: See jobs on map for efficient planning
- **Work History**: Track completed jobs and earnings
- **Specialization Tags**: Profile shows expertise areas (road repair, electrical, plumbing, etc.)

**Workflow**:
1. Contractor receives notification of new work order
2. Reviews job details, location, and deadline
3. Accepts or declines assignment
4. Updates status to "In Progress" when starting work
5. Takes before photos
6. Completes repair work
7. Takes after photos
8. Marks job as "Completed"
9. Officer reviews and approves

### 4. Admin
**Purpose**: System administration and contractor management

**Access**: 
- Dashboard at /admin/dashboard
- Contractor Management at /admin/contractors

**Key Features**:
- **User Management**: Create, approve, suspend, or delete user accounts
- **Contractor Onboarding**: Approve new contractor registrations
- **Verification Status**: Review pending contractor verifications
- **Role Assignment**: Grant officer or admin privileges
- **System Settings**: Configure ticket categories, priorities, and workflows
- **Data Export**: Generate reports and analytics
- **Audit Logs**: Track all system activities

**Workflow**:
1. Admin reviews pending contractor registrations
2. Verifies credentials and qualifications
3. Approves or rejects applications
4. Assigns specialization tags
5. Monitors system health and user activity
6. Handles escalations and disputes

### 5. Super Admin
**Purpose**: Full system control and configuration

**Access**: All platform features + advanced settings

**Key Features**:
- All Admin features
- Database management
- API key configuration
- Third-party integrations
- System backups and recovery
- Advanced analytics

## Core Features

### Ticket System

**Ticket Lifecycle**:
1. **Pending**: Initial submission, awaiting AI validation
2. **Validated**: AI confirmed issue authenticity
3. **Assigned**: Officer assigned to contractor
4. **In Progress**: Contractor actively working
5. **Completed**: Work finished, awaiting review
6. **Verified**: Officer approved completion
7. **Rejected**: Invalid or duplicate ticket

**Ticket Fields**:
- `ticket_id`: Unique identifier (TICKET-timestamp-random)
- `user_id`: Reporter's user ID
- `issue_type`: Category (pothole, streetlight, waste, water leak, etc.)
- `description`: Detailed problem description
- `location`: GPS coordinates (latitude, longitude)
- `address`: Human-readable address
- `ward`: Municipal ward number
- `image_url`: Photo evidence
- `status`: Current lifecycle stage
- `priority`: Low/Medium/High/Critical
- `assigned_to`: Contractor user ID
- `created_at`: Timestamp
- `updated_at`: Last modification time
- `ai_validation`: AI analysis results

### AI-Powered Validation

**Overview**: The CASE platform uses Groq's Llama Vision Scout model to automatically validate citizen-submitted images, ensuring only genuine infrastructure issues proceed through the workflow.

**Technology Stack**:
- **AI Model**: Groq API with Llama Vision Scout (vision-language model)
- **Function**: Multi-class image classification and authenticity verification
- **Processing**: Real-time analysis with confidence scoring
- **Integration**: FastAPI endpoint at `/validate_image_only` (port 8005)

#### Validation Pipeline

| Step | Process | Output |
|------|---------|--------|
| **1. Image Upload** | Citizen attaches photo to ticket submission | Image binary + issue_type + coordinates |
| **2. AI Analysis** | Groq Llama Vision Scout processes image | Classification results + confidence score |
| **3. Issue Detection** | Model identifies reported issue type | detected_issue, severity, authenticity flag |
| **4. Ward Lookup** | Point-in-polygon algorithm processes GPS coords | Municipal ward assignment |
| **5. Result Return** | Validation payload sent to frontend | JSON with validation details |
| **6. Officer Review** | Human verifies AI suggestion | Final approve/reject decision |

#### AI Response Scoring

The confidence score (0–1 scale) determines review requirements:
- **≥ 0.85**: High confidence → Auto-accept (requires officer sign-off)
- **0.60–0.84**: Medium confidence → Officer review recommended
- **< 0.60**: Low confidence → Likely rejection recommended

#### Example API Response

```json
{
  "is_valid": true,
  "confidence": 0.92,
  "detected_issue": "pothole",
  "severity": "medium",
  "ward": 12,
  "notes": "Clear image of road damage, approximately 2ft diameter, well-lit"
}
```

#### Key Benefits

- **Speed**: Validation completes in 2–5 seconds
- **Consistency**: Same model applies uniform criteria
- **Fraud Reduction**: Identifies manipulated or irrelevant images
- **Accuracy**: Purpose-built model for municipal infrastructure
- **Traceability**: Full audit trail stored with ticket

### Ward Detection

**Automatic Geographic Assignment**:
- Uses GPS coordinates to determine municipal ward
- Based on `ward_mapping.json` KML boundary data
- Ensures tickets routed to correct local authority

**How It Works**:
1. User submits ticket with location
2. Backend loads ward boundary polygons
3. Point-in-polygon algorithm determines ward
4. Ticket automatically tagged with ward number
5. Officers filter tickets by their assigned wards

**Endpoint**: `/get_ward` in server/main.py

### Work Orders

**Purpose**: Formal assignments converting tickets to contractor tasks

**Fields**:
- `work_order_id`: Unique identifier
- `ticket_id`: Source ticket reference
- `contractor_id`: Assigned contractor
- `officer_id`: Assigning officer
- `deadline`: Expected completion date
- `priority`: Urgency level
- `instructions`: Special requirements
- `estimated_cost`: Budget allocation
- `actual_cost`: Final expense (after completion)
- `status`: Pending/Active/Completed/Cancelled

**Workflow**:
1. Officer creates work order from validated ticket
2. System notifies contractor
3. Contractor accepts/declines
4. Work progresses through status updates
5. Completion triggers citizen notification
6. Officer final review and closure

### Map Integration

**Features**:
- **Interactive Map**: View all tickets on geographic map
- **Clustering**: Group nearby tickets for easier visualization
- **Filtering**: Show/hide by status, type, ward
- **Route Planning**: Contractors see optimal travel routes
- **Heatmap**: Identify problem hotspots

**Pages**:
- `/map`: Public map view
- `/route`: Contractor route optimization
- `/track`: Real-time contractor tracking

**Technology**: 
- Leaflet.js for map rendering
- OpenStreetMap tiles
- Geolocation API

### Email Notifications

**Automated Emails**:
- **Ticket Created**: Sent to citizen with ticket ID
- **Ticket Assigned**: Sent to contractor
- **Status Updated**: Sent to citizen on progress
- **Work Completed**: Sent to citizen and officer
- **Verification Required**: Sent to pending users

**Templates**: Located in `src/components/emails/`
- `TicketCreatedEmail.jsx`
- `TicketUpdatedEmail.jsx`

**Integration**: Resend email service via `/api/emails/route.js`

## Database Schema

### Users Collection
```javascript
{
  uid: "string",
  email: "string",
  displayName: "string",
  role: "citizen|officer|contractor|admin|superadmin",
  phone: "string",
  address: "string",
  ward: "number",
  verified: "boolean",
  specializations: ["roads", "electrical", "plumbing"], // contractors only
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### Tickets Collection
```javascript
{
  ticket_id: "TICKET-1738704123456-a1b2c3",
  user_id: "string",
  issue_type: "pothole|streetlight|waste|water|other",
  description: "string",
  location: {
    latitude: "number",
    longitude: "number",
    address: "string"
  },
  ward: "number",
  image_url: "string",
  status: "pending|validated|assigned|in_progress|completed|verified|rejected",
  priority: "low|medium|high|critical",
  assigned_to: "string",
  ai_validation: {
    is_valid: "boolean",
    confidence: "number",
    detected_issue: "string",
    notes: "string"
  },
  created_at: "timestamp",
  updated_at: "timestamp"
}
```

### Work Orders Collection
```javascript
{
  work_order_id: "WO-1738704123456-x9y8z7",
  ticket_id: "string",
  contractor_id: "string",
  officer_id: "string",
  deadline: "timestamp",
  priority: "low|medium|high|critical",
  instructions: "string",
  estimated_cost: "number",
  actual_cost: "number",
  status: "pending|accepted|in_progress|completed|cancelled",
  before_images: ["url1", "url2"],
  after_images: ["url1", "url2"],
  created_at: "timestamp",
  completed_at: "timestamp"
}
```

## API Reference

### Backend (FastAPI - Port 8005)

**Base URL**: `http://localhost:8005`

#### POST /validate_image_only
Validate ticket image with AI and detect ward

**Request**:
```javascript
{
  issue_type: "pothole",
  latitude: 19.0760,
  longitude: 72.8777
}
// + image file in multipart form-data
```

**Response**:
```javascript
{
  is_valid: true,
  confidence: 0.92,
  message: "Validation successful",
  ward: 12
}
```

#### POST /get_ward
Get municipal ward from coordinates

**Request**:
```javascript
{
  latitude: 19.0760,
  longitude: 72.8777
}
```

**Response**:
```javascript
{
  ward: 12
}
```

### Frontend (Next.js - Port 3000)

**Base URL**: `http://localhost:3000`

#### POST /api/auth/login
User authentication

**Request**:
```javascript
{
  email: "user@example.com",
  password: "password123"
}
```

**Response**:
```javascript
{
  success: true,
  user: { uid, email, role, displayName }
}
```

#### POST /api/tickets/create
Create new ticket

**Request**:
```javascript
{
  user_id: "string",
  issue_type: "pothole",
  description: "Large pothole on main road",
  location: { latitude, longitude, address },
  image_url: "string"
}
```

**Response**:
```javascript
{
  success: true,
  ticket_id: "TICKET-1738704123456-a1b2c3"
}
```

#### GET /api/tickets/list?user_id=xxx
List user's tickets

#### POST /api/contractors/list
List all contractors (officer/admin only)

#### POST /api/chatbot/query
Query RAG-based chatbot

**Request**:
```javascript
{
  query: "How do I report a pothole?"
}
```

**Response**:
```javascript
{
  success: true,
  answer: "To report a pothole...",
  sources: ["knowledge_base.md"]
}
```

## Common User Workflows

### Reporting an Issue (Citizen)
1. Navigate to `/citizen/dashboard`
2. Click "Report New Issue"
3. Select issue type from dropdown
4. Take or upload photo
5. Add description
6. Confirm auto-detected location (or adjust)
7. Submit ticket
8. Note the Ticket ID provided
9. Track status on dashboard

### Assigning Work (Officer)
1. Go to `/officer/tickets`
2. Filter by "Pending" or "Validated"
3. Click on ticket to view details
4. Review AI validation results
5. Verify location and ward
6. Click "Assign Contractor"
7. Select contractor from list (filtered by specialization)
8. Set priority and deadline
9. Add special instructions if needed
10. Submit work order

### Completing a Job (Contractor)
1. Check `/contractor/jobs` for new assignments
2. Click "Accept" on work order
3. Update status to "In Progress"
4. Navigate to job site using map
5. Take "before" photos
6. Complete repair work
7. Take "after" photos
8. Upload photos to work order
9. Mark as "Completed"
10. Wait for officer verification

## Troubleshooting

### Login Issues
- **Problem**: Cannot login
- **Solution**: 
  - Verify email/password
  - Check if account is verified (pending users cannot login)
  - Contact admin for verification status

### Ticket Not Appearing
- **Problem**: Submitted ticket doesn't show
- **Solution**:
  - Check if image uploaded successfully
  - Verify location services enabled
  - Refresh dashboard
  - Contact support if issue persists

### AI Validation Failed
- **Problem**: Ticket rejected by AI
- **Solution**:
  - Ensure photo clearly shows issue
  - Take photo in good lighting
  - Avoid blurry images
  - Make sure image matches issue type
  - Officer can manually override AI decision

### Contractor Not Receiving Jobs
- **Problem**: No work orders appearing
- **Solution**:
  - Verify account verification status
  - Check specialization tags match job types
  - Ensure profile is complete
  - Contact admin for approval status

### Map Not Loading
- **Problem**: Map shows blank
- **Solution**:
  - Check internet connection
  - Allow location permissions
  - Clear browser cache
  - Try different browser

## Mobile App

**Platform**: Android (React Native / Kotlin)
**Location**: `mobile-app/` directory

**Features**:
- Native camera integration
- GPS location capture
- Offline ticket drafting
- Push notifications
- Faster performance than web

**Build**:
```bash
cd mobile-app
./gradlew build
```

## Configuration

### Environment Variables

**Backend (.env in server/)**:
```
GROQ_API_KEY=your_groq_key
HUGGINGFACE_API_KEY=your_hf_key
FIREBASE_CREDENTIALS=./serviceAccountKey.json
```

**Frontend (.env.local in web/)**:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_API_URL=http://localhost:8005
```

### Firebase Setup
1. Create Firebase project
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Download service account key to `server/serviceAccountKey.json`
5. Update environment variables

## Technical Stack

**Frontend**:
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Shadcn/ui components
- Leaflet maps

**Backend**:
- FastAPI (Python)
- Firebase Admin SDK
- Groq AI API
- LangChain for RAG

**Database**:
- Firebase Firestore

**AI/ML**:
- Groq Llama Vision Scout (image validation)
- HuggingFace Embeddings (RAG)
- FAISS Vector Store (RAG)

**Deployment**:
- Frontend: Vercel
- Backend: Railway/Render
- Database: Firebase (cloud)

## Support & Contact

For technical issues or questions not covered in this knowledge base, please:
- Contact your system administrator
- Check the `/admin/dashboard` for announcements
- Submit a support ticket through the platform
- Email: support@case-platform.com

## Glossary

- **Ticket**: A citizen's report of an infrastructure issue
- **Work Order**: Formal assignment of ticket to contractor
- **Ward**: Geographic administrative division of municipality
- **AI Validation**: Automated image analysis to verify issue authenticity
- **RAG**: Retrieval-Augmented Generation (AI chatbot technique)
- **Specialization**: Contractor's area of expertise (roads, electrical, etc.)
- **KML**: Keyhole Markup Language (geographic boundary file format)
- **FAISS**: Facebook AI Similarity Search (vector database)

---

*Last Updated: February 2026*
*Version: 1.0*
