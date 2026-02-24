import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import api from "../../api/axios";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Bell
        className={`cursor-pointer transition ${
          unreadCount > 0 ? "text-indigo-600" : "text-gray-600"
        }`}
        onClick={handleToggle}
      />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 rounded-full">
          {unreadCount}
        </span>
      )}

      {open && (
        <NotificationDropdown
          notifications={notifications}
          setNotifications={setNotifications}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}