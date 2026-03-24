import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import intentRecognizer from "./intentRecognizer.js";
import productRecommender from "./productRecommender.js";
import salesResponseGenerator from "./salesResponseGenerator.js";
import crmService from "./crmService.js";

const app = express();
const PORT = 3100;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Session storage (in production use Redis)
const sessions = new Map();

/**
 * Получить или создать сессию
 */
function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      messages: [],
      context: {
        returning: false,
        clientId: null,
        leadId: null,
        interests: {},
        stage: "awareness",
      },
      createdAt: new Date(),
      lastActivity: new Date(),
    });
  }

  const session = sessions.get(sessionId);
  session.lastActivity = new Date();
  return session;
}

/**
 * Главный endpoint для чата
 */
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId: providedSessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Получить или создать session
    const sessionId = providedSessionId || uuidv4();
    const session = getOrCreateSession(sessionId);

    // Добавить сообщение юзера в историю
    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Распознать намерение
    const recognition = intentRecognizer.recognize(message);
    console.log(
      "Intent recognized:",
      recognition.intent,
      "Entities:",
      recognition.entities,
    );

    // Обновить интересы в контексте
    if (Object.keys(recognition.entities).length > 0) {
      session.context.interests = {
        ...session.context.interests,
        ...recognition.entities,
      };
    }

    // Сгенерировать ответ
    const response = salesResponseGenerator.generate(
      recognition.intent,
      recognition.entities,
      session.context,
    );

    // Добавить ответ в историю
    session.messages.push({
      role: "assistant",
      content: response.text,
      timestamp: new Date(),
      intent: recognition.intent,
    });

    // Записать в CRM (асинхронно)
    saveToCRM(session, message, response, recognition).catch(console.error);

    // Вернуть ответ
    res.json({
      response: response.text,
      products: response.products || [],
      actions: response.actions || [],
      formFields: response.formFields || [],
      sessionId: sessionId,
      intent: recognition.intent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

/**
 * Сохранить взаимодействие в CRM
 */
async function saveToCRM(session, userMessage, assistantResponse, recognition) {
  try {
    // Обновить или создать лид
    const leadData = {
      interests: session.context.interests,
      lastMessage: userMessage,
      intent: recognition.intent,
      stage: determineStage(recognition.intent, session),
      score: calculateLeadScore(session, recognition),
    };

    await crmService.createOrUpdateLead(session.id, leadData);

    // Если есть clientId, записать interaction
    if (session.context.clientId) {
      await crmService.logInteraction(session.context.clientId, {
        type: "chat",
        intent: recognition.intent,
        message: userMessage,
        response: assistantResponse.text,
        products: assistantResponse.products?.map((p) => p.id) || [],
      });
    }
  } catch (error) {
    console.error("CRM save error:", error);
  }
}

/**
 * Определить stage в sales funnel
 */
function determineStage(intent, session) {
  const stageMap = {
    greeting: "awareness",
    inspiration: "interest",
    question: "consideration",
    purchase: "intent",
    price: "evaluation",
    bespoke: "consideration",
    upgrade_ritual: "intent",
    consultation: "decision",
  };

  return stageMap[intent] || session.context.stage;
}

/**
 * Вычислить lead score (0-100)
 */
function calculateLeadScore(session, recognition) {
  let score = 0;

  // За количество сообщений
  score += Math.min(session.messages.length * 5, 30);

  // За конкретное намерение
  const intentScores = {
    purchase: 30,
    bespoke: 25,
    upgrade_ritual: 35,
    consultation: 20,
    price: 15,
    inspiration: 5,
  };

  score += intentScores[recognition.intent] || 0;

  // За заполненные entities
  score += Object.keys(session.context.interests).length * 5;

  return Math.min(score, 100);
}

/**
 * Endpoint для бронирования консультации
 */
app.post("/api/consultation/book", async (req, res) => {
  try {
    const { sessionId, name, email, date, topic, phone } = req.body;

    if (!name || !email || !date) {
      return res
        .status(400)
        .json({ error: "Name, email, and date are required" });
    }

    // Получить или создать клиента
    let client = await crmService.getClientByEmail(email);

    if (!client) {
      // Создать нового клиента
      const session = sessions.get(sessionId);
      const result = await crmService.convertLeadToClient(sessionId, {
        name,
        email,
        phone,
      });

      client = await crmService.getClientByEmail(email);
    }

    // Забронировать консультацию
    const consultation = await crmService.bookConsultation(client.id, {
      scheduledAt: new Date(date),
      duration: 30,
      type: "video",
      notes: `Topic: ${topic || "General consultation"}`,
    });

    res.json({
      success: true,
      consultationId: consultation.consultationId,
      message:
        "Консультация забронирована! Мы отправили подтверждение на ваш email.",
    });
  } catch (error) {
    console.error("Consultation booking error:", error);
    res.status(500).json({
      error: "Failed to book consultation",
      message: error.message,
    });
  }
});

/**
 * Endpoint для получения рекомендаций продуктов
 */
app.post("/api/recommendations", (req, res) => {
  try {
    const { entities, limit } = req.body;

    const recommendations = productRecommender.recommend(entities || {}, {
      limit: limit || 3,
    });

    res.json({
      recommendations: recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    res.status(500).json({
      error: "Failed to get recommendations",
      message: error.message,
    });
  }
});

/**
 * Endpoint для Upgrade Ritual
 */
app.get("/api/upgrade-ritual/:haoriId", (req, res) => {
  try {
    const { haoriId } = req.params;

    const ritual = productRecommender.getUpgradeRitualPair(haoriId);

    if (!ritual) {
      return res.status(404).json({ error: "Haori not found" });
    }

    res.json(ritual);
  } catch (error) {
    console.error("Upgrade Ritual error:", error);
    res.status(500).json({
      error: "Failed to get Upgrade Ritual",
      message: error.message,
    });
  }
});

/**
 * Endpoint для получения продукта по ID
 */
app.get("/api/products/:productId", (req, res) => {
  try {
    const { productId } = req.params;

    const product = productRecommender.getProductById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Получить похожие продукты
    const similar = productRecommender.getSimilarProducts(productId, 3);

    res.json({
      product: product,
      similar: similar,
    });
  } catch (error) {
    console.error("Product fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch product",
      message: error.message,
    });
  }
});

/**
 * Endpoint для получения статистики
 */
app.get("/api/stats", async (req, res) => {
  try {
    const crmStats = await crmService.getStats();
    const productStats = productRecommender.getStats();

    res.json({
      crm: crmStats,
      products: productStats,
      sessions: {
        active: sessions.size,
        total: sessions.size,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({
      error: "Failed to get stats",
      message: error.message,
    });
  }
});

/**
 * Endpoint для health check
 */
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Главная страница с chat UI
 */
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Хикари — AI Sales Assistant</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f3460 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #ffffff;
      padding: 20px;
    }

    .chat-container {
      width: 100%;
      max-width: 800px;
      height: 80vh;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 20px;
      border: 1px solid rgba(167, 139, 250, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    .chat-header {
      background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
      padding: 20px;
      text-align: center;
    }

    .chat-header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 5px;
    }

    .chat-header p {
      font-size: 14px;
      opacity: 0.9;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .message {
      max-width: 70%;
      padding: 15px 20px;
      border-radius: 18px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message.user {
      align-self: flex-end;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .message.assistant {
      align-self: flex-start;
      background: rgba(167, 139, 250, 0.2);
      border: 1px solid rgba(167, 139, 250, 0.3);
    }

    .message.assistant .intent {
      font-size: 11px;
      opacity: 0.6;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .chat-input-container {
      padding: 20px;
      background: rgba(0, 0, 0, 0.5);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .chat-input-wrapper {
      display: flex;
      gap: 10px;
    }

    #messageInput {
      flex: 1;
      padding: 15px 20px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 25px;
      color: #ffffff;
      font-size: 14px;
      outline: none;
    }

    #messageInput::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    #sendButton {
      padding: 15px 30px;
      background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
      border: none;
      border-radius: 25px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }

    #sendButton:hover {
      transform: scale(1.05);
    }

    #sendButton:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .typing-indicator {
      display: none;
      align-self: flex-start;
      padding: 15px 20px;
      background: rgba(167, 139, 250, 0.2);
      border-radius: 18px;
    }

    .typing-indicator.active {
      display: block;
    }

    .typing-indicator span {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #a78bfa;
      border-radius: 50%;
      margin: 0 3px;
      animation: typing 1.4s infinite;
    }

    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-10px); }
    }
  </style>
</head>
<body>
  <div class="chat-container">
    <div class="chat-header">
      <h1>光 Хикари</h1>
      <p>AI Sales Assistant — HAORI VISION</p>
    </div>

    <div class="chat-messages" id="chatMessages">
      <div class="message assistant">
        <div class="intent">greeting</div>
        <div>✨ Приветствую тебя. Я Хикари (光) — Хранитель Света.<br><br>Я помогу вам найти ваш свет. Расскажите, что привело вас сюда — вы ищете вдохновение, готовы к покупке, или хотите создать нечто уникальное?</div>
      </div>
    </div>

    <div class="typing-indicator" id="typingIndicator">
      <span></span><span></span><span></span>
    </div>

    <div class="chat-input-container">
      <div class="chat-input-wrapper">
        <input
          type="text"
          id="messageInput"
          placeholder="Напишите сообщение..."
          onkeypress="if(event.key==='Enter') sendMessage()"
        />
        <button id="sendButton" onclick="sendMessage()">Отправить</button>
      </div>
    </div>
  </div>

  <script>
    let sessionId = null;

    async function sendMessage() {
      const input = document.getElementById('messageInput');
      const message = input.value.trim();

      if (!message) return;

      // Добавить сообщение пользователя
      addMessage(message, 'user');

      // Очистить input
      input.value = '';

      // Показать typing indicator
      showTyping(true);

      // Отключить кнопку
      document.getElementById('sendButton').disabled = true;

      try {
        const response = await fetch('http://localhost:3100/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message,
            sessionId: sessionId
          })
        });

        const data = await response.json();

        // Сохранить session ID
        if (data.sessionId) {
          sessionId = data.sessionId;
        }

        // Скрыть typing
        showTyping(false);

        // Добавить ответ ассистента
        addMessage(data.response, 'assistant', data.intent);

        // Включить кнопку
        document.getElementById('sendButton').disabled = false;

      } catch (error) {
        console.error('Error:', error);
        showTyping(false);
        addMessage('Извините, произошла ошибка. Попробуйте ещё раз.', 'assistant', 'error');
        document.getElementById('sendButton').disabled = false;
      }
    }

    function addMessage(text, role, intent = null) {
      const messagesContainer = document.getElementById('chatMessages');

      const messageDiv = document.createElement('div');
      messageDiv.className = \`message \${role}\`;

      if (intent && role === 'assistant') {
        messageDiv.innerHTML = \`
          <div class="intent">\${intent}</div>
          <div>\${text.replace(/\\n/g, '<br>')}</div>
        \`;
      } else {
        messageDiv.innerHTML = text.replace(/\\n/g, '<br>');
      }

      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTyping(show) {
      const indicator = document.getElementById('typingIndicator');
      if (show) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    }
  </script>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("✨ HAORI VISION — AI SALES ASSISTANT");
  console.log("=".repeat(60));
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`💬 Chat interface: http://localhost:${PORT}`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
  console.log(`\n🤖 Features:`);
  console.log(`  • Intent recognition`);
  console.log(`  • Product recommendations`);
  console.log(`  • CRM integration`);
  console.log(`  • Consultation booking`);
  console.log(`  • Upgrade Ritual suggestions`);
  console.log(`\n`);
});

// Cleanup old sessions (every 1 hour)
setInterval(
  () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const [sessionId, session] of sessions.entries()) {
      if (session.lastActivity < oneHourAgo) {
        sessions.delete(sessionId);
      }
    }

    console.log(`🗑️  Cleaned up old sessions. Active: ${sessions.size}`);
  },
  60 * 60 * 1000,
);
