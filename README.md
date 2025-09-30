# Telehealth Platform - Comprehensive Healthcare Management System

[![Python](https://img.shields.io/badge/python-v3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.68+-green.svg)](https://fastapi.tiangolo.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-orange.svg)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-6+-red.svg)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, full-stack telehealth platform built with FastAPI and vanilla JavaScript, designed to provide comprehensive healthcare management with real-time features, secure patient data handling, and intuitive user interfaces for patients, doctors, family members, and administrators.

## Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)
- [Frontend Documentation](#-frontend-documentation)
- [Database Schema](#-database-schema)
- [Authentication & Security](#-authentication--security)
- [Real-time Features](#-real-time-features)
- [Deployment](#-deployment)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [License](#-license)

## Features

### 👥 **Multi-Role User Management**
- **Patients**: Book appointments, view vitals, manage health records
- **Doctors**: Manage schedules, record vitals, conduct consultations
- **Family Members**: Monitor patient health with permission-based access
- **Administrators**: Comprehensive system management and analytics

### **Core Healthcare Features**
- **Appointment Scheduling**: Dynamic booking with doctor availability
- **Vital Records Management**: Comprehensive health data tracking
- **Real-time Chat System**: Secure patient-doctor communication
- **Family Connections**: Permission-based family member access
- **Medical History**: Complete patient health journey tracking

### **Advanced Analytics**
- **Admin Dashboard**: Real-time system monitoring and user analytics
- **Health Insights**: Vital trend analysis and health reports
- **System Logs**: Comprehensive audit trails and monitoring
- **Performance Metrics**: Application performance and usage statistics

### **Security & Compliance**
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permission management
- **Data Encryption**: Secure patient data handling
- **Audit Trails**: Complete activity logging for compliance

### **Modern Technology Stack**
- **Backend**: FastAPI with async/await support
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Caching**: Redis for session management and real-time features
- **Frontend**: Vanilla JavaScript with modern ES6+ features
- **Real-time**: WebSocket support for live updates

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FastAPI       │    │   Database      │
│   (Vanilla JS)  │◄──►│   Backend       │◄──►│   PostgreSQL    │
│                 │    │                 │    │                 │
│ • Patient UI    │    │ • REST APIs     │    │ • User Data     │
│ • Doctor UI     │    │ • WebSockets    │    │ • Medical Data  │
│ • Admin Panel   │    │ • Auth System   │    │ • Audit Logs    │
│ • Chat System   │    │ • Real-time     │    │ • System Logs   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Caching)     │
                       │                 │
                       │ • Sessions      │
                       │ • Chat Queue    │
                       │ • Real-time     │
                       └─────────────────┘
```

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 13+
- Redis 6+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/vedant-maheshwari/telehealth.git
cd telehealth
```

### 2. Set Up Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database and Redis configurations
```

### 5. Initialize Database
```bash
# Create database tables
python -c "from database import engine; from models import Base; Base.metadata.create_all(engine)"
```

### 6. Start the Application
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 7. Access the Application
- **API Documentation**: http://localhost:8000/docs
- **Patient Portal**: http://localhost:8000/frontend/patient_dashboard.html
- **Doctor Portal**: http://localhost:8000/frontend/doctor_dashboard.html
- **Admin Dashboard**: http://localhost:8000/frontend/admin_dashboard.html

## Installation

### Development Environment

1. **Clone and Setup**:
```bash
git clone https://github.com/vedant-maheshwari/telehealth.git
cd telehealth
python -m venv telehealth_env
source telehealth_env/bin/activate
pip install -r requirements.txt
```

2. **Database Setup**:
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib  # Ubuntu/Debian
brew install postgresql  # macOS

# Create database
sudo -u postgres psql
CREATE DATABASE telehealth_db;
CREATE USER telehealth_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE telehealth_db TO telehealth_user;
\q
```

3. **Redis Setup**:
```bash
# Install Redis
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis  # macOS

# Start Redis
sudo systemctl start redis-server  # Ubuntu/Debian
brew services start redis  # macOS
```

4. **Environment Configuration**:
```bash
# Create .env file
cat << EOF > .env
DATABASE_URL=postgresql://telehealth_user:your_password@localhost/telehealth_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF
```

### Production Deployment

See [Deployment Section](#-deployment) for detailed production setup instructions.

## API Documentation

### Authentication Endpoints

#### POST `/register`
Register a new user in the system.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password",
  "role": "patient",
  "date_of_birth": "1990-01-01T00:00:00Z",
  "medical_license": "MD123456" // Required for doctors
}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "patient",
  "date_of_birth": "1990-01-01T00:00:00Z"
}
```

#### POST `/token`
Authenticate user and obtain access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### GET `/user/me`
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "patient"
}
```

### Appointment Management

#### GET `/appointments`
Retrieve user's appointments.

**Query Parameters:**
- `status` (optional): Filter by appointment status
- `limit` (optional): Number of appointments to return (default: 10)

**Response:**
```json
[
  {
    "id": 1,
    "patient_id": 1,
    "doctor_id": 2,
    "date_time": "2025-10-01T14:00:00Z",
    "status": "pending",
    "patient_name": "John Doe",
    "doctor_name": "Dr. Smith"
  }
]
```

#### POST `/appointments`
Book a new appointment.

**Request Body:**
```json
{
  "doctor_id": 2,
  "date_time": "2025-10-01T14:00:00Z",
  "reason": "Regular checkup"
}
```

#### PUT `/appointments/{appointment_id}/status`
Update appointment status (doctor only).

**Request Body:**
```json
{
  "status": "accepted",
  "notes": "Looking forward to the consultation"
}
```

### Vital Records Management

#### POST `/add_vital`
Add vital records for a patient (doctor only).

**Request Body:**
```json
{
  "patient_email": "patient@example.com",
  "bp": 120,
  "heart_rate": 72,
  "temperature": 98.6,
  "notes": "Normal vital signs"
}
```

#### GET `/get_vitals`
Retrieve patient's vital records.

**Query Parameters:**
- `limit` (optional): Number of records to return
- `start_date` (optional): Filter from date
- `end_date` (optional): Filter to date

**Response:**
```json
[
  {
    "id": 1,
    "patient_id": 1,
    "doctor_id": 2,
    "bp": 120,
    "heart_rate": 72,
    "temperature": 98.6,
    "notes": "Normal vital signs",
    "timestamp": "2025-09-30T10:00:00Z"
  }
]
```

### Family Management

#### POST `/family/send_invitation`
Send family connection invitation.

**Request Body:**
```json
{
  "invitee_email": "family@example.com",
  "relationship_type": "spouse"
}
```

#### GET `/family/invitations`
Get received family invitations.

**Response:**
```json
[
  {
    "id": 1,
    "inviter_name": "John Doe",
    "inviter_email": "john@example.com",
    "relationship_type": "spouse",
    "status": "pending",
    "token": "invitation-token-here"
  }
]
```

#### POST `/family/respond_invitation`
Respond to family invitation.

**Request Body:**
```json
{
  "token": "invitation-token-here",
  "action": "accept"
}
```

### Chat System

#### GET `/chats`
Get user's chat rooms.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Dr. Smith - John Doe",
    "participants": [
      {"name": "Dr. Smith", "role": "doctor"},
      {"name": "John Doe", "role": "patient"}
    ],
    "last_message": "Hello, how are you feeling today?",
    "last_message_time": "2025-09-30T14:30:00Z"
  }
]
```

#### POST `/chats`
Create a new chat room.

**Request Body:**
```json
{
  "name": "Patient Consultation",
  "participant_emails": ["patient@example.com", "doctor@example.com"]
}
```

#### GET `/chats/{chat_id}/messages`
Get chat messages.

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 50)

**Response:**
```json
[
  {
    "id": 1,
    "sender_name": "Dr. Smith",
    "sender_role": "doctor",
    "content": "Hello, how are you feeling today?",
    "timestamp": "2025-09-30T14:30:00Z"
  }
]
```

#### POST `/chats/{chat_id}/messages`
Send a chat message.

**Request Body:**
```json
{
  "content": "I'm feeling much better, thank you!"
}
```

### Doctor Features

#### GET `/all_doctors`
Get list of all available doctors.

**Response:**
```json
[
  {
    "id": 2,
    "name": "Dr. Smith",
    "email": "doctor@example.com",
    "medical_license": "MD123456",
    "specialization": "General Medicine"
  }
]
```

#### POST `/doctor/availability`
Set doctor availability (doctor only).

**Request Body:**
```json
{
  "day_of_week": 1,
  "start_time": "09:00:00",
  "end_time": "17:00:00",
  "appointment_duration": 30,
  "break_start": "12:00:00",
  "break_end": "13:00:00"
}
```

#### GET `/doctor/availability`
Get doctor's availability schedule.

**Response:**
```json
[
  {
    "day_of_week": 1,
    "start_time": "09:00:00",
    "end_time": "17:00:00",
    "appointment_duration": 30,
    "break_start": "12:00:00",
    "break_end": "13:00:00",
    "is_active": true
  }
]
```

### Admin Endpoints

#### GET `/admin/users`
Get all system users (admin only).

**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient",
    "date_of_birth": "1990-01-01T00:00:00Z"
  }
]
```

#### DELETE `/admin/users/{user_id}`
Delete a user and all related data (admin only).

**Response:**
```json
{
  "message": "User 'John Doe' and all related data deleted successfully",
  "deleted_data": {
    "appointments_as_patient": 3,
    "vitals_as_patient": 5,
    "family_connections": 2,
    "chat_participants": 1
  }
}
```

#### GET `/admin/analytics/overview`
Get system analytics overview (admin only).

**Response:**
```json
{
  "overview": {
    "total_users": 150,
    "patients": 120,
    "doctors": 25,
    "family_members": 5,
    "total_appointments": 450,
    "pending_appointments": 12,
    "accepted_appointments": 380,
    "total_chats": 85,
    "vitals_recorded": 1200
  },
  "popular_doctors": [
    {"name": "Dr. Smith", "appointment_count": 45},
    {"name": "Dr. Johnson", "appointment_count": 38}
  ]
}
```

#### GET `/admin/logs/recent`
Get recent system logs (admin only).

**Query Parameters:**
- `limit` (optional): Number of log entries (default: 100)
- `level` (optional): Filter by log level (INFO, ERROR, WARNING)
- `hours` (optional): Hours to look back (default: 24)

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2025-09-30 14:35:22",
      "level": "INFO",
      "message": "User login successful",
      "source": "auth",
      "ip": "192.168.1.100",
      "method": "POST",
      "path": "/token",
      "status": "200"
    }
  ],
  "total": 1
}
```

## Frontend Documentation

### Application Structure

```
frontend/
├── patient_dashboard.html      # Patient interface
├── doctor_dashboard.html       # Doctor interface  
├── admin_dashboard.html        # Admin panel
├── login.html                  # Authentication page
├── register.html               # User registration
├── chat.html                   # Real-time chat interface
├── config.js                   # API configuration
└── styles/                     # CSS stylesheets
    ├── common.css             # Shared styles
    ├── dashboard.css          # Dashboard-specific styles
    └── responsive.css         # Mobile responsiveness
