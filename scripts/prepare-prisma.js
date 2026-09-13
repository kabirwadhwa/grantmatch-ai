const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
if (!fs.existsSync(schemaPath)) {
  process.exit(0);
}

let schema = fs.readFileSync(schemaPath, "utf8");
const dbUrl = process.env.DATABASE_URL || "";
const targetProvider = dbUrl.startsWith("postgres") ? "postgresql" : "sqlite";

schema = schema.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${targetProvider}"`);
fs.writeFileSync(schemaPath, schema);
console.log(`Prisma schema provider configured for: ${targetProvider}`);
