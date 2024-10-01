import path from "path";
import { migrate } from "drizzle-orm/libsql/migrator";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { config } from "dotenv";
config({ path: ".dev.vars" });
import * as schema from "./schema";
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(turso, { schema });

const migrateDatabase = async () => {
  try {
    console.log("🟠 Migrating client");
    await migrate(db, { migrationsFolder: path.join(__dirname, "../../migrations") });
    console.log("🟢 Successfully Migrated");
    process.exit(0);
  } catch (error) {
    console.log("🔴 Error Migrating client", error);
    process.exit(0);
  }
};
migrateDatabase();
