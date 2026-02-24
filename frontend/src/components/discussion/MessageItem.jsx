import { useAuth } from "../../context/AuthContext";

export default function MessageItem({ message }) {
  const { user } = useAuth();

  const isOwnMessage = message.userId?._id === user?._id;

  const fullName = message.userId
    ? `${message.userId.firstName} ${message.userId.lastName}`
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
      }`}
    >
      <div
        className={`max-w-[75%] px-4 py-2 rounded-xl text-sm shadow-sm ${
          isOwnMessage
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        <p className="font-medium text-xs opacity-80 mb-1">
          {fullName}
        </p>

        <p>{message.message}</p>

        {formattedTime && (
          <p className="text-[10px] opacity-60 mt-2 text-right">
            {formattedTime}
          </p>
        )}
      </div>
    </div>
  );
}