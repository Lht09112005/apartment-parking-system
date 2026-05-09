import React from "react";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <Navbar />
      <div style={{ padding: "24px" }}>
        <h3>Dashboard Admin</h3>
        <p>Trang dashboard đang được phát triển...</p>
      </div>
    </div>
  );
};

export default Dashboard;
