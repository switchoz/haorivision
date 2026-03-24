// Читает playwright-report/results.xml и формирует краткую сводку
import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";

const junitPath = path.join(process.cwd(), "playwright-report", "results.xml");
let summary = `### ✅ E2E Summary\n\n_No results found._\n`;

if (fs.existsSync(junitPath)) {
  const xml = fs.readFileSync(junitPath, "utf-8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const data = parser.parse(xml);
  const suite = data.testsuites?.testsuite || data.testsuite;
  const totals = Array.isArray(suite)
    ? suite.reduce(
        (acc, s) => {
          acc.tests += Number(s.tests || 0);
          acc.failures += Number(s.failures || 0);
          acc.errors += Number(s.errors || 0);
          acc.skipped += Number(s.skipped || 0);
          acc.time += Number(s.time || 0);
          return acc;
        },
        { tests: 0, failures: 0, errors: 0, skipped: 0, time: 0 },
      )
    : {
        tests: Number(suite.tests || 0),
        failures: Number(suite.failures || 0),
        errors: Number(suite.errors || 0),
        skipped: Number(suite.skipped || 0),
        time: Number(suite.time || 0),
      };

  const passed =
    totals.tests - totals.failures - totals.errors - totals.skipped;
  const status = totals.failures + totals.errors > 0 ? "❌" : "✅";

  summary = `### ${status} E2E Test Results

| Metric | Count |
|--------|-------|
| **Total** | ${totals.tests} |
| **Passed** | ${passed} ✅ |
| **Failed** | ${totals.failures} ❌ |
| **Errors** | ${totals.errors} ⚠️ |
| **Skipped** | ${totals.skipped} ⏭️ |
| **Duration** | ${totals.time.toFixed(2)}s ⏱️ |

`;

  if (totals.failures + totals.errors > 0) {
    summary += `\n⚠️ **Tests failed!** Check the full report for details.\n`;
  } else {
    summary += `\n✅ **All tests passed!**\n`;
  }
}

console.log(summary);

// Запись в файл ci-summary.md для локального использования и CI
const ciSummaryPath = path.join(process.cwd(), "ci-summary.md");
fs.writeFileSync(ciSummaryPath, summary);

// Опционально: запись в файл для GitHub Actions
const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) {
  fs.appendFileSync(summaryPath, summary + "\n");
}
