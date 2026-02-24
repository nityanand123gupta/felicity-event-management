import { useEffect, useState } from "react";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/Loader";

export default function ManageOrganizers() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    organizerName: "",
    category: "",
    description: "",
    contactEmail: "",
  });

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/admin/organizers");
      setOrganizers(res.data);
    } catch (err) {
      console.error("Failed to fetch organizers:", err);
      alert("Failed to load organizers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.organizerName || !form.contactEmail) {
      alert("Organizer Name and Contact Email are required");
      return;
    }

    try {
      const res = await api.post("/users/create-organizer", form);

      alert(
        `Organizer created successfully!\n\nLogin Email: ${res.data.generatedEmail}\nPassword: ${res.data.generatedPassword}`
      );

      setForm({
        organizerName: "",
        category: "",
        description: "",
        contactEmail: "",
      });

      fetchOrganizers();
    } catch (error) {
      alert(error.response?.data?.message || "Error creating organizer");
    }
  };

  const disableOrganizer = async (id) => {
    try {
      await api.put(`/users/disable-organizer/${id}`);
      alert("Organizer disabled");
      fetchOrganizers();
    } catch (err) {
      alert("Failed to disable organizer");
    }
  };

  const enableOrganizer = async (id) => {
    try {
      await api.put(`/users/enable-organizer/${id}`);
      alert("Organizer enabled");
      fetchOrganizers();
    } catch (err) {
      alert("Failed to enable organizer");
    }
  };

  const deleteOrganizer = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this organizer?"
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/users/delete-organizer/${id}`);
      alert("Organizer deleted");
      fetchOrganizers();
    } catch (err) {
      alert("Failed to delete organizer");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      <Container>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-8 mb-10 shadow-lg text-white">
          <h1 className="text-3xl font-bold">Manage Organizers</h1>
          <p className="mt-2 text-blue-100">
            Create, enable, disable, or permanently delete club accounts.
          </p>
        </div>

        {/* Create Organizer */}
        <Card className="mb-10 bg-white border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-6 text-gray-800">
            Create Organizer
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <input
              value={form.organizerName}
              placeholder="Organizer Name"
              onChange={(e) => setForm({ ...form, organizerName: e.target.value })}
              className="border border-gray-300 bg-white p-3 rounded-lg"
            />

            <input
              value={form.category}
              placeholder="Category"
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border border-gray-300 bg-white p-3 rounded-lg"
            />

            <input
              value={form.description}
              placeholder="Description"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border border-gray-300 bg-white p-3 rounded-lg md:col-span-2"
            />

            <input
              value={form.contactEmail}
              placeholder="Contact Email"
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="border border-gray-300 bg-white p-3 rounded-lg md:col-span-2"
            />
          </div>

          <Button variant="primary" onClick={handleCreate}>
            Create Organizer
          </Button>
        </Card>

        {/* Organizer List */}
        <div className="space-y-6">
          {organizers.map((org) => (
            <Card
              key={org._id}
              className="bg-white border border-gray-200 shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-lg text-gray-800">{org.organizerName}</p>
                <p className="text-sm text-gray-500">{org.contactEmail}</p>
                <div className="mt-2">
                  <Badge color={org.isActive ? "green" : "red"}>
                    {org.isActive ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                {org.isActive ? (
                  <Button variant="danger" onClick={() => disableOrganizer(org._id)}>
                    Disable
                  </Button>
                ) : (
                  <Button variant="success" onClick={() => enableOrganizer(org._id)}>
                    Enable
                  </Button>
                )}

                <Button variant="danger" onClick={() => deleteOrganizer(org._id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>

      </Container>
    </div>
  );
}