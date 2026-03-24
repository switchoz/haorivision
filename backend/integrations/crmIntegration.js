import crmService from "../../src/assistant/crmService.js";
import loyaltyService from "../services/loyaltyService.js";
import emailWorkflowService from "../services/emailWorkflowService.js";
import newsletterService from "../services/newsletterService.js";

/**
 * CRM Integration Layer
 * Связывает все сервисы воедино: CRM + Loyalty + Email + Newsletter
 */

class CRMIntegration {
  /**
   * Полный onboarding нового клиента
   */
  async onboardNewCustomer(customerData) {
    try {
      console.log("🎯 Starting customer onboarding:", customerData.email);

      // 1. Создать клиента в CRM
      const leadResult = await crmService.createOrUpdateLead(
        customerData.sessionId || `manual_${Date.now()}`,
        {
          name: customerData.name,
          email: customerData.email,
          interests: customerData.interests || {},
          lastMessage: "Manual registration",
          intent: "registration",
          stage: "awareness",
          score: 20,
        },
      );

      // 2. Конвертировать в клиента
      const clientResult = await crmService.convertLeadToClient(
        customerData.sessionId || `manual_${Date.now()}`,
        customerData,
      );

      const clientId = clientResult.clientId;

      // 3. Начислить welcome bonus (100 points)
      await loyaltyService.awardPoints(clientId, "firstPurchase", {
        type: "welcome_bonus",
      });

      // 4. Подписать на Circle of Light
      await newsletterService.subscribe(
        customerData.email,
        customerData.name,
        "registration",
      );

      // 5. Отправить welcome email
      await emailWorkflowService.sendWelcomeWorkflow({
        id: clientId,
        email: customerData.email,
        name: customerData.name,
      });

      console.log(`✅ Customer ${customerData.email} onboarded successfully`);

      return {
        success: true,
        clientId: clientId,
        loyaltyPoints: 100,
        newsletterSubscribed: true,
      };
    } catch (error) {
      console.error("Onboarding error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Обработка нового заказа
   */
  async processNewOrder(customer, order, product) {
    try {
      console.log(
        `📦 Processing order ${order.orderNumber} for ${customer.email}`,
      );

      // 1. Начислить loyalty points
      if (customer.id) {
        await loyaltyService.awardPurchasePoints(
          customer.id,
          order.totals.total,
        );
      }

      // 2. Отправить order confirmation email
      await emailWorkflowService.sendOrderWorkflow(customer, order, product);

      // 3. Записать interaction в CRM
      if (customer.id) {
        await crmService.logInteraction(customer.id, {
          type: "purchase",
          intent: "purchase",
          message: `Order ${order.orderNumber}`,
          response: "Order confirmed",
          products: [product.id],
        });

        // 4. Обновить total_spent
        await crmService.addToTotalSpent(customer.id, order.totals.total);

        // 5. Проверить VIP upgrade
        await this.checkVIPUpgrade(customer.id);
      }

      console.log(`✅ Order ${order.orderNumber} processed`);

      return { success: true };
    } catch (error) {
      console.error("Process order error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Отправка NFT сертификата
   */
  async processNFTMinted(customer, order, nft) {
    try {
      // Отправить NFT email
      await emailWorkflowService.sendNFTMintedEmail(customer, order, nft);

      // Записать в CRM
      if (customer.id) {
        await crmService.logInteraction(customer.id, {
          type: "nft_minted",
          intent: "nft",
          message: `NFT minted: ${nft.tokenId}`,
          response: `OpenSea: ${nft.openseaUrl}`,
          products: [],
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Проверить VIP upgrade на основе total_spent или points
   */
  async checkVIPUpgrade(clientId) {
    try {
      const client = await crmService.db.get(
        "SELECT total_spent, vip_tier FROM clients WHERE id = ?",
        [clientId],
      );

      const loyaltyPoints = await loyaltyService.getBalance(clientId);

      let newTier = client.vip_tier;

      // Определить новый tier
      if (client.total_spent >= 10000 || loyaltyPoints >= 10000) {
        newTier = "platinum";
      } else if (client.total_spent >= 5000 || loyaltyPoints >= 5000) {
        newTier = "gold";
      } else if (client.total_spent >= 2000 || loyaltyPoints >= 2000) {
        newTier = "silver";
      }

      // Если изменился tier
      if (newTier !== client.vip_tier) {
        await crmService.updateVIPTier(clientId, newTier);

        // Отправить congratulations email
        // TODO: Create VIP upgrade email template

        console.log(`🌟 Client ${clientId} upgraded to ${newTier} VIP`);
      }

      return { upgraded: newTier !== client.vip_tier, tier: newTier };
    } catch (error) {
      return { upgraded: false };
    }
  }

  /**
   * Отправить еженедельную рассылку Circle of Light
   */
  async sendWeeklyNewsletter(title, content) {
    try {
      const result = await newsletterService.sendCampaign(title, content);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Получить полную активность клиента
   */
  async getCustomerActivity(customerId) {
    try {
      // Все данные параллельно
      const [
        client,
        interactions,
        interests,
        consultations,
        loyaltyBalance,
        loyaltyHistory,
        rewards,
      ] = await Promise.all([
        crmService.db.get("SELECT * FROM clients WHERE id = ?", [customerId]),
        crmService.getClientInteractions(customerId, 20),
        crmService.getClientInterests(customerId),
        crmService.getClientConsultations(customerId),
        loyaltyService.getBalance(customerId),
        loyaltyService.getTransactionHistory(customerId, 10),
        loyaltyService.getAvailableRewards(customerId),
      ]);

      return {
        client: client,
        interactions: interactions,
        interests: interests,
        consultations: consultations,
        loyalty: {
          balance: loyaltyBalance,
          history: loyaltyHistory,
          rewards: rewards,
        },
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Инициализировать все таблицы
   */
  async initializeAll() {
    try {
      await crmService.init();
      await loyaltyService.initTables();
      await newsletterService.initTables();

      console.log("✅ All CRM tables initialized");

      return { success: true };
    } catch (error) {
      console.error("Init error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Получить общую статистику системы
   */
  async getSystemStats() {
    try {
      const [crmStats, loyaltyStats, newsletterStats] = await Promise.all([
        crmService.getStats(),
        loyaltyService.getStats(),
        newsletterService.getStats(),
      ]);

      return {
        crm: crmStats,
        loyalty: loyaltyStats,
        newsletter: newsletterStats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return null;
    }
  }
}

export default new CRMIntegration();
