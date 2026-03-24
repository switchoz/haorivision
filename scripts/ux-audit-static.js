/**
 * 🔍 STATIC UX AUDIT SCRIPT
 *
 * Статический UX-анализ новых страниц:
 * - Анализ HTML/CSS/JS файлов
 * - Проверка адаптивности (media queries)
 * - Проверка ARIA labels
 * - Проверка контента
 * - Генерация PDF-отчёта
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Новые страницы для аудита
const NEW_PAGES = [
  {
    name: "Bespoke Form",
    path: "frontend/public/forms/bespoke.html",
    type: "form",
  },
  {
    name: "Admin Metrics Dashboard",
    path: "frontend/src/pages/admin/Metrics.jsx",
    cssPath: "frontend/src/pages/admin/Metrics.css",
    type: "admin",
  },
];

class StaticUXAuditor {
  constructor() {
    this.results = [];
    this.rootDir = path.join(__dirname, "..");
  }

  async auditPage(pageConfig) {
    console.log(`\n📄 Аудит: ${pageConfig.name}`);
    console.log(`   Файл: ${pageConfig.path}`);

    const result = {
      name: pageConfig.name,
      path: pageConfig.path,
      type: pageConfig.type,
      timestamp: new Date().toISOString(),
      scores: {},
      issues: [],
      passed: [],
      totalScore: 0,
    };

    try {
      const filePath = path.join(this.rootDir, pageConfig.path);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Файл не найден: ${filePath}`);
      }

      const content = fs.readFileSync(filePath, "utf-8");
      let cssContent = "";

      if (pageConfig.cssPath) {
        const cssPath = path.join(this.rootDir, pageConfig.cssPath);
        if (fs.existsSync(cssPath)) {
          cssContent = fs.readFileSync(cssPath, "utf-8");
        }
      }

      // 1. Performance (estimated based on file size)
      result.scores.performance = this.testPerformance(content, cssContent);

      // 2. Responsive Design
      result.scores.responsive = this.testResponsive(content, cssContent);

      // 3. Accessibility
      result.scores.accessibility = this.testAccessibility(content);

      // 4. Content
      result.scores.content = this.testContent(content, pageConfig.type);

      // 5. Additional Content
      result.scores.additionalContent = this.testAdditionalContent(
        content,
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

  testPerformance(content, cssContent) {
    console.log("\n  ⏱️  Тест производительности...");

    const score = { value: 0, details: {}, issues: [], passed: [] };

    const htmlSize = Buffer.byteLength(content, "utf8");
    const cssSize = cssContent ? Buffer.byteLength(cssContent, "utf8") : 0;
    const totalSize = htmlSize + cssSize;

    score.details.htmlSize = htmlSize;
    score.details.cssSize = cssSize;
    score.details.totalSize = totalSize;

    // Estimate load time (rough approximation: 1MB = 1 second on average connection)
    const estimatedLoadTime = (totalSize / 1024 / 1024) * 1000; // in ms

    if (estimatedLoadTime < 1000) {
      score.value = 100;
      score.passed.push(
        `Отличная производительность: ~${Math.round(estimatedLoadTime)}ms`,
      );
    } else if (estimatedLoadTime < 3000) {
      score.value = 80;
      score.passed.push(
        `Хорошая производительность: ~${Math.round(estimatedLoadTime)}ms`,
      );
    } else {
      score.value = 50;
      score.issues.push(
        `Большой размер файлов: ${Math.round(totalSize / 1024)}KB`,
      );
    }

    // Check for optimization opportunities
    if (content.includes("console.log")) {
      score.issues.push("Найдены console.log (следует удалить в продакшене)");
      score.value -= 5;
    }

    console.log(`     Размер HTML: ${Math.round(htmlSize / 1024)}KB`);
    console.log(`     Размер CSS: ${Math.round(cssSize / 1024)}KB`);
    console.log(`     Оценка загрузки: ~${Math.round(estimatedLoadTime)}ms`);

    return score;
  }

  testResponsive(content, cssContent) {
    console.log("\n  📱 Тест адаптивности...");

    const score = { value: 0, details: {}, issues: [], passed: [] };
    const allContent = content + "\n" + cssContent;

    // Check for viewport meta tag
    if (content.includes("viewport")) {
      score.passed.push("Viewport meta tag присутствует");
      score.value += 25;
    } else {
      score.issues.push("Отсутствует viewport meta tag");
    }

    // Check for media queries
    const mediaQueryMatches = allContent.match(/@media\s*\([^)]+\)/g) || [];
    const mobileQueries = allContent.match(/@media.*max-width.*768px/gi) || [];

    if (mediaQueryMatches.length >= 3) {
      score.passed.push(`Найдено ${mediaQueryMatches.length} media queries`);
      score.value += 40;
    } else if (mediaQueryMatches.length > 0) {
      score.passed.push(`Найдено ${mediaQueryMatches.length} media queries`);
      score.value += 20;
      score.issues.push("Недостаточно media queries для полной адаптивности");
    } else {
      score.issues.push("Не найдены media queries");
    }

    // Check for mobile-first patterns
    if (mobileQueries.length > 0) {
      score.passed.push("Есть стили для мобильных устройств");
      score.value += 20;
    }

    // Check for responsive units
    const hasFlexbox =
      allContent.includes("display: flex") ||
      allContent.includes("display:flex");
    const hasGrid =
      allContent.includes("display: grid") ||
      allContent.includes("display:grid");
    const hasRelativeUnits = allContent.match(/\d+(rem|em|%|vw|vh)/g) || [];

    if (hasFlexbox || hasGrid) {
      score.passed.push("Используются современные layout методы (flex/grid)");
      score.value += 15;
    }

    if (hasRelativeUnits.length > 10) {
      score.passed.push("Используются относительные единицы измерения");
    } else {
      score.issues.push(
        "Мало относительных единиц, преобладают фиксированные размеры",
      );
    }

    score.value = Math.min(100, score.value);

    console.log(`     Media queries: ${mediaQueryMatches.length}`);
    console.log(
      `     Мобильные стили: ${mobileQueries.length > 0 ? "Да" : "Нет"}`,
    );
    console.log(`     Flexbox/Grid: ${hasFlexbox || hasGrid ? "Да" : "Нет"}`);

    return score;
  }

  testAccessibility(content) {
    console.log("\n  ♿ Тест доступности...");

    const score = { value: 0, details: {}, issues: [], passed: [] };
    let totalChecks = 0;
    let passedChecks = 0;

    // Check buttons
    const buttons = content.match(/<button[^>]*>/gi) || [];
    const buttonsWithAria = (content.match(/<button[^>]*aria-label/gi) || [])
      .length;
    const buttonsWithText = buttons.filter((btn) => {
      const match = content.match(new RegExp(btn + "[^<]*<\\/button>", "i"));
      return match && match[0].replace(/<[^>]*>/g, "").trim().length > 0;
    }).length;

    totalChecks += buttons.length;
    passedChecks += Math.max(buttonsWithAria, buttonsWithText);

    if (buttons.length > 0) {
      score.passed.push(
        `Кнопок с доступным текстом: ${Math.max(buttonsWithAria, buttonsWithText)}/${buttons.length}`,
      );
      if (
        buttonsWithAria < buttons.length &&
        buttonsWithText < buttons.length
      ) {
        score.issues.push(
          `${buttons.length - Math.max(buttonsWithAria, buttonsWithText)} кнопок без aria-label или текста`,
        );
      }
    }

    // Check links
    const links = content.match(/<a[^>]*>/gi) || [];
    const linksWithAria = (content.match(/<a[^>]*aria-label/gi) || []).length;
    const linksWithText = links.filter((link) => {
      const match = content.match(new RegExp(link + "[^<]*<\\/a>", "i"));
      return match && match[0].replace(/<[^>]*>/g, "").trim().length > 0;
    }).length;

    totalChecks += links.length;
    passedChecks += Math.max(linksWithAria, linksWithText);

    if (links.length > 0) {
      score.passed.push(
        `Ссылок с доступным текстом: ${Math.max(linksWithAria, linksWithText)}/${links.length}`,
      );
    }

    // Check inputs
    const inputs = content.match(/<input[^>]*>/gi) || [];
    const inputsWithLabel = inputs.filter((input) => {
      const idMatch = input.match(/id=["']([^"']+)["']/);
      if (idMatch) {
        return content.includes(`for="${idMatch[1]}"`);
      }
      return false;
    }).length;
    const inputsWithAria = (content.match(/<input[^>]*aria-label/gi) || [])
      .length;

    totalChecks += inputs.length;
    passedChecks += Math.max(inputsWithLabel, inputsWithAria);

    if (inputs.length > 0) {
      score.passed.push(
        `Полей ввода с label: ${Math.max(inputsWithLabel, inputsWithAria)}/${inputs.length}`,
      );
      if (inputsWithLabel < inputs.length && inputsWithAria < inputs.length) {
        score.issues.push(
          `${inputs.length - Math.max(inputsWithLabel, inputsWithAria)} полей без label`,
        );
      }
    }

    // Check alt tags on images
    const images = content.match(/<img[^>]*>/gi) || [];
    const imagesWithAlt = (content.match(/<img[^>]*alt=["'][^"']*["']/gi) || [])
      .length;

    totalChecks += images.length;
    passedChecks += imagesWithAlt;

    if (images.length > 0) {
      if (imagesWithAlt === images.length) {
        score.passed.push(`Все изображения имеют alt (${images.length})`);
      } else {
        score.issues.push(
          `${images.length - imagesWithAlt} изображений без alt`,
        );
      }
    }

    // Check semantic HTML
    const hasSemanticTags =
      /(<header|<nav|<main|<section|<article|<aside|<footer)/i.test(content);
    if (hasSemanticTags) {
      score.passed.push("Используются семантические HTML5 теги");
      passedChecks += 2;
      totalChecks += 2;
    } else {
      score.issues.push("Не используются семантические HTML5 теги");
      totalChecks += 2;
    }

    score.value =
      totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

    score.details = {
      buttons: buttons.length,
      links: links.length,
      inputs: inputs.length,
      images: images.length,
      totalChecks,
      passedChecks,
    };

    console.log(
      `     Кнопок: ${buttons.length}, Ссылок: ${links.length}, Полей: ${inputs.length}`,
    );
    console.log(`     Проверок пройдено: ${passedChecks}/${totalChecks}`);

    return score;
  }

  testContent(content, pageType) {
    console.log("\n  📝 Тест контента...");

    const score = { value: 0, details: {}, issues: [], passed: [] };
    let checks = 0;
    let passed = 0;

    if (pageType === "form") {
      // Check for price
      if (
        content.includes("€") ||
        content.includes("3000") ||
        content.includes("3,000")
      ) {
        score.passed.push("Цена отображается");
        passed++;
      } else {
        score.issues.push("Цена не найдена");
      }
      checks++;

      // Check for description length
      const textContent = content.replace(/<[^>]*>/g, "");
      if (textContent.length > 500) {
        score.passed.push(
          `Описание присутствует (${Math.round(textContent.length / 100) * 100}+ символов)`,
        );
        passed++;
      } else {
        score.issues.push("Недостаточно описания");
      }
      checks++;

      // Check for required fields
      if (content.includes("name") && content.includes("email")) {
        score.passed.push("Обязательные поля присутствуют (имя, email)");
        passed++;
      } else {
        score.issues.push("Отсутствуют обязательные поля");
      }
      checks++;

      // Check for submit button
      if (content.includes('type="submit"') || content.includes("submit")) {
        score.passed.push("Кнопка отправки присутствует");
        passed++;
      } else {
        score.issues.push("Нет кнопки отправки");
      }
      checks++;
    } else if (pageType === "admin") {
      // Check for metrics display
      if (content.includes("metrics") || content.includes("Metrics")) {
        score.passed.push("Метрики присутствуют в коде");
        passed++;
      } else {
        score.issues.push("Метрики не найдены");
      }
      checks++;

      // Check for table
      if (content.includes("<table") || content.includes("table")) {
        score.passed.push("Таблица присутствует");
        passed++;
      } else {
        score.issues.push("Таблица не найдена");
      }
      checks++;

      // Check for charts
      if (content.includes("chart") || content.includes("Chart")) {
        score.passed.push("График/диаграмма присутствует");
        passed++;
      } else {
        score.issues.push("График не найден");
      }
      checks++;

      // Check for filters
      if (content.includes("filter") || content.includes("date")) {
        score.passed.push("Фильтры присутствуют");
        passed++;
      } else {
        score.issues.push("Фильтры не найдены");
      }
      checks++;
    }

    score.value = checks > 0 ? Math.round((passed / checks) * 100) : 0;

    console.log(`     Проверок пройдено: ${passed}/${checks}`);

    return score;
  }

  testAdditionalContent(content, pageType) {
    console.log("\n  📚 Тест дополнительного контента...");

    const score = { value: 0, details: {}, issues: [], passed: [] };
    const lowerContent = content.toLowerCase();

    if (pageType === "form") {
      // Forms get basic scoring
      if (lowerContent.includes("email") || lowerContent.includes("@")) {
        score.passed.push("Контактная информация присутствует");
      }
      score.value = 100;
    } else {
      let checks = 0;
      let passed = 0;

      // Check for FAQ
      if (
        lowerContent.includes("faq") ||
        lowerContent.includes("вопрос") ||
        lowerContent.includes("question")
      ) {
        score.passed.push("FAQ упоминается");
        passed++;
      } else {
        score.issues.push("FAQ не найден");
      }
      checks++;

      // Check for care instructions
      if (
        lowerContent.includes("уход") ||
        lowerContent.includes("care") ||
        lowerContent.includes("стирка")
      ) {
        score.passed.push("Блок ухода упоминается");
        passed++;
      } else {
        score.issues.push("Блок ухода не найден");
      }
      checks++;

      score.value = checks > 0 ? Math.round((passed / checks) * 100) : 100;
    }

    console.log(`     Проверок пройдено: ${score.passed.length}`);

    return score;
  }

  calculateTotalScore(scores) {
    const weights = {
      performance: 0.3,
      responsive: 0.25,
      accessibility: 0.2,
      content: 0.15,
      additionalContent: 0.1,
    };

    let total = 0;

    total += (scores.performance?.value || 0) * weights.performance;
    total += (scores.responsive?.value || 0) * weights.responsive;
    total += (scores.accessibility?.value || 0) * weights.accessibility;
    total += (scores.content?.value || 0) * weights.content;
    total += (scores.additionalContent?.value || 0) * weights.additionalContent;

    return Math.round(total);
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
          <div class="path">${result.path}</div>

          <div class="scores">
            <div class="score-item">
              <span class="label">Производительность (30%)</span>
              <span class="value">${Math.round(result.scores.performance?.value || 0)}/100</span>
            </div>
            <div class="score-item">
              <span class="label">Адаптивность (25%)</span>
              <span class="value">${Math.round(result.scores.responsive?.value || 0)}/100</span>
            </div>
            <div class="score-item">
              <span class="label">Доступность (20%)</span>
              <span class="value">${Math.round(result.scores.accessibility?.value || 0)}/100</span>
            </div>
            <div class="score-item">
              <span class="label">Контент (15%)</span>
              <span class="value">${Math.round(result.scores.content?.value || 0)}/100</span>
            </div>
            <div class="score-item">
              <span class="label">Доп. контент (10%)</span>
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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; line-height: 1.6; }
          .header { background: linear-gradient(135deg, #a855f7, #6366f1); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
          .header h1 { font-size: 28px; margin-bottom: 10px; }
          .header .timestamp { opacity: 0.9; font-size: 14px; }
          .page-result { background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid #ddd; page-break-inside: avoid; }
          .page-result.success { border-left-color: #10b981; }
          .page-result.warning { border-left-color: #f59e0b; }
          .page-result.error { border-left-color: #ef4444; }
          .page-result h2 { color: #1a1a1a; margin-bottom: 10px; font-size: 22px; }
          .score-badge { display: inline-block; background: #a855f7; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 18px; margin-bottom: 15px; }
          .path { color: #6366f1; font-size: 12px; margin-bottom: 20px; font-family: monospace; }
          .scores { margin: 20px 0; }
          .score-item { display: flex; justify-content: space-between; padding: 12px; background: #f9fafb; margin-bottom: 8px; border-radius: 6px; }
          .score-item .label { font-weight: 500; color: #4b5563; }
          .score-item .value { font-weight: 700; color: #a855f7; }
          .issues, .passed { margin-top: 20px; }
          .issues h3, .passed h3 { font-size: 16px; margin-bottom: 10px; color: #374151; }
          .issues ul, .passed ul { list-style: none; padding: 0; }
          .issues li { padding: 8px 12px; background: #fef2f2; border-left: 3px solid #ef4444; margin-bottom: 6px; border-radius: 4px; font-size: 14px; color: #991b1b; }
          .passed li { padding: 8px 12px; background: #f0fdf4; border-left: 3px solid #10b981; margin-bottom: 6px; border-radius: 4px; font-size: 14px; color: #065f46; }
          .footer { text-align: center; color: #6b7280; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 UX Audit Report — New Products</h1>
          <div class="timestamp">Сгенерировано: ${timestamp}</div>
          <div style="margin-top: 10px; font-size: 13px;">Статический анализ кода (без запуска сервера)</div>
        </div>

        ${resultsHTML}

        <div class="footer">
          <p><strong>HAORI VISION</strong> — UX Audit System</p>
          <p>Автоматический статический анализ качества UX</p>
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
      ...(result.scores.accessibility?.passed || []),
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

  async generateReport() {
    console.log("\n\n📄 Генерация HTML-отчёта...");

    const html = this.generateHTMLReport();

    const reportsDir = path.join(this.rootDir, "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const htmlPath = path.join(reportsDir, "ux_audit_new_products.html");
    fs.writeFileSync(htmlPath, html, "utf-8");

    console.log(`✅ HTML-отчёт сохранён: ${htmlPath}`);
    console.log(
      '\n💡 Чтобы сгенерировать PDF, откройте HTML в браузере и используйте "Печать -> Сохранить как PDF"',
    );

    return htmlPath;
  }
}

// Run audit
async function runAudit() {
  const auditor = new StaticUXAuditor();

  console.log("🚀 Запуск статического UX-аудита...\n");

  try {
    for (const page of NEW_PAGES) {
      await auditor.auditPage(page);
    }

    const reportPath = await auditor.generateReport();

    console.log("\n\n========================================");
    console.log("📊 UX AUDIT COMPLETE");
    console.log("========================================");
    console.log(`\nПроверено страниц: ${NEW_PAGES.length}`);
    console.log(`Отчёт: ${reportPath}`);
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
  }
}

// Execute
runAudit();
