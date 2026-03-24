import jwt from "jsonwebtoken";

/**
 * Создает JWT токен для админа
 * @param {Object} payload - Данные для токена (id, email, role)
 * @returns {string} JWT токен
 */
export function signAdmin(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Middleware для проверки JWT токена админа
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export default function authAdmin(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;

  try {
    const data = token ? jwt.verify(token, process.env.JWT_SECRET) : null;
    if (!data || !["admin", "editor", "viewer"].includes(data.role)) {
      return res.status(401).json({ ok: false, code: "UNAUTH" });
    }
    req.admin = data;
    next();
  } catch {
    return res.status(401).json({ ok: false, code: "UNAUTH" });
  }
}

/**
 * Middleware для проверки конкретной роли
 * @param {...string} roles - Разрешенные роли
 * @returns {Function} Express middleware
 */
export function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ ok: false, code: "FORBIDDEN" });
    }
    next();
  };
}
