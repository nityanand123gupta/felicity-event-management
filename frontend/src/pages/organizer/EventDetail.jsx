import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/Loader";

export default function OrganizerEventDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/events/analytics/${id}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [id]);

  if (!data) return <Loader />;

  // Filter participants based on search, payment, and attendance
  const filteredParticipants = data.participants?.filter((p) => {
    const fullName = `${p.participantId?.firstName || ""} ${p.participantId?.lastName || ""}`.toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase());
    const matchesPayment = paymentFilter === "all" || p.paymentStatus === paymentFilter;
    const matchesAttendance =
      attendanceFilter === "all" ||
      (attendanceFilter === "present" && p.attendanceStatus) ||
      (attendanceFilter === "absent" && !p.attendanceStatus);

    return matchesSearch && matchesPayment && matchesAttendance;
  });

  const pendingOrders = data.participants?.filter((p) => p.paymentStatus === "pending");

  // Capitalize words utility
  const capitalizeWords = (str) =>
    str?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
      <Container>

        {/* Event Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8 mb-10 shadow-lg">
          <h1 className="text-3xl font-bold">{data.eventName}</h1>
          <p className="mt-2 text-indigo-100">
            Event analytics, participants & moderation tools.
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <Card className="bg-indigo-500 text-white">
            <p className="text-sm opacity-80">Registrations</p>
            <h2 className="text-2xl font-bold">{data.totalRegistrations}</h2>
          </Card>
          <Card className="bg-green-500 text-white">
            <p className="text-sm opacity-80">Approved Payments</p>
            <h2 className="text-2xl font-bold">{data.approvedPayments}</h2>
          </Card>
          <Card className="bg-pink-500 text-white">
            <p className="text-sm opacity-80">Revenue</p>
            <h2 className="text-2xl font-bold">₹ {data.totalRevenue}</h2>
          </Card>
          <Card className="bg-amber-500 text-white">
            <p className="text-sm opacity-80">Attendance Rate</p>
            <h2 className="text-2xl font-bold">{data.attendanceRate}</h2>
          </Card>
        </div>

        {/* QR Scanner Button */}
        <div className="mb-8">
          <Button variant="primary" as="a" href="/organizer/scan">
            Go to QR Scanner
          </Button>
        </div>

        {/* Filters & Export */}
        <Card className="mb-8 flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search participant..."
            className="border p-3 rounded-lg w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border p-3 rounded-lg"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">All Payments</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            className="border p-3 rounded-lg"
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
          >
            <option value="all">All Attendance</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
          </select>

          <Button
            variant="success"
            onClick={async () => {
              try {
                const response = await api.get(`/events/attendance/export/${id}`, { responseType: "blob" });
                const blob = new Blob([response.data], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `event-${id}-participants.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch {
                alert("Export failed");
              }
            }}
          >
            Export CSV
          </Button>
        </Card>

        {/* Participants Table */}
        <Card className="mb-10 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Reg Date</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Team</th>
                <th className="p-3">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants?.map((p) => (
                <tr key={p._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{p.participantId?.firstName} {p.participantId?.lastName}</td>
                  <td className="p-3">{p.participantId?.email}</td>
                  <td className="p-3">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}</td>
                  <td className="p-3">
                    <Badge color={
                      p.paymentStatus === "approved"
                        ? "green"
                        : p.paymentStatus === "rejected"
                        ? "red"
                        : "yellow"
                    }>
                      {capitalizeWords(p.paymentStatus)}
                    </Badge>
                  </td>
                  <td className="p-3">{p.teamName || "-"}</td>
                  <td className="p-3">
                    {p.attendanceStatus ? (
                      <span className="text-green-600 font-medium">Present</span>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <span className="text-gray-400">Absent</span>
                        <Button
                          variant="secondary"
                          className="text-xs"
                          onClick={async () => {
                            try {
                              await api.put(`/events/attendance/manual/${p._id}`, { note: "Manual override from dashboard" });
                              window.location.reload();
                            } catch {
                              alert("Manual override failed");
                            }
                          }}
                        >
                          Mark Present
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Pending Merchandise Orders */}
        {pendingOrders?.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-orange-700">
              Pending Merchandise Orders
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {pendingOrders.map((order) => (
                <Card key={order._id} className="bg-yellow-50 border-yellow-200">
                  <p><strong>Name:</strong> {order.participantId?.firstName} {order.participantId?.lastName}</p>
                  <p><strong>Variant:</strong> {order.variant?.size} / {order.variant?.color}</p>
                  <div className="mt-4 flex gap-3">
                    <Button
                      variant="success"
                      onClick={() =>
                        api.put(`/events/merchandise/order/${order._id}`, { action: "approve" })
                          .then(() => window.location.reload())
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() =>
                        api.put(`/events/merchandise/order/${order._id}`, { action: "reject" })
                          .then(() => window.location.reload())
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

      </Container>
    </div>
  );
}