```

### Key Frontend Features

#### 1. **Responsive Design**
- Mobile-first approach with responsive breakpoints
- Touch-friendly interface for tablets and mobile devices
- Progressive Web App (PWA) capabilities

#### 2. **Real-time Updates**
- Live chat with WebSocket integration
- Real-time appointment notifications
- Dynamic dashboard updates

#### 3. **User Experience**
- Intuitive navigation with role-based menus
- Loading states and error handling
- Offline capability with local storage

#### 4. **Security Features**
- Automatic token refresh
- Secure local storage management
- XSS protection with input sanitization

### Configuration

#### config.js
```javascript
const API_CONFIG = {
    development: {
        baseUrl: 'http://localhost:8000'
    },
    production: {
        baseUrl: 'https://your-domain.com'
    },
    getApiBaseUrl: function() {
        return this[this.environment || 'development'].baseUrl;
    }
};
```

### Authentication Flow

1. **Login/Register**: Users authenticate via `/login.html`
2. **Token Storage**: JWT tokens stored securely in sessionStorage
3. **Auto-redirect**: Users redirected to role-appropriate dashboards
4. **Token Validation**: All API calls include Authorization headers
5. **Session Management**: Automatic logout on token expiration

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'family', 'admin')),
    date_of_birth TIMESTAMP WITH TIME ZONE,
    medical_license VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Appointments Table
```sql
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Vitals Table
```sql
CREATE TABLE vitals (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    bp INTEGER,
    heart_rate INTEGER,
    temperature DECIMAL(4,2),
    notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Family Connections Table
```sql
CREATE TABLE family_connections (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    family_member_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) CHECK (relationship_type IN ('spouse', 'sibling', 'parent')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, family_member_id)
);
```

#### Chat System Tables
```sql
CREATE TABLE chat_rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_participants (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(chat_id, user_id)
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Relationships

```
Users (1) ←→ (M) Appointments
Users (1) ←→ (M) Vitals
Users (1) ←→ (M) Family_Connections
Users (1) ←→ (M) Chat_Participants
Chat_Rooms (1) ←→ (M) Chat_Messages
Chat_Rooms (1) ←→ (M) Chat_Participants
```

## 🔐 Authentication & Security

### JWT Token Structure
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "role": "patient",
  "exp": 1633024800,
  "iat": 1633021200
}
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Patient** | View own appointments, vitals, family connections; Book appointments |
| **Doctor** | View assigned appointments, Add vitals, Manage availability, Chat with patients |
| **Family** | View patient data (with permission), Limited patient interaction |
| **Admin** | Full system access, User management, System analytics, Logs |

### Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Authentication**: Secure token-based authentication
3. **CORS Protection**: Configured for production domains
4. **Rate Limiting**: API endpoint protection (planned)
5. **Input Validation**: Pydantic models for request validation
6. **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries

## Real-time Features

### WebSocket Integration

#### Chat System
- Real-time message delivery
- Online/offline status indicators
- Message read receipts
- Typing indicators

#### Notifications
- Appointment confirmations
- New vital record alerts
- Family connection requests
- System announcements

### Redis Integration

#### Caching Strategy
```python
# User session caching
redis_client.setex(f"user_session:{user_id}", 3600, json.dumps(user_data))

# Appointment reservations
redis_client.setex(f"appointment_hold:{slot_id}", 300, user_id)

# Chat message queue
redis_client.lpush(f"chat:{chat_id}", json.dumps(message))
```

## Deployment

### Docker Deployment

#### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/telehealth
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=telehealth
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Azure Deployment

#### Azure Container Registry
```bash
# Build and push to ACR
az acr build --registry telehealthacr --image telehealth-app:latest .
```

#### Azure App Service
```bash
# Deploy to App Service
az webapp create --resource-group telehealth-rg --plan telehealth-plan --name telehealth-app --deployment-container-image-name telehealthacr.azurecr.io/telehealth-app:latest
```

