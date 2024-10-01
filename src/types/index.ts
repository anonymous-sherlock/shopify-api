import { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../db/schema";

declare module "hono" {
  interface Context {
    db: LibSQLDatabase<typeof schema>;
  }
}

export type Bindings = {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  SHOPIFY_SECRET: string;
  NUTRA_API_KEY: string;
  NUTRA_API_URL: string;
  IPINFO_TOKEN: string;
};

export type IPDetails = {
  ip: string;
  city: string;
  region: string;
  country: string;
  loc: string | undefined;
  org: string | undefined;
  postal: string;
  timezone: string | undefined;
};
