// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiHome, FiTool, FiBarChart2, FiSettings, FiBookmark, FiBook, FiChevronDown, FiChevronRight, FiLogOut } from "react-icons/fi";
import useStore from "../stores/ProjectData";

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({});

  // Subscribe to Zustand store for projectName (optimizing re-renders)
  const projectName = useStore((state) => state.projectName);
  const resetProject = useStore((state) => state.resetProject);
  // Handle collapse toggle
  const toggleGroup = (groupKey) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const menuItems = [
    {
      label: "Dashboard",
      icon: <FiHome />,
      path: "/dashboard",
    },
    {
      label: "Masters",
      icon: <FiBook />,
      path: "/masters",
    },
     ...(projectName
    ? [
        {
          label: "Tools",
          icon: <FiTool />,
          children: [
            { label: "Project Configuration", path: "/projectconfiguration" },
            { label: "Data Import", path: "/dataimport" },
          ],
        },
      ]
    : []),
    {
      label: "Correction Tool",
      icon: <FiTool />,
      children: [
        { label: "Excel Upload", path: "/excelupload" },
        { label: "Correction Tool", path: "/correctiontool" },
      ],
    },
    { label: "Reports", icon: <FiBarChart2 />, path: "/reports" },
    { label: "Settings", icon: <FiSettings />, path: "/settings", disabled: true },
  ];

  const renderMenuItem = (item) => {
    const isActive = location.pathname === item.path;
    const isDisabled = item.disabled;

    return (
      <li
        key={item.label}
        onClick={() => !isDisabled && navigate(item.path)}
        className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer
          ${isDisabled ? "text-gray-400 cursor-not-allowed" : "text-gray-800 hover:bg-gray-100"}
          ${isActive ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500 font-medium" : ""}
          transition-all duration-150
          ${collapsed ? "justify-center" : ""}`}
      >
        <span className={collapsed ? "text-2xl" : "text-base"}>{item.icon}</span>
        {!collapsed && <span>{item.label}</span>}
      </li>
    );
  };

  const renderGroupItem = (group) => {
    const isOpen = openGroups[group.label];

    return (
      <li key={group.label} className="flex flex-col">
        <div
          onClick={() => toggleGroup(group.label)}
          className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-gray-800 hover:bg-gray-100 transition-all duration-150 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="flex items-center gap-3">
            <span className={collapsed ? "text-2xl" : "text-base"}>{group.icon}</span>
            {!collapsed && <span>{group.label}</span>}
          </div>
          {!collapsed && (
            <span className="ml-auto">
              {isOpen ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          )}
        </div>

        {/* Child menu items */}
        {!collapsed && isOpen && (
          <ul className="ml-6 mt-1 space-y-1">
            {group.children.map((child) => {
              const isActive = location.pathname === child.path;
              return (
                <li
                  key={child.label}
                  onClick={() => navigate(child.path)}
                  className={`text-sm px-3 py-2 rounded-md cursor-pointer
                    ${isActive ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500 font-medium" : "text-gray-700 hover:bg-gray-100"}
                    transition-all duration-150`}
                >
                  {child.label}
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  };

  const handleLogout = () => {
    resetProject();
    navigate("/dashboard");
  };

  return (
    <aside className={`${collapsed ? "w-16" : "w-64"} bg-white border-r border-gray-200 p-4 transition-all duration-300 ease-in-out flex flex-col`}>
      {/* Logo / Heading */}
      <div className="mb-6">
        {!collapsed && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)" }} transition={{ duration: 0.3 }}>
            <h2 className="text-gray-800 text-xl font-bold tracking-wide">ERP Menu</h2>
          </motion.div>
        )}
      </div>

      {/* Project Name Display */}
      {!collapsed && projectName && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-blue-600">{projectName}</span>
        </div>
      )}

      {/* Menu Items */}
      <ul className="space-y-1">
        {menuItems.map((item) => (item.children ? renderGroupItem(item) : renderMenuItem(item)))}
      </ul>

      {/* Logout Button */}
      {projectName &&
        <div onClick={handleLogout} className={`mt-auto flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-gray-800 hover:bg-gray-100 transition-all duration-150 ${collapsed ? "justify-center" : ""}`}>
          <FiLogOut className={collapsed ? "text-2xl" : "text-base"} />
          {!collapsed && <span>Logout</span>}
        </div>
      }
    </aside>
  );
}
