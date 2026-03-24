#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const galleryDir = path.join(__dirname, '../frontend/public/images/gallery');
const outputFile = path.join(__dirname, '../frontend/src/data/gallery-products.json');

// Креативные названия в стиле HAORI VISION
const productNames = {
  haori: [
    { name: 'Шёпот Сакуры', tagline: 'Весенние лепестки в вечности', en: 'Sakura Whisper' },
    { name: 'Дракон Рассвета', tagline: 'Мифический страж нового дня', en: 'Dawn Dragon' },
    { name: 'Лунный Храм', tagline: 'Священная геометрия ночи', en: 'Lunar Temple' },
    { name: 'Волны Эдо', tagline: 'Традиция в движении', en: 'Edo Waves' },
    { name: 'Сны Гейши', tagline: 'Элегантность прошлого', en: 'Geisha Dreams' },
    { name: 'Феникс Осени', tagline: 'Возрождение в огне листвы', en: 'Autumn Phoenix' },
    { name: 'Туман Киото', tagline: 'Древний город в утренней дымке', en: 'Kyoto Mist' },
    { name: 'Бамбуковый Ветер', tagline: 'Шелест силы и гибкости', en: 'Bamboo Wind' },
    { name: 'Кои в Звёздах', tagline: 'Карпы плывут сквозь космос', en: 'Koi Among Stars' },
    { name: 'Самурай Теней', tagline: 'Благородство в темноте', en: 'Shadow Samurai' },
    { name: 'Цветение Кобры', tagline: 'Опасная красота природы', en: 'Cobra Blossom' },
    { name: 'Тигр Ночи', tagline: 'Дикая элегантность', en: 'Night Tiger' },
    { name: 'Сокровище Императора', tagline: 'Королевское достоинство', en: 'Emperor\'s Treasure' }
  ],
  scarves: [
    { name: 'Шёлковый Дождь', tagline: 'Капли роскоши', en: 'Silk Rain' },
    { name: 'Огонь Танца', tagline: 'Пламенная грация', en: 'Dance Fire' },
    { name: 'Облако Мечты', tagline: 'Воздушная невесомость', en: 'Dream Cloud' },
    { name: 'Морской Бриз', tagline: 'Свежесть океана', en: 'Sea Breeze' },
    { name: 'Закатный Горизонт', tagline: 'Краски уходящего дня', en: 'Sunset Horizon' },
    { name: 'Лесной Эфир', tagline: 'Дух древних деревьев', en: 'Forest Ether' },
    { name: 'Пустынная Роза', tagline: 'Красота в суровости', en: 'Desert Rose' },
    { name: 'Ледяной Кристалл', tagline: 'Прозрачная чистота', en: 'Ice Crystal' }
  ],
  caps: [
    { name: 'Уличный Самурай', tagline: 'Воин городских джунглей', en: 'Street Samurai' },
    { name: 'Токийский Шифр', tagline: 'Код мегаполиса', en: 'Tokyo Cipher' },
    { name: 'Ночной Охотник', tagline: 'Тень в неоне', en: 'Night Hunter' },
    { name: 'Киберпанк Дракон', tagline: 'Будущее встречает традицию', en: 'Cyberpunk Dragon' }
  ],
  robes: [
    { name: 'Храм Спокойствия', tagline: 'Дзен в каждой нити', en: 'Temple of Tranquility' },
    { name: 'Королевский Покой', tagline: 'Императорская роскошь дома', en: 'Royal Rest' },
    { name: 'Облачный Дворец', tagline: 'Небесный комфорт', en: 'Cloud Palace' }
  ],
  sneakers: [
    { name: 'Неоновый Спринт', tagline: 'Скорость света под ногами', en: 'Neon Sprint' },
    { name: 'Граффити Души', tagline: 'Искусство в движении', en: 'Soul Graffiti' },
    { name: 'Урбан Дракон', tagline: 'Мифический streetwear', en: 'Urban Dragon' },
    { name: 'Ночной Бег', tagline: 'Тень, которая летает', en: 'Midnight Run' },
    { name: 'Киберкои', tagline: 'Цифровые карпы', en: 'Cyber Koi' }
  ],
  jeans: [
    { name: 'Деним Самурая', tagline: 'Броня современного воина', en: 'Samurai Denim' },
    { name: 'Индиго Восток', tagline: 'Японская глубина цвета', en: 'Indigo East' },
    { name: 'Селвидж Легенда', tagline: 'Традиция в каждом шве', en: 'Selvedge Legend' },
    { name: 'Токийская Потёртость', tagline: 'Урбанистичный характер', en: 'Tokyo Fade' },
    { name: 'Деним Феникса', tagline: 'Возрождение классики', en: 'Phoenix Denim' },
    { name: 'Ночной Индиго', tagline: 'Тёмная элегантность', en: 'Night Indigo' },
    { name: 'Драконья Нить', tagline: 'Сила в текстуре', en: 'Dragon Thread' },
    { name: 'Киото Селвидж', tagline: 'Древний город в ткани', en: 'Kyoto Selvedge' },
    { name: 'Волна Денима', tagline: 'Поток традиций', en: 'Denim Wave' },
    { name: 'Синий Самурай', tagline: 'Честь в каждом волокне', en: 'Blue Samurai' },
    { name: 'Огонь Индиго', tagline: 'Страсть в синем', en: 'Indigo Fire' },
    { name: 'Деним Дзен', tagline: 'Просветление в простоте', en: 'Zen Denim' }
  ],
  jackets: [
    { name: 'Доспех Дракона', tagline: 'Защита легенды', en: 'Dragon Armor' },
    { name: 'Ночной Страж', tagline: 'Тень, что согревает', en: 'Night Guardian' },
    { name: 'Токийский Ветер', tagline: 'Дыхание мегаполиса', en: 'Tokyo Wind' },
    { name: 'Самурай Улиц', tagline: 'Современный воин', en: 'Street Samurai' },
    { name: 'Огонь Востока', tagline: 'Пламя традиций', en: 'Eastern Fire' },
    { name: 'Тень Феникса', tagline: 'Возрождение в стиле', en: 'Phoenix Shadow' },
    { name: 'Урбан Ронин', tagline: 'Странник города', en: 'Urban Ronin' },
    { name: 'Киберяпония', tagline: 'Будущее наследие', en: 'Cyber Nippon' },
    { name: 'Император Улиц', tagline: 'Королевский streetwear', en: 'Street Emperor' }
  ],
  hoodies: [
    { name: 'Комфорт Ниндзя', tagline: 'Тихая сила', en: 'Ninja Comfort' },
    { name: 'Облако Токио', tagline: 'Мягкость мегаполиса', en: 'Tokyo Cloud' },
    { name: 'Уютный Дракон', tagline: 'Мифический relax', en: 'Cozy Dragon' }
  ],
  bags: [
    { name: 'Странник Душ', tagline: 'Носитель историй', en: 'Soul Wanderer' },
    { name: 'Токийский Портал', tagline: 'Врата в другой мир', en: 'Tokyo Portal' },
    { name: 'Сумка Самурая', tagline: 'Благородная ноша', en: 'Samurai Bag' }
  ],
  belts: [
    { name: 'Драконий Пояс', tagline: 'Сила в деталях', en: 'Dragon Belt' },
    { name: 'Обручье Чести', tagline: 'Символ достоинства', en: 'Honor Band' },
    { name: 'Ночная Застёжка', tagline: 'Тёмная элегантность', en: 'Night Clasp' },
    { name: 'Путь Самурая', tagline: 'Завершающий штрих воина', en: 'Samurai Path' }
  ]
};

