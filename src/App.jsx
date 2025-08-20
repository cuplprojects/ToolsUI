import React, { useState, useEffect } from "react";
import { HashRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import CorrectionTool from "./components/CorrectionTool";
import ExcelUpload from "./components/ExcelUpload";
import MainLayout from "./components/MainLayout";
import axios from "axios";
import { ToastProvider } from './services/notification/ToastProvider';
import ProjectConfiguration from "./ProjectConfig/ProjectConfiguration";
import DataImport from "./ToolsProcessing/DataImport";
import DuplicateTool from "./ToolsProcessing/DuplicateTool";
import Master from "./Masters/Master";

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
              path="/masters" 
                element={
                  <MainLayout setToken={setToken}>
                    <Master />
                  </MainLayout>
                } 
              />
              <Route
              path="/projectconfiguration"
              element={
                <MainLayout setToken={setToken}>
                  <ProjectConfiguration/>
                </MainLayout>
              }
              />
              <Route
              path="/dataimport"
              element={
                <MainLayout setToken={setToken}>
                  <DataImport/>
                </MainLayout>
              }
              />
              <Route
                path="/duplicate"
                element={
                  <MainLayout setToken={setToken}>
                    <DuplicateTool />
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
