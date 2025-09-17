// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000',
    ENDPOINTS: {
        // Authentication
        LOGIN: '/token',
        REGISTER_PATIENT: '/register_patient',
        REGISTER_DOCTOR: '/register_doctor',
        REGISTER_FAMILY: '/register_family',
        CURRENT_USER: '/user/me',
        
        // Doctor endpoints
        ALL_DOCTORS: '/all_doctors',
        DOCTOR_APPOINTMENTS: '/get_all_appointments',
        APPOINTMENT_RESPONSE: '/appointment_response',
        ADD_VITAL: '/add_vital',
        
        // Patient endpoints
        CREATE_APPOINTMENT: '/create_appointment',
        GET_VITAL: '/get_vital',
        
        // Family endpoints
        SEND_INVITATION: '/family/send_invitation',
        RESPOND_INVITATION: '/family/respond_invitation',
        FAMILY_INVITATIONS: '/family/family_invitation_for_current_user',
        ALL_FAMILY_MEMBERS: '/family/get_all_family_members',
        RELATED_FAMILY_MEMBERS: '/family/get_related_family_members',
        DELETE_INVITATION: '/family/family_invitation',
        
        // Chat endpoints
        WS_TOKEN: '/ws-token',
        CREATE_CHAT: '/chats/create',
        MY_CHATS: '/chats/my',
        CHAT_MESSAGES: '/chats',
        
        // Admin endpoints
        ALL_USERS: '/admin/all_users',
        DELETE_USER: '/admin/delete_user',
        ADMIN_CREATE_ROOM: '/admin/rooms/create',
        ADMIN_DELETE_ROOM: '/admin/rooms',
        ADMIN_ALL_CHATS: '/admin/all'
    }
};