// Коллекции для продуктов
const collections = {
  haori: 'Коллекция Haori Heritage',
  scarves: 'Коллекция Silk Stories',
  caps: 'Коллекция Urban Legends',
  robes: 'Коллекция Zen Comfort',
  sneakers: 'Коллекция Street Art',
  jeans: 'Коллекция Denim Dynasty',
  jackets: 'Коллекция Armor Collection',
  hoodies: 'Коллекция Cozy Spirits',
  bags: 'Коллекция Wanderer Series',
  belts: 'Коллекция Detail Masters'
};

// Категории с метаданными
const categories = {
  haori: {
    name: 'Хаори',
    nameEn: 'Haori',
    description: 'Традиционная японская верхняя одежда',
    basePrice: 450,
    priceVariation: 200,
    type: 'haori-only'
  },
  scarves: {
    name: 'Шарфы',
    nameEn: 'Scarves',
    description: 'Премиум шарфы и платки',
    basePrice: 120,
    priceVariation: 80,
    type: 'accessories'
  },
  caps: {
    name: 'Кепки',
    nameEn: 'Caps',
    description: 'Головные уборы streetwear',
    basePrice: 65,
    priceVariation: 35,
    type: 'accessories'
  },
  robes: {
    name: 'Халаты',
    nameEn: 'Robes',
    description: 'Домашняя одежда премиум класса',
    basePrice: 280,
    priceVariation: 120,
    type: 'loungewear'
  },
  sneakers: {
    name: 'Кеды',
    nameEn: 'Sneakers',
    description: 'Кастомная обувь',
    basePrice: 220,
    priceVariation: 100,
    type: 'footwear'
  },
  jeans: {
    name: 'Джинсы',
    nameEn: 'Jeans',
    description: 'Японский деним',
    basePrice: 320,
    priceVariation: 150,
    type: 'bottoms'
  },
  jackets: {
    name: 'Куртки',
    nameEn: 'Jackets',
    description: 'Дизайнерская верхняя одежда',
    basePrice: 580,
    priceVariation: 250,
    type: 'outerwear'
  },
  hoodies: {
    name: 'Худи',
    nameEn: 'Hoodies',
    description: 'Премиум streetwear',
    basePrice: 180,
    priceVariation: 70,
    type: 'streetwear'
  },
  bags: {
    name: 'Сумки',
    nameEn: 'Bags',
    description: 'Функциональные аксессуары',
    basePrice: 390,
    priceVariation: 180,
    type: 'accessories'
  },
  belts: {
    name: 'Ремни',
    nameEn: 'Belts',
    description: 'Стильные аксессуары',
    basePrice: 95,
    priceVariation: 45,
    type: 'accessories'
  }
};

