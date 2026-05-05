const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const residentRoutes = require("./routes/resident.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.get("/", (req, res) => res.json({ message: "Parking API running..." }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
