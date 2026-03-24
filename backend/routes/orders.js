/**
 * ORDERS API
 *
 * Endpoints для управления заказами HaoriVision
 */

import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";

const router = express.Router();

/**
 * POST /api/orders
 * Создать новый заказ
 * Body: { productId, paymentMethodId, customer: { name, email, ... }, amount, shippingAddress, ... }
 */
router.post("/", async (req, res) => {
  try {
    const {
      productId,
      paymentMethodId,
      customer: customerData,
      amount,
      shippingAddress,
      notes,
    } = req.body;

    // Найти продукт
    let product = await Product.findOne({ id: productId });
    if (!product) {
      if (productId && productId.match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findById(productId);
      }
    }

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.editions.remaining <= 0) {
      return res.status(400).json({ error: "Product is sold out" });
    }

    // Найти или создать клиента
    let customerName = customerData.name;
    if (!customerName && (customerData.firstName || customerData.lastName)) {
      customerName = [customerData.firstName, customerData.lastName]
        .filter(Boolean)
        .join(" ");
    }
    if (!customerName) customerName = "Client";
    let customer = await Customer.findOne({ email: customerData.email });
    if (!customer) {
      customer = new Customer({
        name: customerName,
        email: customerData.email,
        phone: customerData.phone || null,
        password:
          customerData.password || Math.random().toString(36).slice(2) + "Aa1!",
        shippingAddress: shippingAddress || {
          street: customerData.address,
          city: customerData.city,
          postalCode: customerData.postalCode,
          country: customerData.country,
        },
        source: "web",
      });
      await customer.save();
    }

    // Рассчитать номер edition
    const editionNumber = product.editions.sold + 1;

    // Создать заказ
    const order = new Order({
      customer: customer._id,
      items: [
        {
          product: product._id,
          productId: product.id,
          name: product.name,
          price: product.price,
          editionNumber,
        },
      ],
      shippingAddress: shippingAddress || customerData.shippingAddress,
      payment: {
        method: paymentMethodId || "stripe",
        amount: amount || product.price,
        currency: product.currency || "USD",
        status: "pending",
      },
      totals: {
        subtotal: product.price,
        shipping: 0,
        tax: 0,
        total: amount || product.price,
      },
      notes: {
        customer: notes || null,
      },
      status: "pending",
    });

    await order.save();

    // Обновить продукт: уменьшить remaining, увеличить sold
    product.editions.remaining -= 1;
    product.editions.sold += 1;
    await product.save();

    // Добавить заказ к клиенту
    customer.orders.push(order._id);
    customer.totalSpent += order.totals.total;
    await customer.save();

    // Populate для ответа
    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email")
      .populate("items.product", "name id images");

    res.status(201).json({ order: populatedOrder });
  } catch (error) {
    console.error(
      "Failed to create order:",
      error.message,
      error.stack?.split("\n")[1],
    );

    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: "Duplicate order or customer" });
    }

    res
      .status(500)
      .json({ error: "Failed to create order", detail: error.message });
  }
});

/**
 * GET /api/orders/:orderId
 * Получить заказ по orderId (MongoDB _id) или orderNumber
 */
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    let order;

    // Попробовать найти по orderNumber (формат HVYYMMxxxx)
    if (orderId.startsWith("HV")) {
      order = await Order.findOne({ orderNumber: orderId })
        .populate("customer", "name email phone")
        .populate("items.product");
    }

    // Если не нашли — попробовать по MongoDB _id
    if (!order && orderId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(orderId)
        .populate("customer", "name email phone")
        .populate("items.product");
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ order });
  } catch (error) {
    console.error("Failed to get order:", error);
    res.status(500).json({ error: "Failed to get order" });
  }
});

/**
 * PATCH /api/orders/:orderId/status
 * Обновить статус заказа
 * Body: { status, tracking?, payment? }
 */
router.patch("/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, tracking, payment } = req.body;

    let order;

    if (orderId.startsWith("HV")) {
      order = await Order.findOne({ orderNumber: orderId });
    }

    if (!order && orderId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(orderId);
    }

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const validStatuses = [
      "pending",
      "processing",
      "paid",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (status && !validStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
    }

    if (status) {
      order.status = status;
    }

    if (tracking) {
      order.tracking = { ...order.tracking, ...tracking };
      if (tracking.trackingNumber && !order.tracking.shippedAt) {
        order.tracking.shippedAt = new Date();
      }
    }

    if (payment) {
      order.payment = { ...order.payment, ...payment };
      if (payment.status === "completed" && !order.payment.paidAt) {
        order.payment.paidAt = new Date();
      }
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("customer", "name email")
      .populate("items.product", "name id");

    res.json({ order: updatedOrder });
  } catch (error) {
    console.error("Failed to update order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

export default router;
