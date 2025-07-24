// src/pages/Dashboard.jsx
import React from "react";

export default function Dashboard() {
  return (
    <>
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">
        Welcome to ERP Tools
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-600">
          <h3 className="text-gray-600 text-sm">Total Projects</h3>
          <p className="text-2xl font-bold text-blue-800">12</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-green-600">
          <h3 className="text-gray-600 text-sm">Active Users</h3>
          <p className="text-2xl font-bold text-green-800">36</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
          <h3 className="text-gray-600 text-sm">Pending Tickets</h3>
          <p className="text-2xl font-bold text-yellow-700">7</p>
        </div>
        <div className="bg-white p-4 rounded shadow border-l-4 border-red-600">
          <h3 className="text-gray-600 text-sm">Issues Reported</h3>
          <p className="text-2xl font-bold text-red-800">4</p>
        </div>
      </div>
    </>
  );
}
