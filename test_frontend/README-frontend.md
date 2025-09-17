# Modern Telehealth Platform Frontend

A comprehensive, modern frontend implementation for the telehealth platform built with vanilla HTML, CSS, and JavaScript. This frontend connects seamlessly with your existing FastAPI backend and provides a complete user experience for all user roles.

## 🚀 Features

### ✨ Modern Design
- Clean, professional interface with a modern design system
- Responsive layout that works on desktop, tablet, and mobile
- Consistent color scheme and typography
- Smooth animations and transitions
- No external dependencies except Google Fonts

### 👥 Multi-Role Support
- **Patient Dashboard**: Book appointments, manage family connections, view vitals, chat with doctors
- **Doctor Dashboard**: Manage appointments, create chat rooms, add patient vitals, view patient data
- **Family Member Dashboard**: Connect with family members, access shared health information, participate in chats
- **Admin Dashboard**: Manage all users, oversee chat rooms, view system statistics

### 💬 Real-Time Communication
- WebSocket-based chat system with automatic reconnection
- Real-time message delivery and read receipts
- Professional chat interface with message history
- Connection status indicators

### 🔐 Authentication & Security
- JWT-based authentication with automatic token refresh
- Role-based access control
- Secure form validation
- Protected routes and API calls

### 📱 Responsive Design
- Mobile-first approach
- Works seamlessly on all screen sizes
- Touch-friendly interface
- Optimized performance

## 📁 File Structure

