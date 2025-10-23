import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  colors: z.array(z.string()).default([]),
  inStock: z.boolean().default(true),
});

export const CartItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  price: z.number().positive(),
  qty: z.number().int().positive().default(1),
});

export const CreateCheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  email: z.string().email().optional(),
});
