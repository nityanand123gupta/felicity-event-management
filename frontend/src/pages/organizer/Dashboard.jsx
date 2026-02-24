import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/Loader";

export default function OrganizerDashboard() {
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingPublish, setLoadingPublish] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(null);

  const fetchData = async () => {
    try {
      const dashboardRes = await api.get("/events/organizer/dashboard");
      setData(dashboardRes.data);

      const eventsRes = await api.get("/events/organizer/my-events");
      setEvents(eventsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePublish = async (eventId) => {
    try {
      setLoadingPublish(eventId);
      await api.put(`/events/publish/${eventId}`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Publish failed");
    } finally {
      setLoadingPublish(null);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      setLoadingDelete(eventId);
      await api.delete(`/events/${eventId}`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    } finally {
      setLoadingDelete(null);
    }
  };

  if (!data) return <Loader />;

  const getStatusColor = (status) => {
    switch (status) {
      case "draft": return "yellow";
      case "published": return "blue";
      case "ongoing": return "green";
      case "completed": return "gray";
      default: return "gray";
    }
  };

  const getTypeColor = (type) => (type === "merchandise" ? "purple" : "indigo");

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 min-h-screen">
      <Container>

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl p-8 mb-10 shadow-lg">
          <h1 className="text-3xl font-bold">Organizer Dashboard</h1>
          <p className="mt-2 text-indigo-100">
            Track performance, manage events, and grow participation.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-indigo-500 text-white">
            <p className="text-sm opacity-80">Total Events</p>
            <h2 className="text-3xl font-bold mt-2">{data.totalEvents}</h2>
          </Card>

          <Card className="bg-emerald-500 text-white">
            <p className="text-sm opacity-80">Registrations</p>
            <h2 className="text-3xl font-bold mt-2">{data.totalRegistrations}</h2>
          </Card>

          <Card className="bg-pink-500 text-white">
            <p className="text-sm opacity-80">Revenue</p>
            <h2 className="text-3xl font-bold mt-2">₹ {data.totalRevenue}</h2>
          </Card>

          <Card className="bg-amber-500 text-white">
            <p className="text-sm opacity-80">Completed</p>
            <h2 className="text-3xl font-bold mt-2">{data.completedEvents}</h2>
          </Card>
        </div>

        {/* Events Section */}
        <PageHeader
          title="My Events"
          action={
            <Link to="/organizer/create-event">
              <Button>Create Event</Button>
            </Link>
          }
        />

        {events.length === 0 ? (
          <Card>No events found.</Card>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {events.map((event) => (
              <Card key={event._id} className="min-w-[300px] hover:border-indigo-300">
                <h3 className="text-lg font-semibold">{event.name}</h3>

                <div className="flex items-center gap-3 mt-3">
                  <Badge color={getTypeColor(event.type)}>{event.type}</Badge>
                  <Badge color={getStatusColor(event.status)}>{event.status}</Badge>
                </div>

                <p className="text-sm text-gray-500 mt-2">{event.totalRegistrations} Registrations</p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Link to={`/organizer/event/${event._id}`}>
                    <Button variant="secondary">View Details</Button>
                  </Link>

                  {(event.status === "draft" || event.status === "published") && (
                    <Link to={`/organizer/edit/${event._id}`}>
                      <Button variant="primary">Edit</Button>
                    </Link>
                  )}

                  {event.status === "draft" && (
                    <Button
                      variant="success"
                      onClick={() => handlePublish(event._id)}
                      disabled={loadingPublish === event._id}
                    >
                      {loadingPublish === event._id ? "Publishing..." : "Publish"}
                    </Button>
                  )}

                  {(event.status === "draft" || event.status === "published") && (
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(event._id)}
                      disabled={loadingDelete === event._id}
                    >
                      {loadingDelete === event._id ? "Deleting..." : "Delete"}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}