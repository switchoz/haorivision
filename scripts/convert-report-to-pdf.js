/**
 * Convert HTML report to PDF
 */

import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function convertToPDF() {
  const htmlPath = path.join(
    __dirname,
    "../reports/ux_audit_new_products.html",
  );
  const pdfPath = path.join(__dirname, "../reports/ux_audit_new_products.pdf");

  console.log("📄 Конвертация HTML в PDF...");

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0" });

  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "20mm",
      right: "15mm",
      bottom: "20mm",
      left: "15mm",
    },
  });

  await browser.close();

  console.log(`✅ PDF-отчёт сохранён: ${pdfPath}`);
}

convertToPDF();
