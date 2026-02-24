import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./notifications/NotificationBell";

export default function Navbar({ role }) {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname.startsWith(path)
      ? "text-indigo-600 font-semibold"
      : "text-gray-600 hover:text-indigo-600";

  return (
    <nav className="bg-white/60 backdrop-blur-xl border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
      
      {/* Logo */}
      <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        Felicity
      </div>

      {/* Menu */}
      <div className="flex items-center space-x-6 text-sm">

        {/* PARTICIPANT */}
        {role === "participant" && (
          <>
            <Link
              to="/participant/dashboard"
              className={isActive("/participant/dashboard")}
            >
              Dashboard
            </Link>

            <Link
              to="/participant/events"
              className={isActive("/participant/events")}
            >
              Browse Events
            </Link>

            <Link
              to="/participant/organizers"
              className={isActive("/participant/organizers")}
            >
              Clubs
            </Link>

            <Link
              to="/participant/profile"
              className={isActive("/participant/profile")}
            >
              Profile
            </Link>
          </>
        )}

        {/* ORGANIZER */}
        {role === "organizer" && (
          <>
            <Link
              to="/organizer/dashboard"
              className={isActive("/organizer/dashboard")}
            >
              Dashboard
            </Link>

            <Link
              to="/organizer/create-event"
              className={isActive("/organizer/create-event")}
            >
              Create Event
            </Link>

            <Link
              to="/organizer/ongoing"
              className={isActive("/organizer/ongoing")}
            >
              Ongoing Events
            </Link>

            <Link
              to="/organizer/scan"
              className={isActive("/organizer/scan")}
            >
              Scan
            </Link>

            <Link
              to="/organizer/profile"
              className={isActive("/organizer/profile")}
            >
              Profile
            </Link>
          </>
        )}

        {/* ADMIN */}
        {role === "admin" && (
          <>
            <Link
              to="/admin/dashboard"
              className={isActive("/admin/dashboard")}
            >
              Dashboard
            </Link>

            <Link
              to="/admin/organizers"
              className={isActive("/admin/organizers")}
            >
              Manage Clubs
            </Link>

            <Link
              to="/admin/password-resets"
              className={isActive("/admin/password-resets")}
            >
              Password Resets
            </Link>
          </>
        )}

        {/* 🔔 Notification Bell */}
        <NotificationBell />

        {/* Logout */}
        <button
          onClick={logout}
          className="ml-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
        >
          Logout
        </button>

      </div>
    </nav>
  );
}