function generateProduct(category, filename, index) {
  const cat = categories[category];
  const productInfo = productNames[category][index];
  const numStr = String(index + 1).padStart(3, '0');
  const price = cat.basePrice + Math.floor(Math.random() * cat.priceVariation);

  return {
    id: `real-${category}-${numStr}`,
    name: productInfo.name,
    collection: collections[category],
    type: cat.type,
    tagline: productInfo.tagline,
    price: price,
    currency: 'USD',
    editions: {
      total: 1,
      remaining: 1,
      numbered: true
    },
    images: {
      daylight: {
        hero: `/images/gallery/${category}/${category}-${String(index + 1).padStart(2, '0')}-medium.jpg`,
        haori: `/images/gallery/${category}/${category}-${String(index + 1).padStart(2, '0')}-medium.jpg`,
        canvas: `/images/gallery/${category}/${category}-${String(index + 1).padStart(2, '0')}.jpg`
      },
      uv: {
        hero: `/images/gallery/${category}/${category}-${String(index + 1).padStart(2, '0')}-thumb.jpg`,
        haori: `/images/gallery/${category}/${category}-${String(index + 1).padStart(2, '0')}-thumb.jpg`,
        canvas: `/images/gallery/${category}/${category}-${String(index + 1).padStart(2, '0')}-thumb.jpg`
      }
    },
    description: {
      short: `${productInfo.name} - ${productInfo.tagline.toLowerCase()}. Уникальное произведение ручной работы.`,
      full: `${productInfo.name} воплощает философию HAORI VISION - слияние традиционного японского мастерства с современной эстетикой. ${productInfo.tagline}. Каждая вещь создаётся вручную и существует в единственном экземпляре, делая владельца частью эксклюзивного сообщества ценителей истинного искусства.`
    },
    specifications: getSpecifications(category),
    tags: getTags(category, productInfo.name),
    featured: index < 2,
    status: 'available',
    uvColors: [],
    realPhoto: true
  };
}

function getSpecifications(category) {
  const specs = {
    haori: {
      haori: {
        material: 'Премиум шёлк/хлопок',
        weight: '220-280г',
        dimensions: { length: '105см', width: '65см', sleeve: '56см' },
        sizes: ['S/M', 'L/XL'],
        technique: 'Ручная работа',
        care: 'Химчистка'
      }
    },
    scarves: {
      haori: {
        material: '100% шёлк',
        dimensions: { length: '180см', width: '70см' },
        care: 'Только химчистка'
      }
    },
    caps: {
      haori: {
        material: 'Хлопок/синтетика',
        sizes: ['One Size'],
        care: 'Ручная стирка'
      }
    },
    robes: {
      haori: {
        material: 'Премиум хлопок/шёлк',
        sizes: ['S/M', 'L/XL'],
        care: 'Деликатная стирка'
      }
    },
    sneakers: {
      haori: {
        material: 'Канвас/кожа',
        sizes: ['36-45 EU'],
        care: 'Ручная чистка'
      }
    },
    jeans: {
      haori: {
        material: '100% японский селвидж деним',
        sizes: ['28-38'],
        weight: '14 oz',
        care: 'Редкая стирка'
      }
    },
    jackets: {
      haori: {
        material: 'Премиум текстиль',
        sizes: ['S', 'M', 'L', 'XL'],
        care: 'Химчистка'
      }
    },
    hoodies: {
      haori: {
        material: 'Премиум хлопок',
        sizes: ['S', 'M', 'L', 'XL'],
        weight: '450 г/м²',
        care: 'Машинная стирка 30°C'
      }
    },
    bags: {
      haori: {
        material: '100% натуральная кожа',
        dimensions: { width: '40см', height: '30см', depth: '10см' },
        care: 'Уход за кожей'
      }
    },
    belts: {
      haori: {
        material: 'Натуральная кожа',
        sizes: ['80-100 см'],
        care: 'Уход за кожей'
      }
    }
  };
  return specs[category] || {};
}

