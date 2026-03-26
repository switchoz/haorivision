import express from "express";
import authAdmin, { requireRole } from "../middlewares/authAdmin.js";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import { toCSV } from "../utils/csv.js";
import { baseLogger } from "../middlewares/logger.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import {
  sendOrderConfirmation,
  sendShippingNotification,
  sendWelcomeEmail,
} from "../services/emailService.js";

const r = express.Router();

// Все роуты защищены authAdmin
r.use(authAdmin);

/**
 * GET /api/admin/orders
 * Получить список заказов с фильтрацией и пагинацией
 * Query params:
 *   - status: статус заказа (new, paid, fulfilled, canceled, refunded)
 *   - email: email клиента (поиск по regex)
 *   - from: дата начала (YYYY-MM-DD)
 *   - to: дата окончания (YYYY-MM-DD)
 *   - page: номер страницы (default: 1)
 *   - limit: кол-во на странице (default: 20)
 *   - sort: сортировка (default: -createdAt)
 */
r.get("/", requireRole("admin", "editor", "viewer"), async (req, res) => {
  try {
    const {
      status,
      email,
      from,
      to,
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    const query = {};

    // Фильтр по статусу
    if (status) {
      query.status = status;
    }

    // Фильтр по email (регистронезависимый поиск)
    if (email) {
      query.email = new RegExp(escapeRegex(String(email)), "i");
    }

    // Фильтр по дате
    if (from || to) {
      query.createdAt = {};
      if (from) {
        query.createdAt.$gte = new Date(String(from));
      }
      if (to) {
        query.createdAt.$lte = new Date(String(to));
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Order.find(query).sort(String(sort)).skip(skip).limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    baseLogger.error({ err }, "Error fetching orders");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * PATCH /api/admin/orders/:id
 * Обновить статус заказа
 * Body: { status: 'new' | 'paid' | 'fulfilled' | 'canceled' | 'refunded' }
 */
r.patch("/:id", requireRole("admin", "editor"), async (req, res) => {
  try {
    const { status } = req.body || {};

    const validStatuses = ["new", "paid", "fulfilled", "canceled", "refunded"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ ok: false, code: "BAD_STATUS" });
    }

    const doc = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!doc) {
      return res.status(404).json({ ok: false, code: "NOT_FOUND" });
    }

    baseLogger.info(
      { adminId: req.admin.id, orderId: req.params.id, status },
      "Order status updated",
    );

    // Отправка email при смене статуса (non-blocking)
    sendOrderStatusEmail(doc, status).catch((err) =>
      baseLogger.warn({ err, orderId: doc._id }, "Order status email failed"),
    );

    res.json({ ok: true, item: doc });
  } catch (err) {
    baseLogger.error({ err }, "Error updating order status");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * POST /api/admin/orders/export
 * Экспорт заказов в CSV
 * Body: { status?, email?, from?, to? } - те же фильтры что и в GET
 */
r.post("/export", requireRole("admin", "editor"), async (req, res) => {
  try {
    const { status, email, from, to } = req.body || {};

    const query = {};

    if (status) {
      query.status = status;
    }

    if (email) {
      query.email = new RegExp(escapeRegex(String(email)), "i");
    }

    if (from || to) {
      query.createdAt = {};
      if (from) {
        query.createdAt.$gte = new Date(String(from));
      }
      if (to) {
        query.createdAt.$lte = new Date(String(to));
      }
    }

    // Ограничение: максимум 5000 заказов
    const items = await Order.find(query).sort("-createdAt").limit(5000);

    // Формируем строки для CSV
    const rows = items.map((o) => ({
      number: o.number,
      email: o.email,
      status: o.status,
      amount: o.amount,
      currency: o.currency,
      createdAt: o.createdAt.toISOString(),
    }));

    const csv = toCSV(rows);

    baseLogger.info(
      { adminId: req.admin.id, count: rows.length },
      "Orders exported to CSV",
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="orders.csv"');
    res.send(csv);
  } catch (err) {
    baseLogger.error({ err }, "Error exporting orders");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * Отправка email при смене статуса заказа
 * Не блокирует ответ API — ошибки логируются
 */
async function sendOrderStatusEmail(order, newStatus) {
  // Получить email клиента
  const email =
    order.email ||
    (order.customer ? (await Customer.findById(order.customer))?.email : null);
  if (!email) return;

  const customer = { name: order.shippingAddress?.name || "Клиент", email };

  switch (newStatus) {
    case "paid": {
      const result = await sendOrderConfirmation(customer, order);
      if (result.success && !order.emailSent?.confirmation) {
        await Order.findByIdAndUpdate(order._id, {
          "emailSent.confirmation": true,
        });
      }
      // Welcome email при первой оплате
      if (!order.emailSent?.welcome) {
        const wr = await sendWelcomeEmail(customer, order);
        if (wr.success) {
          await Order.findByIdAndUpdate(order._id, {
            "emailSent.welcome": true,
          });
        }
      }
      break;
    }
    case "fulfilled":
    case "shipped": {
      if (order.tracking?.trackingNumber && !order.emailSent?.shipping) {
        const result = await sendShippingNotification(customer, order);
        if (result.success) {
          await Order.findByIdAndUpdate(order._id, {
            "emailSent.shipping": true,
          });
        }
      }
      break;
    }
  }
}

export default r;
