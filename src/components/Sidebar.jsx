import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUpload,
  FiTool,
  FiBarChart2,
  FiSettings,
  FiBookmark
} from "react-icons/fi";

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: "Dashboard",
      icon: <FiHome />,
      path: "/dashboard",
    },
    {
      label: "Project Configuration",
      icon: <FiBookmark/>,
      path: "/projectconfiguration",
    },
    {
      label: "Data Import",
      icon: <FiUpload />,
      path: "/dataimport",
    },
    {
      label: "Excel Upload",
      icon: <FiUpload />,
      path: "/excelupload",
    },
    {
      label: "Correction Tool",
      icon: <FiTool />,
      path: "/correctiontool",
    },
    {
      label: "Reports",
      icon: <FiBarChart2 />,
      path: "/reports",
      disabled: true,
    },
    {
      label: "Settings",
      icon: <FiSettings />,
      path: "/settings",
      disabled: true,
    },
  ];

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-64"
        } bg-white border-r border-gray-200 p-4 transition-all duration-300 ease-in-out flex flex-col h-screen`}
    >
      {/* Logo / Heading */}
      <div className="mb-6">
        {!collapsed && (
          <h2 className="text-gray-800 text-xl font-bold tracking-wide">ERP Menu</h2>
        )} 
      </div>

      {/* Menu Items */}
      <ul className="space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isDisabled = item.disabled;

          return (
            <li
              key={item.label}
              onClick={() => !isDisabled && navigate(item.path)}
              className={`
        flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer
        ${isDisabled ? "text-gray-400 cursor-not-allowed" : "text-gray-800 hover:bg-gray-100"}
        ${isActive ? "bg-blue-100 text-blue-700 border-l-4 border-blue-500 font-medium" : ""}
        transition-all duration-150
        ${collapsed ? "justify-center" : ""}
      `}
            >
              <span className={collapsed ? "text-2xl" : "text-base"}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </li>
          );
        })}

      </ul>
    </aside>
  );
}