### Environment Configuration

#### Production .env
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
REDIS_URL=redis://redis-host:6379

# Security Configuration  
SECRET_KEY=your-super-secure-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/telehealth.log

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Configuration

### Application Settings

#### Main Configuration (main.py)
```python
# CORS Settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Files
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

# Request Logging
app.add_middleware(RequestLoggingMiddleware)
```

#### Database Configuration (database.py)
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/telehealth")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

### Monitoring & Logging

#### Log Configuration
```python
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/telehealth.log'),
        logging.StreamHandler()
    ]
)
```

## Contributing

### Development Guidelines

1. **Code Style**: Follow PEP 8 for Python code
2. **Documentation**: Update README and API docs for new features
3. **Testing**: Add unit tests for new functionality
4. **Security**: Follow OWASP guidelines for web security
5. **Performance**: Consider database optimization for new queries

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Code Structure Guidelines

```
telehealth/
├── main.py                 # FastAPI application entry point
├── models.py              # SQLAlchemy database models
├── schemas.py             # Pydantic request/response models  
├── auth.py                # Authentication and authorization
├── database.py            # Database configuration
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── appointment/           # Appointment management module
│   └── appointment_routes.py
├── family/               # Family management module
│   └── family_routes.py
├── admin/                # Admin functionality module
│   └── admin_routes.py
├── frontend/             # Static frontend files
│   ├── patient_dashboard.html
│   ├── doctor_dashboard.html
│   ├── admin_dashboard.html
│   └── config.js
├── logs/                 # Application logs
└── tests/                # Unit and integration tests
```

### API Testing

Use the built-in FastAPI documentation for testing:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Performance Considerations

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Caching Strategy**: Use Redis for session management and frequently accessed data
3. **Connection Pooling**: Configure appropriate database connection pools
4. **Query Optimization**: Use SQLAlchemy's lazy loading and eager loading appropriately

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

##  Support

For support and questions:

- **Email**: vedantmaheshwari23@gmail.com
- **GitHub Issues**: [Create an issue](https://github.com/vedant-maheshwari/telehealth/issues)

---

**Built with ❤️ by [Vedant Maheshwari](https://github.com/vedant-maheshwari)**

*Last Updated: September 30, 2025*