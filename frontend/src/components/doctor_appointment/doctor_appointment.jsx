import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { getAllAppointments, respondToAppointment } from '../../services/api'; // Adjust path
import './doctor_appointment.css';

// Component for the Appointment Modal
const AppointmentModal = ({ isOpen, onClose, event, onRespond }) => {
    if (!isOpen || !event) return null;

    // Helper to format Date objects
    const formatDateTime = (date) => 
        date ? new Date(date).toLocaleString() : 'N/A';

    // Access properties from event object
    const appointmentId = event.id;
    const patientName = event.title;
    const start = formatDateTime(event.start);
    const end = formatDateTime(event.end);
    const status = event.extendedProps.status;

    return (
        <div id="appointmentModal" className="modal" style={{ display: 'block' }}>
            <div className="modal-content">
                <div className="modal-header">Appointment Details</div>
                <div className="modal-body">
                    <p><strong>Patient:</strong> <span id="modal-patient">{patientName}</span></p>
                    <p><strong>Start:</strong> <span id="modal-start">{start}</span></p>
                    <p><strong>End:</strong> <span id="modal-end">{end}</span></p>
                    <p><strong>Status:</strong> <span id="modal-status">{status}</span></p>
                </div>
                <div className="modal-footer">
                    <button 
                        className="btn btn-accept" 
                        onClick={() => onRespond("accepted", appointmentId)}>Accept</button>
                    <button 
                        className="btn btn-reject" 
                        onClick={() => onRespond("rejected", appointmentId)}>Reject</button>
                    <button 
                        className="btn btn-cancel" 
                        onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

const DoctorAppointment = () => {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const loadAppointments = useCallback(async () => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        try {
            const rawEvents = await getAllAppointments();
            
            // Map raw data to FullCalendar event format, adding color based on status
            const formattedEvents = rawEvents.map(ev => {
                let color;
                if (ev.status === "accepted") {
                    color = "green";
                } else if (ev.status === "rejected") {
                    color = "red";
                } else {
                    color = "blue"; // pending
                }

                return {
                    id: ev.id,
                    title: ev.title, // Patient Name
                    start: ev.start, // ISO string
                    end: ev.end,     // ISO string
                    extendedProps: { status: ev.status },
                    color: color
                };
            });
            setEvents(formattedEvents);

        } catch (error) {
            console.error("Failed to load appointments:", error);
            alert(`Failed to load appointments: ${error.message}`);
            // Optionally redirect on severe error
        }
    }, [navigate]);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);


    const handleEventClick = (clickInfo) => {
        // FullCalendar passes the Event object in clickInfo.event
        setSelectedEvent(clickInfo.event);
        setIsModalOpen(true);
    };

    const handleRespond = async (action, appointmentId) => {
        try {
            // Note: The action must be lowercase as expected by the backend schema
            const backendAction = action.toLowerCase(); 
            const data = await respondToAppointment(appointmentId, backendAction);
            alert(`Appointment ${data.status}`); // Assuming backend returns {status: "updated successfully"}
            setIsModalOpen(false);
            
            // Reload appointments to update the calendar view
            loadAppointments(); 

        } catch (error) {
            alert(`Failed to update appointment: ${error.message}`);
            console.error("Response failed:", error);
        }
    };

    return (
        <div className="appointment-page">
            <header>
                <h2>Your Appointments</h2>
            </header>
            <div id="calendar-container">
                <FullCalendar
                    plugins={[dayGridPlugin]}
                    initialView='dayGridMonth'
                    events={events}
                    eventClick={handleEventClick}
                    height="auto"
                />
            </div>
            
            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                event={selectedEvent}
                onRespond={handleRespond}
            />
        </div>
    );
};

export default DoctorAppointment;