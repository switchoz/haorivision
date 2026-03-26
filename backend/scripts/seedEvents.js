/**
 * Seed events for HAORI VISION
 * Run: node scripts/seedEvents.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Event from "../models/Event.js";

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/haorivision";

const events = [
  {
    slug: "glow-ritual-moscow-2026",
    name: "Glow Ritual: Пробуждение",
    tagline: "Трансформирующий перформанс света и тени",
    type: "ritual",
    status: "announced",
    venue: {
      name: "Mutabor",
      address: "ул. Автозаводская 18",
      city: "Москва",
      country: "Россия",
      capacity: 120,
    },
    dates: {
      announced: new Date("2026-03-01"),
      start: new Date("2026-05-15T20:00:00"),
      end: new Date("2026-05-15T21:30:00"),
      doors: new Date("2026-05-15T19:30:00"),
      ritual: new Date("2026-05-15T20:00:00"),
    },
    performance: {
      scenario: {
        phase1: {
          name: "Тьма",
          duration: 15,
          description:
            "Погружение в темноту. Гости входят в пространство при свечах. Ambient музыка создаёт медитативное состояние.",
          lighting: "Только свечи и minimal ambient lighting",
          music: "Deep ambient / drone / meditation",
        },
        phase2: {
          name: "Свечение",
          duration: 30,
          description:
            "UV-активация. Включаются UV-лампы, хаори начинают светиться. Перформанс с движением и светом.",
          lighting: "UV blacklight 365nm + strobes",
          music: "Electronic / experimental / ethereal",
        },
        phase3: {
          name: "Пробуждение",
          duration: 20,
          description:
            "Возвращение к свету. Плавный переход к дневному свету. Интеграция опыта.",
          lighting: "Постепенное включение дневного света",
          music: "Uplifting ambient / post-rock",
        },
      },
      totalDuration: 65,
    },
    ambiance: {
      playlist: [
        {
          artist: "Brian Eno",
          track: "An Ending (Ascent)",
          phase: "phase1",
        },
        {
          artist: "Jon Hopkins",
          track: "Emerald Rush",
          phase: "phase2",
        },
        {
          artist: "Nils Frahm",
          track: "Says",
          phase: "phase3",
        },
      ],
      lighting: {
        daylight: "Warm 3000K ambient",
        uv: "UV blacklight 365nm",
        blackout: "Complete darkness with candles",
      },
      dress_code: "HAORI VISION pieces / all black / UV-reactive",
      vibes: ["meditative", "transformative", "ethereal", "immersive"],
    },
    attendance: {
      capacity: 120,
      registered: 47,
      attended: 0,
      waitlist: 3,
    },
    media: {
      coverImage: "",
      gallery: [],
    },
    description: {
      short:
        "Иммерсивный Glow Ritual в пространстве Mutabor. 65 минут трансформации через свет, звук и UV-искусство.",
      long: "Первый масштабный Glow Ritual от HAORI VISION в Москве. Три фазы перформанса — от полной темноты через UV-свечение к пробуждению. Каждый участник станет частью светового ритуала.",
    },
    featured: true,
    certificate: true,
  },
  {
    slug: "uv-art-exhibition-spb",
    name: "UV Art: Скрытые Измерения",
    tagline: "Выставка флуоресцентного искусства LiZa",
    type: "exhibition",
    status: "announced",
    venue: {
      name: "Севкабель Порт",
      address: "Кожевенная линия 40",
      city: "Санкт-Петербург",
      country: "Россия",
      capacity: 200,
    },
    dates: {
      announced: new Date("2026-03-10"),
      start: new Date("2026-06-20T18:00:00"),
      end: new Date("2026-06-20T22:00:00"),
      doors: new Date("2026-06-20T17:30:00"),
      ritual: new Date("2026-06-20T19:00:00"),
    },
    performance: {
      scenario: {
        phase1: {
          name: "Открытие",
          duration: 20,
          description:
            "Приветствие гостей, знакомство с коллекцией при дневном свете.",
          lighting: "Дневной свет + spotlight на экспонаты",
          music: "Lounge / downtempo",
        },
        phase2: {
          name: "UV-демонстрация",
          duration: 40,
          description:
            "Демонстрация UV-эффектов. Интерактивная зона с UV-лампами.",
          lighting: "UV blacklight зоны",
          music: "Electronic / chillwave",
        },
        phase3: {
          name: "Networking",
          duration: 30,
          description: "Свободное общение, фотозона, обсуждение работ.",
          lighting: "Смешанный свет",
          music: "Ambient / lounge",
        },
      },
      totalDuration: 90,
    },
    ambiance: {
      playlist: [
        {
          artist: "Bonobo",
          track: "Kerala",
          phase: "phase1",
        },
        {
          artist: "ODESZA",
          track: "A Moment Apart",
          phase: "phase2",
        },
        {
          artist: "Tycho",
          track: "Awake",
          phase: "phase3",
        },
      ],
      lighting: {
        daylight: "Warm 3000K ambient",
        uv: "UV blacklight 365nm",
        blackout: "Complete darkness with candles",
      },
      dress_code: "Smart casual",
      vibes: ["creative", "immersive", "social", "inspiring"],
    },
    attendance: {
      capacity: 200,
      registered: 82,
      attended: 0,
      waitlist: 0,
    },
    media: {
      coverImage: "",
      gallery: [],
    },
    description: {
      short:
        "Масштабная выставка UV-арта в Севкабель Порту. Живопись, хаори и интерактивные инсталляции.",
      long: "Первая персональная выставка LiZa в Санкт-Петербурге. Более 30 работ — от холстов до хаори — представлены в двух режимах: при дневном свете и под ультрафиолетом. Интерактивная зона позволяет гостям самим раскрывать скрытые слои произведений.",
    },
    featured: true,
    certificate: false,
  },
  {
    slug: "haori-workshop-kazan",
    name: "Мастер-класс: Интуитивная UV-живопись",
    tagline: "Создай свой первый UV-артефакт вместе с LiZa",
    type: "workshop",
    status: "announced",
    venue: {
      name: "Штаб",
      address: "ул. Карла Маркса 26",
      city: "Казань",
      country: "Россия",
      capacity: 25,
    },
    dates: {
      announced: new Date("2026-03-15"),
      start: new Date("2026-07-10T14:00:00"),
      end: new Date("2026-07-10T15:30:00"),
      doors: new Date("2026-07-10T13:30:00"),
      ritual: new Date("2026-07-10T14:00:00"),
    },
    performance: {
      scenario: {
        phase1: {
          name: "Введение",
          duration: 10,
          description: "Объяснение техники, знакомство с материалами.",
          lighting: "Рабочий дневной свет",
          music: "Soft instrumental",
        },
        phase2: {
          name: "Практика",
          duration: 60,
          description: "Создание своей работы под руководством художника.",
          lighting: "Яркий рабочий свет",
          music: "Focus / lo-fi beats",
        },
        phase3: {
          name: "Результат",
          duration: 20,
          description: "Просмотр работ участников, UV-тестирование.",
          lighting: "UV blacklight для проверки",
          music: "Celebratory ambient",
        },
      },
      totalDuration: 90,
    },
    ambiance: {
      playlist: [
        {
          artist: "Mammal Hands",
          track: "Quiet Fire",
          phase: "phase1",
        },
        {
          artist: "Chillhop Music",
          track: "Lo-fi Study Mix",
          phase: "phase2",
        },
      ],
      lighting: {
        daylight: "Warm 3000K ambient",
        uv: "UV blacklight 365nm",
        blackout: "N/A",
      },
      dress_code: "Удобная одежда (может испачкаться красками)",
      vibes: ["creative", "hands-on", "educational", "fun"],
    },
    attendance: {
      capacity: 25,
      registered: 18,
      attended: 0,
      waitlist: 5,
    },
    media: {
      coverImage: "",
      gallery: [],
    },
    description: {
      short:
        "Практический мастер-класс по интуитивной живописи с UV-пигментами. 90 минут творчества.",
      long: "LiZa проведёт мастер-класс по технике интуитивной живописи с использованием UV-флуоресцентных пигментов. Каждый участник создаст свою работу и увидит её преображение под ультрафиолетом. Все материалы включены.",
    },
    featured: false,
    certificate: true,
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const existingEvents = await Event.countDocuments();
  if (existingEvents === 0) {
    await Event.insertMany(events);
    console.log(`Inserted ${events.length} events`);
  } else {
    console.log(`Events already exist (${existingEvents}), skipping`);
  }

  await mongoose.disconnect();
  console.log("Done");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
