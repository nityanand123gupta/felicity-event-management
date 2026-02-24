import { useEffect, useState } from "react";
import api from "../../api/axios";

import Container from "../../components/ui/Container";
import Card from "../../components/ui/Card";
import Loader from "../../components/Loader";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/events/admin/analytics");
        if (isMounted) {
          setStats(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to load analytics.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) return <Loader />;

  if (error)
    return (
      <div className="p-10 text-center text-red-600 font-medium">
        {error}
      </div>
    );

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800">
      <Container>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-8 mb-10 shadow-lg text-white">
          <h1 className="text-3xl font-bold">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-blue-100">
            System-wide analytics and platform overview.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Events</p>
            <h2 className="text-3xl font-bold mt-2">
              {stats?.totalEvents ?? 0}
            </h2>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Participants</p>
            <h2 className="text-3xl font-bold mt-2">
              {stats?.totalUsers ?? 0}
            </h2>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Registrations</p>
            <h2 className="text-3xl font-bold mt-2">
              {stats?.totalRegistrations ?? 0}
            </h2>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <h2 className="text-3xl font-bold mt-2 text-green-600">
              {formatCurrency(stats?.totalRevenue)}
            </h2>
          </Card>
        </div>
      </Container>
    </div>
  );
}