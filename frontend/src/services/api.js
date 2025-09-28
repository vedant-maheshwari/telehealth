const API_BASE_URL = "http://127.0.0.1:8000";
const API_BASE_URL_without_http = "127.0.0.1:8000"; 
export { API_BASE_URL };
    
export const login = async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password: password }), 
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Invalid email or password");
    }
    return res.json();
};

// export const registerPatient = async (payload) => {
//     const res = await fetch(`${API_BASE_URL}/register_patient`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//     });
//     if (!res.ok) {
//         const err = await res.json().catch(() => ({}));
//         throw new Error(err.detail || "Registration failed");
//     }
//     return res.json();
// };
export const registerPatient = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/register_patient`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || JSON.stringify(err));
  }
  return await res.json();
};

export const registerDoctor = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/register_doctor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || JSON.stringify(err));
  }
  return await res.json();
};

export const registerFamily = async (payload) => {
  const res = await fetch(`${API_BASE_URL}/register_family`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || JSON.stringify(err));
  }
  return await res.json();
};


async function fetchWithErrorHandling(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || `HTTP ${response.status}`);
  }
  return data;
}

// // Get available slots for a doctor on a date
// export async function getAvailableSlots(doctorId, appDate) {
//   const url = `${API_BASE_URL}/available_appointment?doctor_id=${doctorId}&app_date=${appDate}`;
//   return await fetchWithErrorHandling(url);
// }

// // Reserve a slot
// export async function reserveSlot(userId, doctorId, appointmentDateTime) {
//   const appointment = {
//     doctor_id: doctorId,
//     appointment_date: appointmentDateTime,
//   };
//   const url = `${API_BASE_URL}/reserve_slot?user_id=${userId}`;
//   return await fetchWithErrorHandling(url, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(appointment),
//   });
// }

// // Confirm a slot
// export async function confirmSlot(userId, doctorId, appointmentDateTime) {
//   const appointment = {
//     doctor_id: doctorId,
//     appointment_date: appointmentDateTime,
//   };
//   const url = `${API_BASE_URL}/confirm_slot?user_id=${userId}`;
//   return await fetchWithErrorHandling(url, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(appointment),
//   });
// }

// // Cancel a reservation
// export async function cancelSlot(userId, doctorId, appointmentDateTime) {
//   const url = `${API_BASE_URL}/cancel_slot?doctor_id=${doctorId}&slot_time=${encodeURIComponent(appointmentDateTime)}&user_id=${userId}`;
//   return await fetchWithErrorHandling(url, { method: "POST" });
// }

// api.js (TEMPORARY MOCK IMPLEMENTATIONS)

// MOCK: Get available slots for a doctor on a date
export async function getAvailableSlots(doctorId, appDate) {
    console.warn("MOCK API: getAvailableSlots called. Returning dummy slots to bypass backend crash.");
    
    // Simulate a successful API call returning valid time slots (HH:MM:SS format)
    return [
        "09:00:00",
        "09:30:00",
        "10:00:00",
        "10:30:00",
        "14:00:00",
        "14:30:00"
    ];
}

// MOCK: Reserve a slot (Bypasses Redis lock logic)
export async function reserveSlot(userId, doctorId, appointmentDateTime) {
    console.warn("MOCK API: reserveSlot called. Slot reserved for 300 seconds.");
    
    // The frontend expects "expires_in" to calculate remaining hold time
    return { "message": "Slot reserved", "expires_in": 300 };
}

// MOCK: Confirm a slot (Bypasses permanent booking logic)
export async function confirmSlot(userId, doctorId, appointmentDateTime) {
    console.warn("MOCK API: confirmSlot called. Booking confirmed.");
    return { "message": "Booking confirmed" };
}

// MOCK: Cancel a reservation (Bypasses Redis key deletion)
export async function cancelSlot(userId, doctorId, appointmentDateTime) {
    console.warn("MOCK API: cancelSlot called. Reservation cancelled.");
    return { "message": "Reservation cancelled and slot freed" };
}

// Note: Ensure your original `fetchWithErrorHandling` and `API_BASE_URL` are still defined in api.js, 
// as other functions (like login/vitals) may still need them.


export async function getUser(token) {
  const res = await fetch(`${API_BASE_URL}/user/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return await res.json();
}

export async function getVitals(token) {
  const res = await fetch(`${API_BASE_URL}/get_vital`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch vitals");
  return await res.json();
}

export async function createChatRoom(token, name, participant_ids) {
  const res = await fetch(`${API_BASE_URL}/chats/create`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, participant_ids }),
  });
  if (!res.ok) throw new Error("Failed to create chat room");
  return res.json();
}

export async function getMyChats(token) {
  const res = await fetch(`${API_BASE_URL}/chats/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch chats");
  return res.json();
}

export async function addVitals(token, patient_email, bp) {
  const res = await fetch(`${API_BASE_URL}/add_vital`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ patient_email, bp }),
  });
  if (!res.ok) throw new Error("Failed to add vitals");
  return res.json();
}

export async function getFamilyMembers(token) {
  const res = await fetch(`${API_BASE_URL}/family/get_all_family_members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch family members");
  return res.json();
}

// export async function sendInvitation(token, email, relationship_type) {
//   const res = await fetch(`${API_BASE_URL}/family/send_invitation`, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ email, relationship_type }),
//   });
//   if (!res.ok) throw new Error("Failed to send invitation");
//   return res.json();
// }

export async function getChatMessages(chatId, token) {
  const res = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
    headers: { Authorization: "Bearer " + token },
  });
  if (!res.ok) throw new Error("Failed to fetch chat messages");
  return res.json();
}

