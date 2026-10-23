import React from 'react';
import { FiHome, FiAlertTriangle, FiUsers, FiBarChart3, FiSettings, FiLogOut } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('hospitalApiKey');
    localStorage.removeItem('hospitalId');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white h-screen flex flex-col">
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-2xl font-bold">MediLink</h1>
        <p className="text-sm text-blue-200">Hospital Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link to="/" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition">
          <FiHome size={20} />
          <span>Dashboard</span>
        </Link>
        <Link to="/emergencies" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition">
          <FiAlertTriangle size={20} />
          <span>Emergencies</span>
        </Link>
        <Link to="/patients" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition">
          <FiUsers size={20} />
          <span>Patients</span>
        </Link>
        <Link to="/analytics" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition">
          <FiBarChart3 size={20} />
          <span>Analytics</span>
        </Link>
        <Link to="/settings" className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-blue-700 transition">
          <FiSettings size={20} />
          <span>Settings</span>
        </Link>
      </nav>

      <button
        onClick={handleLogout}
        className="mx-4 mb-4 flex items-center space-x-3 w-full px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition font-semibold"
      >
        <FiLogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
