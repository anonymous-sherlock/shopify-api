import { z } from "zod";

export const ShopifyWebhookSchema = z.object({
  id: z.string().or(z.number()),
  customer: z.object({
    first_name: z.string().nullable(),
    last_name: z.string().optional().nullable(),
    phone: z.string().nullable(),
    email: z.string().optional().nullable(),
  }),
  shipping_address: z.object({
    first_name: z.string(),
    last_name: z.string().optional(),
    phone: z.string().or(z.number()),
    zip: z.string().or(z.number()),
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    country: z.string().optional(),
    country_code: z.string().optional(),
    province_code: z.string().optional(),
  }),
  note_attributes: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
    })
  ),
  line_items: z.array(
    z.object({
      sku: z.string(),
      name: z.string().optional(),
      price: z.number().or(z.string()),
      quantity: z.number().or(z.string()),
      product_id: z.number().or(z.string()),
    })
  ),
});

export const nutraAffilateSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  sub1: z.string().min(1, "Sub1 is required"),
  sub2: z.string().optional(),
  sub3: z.string().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  telephone: z.string().min(1, "Telephone is required"),
  email_id: z.string().email("Invalid email format").optional(),
  pincode: z.string().min(1, "Pincode is required"),
  address: z.string().min(1, "Address is required"),
  address_1: z.string().optional(),
  product_name: z.string().min(1, "Product name is required"),
  product_price: z.string().min(1, "Product price is required"),
  payment: z.literal("COD"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
});
