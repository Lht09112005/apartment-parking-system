import React, { useState, useEffect } from "react";
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
import RevenueReport from "./pages/RevenueReport";
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
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  useEffect(() => {
    const handleMaintenance = () => setShowMaintenanceModal(true);
    window.addEventListener('maintenanceMode', handleMaintenance);
    return () => window.removeEventListener('maintenanceMode', handleMaintenance);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Rounded" rel="stylesheet" />
        <style>{`
          .material-symbols-rounded {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
        `}</style>
        {showMaintenanceModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(45, 51, 39, 0.6)", display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, backdropFilter: "blur(4px)"
          }}>
            <div style={{
              backgroundColor: "#FFFBF5", borderRadius: 20, width: "90%", maxWidth: 400, padding: 24,
              boxShadow: "0 20px 45px rgba(0,0,0,0.15)", fontFamily: "'Outfit', sans-serif", textAlign: "center"
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", backgroundColor: "rgba(205, 92, 92, 0.1)",
                color: "#CD5C5C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px"
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 32 }}>build</span>
              </div>
              <h3 style={{ margin: "0 0 8px 0", color: "#2D3327", fontSize: 18, fontWeight: "800" }}>BẢO TRÌ HỆ THỐNG</h3>
              <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: 14, lineHeight: "20px" }}>
                Hệ thống hiện đang được bảo trì. Vui lòng quay lại sau!
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => {
                    setShowMaintenanceModal(false);
                    if (window.location.pathname !== "/login") {
                      window.location.href = "/login";
                    }
                  }}
                  style={{
                    flex: 1, padding: "10px 16px", backgroundColor: "#CD5C5C", color: "#FFFBF5", border: "none",
                    borderRadius: 10, fontSize: 14, fontWeight: "700", cursor: "pointer", transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#b04f4f"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#CD5C5C"}
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        )}
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
            path="/admin/revenue"
            element={
              <PrivateRoute roles={[1, 2]}>
                <RevenueReport />
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
