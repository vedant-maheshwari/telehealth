import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// Ensure these functions exist in your API service
import { getCurrentUser, getFamilyMembers, logoutUser } from "../../services/api"; 
import "./family_dashboard.css";

export default function FamilyDashboard() {
    const [user, setUser] = useState({ name: "", email: "" });
    const [family, setFamily] = useState([]);
    const navigate = useNavigate();
    const token = sessionStorage.getItem("token");

    // Use useCallback for async function to prevent unnecessary re-creation
    const loadData = useCallback(async () => {
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            // 1. Get current user info
            const currentUser = await getCurrentUser(token);
            setUser(currentUser);

            // 2. Get family members list
            const familyMembers = await getFamilyMembers(token);
            setFamily(familyMembers);

        } catch (err) {
            console.error("Failed to load user or family data:", err);
            // On API failure, clear session and force re-login
            sessionStorage.clear();
            alert("Session expired or failed to load data. Please log in again.");
            navigate("/login");
        }
    }, [token, navigate]);

    useEffect(() => {
        loadData();
        
        // Cleanup: Use the function returned by useEffect to handle any needed cleanup
        return () => {
            // Optional: Any cleanup logic here
        };
    }, [loadData]); // loadData is stable because it's wrapped in useCallback

    const handleLogout = () => {
        // Assuming logoutUser() clears server session/cookies if necessary
        logoutUser(); 
        sessionStorage.clear(); // Ensure local storage is cleared
        navigate("/login");
    };
    
    // 👇 The new function to handle navigation to the invitations page
    const handleViewInvitations = () => {
        // Navigate to the path defined in App.js for FamilyInvitations
        // We will assume the path is the more readable/conventional "/family/invitations"
        navigate("/family/invitations"); 
    };

    return (
        <div className="dashboard-page">
            <header>
                <h2>{user.name}'s Family Dashboard</h2>
            </header>
            <div className="container">
                
                <div className="card welcome-card">
                    <h3>Welcome, {user.name}</h3>
                    <p>Email: {user.email}</p>
                </div>

                <div className="card members-list">
                    <h2>Family Members</h2>
                    {family.length === 0 ? (
                         <p>No family members found. Send an invite or accept a request!</p>
                    ) : (
                        family.map((member, idx) => (
                            <div className="member-card" key={idx}>
                                <p>
                                    <b>{member.name}</b> is your <i>{member.relationship_type}</i>
                                </p>
                                {/* Add actions here, e.g., <button>View Vitals</button> */}
                            </div>
                        ))
                    )}
                </div>

                <div className="card actions-card">
                    <h3>Manage Connections</h3>
                    
                    {/* 👇 Updated button to call the new handler and use the correct path */}
                    <button onClick={() => navigate("/family/invitations")}>View Pending Invitations</button>
                    
                    {/* Assuming you have a separate component for sending invites */}
                    <button onClick={() => navigate("/family/send-invite")}>Send Family Invite</button>
                    {/* <button onClick={loadData} className="refresh-btn">Refresh Family List</button> */}

                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </div>
        </div>
    );
}