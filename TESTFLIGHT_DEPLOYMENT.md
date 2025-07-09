# TestFlight Deployment Guide

This guide walks through the process of building and deploying updates to TestFlight after making code changes.

## Prerequisites

- Xcode installed
- Apple Developer account
- Valid signing certificates and provisioning profiles
- App already created in App Store Connect

## Step-by-Step Deployment Process

### 1. Prepare Your Code Changes

- Ensure all changes are saved and committed
- Test the app locally to verify changes work as expected

### 2. Update Version/Build Number

**Important**: You must increment the build number for each new TestFlight upload.

1. Open `wardrobe.xcworkspace` in Xcode:

   ```bash
   cd ios && open wardrobe.xcworkspace
   ```

2. Select your project in the navigator
3. Go to the "General" tab
4. Update the Build number (e.g., from "1" to "2" or "1.0.1")
   - Keep Version the same unless it's a major release
   - Build number must be unique for each upload

### 3. Clean Build Folder (Optional but Recommended)

- In Xcode: Product → Clean Build Folder (⇧⌘K)
- This ensures a fresh build without cached data

### 4. Select Build Destination

- In the scheme selector (top toolbar), change from simulator/device to:
  **"Any iOS Device (arm64)"**

### 5. Archive the App

1. Product → Archive (or ⌘B to build first, then archive)
2. Wait for the archive process to complete (5-15 minutes)
3. The Organizer window will open automatically when done

### 6. Upload to App Store Connect

1. In the Organizer, select your new archive
2. Click "Distribute App"
3. Choose "App Store Connect"
4. Select "Upload" (not Export)
5. Follow the prompts:
   - App Store Connect distribution
   - Usually keep all default options
   - Wait for upload to complete

### 7. Wait for Processing

- Apple will process your build (10-30 minutes)
- You'll receive an email when it's ready
- Check for any compliance warnings

### 8. Configure in TestFlight

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → TestFlight tab
3. Your new build will appear under the version
4. If needed, provide export compliance information
5. Add build to test groups:
   - Internal Testing: Immediate access
   - External Testing: Requires review (1-2 days)

## Quick Reference Commands

```bash
# Open Xcode workspace
cd ios && open wardrobe.xcworkspace

# Clean derived data (if having issues)
rm -rf ~/Library/Developer/Xcode/DerivedData

# View current build settings
xcodebuild -showBuildSettings -workspace wardrobe.xcworkspace -scheme wardrobe
```

## Common Issues & Solutions

### "This bundle is invalid" error

- Ensure bundle identifier matches App Store Connect
- Check provisioning profiles are valid
- Verify all required permissions in Info.plist

### Build number already exists

- Increment the build number in General tab
- Each upload needs a unique build number

### Processing takes too long

- Normal processing: 10-30 minutes
- If over 1 hour, contact Apple Developer Support

### Export compliance

- For most apps without encryption: Select "No"
- This appears after first build of each version

## Build Number Strategy

- Use semantic versioning for Version: 1.0.0
- For Build, consider:
  - Simple increment: 1, 2, 3...
  - Date-based: 20250108.1
  - Version-based: 1.0.0.1, 1.0.0.2

## Testing Checklist

Before each deployment:

- [ ] Test all new features locally
- [ ] Verify no crash issues
- [ ] Check network requests work properly
- [ ] Test on both iPhone and iPad (if supported)
- [ ] Increment build number
- [ ] Commit all changes to git

## Notes

- Keep Xcode updated for latest iOS support
- TestFlight builds expire after 90 days
- Maximum of 10,000 external testers
- Internal testers (up to 100) get immediate access
