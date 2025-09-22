# Background Notification Testing Guide

## Changes Made to Fix Background Notifications

### 1. Fixed Notification Channel ID Mismatch
- **Issue**: Service was using `default_channel` but Android manifest defined `default_notification_channel_id`
- **Fix**: Updated notification service to use `default_notification_channel_id`

### 2. Enhanced Background Message Handler
- **Issue**: Background handler wasn't properly processing notifications
- **Fix**: Enhanced `background.js` with better logging and proper promise handling

### 3. Added Notification Channel Creation
- **Issue**: Android notification channel might not be properly initialized
- **Fix**: Added `createNotificationChannel()` function in App.tsx

### 4. Updated Notification Payload
- **Issue**: Notification payload wasn't optimized for background delivery
- **Fix**: Updated service to use high priority and proper channel configuration

## Testing Steps

### Prerequisites
1. Make sure the notification service is running: `node notification-service-production.js`
2. Make sure the Android app is built and installed: `npx react-native run-android`
3. Ensure the app has notification permissions granted

### Test Scenario 1: App Minimized (Recent Apps)
1. Open the app and ensure notifications are enabled
2. Press the home button or recent apps button (app goes to background but stays in memory)
3. Send notification via Postman:
   ```json
   POST http://10.0.2.2:3000/api/send-notification
   Content-Type: application/json
   
   {
     "fcmToken": "YOUR_FCM_TOKEN",
     "title": "Background Test",
     "body": "This should appear in notification center"
   }
   ```
4. **Expected Result**: Notification should appear in the Android notification center

### Test Scenario 2: App Completely Closed
1. Open the app and ensure notifications are enabled
2. Force close the app (swipe away from recent apps)
3. Send notification via Postman (same as above)
4. **Expected Result**: Notification should appear in the Android notification center

### Test Scenario 3: App in Foreground
1. Keep the app open and visible
2. Send notification via Postman
3. **Expected Result**: Notification should appear as an in-app notification

## Key Configuration Files Updated

### notification-service-production.js
- Fixed channel ID: `channelId: 'default_notification_channel_id'`
- Added high priority: `priority: 'high'`
- Enhanced notification payload for background delivery

### background.js
- Enhanced logging for debugging
- Proper promise handling
- Better error handling

### App.tsx
- Added notification channel creation
- Better initialization sequence

### AndroidManifest.xml
- Fixed manifest merge conflicts with `tools:replace`
- Proper FCM metadata configuration

## Debugging Tips

### Check Android Logs
```bash
adb logcat | grep -E "(FCM|Firebase|Notification|ReactNative)"
```

### Check Notification Settings
1. Go to Android Settings > Apps > [Your App] > Notifications
2. Ensure notifications are enabled
3. Check notification channels are properly configured

### Check FCM Token
- Make sure you're using the latest FCM token from the app
- Token might change when app is reinstalled

## Common Issues and Solutions

### Issue: Notifications work in foreground but not background
- **Solution**: Ensure the notification payload has both `notification` and `data` objects
- **Solution**: Use high priority in Android configuration
- **Solution**: Verify notification channel is properly configured

### Issue: No notifications appearing at all
- **Solution**: Check notification permissions in Android settings
- **Solution**: Verify FCM token is valid and up-to-date
- **Solution**: Check notification service logs for errors

### Issue: Notifications delayed in background
- **Solution**: Use high priority in message payload
- **Solution**: Ensure app is not in battery optimization (Doze mode)

## Expected Behavior

After implementing these fixes:
1. ✅ Foreground notifications should work (already working)
2. ✅ Background notifications should appear in notification center when app is minimized
3. ✅ Background notifications should appear when app is completely closed
4. ✅ Clicking notifications should open the app
5. ✅ Proper notification styling and channel configuration