import React, { useState, useEffect } from "react";
import { HashRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import CorrectionTool from "./components/CorrectionTool";
import ExcelUpload from "./components/ExcelUpload";
import MainLayout from "./components/MainLayout";
import axios from "axios";
import { ToastProvider } from './services/notification/ToastProvider';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  return (
    <ToastProvider position="top-right">
      <Router>
        <Routes>
          <Route
            path="/"
            element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
          />
          <Route path="/login" element={<Login setToken={setToken} />} />

          {token && (
            <>
              <Route
                path="/dashboard"
                element={
                  <MainLayout setToken={setToken}>
                    <Dashboard />
                  </MainLayout>
                }
              />
              <Route
                path="/correctiontool"
                element={
                  <MainLayout setToken={setToken}>
                    <CorrectionTool />
                  </MainLayout>
                }
              />
              <Route
                path="/excelupload"
                element={
                  <MainLayout setToken={setToken}>
                    <ExcelUpload />
                  </MainLayout>
                }
              />
            </>
          )}
        </Routes>
      </Router>
    </ToastProvider>
  );
}
