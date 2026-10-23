import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { FiAlertCircle, FiMapPin, FiClock } from 'react-icons/fi';

const Emergencies = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const response = await fetch('/api/hospital/emergencies/active', {
          headers: {
            'X-API-Key': localStorage.getItem('hospitalApiKey'),
            'X-Hospital-Id': localStorage.getItem('hospitalId')
          }
        });
        const data = await response.json();
        setEmergencies(data);
      } catch (error) {
        console.error('Failed to fetch emergencies:', error);
      }
    };

    fetchEmergencies();
    const interval = setInterval(fetchEmergencies, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleEmergencyResponse = async (sosId, status) => {
    try {
      const response = await fetch(`/api/hospital/respond-emergency/${sosId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': localStorage.getItem('hospitalApiKey'),
          'X-Hospital-Id': localStorage.getItem('hospitalId')
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        // Refresh emergencies list
        const updatedResponse = await fetch('/api/hospital/emergencies/active', {
          headers: {
            'X-API-Key': localStorage.getItem('hospitalApiKey'),
            'X-Hospital-Id': localStorage.getItem('hospitalId')
          }
        });
        const data = await updatedResponse.json();
        setEmergencies(data);
      }
    } catch (error) {
      console.error('Failed to respond to emergency:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Active Emergencies</h1>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-gray-600">Critical</p>
          <p className="text-2xl font-bold text-red-600">
            {emergencies.filter(e => e.severity === 'Critical').length}
          </p>
        </div>
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
          <p className="text-gray-600">High</p>
          <p className="text-2xl font-bold text-orange-600">
            {emergencies.filter(e => e.severity === 'High').length}
          </p>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-gray-600">Total Active</p>
          <p className="text-2xl font-bold text-blue-600">{emergencies.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Emergency List</h2>
          </div>
          <div className="overflow-y-auto h-96">
            {emergencies.map(emergency => (
              <div
                key={emergency._id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedEmergency?._id === emergency._id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedEmergency(emergency)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{emergency.patientName}</p>
                    <p className="text-sm text-gray-500">{emergency.patientPhone}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    emergency.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                    emergency.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {emergency.severity}
                  </span>
                </div>
                <div className="mt-2 flex items-center text-gray-600 text-sm">
                  <FiClock className="mr-2" />
                  {new Date(emergency.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedEmergency && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Patient Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-gray-600">Name</label>
                <p className="font-semibold">{selectedEmergency.patientName}</p>
              </div>
              <div>
                <label className="text-gray-600">Age</label>
                <p className="font-semibold">{selectedEmergency.patientAge}</p>
              </div>
              <div>
                <label className="text-gray-600">Blood Group</label>
                <p className="font-semibold">{selectedEmergency.patientBloodGroup}</p>
              </div>
              <div>
                <label className="text-gray-600">Allergies</label>
                <p className="font-semibold">{selectedEmergency.allergies?.join(', ') || 'None'}</p>
              </div>
              <div>
                <label className="text-gray-600">Current Medications</label>
                <p className="font-semibold">{selectedEmergency.currentMedications?.join(', ') || 'None'}</p>
              </div>

              <div className="border-t pt-4">
                <label className="text-gray-600">Location</label>
                <div className="flex items-center mt-2">
                  <FiMapPin className="mr-2" />
                  <span>{selectedEmergency.address}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                {selectedEmergency.hospitalResponseStatus === 'Pending' ? (
                  <>
                    <button
                      onClick={() => handleEmergencyResponse(selectedEmergency._id, 'Accepted')}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleEmergencyResponse(selectedEmergency._id, 'Rejected')}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <button disabled className="w-full bg-gray-400 text-white py-2 rounded-lg font-semibold">
                    {selectedEmergency.hospitalResponseStatus === 'Accepted' ? 'Accepted' : 'Rejected'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Emergencies;
