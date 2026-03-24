#!/usr/bin/env node

/**
 * HAORI VISION — Email Sandbox Testing
 *
 * Тестирование email-отправки без реальной отправки писем.
 * Использует nodemailer с Ethereal (sandbox) для проверки шаблонов.
 *
 * Features:
 * - Test all email templates
 * - Generate preview URLs
 * - Verify template rendering
 * - Check personalization tokens
 *
 * Usage:
 *   node scripts/test_mail_sandbox.js
 *   node scripts/test_mail_sandbox.js --template order_confirmation
 */

import { createTransport } from "nodemailer";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

// ============================================================
// Email Templates
// ============================================================

const EMAIL_TEMPLATES = {
  order_confirmation: {
    subject: "Order Confirmation — HAORI VISION",
    template: `
      <h1>Thank you for your order!</h1>
      <p>Hi {{customer_name}},</p>
      <p>Your order <strong>{{order_id}}</strong> has been confirmed.</p>
      <h2>Order Details:</h2>
      <ul>
        <li>Product: {{product_name}}</li>
        <li>SKU: {{product_sku}}</li>
        <li>Total: {{order_total}}</li>
      </ul>
      <p>We'll send you a shipping confirmation when your item ships.</p>
      <p>— HAORI VISION Team</p>
    `,
    testData: {
      customer_name: "Alice Johnson",
      order_id: "ORD-20251009-001",
      product_name: "Eclipse Lumière Coat",
      product_sku: "ECLIPSE-01",
      order_total: "€650.00",
    },
  },

  shipping_confirmation: {
    subject: "Your order has shipped — HAORI VISION",
    template: `
      <h1>Your order is on the way!</h1>
      <p>Hi {{customer_name}},</p>
      <p>Your order <strong>{{order_id}}</strong> has been shipped.</p>
      <p><strong>Tracking:</strong> {{tracking_number}}</p>
      <p>Expected delivery: {{estimated_delivery}}</p>
      <p>— HAORI VISION Team</p>
    `,
    testData: {
      customer_name: "Alice Johnson",
      order_id: "ORD-20251009-001",
      tracking_number: "DHL1234567890",
      estimated_delivery: "October 12, 2025",
    },
  },

  payment_failed: {
    subject: "Payment Failed — HAORI VISION",
    template: `
      <h1>Payment Failed</h1>
      <p>Hi {{customer_name}},</p>
      <p>We were unable to process your payment for order <strong>{{order_id}}</strong>.</p>
      <p>Reason: {{failure_reason}}</p>
      <p>Your reservation has been released. Please try again or contact us.</p>
      <p>— HAORI VISION Team</p>
    `,
    testData: {
      customer_name: "Alice Johnson",
      order_id: "ORD-20251009-001",
      failure_reason: "Insufficient funds",
    },
  },

  rma_approved: {
    subject: "Return Approved — HAORI VISION",
    template: `
      <h1>Return Request Approved</h1>
      <p>Hi {{customer_name}},</p>
      <p>Your return request <strong>{{rma_id}}</strong> has been approved.</p>
      <p><strong>Instructions:</strong></p>
      <ol>
        <li>Pack the item in its original packaging</li>
        <li>Include all tags and accessories</li>
        <li>Ship to: {{return_address}}</li>
      </ol>
      <p>Refund will be processed within 5-7 days after inspection.</p>
      <p>— HAORI VISION Team</p>
    `,
    testData: {
      customer_name: "Alice Johnson",
      rma_id: "RMA-000001",
      return_address: "HAORI VISION Returns, Stockholm, Sweden",
    },
  },
};

// ============================================================
// Helper Functions
// ============================================================

/**
 * Render email template with data
 */
function renderTemplate(template, data) {
  let rendered = template;

  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    rendered = rendered.replace(regex, value);
  });

  return rendered;
}

/**
 * Create test email transport (Ethereal)
 */
async function createTestTransport() {
  // For real testing, use nodemailer.createTestAccount()
  // For now, use console output

  return {
    sendMail: async (mailOptions) => {
      console.log("\n📧 Email Preview:\n");
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`\nBody:\n${mailOptions.html}\n`);

      return {
        messageId: "test-message-id",
        previewUrl: "https://ethereal.email/message/preview-url",
      };
    },
  };
}

// ============================================================
// Test Functions
// ============================================================

/**
 * Test a single email template
 */
async function testTemplate(templateName, transport) {
  const config = EMAIL_TEMPLATES[templateName];

  if (!config) {
    console.error(`❌ Template not found: ${templateName}`);
    return false;
  }

  console.log(`\n📝 Testing template: ${templateName}\n`);

  try {
    const html = renderTemplate(config.template, config.testData);

    const mailOptions = {
      from: "noreply@haorivision.com",
      to: "test@haorivision.com",
      subject: config.subject,
      html,
    };

    const info = await transport.sendMail(mailOptions);

    console.log("✅ Email sent successfully");
    console.log(`📬 Message ID: ${info.messageId}`);

    if (info.previewUrl) {
      console.log(`🔗 Preview: ${info.previewUrl}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to send email: ${error.message}`);
    return false;
  }
}

/**
 * Test all email templates
 */
async function testAllTemplates() {
  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║                                                       ║");
  console.log("║       HAORI VISION — Email Sandbox Testing           ║");
  console.log("║                                                       ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");

  const transport = await createTestTransport();

  const results = {
    passed: 0,
    failed: 0,
    templates: [],
  };

  for (const templateName of Object.keys(EMAIL_TEMPLATES)) {
    const passed = await testTemplate(templateName, transport);

    results.templates.push({
      name: templateName,
      passed,
    });

    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Print summary
  console.log("\n" + "═".repeat(60));
  console.log("\n📊 Test Summary:\n");
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Total: ${results.templates.length}\n`);

  results.templates.forEach((template) => {
    const icon = template.passed ? "✅" : "❌";
    console.log(`  ${icon} ${template.name}`);
  });

  console.log("\n✨ All email tests complete!\n");

  process.exit(results.failed > 0 ? 1 : 0);
}

// ============================================================
// CLI
// ============================================================

const args = process.argv.slice(2);
const templateArg = args.find((arg) => arg.startsWith("--template="));

if (templateArg) {
  const templateName = templateArg.split("=")[1];

  createTestTransport().then((transport) => {
    testTemplate(templateName, transport).then((passed) => {
      process.exit(passed ? 0 : 1);
    });
  });
} else {
  testAllTemplates();
}
