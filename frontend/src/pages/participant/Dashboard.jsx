import { useEffect, useState } from "react";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Loader from "../../components/Loader";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [visibleQR, setVisibleQR] = useState(null);

  const fetchData = async () => {
    try {
      const res = await api.get("/events/my-registrations");
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async (registrationId) => {
    try {
      await api.put(`/events/cancel/${registrationId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Cancel failed");
    }
  };

  const handleDownloadCalendar = async (eventId) => {
    try {
      const response = await api.get(`/events/calendar/${eventId}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "event.ics");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("Failed to download calendar");
    }
  };

  const copyTicket = (ticketId) => {
    navigator.clipboard.writeText(ticketId);
    alert("Ticket ID copied");
  };

  if (!data) return <Loader />;

  const getStatusColor = (status) => {
    switch (status) {
      case "registered": return "green";
      case "cancelled":
      case "rejected": return "red";
      case "completed": return "blue";
      default: return "gray";
    }
  };

  const getTypeColor = (type) => (type === "merchandise" ? "purple" : "blue");

  const renderList = (list) => {
    if (!list?.length)
      return (
        <Card>
          <p className="text-gray-500 text-center py-8">No records found.</p>
        </Card>
      );

    return list.map((reg) => {
      const event = reg.eventId;
      return (
        <Card key={reg._id} className="hover:border-indigo-300">

          {/* Event Info */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{event?.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Organized by {event?.organizerId?.organizerName || "Organizer"}
              </p>

              <div className="flex gap-3 mt-2 items-center">
                <Badge color={getStatusColor(reg.status)}>{reg.status}</Badge>
                <Badge color={getTypeColor(event?.type)}>{event?.type}</Badge>
              </div>

              <p className="text-sm text-gray-500 mt-2">
                {new Date(event?.startDate).toLocaleString()} —{" "}
                {new Date(event?.endDate).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Registration Info */}
          <div className="text-sm text-gray-700 space-y-2">
            {reg.teamName && <p><strong>Team:</strong> {reg.teamName}</p>}
            <p>
              <strong>Ticket ID:</strong>{" "}
              {reg.ticketId ? (
                <span
                  onClick={() => copyTicket(reg.ticketId)}
                  className="font-mono text-indigo-600 cursor-pointer hover:underline"
                >
                  {reg.ticketId}
                </span>
              ) : (
                "Pending Approval"
              )}
            </p>
            {reg.paymentStatus && (
              <p>
                <strong>Payment:</strong> <span className="capitalize">{reg.paymentStatus}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          {reg.ticketId && (
            <div className="mt-5 flex gap-3 flex-wrap">
              <Button variant="secondary" onClick={() => handleDownloadCalendar(event?._id)}>
                Add to Calendar
              </Button>

              {reg.qrCode && (
                <Button variant="primary" onClick={() =>
                  setVisibleQR(visibleQR === reg._id ? null : reg._id)
                }>
                  {visibleQR === reg._id ? "Hide QR" : "Show QR"}
                </Button>
              )}
            </div>
          )}

          {/* QR Code */}
          {visibleQR === reg._id && reg.qrCode && (
            <div className="mt-6 flex justify-center">
              <div className="p-4 bg-gray-50 rounded-xl shadow-inner">
                <img src={reg.qrCode} alt="QR Code" className="w-40 h-40" />
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {reg.status === "registered" && reg.paymentStatus !== "approved" && (
            <div className="mt-6">
              <Button variant="danger" onClick={() => handleCancel(reg._id)}>
                Cancel Registration
              </Button>
            </div>
          )}

        </Card>
      );
    });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
      <Container>

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8 mb-10 shadow-lg">
          <h1 className="text-3xl font-bold">My Events Dashboard</h1>
          <p className="mt-2 text-indigo-100">
            Manage registrations, QR tickets, and upcoming events.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-10 flex-wrap">
          {["upcoming", "completed", "cancelled", "normal", "merchandise"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-600 border hover:bg-gray-100"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "upcoming" && renderList(data.upcoming)}
        {activeTab === "completed" && renderList(data.completed)}
        {activeTab === "cancelled" && renderList(data.cancelled)}
        {activeTab === "normal" && renderList(data.normal)}
        {activeTab === "merchandise" && renderList(data.merchandise)}

      </Container>
    </div>
  );
}