// Utility functions
const Utils = {
    // Get token from localStorage
    getToken: () => localStorage.getItem('access_token'),
    
    // Get user data from localStorage
    getUser: () => {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    },
    
    // Set user data in localStorage
    setUser: (userData) => {
        localStorage.setItem('user_data', JSON.stringify(userData));
    },
    
    // Clear auth data
    clearAuth: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_role');
    },
    
    // Check if user is authenticated
    isAuthenticated: () => {
        return !!Utils.getToken();
    },
    
    // Get user role
    getUserRole: () => localStorage.getItem('user_role'),
    
    // Format date
    formatDate: (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    },
    
    // Format date for input
    formatDateForInput: (dateString) => {
        return new Date(dateString).toISOString().slice(0, 16);
    },
    
    // Validate email
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Show notification
    showNotification: (message, type = 'info') => {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification fade-in`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1001;
            max-width: 400px;
            min-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    },
    
    // Show loading state
    showLoading: (button) => {
        const originalText = button.textContent;
        button.innerHTML = '<span class="spinner"></span> Loading...';
        button.disabled = true;
        
        return () => {
            button.textContent = originalText;
            button.disabled = false;
        };
    },
    
    // Redirect user based on role
    redirectUser: (role) => {
        const redirectMap = {
            'patient': 'patient-dashboard.html',
            'doctor': 'doctor-dashboard.html',
            'family': 'family-dashboard.html',
            'admin': 'admin-dashboard.html'
        };
        
        window.location.href = redirectMap[role] || 'index.html';
    }
};

// API Service
const APIService = {
    // Base request function
    async request(endpoint, options = {}) {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        const token = Utils.getToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        // Handle form data for login
        if (endpoint === API_CONFIG.ENDPOINTS.LOGIN) {
            finalOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        
        try {
            const response = await fetch(url, finalOptions);
            
            if (!response.ok) {
                if (response.status === 401) {
                    Utils.clearAuth();
                    window.location.href = 'index.html';
                    return;
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    // Authentication
    async login(email, password) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        
        return this.request(API_CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: formData
        });
    },
    
    async registerPatient(userData) {
        return this.request(API_CONFIG.ENDPOINTS.REGISTER_PATIENT, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    async registerDoctor(userData) {
        return this.request(API_CONFIG.ENDPOINTS.REGISTER_DOCTOR, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    async registerFamily(userData) {
        return this.request(API_CONFIG.ENDPOINTS.REGISTER_FAMILY, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    async getCurrentUser() {
        return this.request(API_CONFIG.ENDPOINTS.CURRENT_USER);
    },
    
    // Doctor endpoints
    async getAllDoctors() {
        return this.request(API_CONFIG.ENDPOINTS.ALL_DOCTORS);
    },
    
    async getDoctorAppointments() {
        return this.request(API_CONFIG.ENDPOINTS.DOCTOR_APPOINTMENTS);
    },
    
    async respondToAppointment(appointmentId, action) {
        return this.request(API_CONFIG.ENDPOINTS.APPOINTMENT_RESPONSE, {
            method: 'PUT',
            body: JSON.stringify({
                appointment_id: appointmentId,
                action: action
            })
        });
    },
    
    async addVital(patientEmail, bp) {
        return this.request(API_CONFIG.ENDPOINTS.ADD_VITAL, {
            method: 'POST',
            body: JSON.stringify({
                patient_email: patientEmail,
                bp: bp
            })
        });
    },
    
    // Patient endpoints
    async createAppointment(doctorId, appointmentDate) {
        return this.request(API_CONFIG.ENDPOINTS.CREATE_APPOINTMENT, {
            method: 'POST',
            body: JSON.stringify({
                doctor_id: doctorId,
                appointment_date: appointmentDate
            })
        });
    },
    
    async getVital() {
        return this.request(API_CONFIG.ENDPOINTS.GET_VITAL);
    },
    
    // Family endpoints
    async sendInvitation(inviteeEmail, relationshipType) {
        return this.request(API_CONFIG.ENDPOINTS.SEND_INVITATION, {
            method: 'POST',
            body: JSON.stringify({
                invitee_email: inviteeEmail,
                relationship_type: relationshipType
            })
        });
    },
    
    async respondToInvitation(token, action) {
        return this.request(API_CONFIG.ENDPOINTS.RESPOND_INVITATION, {
            method: 'PUT',
            body: JSON.stringify({
                token: token,
                action: action
            })
        });
    },
    
    async getFamilyInvitations() {
        return this.request(API_CONFIG.ENDPOINTS.FAMILY_INVITATIONS);
    },
    
    async getAllFamilyMembers() {
        return this.request(API_CONFIG.ENDPOINTS.ALL_FAMILY_MEMBERS);
    },
    
    async getRelatedFamilyMembers() {
        return this.request(API_CONFIG.ENDPOINTS.RELATED_FAMILY_MEMBERS);
    },
    
    async deleteInvitation(invitationId) {
        return this.request(`${API_CONFIG.ENDPOINTS.DELETE_INVITATION}/${invitationId}`, {
            method: 'DELETE'
        });
    },
    
    // Chat endpoints
    async getWSToken() {
        return this.request(API_CONFIG.ENDPOINTS.WS_TOKEN, {
            method: 'POST'
        });
    },
    
    async createChat(name, participantIds) {
        return this.request(API_CONFIG.ENDPOINTS.CREATE_CHAT, {
            method: 'POST',
            body: JSON.stringify({
                name: name,
                participant_ids: participantIds
            })
        });
    },
    
    async getMyChats() {
        return this.request(API_CONFIG.ENDPOINTS.MY_CHATS);
    },
    
    async getChatMessages(chatId) {
        return this.request(`${API_CONFIG.ENDPOINTS.CHAT_MESSAGES}/${chatId}/messages`);
    },
    
    // Admin endpoints
    async getAllUsers() {
        return this.request(API_CONFIG.ENDPOINTS.ALL_USERS);
    },
    
    async deleteUser(userId) {
        return this.request(`${API_CONFIG.ENDPOINTS.DELETE_USER}/?user_id=${userId}`, {
            method: 'DELETE'
        });
    },
    
    async adminCreateRoom(doctorId, patientId) {
        return this.request(API_CONFIG.ENDPOINTS.ADMIN_CREATE_ROOM, {
            method: 'POST',
            body: JSON.stringify({
                doctor_id: doctorId,
                patient_id: patientId
            })
        });
    },
    
    async adminDeleteRoom(roomId) {
        return this.request(`${API_CONFIG.ENDPOINTS.ADMIN_DELETE_ROOM}/${roomId}`, {
            method: 'DELETE'
        });
    },
    
    async adminGetAllChats() {
        return this.request(API_CONFIG.ENDPOINTS.ADMIN_ALL_CHATS);
    }
};

// Modal functions
const Modal = {
    show: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },
    
    hide: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },
    
    hideAll: () => {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.classList.remove('active'));
    }
};

// Chat functionality
class ChatManager {
    constructor() {
        this.currentChatId = null;
        this.websocket = null;
        this.wsToken = null;
    }
    
    async initializeChat(chatId) {
        this.currentChatId = chatId;
        
        try {
            // Get WebSocket token
            const tokenResponse = await APIService.getWSToken();
            this.wsToken = tokenResponse.ws_token;
            
            // Load existing messages
            await this.loadMessages();
            
            // Connect WebSocket
            await this.connectWebSocket();
        } catch (error) {
            console.error('Failed to initialize chat:', error);
            Utils.showNotification('Failed to initialize chat', 'error');
        }
    }
    
    async loadMessages() {
        try {
            const messages = await APIService.getChatMessages(this.currentChatId);
            this.displayMessages(messages);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    }
    
    async connectWebSocket() {
        const wsUrl = `ws://localhost:8000/chats/ws/${this.currentChatId}?ws_token=${this.wsToken}`;
        
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
            console.log('WebSocket connected');
        };
        
        this.websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.addMessageToDisplay(message);
        };
        
        this.websocket.onclose = () => {
            console.log('WebSocket disconnected');
            // Attempt to reconnect after a delay
            setTimeout(() => {
                if (this.currentChatId) {
                    this.connectWebSocket();
                }
            }, 3000);
        };
        
        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }
    
    sendMessage(content) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify({ content }));
        }
    }
    
    displayMessages(messages) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        messagesContainer.innerHTML = '';
        
        messages.forEach(message => {
            this.addMessageToDisplay(message, false);
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    addMessageToDisplay(message, shouldScroll = true) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        const currentUser = Utils.getUser();
        const isOwnMessage = message.sender_id === currentUser.id;
        
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isOwnMessage ? 'own' : ''}`;
        
        messageElement.innerHTML = `
            <div class="message-bubble">
                ${message.content}
            </div>
            <div class="message-time">
                ${Utils.formatDate(message.timestamp)}
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        
        if (shouldScroll) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    disconnect() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.currentChatId = null;
        this.wsToken = null;
    }
}

