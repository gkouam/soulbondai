const { execSync } = require('child_process');

console.log('Starting Next.js build...');

try {
  // Set environment variables
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.NODE_ENV = 'production';
  
  // Run the build
  execSync('node ./node_modules/next/dist/bin/next build', {
    stdio: 'inherit',
    env: process.env
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}