import express from "express";
import bodyParser from "body-parser";
import {
  createCheckout,
  createPaymentIntent,
  handleWebhook,
} from "../services/paymentService.js";
import { CreateCheckoutSchema } from "../schemas/index.js";

const router = express.Router();

router.post("/checkout", async (req, res, next) => {
  try {
    const { items, successUrl, cancelUrl, email } = CreateCheckoutSchema.parse(
      req.body,
    );
    const out = await createCheckout({
      items,
      successUrl,
      cancelUrl,
      customerEmail: email,
    });
    res.json(out);
  } catch (e) {
    next(e);
  }
});

router.post("/create-intent", async (req, res, next) => {
  try {
    const { amount, currency, orderId, customerEmail } = req.body;
    if (!amount) return res.status(400).json({ error: "amount is required" });
    const result = await createPaymentIntent({
      amount,
      currency,
      orderId,
      customerEmail,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// ВАЖНО: сырое тело для Stripe webhook
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res, next) => {
    try {
      const sig = req.headers["stripe-signature"];
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      const result = await handleWebhook(req.body, sig, secret);
      res.json(result);
    } catch (e) {
      next(e);
    }
  },
);

export default router;
