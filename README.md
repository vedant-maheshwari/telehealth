# Telehealth Platform

A comprehensive telehealth platform built with FastAPI and vanilla HTML/CSS/JavaScript, featuring patient management, doctor appointments, family connections, and real-time chat functionality.

## Architecture

This is a full-stack telehealth application with:

- **Backend**: FastAPI with SQLAlchemy ORM
- **Database**: SQLite (development), easily configurable for PostgreSQL/MySQL in production
- **Frontend**: Vanilla HTML/CSS/JavaScript with responsive design
- **Authentication**: JWT-based authentication with role-based access control
- **Real-time Communication**: WebSocket-based chat system
- **Caching**: Redis integration for performance optimization
- **Deployment**: Docker containerization with multi-platform support

## Features

### Core Functionality

- **Multi-role System**: Patients, Doctors, Family Members, and Admins
- **Appointment Management**: Book, accept, reject, and manage appointments
- **Family Connections**: Invite and manage family member access to patient data
- **Real-time Chat**: WebSocket-based messaging between patients, families, and doctors
- **Vital Signs Tracking**: Record and monitor patient health data
- **Admin Dashboard**: User management and system administration

### Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Separate WebSocket authentication tokens
- CORS middleware for secure cross-origin requests

## Prerequisites

- Python 3.11+
- Node.js (optional, for frontend development)
- Docker (for containerized deployment)
- Redis (for caching, optional)

## Installation & Setup

### Local Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/vedant-maheshwari/telehealth.git
cd telehealth
```

2. **Create virtual environment**

```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Set up environment variables**

Create a `.env` file in the root directory:
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./test.db
REDIS_URL=redis://localhost:6379
```

5. **Initialize the database**
   
```bash
python -c "from database import engine; from models import Base; Base.metadata.create_all(engine)"
```

6. **Run the application**

Option A - Using the custom runner (recommended):
```bash
python run.py
```

Option B - Manual startup:
```bash
# Terminal 1: Start backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start frontend
cd frontend
python -m http.server 3000
```

7. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Docker Deployment

1. **Build and run with Docker**
```bash
docker build -t telehealth:latest .
docker run -p 8000:8000 -p 3000:3000 telehealth:latest
```

2. **Multi-platform build (for deployment)**
```bash
docker buildx build \
  --platform=all \
  -t your-registry/telehealth:v1 \
  --push \
  .
```

## API Documentation

### Authentication Endpoints

#### Register Patient
```http
POST /register_patient
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "date_of_birth": "1990-01-01"
}
```

#### Register Doctor
```http
POST /register_doctor
Content-Type: application/json

{
  "name": "Dr. Jane Smith",
  "email": "dr.jane@example.com",
  "password": "securepassword123",
  "date_of_birth": "1985-05-15",
  "medical_license": "MD12345"
}
```

#### Register Family Member
```http
POST /register_family
Content-Type: application/json

{
  "name": "Family Member",
  "email": "family@example.com",
  "password": "securepassword123",
  "date_of_birth": "1995-03-20"
}
```

#### Login
```http
POST /token
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=userpassword
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "role": "patient",
  "user_id": 1
}
```

#### Get Current User
```http
GET /user/me
Authorization: Bearer <token>
```

### Doctor Endpoints

#### Get All Doctors
```http
GET /all_doctors
```

#### Get Doctor's Appointments
```http
GET /get_all_appointments
Authorization: Bearer <doctor_token>
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "John Doe",
    "start": "2024-12-15T10:00:00",
    "end": "2024-12-15T11:00:00",
    "status": "pending"
  }
]
```

#### Respond to Appointment
```http
PUT /appointment_response
Authorization: Bearer <doctor_token>
Content-Type: application/json

{
  "appointment_id": 1,
  "action": "accept"  // or "reject"
}
```

#### Add Patient Vitals
```http
POST /add_vital
Authorization: Bearer <doctor_token>
Content-Type: application/json

{
  "patient_email": "patient@example.com",
  "bp": 120
}
```

### Patient Endpoints

#### Book Appointment
```http
POST /create_appointment
Authorization: Bearer <patient_token>
Content-Type: application/json

