import { sql } from "drizzle-orm";
import { real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { generateId } from "../lib/id";

export const users = sqliteTable("users", {
  id: text("id", {
    length: 30,
    mode: "text",
  })
    .notNull()
    .$defaultFn(() => generateId("users"))
    .primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  pincode: text("pincode").notNull(),
  productName: text("product_name").notNull(),
  productSKU: text("product_sku").notNull(),
  ip: text("ip"),
  state: text("state"),
  city: text("city"),
  address1: text("address1"),
  address2: text("address2"),
  country: text("country"),
  orderId: text("order_id"),
  productId: text("product_id"),
  productUrl: text("product_url"),
  productPrice: real("product_price"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const webhook_logs = sqliteTable("webhook_logs", {
  id: text("id", {
    length: 30,
    mode: "text",
  })
    .notNull()
    .$defaultFn(() => generateId())
    .primaryKey(),
  status: text("status").notNull(),
  reason: text("reason").notNull(),
  message: text("message").notNull(),
  timestamp: text("timestamp")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const order_logs = sqliteTable("order_logs", {
  id: text("id", {
    length: 30,
    mode: "text",
  })
    .notNull()
    .$defaultFn(() => generateId("orders"))
    .primaryKey(),
  status: text("status").notNull(),
  payload: text("payload").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  ip: text("ip"),
  timestamp: text("timestamp")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
