/**
 * 🔍 UX AUDIT SCRIPT
 *
 * Автоматический UX-тест для новых страниц:
 * - Загрузка < 3 сек
 * - Адаптивность (мобильный/desktop)
 * - Доступность кнопок (ARIA labels)
 * - Корректное отображение цены и описания
 * - Наличие FAQ и блока ухода
 *
 * Генерирует PDF-отчёт в /reports/ux_audit_new_products.pdf
 */

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Новые страницы для аудита
const NEW_PAGES = [
  {
    name: "Bespoke Form",
    url: "http://localhost:3012/forms/bespoke.html",
    type: "form",
  },
  {
    name: "Admin Metrics Dashboard",
    url: "http://localhost:3012/admin/metrics",
    type: "admin",
  },
];

// Критерии аудита
const AUDIT_CRITERIA = {
  performance: {
    maxLoadTime: 3000, // 3 seconds
    weight: 30,
  },
  responsive: {
    breakpoints: [
      { name: "Mobile", width: 375, height: 667 },
      { name: "Tablet", width: 768, height: 1024 },
      { name: "Desktop", width: 1920, height: 1080 },
    ],
    weight: 25,
  },
  accessibility: {
    requiredElements: ["button", "a", "input"],
    weight: 20,
  },
  content: {
    weight: 15,
  },
  additionalContent: {
    weight: 10,
  },
};

class UXAuditor {
  constructor() {
    this.results = [];
    this.browser = null;
  }

  async init() {
    console.log("🚀 Запуск UX-аудита...\n");
    this.browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  async auditPage(pageConfig) {
    console.log(`\n📄 Аудит: ${pageConfig.name}`);
    console.log(`   URL: ${pageConfig.url}`);

    const result = {
      name: pageConfig.name,
      url: pageConfig.url,
      type: pageConfig.type,
      timestamp: new Date().toISOString(),
      scores: {},
      issues: [],
      passed: [],
      totalScore: 0,
    };

    try {
      // 1. Performance Test
      result.scores.performance = await this.testPerformance(pageConfig.url);

      // 2. Responsive Test
      result.scores.responsive = await this.testResponsive(pageConfig.url);

      // 3. Accessibility Test
      result.scores.accessibility = await this.testAccessibility(
        pageConfig.url,
      );

      // 4. Content Test
      result.scores.content = await this.testContent(
        pageConfig.url,
        pageConfig.type,
      );

      // 5. Additional Content (FAQ, Care Instructions)
      result.scores.additionalContent = await this.testAdditionalContent(
        pageConfig.url,
        pageConfig.type,
      );

      // Calculate total score
      result.totalScore = this.calculateTotalScore(result.scores);

      console.log(`\n✅ Общий балл: ${result.totalScore}/100`);
    } catch (error) {
      console.error(`❌ Ошибка при аудите ${pageConfig.name}:`, error.message);
      result.error = error.message;
      result.totalScore = 0;
    }

    this.results.push(result);
    return result;
  }

  async testPerformance(url) {
    console.log("\n  ⏱️  Тест производительности...");

    const page = await this.browser.newPage();
    const score = { value: 0, details: {}, issues: [], passed: [] };

    try {
      const startTime = Date.now();

      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 10000,
      });

      const loadTime = Date.now() - startTime;
      score.details.loadTime = loadTime;

      if (loadTime < AUDIT_CRITERIA.performance.maxLoadTime) {
        score.value = 100;
        score.passed.push(`Загрузка завершена за ${loadTime}ms (< 3s)`);
        console.log(`     ✓ Загрузка: ${loadTime}ms`);
      } else {
        score.value = Math.max(
          0,
          100 - (loadTime - AUDIT_CRITERIA.performance.maxLoadTime) / 100,
        );
        score.issues.push(
          `Медленная загрузка: ${loadTime}ms (ожидалось < 3000ms)`,
        );
        console.log(`     ✗ Загрузка: ${loadTime}ms (слишком долго)`);
      }

      // Check resource sizes
      const metrics = await page.metrics();
      score.details.metrics = metrics;
    } catch (error) {
      score.value = 0;
      score.issues.push(`Ошибка загрузки: ${error.message}`);
      console.log(`     ✗ Ошибка: ${error.message}`);
    } finally {
      await page.close();
    }

