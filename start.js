#!/usr/bin/env node
import { exec } from 'child_process';
import { platform } from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Function to kill processes based on port
async function killProcessOnPort(port) {
  const isWindows = platform() === 'win32';
  const command = isWindows
    ? `netstat -ano | findstr :${port}`
    : `lsof -i :${port}`;

  try {
    const { stdout } = await execAsync(command);
    
    // Parse the output to get PID
    let pid;
    if (isWindows) {
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes(`${port}`)) {
          pid = line.split(' ').filter(Boolean).pop();
          break;
        }
      }
    } else {
      const matches = stdout.match(/node\s+(\d+)/);
      pid = matches && matches[1];
    }

    if (pid) {
      const killCommand = isWindows
        ? `taskkill /F /PID ${pid}`
        : `kill -9 ${pid}`;

      try {
        await execAsync(killCommand);
        console.log(`Process on port ${port} was killed`);
      } catch (error) {
        console.log(`Error killing process: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`No process found on port ${port}`);
  }
}

// Main function to handle startup
async function start() {
  console.log('🚀 Starting Brain Training App...');
  
  console.log('📋 Checking for existing processes...');
  await killProcessOnPort(5173);
  
  console.log('🌱 Starting development server...');
  const npm = platform() === 'win32' ? 'npm.cmd' : 'npm';
  const child = exec(`${npm} run dev`);

  child.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  child.on('error', (error) => {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    child.kill('SIGINT');
    process.exit();
  });

  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
    process.exit();
  });
}

// Run the start function
start().catch((error) => {
  console.error('❌ Failed to start the application:', error);
  process.exit(1);
});