import emailService from "./emailService.js";
import loyaltyService from "./loyaltyService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Email Workflow Service
 * Автоматические email-кампании для HAORI VISION
 */

class EmailWorkflowService {
  constructor() {
    this.templatesPath = path.join(__dirname, "../../data/email");
  }

  /**
   * Загрузить email template
   */
  loadTemplate(templateName) {
    try {
      const templatePath = path.join(
        this.templatesPath,
        `${templateName}.html`,
      );
      return fs.readFileSync(templatePath, "utf-8");
    } catch (error) {
      console.error(`Template ${templateName} not found`);
      return null;
    }
  }

  /**
   * Заменить переменные в template
   */
  replaceVariables(template, variables) {
    let result = template;

    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, variables[key]);
    });

    return result;
  }

  /**
   * WORKFLOW 1: Welcome - при регистрации
   */
  async sendWelcomeWorkflow(customer) {
    try {
      console.log(`📧 Starting Welcome workflow for ${customer.email}`);

      // Начислить welcome bonus
      if (customer.id) {
        await loyaltyService.awardPoints(customer.id, "firstPurchase", {
          type: "welcome_bonus",
          amount: 100,
        });
      }

      // Загрузить template
      const template = this.loadTemplate("welcome-light-awakened");
      if (!template) return { success: false, error: "Template not found" };

      // Переменные
      const variables = {
        customerName: customer.name || "друг",
        unsubscribeUrl: `https://haorivision.com/unsubscribe?email=${customer.email}`,
      };

      const html = this.replaceVariables(template, variables);

      // Отправить
      await emailService.sendCustomEmail(
        customer.email,
        "✨ Your Light Has Awakened — Welcome to Circle of Light",
        html,
      );

      // Запланировать follow-up через 3 дня
      setTimeout(
        () => {
          this.sendFollowUpEmail(customer, "collections_intro");
        },
        3 * 24 * 60 * 60 * 1000,
      ); // 3 days

      return { success: true, workflow: "welcome" };
    } catch (error) {
      console.error("Welcome workflow error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * WORKFLOW 2: Order Confirmation - при покупке
   */
  async sendOrderWorkflow(customer, order, product) {
    try {
      console.log(`📧 Starting Order workflow for order ${order.orderNumber}`);

      // Начислить points за покупку
      if (customer.id && order.totals?.total) {
        await loyaltyService.awardPurchasePoints(
          customer.id,
          order.totals.total,
        );
      }

      // Загрузить template
      const template = this.loadTemplate("order-ritual-begins");
      if (!template) return { success: false, error: "Template not found" };

      // Переменные
      const variables = {
        customerName: customer.name,
        orderNumber: order.orderNumber,
        productName: product.name,
        productTagline: product.tagline,
        editionNumber: order.items[0]?.editionNumber || "?",
        totalEditions: product.editions?.total || 50,
        collection: product.collection,
        uvColors: product.uvColors?.join(", ") || "Multi",
        price: product.price,
        total: order.totals?.total || product.price,
        trackingUrl: `https://haorivision.com/track/${order.orderNumber}`,
      };

      const html = this.replaceVariables(template, variables);

      // Отправить
      await emailService.sendCustomEmail(
        customer.email,
        `✨ The Ritual Begins — Order #${order.orderNumber}`,
        html,
      );

      // Запланировать post-purchase через 7 дней
      setTimeout(
        () => {
          this.sendPostPurchaseStory(customer, product);
        },
        7 * 24 * 60 * 60 * 1000,
      ); // 7 days

      return { success: true, workflow: "order" };
    } catch (error) {
      console.error("Order workflow error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * WORKFLOW 3: Post-Purchase Story - через неделю после покупки
   */
  async sendPostPurchaseStory(customer, product) {
    try {
      console.log(`📧 Sending Post-Purchase Story to ${customer.email}`);

      const template = this.loadTemplate("post-purchase-story");
      if (!template) return { success: false };

      const variables = {
        customerName: customer.name,
        productName: product.name,
        reviewUrl: `https://haorivision.com/review?product=${product.id}`,
        communityUrl: "https://discord.gg/haorivision",
      };

      const html = this.replaceVariables(template, variables);

      await emailService.sendCustomEmail(
        customer.email,
        "💫 Your Light Story — Поделись опытом",
        html,
      );

      return { success: true, workflow: "post_purchase" };
    } catch (error) {
      console.error("Post-purchase workflow error:", error);
      return { success: false };
    }
  }

  /**
   * WORKFLOW 4: Shipping Notification - при отправке
   */
  async sendShippingWorkflow(customer, order) {
    try {
      const trackingUrl = this.getTrackingUrl(
        order.tracking.carrier,
        order.tracking.trackingNumber,
      );

      await emailService.sendShippingNotification(customer, order);

      return { success: true, workflow: "shipping" };
    } catch (error) {
      console.error("Shipping workflow error:", error);
      return { success: false };
    }
  }

  /**
   * WORKFLOW 5: NFT Minted - после создания NFT
   */
  async sendNFTMintedEmail(customer, order, nft) {
    try {
      const html = `
        <h1>🎫 Your NFT Certificate is Ready!</h1>
        <p>Hi ${customer.name},</p>
        <p>Your NFT certificate for <strong>${order.items[0].name}</strong> has been minted!</p>
        <p><strong>Token ID:</strong> ${nft.tokenId}</p>
        <p><strong>View on OpenSea:</strong> <a href="${nft.openseaUrl}">${nft.openseaUrl}</a></p>
      `;

      await emailService.sendCustomEmail(
        customer.email,
        "🎫 Your NFT Certificate is Ready",
        html,
      );

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * WORKFLOW 6: Circle of Light Newsletter - еженедельная рассылка
   */
  async sendNewsletterWorkflow(subscribers, content) {
    try {
      console.log(`📧 Sending newsletter to ${subscribers.length} subscribers`);

      const template = this.createNewsletterTemplate(content);

      for (const subscriber of subscribers) {
        const variables = {
          customerName: subscriber.name || "друг",
          unsubscribeUrl: `https://haorivision.com/unsubscribe?email=${subscriber.email}`,
        };

        const html = this.replaceVariables(template, variables);

        await emailService.sendCustomEmail(
          subscriber.email,
          `✨ Circle of Light — ${content.title}`,
          html,
        );

        // Rate limit - не более 1 письма в секунду
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return { success: true, sent: subscribers.length };
    } catch (error) {
      console.error("Newsletter workflow error:", error);
      return { success: false };
    }
  }

  /**
   * WORKFLOW 7: Milestone Rewards - при достижении points
   */
  async sendMilestoneEmail(customer, milestone) {
    try {
      const milestoneMessages = {
        500: {
          title: "🎉 500 Glow Points!",
          message: "Поздравляем! Ты заработал $100 скидку.",
          reward: "$100 discount code",
        },
        1000: {
          title: "💎 1000 Glow Points!",
          message: "Впечатляюще! $250 скидка на bespoke заказ ждёт тебя.",
          reward: "$250 bespoke discount",
        },
        2000: {
          title: "🌟 Silver VIP Status!",
          message: "Добро пожаловать в Silver tier!",
          reward: "VIP privileges",
        },
      };

      const data = milestoneMessages[milestone];
      if (!data) return { success: false };

      const html = `
        <h1>${data.title}</h1>
        <p>Hi ${customer.name},</p>
        <p>${data.message}</p>
        <p><strong>Your reward:</strong> ${data.reward}</p>
        <a href="https://haorivision.com/rewards">View Rewards</a>
      `;

      await emailService.sendCustomEmail(customer.email, data.title, html);

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * WORKFLOW 8: Unboxing - "How does your Light feel?"
   */
  async sendUnboxingWorkflow(customer, product, packaging) {
    try {
      console.log(`📧 Sending Unboxing workflow to ${customer.email}`);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              background: linear-gradient(135deg, #0a0a0a 0%, #1a0f2e 100%);
              color: #fff;
              padding: 40px;
              margin: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 20px;
              padding: 40px;
              border: 1px solid rgba(167, 139, 250, 0.3);
            }
            h1 {
              color: #a78bfa;
              font-size: 32px;
              margin-bottom: 20px;
              text-align: center;
            }
            .glow-text {
              text-align: center;
              font-size: 20px;
              color: #c4b5fd;
              margin-bottom: 30px;
              font-style: italic;
            }
            .quote-box {
              background: rgba(124, 58, 237, 0.2);
              border-left: 4px solid #a78bfa;
              padding: 20px;
              margin: 30px 0;
              font-style: italic;
              color: #e9d5ff;
            }
            .feedback-btn {
              display: block;
              width: 100%;
              background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
              color: white;
              text-align: center;
              padding: 15px 30px;
              border-radius: 10px;
              text-decoration: none;
              font-weight: bold;
              margin: 30px 0;
            }
            .content-links {
              background: rgba(167, 139, 250, 0.1);
              border-radius: 15px;
              padding: 20px;
              margin: 20px 0;
            }
            .content-link {
              display: block;
              color: #a78bfa;
              text-decoration: none;
              padding: 10px 0;
              border-bottom: 1px solid rgba(167, 139, 250, 0.2);
            }
            .content-link:last-child {
              border-bottom: none;
            }
            .content-link:hover {
              color: #c4b5fd;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✨ How does your Light feel?</h1>

            <p class="glow-text">
              Твоя ${product.name} пробудилась к жизни
            </p>

            <p style="color: #e5e7eb; line-height: 1.8;">
              Привет, ${customer.name}!
            </p>

            <p style="color: #e5e7eb; line-height: 1.8;">
              Мы видели, что ты открыл упаковку своей новой хаори. Это особенный момент — когда свет встречается с тьмой, когда ткань впервые касается кожи, когда Vision становится реальностью.
            </p>

            <div class="quote-box">
              "${packaging.printedCard.message}"
            </div>

            <p style="color: #e5e7eb; line-height: 1.8; margin-top: 30px;">
              <strong style="color: #a78bfa;">Расскажи нам:</strong><br/>
              Как чувствует себя твоя хаори? Где она побывала впервые? Какие эмоции вызвала?
            </p>

            <a href="https://haorivision.com/unboxing/${packaging.qrCode.code}/feedback" class="feedback-btn">
              Поделиться впечатлениями
            </a>

            <div class="content-links">
              <h3 style="color: #a78bfa; margin-top: 0;">🎨 Для тебя:</h3>

              <a href="${packaging.content.nftUrl}" class="content-link">
                🎫 Твой NFT сертификат на OpenSea
              </a>

              <a href="${packaging.content.creationVideoUrl}" class="content-link">
                🎬 Видео: Как создавалась твоя хаори
              </a>

              <a href="${packaging.content.artistStoryUrl}" class="content-link">
                ✍️ История художника
              </a>

              <a href="${packaging.content.careInstructionsUrl}" class="content-link">
                💧 Как ухаживать за хаори
              </a>
            </div>

            <p style="text-align: center; color: #9ca3af; font-size: 14px; margin-top: 40px;">
              Edition #${packaging.printedCard.edition.match(/\d+/)?.[0]} of ${packaging.printedCard.edition.match(/of (\d+)/)?.[1]}<br/>
              ${packaging.printedCard.artistSignature}
            </p>

            <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
              🌟 Отметь нас в Instagram @haorivision с хештегом #wearlight<br/>
              Лучшие фото попадут в нашу галерею
            </p>
          </div>
        </body>
        </html>
      `;

      await emailService.sendCustomEmail(
        customer.email,
        "✨ How does your Light feel?",
        html,
      );

      return { success: true };
    } catch (error) {
      console.error("Unboxing workflow error:", error);
      return { success: false };
    }
  }

  /**
   * Follow-up email
   */
  async sendFollowUpEmail(customer, type) {
    const templates = {
      purchase_thankyou: {
        subject: "Спасибо за покупку HAORI VISION!",
        html: `<h2>Спасибо, ${customer.name || "друг"}!</h2>
          <p>Ваше произведение ручной работы создано художником LiZa с особой заботой.</p>
          <p>Мы готовим его к отправке и уведомим вас о трекинге.</p>
          <p>С теплом,<br>HAORI VISION</p>`,
      },
      delivery_followup: {
        subject: "Как вам ваше HAORI VISION?",
        html: `<h2>Добрый день, ${customer.name || ""}!</h2>
          <p>Надеемся, ваше приобретение радует вас каждый день.</p>
          <p>Будем благодарны за отзыв — это помогает LiZa создавать новые работы.</p>
          <p>С теплом,<br>HAORI VISION</p>`,
      },
      abandoned_cart: {
        subject: "Вы забыли что-то в корзине HAORI VISION",
        html: `<h2>${customer.name || "Друг"}, вы заглядывали к нам!</h2>
          <p>В вашей корзине остались уникальные работы ручной росписи.</p>
          <p>Каждое произведение существует в единственном экземпляре — не упустите его.</p>
          <p>С теплом,<br>HAORI VISION</p>`,
      },
    };

    const tpl = templates[type];
    if (!tpl) {
      console.log(
        `Follow-up email: unknown type "${type}" for ${customer.email}`,
      );
      return;
    }

    try {
      await emailService.sendCustomEmail({
        to: customer.email,
        subject: tpl.subject,
        html: tpl.html,
      });
      console.log(`✅ Follow-up email "${type}" sent to ${customer.email}`);
    } catch (err) {
      console.error(`Follow-up email error: ${err.message}`);
    }
  }

  /**
   * Создать newsletter template
   */
  createNewsletterTemplate(content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Inter, sans-serif; background: #0a0a0a; color: #fff; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px; }
          h1 { color: #a78bfa; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${content.title}</h1>
          <div>${content.body}</div>
          <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get tracking URL
   */
  getTrackingUrl(carrier, trackingNumber) {
    const carriers = {
      DHL: `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
      FedEx: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    };
    return (
      carriers[carrier] ||
      `https://google.com/search?q=${carrier}+${trackingNumber}`
    );
  }
}

export default new EmailWorkflowService();
