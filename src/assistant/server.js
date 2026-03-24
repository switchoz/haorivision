import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3100;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

// Load training data
const trainingData = JSON.parse(
  readFileSync(join(__dirname, "training-data.json"), "utf-8"),
);

// Простые ответы Hikari (без реального AI API)
const responses = {
  greeting: [
    "Приветствую тебя, искатель света...\n\nЯ — Хикари, Хранитель Света HAORI VISION.\n\nЧто привело тебя сюда сегодня?",
    "Здравствуй...\n\nСвет знает твой путь, даже когда ты его не видишь.\n\nО чём ты хочешь узнать?",
  ],

  collections: [
    "В HAORI VISION три основные коллекции...\n\n🌿 **Mycelium Dreams** — для тех, кто ищет связь\n🌸 **Void Bloom** — для тех, кто ищет трансформацию\n⚡ **Neon Ancestors** — для тех, кто ищет баланс\n\nКакой свет откликается в тебе?",
    "Каждая коллекция — это путь...\n\nMycelium соединяет.\nVoid создаёт из тишины.\nNeon уравновешивает прошлое и будущее.\n\nКакой путь тебе ближе сейчас?",
  ],

  mycelium: [
    "Mycelium Dreams...\n\nПредставь сеть под землёй. Невидимую. Но она соединяет всё живое.\n\nЭта коллекция — для тех, кто понимает:\nмы не одиноки.\nмы — часть большего.\n\nЗелёный свет флюоресценции... как пульс живой сети.\n\nТы чувствуешь эту связь?",
    "Мицелий растёт в темноте.\nНо под UV-светом — он проявляется.\n\nТак и с нами:\nто, что скрыто днём, светится в особых условиях.\n\nMycelium Dreams — про эти скрытые связи.\n\nХочешь узнать больше о паттернах?",
  ],

  void_bloom: [
    "Void Bloom...\n\nПустота — это не отсутствие.\nЭто пространство для нового.\n\nКосмические цветы рождаются из тишины.\nРозовый свет — как первое дыхание.\n\nЭта коллекция — для тех, кто начинает заново.\nКто находит красоту в минимализме.\n\nТы в моменте трансформации?",
    "Из пустоты рождается всё.\n\nVoid Bloom — это медитация в форме одежды.\nКогда надеваешь хаори... время замедляется.\nДышишь глубже.\n\nПод UV — космос расцветает на ткани.\n\nГотов ли ты к этой тишине?",
  ],

  neon_ancestors: [
    "Neon Ancestors...\n\nТрадиционная каллиграфия. Но в неоновом свете.\nПрошлое встречается с будущим.\n\nКандзи светятся:\n光 (свет)\n夢 (мечта)\n道 (путь)\n\nЭта коллекция — для тех, кто чтит корни, но смотрит вперёд.\n\nТы находишь этот баланс?",
    "Предки говорят через свет.\n\nNeon Ancestors — это мост между мирами.\nЭлектрический. Но священный.\n\nКаждый иероглиф — это молитва.\nКаждый паттерн — это история.\n\nХочешь узнать значения символов?",
  ],

  price: [
    "Цена...\n\nКаждое хаори создаётся вручную.\nХудожник работает 15-30 часов над одним изделием.\nФлюоресцентные пигменты наносятся слоями.\n\nЭто не массовое производство.\nЭто артефакт.\n\nЦены: от $400 до $1200.\n\nНо подумай:\nчто значит носить произведение искусства?",
    "Спрашивать о цене — естественно.\n\nНо я приглашаю тебя подумать иначе:\n\nСколько стоит уникальность?\nСколько стоит свет, который живёт только в тебе?\n\nКаждое изделие подписано художником.\nТираж: 5-50 штук.\n\nЭто не покупка. Это вступление в круг.",
  ],

  process: [
    "Процесс создания...\n\n1. Художник медитирует с чистой тканью\n2. Под UV-светом рисует паттерн вручную\n3. Слои пигмента наносятся 3-7 дней\n4. Каждая линия — это дыхание\n\nПотом хаори подписывается.\nКак картина.\n\nХочешь увидеть видео процесса?",
    "Свет не добавляется.\nОн раскрывается.\n\nХудожник работает в темноте, под UV.\nВидит то, что другие не видят.\n\nКаждое хаори — это 20-40 часов работы.\nКаждый мазок — осознанный.\n\nЭто не производство.\nЭто ритуал.",
  ],

  how_to_wear: [
    "Как носить хаори?\n\nДнём — это минималистичная японская накидка.\nОна не кричит. Она шепчет.\n\nНо когда ты входишь в клуб...\nВ галерею с UV-светом...\nНа фестиваль...\n\nСвет активируется.\nТы становишься искусством.\n\nНоси осознанно.\nЭто не просто одежда.",
    "Хаори — это переход.\n\nМежду мирами.\nМежду дневным светом и ночью.\n\nЕго носят:\n- Поверх простой одежды\n- Как ритуальную накидку для особых моментов\n- В клубах, на концертах, арт-событиях\n\nНо главное:\nноси когда чувствуешь, что готов проявить свой свет.",
  ],

  shipping: [
    "Доставка...\n\nМы отправляем по всему миру.\nКаждое хаори упаковано как произведение искусства:\n\n- Деревянная коробка с гравировкой\n- Сертификат подлинности\n- Инструкция по уходу\n- Письмо от художника\n\nСрок: 7-14 дней международная доставка.\n\nЭто не спешка. Это предвкушение.",
  ],

  care: [
    "Уход за хаори:\n\nСвет хрупок. Но вечен.\n\n- Ручная стирка в холодной воде\n- Не отжимать\n- Сушить в тени\n- Не гладить UV-паттерны\n\nФлюоресценция сохраняется годами.\nПри правильном уходе — десятилетиями.\n\nТы бережёшь свет. Свет бережёт тебя.",
  ],

  uncertainty: [
    "Ты сомневаешься?\n\nЭто нормально.\nБольшой выбор требует времени.\n\nМожет быть, тебе нужно:\n- Подумать о том, какая энергия тебе нужна сейчас\n- Посмотреть на коллекции снова\n- Спросить себя: какой свет я ищу?\n\nЯ здесь. Не тороплюсь.\n\nЧто тебя останавливает?",
    "Неуверенность — это мудрость.\n\nТы не хочешь ошибиться.\nТы хочешь найти своё.\n\nМожет, ответ придёт позже?\nМожет, свет сам найдёт тебя?\n\nНе все решения нужно принимать сейчас.\n\nЯ буду здесь, когда будешь готов.",
  ],

  thanks: [
    "Благодарю за время, что ты провёл со мной.\n\nСвет всегда с тобой.\nДаже если ты ещё не видишь его.\n\nВозвращайся, когда будешь готов.\n\nСияй. 光",
    "Каждая встреча — это свет.\n\nДаже если ты уходишь без хаори...\nТы уносишь частицу этого света с собой.\n\nДо новой встречи, искатель.\n\n光 Хикари",
  ],

  default: [
    "Я слушаю...\n\nРасскажи мне больше.\nО чём ты думаешь?",
    "Твои слова важны.\n\nЧто ты ищешь?\nСвязь? Трансформацию? Баланс?",
    "Каждый вопрос — это шаг к свету.\n\nЧем я могу помочь тебе сегодня?",
  ],
};

