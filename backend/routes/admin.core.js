import express from "express";
import authAdmin from "../middlewares/authAdmin.js";
import { baseLogger } from "../middlewares/logger.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import BespokeCommission from "../models/BespokeCommission.js";

const r = express.Router();

r.use(authAdmin);

/**
 * GET /api/admin/stats
 * Статистика панели управления (реальные данные из MongoDB)
 */
r.get("/stats", async (_req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      revenueAgg,
      ordersCount,
      customersCount,
      productsCount,
      bespokeCount,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      // Выручка за 30 дней
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            "payment.status": "completed",
          },
        },
        { $group: { _id: null, total: { $sum: "$payment.amount" } } },
      ]),
      // Заказы за 30 дней
      Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      // Всего клиентов
      Customer.countDocuments(),
      // Всего товаров
      Product.countDocuments(),
      // Bespoke заказов
      BespokeCommission.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      // Последние 10 заказов
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("customer", "name email")
        .lean(),
      // Топ продаваемые товары
      Order.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            sales: { $sum: "$items.qty" },
            revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
          },
        },
        { $sort: { sales: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const revenue = revenueAgg[0]?.total || 0;
    const aov = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;

    res.json({
      kpi: {
        revenue,
        orders: ordersCount,
        aov,
        customers: customersCount,
        products: productsCount,
        bespoke: bespokeCount,
      },
      trending: topProducts.map((p) => ({
        name: p._id || "Unknown",
        sales: p.sales,
        revenue: p.revenue,
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.orderNumber || o._id,
        customer: o.customer?.name || o.email || "N/A",
        amount: o.payment?.amount || 0,
        status: o.status,
        date: o.createdAt,
      })),
    });
  } catch (err) {
    baseLogger.error({ err }, "Error fetching admin stats");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * GET /api/admin/logs
 * Последние логи из MongoDB (если есть коллекция) или из памяти
 */
r.get("/logs", async (_req, res) => {
  try {
    // Простой лог из последних заказов и ошибок
    const recentActivity = await Order.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select("orderNumber status createdAt email payment.amount")
      .lean();

    const items = recentActivity.map((o) => ({
      type: "order",
      message: `Заказ ${o.orderNumber || o._id} — ${o.status} — $${o.payment?.amount || 0}`,
      email: o.email,
      timestamp: o.createdAt,
    }));

    res.json({ items });
  } catch (err) {
    baseLogger.error({ err }, "Error fetching logs");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

/**
 * GET /api/admin/health
 * Проверка здоровья системы
 */
r.get("/health", async (_req, res) => {
  try {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    res.json(health);
  } catch (err) {
    baseLogger.error({ err }, "Error fetching health");
    res.status(500).json({ ok: false, code: "SERVER_ERROR" });
  }
});

export default r;
