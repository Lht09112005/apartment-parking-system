const db = require("../config/db");

const getStats = async (req, res) => {
  try {
    const [[{ totalResidents }]] = await db.query(
      `SELECT COUNT(*) as totalResidents FROM residents`,
    );

    const [[{ totalVehicles }]] = await db.query(
      `SELECT COUNT(*) as totalVehicles FROM vehicles`,
    );

    const [[{ activeSessions }]] = await db.query(
      `SELECT COUNT(*) as activeSessions FROM parking_session WHERE status = 'parking'`,
    );

    const [[{ monthlyActive }]] = await db.query(
      `SELECT COUNT(*) as monthlyActive FROM monthly_parking WHERE status = 'active' AND end_date >= CURDATE()`,
    );

    res.json({ totalResidents, totalVehicles, activeSessions, monthlyActive });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = { getStats };
