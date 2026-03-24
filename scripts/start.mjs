#!/usr/bin/env node
/**
 * HAORI VISION — Unified Startup Script
 *
 * Запускает backend и frontend на оптимизированных портах.
 * Автоматически очищает старые процессы перед запуском.
 *
 * Usage:
 *   node scripts/start.mjs
 *   npm run start:dev
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================
// Configuration
// ============================================================

const BACKEND_PORT = 3010;
const FRONTEND_PORT = 3012;
const WEBSOCKET_PORT = 8080;

const PORTS_TO_CHECK = [BACKEND_PORT, FRONTEND_PORT, WEBSOCKET_PORT];

// ============================================================
// Utility Functions
// ============================================================

/**
 * Checks if a port is in use and returns the PID
 */
async function getProcessOnPort(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`);
    const lines = stdout.trim().split('\n');

    if (lines.length > 0 && lines[0]) {
      const parts = lines[0].trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      return parseInt(pid, 10);
    }
  } catch (error) {
    // Port is not in use
  }
  return null;
}

/**
 * Kills a process by PID
 */
async function killProcess(pid) {
  try {
    await execAsync(`cmd /c "taskkill /F /PID ${pid}"`);
    console.log(`✅ Killed process ${pid}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to kill process ${pid}:`, error.message);
    return false;
  }
}

/**
 * Cleans up old processes on specified ports
 */
async function cleanupPorts() {
  console.log('🧹 Cleaning up old processes...\n');

  const killedPids = new Set();

  for (const port of PORTS_TO_CHECK) {
    const pid = await getProcessOnPort(port);
    if (pid && !killedPids.has(pid)) {
      console.log(`   Port ${port} is occupied by PID ${pid}`);
      await killProcess(pid);
      killedPids.add(pid);

      // Wait a bit for the port to be released
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (killedPids.size === 0) {
    console.log('   No processes to clean up');
  }

  console.log('');
}

/**
 * Starts the backend server
 */
function startBackend() {
  console.log(`🚀 Starting backend on port ${BACKEND_PORT}...\n`);

  const backend = spawn('npm', ['start'], {
    cwd: 'C:\\haorivision\\backend',
    env: { ...process.env, PORT: BACKEND_PORT.toString() },
    shell: true,
    stdio: 'inherit'
  });

  backend.on('error', (error) => {
    console.error('❌ Backend error:', error);
  });

  backend.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Backend exited with code ${code}`);
      process.exit(code);
    }
  });

  return backend;
}

/**
 * Starts the frontend dev server
 */
function startFrontend() {
  console.log(`🎨 Starting frontend on port ${FRONTEND_PORT}...\n`);

  const frontend = spawn('npx', ['vite', '--port', FRONTEND_PORT.toString(), '--host'], {
    cwd: 'C:\\haorivision\\frontend',
    shell: true,
    stdio: 'inherit'
  });

  frontend.on('error', (error) => {
    console.error('❌ Frontend error:', error);
  });

  frontend.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Frontend exited with code ${code}`);
      process.exit(code);
    }
  });

  return frontend;
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║              HAORI VISION — DEV SERVER                    ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Step 1: Cleanup old processes
  await cleanupPorts();

  // Step 2: Start backend
  const backendProcess = startBackend();

  // Step 3: Wait a bit for backend to start
  console.log('⏳ Waiting for backend to initialize...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 4: Start frontend
  const frontendProcess = startFrontend();

  // Step 5: Wait a bit for frontend to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 6: Display URLs
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    🎉 READY TO GO!                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🔗 Frontend:          http://localhost:${FRONTEND_PORT}`);
  console.log(`🔗 Backend API:       http://localhost:${BACKEND_PORT}`);
  console.log(`🔗 WebSocket Sync:    ws://localhost:${WEBSOCKET_PORT}`);
  console.log('');
  console.log('📊 Admin Dashboards:');
  console.log(`   Feature Console:   http://localhost:${BACKEND_PORT}/admin/feature_console.html`);
  console.log(`   Edge Dashboard:    http://localhost:${BACKEND_PORT}/admin/edge_dashboard.html`);
  console.log('');
  console.log(`🎛️  Feature Flags:     http://localhost:${BACKEND_PORT}/configs/features.json`);
  console.log('');
  console.log('[!] Press Ctrl+C to stop all servers');
  console.log('');

  // Handle exit
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down servers...\n');

    backendProcess.kill('SIGINT');
    frontendProcess.kill('SIGINT');

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('✅ Servers stopped');
    process.exit(0);
  });
}

// ============================================================
// Run
// ============================================================

main().catch((error) => {
  console.error('[Start] Fatal error:', error);
  process.exit(1);
});
