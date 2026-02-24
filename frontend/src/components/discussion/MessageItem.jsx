import { useAuth } from "../../context/AuthContext";

export default function MessageItem({
  message,
  onDelete,
  onPin,
  onReact,
  onReply,
}) {
  const { user } = useAuth();

  const isOwnMessage = message.userId?._id === user?._id;
  const isOrganizer = user?.role === "organizer";

  const fullName = message.userId
    ? message.userId.organizerName ||
      `${message.userId.firstName || ""} ${message.userId.lastName || ""}`
    : "Unknown User";

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      className={`flex flex-col ${
        isOwnMessage ? "items-end" : "items-start"
      } ${message.parentMessageId ? "ml-8" : ""}`}
    >
      <div
        className={`relative max-w-[75%] px-4 py-2 rounded-xl text-sm shadow-sm ${
          isOwnMessage
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {message.isAnnouncement && (
          <span className="absolute -top-2 -right-2 bg-yellow-400 text-xs px-2 py-0.5 rounded-full">
            Announcement
          </span>
        )}

        {message.isPinned && (
          <span className="absolute -top-2 -left-2 bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">
            Pinned
          </span>
        )}

        <p className="font-medium text-xs opacity-80 mb-1">
          {fullName}
        </p>

        <p>{message.message}</p>

        {formattedTime && (
          <p className="text-[10px] opacity-60 mt-2 text-right">
            {formattedTime}
          </p>
        )}

        {/* Reactions Display */}
        {message.reactions?.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {message.reactions.map((r, index) => (
              <span
                key={index}
                className="text-xs bg-gray-200 px-2 py-1 rounded-full"
              >
                {r.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-2 text-xs opacity-70">
          <button onClick={() => onReply(message._id)}>
            Reply
          </button>

          <button onClick={() => onReact(message._id, "like")}>
            Like
          </button>

          <button onClick={() => onReact(message._id, "important")}>
            Important
          </button>

          {isOrganizer && (
            <>
              <button onClick={() => onPin(message._id)}>
                {message.isPinned ? "Unpin" : "Pin"}
              </button>

              <button
                className="text-red-500"
                onClick={() => onDelete(message._id)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}