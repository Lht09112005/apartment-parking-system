const express = require("express");
const jwt = require("jsonwebtoken");
const { addClient } = require("../realtime");
const { JWT_SECRET } = require("../config/auth");

const router = express.Router();

router.get("/events", (req, res) => {
  const token = req.query.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Thiếu token realtime" });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);

    addClient(res, user);
  } catch (err) {
    return res.status(401).json({ message: "Token realtime không hợp lệ" });
  }
});

module.exports = router;
