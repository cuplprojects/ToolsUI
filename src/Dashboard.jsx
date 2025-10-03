import React, { useState, useEffect } from "react";
import API from "./hooks/api";
import useStore from "./stores/ProjectData";
import axios from "axios";

const url = import.meta.env.VITE_API_BASE_URL; // Assuming this is the correct URL for fetching project names

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const token = localStorage.getItem("token");
  const setProject = useStore((state) => state.setProject);

  const getProjects = async () => {
    try {
      const response = await API.get('/Projects/UserId');
      const projectIds = response.data.map((config) => config.projectId);

      const projectNameRequests = projectIds.map((projectId) =>
        axios.get(`${url}/Project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      const projectNameResponses = await Promise.all(projectNameRequests);

      // Combine ID and name in one object
      const combinedProjects = projectIds.map((id, index) => ({
        id,
        name: projectNameResponses[index].data.name,
      }));

      setProjects(combinedProjects);  // Store array of { id, name }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };


  useEffect(() => {
    getProjects();
  }, []);

  const handleCardClick = (projectId, projectName) => {
    // Save selected projectId and projectName in localStorage
    localStorage.setItem("selectedProjectId", projectId);
    localStorage.setItem("selectedProjectName", projectName);
    setProject(projectName,projectId);
  };

  return (
    <>
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">
        Welcome to ERP Tools
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-600 hover:shadow-xl hover:bg-blue-50 transition-all duration-300">
          <h3 className="text-gray-600 text-sm">Total Projects</h3>
          <p className="text-2xl font-bold text-blue-800">{projects.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-600 hover:shadow-xl hover:bg-green-50 transition-all duration-300">
          <h3 className="text-gray-600 text-sm">Active Users</h3>
          <p className="text-2xl font-bold text-green-800">36</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500 hover:shadow-xl hover:bg-yellow-50 transition-all duration-300">
          <h3 className="text-gray-600 text-sm">Pending Tickets</h3>
          <p className="text-2xl font-bold text-yellow-700">7</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-600 hover:shadow-xl hover:bg-red-50 transition-all duration-300">
          <h3 className="text-gray-600 text-sm">Issues Reported</h3>
          <p className="text-2xl font-bold text-red-800">4</p>
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-400 hover:shadow-xl hover:bg-gray-50 transition-all duration-300"
            onClick={() => handleCardClick(project.id, project.name)} // Now guaranteed to be in sync
          >
            <h3 className="text-gray-600 text-lg font-semibold mb-3">{project.name}</h3>
            
          </div>
        ))}
      </div>
    </>
  );
}
