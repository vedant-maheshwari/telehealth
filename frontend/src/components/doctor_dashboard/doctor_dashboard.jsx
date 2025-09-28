import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    getUserMe, 
    createChatRoom, 
    viewMyChats, 
  addPatientVitals,
    API_BASE_URL
} from '../../services/api'; // Adjust the path as necessary
import './doctor_dashboard.css';

const DoctorDashboard = () => {
    const [user, setUser] = useState({ name: 'Loading...', email: '' });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isChatsModalOpen, setIsChatsModalOpen] = useState(false);
    const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
    const [chatRooms, setChatRooms] = useState([]);
    const [roomName, setRoomName] = useState('');
    const [participants, setParticipants] = useState('');
    const [vitalEmail, setVitalEmail] = useState('');
    const [vitalBP, setVitalBP] = useState('');
    const navigate = useNavigate();

    const loadUser = useCallback(async () => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        try {
            const userData = await getUserMe(token);
            sessionStorage.setItem("user_id", userData.id);
            setUser(userData);

            // Redirect if not a doctor
            if (userData.role !== "doctor") {
                navigate(`/${userData.role}-dashboard`); // Redirect to appropriate dashboard
            }

        } catch (err) {
            console.error("User loading failed:", err);
            sessionStorage.clear();
            alert("Please login again");
            navigate("/login");
        }
    }, [navigate]);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const logout = () => {
        sessionStorage.clear();
        navigate("/login");
    };

    const handleCreateChatRoom = async () => {
        if (!roomName.trim() || !participants.trim()) {
            alert("Fill room name and participant IDs.");
            return;
        }

        const participant_ids = participants
            .split(",")
            .map(s => Number(s.trim()))
            .filter(n => !isNaN(n) && n > 0);
        
        if (participant_ids.length === 0) {
             alert("Enter valid participant IDs (e.g., 2,5,7).");
             return;
        }

        try {
            const data = await createChatRoom(roomName, participant_ids);
            navigate(`/chat?chatId=${data.id}`); // Navigate to the new chat room
            setIsCreateModalOpen(false);
        } catch (err) {
            alert(`Failed to create chat room: ${err.message}`);
        }
    };

    const handleViewMyChats = async () => {
        try {
            const chats = await viewMyChats();
            setChatRooms(chats);
            setIsChatsModalOpen(true);
        } catch (err) {
            alert(`Failed to load chat rooms: ${err.message}`);
        }
    };

    const handleOpenChat = (chatId) => {
        navigate(`/chat?chatId=${chatId}`);
    };

    const handleAddVitals = async () => {
        const bp = parseInt(vitalBP.trim());
        if (!vitalEmail.trim() || isNaN(bp)) {
            alert("Fill all fields correctly.");
            return;
        }

        try {
            await addPatientVitals(vitalEmail, bp);
            alert("Vitals added successfully!");
            setIsVitalsModalOpen(false);
            setVitalEmail('');
            setVitalBP('');
        } catch (err) {
            alert(`Error adding vitals: ${err.message}`);
        }
    };

    // Helper for navigation to external page/route
    const handleViewAppointments = () => {
        navigate("/doctor-appointments"); // Assuming you have a route for this
        // OR window.location.href = "doctor_appointment.html"; if not using routing
    }


    return (
        <div className='doctor-dashboard'>
            <header>
                <h2>Doctor Dashboard</h2>
            </header>
            <div className="container">
                <div className="card">
                    <h3>Welcome, <span id="userName">{user.name}</span></h3>
                    <p>Email: <span id="userEmail">{user.email}</span></p>
                </div>

                {/* Chat Section */}
                <div className="card" id="createSection">
                    <h3>Chat</h3>
                    <button onClick={() => setIsCreateModalOpen(true)}>Create Chat Room</button>
                    <button onClick={handleViewMyChats}>View My Chats</button>
                </div>

                {/* Appointment Section */}
                <div className="card">
                    <h3>Appointment</h3>
                    <button onClick={handleViewAppointments}>View Appointments</button>
                </div>

                {/* Vitals Section */}
                <div className="card">
                    <h3>Add Patient Vitals</h3>
                    <button onClick={() => setIsVitalsModalOpen(true)}>Add Vitals</button>
                </div>

                {/* Logout Section */}
                <div className="card">
                    <button onClick={logout}>Logout</button>
                </div>
            </div>

            {/* Create Chat Room Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Chat Room">
                <label>Room Name:</label>
                <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Enter chat room name" />

                <label>Participant IDs (comma separated):</label>
                <input type="text" value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="e.g. 2,5,7" />

                <div className="modal-actions">
                    <button onClick={handleCreateChatRoom}>Create</button>
                    <button className="cancel-btn" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                </div>
            </Modal>

            {/* Chat Rooms Modal */}
            <Modal isOpen={isChatsModalOpen} onClose={() => setIsChatsModalOpen(false)} title="Your Chat Rooms">
                <div id="chatRooms">
                    {chatRooms.length === 0 ? (
                        <p>No chat rooms found.</p>
                    ) : (
                        chatRooms.map(c => (
                            <div key={c.id} className="chat-card">
                                <h3>{c.name || "Chat Room"}</h3>
                                <p>Room ID: {c.id}</p>
                                <button onClick={() => handleOpenChat(c.id)}>Open</button>
                            </div>
                        ))
                    )}
                </div>
            </Modal>

            {/* Vitals Modal */}
            <Modal isOpen={isVitalsModalOpen} onClose={() => setIsVitalsModalOpen(false)} title="Add Patient Vitals">
                <label>Patient Email:</label>
                <input type="email" value={vitalEmail} onChange={(e) => setVitalEmail(e.target.value)} placeholder="patient@example.com" />

                <label>Blood Pressure (BP):</label>
                <input type="number" value={vitalBP} onChange={(e) => setVitalBP(e.target.value)} placeholder="Enter BP value" />

                <div className="modal-actions">
                    <button onClick={handleAddVitals}>Submit</button>
                    <button className="cancel-btn" onClick={() => setIsVitalsModalOpen(false)}>Cancel</button>
                </div>
            </Modal>
        </div>
    );
};

// Simple Modal component for reusability
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="modal" style={{ display: 'block' }}>
            <div className="modal-content">
                <span className="close" onClick={onClose}>&times;</span>
                <h2>{title}</h2>
                {children}
            </div>
        </div>
    );
};

export default DoctorDashboard;