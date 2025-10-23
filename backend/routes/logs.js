import express from "express";
import { baseLogger } from "../middlewares/logger.js";

const router = express.Router();

router.post("/", (req, res) => {
  const { level = "info", message = "", data = {} } = req.body || {};
  const fn = baseLogger[level] || baseLogger.info;
  fn.call(baseLogger, { ...data, reqId: req.id }, message || "client-log");
  res.json({ ok: true });
});

export default router;
