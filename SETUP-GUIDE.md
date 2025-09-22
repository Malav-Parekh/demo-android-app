# Push Notification App Setup Guide

## 🔧 Configuration Steps

### 1. Update App Configuration

Edit `App.tsx` and update the `NOTIFICATION_SERVICE_CONFIG`:

```typescript
const NOTIFICATION_SERVICE_CONFIG = {
  // Replace with your actual notification service registration endpoint
  REGISTRATION_ENDPOINT: 'http://your-server.com/api/register',
  // or for local testing: 'http://10.0.2.2:3000/api/register' (Android emulator)
  // or for local testing: 'http://localhost:3000/api/register' (iOS simulator)
  
  HEADERS: {
    'Content-Type': 'application/json',
    // Add any required headers for your API
    // 'Authorization': 'Bearer your-api-key',
    // 'X-API-Key': 'your-api-key',
  },
};
```

### 2. Firebase Setup

Your Firebase project is already configured:
- **Project ID**: `app-push-poc-4913d`
- **Project Number**: `478661266726`

The app will use your real Firebase project for FCM tokens and push notifications.

### 3. Set Up Production Backend Service

Your Firebase service account key (`app-push-poc-4913d-900f64745604.json`) is ready to use! 

#### Start the Production Backend:

```bash
# Copy the production service file if you haven't
cp notification-service-production.js notification-service.js

# Install dependencies
npm install express firebase-admin

# Start the server
node notification-service-production.js
```

#### The backend automatically:
- ✅ **OAuth2 Authentication**: Uses your service account for automatic token management
- ✅ **FCM v1 API**: Sends notifications via Firebase's latest API
- ✅ **Error Handling**: Proper error codes and messaging
- ✅ **Device Management**: Tracks registered devices
- ✅ **Broadcast Support**: Send to all devices at once

### 4. Build and Test the App

```bash
# Start the emulator first
emulator -avd "Medium_Phone_API_36.1" -no-audio

# Build and run the app
npm run android
```

## 📱 App Flow

### When User Clicks "Enable Notifications":

1. **Permission Request**: App asks for notification permission
2. **FCM Token**: App gets FCM token from Firebase
3. **API Call**: App calls your registration endpoint with:
   ```json
   {
     "fcmToken": "fGJP7KbYTbCXXXXXXXXXXXXXXX:XXXXXXXXX...",
     "deviceInfo": {
       "platform": "android",
       "version": "14"
     },
     "appInfo": {
       "version": "1.0.0",
       "bundleId": "com.pushnotificationapp"
     },
     "timestamp": "2025-09-19T12:00:00.000Z"
   }
   ```

### When User Clicks "Disable Notifications":
- Sets `notificationsEnabled: false`
- Clears FCM token from app state
- You could optionally call an unregister endpoint

## 🔔 Testing Notifications

### Option 1: Use the Production Server (Recommended)

1. Start the production backend:
   ```bash
   node notification-service-production.js
   ```

2. Register your app by clicking "Enable Notifications"

3. Use the FCM token displayed in your app with Postman:

#### Send Single Notification:
```
POST http://localhost:3000/api/send-notification
Content-Type: application/json

{
  "fcmToken": "COPY_FROM_APP_DISPLAY",
  "title": "Hello from Server!",
  "body": "Real notification via FCM v1 API with OAuth2",
  "data": { 
    "action": "open_app",
    "url": "https://example.com"
  }
}
```

#### Broadcast to All Devices:
```
POST http://localhost:3000/api/broadcast
Content-Type: application/json

{
  "title": "Broadcast Alert!",
  "body": "This goes to all registered devices",
  "data": { "type": "broadcast" }
}
```

### Option 2: Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Use the FCM token displayed in your app

### Option 3: cURL Command

```bash
# Replace TOKEN_FROM_APP with the actual token from your app
curl -X POST http://localhost:3000/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "TOKEN_FROM_APP",
    "title": "Test from cURL",
    "body": "This notification sent via command line"
  }'
```

## 🏗️ Expected Architecture Flow

```
[React Native App] → [Your Notification Service] → [Firebase FCM] → [Device]
       ↓                        ↓                        ↓           ↓
1. Register with       2. Store FCM token      3. Send push     4. Receive
   FCM token              in your database        notification     notification
```

## 🐛 Troubleshooting

### App Registration Issues:
- Check network connectivity
- Verify your endpoint URL in `NOTIFICATION_SERVICE_CONFIG`
- Check server logs for registration requests

### Not Receiving Notifications:
- Ensure app has notification permission
- Verify FCM token is valid (check app display)
- Check server logs for send requests
- Ensure Firebase project is configured correctly

### Android Emulator Specific:
- Use `http://10.0.2.2:3000` instead of `localhost:3000` for local server
- Ensure emulator has Google Play Services
- Check emulator internet connectivity

## 📋 App Features

✅ **Permission Management**: Request and manage notification permissions  
✅ **Device Registration**: Register device with your notification service  
✅ **FCM Integration**: Get and display FCM tokens  
✅ **Toggle Control**: Enable/disable notifications with re-permission  
✅ **Real API Calls**: Actual HTTP requests to your service  
✅ **Status Tracking**: Visual feedback for all operations  
✅ **Notification Handling**: Foreground, background, and app-opened notifications  

## 🔄 Next Steps

1. **Start Backend Service**: Run `node notification-service-production.js`
2. **Build and run the app**: `npm run android`
3. **Test device registration**: Click "Enable Notifications" 
4. **Send test notifications**: Use Postman with the production endpoints
5. **Verify end-to-end flow**: Complete notification delivery from backend to app

Your app is now ready with **production-grade Firebase Admin SDK integration**! 🚀

## ✨ What You Get

✅ **OAuth2 Authentication**: Automatic token management via Firebase Admin SDK  
✅ **FCM v1 API**: Latest Firebase Cloud Messaging API  
✅ **Real Device Registration**: HTTP calls to your production service  
✅ **Error Handling**: Proper Firebase error codes and messages  
✅ **Broadcast Support**: Send notifications to all registered devices  
✅ **Production Ready**: Service account authentication with your Firebase project  

The Firebase Admin SDK automatically handles OAuth2 token refresh and uses Google's secure APIs under the hood!