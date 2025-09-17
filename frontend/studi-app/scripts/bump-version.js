#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Simple version bumping script for CI/CD
 * Increments iOS build number and optionally bumps version
 */

const APP_JSON_PATH = path.join(__dirname, '../app.json');
const PACKAGE_JSON_PATH = path.join(__dirname, '../package.json');

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function bumpVersion() {
  // Read current configuration
  const appConfig = readJsonFile(APP_JSON_PATH);
  const packageConfig = readJsonFile(PACKAGE_JSON_PATH);

  // Get current versions
  const currentVersion = appConfig.expo.version;
  const currentBuildNumber = parseInt(appConfig.expo.ios.buildNumber);

  console.log(`📋 Current version: ${currentVersion}`);
  console.log(`📋 Current build number: ${currentBuildNumber}`);

  // Always increment build number
  const newBuildNumber = currentBuildNumber + 1;

  // Determine version bump type from command line or default to patch
  const bumpType = process.argv[2] || 'patch';
  let newVersion = currentVersion;

  if (bumpType !== 'none') {
    const versionParts = currentVersion.split('.').map(Number);

    switch (bumpType) {
      case 'major':
        versionParts[0]++;
        versionParts[1] = 0;
        versionParts[2] = 0;
        break;
      case 'minor':
        versionParts[1]++;
        versionParts[2] = 0;
        break;
      case 'patch':
      default:
        versionParts[2]++;
        break;
    }

    newVersion = versionParts.join('.');
  }

  // Update app.json
  appConfig.expo.version = newVersion;
  appConfig.expo.ios.buildNumber = newBuildNumber.toString();
  appConfig.expo.runtimeVersion = newVersion;

  // Update package.json
  packageConfig.version = newVersion;

  // Write updated files
  writeJsonFile(APP_JSON_PATH, appConfig);
  writeJsonFile(PACKAGE_JSON_PATH, packageConfig);

  console.log(`✅ Updated to version: ${newVersion}`);
  console.log(`✅ Updated build number: ${newBuildNumber}`);

  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${newVersion}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `build_number=${newBuildNumber}\n`);
  }
}

// Run if called directly
if (require.main === module) {
  try {
    bumpVersion();
  } catch (error) {
    console.error('❌ Error bumping version:', error.message);
    process.exit(1);
  }
}

module.exports = { bumpVersion };