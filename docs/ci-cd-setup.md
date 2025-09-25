# 🚀 CI/CD Setup Guide

This guide explains how to configure automated iOS builds and App Store submissions for the Studi app.

## 📋 Overview

The CI/CD pipeline automatically:
- ✅ Bumps version and build numbers
- ✅ Builds the iOS app using EAS
- ✅ Submits to App Store Connect
- ✅ Creates GitHub releases
- ✅ Commits version changes

## 🔐 Required GitHub Secrets

Navigate to **Settings → Secrets and variables → Actions** in your GitHub repository and add:

### `EXPO_TOKEN`
Your Expo account access token for EAS CLI authentication.

**How to get it:**
```bash
# Login to Expo CLI
npx expo login

# Generate access token
npx expo whoami --json
```

Copy the `accessToken` value from the output.

### `GITHUB_TOKEN`
This is automatically provided by GitHub Actions - no setup needed.

## 🎯 How to Use

### Automatic Releases (Recommended)
1. Push changes to `main` branch
2. Workflow automatically triggers
3. App version gets a patch bump (1.0.0 → 1.0.1)
4. Build number increments (4 → 5)
5. App builds and submits to App Store

### Manual Releases
1. Go to **Actions** tab in GitHub
2. Click **iOS Release** workflow
3. Click **Run workflow**
4. Choose version bump type:
   - `patch`: 1.0.0 → 1.0.1 (bug fixes)
   - `minor`: 1.0.0 → 1.1.0 (new features)
   - `major`: 1.0.0 → 2.0.0 (breaking changes)
   - `none`: Only increment 
   

## 📱 Current Configuration

- **App Store ID:** 6749604338
- **Bundle ID:** com.ethanortecho.studi
- **Apple Team ID:** S7KQX9LXKV
- **Apple ID:** ethan.ortecho@gmail.com

## 🔄 Workflow Triggers

- **Push to main** with frontend changes → Auto build & submit
- **Manual trigger** → Choose version bump type

## 📝 What Gets Updated

- `app.json` - App version, build number, runtime version
- `package.json` - NPM package version
- **Git tag** - Creates release tag (v1.0.1)
- **GitHub Release** - Creates release notes

## 🚨 First Time Setup

1. Add `EXPO_TOKEN` secret to GitHub
2. Ensure your Apple Developer account has valid certificates
3. Verify EAS configuration with: `eas build:configure`
4. Test the workflow with a manual trigger

## 🛠️ Troubleshooting

### Build Fails
- Check `EXPO_TOKEN` is valid: `npx expo whoami`
- Verify EAS project: `eas project:info`

### App Store Submission Fails
- Ensure Apple Developer Program membership is active
- Check certificates in Apple Developer Console
- Verify App Store Connect app configuration

## 📚 Useful Commands

```bash
# Test version bump locally
node scripts/bump-version.js patch

# Check EAS project status
eas project:info

# List recent builds
eas build:list

# Check submission status
eas submit:list
```