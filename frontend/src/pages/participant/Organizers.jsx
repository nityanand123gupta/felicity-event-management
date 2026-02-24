import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Loader from "../../components/Loader";

export default function Organizers() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(null);

  const fetchOrganizers = async () => {
    try {
      const res = await api.get("/users/organizers");
      setOrganizers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const toggleFollow = async (id, isFollowed) => {
    try {
      setLoading(id);
      await api.put(isFollowed ? `/users/unfollow/${id}` : `/users/follow/${id}`);
      await fetchOrganizers();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setLoading(null);
    }
  };

  if (!organizers) return <Loader />;

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 min-h-screen">
      <Container>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl p-8 mb-10 shadow-lg">
          <h1 className="text-3xl font-bold">Clubs</h1>
          <p className="mt-2 text-indigo-100">
            Discover and follow your favorite clubs.
          </p>
        </div>

        {/* Clubs Grid */}
        {organizers.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-6">
              No clubs found.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {organizers.map((org) => (
              <Card key={org._id} className="hover:border-indigo-300 transition">

                <div className="flex justify-between items-start mb-4">
                  <Link to={`/participant/organizer/${org._id}`}>
                    <h2 className="text-lg font-semibold hover:text-indigo-600 transition cursor-pointer">
                      {org.organizerName}
                    </h2>
                  </Link>

                  <Badge color="indigo">{org.category}</Badge>
                </div>

                <p className="text-sm text-gray-600 mb-6">{org.description}</p>

                <Button
                  variant={org.isFollowed ? "danger" : "primary"}
                  onClick={() => toggleFollow(org._id, org.isFollowed)}
                  disabled={loading === org._id}
                >
                  {loading === org._id
                    ? "Processing..."
                    : org.isFollowed
                    ? "Unfollow"
                    : "Follow"}
                </Button>

              </Card>
            ))}
          </div>
        )}

      </Container>
    </div>
  );
}