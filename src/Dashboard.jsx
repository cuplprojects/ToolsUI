import React, { useState, useEffect } from "react";
import API from "./hooks/api";
import useStore from "./stores/ProjectData";
import axios from "axios";

const url = import.meta.env.VITE_API_BASE_URL; // Assuming this is the correct URL for fetching project names

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [projectDetails, setProjectDetails] = useState([]);
  const token = localStorage.getItem("token");
  const setProject = useStore((state) => state.setProject);

  const getProjects = async () => {
    try {
      const response = await API.get('/Projects/UserId');
      const projectIds = response.data.map((config) => config.projectId);
      setProjects(projectIds);

      // Fetching project names for each projectid
      const projectNameRequests = projectIds.map((projectid) =>
        axios.get(`${url}/Project/${projectid}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      // Once all requests are complete, set the project names
      const projectNameResponses = await Promise.all(projectNameRequests);
      const projectNames = projectNameResponses.map((res) => res.data.name);
      setProjectDetails(projectNames);
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
    setProject(projectName);
  };

  return (
    <>
      <h2 className="text-3xl font-semibold text-gray-800 mb-6">
        Welcome to ERP Tools
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-600 hover:shadow-xl hover:bg-blue-50 transition-all duration-300">
          <h3 className="text-gray-600 text-sm">Total Projects</h3>
          <p className="text-2xl font-bold text-blue-800">12</p>
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
        {projectDetails.map((projectname, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-400 hover:shadow-xl hover:bg-gray-50 transition-all duration-300"
            onClick={() => handleCardClick(projects[index], projectname)}  // Pass projectId and projectName on click
          >
            <h3 className="text-gray-600 text-lg font-semibold mb-3">{projectname}</h3>
            <p className="text-sm text-gray-500">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur sit amet justo ut dui ultrices malesuada.
            </p>
            <div className="mt-4 text-right">
              <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
