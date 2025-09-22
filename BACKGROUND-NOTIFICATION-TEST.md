# Testing Background Notifications Guide

## 🔔 How to Test Background Notifications

### Prerequisites ✅
- App is built and running
- Notifications are enabled in the app
- FCM token is visible in the app
- Production backend service is running

### Test Scenarios

#### 1. **App in Background** (Minimized)
```bash
# 1. Open the app in emulator
# 2. Click home button to minimize (don't close)
# 3. Send notification via Postman:

POST http://localhost:3000/api/send-notification
Content-Type: application/json

{
  "fcmToken": "COPY_FROM_APP_DISPLAY",
  "title": "Background Test",
  "body": "App is in background - should appear in notification center",
  "data": { "test": "background" }
}
```

#### 2. **App Completely Closed**
```bash
# 1. Open the app in emulator
# 2. Swipe up to see recent apps, swipe app away to close
# 3. Send notification via Postman:

POST http://localhost:3000/api/send-notification
Content-Type: application/json

{
  "fcmToken": "COPY_FROM_APP_DISPLAY", 
  "title": "Closed App Test",
  "body": "App is completely closed - should appear in notification center",
  "data": { "test": "closed" }
}
```

#### 3. **App in Foreground** (Already working)
```bash
# App is open and visible - notifications appear as alerts in app
```

### Expected Results

| App State | Where Notification Appears |
|-----------|----------------------------|
| **Foreground** | Alert dialog in app ✅ |
| **Background** | Android notification center 🎯 |
| **Closed** | Android notification center 🎯 |

### 🔧 Enhanced Features Added

1. **Android Manifest**: Added FCM metadata and permissions
2. **Notification Channels**: Configured default channel
3. **Background Handler**: Enhanced processing
4. **High Priority**: Ensures delivery even when backgrounded
5. **Visual Styling**: Custom icon, color, and sound

### 🐛 Troubleshooting

**If notifications don't appear in background:**

1. **Check emulator notifications are enabled**:
   - Settings → Apps → PushNotificationApp → Notifications → Allow
   
2. **Check Do Not Disturb is off**:
   - Swipe down from top → Turn off Do Not Disturb
   
3. **Check battery optimization**:
   - Settings → Battery → Battery Optimization → PushNotificationApp → Don't optimize

4. **Verify FCM token is fresh**:
   - Restart app to get new token
   - Use the latest token in Postman

### 🎯 What Should Happen

When you send a notification while the app is backgrounded/closed:
- ✅ Notification appears in Android notification center
- ✅ Shows custom icon, title, and body
- ✅ Makes sound and vibrates
- ✅ When tapped, opens the app
- ✅ Background handler logs data for analytics

Test it now! 🚀