import { useEffect, useState } from "react";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/Loader";

export default function PasswordResetRequests() {
  const [requests, setRequests] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await api.get("/users/password-reset-requests");
        setRequests(res.data);
      } catch (err) {
        console.error("Failed to fetch password reset requests:", err);
        alert("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleAction = async (id, action) => {
    try {
      const res = await api.put(`/users/password-reset/${id}`, {
        action,
        adminComment: action === "approve" ? "Approved by admin" : "Rejected by admin",
      });

      if (action === "approve") {
        setGeneratedPassword(res.data.generatedPassword);
      }

      setRequests((prev) =>
        prev.map((req) =>
          req._id === id ? { ...req, status: action } : req
        )
      );
    } catch (err) {
      console.error("Action failed:", err);
      alert("Failed to update request");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      <Container>

        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl p-8 mb-10 shadow-lg text-white">
          <h1 className="text-3xl font-bold">Password Reset Requests</h1>
          <p className="mt-2 text-indigo-100">
            Review and manage organizer password reset requests.
          </p>
        </div>

        {generatedPassword && (
          <Card className="mb-8 bg-green-50 border border-green-200 text-green-800 shadow-sm">
            <p className="font-semibold">New Password Generated:</p>
            <p className="font-mono mt-2 text-lg">{generatedPassword}</p>
          </Card>
        )}

        {requests.length === 0 && (
          <p className="text-gray-500">No requests found.</p>
        )}

        <div className="space-y-6">
          {requests.map((req) => (
            <Card
              key={req._id}
              className="bg-white border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-start flex-wrap gap-4">

                <div>
                  <p className="font-semibold text-lg text-gray-800">
                    {req.organizerId?.organizerName}
                  </p>
                  <p className="text-sm text-gray-500">{req.organizerId?.email}</p>

                  <p className="mt-3 text-sm text-gray-700">
                    <strong>Reason:</strong> {req.reason}
                  </p>

                  <div className="mt-3">
                    <Badge
                      color={
                        req.status === "pending"
                          ? "yellow"
                          : req.status === "approve"
                          ? "green"
                          : "red"
                      }
                    >
                      {req.status}
                    </Badge>
                  </div>
                </div>

                {req.status === "pending" && (
                  <div className="flex gap-3">
                    <Button
                      variant="success"
                      onClick={() => handleAction(req._id, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleAction(req._id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                )}

              </div>
            </Card>
          ))}
        </div>

      </Container>
    </div>
  );
}