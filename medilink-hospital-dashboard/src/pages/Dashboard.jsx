import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    activeEmergencies: 0,
    acceptanceRate: 0,
    avgResponseTime: 0,
    totalBeds: 0,
    availableBeds: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // Simulate dashboard data
    setStats({
      activeEmergencies: 3,
      acceptanceRate: 92,
      avgResponseTime: 8.5,
      totalBeds: 200,
      availableBeds: 45
    });
  };

  const monthlyData = [
    { month: 'Jan', emergencies: 45, resolved: 42 },
    { month: 'Feb', emergencies: 52, resolved: 50 },
    { month: 'Mar', emergencies: 48, resolved: 46 },
    { month: 'Apr', emergencies: 61, resolved: 59 },
    { month: 'May', emergencies: 55, resolved: 54 },
    { month: 'Jun', emergencies: 66, resolved: 64 }
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Active Emergencies"
          value={stats.activeEmergencies}
          color="text-red-600"
          bgColor="bg-red-50"
        />
        <StatCard
          label="Acceptance Rate"
          value={`${stats.acceptanceRate}%`}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          label="Avg Response"
          value={`${stats.avgResponseTime}min`}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          label="Total Beds"
          value={stats.totalBeds}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard
          label="Available"
          value={stats.availableBeds}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Monthly Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="emergencies" stroke="#ef4444" />
              <Line type="monotone" dataKey="resolved" stroke="#22c55e" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Bed Occupancy</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[{ name: 'Beds', occupied: stats.totalBeds - stats.availableBeds, available: stats.availableBeds }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="occupied" fill="#ef4444" />
              <Bar dataKey="available" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <ActivityItem time="10:45 AM" message="Emergency alert from patient at Sector 5" />
          <ActivityItem time="9:30 AM" message="Ambulance arrived at City Hospital" />
          <ActivityItem time="8:15 AM" message="New patient insurance claim submitted" />
          <ActivityItem time="7:00 AM" message="Daily system health check completed" />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, bgColor }) => (
  <div className={`${bgColor} rounded-lg p-4 text-center`}>
    <p className="text-gray-600 text-sm font-medium">{label}</p>
    <p className={`text-2xl font-bold ${color} mt-2`}>{value}</p>
  </div>
);

const ActivityItem = ({ time, message }) => (
  <div className="flex items-start space-x-3 pb-3 border-b last:border-b-0">
    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
    <div>
      <p className="text-sm font-medium text-gray-900">{message}</p>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  </div>
);

export default Dashboard;
