# Android Emulator Background Notification Issues - Analysis & Solutions

## Key Findings from Research

Based on Microsoft documentation and Firebase documentation, there are several specific issues that can prevent background notifications from working in Android emulators:

### 1. **Google Services Availability**
**Issue**: Many Android emulator images don't include Google Play Services, which is required for FCM.
**Solution**: Ensure your emulator uses an image with Google APIs.

### 2. **Google Account Required**
**Issue**: FCM requires a Google account to be signed in on the emulator.
**Solution**: Add a Google account to the emulator via Settings > Accounts.

### 3. **Emulator-Specific Limitations**
**Issue**: Some emulator configurations have background processing limitations.
**Solution**: Use proper emulator settings and potentially test on a real device.

### 4. **Notification Channel Configuration**
**Issue**: Incorrect notification channel setup can prevent background notifications.
**Solution**: Ensure proper channel configuration in both manifest and code.

## Immediate Action Items

### Check 1: Verify Google Services
```bash
# Check if Google Play Services is available
adb shell "pm list packages | grep google"
```

### Check 2: Verify Google Account
1. Open Android Settings in emulator
2. Go to **Settings > Accounts**
3. Ensure a Google account is added
4. If not, add one: **Add account > Google**

### Check 3: Verify Emulator Image
- Ensure you're using an emulator image with **Google APIs**
- Images should be labeled as "Google APIs" or "Google Play"
- Avoid "AOSP" images as they don't include Google Services

### Check 4: Battery Optimization
1. Go to **Settings > Battery > Battery Optimization**
2. Find your app and set it to **"Not optimized"**
3. This prevents Android from killing background processes

## Code Fixes Still Needed

### Fix 1: Add FirebaseMessagingService to AndroidManifest.xml

The Firebase documentation shows we need to explicitly declare the messaging service:

```xml
<service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

### Fix 2: Create Custom FirebaseMessagingService

React Native Firebase might need a custom service for reliable background handling.

### Fix 3: Add Wake Lock Permission
Ensure we have wake lock permissions for background processing:

```xml
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

## Common Emulator Issues

### Issue: "SERVICE_NOT_AVAILABLE" Error
**Cause**: Emulator doesn't have Google Play Services
**Solution**: Use Google APIs emulator image

### Issue: "AUTHENTICATION_FAILED" Error  
**Cause**: No Google account signed in
**Solution**: Add Google account to emulator

### Issue: Notifications work in foreground but not background
**Cause**: Missing background service configuration
**Solution**: Proper FirebaseMessagingService setup

### Issue: Delayed or missing notifications
**Cause**: Battery optimization or Doze mode
**Solution**: Disable battery optimization for the app

## Testing Strategy

### Step 1: Verify Prerequisites
1. ✅ Google APIs emulator image
2. ✅ Google account signed in
3. ✅ Battery optimization disabled
4. ✅ Proper notification permissions

### Step 2: Test Scenarios
1. **App in foreground** - Should work (already working)
2. **App minimized (Recent apps)** - Should show in notification center
3. **App force-closed** - Should show in notification center

### Step 3: Debug Tools
```bash
# Check FCM registration
adb logcat | grep -E "(FCM|Firebase)"

# Check notification logs
adb logcat | grep -E "(Notification|NotificationManager)"

# Check background processing
adb logcat | grep -E "(Background|Doze)"
```

## Alternative: Test on Real Device

If emulator continues to have issues:
1. **Enable USB debugging** on Android phone
2. **Connect via USB** 
3. **Run**: `npx react-native run-android --device`
4. **Test background notifications** on real device

Real devices typically have fewer limitations with background notifications.

## Next Steps

1. **Check emulator configuration** (Google APIs + Google account)
2. **Add custom FirebaseMessagingService** if needed
3. **Test on real device** if emulator issues persist
4. **Verify notification channel settings** in Android settings

## Expected Behavior After Fixes

- ✅ Foreground notifications: Working
- ✅ Background notifications: Should appear in notification center
- ✅ Force-closed app: Should still receive notifications
- ✅ Proper notification styling and actions