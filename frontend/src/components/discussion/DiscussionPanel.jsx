import { useEffect, useState, useRef } from "react";
import socket from "../../services/socket";
import api from "../../api/axios";
import MessageItem from "./MessageItem";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

export default function DiscussionPanel({ eventId }) {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState(null);
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

    const handleReactionUpdate = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        )
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("newAnnouncement", handleNewMessage);
    socket.on("reactionUpdate", handleReactionUpdate);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("newAnnouncement", handleNewMessage);
      socket.off("reactionUpdate", handleReactionUpdate);
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
        parentMessageId: replyTo,
      });

      const savedMessage = res.data.data;

      setMessages((prev) =>
        prev.some((msg) => msg._id === savedMessage._id)
          ? prev
          : [...prev, savedMessage]
      );

      setNewMessage("");
      setReplyTo(null);
    } catch (err) {
      console.error(err.response?.data || err);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/discussions/${id}`);
    setMessages((prev) =>
      prev.filter(
        (msg) => msg._id !== id && msg.parentMessageId !== id
      )
    );
  };

  const handlePin = async (id) => {
    await api.put(`/discussions/pin/${id}`);
    fetchMessages();
  };

  const handleReact = async (id, emoji) => {
    await api.put(`/discussions/reaction/${id}`, { emoji });
  };

  const handleAnnouncement = async () => {
    if (!newMessage.trim()) return;

    await api.post(`/discussions/announcement/${eventId}`, {
      message: newMessage,
    });

    setNewMessage("");
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="font-semibold mb-4">Discussion Forum</h3>

      <div className="max-h-80 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg) => (
          <MessageItem
            key={msg._id}
            message={msg}
            onDelete={handleDelete}
            onPin={handlePin}
            onReact={handleReact}
            onReply={setReplyTo}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="text-xs text-gray-500 mb-2">
          Replying to message...
          <button
            className="ml-2 text-red-500"
            onClick={() => setReplyTo(null)}
          >
            Cancel
          </button>
        </div>
      )}

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

        {user?.role === "organizer" && (
          <Button variant="secondary" onClick={handleAnnouncement}>
            Announcement
          </Button>
        )}
      </div>
    </div>
  );
}