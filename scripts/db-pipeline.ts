import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

function run(command: string, description: string) {
  console.log(`\n▶ [Pipeline Step] ${description}...`);
  console.log(`$ ${command}`);
  try {
    const output = execSync(command, { stdio: "inherit", encoding: "utf-8" });
    return output;
  } catch (err: any) {
    console.error(`❌ Step failed: ${description}`);
    throw err;
  }
}

async function main() {
  const isReset = process.argv.includes("--reset");
  const startTime = Date.now();

  console.log("================================================================================");
  console.log("🚀 AUTOMATED RELATIONAL DATA INGESTION & PIPELINE (Unit IV / CO4)");
  console.log("   Mode: " + (isReset ? "Full Database Reset & Seed" : "Standard Sync & Seed"));
  console.log("================================================================================");

  // Ensure logs directory exists
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // 1. Prisma Client Generation
  run("npx prisma generate", "Generating Prisma Client Artifacts");

  // 2. Database Schema Push / Migration
  run("npx prisma db push --skip-generate", "Synchronizing Relational Database Schema");

  // 3. Automated Seeding with Faker.js
  run("npx tsx prisma/seed.ts", "Executing Automated Seeding Pipeline via Faker.js");

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const logMessage = `[${new Date().toISOString()}] Database pipeline executed successfully in ${duration}s. Mode: ${isReset ? "RESET" : "SYNC"}\n`;
  fs.appendFileSync(path.join(logsDir, "pipeline-execution.log"), logMessage);

  console.log("\n================================================================================");
  console.log(`🎉 Pipeline executed successfully in ${duration}s!`);
  console.log("   Log recorded: logs/pipeline-execution.log");
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Fatal pipeline error:", err.message);
  process.exit(1);
});
