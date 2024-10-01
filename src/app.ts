import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Bindings, IPDetails } from "./types";
import { createClient } from "@libsql/client";
import * as schema from "./db/schema";
import { eq } from "drizzle-orm";
import { fetchIPDetails, logErrors, sendToNutraFirst, verifyHmac } from "./lib/utils";
import { ShopifyWebhookSchema } from "./validation";
import { ZodError } from "zod";

const app = new Hono<{ Bindings: Bindings }>();

let db: LibSQLDatabase<typeof schema> | null = null;

const initializeDb = (env: Bindings) => {
  if (!db) {
    const client = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    });

    db = drizzle(client, { schema });
  }
  return db;
};

app.use("/*", cors());
app.use("/*", async (ctx, next) => {
  ctx.db = initializeDb(ctx.env);
  await next();
});
app.post("/webhook", async (c) => {
  try {
    const hmacHeader = c.req.header("x-shopify-hmac-sha256") ?? "";
    const SHOPIFY_SECRET = c.env.SHOPIFY_SECRET;
    const body = await c.req.text();
    if (!verifyHmac(hmacHeader, body, SHOPIFY_SECRET)) {
      return c.json({ error: "Invalid HMAC signature" }, 400);
    }
    const data = await JSON.parse(body);
    const parsedDate = await ShopifyWebhookSchema.parseAsync(data);
    const { id: order_id, customer, line_items: product, shipping_address, note_attributes } = parsedDate;

    const phoneNumber = customer.phone ?? parsedDate.note_attributes.find((attr) => attr.name === "Phone")?.value ?? "";
    const ipAddress = note_attributes.find((attr) => attr.name === "IP Address")?.value ?? "";
    const address = note_attributes.find((attr) => attr.name === "Address")?.value ?? "";
    const fullName = note_attributes.find((attr) => attr.name === "Name")?.value ?? "";

    const phoneResults = await c.db.select().from(schema.users).where(eq(schema.users.phone, phoneNumber));
    const ipResults = await c.db.select().from(schema.users).where(eq(schema.users.ip, ipAddress));
    let ipDetails: IPDetails | undefined;
    if (ipAddress) {
      ipDetails = await fetchIPDetails(ipAddress, c.env.IPINFO_TOKEN);
      console.log(ipDetails);
    }

    const productSKU = product[0].sku;
    const productName = product[0].name;
    const productPrice = product[0].price;
    const productId = product[0].product_id;
    const product_quantity = product[0].quantity;
    const product_url = parsedDate.note_attributes.find((attr) => attr.name === "full_url")?.value ?? "";

    if (phoneResults.length > 1 || ipResults.length > 1) {
      return c.json({ status: "order already placed" });
    }
    const { success, response } = await sendToNutraFirst(
      parsedDate,
      {
        city: ipDetails?.city ?? "",
        pincode: ipDetails?.postal ?? "",
        province: ipDetails?.region ?? "",
      },
      c.env.NUTRA_API_KEY,
      c.env.NUTRA_API_URL
    );
    if (!success) {
      await logErrors({ db: c.db, message: "Failed to send data to NutraFirst API", errorCause: response ?? "" });
      return c.json({ error: "Failed to send data to NutraFirst API" }, 500);
    }
    const newUser: schema.InsertUser = {
      name: fullName ?? "",
      phone: phoneNumber ?? "",
      address1: address,
      pincode: String(shipping_address.zip) ?? "",
      state: shipping_address.province ?? ipDetails?.region,
      city: shipping_address.city ?? ipDetails?.city,
      country: shipping_address.country ?? ipDetails?.country,
      ip: ipAddress,
      productPrice: parseFloat(String(productPrice)),
      productUrl: product_url,
      productId: String(productId),
      orderId: String(order_id),
      address2: shipping_address.address2,
      productName: productName ?? "",
      productSKU: productSKU ?? "",
    };
    await c.db.insert(schema.users).values(newUser);
    await c.db.insert(schema.order_logs).values({
      status: "Success",
      payload: "{}" ?? "",
      name: fullName,
      phone: phoneNumber,
      ip: ipAddress,
    });
    return c.json("ok", 200);
  } catch (error) {
    if (error instanceof ZodError) {
      await logErrors({ db: c.db, message: JSON.stringify(error.flatten().fieldErrors), errorCause: error.name });
      return c.json({ error: error.flatten().fieldErrors }, 500);
    } else if (error instanceof Error) {
      await logErrors({ db: c.db, message: error.message, errorCause: error.name });
      return c.json({ error: error.message }, 500);
    } else {
      await logErrors({ db: c.db, message: "something went wrong", errorCause: "Internal Server Error" });
      return c.json({ error: "something went wrong" }, 500);
    }
  }
});
export default app;