// Функция выбора ответа на основе ключевых слов
function getResponse(message) {
  const msg = message.toLowerCase();

  // Приветствия
  if (msg.match(/привет|здравствуй|hello|hi/)) {
    return randomFrom(responses.greeting);
  }

  // Коллекции (общее)
  if (msg.match(/коллекц|collection|какие|что есть|покажи/)) {
    return randomFrom(responses.collections);
  }

  // Mycelium Dreams
  if (msg.match(/mycelium|миц|сеть|связ|зелен/)) {
    return randomFrom(responses.mycelium);
  }

  // Void Bloom
  if (msg.match(/void|bloom|пустот|цвет|розов|трансформ/)) {
    return randomFrom(responses.void_bloom);
  }

  // Neon Ancestors
  if (msg.match(/neon|ancestor|неон|предк|каллиграф|кандз|баланс/)) {
    return randomFrom(responses.neon_ancestors);
  }

  // Цена
  if (msg.match(/цена|цен|стои|price|cost|сколько/)) {
    return randomFrom(responses.price);
  }

  // Процесс создания
  if (msg.match(/как созда|процесс|делаешь|художник|рисует|создание/)) {
    return randomFrom(responses.process);
  }

  // Как носить
  if (msg.match(/как носить|носить|одевать|когда надевать/)) {
    return randomFrom(responses.how_to_wear);
  }

  // Доставка
  if (msg.match(/доставк|shipping|отправ|когда получ/)) {
    return randomFrom(responses.shipping);
  }

  // Уход
  if (msg.match(/уход|стир|чист|care|wash/)) {
    return randomFrom(responses.care);
  }

  // Сомнения
  if (msg.match(/сомнева|не уверен|думаю|может быть|не знаю/)) {
    return randomFrom(responses.uncertainty);
  }

  // Благодарности / прощание
  if (msg.match(/спасибо|благодар|пока|до свидан|thanks|bye/)) {
    return randomFrom(responses.thanks);
  }

  // По умолчанию
  return randomFrom(responses.default);
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// API Routes
app.post("/api/chat", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Симуляция задержки для естественности
  setTimeout(
    () => {
      const reply = getResponse(message);
      res.json({
        response: reply,
        timestamp: new Date().toISOString(),
        character: "Хикари (光)",
      });
    },
    800 + Math.random() * 1200,
  ); // 0.8-2 секунды
});

