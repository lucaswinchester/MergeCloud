import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";

let db: PostgresJsDatabase<typeof schema> | null = null;
let client: ReturnType<typeof postgres> | null = null;

// Lazy initialization to avoid errors when DATABASE_URL is not set
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (db) return db;

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
      "Please configure your Supabase database connection."
    );
  }

  client = postgres(connectionString, {
    prepare: false,
    max: 10,
  });

  db = drizzle(client, { schema });
  return db;
}

// Check if database is configured
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

// Check database connection
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  if (!isDatabaseConfigured()) {
    return { connected: false, error: "DATABASE_URL not configured" };
  }

  try {
    const database = getDb();
    // Simple query to test connection
    await database.execute(sql`SELECT 1`);
    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Export schema types
export * from "./schema";
