/**
 * Test Runner for SwiftTiger Backend
 * Sets up test environment and runs all tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';

// Copy test environment file if it exists
const testEnvPath = path.join(__dirname, '.env.test');
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(testEnvPath)) {
  console.log('📋 Using test environment configuration...');
  fs.copyFileSync(testEnvPath, envPath);
}

console.log('🚀 Starting SwiftTiger Backend Tests...\n');

try {
  // Run database tests first
  console.log('🗄️  Testing Database Connection...');
  execSync('npx jest tests/database.test.js --verbose', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' }
  });
  
  console.log('\n✅ Database tests passed!\n');
  
  // Run API tests
  console.log('🌐 Testing API Endpoints...');
  execSync('npx jest tests/api.test.js --verbose', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' }
  });
  
  console.log('\n✅ API tests passed!\n');
  
  console.log('🎉 All tests completed successfully!');
  
} catch (error) {
  console.error('\n❌ Tests failed:');
  console.error(error.message);
  
  // Show helpful information for common issues
  if (error.message.includes('ECONNREFUSED')) {
    console.log('\n💡 Troubleshooting Tips:');
    console.log('   • Make sure PostgreSQL is running');
    console.log('   • Check database connection settings in .env.test');
    console.log('   • Ensure test database exists');
  }
  
  process.exit(1);
}

// Cleanup
if (fs.existsSync(testEnvPath)) {
  fs.unlinkSync(envPath);
  console.log('🧹 Test environment cleaned up');
}