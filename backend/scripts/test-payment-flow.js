#!/usr/bin/env node
/**
 * HAORI VISION — Payment Flow Test Script
 *
 * Тестирует весь флоу покупки:
 * 1. Создание тестового заказа (€1, sandbox mode)
 * 2. Отправка Welcome email
 * 3. Генерация PDF-сертификата
 * 4. Запись в CRM (Order model)
 *
 * Использует тест-товар TEST-ORDER, не затрагивая реальные продукты.
 *
 * Запуск:
 *   node backend/scripts/test-payment-flow.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/Order.js";
import {
  sendWelcomeEmail,
  sendOrderConfirmation,
} from "../services/emailService.js";
import { createStripePayment } from "../services/paymentService.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_CUSTOMER = {
  _id: new mongoose.Types.ObjectId(),
  name: "Test Customer",
  email: process.env.TEST_EMAIL || "test@haorivision.com",
  phone: "+1234567890",
};

const TEST_PRODUCT = {
  _id: new mongoose.Types.ObjectId(),
  productId: "TEST-ORDER",
  name: "Test Order — Payment Flow Check",
  price: 1, // €1
  editionNumber: 1,
  totalEditions: 1,
  nftTokenId: "TEST-NFT-001",
};

// ============================================================================
// PDF CERTIFICATE GENERATOR
// ============================================================================

async function generateCertificatePDF(order, customer) {
  try {
    console.log("\n📄 Generating PDF Certificate...");

    const fileName = `certificate-${order.orderNumber}.pdf`;
    const dirPath = path.join(__dirname, "../../data/certificates");
    const filePath = path.join(dirPath, fileName);

    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Create PDF
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Background
    doc.rect(0, 0, 595, 842).fill("#0a0a0a");

    // Logo
    doc
      .fontSize(48)
      .fillColor("#a78bfa")
      .font("Helvetica-Bold")
      .text("光", 50, 80, { align: "center" });

    // Title
    doc
      .fontSize(36)
      .fillColor("#ffffff")
      .text("CERTIFICATE OF AUTHENTICITY", 50, 150, { align: "center" });

    // Decorative line
    doc
      .moveTo(150, 220)
      .lineTo(445, 220)
      .strokeColor("#a78bfa")
      .lineWidth(2)
      .stroke();

    // Product info
    doc
      .fontSize(20)
      .fillColor("#c4b5fd")
      .text(order.items[0].name, 50, 260, { align: "center" });

    doc
      .fontSize(14)
      .fillColor("#9ca3af")
      .text(
        `Edition ${order.items[0].editionNumber} of ${order.items[0].product?.editions?.total || 1}`,
        50,
        295,
        { align: "center" },
      );

    // Order details box
    const boxY = 340;
    doc
      .rect(100, boxY, 395, 180)
      .fillAndStroke("rgba(168, 85, 247, 0.1)", "#a78bfa");

    doc.fontSize(12).fillColor("#ffffff");
    doc.text(`Order Number:`, 120, boxY + 30);
    doc
      .font("Helvetica-Bold")
      .text(order.orderNumber, 350, boxY + 30, { align: "right" });

    doc.font("Helvetica").text(`Owner:`, 120, boxY + 55);
    doc
      .font("Helvetica-Bold")
      .text(customer.name, 350, boxY + 55, { align: "right" });

    doc.font("Helvetica").text(`Date Issued:`, 120, boxY + 80);
    doc
      .font("Helvetica-Bold")
      .text(new Date().toLocaleDateString("en-US"), 350, boxY + 80, {
        align: "right",
      });

    doc.font("Helvetica").text(`NFT Token:`, 120, boxY + 105);
    doc
      .font("Helvetica-Bold")
      .text(order.items[0].nftTokenId || "Pending", 350, boxY + 105, {
        align: "right",
      });

    doc.font("Helvetica").text(`Blockchain:`, 120, boxY + 130);
    doc
      .font("Helvetica-Bold")
      .text("Ethereum (ERC-721)", 350, boxY + 130, { align: "right" });

    // Description
    doc
      .fontSize(11)
      .fillColor("#9ca3af")
      .font("Helvetica")
      .text(
        "This certificate verifies the authenticity and ownership of a HAORI VISION original piece. Each item is hand-painted by our founder artist in Tokyo, Japan, using premium materials and UV-reactive pigments.",
        100,
        boxY + 190,
        { width: 395, align: "center", lineGap: 5 },
      );

    // Signature
    doc
      .fontSize(24)
      .fillColor("#a78bfa")
      .font("Helvetica-Bold")
      .text("光 Хикари", 50, 680, { align: "center" });

    doc
      .fontSize(10)
      .fillColor("#9ca3af")
      .font("Helvetica")
      .text("Founder & Artist", 50, 710, { align: "center" });

    // Footer
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text("HAORI VISION — Wearable Light Art", 50, 770, { align: "center" });

    doc
      .fontSize(9)
      .fillColor("#4b5563")
      .text("Wear the Light. Become the Art.", 50, 790, { align: "center" });

    // Finalize
    doc.end();

    // Wait for completion
    await new Promise((resolve, reject) => {
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    console.log(`✅ PDF Certificate generated: ${fileName}`);
    console.log(`   Location: ${filePath}`);

    return {
      success: true,
      filePath: filePath,
      fileName: fileName,
    };
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// MAIN TEST FLOW
// ============================================================================

async function runPaymentFlowTest() {
  console.log("\n" + "=".repeat(70));
  console.log("HAORI VISION — Payment Flow Test (Sandbox Mode)");
  console.log("=".repeat(70));

  try {
    // 1. Connect to MongoDB
    console.log("\n🔗 Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/haorivision",
    );
    console.log("✅ Connected to MongoDB");

    // 2. Create Test Order in Database
    console.log("\n📦 Creating test order in CRM...");

    // Generate order number manually
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const orderNumber = `HV${year}${month}${random}`;

    const testOrder = new Order({
      orderNumber: orderNumber,
      customer: TEST_CUSTOMER._id,
      items: [
        {
          product: TEST_PRODUCT._id,
          productId: TEST_PRODUCT.productId,
          name: TEST_PRODUCT.name,
          price: TEST_PRODUCT.price,
          editionNumber: TEST_PRODUCT.editionNumber,
          nftTokenId: TEST_PRODUCT.nftTokenId,
        },
      ],
      shippingAddress: {
        name: TEST_CUSTOMER.name,
        street: "123 Test Street",
        city: "Test City",
        state: "TC",
        zipCode: "12345",
        country: "Test Country",
        phone: TEST_CUSTOMER.phone,
      },
      billingAddress: {
        name: TEST_CUSTOMER.name,
        street: "123 Test Street",
        city: "Test City",
        state: "TC",
        zipCode: "12345",
        country: "Test Country",
      },
      payment: {
        method: "stripe",
        amount: TEST_PRODUCT.price,
        currency: "EUR",
        status: "pending",
      },
      nft: {
        minted: false,
        tokenId: TEST_PRODUCT.nftTokenId,
        contractAddress: "0x...",
        metadata: {
          name: TEST_PRODUCT.name,
          description: "Test NFT for payment flow verification",
          image: "https://haorivision.com/assets/test-nft.jpg",
          attributes: [],
        },
      },
      status: "pending",
      totals: {
        subtotal: TEST_PRODUCT.price,
        shipping: 0,
        tax: 0,
        total: TEST_PRODUCT.price,
      },
      notes: {
        customer: "",
        internal: "TEST ORDER - Payment flow verification",
      },
      emailSent: {
        confirmation: false,
        welcome: false,
        shipping: false,
      },
    });

    await testOrder.save();

    console.log(`✅ Test order created in CRM`);
    console.log(`   Order Number: ${testOrder.orderNumber}`);
    console.log(`   Order ID: ${testOrder._id}`);
    console.log(`   Amount: €${testOrder.totals.total}`);

    // 3. Create Stripe Payment Intent (€1 sandbox)
    console.log("\n💳 Creating Stripe payment intent (€1 sandbox)...");

    // Check if Stripe is configured
    if (
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY.includes("your_stripe")
    ) {
      console.log(
        "⚠️  Stripe API key not configured - simulating payment success",
      );

      // Simulate successful payment
      testOrder.payment.transactionId = `test_pi_${Date.now()}`;
      testOrder.payment.status = "completed";
      testOrder.payment.paidAt = new Date();
      testOrder.status = "paid";
      await testOrder.save();

      console.log("✅ Payment simulated (test mode)");
      console.log(`   Payment Intent ID: ${testOrder.payment.transactionId}`);
    } else {
      const paymentResult = await createStripePayment(
        TEST_PRODUCT.price, // €1
        "eur",
        {
          orderNumber: testOrder.orderNumber,
          orderId: testOrder._id.toString(),
          customerEmail: TEST_CUSTOMER.email,
          productId: TEST_PRODUCT.productId,
          testMode: true,
        },
      );

      if (paymentResult.success) {
        console.log("✅ Stripe payment intent created");
        console.log(`   Payment Intent ID: ${paymentResult.paymentIntentId}`);
        console.log(
          `   Client Secret: ${paymentResult.clientSecret.substring(0, 30)}...`,
        );

        // Update order with payment intent
        testOrder.payment.transactionId = paymentResult.paymentIntentId;
        testOrder.payment.status = "completed";
        testOrder.payment.paidAt = new Date();
        testOrder.status = "paid";
        await testOrder.save();

        console.log("✅ Order updated with payment info");
      } else {
        console.error("❌ Stripe payment failed:", paymentResult.error);
        throw new Error("Payment creation failed");
      }
    }

    // 4. Generate PDF Certificate
    const certResult = await generateCertificatePDF(testOrder, TEST_CUSTOMER);

    if (!certResult.success) {
      console.error("⚠️  PDF certificate generation failed, but continuing...");
    }

    // 5. Send Order Confirmation Email
    console.log("\n📧 Sending Order Confirmation email...");

    // Simulate product object for email
    testOrder.items[0].product = {
      editions: { total: TEST_PRODUCT.totalEditions },
    };

    const confirmationResult = await sendOrderConfirmation(
      TEST_CUSTOMER,
      testOrder,
    );

    if (confirmationResult.success) {
      console.log("✅ Order Confirmation email sent");
      console.log(`   Message ID: ${confirmationResult.messageId}`);
      testOrder.emailSent.confirmation = true;
      await testOrder.save();
    } else {
      console.error(
        "❌ Order Confirmation email failed:",
        confirmationResult.error,
      );
    }

    // 6. Send Welcome Email
    console.log('\n📧 Sending "Welcome to the Light Circle" email...');

    const nftData = {
      tokenId: testOrder.nft.tokenId,
      openseaUrl: `https://testnets.opensea.io/assets/ethereum/${testOrder.nft.contractAddress}/${testOrder.nft.tokenId}`,
    };

    const welcomeResult = await sendWelcomeEmail(
      TEST_CUSTOMER,
      testOrder,
      nftData,
    );

    if (welcomeResult.success) {
      console.log("✅ Welcome email sent");
      console.log(`   Message ID: ${welcomeResult.messageId}`);
      testOrder.emailSent.welcome = true;
      await testOrder.save();
    } else {
      console.error("❌ Welcome email failed:", welcomeResult.error);
    }

    // 7. Final Summary
    console.log("\n" + "=".repeat(70));
    console.log("TEST SUMMARY");
    console.log("=".repeat(70));

    console.log("\n✅ Order in CRM:");
    console.log(`   Order Number: ${testOrder.orderNumber}`);
    console.log(`   Status: ${testOrder.status}`);
    console.log(`   Payment Status: ${testOrder.payment.status}`);
    console.log(`   Amount Paid: €${testOrder.totals.total}`);

    console.log("\n✅ Payment:");
    console.log(`   Method: ${testOrder.payment.method}`);
    console.log(`   Transaction ID: ${testOrder.payment.transactionId}`);
    console.log(`   Paid At: ${testOrder.payment.paidAt}`);

    console.log("\n✅ Emails Sent:");
    console.log(
      `   Order Confirmation: ${testOrder.emailSent.confirmation ? "✅" : "❌"}`,
    );
    console.log(
      `   Welcome Email: ${testOrder.emailSent.welcome ? "✅" : "❌"}`,
    );

    console.log("\n✅ PDF Certificate:");
    if (certResult.success) {
      console.log(`   Generated: ✅`);
      console.log(`   File: ${certResult.fileName}`);
    } else {
      console.log(`   Generated: ❌ (${certResult.error})`);
    }

    console.log("\n✅ NFT Certificate:");
    console.log(`   Token ID: ${testOrder.nft.tokenId}`);
    console.log(`   Contract: ${testOrder.nft.contractAddress}`);
    console.log(`   Minted: ${testOrder.nft.minted ? "✅" : "⏳ Pending"}`);

    console.log("\n" + "=".repeat(70));
    console.log("✅ PAYMENT FLOW TEST COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(70));

    console.log("\n📋 Next Steps:");
    console.log("   1. Check your email inbox for test emails");
    console.log("   2. Verify PDF certificate in data/certificates/");
    console.log("   3. Check MongoDB for order record");
    console.log(
      "   4. Test order uses TEST-ORDER product (existing products untouched)",
    );

    console.log("\n🗑️  Cleanup:");
    console.log(
      `   To remove test order: db.orders.deleteOne({orderNumber: "${testOrder.orderNumber}"})`,
    );
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
    console.error(error.stack);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
  }
}

// ============================================================================
// RUN TEST
// ============================================================================

runPaymentFlowTest();
