import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Loader from "../../components/Loader";
import DiscussionPanel from "../../components/discussion/DiscussionPanel";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/details/${id}`);
        setEvent(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (label, value) => {
    setFormData((prev) => ({ ...prev, [label]: value }));
  };

  const handleRegister = async () => {
    try {
      const res = await api.post(`/events/register/${id}`, {
        formResponses: formData,
      });
      setMessage("Registration successful! Ticket ID: " + res.data.ticketId);
      setTimeout(() => navigate("/participant/dashboard"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed");
    }
  };

  const handleMerchandisePurchase = async () => {
    if (!selectedVariant || !paymentProof) {
      setMessage("Please select a variant and upload payment proof");
      return;
    }

    try {
      const formDataObj = new FormData();
      formDataObj.append("variant", JSON.stringify(selectedVariant));
      formDataObj.append("paymentProof", paymentProof);

      const res = await api.post(`/events/merchandise/${id}`, formDataObj, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data.message);
      setTimeout(() => navigate("/participant/dashboard"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || "Purchase failed");
    }
  };

  if (!event) return <Loader />;

  const deadlinePassed = new Date(event.registrationDeadline) < new Date();
  const limitReached = event.registrationLimit && event.totalRegistrations >= event.registrationLimit;
  const notOpen = event.status !== "published";
  const isBlocked = deadlinePassed || limitReached || notOpen;

  const getStatusColor = (status) => {
    switch (status) {
      case "published": return "blue";
      case "ongoing": return "yellow";
      case "completed": return "green";
      default: return "gray";
    }
  };

  const getTypeColor = (type) => (type === "merchandise" ? "purple" : "indigo");

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
      <Container>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8 mb-10 shadow-lg">
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="mt-2 text-indigo-100">{event.description}</p>
          <div className="flex gap-3 mt-4">
            <Badge color={getStatusColor(event.status)}>{event.status}</Badge>
            <Badge color={getTypeColor(event.type)}>{event.type}</Badge>
          </div>
        </div>

        {/* Event Details */}
        <Card className="mb-10">
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Organizer:</strong> {event.organizerId?.organizerName}</p>
            <p><strong>Start:</strong> {new Date(event.startDate).toLocaleString()}</p>
            <p><strong>End:</strong> {new Date(event.endDate).toLocaleString()}</p>
            <p><strong>Eligibility:</strong> {event.eligibility}</p>
            <p><strong>Deadline:</strong> {new Date(event.registrationDeadline).toLocaleString()}</p>
          </div>
          {notOpen && <p className="text-red-500 mt-4 font-medium">This event is not open for registration.</p>}
        </Card>

        {/* Normal Event Registration */}
        {event.type === "normal" && (
          <Card className="mb-10">
            <h3 className="font-semibold mb-6 text-lg">Registration Form</h3>
            {event.formFields.map((field, i) => (
              <div key={i} className="mb-5">
                <label className="block mb-2 font-medium text-gray-700">
                  {field.label}{field.required && <span className="text-red-500"> *</span>}
                </label>

                {field.fieldType === "text" && <input type="text" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400" onChange={(e) => handleChange(field.label, e.target.value)} />}
                {field.fieldType === "number" && <input type="number" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400" onChange={(e) => handleChange(field.label, e.target.value)} />}
                {field.fieldType === "dropdown" && (
                  <select className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400" onChange={(e) => handleChange(field.label, e.target.value)}>
                    <option value="">Select</option>
                    {field.options?.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
                  </select>
                )}
                {field.fieldType === "checkbox" && <input type="checkbox" onChange={(e) => handleChange(field.label, e.target.checked)} />}
              </div>
            ))}

            <Button variant="success" disabled={isBlocked} onClick={handleRegister} className="w-full">
              {notOpen ? "Registration Closed" : deadlinePassed ? "Deadline Passed" : limitReached ? "Registration Full" : "Submit Registration"}
            </Button>
          </Card>
        )}

        {/* Merchandise Event */}
        {event.type === "merchandise" && (
          <Card className="mb-10 bg-purple-50 border-purple-100">
            <h3 className="font-semibold mb-6 text-lg text-purple-800">Select Variant</h3>
            <select className="w-full border p-3 rounded-lg mb-4" onChange={(e) => {
              const idx = e.target.value;
              if (idx !== "") setSelectedVariant(event.merchandiseDetails.variants[idx]);
            }}>
              <option value="">Select Variant</option>
              {event.merchandiseDetails?.variants.map((v, i) => (
                <option key={i} value={i} disabled={v.stock <= 0}>{v.size} / {v.color} (Stock: {v.stock})</option>
              ))}
            </select>

            <input type="file" accept="image/*" className="mb-6" onChange={(e) => setPaymentProof(e.target.files[0])} />

            <Button
              variant="primary"
              disabled={deadlinePassed || notOpen || !selectedVariant || !paymentProof}
              onClick={handleMerchandisePurchase}
              className="w-full"
            >
              {notOpen ? "Event Closed" : deadlinePassed ? "Deadline Passed" : "Purchase"}
            </Button>
          </Card>
        )}

        {/* Success / Error Message */}
        {message && (
          <Card className="mb-10 bg-blue-50 border-blue-100">
            <p className="text-blue-700">{message}</p>
          </Card>
        )}

        {/* Discussion Panel */}
        <DiscussionPanel eventId={id} />

      </Container>
    </div>
  );
};

export default EventDetails;