import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from './hooks/useToast';
import BG from './assets/bg/bg.svg'
import { FiEye, FiEyeOff } from "react-icons/fi";
import API from "./hooks/api";
import { useUserToken, useUserTokenActions } from "./stores/UserToken";
export default function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = useUserToken(); // reactive token
  const { setToken } = useUserTokenActions();
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (token) {
      navigate("/dashboard");
    }
  }, [token,navigate]);



  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await API.post(`/UserLogs/login`, {
        userName,
        password,
      });

      const jwtToken = response.data.token;
      console.log(jwtToken);
      setToken(jwtToken);

      // Set token as default Authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

      // ✅ Navigate to dashboard after successful login
      navigate("/dashboard");

      // ✅ Optional: show success toast
      showToast("Login successful!", "success");

    } catch (error) {
      showToast("Login failed. Please check your username or password.", "error");
      console.error(error);
    }
  };


  return (
    <div className="flex min-h-screen">
      {/* Left panel: Login Form (30%) */}
      <div className="w-full sm:w-[30%] flex items-center justify-center bg-gray-900 p-6">
        <div className="w-full max-w-sm space-y-6">
          <h2 className="text-3xl font-bold text-center text-blue-400">Login to ERP Tools</h2>
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-800 bg-white"
                required
              />
            </div>

            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-800  bg-white pr-10"
                required
              />
              <div
                className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-md text-lg font-medium hover:bg-blue-700 transition duration-200 shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              Login
            </button>
          </form>
        </div>
      </div>

      {/* Right panel: SVG/Image (70%) */}
      <div className="hidden sm:flex w-[70%] bg-indigo-50 items-center justify-center p-10 overflow-hidden">
        <img
          src={BG}
          alt="Login Illustration"
          className=" h-full max-w-full max-h-full object-contain w-200"
        />
      </div>


    </div>
  );



}
