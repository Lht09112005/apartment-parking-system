const { emitChange } = require("../realtime");

const resourcesByPath = [
  {
    test: (path) => path.startsWith("/api/users"),
    resources: ["users", "dashboard", "audit"],
  },
  {
    test: (path) => path.startsWith("/api/residents"),
    resources: ["residents", "users", "vehicles", "dashboard", "audit"],
  },
  {
    test: (path) => path.startsWith("/api/vehicles"),
    resources: ["vehicles", "residents", "monthly", "dashboard", "audit"],
  },
  {
    test: (path) => path.startsWith("/api/resident/profile"),
    resources: ["residentProfile", "residents", "users"],
  },
  {
    test: (path) => path.startsWith("/api/resident/vehicles"),
    resources: ["residentVehicles", "vehicles", "dashboard"],
  },
  {
    test: (path) => path.startsWith("/api/resident/monthly"),
    resources: ["residentVehicles", "monthly", "fees", "dashboard"],
  },
  {
    test: (path) =>
      path.startsWith("/api/parking/check-in") ||
      path.startsWith("/api/parking/check-out"),
    resources: ["parkingSessions", "vehicles", "dashboard", "fees"],
  },
  {
    test: (path) => path.startsWith("/api/parking/fees"),
    resources: ["fees", "residentFees", "audit"],
  },
  {
    test: (path) => path.startsWith("/api/parking/monthly"),
    resources: ["monthly", "residentVehicles", "residentFees", "dashboard"],
  },
  {
    test: (path) => path.startsWith("/api/settings"),
    resources: ["settings", "audit"],
  },
  {
    test: (path) => path.startsWith("/api/backup"),
    resources: [
      "backups",
      "residents",
      "users",
      "vehicles",
      "parkingSessions",
      "monthly",
      "fees",
      "dashboard",
      "audit",
    ],
  },
];

const getResourcesForPath = (path) => {
  const matched = resourcesByPath.find((entry) => entry.test(path));
  return matched ? matched.resources : ["global"];
};

const notifyDataChanges = (req, res, next) => {
  const method = req.method.toUpperCase();

  const shouldWatch =
    ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
    req.path.startsWith("/api") &&
    !req.path.startsWith("/api/auth");

  if (!shouldWatch) return next();

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      emitChange({
        resources: getResourcesForPath(req.path),
        action: method,
        source: req.path,
        user: req.user || null,
      });
    }

    return originalJson(body);
  };

  next();
};

module.exports = { notifyDataChanges };