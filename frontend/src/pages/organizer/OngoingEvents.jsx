import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Loader from "../../components/Loader";

export default function OngoingEvents() {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events/organizer/my-events");
        const ongoing = res.data.filter((e) => e.status === "ongoing");
        setEvents(ongoing);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      }
    };

    fetchEvents();
  }, []);

  if (!events) return <Loader />;

  return (
    <Container>
      <h1 className="text-2xl font-bold mb-6">Ongoing Events</h1>

      {events.length === 0 ? (
        <Card>No ongoing events.</Card>
      ) : (
        <div className="space-y-6">
          {events.map((event) => (
            <Card key={event._id} className="p-4">
              <h3 className="text-lg font-semibold">{event.name}</h3>
              <Link
                to={`/organizer/event/${event._id}`}
                className="text-indigo-600 text-sm hover:underline"
              >
                View Details
              </Link>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}