#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Detect if a port is in use
 */
async function isPortInUse(port) {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execAsync(`netstat -an | findstr :${port}`);
      return stdout.includes(`:${port}`);
    } else {
      const { stdout } = await execAsync(`lsof -i :${port}`);
      return stdout.trim().length > 0;
    }
  } catch {
    return false;
  }
}

/**
 * Find next available port
 */
async function findAvailablePort(startPort = 5173) {
  let port = startPort;
  while (await isPortInUse(port)) {
    port++;
    if (port > startPort + 100) {
      throw new Error('No available port found');
    }
  }
  return port;
}

/**
 * Get network interfaces
 */
async function getNetworkInterfaces() {
  const os = await import('os');
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name,
          address: iface.address,
          family: iface.family,
        });
      }
    }
  }

  return addresses;
}

/**
 * Display server information
 */
async function displayServerInfo(port = 5173) {
  console.log('\n' + '='.repeat(60));
  console.log('🌐 BKSTAR_Web Development Server Information');
  console.log('='.repeat(60));

  // Check if port is available
  const isAvailable = !(await isPortInUse(port));

  if (isAvailable) {
    console.log(`✅ Port ${port} is available`);
  } else {
    console.log(`⚠️  Port ${port} is in use`);
    try {
      const nextPort = await findAvailablePort(port + 1);
      console.log(`🔄 Next available port: ${nextPort}`);
      port = nextPort;
    } catch {
      console.log('❌ Could not find available port');
      return;
    }
  }

  console.log('\n📍 Server URLs:');
  console.log(`   Local:    http://localhost:${port}`);
  console.log(`   Local:    http://127.0.0.1:${port}`);

  // Show network addresses
  try {
    const networkInterfaces = await getNetworkInterfaces();
    if (networkInterfaces.length > 0) {
      console.log('\n🌐 Network:');
      networkInterfaces.forEach((iface) => {
        console.log(`   Network:  http://${iface.address}:${port}`);
      });
    }
  } catch {
    console.log('\n⚠️  Could not detect network interfaces');
  }

  console.log('\n🛠️  Development Features:');
  console.log('   • Hot Module Replacement (HMR)');
  console.log('   • Fast Refresh');
  console.log('   • Source Maps');
  console.log('   • Error Overlay');

  console.log('\n🎯 Project Information:');
  console.log('   • Framework: Vanilla JS + Vite');
  console.log('   • CSS: Modern CSS with Custom Properties');
  console.log('   • Assets: Optimized images and fonts');

  console.log('\n⌨️  Commands:');
  console.log('   • Press r + Enter to restart server');
  console.log('   • Press u + Enter to show server URLs');
  console.log('   • Press o + Enter to open in browser');
  console.log('   • Press q + Enter or Ctrl+C to quit');

  console.log('\n' + '='.repeat(60) + '\n');

  return port;
}

/**
 * Monitor server status
 */
async function monitorServer() {
  const targetPort = 5173;
  let lastStatus = null;

  setInterval(async () => {
    const isRunning = await isPortInUse(targetPort);

    if (isRunning !== lastStatus) {
      if (isRunning) {
        console.log(`\n🟢 Server detected on port ${targetPort}`);
        console.log(`🌐 http://localhost:${targetPort}`);
      } else if (lastStatus !== null) {
        console.log('\n🔴 Server stopped');
      }
      lastStatus = isRunning;
    }
  }, 2000);
}

// Main execution
async function main() {
  const command = process.argv[2] || 'info';

  switch (command) {
    case 'info':
    case 'detect':
      await displayServerInfo();
      break;

    case 'monitor':
      console.log('👁️  Monitoring server status...');
      console.log('Press Ctrl+C to stop monitoring\n');
      await monitorServer();
      break;

    case 'port': {
      const port = parseInt(process.argv[3]) || 5173;
      const available = !(await isPortInUse(port));
      console.log(available ? `✅ Port ${port} is available` : `❌ Port ${port} is in use`);
      break;
    }

    default:
      console.log('Usage: node scripts/detect-server.js [info|monitor|port]');
      console.log('  info    - Show server information (default)');
      console.log('  monitor - Monitor server status');
      console.log('  port    - Check if specific port is available');
  }
}

// Run main function directly
main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

export { isPortInUse, findAvailablePort, displayServerInfo };