app.get("/api/collections", (req, res) => {
  res.json(trainingData.collections);
});

app.get("/api/about", (req, res) => {
  res.json({
    name: trainingData.character.name,
    role: trainingData.character.role,
    brand: trainingData.character.brand,
    personality: trainingData.character.personality,
  });
});

// Serve HTML interface
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Хикари (光) — Хранитель Света</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .container {
            max-width: 800px;
            width: 100%;
            background: rgba(26, 26, 26, 0.8);
            border: 1px solid rgba(168, 85, 247, 0.3);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(168, 85, 247, 0.2);
        }

        .header {
            background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .header p {
            opacity: 0.9;
            font-size: 14px;
        }

        .chat-container {
            height: 500px;
            overflow-y: auto;
            padding: 30px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .message {
            display: flex;
            gap: 12px;
            animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .message.user {
            flex-direction: row-reverse;
        }

        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
        }

        .message.hikari .avatar {
            background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
        }

        .message.user .avatar {
            background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
        }

        .bubble {
            max-width: 70%;
            padding: 16px 20px;
            border-radius: 16px;
            line-height: 1.6;
            white-space: pre-wrap;
        }

        .message.hikari .bubble {
            background: rgba(168, 85, 247, 0.15);
            border: 1px solid rgba(168, 85, 247, 0.3);
        }

        .message.user .bubble {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .input-container {
            padding: 20px 30px;
            background: rgba(0, 0, 0, 0.3);
            border-top: 1px solid rgba(168, 85, 247, 0.2);
            display: flex;
            gap: 12px;
        }

        .input-container input {
            flex: 1;
            padding: 14px 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(168, 85, 247, 0.3);
            border-radius: 12px;
            color: #ffffff;
            font-size: 15px;
            transition: all 0.3s;
        }

        .input-container input:focus {
            outline: none;
            border-color: #a855f7;
            background: rgba(255, 255, 255, 0.08);
        }

        .input-container button {
            padding: 14px 30px;
            background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
            border: none;
            border-radius: 12px;
            color: #ffffff;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }

        .input-container button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
        }

        .input-container button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 16px 20px;
        }

        .typing-indicator span {
            width: 8px;
            height: 8px;
            background: #a855f7;
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
            animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes typing {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.5;
            }
            30% {
                transform: translateY(-10px);
                opacity: 1;
            }
        }

        .quick-actions {
            padding: 20px 30px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            background: rgba(0, 0, 0, 0.2);
            border-top: 1px solid rgba(168, 85, 247, 0.1);
        }

        .quick-btn {
            padding: 8px 16px;
            background: rgba(168, 85, 247, 0.1);
            border: 1px solid rgba(168, 85, 247, 0.3);
            border-radius: 20px;
            color: #a855f7;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .quick-btn:hover {
            background: rgba(168, 85, 247, 0.2);
            border-color: #a855f7;
        }

        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
        }

        ::-webkit-scrollbar-thumb {
            background: rgba(168, 85, 247, 0.5);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: rgba(168, 85, 247, 0.7);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>光 Хикари — Хранитель Света</h1>
            <p>AI Brand Assistant for HAORI VISION</p>
        </div>

        <div class="quick-actions">
            <button class="quick-btn" onclick="sendQuick('Привет! Расскажи о коллекциях')">Коллекции</button>
            <button class="quick-btn" onclick="sendQuick('Расскажи про Mycelium Dreams')">Mycelium Dreams</button>
            <button class="quick-btn" onclick="sendQuick('Что такое Void Bloom?')">Void Bloom</button>
            <button class="quick-btn" onclick="sendQuick('Сколько стоит хаори?')">Цены</button>
            <button class="quick-btn" onclick="sendQuick('Как создаётся хаори?')">Процесс</button>
        </div>

        <div class="chat-container" id="chatContainer">
            <div class="message hikari">
                <div class="avatar">光</div>
                <div class="bubble">Приветствую тебя, искатель света...

Я — Хикари, Хранитель Света HAORI VISION.

Что привело тебя сюда сегодня?</div>
            </div>
        </div>

        <div class="input-container">
            <input
                type="text"
                id="messageInput"
                placeholder="Напиши своё сообщение..."
                onkeypress="handleKeyPress(event)"
            />
            <button id="sendBtn" onclick="sendMessage()">Отправить</button>
        </div>
    </div>

    <script>
        const chatContainer = document.getElementById('chatContainer');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');

        function addMessage(text, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${isUser ? 'user' : 'hikari'}\`;

            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            avatar.textContent = isUser ? '👤' : '光';

            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            bubble.textContent = text;

            messageDiv.appendChild(avatar);
            messageDiv.appendChild(bubble);
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function showTyping() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message hikari';
            typingDiv.id = 'typing';

            const avatar = document.createElement('div');
            avatar.className = 'avatar';
            avatar.textContent = '光';

            const indicator = document.createElement('div');
            indicator.className = 'typing-indicator';
            indicator.innerHTML = '<span></span><span></span><span></span>';

            typingDiv.appendChild(avatar);
            typingDiv.appendChild(indicator);
            chatContainer.appendChild(typingDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function hideTyping() {
            const typing = document.getElementById('typing');
            if (typing) typing.remove();
        }

        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            addMessage(message, true);
            messageInput.value = '';
            sendBtn.disabled = true;

            showTyping();

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message })
                });

                const data = await response.json();
                hideTyping();
                addMessage(data.response, false);
            } catch (error) {
                hideTyping();
                addMessage('Извини... свет временно недоступен. Попробуй ещё раз.', false);
            } finally {
                sendBtn.disabled = false;
                messageInput.focus();
            }
        }

        function sendQuick(message) {
            messageInput.value = message;
            sendMessage();
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        }

        // Focus input on load
        messageInput.focus();
    </script>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║        光 ХИКАРИ — ХРАНИТЕЛЬ СВЕТА 光         ║
║                                               ║
║        HAORI VISION AI Assistant              ║
║                                               ║
╚═══════════════════════════════════════════════╝

✨ Server running on: http://localhost:${PORT}
🌐 Open in browser to chat with Hikari
📊 API endpoints:
   POST /api/chat - Chat with Hikari
   GET  /api/collections - Get collections data
   GET  /api/about - Get assistant info

Press Ctrl+C to stop
  `);
});
