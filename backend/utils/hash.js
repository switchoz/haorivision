import crypto from "crypto";

/**
 * Хэширует строку с помощью SHA-256
 * @param {string} s - Строка для хэширования
 * @returns {string} Хэш в hex формате
 */
export const hash = (s) => {
  return crypto.createHash("sha256").update(s).digest("hex");
};
