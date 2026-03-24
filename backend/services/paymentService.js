import Stripe from "stripe";
import { stripeConfig } from "../config/stripe.js";
import Order from "../models/Order.js";
import { baseLogger } from "../middlewares/logger.js";

const stripe = new Stripe(stripeConfig.secretKey, { apiVersion: "2024-06-20" });

function toMinor(amountNumber) {
  // «рубли → копейки» (или «валюта → минорные единицы»)
  return Math.round(Number(amountNumber) * 100);
}

export async function createCheckout({
  items = [],
  successUrl,
  cancelUrl,
  customerEmail,
}) {
  const line_items = items.map((it) => ({
    price_data: {
      currency: stripeConfig.currency,
      product_data: { name: it.name, metadata: { sku: it.sku || "" } },
      unit_amount: toMinor(it.price),
    },
    quantity: it.qty ?? 1,
  }));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail || undefined,
    allow_promotion_codes: true,
  });
  return session;
}

/**
 * Create a PaymentIntent for custom checkout flow
 */
export async function createPaymentIntent({
  amount,
  currency,
  orderId,
  customerEmail,
}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: toMinor(amount),
    currency: currency || stripeConfig.currency,
    receipt_email: customerEmail || undefined,
    metadata: { orderId: orderId || "" },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
}

export async function handleWebhook(rawBody, signature, webhookSecret) {
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  // Конструируем и валидируем событие Stripe
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }

  // Обработка различных типов событий
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      baseLogger.info(`[Webhook] Checkout completed: ${session.id}`);
      if (session.metadata?.orderId) {
        await Order.findByIdAndUpdate(session.metadata.orderId, {
          status: "paid",
          "payment.status": "completed",
          "payment.transactionId": session.payment_intent,
          "payment.paidAt": new Date(),
        });
      }
      return { received: true, type: event.type, sessionId: session.id };
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      baseLogger.info(`[Webhook] Payment succeeded: ${paymentIntent.id}`);
      if (paymentIntent.metadata?.orderId) {
        await Order.findByIdAndUpdate(paymentIntent.metadata.orderId, {
          status: "paid",
          "payment.status": "completed",
          "payment.transactionId": paymentIntent.id,
          "payment.paidAt": new Date(),
        });
      }
      return { received: true, type: event.type, paymentId: paymentIntent.id };
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      baseLogger.error(`[Webhook] Payment failed: ${paymentIntent.id}`);
      if (paymentIntent.metadata?.orderId) {
        await Order.findByIdAndUpdate(paymentIntent.metadata.orderId, {
          "payment.status": "failed",
        });
      }
      return { received: true, type: event.type, paymentId: paymentIntent.id };
    }

    default:
      baseLogger.info(`[Webhook] Unhandled event type: ${event.type}`);
      return { received: true, type: event.type };
  }
}
