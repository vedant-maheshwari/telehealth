import React, { useState, useEffect, useCallback, useRef } from 'react';
import './create_appointment.css';
import {
  getAvailableSlots,
  reserveSlot,
  confirmSlot,
  cancelSlot,
  setupWebSocket,
} from '../../services/api';

const DEFAULT_DOCTOR_ID = 3;
const DEFAULT_USER_ID = 1;

/**
 * Utility to get today's date in YYYY-MM-DD format.
 */
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const AppointmentBooking = () => {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // --- State Variables ---
  const [doctorId, setDoctorId] = useState(DEFAULT_DOCTOR_ID);
  const [date, setDate] = useState(getTodayDateString());
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [slots, setSlots] = useState([]); // List of available time strings
  const [reservedSlots, setReservedSlots] = useState({}); // { 'YYYY-MM-DDT...': true }
  const [selectedTime, setSelectedTime] = useState(null); // The currently selected time string
  const [ownReservedKey, setOwnReservedKey] = useState(null); // Key for the slot reserved by the current user: 'DOCTOR_ID:DATETIME'
  const [status, setStatus] = useState({ message: '', type: null }); // { message: '...', type: 'success' | 'error' | null }
  const [wsStatus, setWsStatus] = useState('Disconnected');
  const [showModal, setShowModal] = useState(false);

  // Use a ref to hold the WebSocket connection so it persists across renders
  const wsRef = useRef(null);

  // --- Status and Utility Functions ---

  /**
   * Displays a status message temporarily.
   */
  const showStatus = useCallback((message, isError = false) => {
    setStatus({ message, type: isError ? 'error' : 'success' });
    setTimeout(() => {
      setStatus({ message: '', type: null });
    }, 5000);
  }, []);

  // --- Sidebar Navigation Functions ---
  const handleNavigation = (page) => {
    console.log(`Navigating to: ${page}`);
    if (page === 'dashboard') {
      // Navigate to patient dashboard
      window.location.href = '/patient_dashboard.html';
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Clear any stored user data
      localStorage.clear();
      sessionStorage.clear();
      // Navigate to login page
      window.location.href = '/login.html';
    }
  };

  // --- Core Logic Functions ---

  /**
   * Updates the slots state based on a new WebSocket message.
   */
  const handleWebSocketMessage = useCallback((data) => {
    const slotTime = data.slot_time.substring(11, 19); // "HH:MM:SS"
    const key = `${doctorId}:${data.slot_time}`;

    setReservedSlots((prev) => {
      const newReserved = { ...prev };
      if (data.action === 'reserved') {
        newReserved[key] = true;
        showStatus(`Slot ${slotTime} was reserved by another user`);
        // If another user reserved the selected slot, clear selection
        if (selectedTime === slotTime && ownReservedKey !== key) {
          setSelectedTime(null);
        }
      } else if (data.action === 'freed') {
        delete newReserved[key];
        showStatus(`Slot ${slotTime} is now available`);
      }
      return newReserved;
    });
  }, [doctorId, ownReservedKey, selectedTime, showStatus]);

  /**
   * Disconnects the old WS and connects a new one.
   */
  const connectWebSocket = useCallback((newDoctorId) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    // Only connect if we have a valid doctorId
    if (newDoctorId) {
      wsRef.current = setupWebSocket(newDoctorId, handleWebSocketMessage, setWsStatus);
    }
  }, [handleWebSocketMessage]);

  /**
   * Fetches available slots from the backend.
   */
  const handleLoadSlots = async () => {
    if (!doctorId || !date || !userId) {
      showStatus('Please fill in all fields', true);
      return;
    }

    try {
      // 1. Load available slots
      const availableTimes = await getAvailableSlots(doctorId, date);

      // 2. Clear previous state
      setSlots(availableTimes);
      setReservedSlots({});
      setSelectedTime(null);
      setOwnReservedKey(null);
      setShowModal(false);

      // 3. Setup WebSocket for real-time updates
      // connectWebSocket(doctorId);

      showStatus(`Loaded ${availableTimes.length} available slots`);
    } catch (error) {
      console.error('Failed to load slots:', error);
      setSlots([]);
    }
  };

  /**
   * Handles user click on a time slot.
   */
  const handleSlotClick = (time) => {
    const key = `${doctorId}:${date}T${time}`;

    // 1. Block if slot reserved by others
    if (reservedSlots[key] && ownReservedKey !== key) {
      showStatus('This slot is already reserved by another user', true);
      return;
    }

    // 2. If slot is reserved by self, open modal
    if (ownReservedKey === key) {
      setShowModal(true);
      return;
    }

    // 3. Otherwise, select the slot
    setSelectedTime(time === selectedTime ? null : time);
  };

  /**
   * Sends a request to reserve the selected slot.
   */
  const handleReserveSlot = async () => {
    if (!selectedTime) {
      showStatus('Please select a slot first', true);
      return;
    }

    const appointmentDateTime = `${date}T${selectedTime}`;

    try {
      const result = await reserveSlot(userId, doctorId, appointmentDateTime, showStatus);

      const reservedKey = `${doctorId}:${appointmentDateTime}`;
      setOwnReservedKey(reservedKey);
      setReservedSlots(prev => ({ ...prev, [reservedKey]: true }));
      showStatus(`Slot reserved! Expires in ${result.expires_in} seconds`);

      // Mark slot as reserved by self and open modal
      setSelectedTime(null);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to reserve slot:', error);
    }
  };

  /**
   * Sends a request to confirm the reserved slot.
   */
  const handleConfirmSlot = async () => {
    if (!ownReservedKey) {
      showStatus('No reserved slot to confirm', true);
      return;
    }

    try {
      // ownReservedKey is 'DOCTOR_ID:DATETIME', split it up
      const [docId, dateTime] = ownReservedKey.split(':');
      await confirmSlot(userId, docId, dateTime, showStatus);

      showStatus('Booking confirmed successfully! 🎉');
      setOwnReservedKey(null);
      setShowModal(false);
      // Reload slots after confirmation to reflect permanent booking status (optional, but good for cleanliness)
      setTimeout(handleLoadSlots, 1000);
    } catch (error) {
      console.error('Failed to confirm slot:', error);
    }
  };

  /**
   * Sends a request to cancel the reserved slot.
   */
  const handleCancelSlot = async () => {
    if (!ownReservedKey) {
      showStatus('No reserved slot to cancel', true);
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

    try {
      // ownReservedKey is 'DOCTOR_ID:DATETIME', split it up
      const [docId, dateTime] = ownReservedKey.split(':');
      await cancelSlot(userId, docId, dateTime, showStatus);

      showStatus('Reservation cancelled successfully');
      setOwnReservedKey(null);
      setShowModal(false);
      // Reload slots to reflect the slot is now free
      setTimeout(handleLoadSlots, 1000);
    } catch (error) {
      console.error('Failed to cancel slot:', error);
    }
  };

  // --- Effects and Cleanup ---

  // Cleanup effect: Close WebSocket when the component unmounts
  useEffect(() => {
    return () => {
      // if (wsRef.current) {
      //   wsRef.current.close();
      // }
    };
  }, []);

  // --- Render Functions ---

  const wsStatusClass = wsStatus === 'Connected' ? 'connected' : 'disconnected';
  const selectedSlotTime = ownReservedKey ? ownReservedKey.split('T')[1].substring(0, 5) : selectedTime;

  return (
    <div className="appointment-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">🩺</div>
            <div className="brand-text">
              <h3>MediBook</h3>
              <p>Healthcare Portal</p>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            ×
          </button>
        </div>

        {/* User Profile */}
        <div className="sidebar-user">
          <div className="user-avatar">👤</div>
          <div className="user-info">
            <p className="user-name">Patient Portal</p>
            <p className="user-id">ID: {DEFAULT_USER_ID}</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => handleNavigation('dashboard')}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Dashboard</span>
          </button>
          <button className="nav-item active">
            <span className="nav-icon">📅</span>
            <span className="nav-label">Book Appointment</span>
          </button>
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main Content */}
      <div className={`main-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Top Navigation */}
        <div className="top-nav">
          <div className="nav-left">
            <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
            <button className="back-btn" onClick={() => handleNavigation('dashboard')}>
              ← Back to Dashboard
            </button>
          </div>
          <div className="nav-center">
            <h1 className="page-title">Book Appointment</h1>
          </div>
        </div>

        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="title-icon">🩺</span>
              Book Your Appointment
            </h1>
            <p className="hero-subtitle">Schedule your consultation with our expert doctors</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Booking Form */}
          <div className="booking-form-card">
            <div className="card-header">
              <h2>Appointment Details</h2>
              <div className={`websocket-indicator ${wsStatusClass}`}>
                <div className="status-dot"></div>
                <span>{wsStatus}</span>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="doctorIdInput">
                  <span className="label-icon">👨‍⚕️</span>
                  Doctor ID
                </label>
                <div className="input-wrapper">
                  <input
                    id="doctorIdInput"
                    type="number"
                    value={doctorId}
                    onChange={(e) => setDoctorId(parseInt(e.target.value, 10) || '')}
                    placeholder="Enter doctor ID"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="dateInput">
                  <span className="label-icon">📅</span>
                  Appointment Date
                </label>
                <div className="input-wrapper">
                  <input
                    id="dateInput"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="userIdInput">
                  <span className="label-icon">👤</span>
                  User ID
                </label>
                <div className="input-wrapper">
                  <input
                    id="userIdInput"
                    type="number"
                    value={userId}
                    onChange={(e) => setUserId(parseInt(e.target.value, 10) || '')}
                    placeholder="Enter user ID"
                  />
                </div>
              </div>
            </div>

            <div className="load-slots-section">
              <button className="load-slots-btn" onClick={handleLoadSlots}>
                <span className="btn-icon">🔄</span>
                Load Available Slots
              </button>
            </div>
          </div>

          {/* Time Slots Section */}
          <div className="slots-section">
            <div className="slots-header">
              <h3>
                <span className="header-icon">⏰</span>
                Available Time Slots
              </h3>
              {slots.length > 0 && (
                <div className="slots-count">
                  {slots.length} slots available
                </div>
              )}
            </div>

            <div className="slots-container" id="slotsContainer">
              {slots.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>Click "Load Available Slots" to see available appointments</p>
                </div>
              ) : (
                <div className="slots-grid">
                  {slots.map((time) => {
                    const key = `${doctorId}:${date}T${time}`;
                    const isReserved = !!reservedSlots[key];
                    const isSelected = selectedTime === time;
                    const isOwnReserved = ownReservedKey === key;
                    
                    let className = 'time-slot';
                    if (isReserved && !isOwnReserved) className += ' reserved';
                    if (isSelected) className += ' selected';
                    if (isOwnReserved) className += ' own-reserved';

                    return (
                      <div
                        key={time}
                        className={className}
                        data-time={time}
                        data-key={key}
                        onClick={() => handleSlotClick(time)}
                      >
                        <div className="slot-time">{time}</div>
                        {isOwnReserved && <div className="slot-badge">Your Hold</div>}
                        {isReserved && !isOwnReserved && <div className="slot-badge reserved-badge">Reserved</div>}
                        <div className="slot-hover-effect"></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="actions-section">
            <button 
              className="action-btn primary"
              onClick={handleReserveSlot} 
              disabled={!selectedTime || !!ownReservedKey}
            >
              <span className="btn-icon">📌</span>
              Reserve Selected Slot
            </button>
            
            <button
              className="action-btn secondary"
              onClick={() => setShowModal(true)}
              disabled={!ownReservedKey}
            >
              <span className="btn-icon">✅</span>
              Manage Reserved Slot
            </button>
          </div>
        </div>
      </div>

      {/* Status Toast */}
      <div 
        className={`status-toast ${status.type} ${status.message ? 'show' : ''}`}
        aria-live="polite"
      >
        <div className="toast-icon">
          {status.type === 'success' ? '✅' : '⚠️'}
        </div>
        <div className="toast-message">{status.message}</div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Your Reservation</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="reservation-info">
                <div className="time-display">
                  <span className="time-icon">⏰</span>
                  <span className="time-text" id="modalTime">{selectedSlotTime}</span>
                </div>
                <p>Your slot is reserved. What would you like to do?</p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn confirm" onClick={handleConfirmSlot}>
                <span className="btn-icon">✅</span>
                Confirm Booking
              </button>
              <button className="modal-btn cancel" onClick={handleCancelSlot}>
                <span className="btn-icon">❌</span>
                Cancel Reservation
              </button>
              <button className="modal-btn neutral" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Decorations */}
      <div className="bg-decoration decoration-1"></div>
      <div className="bg-decoration decoration-2"></div>
      <div className="bg-decoration decoration-3"></div>
    </div>
  );
};

export default AppointmentBooking;