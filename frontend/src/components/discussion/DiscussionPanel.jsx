import { useEffect, useState, useRef } from "react";
import socket from "../../services/socket";
import api from "../../api/axios";
import MessageItem from "./MessageItem";
import Button from "../ui/Button";

export default function DiscussionPanel({ eventId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/discussions/${eventId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  useEffect(() => {
    if (!eventId) return;

    fetchMessages();

    socket.emit("joinEventRoom", eventId);

    const handleNewMessage = (message) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [eventId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await api.post(`/discussions/${eventId}`, {
        message: newMessage,
      });

      const savedMessage = res.data.data;

      setMessages((prev) =>
        prev.some((msg) => msg._id === savedMessage._id)
          ? prev
          : [...prev, savedMessage]
      );

      setNewMessage("");
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="font-semibold mb-4">Discussion Forum</h3>

      <div className="max-h-80 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg) => (
          <MessageItem key={msg._id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border p-2 rounded-lg"
          placeholder="Write a message..."
        />

        <Button onClick={sendMessage}>
          Send
        </Button>
      </div>
    </div>
  );
}