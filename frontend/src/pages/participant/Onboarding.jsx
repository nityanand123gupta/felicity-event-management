import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function Onboarding() {
  const { refreshUser } = useAuth(); // 👈 use refreshUser
  const navigate = useNavigate();

  const [interests, setInterests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrganizers, setSelectedOrganizers] = useState([]);

  const availableInterests = [
    "Coding",
    "Robotics",
    "AI",
    "Gaming",
    "Music",
    "Art",
    "Entrepreneurship",
  ];

  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const res = await api.get("/users/organizers");
        setOrganizers(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrganizers();
  }, []);

  const toggleInterest = (interest) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleOrganizer = (id) => {
    setSelectedOrganizers((prev) =>
      prev.includes(id)
        ? prev.filter((o) => o !== id)
        : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      await api.put("/users/profile", {
        interests,
        followedOrganizers: selectedOrganizers,
      });

      await refreshUser(); // 👈 VERY IMPORTANT

      navigate("/participant/dashboard");
    } catch {
      alert("Failed to save preferences");
    }
  };

  const handleSkip = async () => {
    await refreshUser(); // optional but safe
    navigate("/participant/dashboard");
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow mt-10">
      <h1 className="text-2xl font-bold mb-6">
        Welcome to Felicity
      </h1>

      {/* Interests */}
      <div className="mb-8">
        <h2 className="font-semibold mb-3">Select Your Interests</h2>
        <div className="flex flex-wrap gap-3">
          {availableInterests.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                interests.includes(interest)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Organizers */}
      <div className="mb-8">
        <h2 className="font-semibold mb-3">Follow Clubs</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {organizers.map((org) => (
            <button
              key={org._id}
              onClick={() => toggleOrganizer(org._id)}
              className={`p-3 rounded-lg border transition-colors ${
                selectedOrganizers.includes(org._id)
                  ? "bg-green-200 border-green-400"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {org.organizerName}
            </button>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Save Preferences
        </button>

        <button
          onClick={handleSkip}
          className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 transition"
        >
          Skip
        </button>
      </div>
    </div>
  );
}