import React from 'react';

const PatientManagement = () => {
  const [patients, setPatients] = React.useState([
    { id: 1, name: 'Rajesh Kumar', bloodGroup: 'O+', status: 'Active', lastVisit: '2024-03-28' },
    { id: 2, name: 'Priya Singh', bloodGroup: 'A+', status: 'Active', lastVisit: '2024-03-27' },
    { id: 3, name: 'Amit Patel', bloodGroup: 'B+', status: 'Discharged', lastVisit: '2024-03-26' },
  ]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Patient Management</h1>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Patient Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Blood Group</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Visit</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(patient => (
              <tr key={patient.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{patient.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{patient.bloodGroup}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    patient.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {patient.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{patient.lastVisit}</td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-blue-600 hover:text-blue-800 font-semibold">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientManagement;
