import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";

export default function CreateEvent() {
  const navigate = useNavigate();

  const [eventData, setEventData] = useState({
    name: "",
    description: "",
    type: "normal",
    eligibility: "",
    registrationDeadline: "",
    startDate: "",
    endDate: "",
    registrationLimit: "",
    registrationFee: 0,
    tags: "",
  });

  const [formFields, setFormFields] = useState([]);
  const [variants, setVariants] = useState([]);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  // Normal form builder handlers
  const addFormField = () => {
    setFormFields([...formFields, { label: "", fieldType: "text", required: false, options: [] }]);
  };
  const updateFormField = (index, key, value) => {
    const updated = [...formFields];
    updated[index][key] = value;
    setFormFields(updated);
  };
  const removeFormField = (index) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  // Merchandise variant handlers
  const addVariant = () => setVariants([...variants, { size: "", color: "", stock: 0 }]);
  const updateVariant = (index, key, value) => {
    const updated = [...variants];
    updated[index][key] = value;
    setVariants(updated);
  };
  const removeVariant = (index) => setVariants(variants.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    try {
      const payload = {
        ...eventData,
        registrationLimit: Number(eventData.registrationLimit),
        registrationFee: Number(eventData.registrationFee),
        tags: eventData.tags.split(",").map((t) => t.trim()),
      };

      if (eventData.type === "normal") {
        payload.formFields = formFields;
      } else if (eventData.type === "merchandise") {
        payload.merchandiseDetails = { purchaseLimitPerUser: 1, variants };
      }

      await api.post("/events", payload);

      setMessage("Event created successfully (Draft)");
      setTimeout(() => navigate("/organizer/dashboard"), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error creating event");
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
      <Container>

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8 mb-10 shadow-lg">
          <h1 className="text-3xl font-bold">Create Event</h1>
          <p className="mt-2 text-indigo-100">Build and customize your event before publishing.</p>
        </div>

        {/* Message */}
        {message && (
          <Card className="mb-6 bg-blue-50 border-blue-100">
            <p className="text-blue-700">{message}</p>
          </Card>
        )}

        {/* Basic Details */}
        <Card className="mb-8">
          <h2 className="text-lg font-semibold mb-6">Basic Details</h2>
          <div className="grid md:grid-cols-2 gap-4">

            <input name="name" placeholder="Event Name" className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400" onChange={handleChange} />
            <select name="type" className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400" onChange={handleChange}>
              <option value="normal">Normal</option>
              <option value="merchandise">Merchandise</option>
            </select>
            <input name="eligibility" placeholder="Eligibility" className="border p-3 rounded-lg" onChange={handleChange} />
            <input name="registrationLimit" type="number" placeholder="Registration Limit" className="border p-3 rounded-lg" onChange={handleChange} />
            <input name="registrationFee" type="number" placeholder="Registration Fee" className="border p-3 rounded-lg" onChange={handleChange} />
            <input name="registrationDeadline" type="datetime-local" className="border p-3 rounded-lg" onChange={handleChange} />
            <input name="startDate" type="datetime-local" className="border p-3 rounded-lg" onChange={handleChange} />
            <input name="endDate" type="datetime-local" className="border p-3 rounded-lg" onChange={handleChange} />
            <input name="tags" placeholder="Tags (comma separated)" className="border p-3 rounded-lg md:col-span-2" onChange={handleChange} />
            <textarea name="description" placeholder="Event Description" className="border p-3 rounded-lg md:col-span-2" rows="4" onChange={handleChange} />
          </div>
        </Card>

        {/* Normal Form Builder */}
        {eventData.type === "normal" && (
          <Card className="mb-8">
            <h2 className="font-semibold mb-4">Registration Form Fields</h2>
            {formFields.map((field, index) => (
              <div key={index} className="border p-4 rounded-lg mb-4 bg-gray-50">
                <div className="flex flex-wrap gap-3 mb-3">
                  <input placeholder="Field Label" className="border p-2 rounded" onChange={(e) => updateFormField(index, "label", e.target.value)} />
                  <select className="border p-2 rounded" onChange={(e) => updateFormField(index, "fieldType", e.target.value)}>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" onChange={(e) => updateFormField(index, "required", e.target.checked)} />
                    Required
                  </label>
                  <Button variant="danger" onClick={() => removeFormField(index)}>Remove</Button>
                </div>
              </div>
            ))}
            <Button onClick={addFormField}>Add Field</Button>
          </Card>
        )}

        {/* Merchandise Builder */}
        {eventData.type === "merchandise" && (
          <Card className="mb-8 bg-purple-50 border-purple-100">
            <h2 className="font-semibold mb-4 text-purple-800">Merchandise Variants</h2>
            {variants.map((variant, index) => (
              <div key={index} className="border p-4 rounded-lg mb-4 bg-white">
                <div className="flex flex-wrap gap-3">
                  <input placeholder="Size" className="border p-2 rounded" onChange={(e) => updateVariant(index, "size", e.target.value)} />
                  <input placeholder="Color" className="border p-2 rounded" onChange={(e) => updateVariant(index, "color", e.target.value)} />
                  <input type="number" placeholder="Stock" className="border p-2 rounded" onChange={(e) => updateVariant(index, "stock", Number(e.target.value))} />
                  <Button variant="danger" onClick={() => removeVariant(index)}>Remove</Button>
                </div>
              </div>
            ))}
            <Button variant="primary" onClick={addVariant}>Add Variant</Button>
          </Card>
        )}

        <div className="mt-6">
          <Button variant="success" onClick={handleSubmit}>Create Event (Draft)</Button>
        </div>

      </Container>
    </div>
  );
}