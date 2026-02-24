import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";

import Dashboard from "../pages/participant/Dashboard";
import BrowseEvents from "../pages/participant/BrowseEvents";
import EventDetails from "../pages/participant/EventDetails";
import Profile from "../pages/participant/Profile";
import Organizers from "../pages/participant/Organizers";
import Onboarding from "../pages/participant/Onboarding";
import OrganizerDetail from "../pages/participant/OrganizerDetail";

const ParticipantLayout = () => {
  return (
    <>
      <Navbar role="participant" />

      <div className="p-6">
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="events" element={<BrowseEvents />} />
          <Route path="organizers" element={<Organizers />} />
          <Route path="profile" element={<Profile />} />
          <Route path="event/:id" element={<EventDetails />} />
          <Route path="organizer/:id" element={<OrganizerDetail />} />
          <Route path="onboarding" element={<Onboarding />} />

          {/* Redirect /participant → dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
        </Routes>
      </div>
    </>
  );
};

export default ParticipantLayout;