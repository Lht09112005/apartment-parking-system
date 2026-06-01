const db = require("../backend/config/db");

async function checkRoles() {
  try {
    const [roles] = await db.query("SELECT * FROM roles");
    console.log(roles);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkRoles();
