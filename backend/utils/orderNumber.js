/**
 * Генерирует номер заказа в формате HV-YYYY-NNNNNN
 * @param {number} seq - Порядковый номер заказа
 * @returns {string} Номер заказа (например: HV-2025-000123)
 */
export const orderNumber = (seq) => {
  const year = new Date().getFullYear();
  const paddedSeq = String(seq).padStart(6, "0");
  return `HV-${year}-${paddedSeq}`;
};
