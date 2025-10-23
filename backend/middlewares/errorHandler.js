import { baseLogger } from "./logger.js";

export default function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";
  const msg =
    process.env.NODE_ENV === "production"
      ? status >= 500
        ? "Internal Server Error"
        : err.message
      : err.message;

  const payload = { ok: false, code, message: msg, reqId: req.id };
  if (status >= 500)
    baseLogger.error({ err, reqId: req.id }, "Unhandled error");
  else baseLogger.warn({ err, reqId: req.id }, "Handled error");

  res.status(status).json(payload);
}