{
  "doctor_id": 2,
  "appointment_date": "2024-12-15T10:00:00"
}
```

#### Get Patient Vitals
```http
GET /get_vital
Authorization: Bearer <patient_token>
```

### Family Management Endpoints

#### Send Family Invitation
```http
POST /family/send_invitation
Authorization: Bearer <token>
Content-Type: application/json

{
  "invitee_email": "family@example.com",
  "relationship_type": "spouse"  // or "sibling", "parent"
}
```

#### Respond to Family Invitation
```http
PUT /family/respond_invitation
Content-Type: application/json

{
  "token": "invitation-token-uuid",
  "action": "accept"  // or "reject"
}
```

#### Get Family Invitations
```http
GET /family/family_invitation_for_current_user
Authorization: Bearer <token>
```

#### Get Family Members
```http
GET /family/get_all_family_members
Authorization: Bearer <token>
```

### Chat System Endpoints

#### Generate WebSocket Token
```http
POST /ws-token
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ws_token": "short-lived-ws-token",
  "expires_in": 60
}
```

#### Create Chat Room (Doctors Only)
```http
POST /chats/create
Authorization: Bearer <doctor_token>
Content-Type: application/json

{
  "name": "Patient Consultation Room",
  "participant_ids": [1, 3]  // patient and family member IDs
}
```

#### Get User's Chat Rooms
```http
GET /chats/my
Authorization: Bearer <token>
```

#### Get Chat Messages
```http
GET /chats/{chat_id}/messages
Authorization: Bearer <token>
```

#### WebSocket Connection
```javascript
// Connect to chat WebSocket
const ws = new WebSocket(`ws://localhost:8000/chats/ws/${chatId}?ws_token=${wsToken}`);

// Send message
ws.send(JSON.stringify({
  "content": "Hello, this is a message"
}));

// Receive messages
ws.onmessage = function(event) {
  const message = JSON.parse(event.data);
  console.log(message);
};
```

### Admin Endpoints

#### Get All Users
```http
GET /admin/all_users
Authorization: Bearer <admin_token>
```

#### Delete User
```http
DELETE /admin/delete_user/?user_id=1
Authorization: Bearer <admin_token>
```

#### Create Chat Room
```http
POST /admin/rooms/create
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "doctor_id": 2,
  "patient_id": 1
}
```

## Database Schema

### User Model
- `id`: Primary key
- `name`: User's full name
- `email`: Unique email address
- `hashed_password`: Encrypted password
- `role`: Enum (patient, doctor, family, admin)
- `date_of_birth`: User's birth date
- `medical_license`: Doctor's license number (nullable)

### Appointments Model
- `id`: Primary key
- `patient_id`: Foreign key to User
- `doctor_id`: Foreign key to User
- `date_time`: Appointment date and time
- `status`: Enum (pending, accepted, rejected)

### Family Connections Model
- `id`: Primary key
- `patient_id`: Foreign key to User
- `family_member_id`: Foreign key to User
- `relationship_type`: Enum (spouse, sibling, parent)

### Family Invitations Model
- `id`: Primary key
- `inviter_id`: Foreign key to User
- `invitee_id`: Foreign key to User
- `relationship_type`: Enum (spouse, sibling, parent)
- `token`: Unique invitation token
- `status`: Enum (pending, accepted, rejected)

### Chat Models
- `ChatRoom`: Chat room information
- `ChatParticipant`: Room membership
- `ChatMessage`: Individual messages

### Vitals Model
- `id`: Primary key
- `patient_id`: Foreign key to User
- `doctor_id`: Foreign key to User
- `bp`: Blood pressure reading

## Security Considerations

### Authentication & Authorization
- JWT tokens with configurable expiration (30 minutes default)
- Role-based access control for all endpoints
- Separate short-lived tokens for WebSocket connections
- Password hashing using bcrypt

### API Security
- CORS middleware configured for cross-origin requests
- Input validation using Pydantic schemas
- SQL injection prevention through SQLAlchemy ORM
- Global exception handling with sanitized error responses

### Production Security Recommendations
1. **Environment Variables**: Use strong secret keys and secure database URLs
2. **HTTPS**: Always use HTTPS in production
3. **Database Security**: Use PostgreSQL with SSL in production
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Input Sanitization**: Additional input validation for production use

## Configuration

### Environment Variables
```env
# Required
SECRET_KEY=your-very-secure-secret-key-here
DATABASE_URL=sqlite:///./test.db  # Change for production

