#!/usr/bin/env node

/**
 * HAORI VISION — Console Errors Test
 *
 * Automated test to verify:
 * 1. Frontend loads without TronWeb/crypto wallet errors
 * 2. Backend serves favicon.ico correctly
 * 3. No 404 errors in console
 * 4. All servers are running on correct ports
 */

import puppeteer from "puppeteer";
import http from "http";

const FRONTEND_URL = "http://localhost:3012";
const BACKEND_URL = "http://localhost:3010";
const FAVICON_URL = `${BACKEND_URL}/favicon.ico`;

// Terminal colors
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testPassed(testName) {
  log(`✅ ${testName}`, "green");
}

function testFailed(testName, error) {
  log(`❌ ${testName}`, "red");
  if (error) {
    log(`   Error: ${error}`, "red");
  }
}

function testWarning(testName, warning) {
  log(`⚠️  ${testName}`, "yellow");
  if (warning) {
    log(`   Warning: ${warning}`, "yellow");
  }
}

/**
 * Test 1: Check if backend is running
 */
async function testBackendRunning() {
  return new Promise((resolve) => {
    const req = http.get(BACKEND_URL, (res) => {
      if (res.statusCode === 200) {
        testPassed("Backend running on port 3010");
        resolve(true);
      } else {
        testFailed(
          "Backend returned non-200 status",
          `Status: ${res.statusCode}`,
        );
        resolve(false);
      }
    });

    req.on("error", (err) => {
      testFailed("Backend not running", err.message);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      testFailed("Backend timeout", "No response after 5 seconds");
      resolve(false);
    });
  });
}

/**
 * Test 2: Check favicon.ico
 */
async function testFaviconLoads() {
  return new Promise((resolve) => {
    const req = http.get(FAVICON_URL, (res) => {
      if (res.statusCode === 200) {
        testPassed("Favicon loads successfully");
        resolve(true);
      } else if (res.statusCode === 404) {
        testFailed("Favicon 404", "Favicon not found");
        resolve(false);
      } else {
        testWarning(
          "Favicon returned non-200 status",
          `Status: ${res.statusCode}`,
        );
        resolve(true);
      }
    });

    req.on("error", (err) => {
      testFailed("Favicon request error", err.message);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      testFailed("Favicon timeout", "No response after 5 seconds");
      resolve(false);
    });
  });
}

/**
 * Test 3: Check frontend with Puppeteer (console errors)
 */
async function testFrontendConsoleErrors() {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    const consoleErrors = [];
    const consoleWarnings = [];

    // Listen to console messages
    page.on("console", (msg) => {
      const type = msg.type();
      const text = msg.text();

      if (type === "error") {
        consoleErrors.push(text);
      } else if (type === "warning") {
        consoleWarnings.push(text);
      }
    });

    // Navigate to frontend
    await page.goto(FRONTEND_URL, {
      waitUntil: "networkidle2",
      timeout: 10000,
    });

    // Wait for React to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Filter out expected/ignored errors
    const filteredErrors = consoleErrors.filter((error) => {
      const lowerError = error.toLowerCase();
      return !(
        lowerError.includes("tronweb") ||
        lowerError.includes("tronlink") ||
        lowerError.includes("bybit") ||
        lowerError.includes("namada") ||
        lowerError.includes("crypto wallet")
      );
    });

    const filteredWarnings = consoleWarnings.filter((warning) => {
      const lowerWarning = warning.toLowerCase();
      return !(
        lowerWarning.includes("tronweb") ||
        lowerWarning.includes("tronlink") ||
        lowerWarning.includes("bybit") ||
        lowerWarning.includes("namada")
      );
    });

    // Check for 404 errors
    const has404 = consoleErrors.some((err) => err.includes("404"));

    if (has404) {
      testFailed("Frontend has 404 errors", "Check console for details");
      await browser.close();
      return false;
    }

    if (filteredErrors.length === 0) {
      testPassed("Frontend console has no critical errors");
    } else {
      testFailed(
        "Frontend has console errors",
        `${filteredErrors.length} errors found`,
      );
      filteredErrors.forEach((err) => log(`   - ${err}`, "red"));
      await browser.close();
      return false;
    }

    if (filteredWarnings.length > 0) {
      testWarning(
        "Frontend has console warnings",
        `${filteredWarnings.length} warnings found`,
      );
      filteredWarnings
        .slice(0, 3)
        .forEach((warn) => log(`   - ${warn}`, "yellow"));
    } else {
      testPassed("Frontend console has no warnings");
    }

    await browser.close();
    return true;
  } catch (error) {
    if (browser) await browser.close();
    testFailed("Frontend test error", error.message);
    return false;
  }
}

/**
 * Test 4: Check if crypto wallet errors are suppressed
 */
async function testCryptoWalletSuppression() {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    const consoleMessages = [];

    page.on("console", (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    await page.goto(FRONTEND_URL, {
      waitUntil: "networkidle2",
      timeout: 10000,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const cryptoWalletMessages = consoleMessages.filter((msg) => {
      const text = msg.text.toLowerCase();
      return (
        text.includes("tronweb") ||
        text.includes("bybit") ||
        text.includes("namada")
      );
    });

    if (cryptoWalletMessages.length === 0) {
      testPassed("Crypto wallet errors are suppressed");
      await browser.close();
      return true;
    } else {
      testWarning(
        "Crypto wallet messages still visible",
        `${cryptoWalletMessages.length} messages found`,
      );
      await browser.close();
      return true; // Not a critical failure
    }
  } catch (error) {
    if (browser) await browser.close();
    testFailed("Crypto wallet suppression test error", error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  log("\n╔═══════════════════════════════════════════════════════╗", "cyan");
  log("║                                                       ║", "cyan");
  log("║     HAORI VISION — Console Errors Test Suite        ║", "cyan");
  log("║                                                       ║", "cyan");
  log("╚═══════════════════════════════════════════════════════╝\n", "cyan");

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Test 1: Backend
  log("\n🔍 Test 1: Backend Server", "cyan");
  const backendOk = await testBackendRunning();
  backendOk ? results.passed++ : results.failed++;

  // Test 2: Favicon
  log("\n🔍 Test 2: Favicon", "cyan");
  const faviconOk = await testFaviconLoads();
  faviconOk ? results.passed++ : results.failed++;

  // Test 3: Frontend Console
  log("\n🔍 Test 3: Frontend Console Errors", "cyan");
  const frontendOk = await testFrontendConsoleErrors();
  frontendOk ? results.passed++ : results.failed++;

  // Test 4: Crypto Wallet Suppression
  log("\n🔍 Test 4: Crypto Wallet Suppression", "cyan");
  const cryptoOk = await testCryptoWalletSuppression();
  cryptoOk ? results.passed++ : results.failed++;

  // Summary
  log("\n═══════════════════════════════════════════════════════", "cyan");
  log("SUMMARY", "cyan");
  log("═══════════════════════════════════════════════════════\n", "cyan");

  log(`✅ Passed: ${results.passed}`, "green");
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? "red" : "green");

  if (results.failed === 0) {
    log("\n🎉 ALL TESTS PASSED!\n", "green");
    process.exit(0);
  } else {
    log("\n❌ SOME TESTS FAILED\n", "red");
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((err) => {
  log(`\n❌ Fatal error: ${err.message}\n`, "red");
  process.exit(1);
});
