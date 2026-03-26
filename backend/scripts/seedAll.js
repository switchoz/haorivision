/**
 * Seed all data to production database
 * Run after first deploy: node scripts/seedAll.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import BlogPost from "../models/BlogPost.js";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Event from "../models/Event.js";

const MONGO =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/haorivision";

const blogPosts = [
  {
    slug: "kak-rozhdaetsya-haori",
    title: "Как рождается хаори: от эскиза до UV-свечения",
    excerpt: "Заглянем в мастерскую LiZa и проследим путь создания хаори.",
    content:
      "## Интуитивный поток\n\nКаждое хаори начинается не с эскиза — а с состояния. Елизавета входит в потоковое состояние, где линия ведёт сама.\n\n## Перенос на ткань\n\nОрнаменты адаптируются под форму хаори. Многослойная роспись вручную.\n\n## UV-слой\n\nФлуоресцентные пигменты наносятся поверх основного рисунка. Только под ультрафиолетом хаори раскрывает свою вторую жизнь.",
    coverImage: "/artist/page4_img1.jpeg",
    tags: ["процесс", "UV", "мастерская"],
    published: true,
    publishedAt: new Date("2026-02-15"),
    author: "LiZa",
  },
  {
    slug: "chto-takoe-uv-art",
    title: "Что такое UV-арт и почему это будущее моды",
    excerpt: "Флуоресцентные пигменты и носимое искусство.",
    content:
      "## Свет как материал\n\nUV-арт — направление, где свет становится материалом художника.\n\n## Двойная жизнь одежды\n\nДнём элегантное пальто. Под UV — живое произведение.",
    coverImage: "/artist/page26_img1.jpeg",
    tags: ["UV", "технология", "мода"],
    published: true,
    publishedAt: new Date("2026-02-28"),
    author: "LiZa",
  },
  {
    slug: "filosofiya-nosimogo-sveta",
    title: "Философия носимого света: манифест HAORI VISION",
    excerpt: "Почему одежда может быть порталом.",
    content:
      "## Свет спрятан внутри\n\nКак флуоресцентные узоры на чёрном шёлке.\n\n## Ритуал ношения\n\nНадевать хаори — осознанный акт.",
    coverImage: "/artist/page3_img1.jpeg",
    tags: ["философия", "бренд"],
    published: true,
    publishedAt: new Date("2026-03-10"),
    author: "LiZa",
  },
  {
    slug: "intuitivnaya-zhivopis",
    title: "Интуитивная живопись: как рисовать без плана",
    excerpt: "О потоковом состоянии и искусстве отпустить контроль.",
    content:
      "## Что такое интуитивная живопись\n\nМетод, при котором художник не планирует композицию заранее.\n\n## От холста к хаори\n\nХолст статичен — хаори живёт.",
    coverImage: "/artist/page2_img1.jpeg",
    tags: ["живопись", "техника"],
    published: true,
    publishedAt: new Date("2026-03-20"),
    author: "LiZa",
  },
  {
    slug: "bespoke-kak-eto-rabotaet",
    title: "Bespoke: как заказать персональное хаори",
    excerpt: "Пошаговый гид от консультации до готового произведения.",
    content:
      "## Шаг 1: Заявка\n\nРасскажите о себе.\n\n## Шаг 2: Консультация\n\nLiZa свяжется лично.\n\n## Шаг 3: Создание\n\n2–4 недели ручной работы.\n\n**Стоимость:** от €3,000.",
    coverImage: "/artist/haori-presentation.jpg",
    tags: ["bespoke", "заказ"],
    published: true,
    publishedAt: new Date("2026-03-24"),
    author: "HAORI VISION",
  },
];

const reviews = [
  {
    name: "Анна К.",
    city: "Москва",
    rating: 5,
    text: "Невероятное ощущение — носить произведение искусства.",
    productName: "Хаори «Космическое Древо»",
    approved: true,
    featured: true,
  },
  {
    name: "Дмитрий В.",
    city: "Санкт-Петербург",
    rating: 5,
    text: "Заказывал bespoke хаори. LiZa реально чувствует энергию.",
    productName: "Bespoke «Портал»",
    approved: true,
    featured: true,
  },
  {
    name: "Мария С.",
    city: "Краснодар",
    rating: 5,
    text: "Купила куртку из Armor. Качество росписи безумное.",
    productName: "Куртка «Звёздный Воин»",
    approved: true,
    featured: true,
  },
  {
    name: "Алексей Т.",
    city: "Казань",
    rating: 5,
    text: "Это не одежда, это артефакт. UV-свечение — отдельная тема.",
    productName: "Хаори «Ночной Странник»",
    approved: true,
    featured: true,
  },
  {
    name: "Екатерина Л.",
    city: "Новосибирск",
    rating: 4,
    text: "Очень красивая работа. Ремень — шедевр.",
    productName: "Ремень «Путь Самурая»",
    approved: true,
    featured: false,
  },
  {
    name: "Олег Р.",
    city: "Москва",
    rating: 5,
    text: "Третья покупка у HAORI VISION. Каждая вещь уникальна.",
    approved: true,
    featured: true,
  },
  {
    name: "Ирина М.",
    city: "Екатеринбург",
    rating: 5,
    text: "Подарила мужу. Когда включили UV-лампу — магия.",
    productName: "Куртка «Тёмный Рыцарь»",
    approved: true,
    featured: false,
  },
  {
    name: "Наталья Ф.",
    city: "Сочи",
    rating: 5,
    text: "Заказала сумку Wanderer. Под UV — артефакт из фантастики.",
    productName: "Сумка «Лунный Путник»",
    approved: true,
    featured: true,
  },
];

const haoriProduct = {
  id: "haori-dark-original",
  name: "DARK — Первое Хаори",
  productCollection: "Оригинальная коллекция",
  tagline: "Днём — одежда. Ночью — портал.",
  description: {
    short: "Первое хаори HAORI VISION. Ручная роспись UV-реактивными красками.",
    long: "DARK — первое хаори от Елизаветы Федькиной. Единственный экземпляр. Подпись LiZa. Сертификат подлинности.",
  },
  price: 3500,
  currency: "EUR",
  images: {
    daylight: {
      hero: "/artist/haori-presentation.jpg",
      haori: "/artist/haori-presentation.jpg",
      canvas: "/artist/haori-presentation.jpg",
    },
    uv: {
      hero: "/artist/haori-dark-uv.jpg",
      haori: "/artist/haori-dark-uv.jpg",
      canvas: "/artist/haori-dark-uv.jpg",
    },
  },
  editions: { total: 1, remaining: 1, sold: 0 },
  uvColors: ["#ff00b4", "#8b00ff", "#00ffcc"],
  techniques: ["Ручная роспись", "UV-реактивные пигменты"],
  materials: ["Премиум текстиль", "Флуоресцентные пигменты"],
  category: "haori",
  status: "available",
  featured: true,
  artist: {
    name: "Елизавета Федькина (LiZa)",
    signature: "LiZa",
    bio: "Интуитивная живопись — «Картины из будущего».",
  },
};

const events = [
  {
    title: "Glow Ritual: Пробуждение",
    slug: "glow-ritual-2026",
    type: "ritual",
    status: "announced",
    featured: true,
    date: new Date("2026-05-15T19:00:00+03:00"),
    venue: {
      name: "Mutabor",
      city: "Москва",
      address: "ул. Павла Андреева, 28с7",
    },
    description: "Первый UV-ритуал HAORI VISION. Иммерсивное шоу.",
    maxAttendees: 100,
  },
  {
    title: "UV Art: Скрытые Измерения",
    slug: "uv-art-exhibition-2026",
    type: "exhibition",
    status: "announced",
    featured: true,
    date: new Date("2026-06-20T18:00:00+03:00"),
    venue: { name: "Севкабель Порт", city: "Санкт-Петербург" },
    description: "Выставка UV-арта.",
    maxAttendees: 200,
  },
  {
    title: "Мастер-класс: Интуитивная UV-живопись",
    slug: "masterclass-kazan-2026",
    type: "workshop",
    status: "announced",
    featured: false,
    date: new Date("2026-07-10T14:00:00+03:00"),
    venue: { name: "Штаб", city: "Казань" },
    description: "Мастер-класс с LiZa.",
    maxAttendees: 20,
  },
];

async function seed() {
  await mongoose.connect(MONGO);
  console.log("Connected");

  if ((await BlogPost.countDocuments()) === 0) {
    await BlogPost.insertMany(blogPosts);
    console.log("Blog: +5");
  }
  if ((await Review.countDocuments()) === 0) {
    await Review.insertMany(reviews);
    console.log("Reviews: +8");
  }
  if (!(await Product.findOne({ id: "haori-dark-original" }))) {
    await Product.create(haoriProduct);
    console.log("DARK haori added");
  }
  if ((await Event.countDocuments()) === 0) {
    await Event.insertMany(events);
    console.log("Events: +3");
  }

  console.log("Seed complete");
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
