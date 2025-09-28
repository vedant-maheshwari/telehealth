import React, { useEffect, useState } from "react";
import "./family_management.css";
import { getFamilyMembers, sendFamilyInvite, removeFamilyMember } from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function FamilyManagement() {
  const [family, setFamily] = useState([]);
  const [email, setEmail] = useState("");
  // Initialize relationship with a default/first option
  const [relationship, setRelationship] = useState("spouse"); 
  const navigate = useNavigate();

  // Define the list of allowed relationships
  const relationshipOptions = ['spouse', 'sibling', 'parent', 'other'];

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    loadFamily();
  }, [navigate]);

  const loadFamily = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const data = await getFamilyMembers(token);
      setFamily(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load family members");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    // Validate email and ensure relationship is selected (should be true since 'spouse' is default)
    if (!email || !relationship) { 
      alert("Please fill in all fields");
      return;
    }

    // Check if email already exists in family
    const emailExists = family.some(member => 
      member.email && member.email.toLowerCase() === email.toLowerCase()
    );
    if (emailExists) {
      alert("This email is already associated with a family member");
      return;
    }

    try {
      const token = sessionStorage.getItem("token");
      const data = await sendFamilyInvite(token, email, relationship);
      alert(data.msg || "Invitation sent!");
      setEmail("");
      setRelationship(relationshipOptions[0]); // Reset to the first option after success
      loadFamily();
    } catch (err) {
      console.error(err);
      // Enhanced error message if the API provides it
      const errorMessage = err.message || "Failed to send invitation";
      alert(errorMessage); 
    }
  };

  // const handleRemoveMember = async (memberId, memberName) => {
  //   if (!window.confirm(`Are you sure you want to remove ${memberName} from your family?`)) {
  //     return;
  //   }

  //   try {
  //     const token = sessionStorage.getItem("token");
  //     await removeFamilyMember(token, memberId);
      
  //     alert(`${memberName} has been removed from your family`);
  //     loadFamily(); // Refresh the list
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to remove family member");
  //   }
  // };
  const handleRemoveMember = async (memberId) => {
    const token = sessionStorage.getItem("token");
    if (!window.confirm('Are you sure you want to remove this family member?')) return;

    try {
        // Assuming your removeFamilyMember function is defined in api.js (or mocked)
        await removeFamilyMember(token, memberId);
        
        alert("Family member removed successfully!"); 

        // CRITICAL FIX: Reload the family list to update the state
        loadFamily(); 

    } catch (err) {
        console.error(err);
        alert("Failed to remove family member: " + (err.message || "Unknown error"));
    }
};

  // Helper function to get relationship icon
  const getRelationshipIcon = (relationship) => {
    const icons = {
      spouse: "💑",
      sibling: "👫",
      parent: "👨‍👩‍👧",
      other: "👤"
    };
    return icons[relationship] || "👤";
  };

  return (
    <div className="family-management">
      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <h2 className="main-title">
            <span className="title-icon">👨‍👩‍👧‍👦</span>
            Family Management
          </h2>
          <p className="subtitle">Manage your family members and send invitations</p>
        </div>
      </div>

      <div className="content-wrapper">
        {/* --- Your Family Members Section --- */}
        <div className="section family-members-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">👥</span>
              Your Family Members
            </h3>
            {family.length > 0 && (
              <div className="member-count">
                {family.length} {family.length === 1 ? 'member' : 'members'}
              </div>
            )}
          </div>
          
          <div className="members-container">
            {family.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👨‍👩‍👧‍👦</div>
                <p className="empty-message">No family members yet.</p>
                <p className="empty-subtitle">Start by inviting your first family member below</p>
              </div>
            ) : (
              <div className="members-grid">
                {family.map((member, index) => (
                  <div className="member-card" key={`${member.id}-${index}`}>
                    <div className="member-avatar">
                      {getRelationshipIcon(member.relationship_type)}
                    </div>
                    <div className="member-info">
                      <div className="member-name">{member.name}</div>
                      <div className="member-relationship">
                        {member.relationship_type.charAt(0).toUpperCase() + member.relationship_type.slice(1)}
                      </div>
                      {member.email && (
                        <div className="member-email">{member.email}</div>
                      )}
                    </div>
                    <div className="member-actions">
                      <div className="member-status">
                        <div className="status-dot active"></div>
                        <span className="status-text">Active</span>
                      </div>
                      <button 
                        className="remove-btn"
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        title="Remove family member"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- Send Invitation Section with Dropdown --- */}
        <div className="section invitation-section">
          <div className="section-header">
            <h3 className="section-title">
              <span className="section-icon">📧</span>
              Send Invitation
            </h3>
          </div>
          
          <div className="invitation-card">
            <form onSubmit={handleInvite} className="invitation-form">
              <div className="form-group">
                <label htmlFor="invite-email" className="form-label">
                  <span className="label-icon">📧</span>
                  Email of family member
                </label>
                <div className="input-wrapper">
                  <input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter email address"
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="relationship-select" className="form-label">
                  <span className="label-icon">🤝</span>
                  Relationship
                </label>
                <div className="select-wrapper">
                  <select
                    id="relationship-select"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    required
                    className="form-select"
                  >
                    {/* Map through the predefined relationship options */}
                    {relationshipOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {getRelationshipIcon(opt)} {opt.charAt(0).toUpperCase() + opt.slice(1)} {/* Capitalize first letter for display */}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="submit-btn">
                <span className="btn-icon">📤</span>
                Send Invitation
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="bg-decoration decoration-1"></div>
      <div className="bg-decoration decoration-2"></div>
    </div>
  );
}