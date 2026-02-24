import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";

import OrganizerDashboard from "../pages/organizer/Dashboard";
import CreateEvent from "../pages/organizer/CreateEvent";
import EditEvent from "../pages/organizer/EditEvent";
import Profile from "../pages/organizer/Profile";
import ScanAttendance from "../pages/organizer/ScanAttendance";
import OngoingEvents from "../pages/organizer/OngoingEvents";

const OrganizerLayout = () => {
  return (
    <>
      <Navbar role="organizer" />

      <div className="p-6">
        <Routes>
          <Route path="dashboard" element={<OrganizerDashboard />} />
          <Route path="create-event" element={<CreateEvent />} />
          <Route path="edit/:eventId" element={<EditEvent />} />
          <Route path="scan" element={<ScanAttendance />} />
          <Route path="profile" element={<Profile />} />
          <Route path="ongoing" element={<OngoingEvents />} />

          {/* Redirect /organizer to dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
        </Routes>
      </div>
    </>
  );
};

export default OrganizerLayout;