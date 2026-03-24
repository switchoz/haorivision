#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(__dirname, '../photo');
const targetDir = path.join(__dirname, '../frontend/public/images/gallery');

// Правила категоризации
const categories = {
  haori: {
    patterns: ['haori'],
    folder: 'haori',
    name: 'Хаори'
  },
  scarves: {
    patterns: ['scarf'],
    folder: 'scarves',
    name: 'Шарфы'
  },
  caps: {
    patterns: ['cap'],
    folder: 'caps',
    name: 'Кепки'
  },
  robes: {
    patterns: ['robe'],
    folder: 'robes',
    name: 'Халаты'
  },
  sneakers: {
    patterns: ['sneaker'],
    folder: 'sneakers',
    name: 'Кеды'
  },
  jeans: {
    patterns: ['jeans', 'denim_pants'],
    folder: 'jeans',
    name: 'Джинсы'
  },
  jackets: {
    patterns: ['jacket', 'coat', 'bomber'],
    folder: 'jackets',
    name: 'Куртки'
  },
  hoodies: {
    patterns: ['hoodie'],
    folder: 'hoodies',
    name: 'Худи'
  },
  bags: {
    patterns: ['bag'],
    folder: 'bags',
    name: 'Сумки'
  },
  belts: {
    patterns: ['belt'],
    folder: 'belts',
    name: 'Ремни'
  },
  workspace: {
    patterns: ['workspace'],
    folder: 'workspace',
    name: 'Студия'
  }
};

function categorizeFile(filename) {
  const lowerName = filename.toLowerCase();

  for (const [key, cat] of Object.entries(categories)) {
    for (const pattern of cat.patterns) {
      if (lowerName.includes(pattern)) {
        return cat;
      }
    }
  }
  return null;
}

function generateNiceName(filename, index, categoryName) {
  const ext = path.extname(filename);
  const num = String(index + 1).padStart(2, '0');
  return `${categoryName.toLowerCase()}-${num}${ext}`;
}

async function organizeGallery() {
  console.log('🎨 Организация галереи HAORI VISION...\n');

  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Папка ${sourceDir} не найдена`);
    return;
  }

  const files = fs.readdirSync(sourceDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

  console.log(`📸 Найдено изображений: ${files.length}\n`);

  const stats = {};

  for (const category of Object.values(categories)) {
    stats[category.folder] = { count: 0, files: [] };
  }

  // Группировка файлов
  files.forEach(file => {
    const category = categorizeFile(file);
    if (category) {
      stats[category.folder].files.push(file);
    }
  });

  // Копирование и переименование
  for (const [folder, data] of Object.entries(stats)) {
    if (data.files.length === 0) continue;

    const categoryInfo = Object.values(categories).find(c => c.folder === folder);
    const targetFolder = path.join(targetDir, folder);

    console.log(`📁 ${categoryInfo.name} (${folder}): ${data.files.length} файлов`);

    data.files.forEach((file, index) => {
      const sourcePath = path.join(sourceDir, file);
      const niceName = generateNiceName(file, index, folder);
      const targetPath = path.join(targetFolder, niceName);

      try {
        fs.copyFileSync(sourcePath, targetPath);
        stats[folder].count++;
        console.log(`   ✓ ${niceName}`);
      } catch (err) {
        console.error(`   ✗ Ошибка при копировании ${file}:`, err.message);
      }
    });
    console.log('');
  }

  // Итоги
  console.log('═'.repeat(50));
  console.log('✅ ЗАВЕРШЕНО\n');
  console.log('Статистика по категориям:');

  let total = 0;
  for (const [folder, data] of Object.entries(stats)) {
    if (data.count > 0) {
      const categoryInfo = Object.values(categories).find(c => c.folder === folder);
      console.log(`  ${categoryInfo.name}: ${data.count} изображений`);
      total += data.count;
    }
  }

  console.log(`\n📊 Всего скопировано: ${total} изображений`);
  console.log(`\n📂 Местоположение: frontend/public/images/gallery/\n`);
}

organizeGallery().catch(console.error);
