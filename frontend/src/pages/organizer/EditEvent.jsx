import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Loader from "../../components/Loader";

export default function EditEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    registrationDeadline: "",
    registrationLimit: "",
  });

  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/details/${eventId}`);
        setEvent(res.data);

        const formatted = {
          name: res.data.name || "",
          description: res.data.description || "",
          registrationDeadline: res.data.registrationDeadline
            ? res.data.registrationDeadline.substring(0, 10)
            : "",
          registrationLimit: res.data.registrationLimit || "",
        };

        setFormData(formatted);
        setOriginalData(formatted);
      } catch {
        alert("Failed to load event");
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updates = {};

      if (event.status === "draft") {
        Object.assign(updates, formData);
      }

      if (event.status === "published") {
        if (formData.description !== originalData.description) {
          updates.description = formData.description;
        }
        if (formData.registrationDeadline !== originalData.registrationDeadline) {
          updates.registrationDeadline = formData.registrationDeadline;
        }
        if (Number(formData.registrationLimit) !== Number(originalData.registrationLimit)) {
          updates.registrationLimit = Number(formData.registrationLimit);
        }
      }

      await api.put(`/events/edit/${eventId}`, updates);
      alert("Event updated successfully");
      navigate("/organizer/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!event) return <Loader />;

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 min-h-screen">
      <Container>

        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl p-8 mb-10 shadow-lg">
          <h1 className="text-3xl font-bold">Edit Event</h1>
          <p className="mt-2 text-indigo-100">
            Modify event details based on allowed rules.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">

            {event.status === "draft" && (
              <div>
                <label className="block text-sm font-medium mb-2">Event Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-lg"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
                rows="4"
                required
              />
            </div>

            {(event.status === "draft" || event.status === "published") && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Registration Deadline</label>
                  <input
                    type="date"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Registration Limit</label>
                  <input
                    type="number"
                    name="registrationLimit"
                    value={formData.registrationLimit}
                    onChange={handleChange}
                    className="w-full border p-3 rounded-lg"
                    min="1"
                  />
                </div>
              </>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Event"}
            </Button>

          </form>
        </Card>

      </Container>
    </div>
  );
}