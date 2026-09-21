import * as fs from "fs";
import * as path from "path";

const target = process.argv[2]; // 'postgres' or 'sqlite'
const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");

if (!target || (target !== "postgres" && target !== "sqlite")) {
  console.log("Usage: npx tsx scripts/toggle-db.ts <postgres|sqlite>");
  process.exit(1);
}

let content = fs.readFileSync(schemaPath, "utf-8");

if (target === "postgres") {
  content = content.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  console.log("🔄 Configured Prisma datasource provider to: postgresql");
} else {
  content = content.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
  console.log("🔄 Configured Prisma datasource provider to: sqlite");
}

fs.writeFileSync(schemaPath, content, "utf-8");
console.log("✅ Updated prisma/schema.prisma successfully.");
