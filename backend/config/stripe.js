export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY || "",
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  currency: (process.env.STRIPE_CURRENCY || "rub").toLowerCase(),
};