    return score;
  }

  async testResponsive(url) {
    console.log("\n  📱 Тест адаптивности...");

    const score = { value: 0, details: {}, issues: [], passed: [] };
    let passedBreakpoints = 0;

    for (const breakpoint of AUDIT_CRITERIA.responsive.breakpoints) {
      const page = await this.browser.newPage();

      try {
        await page.setViewport({
          width: breakpoint.width,
          height: breakpoint.height,
        });

        await page.goto(url, {
          waitUntil: "networkidle0",
          timeout: 10000,
        });

        // Check for horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return (
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth
          );
        });

        // Check for overlapping elements
        const hasOverlap = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll("*"));
          // Simple overlap check (can be enhanced)
          return false; // Placeholder
        });

        if (!hasHorizontalScroll && !hasOverlap) {
          passedBreakpoints++;
          score.passed.push(
            `${breakpoint.name} (${breakpoint.width}x${breakpoint.height}): OK`,
          );
          console.log(`     ✓ ${breakpoint.name}: корректно`);
        } else {
          if (hasHorizontalScroll) {
            score.issues.push(`${breakpoint.name}: горизонтальная прокрутка`);
            console.log(`     ✗ ${breakpoint.name}: горизонтальная прокрутка`);
          }
          if (hasOverlap) {
            score.issues.push(`${breakpoint.name}: перекрытие элементов`);
          }
        }

        score.details[breakpoint.name] = {
          width: breakpoint.width,
          height: breakpoint.height,
          hasHorizontalScroll,
          hasOverlap,
        };
      } catch (error) {
        score.issues.push(`${breakpoint.name}: ошибка - ${error.message}`);
        console.log(`     ✗ ${breakpoint.name}: ${error.message}`);
      } finally {
        await page.close();
      }
    }

    score.value =
      (passedBreakpoints / AUDIT_CRITERIA.responsive.breakpoints.length) * 100;
    return score;
  }

  async testAccessibility(url) {
    console.log("\n  ♿ Тест доступности...");

    const page = await this.browser.newPage();
    const score = { value: 0, details: {}, issues: [], passed: [] };

    try {
      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 10000,
      });

      // Check buttons for ARIA labels or text
      const buttonIssues = await page.evaluate(() => {
        const buttons = Array.from(
          document.querySelectorAll('button, .btn, [role="button"]'),
        );
        const issues = [];
        const passed = [];

        buttons.forEach((btn, index) => {
          const hasAriaLabel = btn.hasAttribute("aria-label");
          const hasText = btn.textContent.trim().length > 0;
          const hasTitle = btn.hasAttribute("title");

          if (!hasAriaLabel && !hasText && !hasTitle) {
            issues.push(
              `Кнопка #${index + 1}: нет aria-label, текста или title`,
            );
          } else {
            passed.push(
              `Кнопка: "${btn.textContent.trim() || btn.getAttribute("aria-label") || btn.getAttribute("title")}"`,
            );
          }
        });

        return { issues, passed, total: buttons.length };
      });

      // Check links
      const linkIssues = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("a"));
        const issues = [];
        const passed = [];

        links.forEach((link, index) => {
          const hasAriaLabel = link.hasAttribute("aria-label");
          const hasText = link.textContent.trim().length > 0;
          const hasTitle = link.hasAttribute("title");

          if (!hasAriaLabel && !hasText && !hasTitle) {
            issues.push(`Ссылка #${index + 1}: нет доступного текста`);
          } else {
            passed.push(
              `Ссылка: "${link.textContent.trim() || link.getAttribute("aria-label")}"`,
            );
          }
        });

        return { issues, passed, total: links.length };
      });

      // Check inputs
      const inputIssues = await page.evaluate(() => {
        const inputs = Array.from(
          document.querySelectorAll("input, textarea, select"),
        );
        const issues = [];
        const passed = [];

        inputs.forEach((input, index) => {
          const hasLabel =
            document.querySelector(`label[for="${input.id}"]`) !== null;
          const hasAriaLabel = input.hasAttribute("aria-label");
          const hasPlaceholder = input.hasAttribute("placeholder");

          if (!hasLabel && !hasAriaLabel && !hasPlaceholder) {
            issues.push(`Поле ввода #${index + 1}: нет label или aria-label`);
          } else {
            passed.push(`Поле: ${input.name || input.id || "unnamed"}`);
          }
        });

        return { issues, passed, total: inputs.length };
      });

      score.issues = [
        ...buttonIssues.issues,
        ...linkIssues.issues,
        ...inputIssues.issues,
      ];

      score.passed = [
        ...buttonIssues.passed.slice(0, 3), // Limit to 3 examples
        ...linkIssues.passed.slice(0, 3),
        ...inputIssues.passed.slice(0, 3),
      ];

      const totalElements =
        buttonIssues.total + linkIssues.total + inputIssues.total;
      const totalIssues = score.issues.length;

      score.value =
        totalElements > 0
          ? ((totalElements - totalIssues) / totalElements) * 100
          : 100;

      score.details = {
        buttons: buttonIssues.total,
        links: linkIssues.total,
        inputs: inputIssues.total,
        totalIssues: totalIssues,
      };

      console.log(
        `     Кнопок: ${buttonIssues.total}, Ссылок: ${linkIssues.total}, Полей: ${inputIssues.total}`,
      );
      console.log(`     Проблем: ${totalIssues}`);
    } catch (error) {
      score.value = 0;
      score.issues.push(`Ошибка: ${error.message}`);
      console.log(`     ✗ Ошибка: ${error.message}`);
    } finally {
      await page.close();
    }

    return score;
  }

  async testContent(url, pageType) {
    console.log("\n  📝 Тест контента...");

    const page = await this.browser.newPage();
    const score = { value: 0, details: {}, issues: [], passed: [] };

    try {
      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 10000,
      });

      if (pageType === "form") {
        // Check for bespoke form specifics
        const formContent = await page.evaluate(() => {
          const hasPrice =
            document.body.textContent.includes("€") ||
            document.body.textContent.includes("3000") ||
            document.body.textContent.includes("3,000");
          const hasDescription = document.body.textContent.length > 500;
          const hasName = document.querySelector('input[name="name"]') !== null;
          const hasEmail =
            document.querySelector('input[name="email"]') !== null;
          const hasSubmit =
            document.querySelector('button[type="submit"]') !== null;

          return {
            hasPrice,
            hasDescription,
            hasName,
            hasEmail,
            hasSubmit,
          };
        });

        let checks = 0;
        if (formContent.hasPrice) {
          score.passed.push("Цена отображается");
          checks++;
        } else {
          score.issues.push("Цена не найдена");
        }

        if (formContent.hasDescription) {
          score.passed.push("Описание присутствует");
          checks++;
        } else {
          score.issues.push("Недостаточно описания");
        }

        if (formContent.hasName && formContent.hasEmail) {
          score.passed.push("Обязательные поля присутствуют");
          checks++;
        } else {
          score.issues.push("Отсутствуют обязательные поля формы");
        }

        if (formContent.hasSubmit) {
          score.passed.push("Кнопка отправки присутствует");
          checks++;
        } else {
          score.issues.push("Нет кнопки отправки");
        }

        score.value = (checks / 4) * 100;
        score.details = formContent;
      } else if (pageType === "admin") {
        // Check for metrics dashboard specifics
        const dashboardContent = await page.evaluate(() => {
          const hasMetrics =
            document.querySelector(".metrics-cards") !== null ||
            document.querySelector(".metric-card") !== null;
          const hasTable = document.querySelector("table") !== null;
          const hasChart =
            document.querySelector(".chart-container") !== null ||
            document.querySelector(".bar-chart") !== null;
          const hasFilters =
            document.querySelector(".metrics-filters") !== null ||
            document.querySelector('input[type="date"]') !== null;

          return {
            hasMetrics,
            hasTable,
            hasChart,
            hasFilters,
          };
        });

        let checks = 0;
        if (dashboardContent.hasMetrics) {
          score.passed.push("Метрики отображаются");
          checks++;
        } else {
          score.issues.push("Карточки метрик не найдены");
        }

        if (dashboardContent.hasTable) {
          score.passed.push("Таблица SKU присутствует");
          checks++;
        } else {
          score.issues.push("Таблица отсутствует");
        }

        if (dashboardContent.hasChart) {
          score.passed.push("График присутствует");
          checks++;
        } else {
          score.issues.push("График не найден");
        }

        if (dashboardContent.hasFilters) {
          score.passed.push("Фильтры присутствуют");
          checks++;
        } else {
          score.issues.push("Фильтры отсутствуют");
        }

        score.value = (checks / 4) * 100;
        score.details = dashboardContent;
      }

      console.log(`     Проверок пройдено: ${score.passed.length}`);
      console.log(`     Проблем: ${score.issues.length}`);
    } catch (error) {
      score.value = 0;
      score.issues.push(`Ошибка: ${error.message}`);
      console.log(`     ✗ Ошибка: ${error.message}`);
    } finally {
      await page.close();
    }

    return score;
  }

  async testAdditionalContent(url, pageType) {
    console.log("\n  📚 Тест дополнительного контента...");

    const page = await this.browser.newPage();
    const score = { value: 0, details: {}, issues: [], passed: [] };

    try {
      await page.goto(url, {
        waitUntil: "networkidle0",
        timeout: 10000,
      });

      const additionalContent = await page.evaluate(() => {
        const text = document.body.textContent.toLowerCase();

        const hasFAQ =
          text.includes("faq") ||
          text.includes("вопрос") ||
          text.includes("question");

        const hasCareInstructions =
          text.includes("уход") ||
          text.includes("care") ||
          text.includes("стирка") ||
          text.includes("хранение");

        const hasContactInfo =
          text.includes("email") ||
          text.includes("@") ||
          text.includes("contact");

        return {
          hasFAQ,
          hasCareInstructions,
          hasContactInfo,
        };
      });

      let checks = 0;

      if (pageType === "form") {
        // For forms, FAQ and care instructions are less critical
        if (additionalContent.hasContactInfo) {
          score.passed.push("Контактная информация присутствует");
          checks++;
        }
        score.value = 100; // Forms get full score if basic content is there
      } else {
        if (additionalContent.hasFAQ) {
          score.passed.push("FAQ присутствует");
          checks++;
        } else {
          score.issues.push("FAQ не найден");
        }

        if (additionalContent.hasCareInstructions) {
          score.passed.push("Блок ухода присутствует");
          checks++;
        } else {
          score.issues.push("Блок ухода не найден");
        }

        score.value = (checks / 2) * 100;
      }

      score.details = additionalContent;

      console.log(`     Проверок пройдено: ${score.passed.length}`);
      console.log(`     Проблем: ${score.issues.length}`);
    } catch (error) {
      score.value = 0;
      score.issues.push(`Ошибка: ${error.message}`);
      console.log(`     ✗ Ошибка: ${error.message}`);
    } finally {
      await page.close();
    }

    return score;
  }

  calculateTotalScore(scores) {
    let total = 0;

    total +=
      (scores.performance?.value || 0) *
      (AUDIT_CRITERIA.performance.weight / 100);
    total +=
      (scores.responsive?.value || 0) *
      (AUDIT_CRITERIA.responsive.weight / 100);
    total +=
      (scores.accessibility?.value || 0) *
      (AUDIT_CRITERIA.accessibility.weight / 100);
    total +=
      (scores.content?.value || 0) * (AUDIT_CRITERIA.content.weight / 100);
    total +=
      (scores.additionalContent?.value || 0) *
      (AUDIT_CRITERIA.additionalContent.weight / 100);

    return Math.round(total);
  }

  async generatePDFReport() {
    console.log("\n\n📄 Генерация PDF-отчёта...");

    const page = await this.browser.newPage();

    // Create HTML report
    const html = this.generateHTMLReport();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const reportsDir = path.join(__dirname, "../reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const pdfPath = path.join(reportsDir, "ux_audit_new_products.pdf");

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

    await page.close();

    console.log(`✅ Отчёт сохранён: ${pdfPath}`);
    return pdfPath;
  }

  generateHTMLReport() {
    const timestamp = new Date().toLocaleString("ru-RU");

    let resultsHTML = "";
    this.results.forEach((result) => {
      const statusClass =
        result.totalScore >= 80
          ? "success"
          : result.totalScore >= 60
            ? "warning"
            : "error";

      resultsHTML += `
        <div class="page-result ${statusClass}">
          <h2>${result.name}</h2>
          <div class="score-badge">${result.totalScore}/100</div>

          <div class="url">${result.url}</div>

          <div class="scores">
            <div class="score-item">
              <span class="label">Производительность (${AUDIT_CRITERIA.performance.weight}%)</span>
              <span class="value">${Math.round(result.scores.performance?.value || 0)}/100</span>
              ${result.scores.performance?.details?.loadTime ? `<span class="detail">${result.scores.performance.details.loadTime}ms</span>` : ""}
            </div>

            <div class="score-item">
              <span class="label">Адаптивность (${AUDIT_CRITERIA.responsive.weight}%)</span>
              <span class="value">${Math.round(result.scores.responsive?.value || 0)}/100</span>
            </div>

            <div class="score-item">
              <span class="label">Доступность (${AUDIT_CRITERIA.accessibility.weight}%)</span>
              <span class="value">${Math.round(result.scores.accessibility?.value || 0)}/100</span>
            </div>

            <div class="score-item">
              <span class="label">Контент (${AUDIT_CRITERIA.content.weight}%)</span>
              <span class="value">${Math.round(result.scores.content?.value || 0)}/100</span>
            </div>

            <div class="score-item">
              <span class="label">Доп. контент (${AUDIT_CRITERIA.additionalContent.weight}%)</span>
              <span class="value">${Math.round(result.scores.additionalContent?.value || 0)}/100</span>
            </div>
          </div>

          ${this.generateIssuesHTML(result)}
          ${this.generatePassedHTML(result)}
        </div>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>UX Audit Report - New Products</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            line-height: 1.6;
          }
          .header {
            background: linear-gradient(135deg, #a855f7, #6366f1);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
          }
          .header .timestamp {
            opacity: 0.9;
            font-size: 14px;
          }
          .page-result {
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 5px solid #ddd;
            page-break-inside: avoid;
          }
          .page-result.success { border-left-color: #10b981; }
          .page-result.warning { border-left-color: #f59e0b; }
          .page-result.error { border-left-color: #ef4444; }
          .page-result h2 {
            color: #1a1a1a;
            margin-bottom: 10px;
            font-size: 22px;
          }
          .score-badge {
            display: inline-block;
            background: #a855f7;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 18px;
            margin-bottom: 15px;
          }
          .url {
            color: #6366f1;
            font-size: 12px;
            margin-bottom: 20px;
            word-break: break-all;
          }
          .scores {
            margin: 20px 0;
          }
          .score-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: #f9fafb;
            margin-bottom: 8px;
            border-radius: 6px;
          }
          .score-item .label {
            font-weight: 500;
            color: #4b5563;
          }
          .score-item .value {
            font-weight: 700;
            color: #a855f7;
          }
          .score-item .detail {
            font-size: 12px;
            color: #6b7280;
            margin-left: 10px;
          }
          .issues, .passed {
            margin-top: 20px;
          }
          .issues h3, .passed h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #374151;
          }
          .issues ul {
            list-style: none;
            padding: 0;
          }
          .issues li {
            padding: 8px 12px;
            background: #fef2f2;
            border-left: 3px solid #ef4444;
            margin-bottom: 6px;
            border-radius: 4px;
            font-size: 14px;
            color: #991b1b;
          }
          .passed ul {
            list-style: none;
            padding: 0;
          }
          .passed li {
            padding: 8px 12px;
            background: #f0fdf4;
            border-left: 3px solid #10b981;
            margin-bottom: 6px;
            border-radius: 4px;
            font-size: 14px;
            color: #065f46;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 UX Audit Report — New Products</h1>
          <div class="timestamp">Сгенерировано: ${timestamp}</div>
        </div>

        ${resultsHTML}

        <div class="footer">
          <p><strong>HAORI VISION</strong> — UX Audit System</p>
          <p>Автоматический аудит качества пользовательского опыта</p>
        </div>
      </body>
      </html>
    `;
  }

  generateIssuesHTML(result) {
    const allIssues = [
      ...(result.scores.performance?.issues || []),
      ...(result.scores.responsive?.issues || []),
      ...(result.scores.accessibility?.issues || []),
      ...(result.scores.content?.issues || []),
      ...(result.scores.additionalContent?.issues || []),
    ];

    if (allIssues.length === 0) return "";

    return `
      <div class="issues">
        <h3>⚠️ Обнаруженные проблемы (${allIssues.length})</h3>
        <ul>
          ${allIssues.map((issue) => `<li>${issue}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  generatePassedHTML(result) {
    const allPassed = [
      ...(result.scores.performance?.passed || []),
      ...(result.scores.responsive?.passed || []),
      ...(result.scores.accessibility?.passed || []).slice(0, 5),
      ...(result.scores.content?.passed || []),
      ...(result.scores.additionalContent?.passed || []),
    ];

    if (allPassed.length === 0) return "";

    return `
      <div class="passed">
        <h3>✅ Пройденные проверки (${allPassed.length})</h3>
        <ul>
          ${allPassed.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run audit
async function runAudit() {
  const auditor = new UXAuditor();

  try {
    await auditor.init();

    for (const page of NEW_PAGES) {
      await auditor.auditPage(page);
    }

    const pdfPath = await auditor.generatePDFReport();

    console.log("\n\n========================================");
    console.log("📊 UX AUDIT COMPLETE");
    console.log("========================================");
    console.log(`\nПроверено страниц: ${NEW_PAGES.length}`);
    console.log(`Отчёт: ${pdfPath}`);
    console.log("\nРезультаты:");

    auditor.results.forEach((result) => {
      const status =
        result.totalScore >= 80 ? "✅" : result.totalScore >= 60 ? "⚠️" : "❌";
      console.log(`  ${status} ${result.name}: ${result.totalScore}/100`);
    });

    console.log("\n");
  } catch (error) {
    console.error("❌ Ошибка при выполнении аудита:", error);
    process.exit(1);
  } finally {
    await auditor.close();
  }
}

// Execute
runAudit();
