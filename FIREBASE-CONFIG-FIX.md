# Firebase Configuration Issue - SOLUTION

## 🚨 Problem
The app shows: `Please set a valid API key. A Firebase API key is required to communicate with Firebase server APIs`

## ✅ Solution: Download Real google-services.json

You need to download the actual `google-services.json` file from your Firebase project:

### Steps:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `app-push-poc-4913d`
3. **Click Project Settings** (gear icon)
4. **Go to "Your apps" section**
5. **If Android app exists**:
   - Click the Android app
   - Click "Download google-services.json"
6. **If no Android app exists**:
   - Click "Add app" → "Android"
   - Android package name: `com.pushnotificationapp`
   - App nickname: `Push Notification App`
   - Click "Register app"
   - Download the `google-services.json` file

### Replace the file:
```bash
# Replace the current placeholder file with the real one
cp /path/to/downloaded/google-services.json c:\code\demo-android-app\android\app\google-services.json
```

### Then rebuild:
```bash
cd c:\code\demo-android-app
npx react-native run-android
```

## 📋 What the real file contains:
- Valid API keys for your Firebase project
- Correct client IDs and OAuth configurations
- Proper mobile SDK app ID
- All necessary Firebase service configurations

Once you have the real `google-services.json`, the FCM token generation will work correctly!