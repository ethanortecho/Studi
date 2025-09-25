#!/usr/bin/env node

/**
 * Premium Integration Test Runner
 *
 * Runs all premium-related tests with proper setup and reporting
 */

const { execSync } = require('child_process');
const path = require('path');

const testFiles = [
  'tests/integration/PremiumIAP.test.ts',
  'tests/components/PremiumGate.test.tsx',
  'tests/services/IAPService.test.ts'
];

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runTests() {
  log('🧪 Running Premium Integration Tests', colors.bold + colors.blue);
  log('=====================================\n', colors.blue);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = [];

  for (const testFile of testFiles) {
    try {
      log(`Running: ${testFile}`, colors.yellow);

      const result = execSync(
        `npx jest ${testFile} --verbose --no-cache`,
        {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: 'pipe'
        }
      );

      // Parse Jest output for test counts
      const testMatch = result.match(/Tests:\s+(\d+)\s+passed/);
      if (testMatch) {
        const passed = parseInt(testMatch[1]);
        totalTests += passed;
        passedTests += passed;
        log(`✅ ${testFile} - ${passed} tests passed\n`, colors.green);
      }

    } catch (error) {
      const errorOutput = error.stdout || error.message;
      const testMatch = errorOutput.match(/Tests:\s+(\d+)\s+failed.*?(\d+)\s+passed/);

      if (testMatch) {
        const failed = parseInt(testMatch[1]);
        const passed = parseInt(testMatch[2]);
        totalTests += failed + passed;
        passedTests += passed;
        failedTests.push({
          file: testFile,
          failed,
          passed,
          output: errorOutput
        });
        log(`❌ ${testFile} - ${failed} failed, ${passed} passed\n`, colors.red);
      } else {
        failedTests.push({
          file: testFile,
          failed: 'unknown',
          passed: 0,
          output: errorOutput
        });
        log(`❌ ${testFile} - Test run failed\n`, colors.red);
      }
    }
  }

  // Print summary
  log('\n=====================================', colors.blue);
  log('📊 TEST SUMMARY', colors.bold + colors.blue);
  log('=====================================', colors.blue);

  if (failedTests.length === 0) {
    log(`🎉 All tests passed! (${passedTests}/${totalTests})`, colors.bold + colors.green);
    log('\n✅ Premium integration is ready for testing!', colors.green);
  } else {
    log(`📊 Results: ${passedTests}/${totalTests} tests passed`, colors.yellow);
    log(`❌ ${failedTests.length} test file(s) had failures:\n`, colors.red);

    failedTests.forEach(failure => {
      log(`  ${failure.file}`, colors.red);
      if (failure.failed !== 'unknown') {
        log(`    ${failure.failed} failed, ${failure.passed} passed`, colors.red);
      }
    });

    log('\n🔍 Run individual test files with:', colors.yellow);
    log('npm test -- <test-file-path>', colors.yellow);
  }
}

function runBackendTests() {
  log('\n🐍 Running Backend API Tests', colors.bold + colors.blue);
  log('============================\n', colors.blue);

  try {
    const backendPath = path.join(__dirname, '../../../backend');

    log('Running Django tests...', colors.yellow);

    const result = execSync(
      'python manage.py test analytics.tests.test_premium_api -v 2',
      {
        cwd: backendPath,
        encoding: 'utf8',
        stdio: 'pipe'
      }
    );

    if (result.includes('OK')) {
      log('✅ Backend API tests passed', colors.green);
    } else {
      log('❌ Backend API tests failed', colors.red);
      console.log(result);
    }

  } catch (error) {
    log('❌ Backend test run failed:', colors.red);
    console.log(error.stdout || error.message);

    log('\n💡 To run backend tests manually:', colors.yellow);
    log('cd backend && python manage.py test analytics.tests.test_premium_api', colors.yellow);
  }
}

function checkTestSetup() {
  log('🔧 Checking Test Setup', colors.bold + colors.blue);
  log('======================\n', colors.blue);

  // Check if test files exist
  const fs = require('fs');
  let allFilesExist = true;

  for (const testFile of testFiles) {
    if (fs.existsSync(testFile)) {
      log(`✅ ${testFile}`, colors.green);
    } else {
      log(`❌ ${testFile} - File not found`, colors.red);
      allFilesExist = false;
    }
  }

  if (!allFilesExist) {
    log('\n❌ Some test files are missing. Please ensure all test files are created.', colors.red);
    return false;
  }

  return true;
}

// Main execution
if (require.main === module) {
  try {
    if (!checkTestSetup()) {
      process.exit(1);
    }

    runTests();
    runBackendTests();

  } catch (error) {
    log('❌ Test runner failed:', colors.red);
    console.error(error);
    process.exit(1);
  }
}