export async function getWsToken(token) {
  const res = await fetch(`${API_BASE_URL}/ws-token`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
  });
  if (!res.ok) throw new Error("Failed to fetch websocket token");
  return res.json();
}


export async function getChatRooms(token) {
  const res = await fetch(`${API_BASE_URL}/chats/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to get chat rooms");
  return await res.json();
}

export async function getCurrentUser(token) {
  const res = await fetch(`${API_BASE_URL}/user/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch user info");
  return res.json();
}

// Logout (just clearing local/session storage)
export function logoutUser() {
  sessionStorage.clear();
  localStorage.clear();
}

export async function getPendingInvites(token) {
    const res = await fetch(`${API_BASE_URL}/family/family_invitation_for_current_user`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch invitations");
    return res.json();
}

export async function respondInvite(token, inviteToken, action) {
    const res = await fetch(`${API_BASE_URL}/family/respond_invitation`, {
        method: "PUT",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ token: inviteToken, action: action })
    });
    if (!res.ok) throw new Error("Failed to respond to invitation");
    return res.json();
}

const handleResponse = async (res) => {
    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
        const errorMessage = errorBody.detail 
            ? (Array.isArray(errorBody.detail) ? errorBody.detail[0].msg : errorBody.detail) 
            : `HTTP error ${res.status}`;
        throw new Error(errorMessage);
    }
    return res.json();
};

export const getUserMe = async (token) => {
    const res = await fetch(`${API_BASE_URL}/user/me`, {
        headers: { "Authorization": "Bearer " + token }
    });
    return handleResponse(res);
};

export const viewMyChats = async () => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/chats/my`, {
        headers: { "Authorization": "Bearer " + token }
    });
    return handleResponse(res);
};


export const addPatientVitals = async (patient_email, bp) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/add_vital`, {
        method: "POST",
        headers: { 
            "Authorization": "Bearer " + token, 
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({ patient_email, bp })
    });
    return handleResponse(res);
};

// export const getAllAppointments = async () => {
//     const token = sessionStorage.getItem("token");
//     const res = await fetch(`${API_BASE_URL}/get_all_appointments`, {
//         headers: { "Authorization": "Bearer " + token }
//     });
//     return handleResponse(res);
// };

export const respondToAppointment = async (appointment_id, action) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/appointment_response`, {
        method: "PUT",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ appointment_id, action })
    });
    return handleResponse(res);
};

// api.js (required addition)


export const sendFamilyInvite = async (token, invitee_email, relationship_type) => {
    // Assuming the backend endpoint is '/family/send_invite' or similar
    const res = await fetch(`${API_BASE_URL}/family/send_invitation`, { 
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        },
        // The payload must match the InvitationRequest schema (invitee_email, relationship_type)
        body: JSON.stringify({ 
            invitee_email: invitee_email, 
            relationship_type: relationship_type 
        })
    });
    return handleResponse(res); 
    // Assuming handleResponse is a helper that throws an error on !res.ok
};

export function setupWebSocket(doctorId, handleMessage, setWsStatus) {
  // Use 'ws:' instead of 'wss:' because API_BASE_URL is 'http:'
  const protocol = 'ws:'; 
  const wsUrl = `${protocol}//${API_BASE_URL_without_http}/ws/doctor/${doctorId}/slots`;

  const wsConnection = new WebSocket(wsUrl);

  wsConnection.onopen = () => {
    setWsStatus('Connected');
    console.log('WebSocket connected');
  };

  wsConnection.onclose = () => {
    setWsStatus('Disconnected');
    console.log('WebSocket disconnected');
  };

  wsConnection.onerror = (error) => {
    setWsStatus('Error');
    console.error('WebSocket error:', error);
  };

  wsConnection.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Data check removed: let the component handle doctor_id filtering
      handleMessage(data); 
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };

  return wsConnection;
}

// export const removeFamilyMember = async (token, memberId) => {
//   const response = await fetch(`${API_BASE_URL}/family/remove_family_member/${memberId}`, {
//     method: 'DELETE',
//     headers: {
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json'
//     }
//   });
  
//   if (!response.ok) {
//     throw new Error('Failed to remove family member');
//   }
  
//   return response.json();
// };
// api.js (TEMPORARY MOCK)

// Assuming your remove function looks like this:
export async function removeFamilyMember(token, memberId) {
    console.warn("MOCK API: removeFamilyMember called. Simulating successful removal.");
    
    // Simulate the successful response the frontend expects for deletion.
    return { 
        "message": `Family member ${memberId} successfully removed.` 
    };
    
    // Original code (UNMOCK THIS WHEN BACKEND IS FIXED):
    /*
    const res = await fetch(`${API_BASE_URL}/family/remove_family_member/${memberId}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token },
    });
    return handleResponse(res);
    */
}

// api.js

export async function getPatientAppointments(token) {
    const res = await fetch(`${API_BASE_URL}/patient/appointments`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(res); // Assuming handleResponse handles 401/403 errors
}

// Update the getAllAppointments function to explicitly take the token if it needs it 
// (though it likely gets the token from sessionStorage in your existing implementation).
// Ensure it passes the token in the headers if it relies on auth:
// Ensure this is the only definition of getAllAppointments in your file:

export const getAllAppointments = async (token) => { // Adding token as explicit parameter
    const tokenToUse = token || sessionStorage.getItem("token"); // Fallback
    
    // Check if token exists before making the call
    if (!tokenToUse) {
        throw new Error("Authorization token is missing.");
    }
    
    const res = await fetch(`${API_BASE_URL}/get_all_appointments`, {
        headers: { "Authorization": "Bearer " + tokenToUse }
    });
    return handleResponse(res);
};