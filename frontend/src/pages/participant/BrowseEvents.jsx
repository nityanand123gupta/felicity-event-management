import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    eligibility: "",
    startDate: "",
    endDate: "",
    followedOnly: false,
    trending: false,
  });

  // Fetch events with optional filters
  const fetchEvents = async () => {
    try {
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== false && value !== null) {
          params[key] = value;
        }
      });

      const res = await api.get("/events", { params });
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch on search debounce
  useEffect(() => {
    const delay = setTimeout(() => fetchEvents(), 400);
    return () => clearTimeout(delay);
  }, [filters.search]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "",
      eligibility: "",
      startDate: "",
      endDate: "",
      followedOnly: false,
      trending: false,
    });
  };

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
    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 min-h-screen">
      <Container>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl p-8 mb-10 shadow-lg">
          <h1 className="text-3xl font-bold">Browse Events</h1>
          <p className="mt-2 text-indigo-100">Discover exciting events happening around you.</p>
        </div>

        {/* Filters */}
        <Card className="mb-10">
          <div className="grid md:grid-cols-3 gap-5">

            <input
              type="text"
              name="search"
              placeholder="Search by event or organizer"
              value={filters.search}
              onChange={handleChange}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
            />

            <select
              name="type"
              value={filters.type}
              onChange={handleChange}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              <option value="">All Types</option>
              <option value="normal">Normal</option>
              <option value="merchandise">Merchandise</option>
            </select>

            <input
              type="text"
              name="eligibility"
              placeholder="Eligibility"
              value={filters.eligibility}
              onChange={handleChange}
              className="border p-3 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
            />

            <div>
              <label className="text-sm text-gray-500">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />
            </div>

            <div className="flex flex-col justify-center space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="followedOnly"
                  checked={filters.followedOnly}
                  onChange={handleChange}
                />
                Followed Clubs Only
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="trending"
                  checked={filters.trending}
                  onChange={handleChange}
                />
                Trending (Top 5)
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={fetchEvents}>Apply Filters</Button>
            <Button variant="secondary" onClick={clearFilters}>Clear</Button>
          </div>
        </Card>

        {/* Events Grid */}
        {events.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">
              No events found matching your filters.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {events.map((event) => (
              <Link to={`/participant/event/${event._id}`} key={event._id}>
                <Card className="hover:border-indigo-300 cursor-pointer">

                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-semibold">{event.name}</h2>
                    <Badge color={getStatusColor(event.status)}>{event.status}</Badge>
                  </div>

                  <div className="flex gap-3 mb-3">
                    <Badge color={getTypeColor(event.type)}>{event.type}</Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-1">
                    Organizer: {event.organizerId?.organizerName}
                  </p>

                  <p className="text-sm text-gray-600 mb-1">
                    Eligibility: {event.eligibility}
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(event.startDate).toLocaleDateString()} —{" "}
                    {new Date(event.endDate).toLocaleDateString()}
                  </p>

                </Card>
              </Link>
            ))}
          </div>
        )}

      </Container>
    </div>
  );
};

export default BrowseEvents;