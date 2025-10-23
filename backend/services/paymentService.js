import Stripe from "stripe";
import { stripeConfig } from "../config/stripe.js";

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
      console.log(`[Webhook] Checkout completed: ${session.id}`);
      // Здесь можно добавить логику: обновить заказ в БД, отправить email и т.д.
      return { received: true, type: event.type, sessionId: session.id };
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      console.log(`[Webhook] Payment succeeded: ${paymentIntent.id}`);
      return { received: true, type: event.type, paymentId: paymentIntent.id };
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      console.error(`[Webhook] Payment failed: ${paymentIntent.id}`);
      return { received: true, type: event.type, paymentId: paymentIntent.id };
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
      return { received: true, type: event.type };
  }
}
