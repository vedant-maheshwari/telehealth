import React, { useState } from "react";
import { sendFamilyInvite } from "../../services/api";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection/login check
import './family.css';

// Define the relationships that match the backend Enum (RelationshipType)
const VALID_RELATIONSHIPS = [
    'SPOUSE',
    'SIBLING',
    'PARENT'
];

export default function SendFamilyInvite() {
    const [email, setEmail] = useState("");
    const [relationship, setRelationship] = useState("");
    const navigate = useNavigate();
    const token = sessionStorage.getItem("token");

    // Check for token on mount (basic security)
    if (!token) {
        navigate("/login");
        return null; // Return null while redirecting
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !relationship) {
            alert("Please fill in both email and relationship.");
            return;
        }

        try {
            // Note: The backend expects the value from the select (e.g., 'SPOUSE')
            const res = await sendFamilyInvite(token, email, relationship);
            
            alert(res.message || "Invitation sent successfully!");
            
            // Clear form upon success
            setEmail("");
            setRelationship("");
        } catch (err) {
            console.error(err);
            // Improved error display
            const errorDetail = err.response?.data?.detail || err.message;
            alert(`Failed to send invitation: ${errorDetail}`);
        }
    };

    return (
        <div className="family-container">
            <h2>Invite Family Members</h2>
            <form onSubmit={handleSubmit} className="invite-form">
                
                <label htmlFor="inviteEmail">Email:</label>
                <input 
                    id="inviteEmail"
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="family.member@example.com"
                    required 
                />

                <label htmlFor="relationshipType">Relationship:</label>
                {/* CHANGE: Replaced text input with a select dropdown.
                  This ensures the value sent matches the backend Enum (SPOUSE, SIBLING, PARENT).
                */}
                <select 
                    id="relationshipType"
                    value={relationship} 
                    onChange={e => setRelationship(e.target.value)} 
                    required
                >
                    <option value="" disabled>Select Relationship Type</option>
                    {VALID_RELATIONSHIPS.map(rel => (
                        <option key={rel} value={rel.toLowerCase()}>{rel}</option>
                    ))}
                </select>

                <button type="submit">Send Invitation</button>
            </form>
        </div>
    );
}