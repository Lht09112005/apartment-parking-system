import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import ResidentManagement from "./pages/ResidentManagement";
import VehicleManagement from "./pages/VehicleManagement";
import SecurityDashboard from "./pages/SecurityDashboard";
import FeeManagement from "./pages/FeeManagement";
import MonthlyApproval from "./pages/MonthlyApproval";
import ResidentDashboard from "./pages/ResidentDashboard";
import SystemSettings from "./pages/SystemSettings";
import AuditLogs from "./pages/AuditLogs";
import BackupManagement from "./pages/BackupManagement";
const PrivateRoute = ({ children, roles }) => {
  const { token, user } = useAuth();
  
  if (!token) return <Navigate to="/login" />;
  
  if (roles && !roles.includes(user?.role_id)) {
    // Redirect based on role
    if (user?.role_id === 4) return <Navigate to="/resident" />;
    if (user?.role_id === 3) return <Navigate to="/security" />;
    if (user?.role_id === 1) return <Navigate to="/admin/dashboard" />;
    return <Navigate to="/admin/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute roles={[1, 2]}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute roles={[1, 2]}>
                <UserManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/security"
            element={
              <PrivateRoute roles={[3]}>
                <SecurityDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/resident"
            element={
              <PrivateRoute roles={[4]}>
                <ResidentDashboard />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
          <Route
            path="/admin/residents"
            element={
              <PrivateRoute roles={[2]}>
                <ResidentManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/vehicles"
            element={
              <PrivateRoute roles={[2]}>
                <VehicleManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/fees"
            element={
              <PrivateRoute roles={[2]}>
                <FeeManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <PrivateRoute roles={[1]}>
                <SystemSettings />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <PrivateRoute roles={[1]}>
                <AuditLogs />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/backup"
            element={
              <PrivateRoute roles={[1]}>
                <BackupManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/monthly"
            element={
              <PrivateRoute roles={[2]}>
                <MonthlyApproval />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
