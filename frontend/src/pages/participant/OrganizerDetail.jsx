import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Loader from "../../components/Loader";

export default function OrganizerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/users/organizer/${id}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [id]);

  if (!data) return <Loader />;

  const { organizer, upcomingEvents, pastEvents } = data;

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "blue";
      case "ongoing":
        return "yellow";
      case "completed":
        return "green";
      default:
        return "gray";
    }
  };

  const getTypeColor = (type) =>
    type === "merchandise" ? "purple" : "indigo";

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 min-h-screen">
      <Container>

        {/* Organizer Hero */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl p-8 mb-10 shadow-lg">
          <h1 className="text-3xl font-bold">{organizer.organizerName}</h1>

          <div className="mt-3">
            <Badge color="indigo">{organizer.category}</Badge>
          </div>

          <p className="mt-4 text-indigo-100 max-w-2xl">{organizer.description}</p>
          <p className="mt-3 text-sm text-indigo-200">Contact: {organizer.contactEmail}</p>
        </div>

        {/* Upcoming Events */}
        <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>

        {upcomingEvents.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center">No upcoming events</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {upcomingEvents.map((event) => (
              <Link key={event._id} to={`/participant/event/${event._id}`}>
                <Card className="hover:border-indigo-300 cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{event.name}</h3>
                    <Badge color={getStatusColor(event.status)}>{event.status}</Badge>
                  </div>
                  <Badge color={getTypeColor(event.type)}>{event.type}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Past Events */}
        <h2 className="text-xl font-semibold mb-4">Past Events</h2>

        {pastEvents.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center">No past events</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {pastEvents.map((event) => (
              <Card key={event._id} className="bg-gray-50 border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{event.name}</h3>
                  <Badge color={getStatusColor(event.status)}>{event.status}</Badge>
                </div>
                <Badge color={getTypeColor(event.type)}>{event.type}</Badge>
              </Card>
            ))}
          </div>
        )}

      </Container>
    </div>
  );
}