```
frontend/
├── index.html              # Login page
├── register.html          # Registration with role selection
├── patient-dashboard.html  # Patient dashboard
├── doctor-dashboard.html   # Doctor dashboard
├── family-dashboard.html   # Family member dashboard
├── admin-dashboard.html    # Admin dashboard
├── chat.html              # Real-time chat interface
├── styles.css             # Modern CSS with design system
└── app.js                 # Core JavaScript functionality
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#2563eb)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)
- **Background**: Light gray (#f8fafc)
- **Text**: Dark gray (#1e293b)

### Components
- **Cards**: Clean, elevated containers with subtle shadows
- **Buttons**: Multiple variants (primary, secondary, outline, success, error)
- **Forms**: Consistent styling with validation states
- **Modals**: Overlay dialogs with smooth animations
- **Tables**: Clean, readable data presentation
- **Status Badges**: Color-coded status indicators

## 🔧 Setup Instructions

1. **Start Your FastAPI Backend**
   ```bash
   cd your-backend-directory
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Serve the Frontend**
   ```bash
   cd frontend
   python -m http.server 3000
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 🧪 Demo Accounts

The login page includes demo account information:

- **Patient**: patient@demo.com / password123
- **Doctor**: doctor@demo.com / password123  
- **Family**: family@demo.com / password123
- **Admin**: admin@demo.com / password123

*Note: You'll need to create these accounts first using the registration page or backend directly.*

## 🌟 Key Features by Role

### 👨‍⚕️ Doctor Features
- **Appointment Management**: View, accept, or reject patient appointments
- **Patient Communication**: Create chat rooms and communicate with patients/families
- **Vital Signs**: Add and track patient vital signs (blood pressure, etc.)
- **Real-time Dashboard**: See today's appointments and statistics

### 🏥 Patient Features  
- **Appointment Booking**: Schedule appointments with available doctors
- **Family Management**: Invite family members and manage connections
- **Health Records**: View vital signs and medical history
- **Secure Messaging**: Chat with doctors and receive medical guidance

### 👨‍👩‍👧‍👦 Family Member Features
- **Family Connections**: Connect with family members to access their health info
- **Medical Support**: Participate in medical consultations and discussions
- **Health Monitoring**: Help monitor and support family member health

### ⚙️ Admin Features
- **User Management**: View, edit, and delete all platform users
- **System Monitoring**: Real-time statistics and platform health
- **Chat Administration**: Manage all chat rooms across the platform
- **System Analytics**: Detailed usage statistics and reports

## 🔌 API Integration

### Authentication Endpoints
- `POST /token` - User login
- `POST /register_patient` - Patient registration
- `POST /register_doctor` - Doctor registration
- `POST /register_family` - Family member registration
- `GET /user/me` - Get current user information

### Doctor Endpoints
- `GET /all_doctors` - Get all doctors
- `GET /get_all_appointments` - Get doctor's appointments
- `PUT /appointment_response` - Accept/reject appointments
- `POST /add_vital` - Add patient vital signs

### Patient Endpoints
- `POST /create_appointment` - Book an appointment
- `GET /get_vital` - Get patient's vital signs

### Family Endpoints
- `POST /family/send_invitation` - Send family invitation
- `PUT /family/respond_invitation` - Respond to invitation
- `GET /family/family_invitation_for_current_user` - Get invitations
- `GET /family/get_all_family_members` - Get family members

### Chat Endpoints
- `POST /ws-token` - Get WebSocket token
- `POST /chats/create` - Create chat room
- `GET /chats/my` - Get user's chat rooms
- `GET /chats/{id}/messages` - Get chat messages
- WebSocket: `/chats/ws/{id}?ws_token={token}` - Real-time chat

### Admin Endpoints
- `GET /admin/all_users` - Get all users
- `DELETE /admin/delete_user` - Delete user
- `POST /admin/rooms/create` - Create chat room

## 💻 Technical Implementation

### JavaScript Architecture
- **Modular Design**: Organized into logical modules (API service, utilities, validation)
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **State Management**: Local storage for authentication and user data
- **Real-time Updates**: WebSocket connections with automatic reconnection

### CSS Architecture
- **CSS Variables**: Consistent theming with CSS custom properties
- **Utility Classes**: Reusable utility classes for common styles
- **Component-Based**: Modular CSS components for consistency
- **Responsive Design**: Mobile-first responsive breakpoints

### Form Handling
- **Client-side Validation**: Real-time form validation with error messages
- **Loading States**: Visual feedback during API calls
- **Error Display**: Clear error messaging for user guidance
- **Auto-complete**: Proper form attributes for better UX

### Security Considerations
- **XSS Protection**: Proper input sanitization and output encoding
- **CSRF Protection**: Token-based request validation
- **Input Validation**: Both client and server-side validation
- **Secure Storage**: Proper handling of authentication tokens

## 🎯 Usage Examples

### Booking an Appointment (Patient)
1. Login as a patient
2. Click "Book Appointment" on dashboard
3. Select a doctor from the dropdown
4. Choose date and time
5. Submit the appointment request

### Managing Appointments (Doctor)
1. Login as a doctor
2. View pending appointments on dashboard
3. Click "Accept" or "Reject" for each appointment
4. View today's schedule and statistics

### Family Connection
1. Login as a patient or family member
2. Navigate to family management section
3. Send invitation by email and relationship type
4. Recipient accepts/rejects the invitation
5. Connected family members can access shared health information

### Real-time Chat
1. Doctor creates a chat room with patient IDs
2. Participants receive access to the chat room
3. Click on chat room to open real-time chat
4. Send messages with instant delivery
5. Auto-reconnection handles connection issues

## 🚀 Deployment

### Development Deployment
```bash
# Backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend  
python -m http.server 3000
```

### Production Deployment
1. **Backend**: Deploy FastAPI to your preferred platform (Azure App Service, AWS, etc.)
2. **Frontend**: Deploy static files to Azure Static Web Apps, Netlify, or similar
3. **Update API URLs**: Change `BASE_URL` in `app.js` to your production API URL

### Configuration
Update the API configuration in `app.js`:
```javascript
const API_CONFIG = {
    BASE_URL: 'https://your-production-api.com', // Update this
    // ... rest of configuration
};
```

## 🔧 Customization

### Theming
Modify CSS variables in `styles.css`:
```css
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
  /* ... other variables */
}
```

### Adding New Features
1. Add new API endpoints to `API_CONFIG` in `app.js`
2. Create new service methods in `APIService`
3. Add UI components using existing design system
4. Implement proper error handling and loading states

### Extending User Roles
1. Add new role to backend user model
2. Update authentication logic in `app.js`
3. Create new dashboard HTML file
4. Add role-specific routing in `Utils.redirectUser()`

## 🐛 Troubleshooting

### Common Issues

**Chat Connection Failed**
- Check WebSocket token expiration
- Verify user is a chat participant
- Ensure backend WebSocket endpoint is running

**Authentication Errors**
- Check token expiration
- Verify API endpoint URLs
- Clear browser storage and re-login

**API Call Failures**
- Check backend server is running on port 8000
- Verify CORS settings in backend
- Check browser network tab for error details

**Styling Issues**
- Clear browser cache
- Check for CSS conflicts
- Verify Google Fonts are loading

### Debug Mode
Enable console logging by adding to `app.js`:
```javascript
const DEBUG = true;
// Add console.log statements throughout code
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow existing code style and patterns
4. Test across different user roles
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Modern design inspired by contemporary healthcare platforms
- Icons and typography from Google Fonts and system fonts
- Color palette optimized for accessibility
- Responsive design patterns from modern web standards

---

**Built with ❤️ for modern healthcare delivery**