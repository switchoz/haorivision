import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { baseLogger } from "../middlewares/logger.js";

const require = createRequire(import.meta.url);
const nodemailer = require("nodemailer");

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Load email template
const loadTemplate = (templateName) => {
  const templatePath = path.join(
    __dirname,
    "..",
    "..",
    "data",
    "email",
    `${templateName}.html`,
  );

  try {
    return fs.readFileSync(templatePath, "utf-8");
  } catch (error) {
    baseLogger.warn(`Template ${templateName} not found, using default`);
    return getDefaultTemplate(templateName);
  }
};

// Default templates if file doesn't exist
const getDefaultTemplate = (templateName) => {
  const templates = {
    welcome: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); padding: 40px; border-radius: 16px; border: 1px solid #a855f7; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .content { line-height: 1.8; }
          .nft-box { background: rgba(168, 85, 247, 0.1); border: 1px solid #a855f7; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center; }
          .button { display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; margin: 10px 5px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">光 HAORI VISION</div>
            <h1>Welcome to the Light Circle</h1>
          </div>

          <div class="content">
            <p>Приветствуем тебя, {{customerName}}...</p>

            <p>Ты стал частью круга Света — эксклюзивного сообщества тех, кто понимает, что одежда может быть искусством.</p>

            <p>Твоё хаори <strong>{{productName}}</strong> (Edition {{editionNumber}}/{{totalEditions}}) уже готовится к отправке. Это не просто покупка — это ритуал вступления в новое измерение носимого искусства.</p>

            <div class="nft-box">
              <h2>🎨 Твой NFT-сертификат готов!</h2>
              <p>Token ID: <strong>#{{tokenId}}</strong></p>
              <p>Этот цифровой артефакт подтверждает подлинность твоего хаори и твоё право владения уникальным произведением.</p>
              <a href="{{openseaUrl}}" class="button">Посмотреть на OpenSea</a>
            </div>

            <h3>Что дальше?</h3>
            <ul style="line-height: 2;">
              <li><strong>Отслеживание:</strong> Ты получишь номер для отслеживания, как только посылка отправится</li>
              <li><strong>Упаковка:</strong> Деревянная коробка с гравировкой + сертификат подлинности</li>
              <li><strong>Уход:</strong> Инструкция по уходу за флюоресцентными паттернами прилагается</li>
              <li><strong>Сообщество:</strong> Присоединяйся к нашему Discord для владельцев HAORI VISION</li>
            </ul>

            <p style="margin-top: 30px; font-style: italic; opacity: 0.9;">
              "В тебе уже живёт этот свет. Хаори только даёт ему форму."<br>
              — 光 Хикари, Хранитель Света
            </p>
          </div>

          <div style="text-align: center; margin-top: 40px;">
            <a href="https://haorivision.com/account" class="button">Мой аккаунт</a>
            <a href="https://haorivision.com/products" class="button">Смотреть коллекции</a>
          </div>

          <div class="footer">
            <p><strong>HAORI VISION</strong> — Wearable Light Art Since 2025</p>
            <p>Wear the Light. Become the Art.</p>
            <p style="margin-top: 20px; font-size: 11px;">
              Есть вопросы? Напиши нам: <a href="mailto:support@haorivision.com" style="color: #a855f7;">support@haorivision.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    orderConfirmation: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px; }
          .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 40px; border-radius: 16px; }
          h1 { color: #a855f7; }
          .order-number { font-size: 24px; color: #10b981; margin: 20px 0; }
          .product { background: rgba(168, 85, 247, 0.1); padding: 20px; border-radius: 8px; margin: 20px 0; }
          .total { font-size: 28px; color: #10b981; font-weight: 700; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Order Confirmed!</h1>
          <p>Thank you for your order, {{customerName}}!</p>
          <div class="order-number">Order #{{orderNumber}}</div>

          <div class="product">
            <h3>{{productName}}</h3>
            <p>Edition: {{editionNumber}}/{{totalEditions}}</p>
            <p>Price: ${{ price }}</p>
          </div>

          <div class="total">Total: ${{ total }}</div>

          <p style="margin-top: 30px;">We'll send you shipping updates soon!</p>
        </div>
      </body>
      </html>
    `,
    shipping: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px; }
          .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 40px; border-radius: 16px; }
          h1 { color: #10b981; }
          .tracking { background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .button { display: inline-block; background: #10b981; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📦 Your Haori Has Shipped!</h1>
          <p>Great news, {{customerName}}!</p>
          <p>Your <strong>{{productName}}</strong> is on its way.</p>

          <div class="tracking">
            <p>Carrier: {{carrier}}</p>
            <p>Tracking Number: <strong>{{trackingNumber}}</strong></p>
            <a href="{{trackingUrl}}" class="button">Track Shipment</a>
          </div>

          <p>Expected delivery: {{estimatedDelivery}}</p>
        </div>
      </body>
      </html>
    `,
  };

  return templates[templateName] || templates.welcome;
};

// Replace template variables
const replaceVariables = (template, variables) => {
  let result = template;

  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, variables[key]);
  });

  return result;
};

