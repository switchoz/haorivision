/**
 * Преобразует массив объектов в CSV формат
 * @param {Array<Object>} rows - Массив объектов для конвертации
 * @returns {string} CSV строка
 */
export function toCSV(rows) {
  if (!rows?.length) return "";

  const cols = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const head = cols.map(esc).join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");

  return head + "\n" + body;
}
