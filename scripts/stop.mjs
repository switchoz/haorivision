#!/usr/bin/env node
/**
 * HAORI VISION — Stop All Servers
 *
 * Останавливает все процессы backend и frontend.
 *
 * Usage:
 *   node scripts/stop.mjs
 *   npm run stop:dev
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================
// Configuration
// ============================================================

const PORTS_TO_STOP = [3010, 3012, 3080, 3090, 8080];

// ============================================================
// Utility Functions
// ============================================================

/**
 * Gets all PIDs using a specific port
 */
async function getProcessesOnPort(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`);
    const lines = stdout.trim().split('\n').filter(line => line.trim());

    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid)) {
        pids.add(parseInt(pid, 10));
      }
    }

    return Array.from(pids);
  } catch (error) {
    return [];
  }
}

/**
 * Kills a process by PID
 */
async function killProcess(pid) {
  try {
    await execAsync(`taskkill /F /PID ${pid}`);
    return true;
  } catch (error) {
    console.error(`     Error: ${error.message.split('\n')[0]}`);
    return false;
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║           HAORI VISION — STOP ALL SERVERS                 ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  const allPids = new Set();

  // Collect all PIDs
  for (const port of PORTS_TO_STOP) {
    const pids = await getProcessesOnPort(port);
    if (pids.length > 0) {
      console.log(`🔍 Port ${port}: Found ${pids.length} process(es)`);
      pids.forEach(pid => allPids.add(pid));
    }
  }

  if (allPids.size === 0) {
    console.log('✅ No processes found on monitored ports');
    console.log('');
    return;
  }

  console.log('');
  console.log(`🛑 Stopping ${allPids.size} process(es)...\n`);

  // Kill all processes
  let successCount = 0;
  for (const pid of allPids) {
    const success = await killProcess(pid);
    if (success) {
      console.log(`   ✅ Killed PID ${pid}`);
      successCount++;
    } else {
      console.log(`   ❌ Failed to kill PID ${pid}`);
    }
  }

  console.log('');
  console.log(`✅ Stopped ${successCount}/${allPids.size} processes`);
  console.log('');
}

// ============================================================
// Run
// ============================================================

main().catch((error) => {
  console.error('[Stop] Fatal error:', error);
  process.exit(1);
});
