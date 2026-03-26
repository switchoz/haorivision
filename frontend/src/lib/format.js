/**
 * Форматирование цены с правильным символом валюты
 * @param {number} price — сумма
 * @param {string} currency — код валюты (USD, EUR, RUB, …)
 * @returns {string} — отформатированная строка, напр. "1 200 €"
 */
export const formatPrice = (price, currency = "USD") => {
  const symbols = { USD: "$", EUR: "€", RUB: "₽" };
  const sym = symbols[currency] || currency;
  return `${price?.toLocaleString("ru-RU")} ${sym}`;
};
