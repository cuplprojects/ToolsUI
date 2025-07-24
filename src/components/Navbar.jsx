import React, { useState } from "react";
import { FiMenu, FiChevronDown } from "react-icons/fi";
import { useToast } from "./../hooks/useToast";

export default function Navbar({ onToggleSidebar, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { showToast } = useToast();

  return (
    <nav className="bg-gray-100 border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-50">
      {/* Left: Menu + Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="text-gray-700 hover:text-blue-600 focus:outline-none"
        >
          <FiMenu className="text-2xl" />
        </button>
        <span className="font-bold text-xl text-gray-800 hidden md:inline">ERP Tools</span>
      </div>

      {/* Right: Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1 text-gray-800 hover:text-blue-600 focus:outline-none font-medium"
        >
          <span>Profile</span>
          <FiChevronDown className="text-lg" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <ul className="py-1 text-sm text-gray-700">
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  showToast("Profile settings clicked.", "info");
                  setDropdownOpen(false);
                }}
              >
                Profile Settings   
              </li>
              <li
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onLogout();
                  setDropdownOpen(false);
                }}
              >
                Logout
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
