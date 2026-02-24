import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";

import AdminDashboard from "../pages/admin/Dashboard";
import ManageOrganizers from "../pages/admin/ManageOrganizers";
import PasswordResetRequests from "../pages/admin/PasswordResetRequests";

const AdminLayout = () => {
  return (
    <>
      <Navbar role="admin" />

      <div className="p-6">
        <Routes>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="organizers" element={<ManageOrganizers />} />
          <Route path="password-resets" element={<PasswordResetRequests />} />

          {/* Default route */}
          <Route index element={<Navigate to="dashboard" replace />} />
        </Routes>
      </div>
    </>
  );
};

export default AdminLayout;