# Build Configuration Notes

## Xcode Version Requirement
- **Required**: Xcode 16.3 or higher
- **Known Issues**: Xcode 16.0 and 16.1 have Swift compilation bugs with react-native-iap Nitro Modules

## Build Strategy
We maintain a local `ios` directory (prebuild) for the following reasons:
1. Consistent Xcode version between local and EAS builds
2. react-native-iap v14.3.9 requires specific Swift compilation that fails on certain Xcode versions
3. Allows faster local development and direct native patches when needed

## EAS Configuration
- Production builds use: `macos-sequoia-15.4-xcode-16.3`
- This is set in `eas.json` under the base configuration

## Maintenance Commands
```bash
# After updating npm packages with native dependencies
cd ios && pod install

# To update CocoaPods dependencies
cd ios && pod update

# For clean rebuild
cd ios && rm -rf Pods Podfile.lock && pod install
```

## Known Issues & Solutions

### Swift Compilation Errors
If you see errors like "SwiftCompile failed" with multiple Swift files:
- Ensure Xcode 16.3+ is being used
- Check `eas.json` has correct image specified
- Verify local Xcode version: `xcodebuild -version`

### Version Mismatch Issues
When native code exists (ios directory present):
- Build number: Update in `ios/Studi/Info.plist` (CFBundleVersion)
- App version: Update in `ios/Studi/Info.plist` (CFBundleShortVersionString)
- These override values in `app.json` when ios directory exists

## Future Considerations
Once the React Native IAP ecosystem stabilizes with Xcode 17+, consider:
1. Removing ios directory
2. Using fully managed Expo workflow
3. Letting EAS handle all prebuilding

## Testing Builds Locally
```bash
# For local iOS development with native code
npx expo run:ios

# For simulator testing
npx expo run:ios --simulator

# For production-like build locally
eas build --platform ios --local
```