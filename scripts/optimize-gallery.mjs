#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const galleryDir = path.join(__dirname, '../frontend/public/images/gallery');

// Размеры для оптимизации (оригиналы остаются без изменений)
const sizes = {
  thumb: { width: 400, suffix: '-thumb' },
  medium: { width: 800, suffix: '-medium' }
};

// Статистика
const stats = {
  processed: 0,
  errors: 0,
  totalOriginalSize: 0,
  totalOptimizedSize: 0
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function optimizeImage(inputPath, category) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const ext = path.extname(inputPath);

  console.log(`  📸 ${filename}${ext}`);

  try {
    const originalSize = fs.statSync(inputPath).size;
    stats.totalOriginalSize += originalSize;

    // Обработка для каждого размера
    for (const [sizeName, config] of Object.entries(sizes)) {
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      // Изменяем размер только если изображение больше целевого
      if (metadata.width > config.width) {
        image.resize(config.width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        });
      }

      // Сохраняем оптимизированный JPG
      const jpgPath = path.join(
        galleryDir,
        category,
        `${filename}${config.suffix}${ext}`
      );

      await image
        .jpeg({ quality: 85, progressive: true })
        .toFile(jpgPath);

      const jpgSize = fs.statSync(jpgPath).size;
      stats.totalOptimizedSize += jpgSize;

      // Сохраняем WebP версию (лучшее сжатие)
      const webpPath = path.join(
        galleryDir,
        category,
        `${filename}${config.suffix}.webp`
      );

      await sharp(inputPath)
        .resize(config.width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: 80 })
        .toFile(webpPath);

      const webpSize = fs.statSync(webpPath).size;
      stats.totalOptimizedSize += webpSize;

      if (sizeName === 'thumb') {
        console.log(`    ✓ thumb: ${formatBytes(jpgSize)} JPG, ${formatBytes(webpSize)} WebP`);
      } else if (sizeName === 'medium') {
        console.log(`    ✓ medium: ${formatBytes(jpgSize)} JPG, ${formatBytes(webpSize)} WebP`);
      } else {
        console.log(`    ✓ full: ${formatBytes(jpgSize)} JPG, ${formatBytes(webpSize)} WebP`);
      }
    }

    stats.processed++;

  } catch (err) {
    console.error(`    ✗ Ошибка: ${err.message}`);
    stats.errors++;
  }
}

async function processCategory(category) {
  const categoryPath = path.join(galleryDir, category);

  if (!fs.existsSync(categoryPath)) {
    return;
  }

  const files = fs.readdirSync(categoryPath)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    .filter(f => !/-thumb\.|medium\./.test(f)); // Пропускаем уже созданные версии

  if (files.length === 0) return;

  console.log(`\n📁 ${category.toUpperCase()}: ${files.length} изображений`);

  for (const file of files) {
    const filePath = path.join(categoryPath, file);
    await optimizeImage(filePath, category);
  }
}

async function main() {
  console.log('🎨 Оптимизация галереи HAORI VISION\n');
  console.log('Создание размеров: thumbnail (400px), medium (800px)');
  console.log('Форматы: JPG (качество 85%) и WebP (качество 80%)');
  console.log('Оригинальные изображения сохраняются без изменений\n');

  if (!fs.existsSync(galleryDir)) {
    console.error(`❌ Папка ${galleryDir} не найдена`);
    return;
  }

  const categories = fs.readdirSync(galleryDir)
    .filter(f => fs.statSync(path.join(galleryDir, f)).isDirectory());

  for (const category of categories) {
    await processCategory(category);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ ОПТИМИЗАЦИЯ ЗАВЕРШЕНА\n');
  console.log('📊 Статистика:');
  console.log(`  • Обработано изображений: ${stats.processed}`);
  console.log(`  • Ошибок: ${stats.errors}`);
  console.log(`  • Исходный размер: ${formatBytes(stats.totalOriginalSize)}`);
  console.log(`  • Оптимизированный размер: ${formatBytes(stats.totalOptimizedSize)}`);

  if (stats.totalOriginalSize > 0) {
    const saved = stats.totalOriginalSize - stats.totalOptimizedSize;
    const percent = Math.round((saved / stats.totalOriginalSize) * 100);
    console.log(`  • Сэкономлено: ${formatBytes(saved)} (${percent}%)`);
  }

  console.log(`\n💾 Создано файлов: ${stats.processed * 4} (2 размера × 2 формата)`);
  console.log(`\n📂 Местоположение: frontend/public/images/gallery/\n`);
}

main().catch(console.error);
