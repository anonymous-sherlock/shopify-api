import crypto from "crypto"; // Node.js crypto module
import { z } from "zod";
import { nutraAffilateSchema, ShopifyWebhookSchema } from "../validation";
import { IPDetails } from "../types";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../db/schema";

// Sanitize input to prevent XSS
const sanitize = (data: string) => {
  return data.replace(/[<>]/g, "");
};

// Verify HMAC using Web Crypto API
export async function verifyHmac(hmacHeader: string, body: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));

  const hash = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return hash === hmacHeader;
}

export const sendToNutraFirst = async (
  data: z.infer<typeof ShopifyWebhookSchema>,
  optionalData: {
    pincode: string;
    city: string;
    province: String;
  },
  API_KEY: string,
  API_URL: string
) => {
  const postData = {
    sku: data.line_items[0].sku,
    sub1: String(data.id),
    sub2: "",
    sub3: "",
    first_name: data.customer.first_name ?? "",
    last_name: data.customer.last_name ?? "",
    telephone: data.customer.phone ?? "",
    email_id: data.customer.email ?? "",
    pincode: String(data.shipping_address.zip) ?? optionalData.pincode,
    address: data.shipping_address.address1,
    address_1: data.shipping_address.address2,
    product_name: data.line_items[0].name ?? "",
    product_price: String(data.line_items[0].price),
    payment: "COD",
    city: data.shipping_address.city ?? optionalData.city,
    state: String(data.shipping_address.province) ?? optionalData.province,
  } satisfies z.infer<typeof nutraAffilateSchema>;

  const headers = {
    "Content-Type": "application/json",
    "Api-Key": API_KEY,
  };

  try {
    const response = await fetch("https://api.xpressmiles.in/dropshipper/add_shipper_order", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(postData),
    });

    const responseBody = await response.json();
    console.log(`NutraFirst API response: ${responseBody}`);
    return { success: response.status === 200, response: JSON.stringify(responseBody) };
  } catch (error) {
    console.error("Error sending data to NutraFirst API:", error);
    return { success: false };
  }
};

export async function fetchIPDetails(ip: string, token: string) {
  const url = `https://ipinfo.io/${ip}/json?token=${token}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching IP details: ${response.statusText}`);
    }
    const ipDetails = await response.json();
    return ipDetails as IPDetails;
  } catch (error) {
    console.error("Failed to fetch IP details:", error);
    return undefined;
  }
}

type logErrorsType = {
  db: LibSQLDatabase<typeof schema>;
  message: string;
  errorCause: string;
};
export async function logErrors({ db, message, errorCause }: logErrorsType) {
  await db.insert(schema.webhook_logs).values({
    status: "failure",
    reason: errorCause,
    message: message,
    timestamp: new Date().toISOString(),
  });
}