// Global chat manager instance
const chatManager = new ChatManager();

// Form validation
const Validation = {
    required: (value, fieldName) => {
        if (!value || !value.trim()) {
            return `${fieldName} is required`;
        }
        return null;
    },
    
    email: (value) => {
        if (!Utils.isValidEmail(value)) {
            return 'Please enter a valid email address';
        }
        return null;
    },
    
    password: (value) => {
        if (value.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        return null;
    },
    
    validateForm: (formData, rules) => {
        const errors = {};
        
        Object.keys(rules).forEach(field => {
            const validators = rules[field];
            const value = formData[field];
            
            for (const validator of validators) {
                const error = validator(value, field);
                if (error) {
                    errors[field] = error;
                    break;
                }
            }
        });
        
        return errors;
    },
    
    displayErrors: (errors, formId) => {
        // Clear previous errors
        const errorElements = document.querySelectorAll('.field-error');
        errorElements.forEach(element => element.remove());
        
        // Display new errors
        Object.keys(errors).forEach(field => {
            const input = document.querySelector(`#${formId} [name="${field}"]`);
            if (input) {
                input.classList.add('error');
                
                const errorElement = document.createElement('div');
                errorElement.className = 'field-error text-error text-sm mt-1';
                errorElement.textContent = errors[field];
                
                input.parentNode.appendChild(errorElement);
            }
        });
    },
    
    clearErrors: (formId) => {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => input.classList.remove('error'));
            
            const errorElements = form.querySelectorAll('.field-error');
            errorElements.forEach(element => element.remove());
        }
    }
};

// Page initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication on protected pages
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['index.html', 'login.html', 'register.html', ''];
    
    if (!publicPages.includes(currentPage) && !Utils.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize page-specific functionality
    initializePage();
    
    // Set up event listeners for modals
    setupModalEventListeners();
    
    // Set up logout functionality
    setupLogout();
});

function initializePage() {
    const currentPage = window.location.pathname.split('/').pop();
    
    switch (currentPage) {
        case 'patient-dashboard.html':
            initializePatientDashboard();
            break;
        case 'doctor-dashboard.html':
            initializeDoctorDashboard();
            break;
        case 'family-dashboard.html':
            initializeFamilyDashboard();
            break;
        case 'admin-dashboard.html':
            initializeAdminDashboard();
            break;
        case 'chat.html':
            initializeChat();
            break;
    }
}

function setupModalEventListeners() {
    // Close modal when clicking outside
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            Modal.hideAll();
        }
    });
    
    // Close modal when clicking close button
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-close')) {
            Modal.hideAll();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            Modal.hideAll();
        }
    });
}

function setupLogout() {
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            Utils.clearAuth();
            window.location.href = 'index.html';
        });
    });
}

// Initialize dashboard functions (to be implemented in specific dashboard files)
function initializePatientDashboard() {
    console.log('Patient dashboard initialized');
}

function initializeDoctorDashboard() {
    console.log('Doctor dashboard initialized');
}

function initializeFamilyDashboard() {
    console.log('Family dashboard initialized');
}

function initializeAdminDashboard() {
    console.log('Admin dashboard initialized');
}

function initializeChat() {
    console.log('Chat initialized');
}