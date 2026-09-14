const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
if (!fs.existsSync(schemaPath)) {
  process.exit(0);
}

let dbUrl = process.env.DATABASE_URL || "";

// If not in env, check local .env file
if (!dbUrl) {
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
    if (match) {
      dbUrl = match[1];
    }
  }
}

const targetProvider = (dbUrl.startsWith("file:") || dbUrl.startsWith("sqlite:")) ? "sqlite" : "postgresql";

let schema = fs.readFileSync(schemaPath, "utf8");
schema = schema.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${targetProvider}"`);
fs.writeFileSync(schemaPath, schema);
console.log(`Prisma schema provider configured for: ${targetProvider} (dbUrl: ${dbUrl ? dbUrl.substring(0, 12) + '...' : 'none'})`);
