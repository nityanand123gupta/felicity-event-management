import { useEffect, useState } from "react";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Loader from "../../components/Loader";

export default function OrganizerProfile() {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/profile");
        setForm(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await api.put("/users/profile", form);
      setMessage("Profile updated successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Update failed.");
    }
  };

  const handlePasswordResetRequest = async () => {
    setResetMessage("");

    if (!resetReason.trim()) {
      setResetMessage("Please enter a reason.");
      return;
    }

    try {
      const res = await api.post("/users/password-reset-request", {
        reason: resetReason,
      });
      setResetMessage(res.data.message);
      setResetReason("");
    } catch (err) {
      setResetMessage(err.response?.data?.message || "Request failed");
    }
  };

  if (!form) return <Loader />;

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-white to-green-50 min-h-screen">
      <Container>

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-2xl p-8 mb-10 shadow-lg">
          <h1 className="text-3xl font-bold">Organizer Profile</h1>
          <p className="mt-2 text-green-100">
            Manage your club identity and public information.
          </p>
        </div>

        {/* Success / Info Message */}
        {message && (
          <Card className="mb-6 bg-blue-50 border-blue-100">
            <p className="text-blue-700">{message}</p>
          </Card>
        )}

        {/* Profile Form */}
        <Card className="mb-10">
          <h2 className="text-lg font-semibold mb-6">Public Information</h2>
          <div className="space-y-5">

            {/* Organizer Name */}
            <InputField
              label="Organizer Name"
              name="organizerName"
              value={form.organizerName}
              onChange={handleChange}
            />

            {/* Category */}
            <InputField
              label="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
            />

            {/* Description */}
            <TextAreaField
              label="Description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={6}
            />

            {/* Public Contact Email */}
            <InputField
              label="Public Contact Email"
              name="contactEmail"
              value={form.contactEmail}
              onChange={handleChange}
            />

            {/* Discord Webhook */}
            <InputField
              label="Discord Webhook URL"
              name="discordWebhook"
              value={form.discordWebhook}
              onChange={handleChange}
              placeholder="https://discord.com/api/webhooks/..."
            />

            {/* Contact Number */}
            <InputField
              label="Public Contact Number"
              name="contactNumber"
              value={form.contactNumber}
              onChange={handleChange}
            />

            {/* Login Email (Read-only) */}
            <InputField
              label="Login Email (Read-only)"
              value={form.email}
              disabled
            />

            <Button variant="success" onClick={handleSave}>
              Save Changes
            </Button>

          </div>
        </Card>

        {/* Password Reset */}
        <Card className="border-red-200 bg-red-50">
          <h2 className="text-lg font-semibold mb-2 text-red-700">
            Request Password Reset
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            If you lost access, submit a reset request to the administrator.
          </p>

          <textarea
            placeholder="State your reason..."
            value={resetReason}
            onChange={(e) => setResetReason(e.target.value)}
            className="w-full border p-3 rounded-lg mb-4 focus:ring-2 focus:ring-red-400"
          />

          <Button variant="danger" onClick={handlePasswordResetRequest}>
            Submit Reset Request
          </Button>

          {resetMessage && (
            <div className="mt-4 p-3 rounded bg-white border">
              <p className="text-sm text-gray-700">{resetMessage}</p>
            </div>
          )}
        </Card>

      </Container>
    </div>
  );
}

// Reusable Input Field Component
const InputField = ({ label, name, value, onChange, placeholder, disabled }) => (
  <div>
    <label className={`block text-sm font-medium ${disabled ? "text-gray-400" : "text-gray-600"} mb-1`}>
      {label}
    </label>
    <input
      name={name}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full border p-3 rounded-lg focus:ring-2 ${disabled ? "bg-gray-100 text-gray-500" : "focus:ring-emerald-400"}`}
    />
  </div>
);

// Reusable TextArea Field Component
const TextAreaField = ({ label, name, value, onChange, rows = 4 }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    <textarea
      name={name}
      value={value || ""}
      onChange={onChange}
      rows={rows}
      className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-emerald-400"
    />
  </div>
);