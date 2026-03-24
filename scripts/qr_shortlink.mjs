#!/usr/bin/env node

/**
 * HAORI VISION — QR Shortlink Generator
 *
 * Генерация коротких ссылок с UTM для поп-апов.
 * Format: haorivision.com/p/[HASH] → utm_source=popup&utm_medium=qr&utm_campaign=[DATE]&utm_content=[SKU]
 */

import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

const SHORTLINKS_FILE = join(PROJECT_ROOT, 'retail', 'data', 'shortlinks.json');
const BASE_URL = 'https://haorivision.com';

function loadShortlinks() {
  if (!existsSync(SHORTLINKS_FILE)) {
    return { links: [] };
  }
  return JSON.parse(readFileSync(SHORTLINKS_FILE, 'utf-8'));
}

function saveShortlinks(data) {
  writeFileSync(SHORTLINKS_FILE, JSON.stringify(data, null, 2));
}

function generateHash(str) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 8);
}

function generateShortlink(sku, campaign, dryRun = false) {
  const hash = generateHash(`${sku}-${campaign}-${Date.now()}`);
  const shortUrl = `${BASE_URL}/p/${hash}`;

  const utmParams = new URLSearchParams({
    utm_source: 'popup',
    utm_medium: 'qr',
    utm_campaign: campaign,
    utm_content: sku
  });

  const longUrl = `${BASE_URL}/product/${sku}?${utmParams.toString()}`;

  const link = {
    hash,
    shortUrl,
    longUrl,
    sku,
    campaign,
    createdAt: new Date().toISOString(),
    clicks: 0
  };

  if (!dryRun) {
    const data = loadShortlinks();
    data.links.push(link);
    saveShortlinks(data);
  }

  return link;
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sku = args.find(arg => arg.startsWith('--sku='))?.split('=')[1];
const campaign = args.find(arg => arg.startsWith('--campaign='))?.split('=')[1] || new Date().toISOString().split('T')[0];

console.log('\n🔗 HAORI VISION — QR Shortlink Generator\n');

if (args.includes('--test') || dryRun) {
  console.log('🧪 Test mode (dry run)\n');

  const testSKUs = ['ECLIPSE-01', 'LUMIN-01', 'BLOOM-01'];

  testSKUs.forEach(testSku => {
    const link = generateShortlink(testSku, campaign, true);
    console.log(`✅ ${testSku}`);
    console.log(`   Short: ${link.shortUrl}`);
    console.log(`   Long:  ${link.longUrl}\n`);
  });
} else if (sku) {
  const link = generateShortlink(sku, campaign, dryRun);
  console.log(`✅ Generated shortlink for ${sku}`);
  console.log(`   Short: ${link.shortUrl}`);
  console.log(`   Long:  ${link.longUrl}`);
  console.log(`   Campaign: ${campaign}\n`);
} else {
  console.log('Usage:');
  console.log('  node scripts/qr_shortlink.mjs --sku=ECLIPSE-01 --campaign=stockholm-popup-2025');
  console.log('  node scripts/qr_shortlink.mjs --test  # dry run\n');
}