# Optional
REDIS_URL=redis://localhost:6379
ACCESS_TOKEN_EXPIRE_MINUTES=30
WS_TOKEN_EXPIRE_SECONDS=60
```

### Database Configuration
The application uses SQLite by default for development. For production, update the `DATABASE_URL` in `database.py`:

```python
# PostgreSQL
DATABASE_URL = "postgresql://user:password@localhost/telehealth"

# MySQL
DATABASE_URL = "mysql+pymysql://user:password@localhost/telehealth"
```

## Deployment

### Production Deployment Checklist

1. **Environment Setup**
   - [ ] Set secure SECRET_KEY
   - [ ] Configure production database
   - [ ] Set up Redis for caching
   - [ ] Configure CORS for your domain

2. **Security**
   - [ ] Enable HTTPS
   - [ ] Set secure session cookies
   - [ ] Configure firewall rules
   - [ ] Set up monitoring and logging

3. **Performance**
   - [ ] Configure database connection pooling
   - [ ] Set up Redis caching
   - [ ] Configure load balancing (if needed)
   - [ ] Enable gzip compression

4. **Monitoring**
   - [ ] Set up application monitoring
   - [ ] Configure log aggregation
   - [ ] Set up health checks
   - [ ] Monitor database performance

##  Project Structure

```
telehealth/
├── main.py                 # FastAPI application entry point
├── auth.py                 # Authentication and authorization
├── crud.py                 # Database CRUD operations
├── models.py               # SQLAlchemy models
├── schemas.py              # Pydantic schemas
├── database.py             # Database configuration
├── utils.py                # Utility functions
├── requirements.txt        # Python dependencies
├── Dockerfile              # Docker configuration
├── run.py                  # Application runner
├── docker_command.txt      # Docker build commands
├── frontend/               # Frontend HTML/CSS/JS files
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── patient_dashboard.html
│   ├── doctor_dashboard.html
│   ├── family_dashboard.html
│   ├── chat.html
│   └── ...
├── family/                 # Family management module
│   ├── family_routes.py    # Family API routes
│   └── crud.py            # Family CRUD operations
├── chat/                   # Chat system module
│   ├── chat.py            # Chat WebSocket and routes
│   └── chat_auth.py       # Chat authentication
├── admin/                  # Admin functionality
│   └── admin_routes.py    # Admin API routes
├── profiling/             # Performance profiling tools
├── test/                  # Test files
└── .vscode/               # VS Code configuration
```

## Testing

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest test/

# Run with coverage
pytest --cov=. test/
```

### API Testing with cURL

```bash
# Register a patient
curl -X POST "http://localhost:8000/register_patient" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "email": "test@example.com",
    "password": "testpass123",
    "date_of_birth": "1990-01-01"
  }'

# Login
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpass123"
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code style
- Use type hints for all functions
- Write comprehensive docstrings
- Add tests for new features
- Update API documentation

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure SQLite file permissions are correct
   - Check DATABASE_URL format
   - Verify database file exists

2. **Authentication Issues**
   - Verify SECRET_KEY is set
   - Check token expiration
   - Ensure proper Authorization header format

3. **WebSocket Connection Failed**
   - Generate fresh ws_token
   - Check WebSocket URL format
   - Verify user is a chat participant

4. **CORS Errors**
   - Update CORS middleware origins
   - Check frontend URL configuration
   - Verify request headers

### Performance Optimization

1. **Database Optimization**
   - Add database indexes for frequent queries
   - Use connection pooling
   - Implement query caching

2. **API Performance**
   - Enable response compression
   - Implement request rate limiting
   - Use Redis for session storage

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/docs`
- Review the troubleshooting section

## Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added chat system and family management
- **v1.2.0** - Enhanced security and admin features
- **Current** - Ongoing improvements and bug fixes

---