// Send Welcome Email
export const sendWelcomeEmail = async (customer, order, nft) => {
  try {
    const transporter = createTransporter();
    const template = loadTemplate("welcome");

    const variables = {
      customerName: customer.name,
      productName: order.items[0].name,
      editionNumber: order.items[0].editionNumber,
      totalEditions: order.items[0].product.editions.total,
      tokenId: nft.tokenId,
      openseaUrl: nft.openseaUrl,
      orderNumber: order.orderNumber,
    };

    const htmlContent = replaceVariables(template, variables);

    const mailOptions = {
      from: `HAORI VISION <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: "✨ Welcome to the Light Circle — Your Haori Journey Begins",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    baseLogger.info(
      `Welcome email sent to ${customer.email}: ${info.messageId}`,
    );

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    baseLogger.error({ err: error }, "Welcome email error");
    return {
      success: false,
      error: error.message,
    };
  }
};

// Send Order Confirmation Email
export const sendOrderConfirmation = async (customer, order) => {
  try {
    const transporter = createTransporter();
    const template = loadTemplate("orderConfirmation");

    const variables = {
      customerName: customer.name,
      orderNumber: order.orderNumber,
      productName: order.items[0].name,
      editionNumber: order.items[0].editionNumber,
      totalEditions: order.items[0].product?.editions?.total || "N/A",
      price: order.items[0].price,
      total: order.totals.total,
    };

    const htmlContent = replaceVariables(template, variables);

    const mailOptions = {
      from: `HAORI VISION <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `✅ Order Confirmed #${order.orderNumber}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    baseLogger.info(`Order confirmation sent to ${customer.email}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    baseLogger.error({ err: error }, "Order confirmation email error");
    return {
      success: false,
      error: error.message,
    };
  }
};

// Send Shipping Notification
export const sendShippingNotification = async (customer, order) => {
  try {
    const transporter = createTransporter();
    const template = loadTemplate("shipping");

    const variables = {
      customerName: customer.name,
      productName: order.items[0].name,
      carrier: order.tracking.carrier,
      trackingNumber: order.tracking.trackingNumber,
      trackingUrl: getTrackingUrl(
        order.tracking.carrier,
        order.tracking.trackingNumber,
      ),
      estimatedDelivery: calculateEstimatedDelivery(order.tracking.shippedAt),
    };

    const htmlContent = replaceVariables(template, variables);

    const mailOptions = {
      from: `HAORI VISION <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `📦 Your Haori Has Shipped! #${order.orderNumber}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    baseLogger.info(`Shipping notification sent to ${customer.email}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    baseLogger.error({ err: error }, "Shipping notification error");
    return {
      success: false,
      error: error.message,
    };
  }
};

// Helper: Get tracking URL
const getTrackingUrl = (carrier, trackingNumber) => {
  const carriers = {
    DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    FedEx: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    UPS: `https://www.ups.com/track?tracknum=${trackingNumber}`,
    USPS: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
  };

  return (
    carriers[carrier] ||
    `https://www.google.com/search?q=${carrier}+${trackingNumber}`
  );
};

// Helper: Calculate estimated delivery
const calculateEstimatedDelivery = (shippedDate) => {
  const shipped = new Date(shippedDate);
  const estimated = new Date(shipped);
  estimated.setDate(estimated.getDate() + 7); // 7-14 days

  return estimated.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Send Custom Email (for reports, notifications, etc.)
export const sendCustomEmail = async (to, subject, htmlContent) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `HAORI VISION <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    baseLogger.info(`Custom email sent to ${to}: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    baseLogger.error({ err: error }, "Custom email error");
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendShippingNotification,
  sendCustomEmail,
};
