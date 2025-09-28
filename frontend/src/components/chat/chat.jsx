import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyChats, createChatRoom } from "../../services/api";
import "./chat.css";

export default function Chat() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createVisible, setCreateVisible] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [participants, setParticipants] = useState("");

  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadRooms();
  }, [token, navigate]);

  async function loadRooms() {
    setLoading(true);
    try {
      const data = await getMyChats(token);
      setRooms(data);
    } catch (err) {
      console.error(err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }

  const openRoom = (id) => navigate(`/chat-room?chatId=${id}`);

  const handleCreateRoom = async () => {
    if (!roomName || !participants) return alert("Fill name and participants");
    const ids = participants.split(",").map(Number).filter((n) => !isNaN(n));
    try {
      const newRoom = await createChatRoom(roomName, ids, token);
      setRoomName("");
      setParticipants("");
      setCreateVisible(false);
      loadRooms();
      openRoom(newRoom.id);
    } catch (err) {
      alert("Failed to create room: " + err.message);
    }
  };

  return (
    <div className="chat-page">
      <h1>Messages</h1>

      <button onClick={loadRooms}>Refresh</button>
      {role === "doctor" || role === "admin" ? (
        <button onClick={() => setCreateVisible((prev) => !prev)}>
          {createVisible ? "Hide Create" : "Create Room"}
        </button>
      ) : null}

      {createVisible && (
        <div className="create-room">
          <input
            type="text"
            placeholder="Room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Participants (comma-separated IDs)"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
          />
          <button onClick={handleCreateRoom}>Create Room</button>
        </div>
      )}

      {loading ? (
        <p>Loading chat rooms...</p>
      ) : rooms.length === 0 ? (
        <p>No chat rooms yet</p>
      ) : (
        rooms.map((room) => (
          <div key={room.id} className="chat-room-card" onClick={() => openRoom(room.id)}>
            <h3>{room.name}</h3>
            <p>{room.last_message || "No messages yet"}</p>
          </div>
        ))
      )}
    </div>
  );
}
