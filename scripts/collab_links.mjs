#!/usr/bin/env node

/**
 * HAORI VISION — Collab Links Generator
 *
 * Генерация UTM-ссылок и QR-кодов для инфлюенсер-коллабораций.
 * Format: haorivision.com/c/[HASH] → utm_source=[HANDLE], utm_medium=collab, utm_campaign=[DATE], utm_content=[SKU]
 */

import crypto from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

const COLLAB_LINKS_FILE = join(PROJECT_ROOT, 'collab', 'data', 'collab_links.json');
const COLLAB_DIR = join(PROJECT_ROOT, 'collab', 'links');
const BASE_URL = 'https://haorivision.com';

// Ensure directories exist
if (!existsSync(join(PROJECT_ROOT, 'collab', 'data'))) {
  mkdirSync(join(PROJECT_ROOT, 'collab', 'data'), { recursive: true });
}
if (!existsSync(COLLAB_DIR)) {
  mkdirSync(COLLAB_DIR, { recursive: true });
}

function loadCollabLinks() {
  if (!existsSync(COLLAB_LINKS_FILE)) {
    return { links: [] };
  }
  return JSON.parse(readFileSync(COLLAB_LINKS_FILE, 'utf-8'));
}

function saveCollabLinks(data) {
  writeFileSync(COLLAB_LINKS_FILE, JSON.stringify(data, null, 2));
}

function generateHash(str) {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 8);
}

function generateCollabLink(handle, sku, campaign, dryRun = false) {
  const hash = generateHash(`${handle}-${sku}-${campaign}-${Date.now()}`);
  const shortUrl = `${BASE_URL}/c/${hash}`;

  // Clean handle (remove @ if present)
  const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;

  const utmParams = new URLSearchParams({
    utm_source: cleanHandle,
    utm_medium: 'collab',
    utm_campaign: campaign,
    utm_content: sku
  });

  const longUrl = `${BASE_URL}/product/${sku}?${utmParams.toString()}`;

  const link = {
    hash,
    shortUrl,
    longUrl,
    handle: cleanHandle,
    sku,
    campaign,
    createdAt: new Date().toISOString(),
    clicks: 0,
    conversions: 0
  };

  if (!dryRun) {
    const data = loadCollabLinks();
    data.links.push(link);
    saveCollabLinks(data);

    // Save individual link file
    const linkFile = join(COLLAB_DIR, `${cleanHandle}_${sku}_${campaign}.json`);
    writeFileSync(linkFile, JSON.stringify(link, null, 2));
  }

  return link;
}

function generateCollabPack(handle, skus, campaign, dryRun = false) {
  console.log(`\n🔗 Generating collab links for @${handle}\n`);
  console.log(`Campaign: ${campaign}`);
  console.log(`SKUs: ${skus.join(', ')}\n`);

  const links = [];

  skus.forEach(sku => {
    const link = generateCollabLink(handle, sku, campaign, dryRun);
    links.push(link);

    console.log(`✅ ${sku}`);
    console.log(`   Short: ${link.shortUrl}`);
    console.log(`   Long:  ${link.longUrl}\n`);
  });

  if (!dryRun) {
    // Save pack summary
    const packFile = join(COLLAB_DIR, `${handle}_${campaign}_pack.json`);
    writeFileSync(packFile, JSON.stringify({ handle, campaign, links }, null, 2));
    console.log(`📦 Pack saved: ${packFile}\n`);
  }

  return links;
}

// CLI
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('--test');
const handle = args.find(arg => arg.startsWith('--handle='))?.split('=')[1];
const skuArg = args.find(arg => arg.startsWith('--sku=') || arg.startsWith('--skus='));
const skus = skuArg ? skuArg.split('=')[1].split(',') : [];
const campaign = args.find(arg => arg.startsWith('--campaign='))?.split('=')[1] || new Date().toISOString().split('T')[0];

console.log('\n🔗 HAORI VISION — Collab Links Generator\n');

if (args.includes('--test')) {
  console.log('🧪 Test mode (dry run)\n');

  const testLinks = generateCollabPack('dj_aurora', ['ECLIPSE-01', 'LUMIN-01'], 'test-campaign-2025', true);

  console.log('✅ Test complete\n');
} else if (handle && skus.length > 0) {
  const links = generateCollabPack(handle, skus, campaign, dryRun);

  if (dryRun) {
    console.log('💡 This was a dry run. Use without --dry-run to save links.\n');
  } else {
    console.log(`✅ ${links.length} links generated and saved!`);
    console.log(`📊 Links stored in: ${COLLAB_LINKS_FILE}\n`);
  }
} else {
  console.log('Usage:');
  console.log('  node scripts/collab_links.mjs --handle=dj_aurora --skus=ECLIPSE-01,LUMIN-01 --campaign=uv-promo-2025');
  console.log('  node scripts/collab_links.mjs --test  # dry run\n');
}
