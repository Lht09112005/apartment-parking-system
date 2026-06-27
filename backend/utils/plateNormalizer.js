const normalizePlate = (plate) => plate ? String(plate).toUpperCase().replace(/[^A-Z0-9]/g, "") : "";

module.exports = { normalizePlate };
