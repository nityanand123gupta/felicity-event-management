import { useEffect, useState } from "react";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Loader from "../../components/Loader";

export default function ParticipantProfile() {
  const [form, setForm] = useState(null);
  const [organizers, setOrganizers] = useState([]);
  const [message, setMessage] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const availableInterests = [
    "Coding",
    "Robotics",
    "AI",
    "Gaming",
    "Music",
    "Art",
    "Entrepreneurship",
  ];

  // Fetch profile and organizers
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/profile");
        setForm(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchOrganizers = async () => {
      try {
        const res = await api.get("/users/organizers");
        setOrganizers(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
    fetchOrganizers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setMessage("");
    try {
      await api.put("/users/profile", form);
      setMessage("Preferences updated successfully");
      setTimeout(() => setMessage(""), 2500);
    } catch {
      setMessage("Update failed");
      setTimeout(() => setMessage(""), 2500);
    }
  };

  const handlePasswordChange = async () => {
    setMessage("");

    if (!passwordData.currentPassword) {
      setMessage("Current password is required");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage("New password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("New passwords do not match");
      return;
    }

    try {
      const res = await api.put("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setMessage(res.data.message);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Password change failed");
    }
  };

  if (!form) return <Loader />;

  const initials = `${form.firstName?.[0] || ""}${form.lastName?.[0] || ""}`;

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen pb-12">
      <Container>

        {/* Profile Hero */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8 mb-10 flex items-center gap-6 shadow-lg">
          <div className="w-20 h-20 rounded-full bg-white text-indigo-600 flex items-center justify-center text-2xl font-bold shadow">
            {initials.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{form.firstName} {form.lastName}</h1>
            <p className="text-indigo-100">{form.email}</p>
            <p className="text-indigo-200 text-sm capitalize">{form.participantType} Participant</p>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-300 text-green-700 text-sm font-medium shadow-sm">
            {message}
          </div>
        )}

        {/* Personal Information */}
        <Card className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <Button variant="success" onClick={handleSave}>Save Changes</Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="firstName"
              value={form.firstName || ""}
              onChange={handleChange}
              placeholder="First Name"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"
            />
            <input
              name="lastName"
              value={form.lastName || ""}
              onChange={handleChange}
              placeholder="Last Name"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"
            />
            <input
              name="contactNumber"
              value={form.contactNumber || ""}
              onChange={handleChange}
              placeholder="Contact Number"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"
            />
            <input
              name="collegeOrOrg"
              value={form.collegeOrOrg || ""}
              onChange={handleChange}
              placeholder="College / Organization"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </Card>

        {/* Preferences */}
        <Card className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Preferences</h2>
            <Button variant="success" onClick={handleSave}>Save Preferences</Button>
          </div>

          <h3 className="font-medium mb-3 text-gray-700">Areas of Interest</h3>
          <div className="flex flex-wrap gap-3 mb-8">
            {availableInterests.map((interest) => {
        const isSelected = form.interests?.includes(interest.toLowerCase());
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => {
const normalized = interest.toLowerCase();

const updated = isSelected
  ? form.interests.filter(i => i !== normalized)
  : [...(form.interests || []), normalized];
                    setForm({ ...form, interests: updated });
                  }}
                  className={`px-4 py-2 rounded-full border transition-colors ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>

          <h3 className="font-medium mb-3 text-gray-700">Followed Clubs & Organizers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {organizers.map((org) => {
              const isFollowing = form.followedOrganizers?.includes(org._id);
              return (
                <button
                  key={org._id}
                  type="button"
                  onClick={() => {
                    const updated = isFollowing
                      ? form.followedOrganizers.filter(id => id !== org._id)
                      : [...(form.followedOrganizers || []), org._id];
                    setForm({ ...form, followedOrganizers: updated });
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isFollowing
                      ? "bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <p className="font-medium">{org.organizerName || "Unnamed Club"}</p>
                  <p className="text-xs opacity-70">{isFollowing ? "✓ Following" : "+ Follow"}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Account Info */}
        <Card className="mb-8 bg-gray-50 border-gray-100 opacity-80">
          <h2 className="text-lg font-semibold mb-6">Account Information (View Only)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input value={form.email} disabled className="w-full border p-3 rounded-lg bg-gray-100 cursor-not-allowed" />
            <input value={form.participantType} disabled className="w-full border p-3 rounded-lg bg-gray-100 capitalize cursor-not-allowed" />
          </div>
        </Card>

        {/* Security */}
        <Card>
          <h2 className="text-lg font-semibold mb-6 text-red-600">Security Settings</h2>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Current Password"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="password"
                placeholder="New Password"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={handlePasswordChange}>Update Password</Button>
          </div>
        </Card>

      </Container>
    </div>
  );
}