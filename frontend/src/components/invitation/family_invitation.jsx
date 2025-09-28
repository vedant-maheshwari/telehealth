import React, { useEffect, useState, useCallback } from "react";
import { getPendingInvites, respondInvite } from "../../services/api"; // Removed loadInvites as it's defined locally
import './family.css';
import { useNavigate } from "react-router-dom";


export default function FamilyInvitations() {
    const [invites, setInvites] = useState([]);
    const token = sessionStorage.getItem("token");
    const navigate = useNavigate();

    // 1. Wrap loadInvites in useCallback to prevent infinite useEffect loops
    // and correctly handle the dependency on 'token' and 'getPendingInvites'
    const loadInvites = useCallback(async () => {
        if (!token) return; // Guard clause
        try {
            // Note: The token is already available from the outer scope
            const data = await getPendingInvites(token);
            setInvites(data);
        } catch (err) {
            console.error(err);
            alert("Failed to load invitations");
        }
    }, [token]); // DEPENDENCY: Reruns only if token changes

    const handleResponse = async (inviteToken, action) => {
        try {
            const res = await respondInvite(token, inviteToken, action);
            alert(`Invitation ${action}ed successfully!`);             
            if (action === 'accept') {
        // Redirect user back to the main family dashboard after acceptance
                navigate("/family-dashboard"); 
            } else {
                // If rejected, just reload the invites list on the current page
                loadInvites();
            }
        } catch (err) {
            console.error(err);
            // Ensure error message is readable
            const errorMsg = err.message || "Failed to respond"; 
            alert(`Error responding to invitation: ${errorMsg}`);
        }
    };

    useEffect(() => {
        // 4. Call loadInvites directly, using it as a dependency is cleaner
        loadInvites();
    }, [loadInvites]); // DEPENDENCY: Now correctly depends on the memoized function

    // ... (rest of the return statement is unchanged)
    return (
        <div className="family-container">
            <h2>Pending Invitations</h2>
            {invites.length === 0 && <p>No pending invitations</p>}
            {invites.map((invite, idx) => (
                <div key={idx} className="invite-card">
                    {/* Assuming the invite object contains inviter_name and relationship_type */}
                    <p><b>{invite.inviter_name}</b> invited you as <i>{invite.relationship_type}</i></p>
                    {/* The crucial invite.token is correctly passed here */}
                    <button onClick={() => handleResponse(invite.token, 'accept')}>Accept</button>
                    <button onClick={() => handleResponse(invite.token, 'reject')}>Reject</button>
                </div>
            ))}
        </div>
    );
}