function getTags(category, productName) {
  const baseTags = {
    haori: ['Хаори', 'Японский', 'Уникальный'],
    scarves: ['Шарф', 'Шёлк', 'Премиум'],
    caps: ['Кепка', 'Streetwear'],
    robes: ['Халат', 'Комфорт'],
    sneakers: ['Кеды', 'Кастом'],
    jeans: ['Джинсы', 'Деним'],
    jackets: ['Куртка', 'Дизайнерская'],
    hoodies: ['Худи', 'Streetwear'],
    bags: ['Сумка', 'Кожа'],
    belts: ['Ремень', 'Аксессуар']
  };

  const tags = [...baseTags[category] || []];

  if (productName.includes('Дракон')) tags.push('Дракон');
  if (productName.includes('Самурай')) tags.push('Самурай');
  if (productName.includes('Феникс')) tags.push('Феникс');
  if (productName.includes('Ночн')) tags.push('Ночной');
  if (productName.includes('Токио')) tags.push('Токио');

  return tags;
}

async function generateCatalog() {
  console.log('📦 Генерация полного каталога продуктов в стиле HAORI VISION...\n');

  const products = [];
  const categoryCounts = {};

  for (const [categoryId, categoryInfo] of Object.entries(categories)) {
    const categoryPath = path.join(galleryDir, categoryId);

    if (!fs.existsSync(categoryPath)) {
      console.log(`⚠️  Папка ${categoryId} не найдена, пропускаем...`);
      continue;
    }

    const files = fs.readdirSync(categoryPath)
      .filter(f => /\.jpg$/i.test(f))
      .filter(f => !/-thumb\.|-medium\./i.test(f))
      .sort();

    console.log(`📁 ${categoryInfo.name}: ${files.length} изображений`);

    files.forEach((file, index) => {
      const product = generateProduct(categoryId, file, index);
      products.push(product);
    });

    categoryCounts[categoryId] = files.length;
  }

  const catalog = {
    products: products,
    categories: Object.entries(categories).reduce((acc, [id, cat]) => {
      acc[id] = {
        name: cat.name,
        nameEn: cat.nameEn,
        description: cat.description,
        count: categoryCounts[id] || 0
      };
      return acc;
    }, {}),
    metadata: {
      version: '2.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      totalProducts: products.length,
      totalCategories: Object.keys(categoryCounts).length,
      priceRange: {
        min: Math.min(...products.map(p => p.price)),
        max: Math.max(...products.map(p => p.price)),
        currency: 'USD'
      }
    }
  };

  fs.writeFileSync(outputFile, JSON.stringify(catalog, null, 2), 'utf-8');

  console.log('\n' + '═'.repeat(60));
  console.log('✅ КАТАЛОГ СОЗДАН В СТИЛЕ HAORI VISION\n');
  console.log(`📊 Всего продуктов: ${products.length}`);
  console.log(`📁 Категорий: ${Object.keys(categoryCounts).length}`);
  console.log(`💰 Диапазон цен: $${catalog.metadata.priceRange.min} - $${catalog.metadata.priceRange.max}`);
  console.log(`\n💾 Файл: frontend/src/data/gallery-products.json\n`);

  console.log('Примеры названий:');
  Object.entries(productNames).forEach(([cat, names]) => {
    console.log(`  ${categories[cat].name}: ${names.slice(0, 2).map(n => n.name).join(', ')}...`);
  });
  console.log('');
}

generateCatalog().catch(console.error);
