import { useEffect } from "react";
import api from "../../api/axios";

export default function NotificationDropdown({
  notifications,
  setNotifications,
  onClose,
}) {
  useEffect(() => {
    const markAllRead = async () => {
      try {
        await api.put("/notifications/mark-all-read");

        // Update frontend state immediately
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
      } catch (err) {
        console.error(err);
      }
    };

    const hasUnread = notifications.some((n) => !n.isRead);

    if (hasUnread) {
      markAllRead();
    }
  }, [notifications, setNotifications]);

  return (
    <div className="absolute right-0 mt-3 w-80 bg-white border rounded-xl shadow-lg z-50">
      <div className="p-4 border-b font-semibold text-gray-700">
        Notifications
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">
            No notifications
          </p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 border-b text-sm transition ${
                n.isRead
                  ? "bg-white text-gray-600"
                  : "bg-indigo-50 text-gray-800 font-medium"
              }`}
            >
              {n.message}
            </div>
          ))
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full text-sm py-2 text-indigo-600 hover:bg-gray-50"
      >
        Close
      </button>
    </div>
  );
}