import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getChatMessages, getWsToken, API_BASE_URL } from "../../services/api";
import "./chat_room.css";

export default function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState({ dot: "connecting", text: "Connecting..." });
  const [input, setInput] = useState("");
  const [chatTitle, setChatTitle] = useState("Chat Room");

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  const token = sessionStorage.getItem("token");
  const userId = Number(sessionStorage.getItem("user_id"));
  const role = sessionStorage.getItem("role");
  const chatId = Number(searchParams.get("chatId"));

  // Redirect if missing
  useEffect(() => {
    if (!token || !chatId) {
      alert("Login and chatId required");
      navigate("/login");
      return;
    }
    setChatTitle(`Chat Room ${chatId}`);
  }, [token, chatId, navigate]);

  // Load history
  useEffect(() => {
    async function loadHistory() {
      try {
        const msgs = await getChatMessages(chatId, token);
        setMessages(msgs.length ? msgs : [{ system: true, content: "Start the conversation" }]);
      } catch (err) {
        setMessages([{ system: true, content: "Failed to load messages" }]);
      }
    }
    loadHistory();
  }, [chatId, token]);

  // WebSocket connect
  useEffect(() => {
    let ws;
    async function connect() {
      try {
        setStatus({ dot: "connecting", text: "Connecting..." });
        const { ws_token } = await getWsToken(token);

        const wsProtocol = API_BASE_URL.startsWith("https") ? "wss" : "ws";
        const wsBase = API_BASE_URL.replace(/^https?:\/\//, "");
        ws = new WebSocket(`${wsProtocol}://${wsBase}/chats/ws/${chatId}?ws_token=${ws_token}`);
        wsRef.current = ws;

        ws.onopen = () => setStatus({ dot: "connected", text: "Connected" });
        ws.onmessage = (ev) => setMessages((prev) => [...prev, JSON.parse(ev.data)]);
        ws.onclose = () => {
          setStatus({ dot: "disconnected", text: "Disconnected" });
          setTimeout(connect, 3000);
        };
        ws.onerror = () => setStatus({ dot: "disconnected", text: "Connection error" });
      } catch (err) {
        setStatus({ dot: "disconnected", text: "Failed to connect" });
      }
    }
    connect();
    return () => ws?.close();
  }, [chatId, token]);

  // Scroll to bottom
  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ content: input }));
    setInput("");
  };

  const goBack = () => {
    if (role === "doctor") navigate("/doctor-dashboard");
    else if (role === "patient") navigate("/chat");
    else if (role === "family") navigate("/family-dashboard");
    else if (role === "admin") navigate("/admin-dashboard");
    else navigate("/chat");
  };

  return (
    <div>
      <header className="header">
        <a href="/" className="logo">TeleHealth Platform</a>
        <button onClick={goBack} className="back-btn">← Back to Messages</button>
        <div className="connection-status">
          <div className={`status-dot ${status.dot}`}></div>
          <span>{status.text}</span>
        </div>
      </header>

      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-title">{chatTitle}</div>
        </div>

        <div id="messages">
          {messages.map((msg, i) =>
            msg.system ? (
              <div key={i} className="system-message">{msg.content}</div>
            ) : (
              <div
                key={i}
                className={`message-bubble ${Number(msg.sender_id) === userId ? "own" : "other"}`}
              >
                <div className="message-content">{msg.content}</div>
                <div className="message-meta">{new Date(msg.timestamp).toLocaleTimeString()}</div>
              </div>
            )
          )}
          <div ref={messagesEndRef}></div>
        </div>

        <div id="inputRow">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || status.dot !== "connected"}>Send</button>
        </div>
      </div>
    </div>
  );
}
