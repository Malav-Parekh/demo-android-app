// Example Node.js/Express server for your notification service registration endpoint
// This shows how to implement the registration endpoint that your React Native app will call

const express = require('express');
const admin = require('firebase-admin');
const app = express();
const port = 3000;

// Initialize Firebase Admin SDK with your service account key
const serviceAccount = require('./path-to-your-firebase-service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(express.json());

// In-memory storage for registered devices (use a real database in production)
const registeredDevices = new Map();

// Device registration endpoint - This is what your React Native app calls
app.post('/api/register', async (req, res) => {
  try {
    const { fcmToken, deviceInfo, appInfo, timestamp } = req.body;
    
    console.log('📱 New device registration request:', {
      fcmToken: fcmToken ? fcmToken.substring(0, 20) + '...' : 'missing',
      platform: deviceInfo?.platform,
      appVersion: appInfo?.version,
      timestamp
    });

    // Validate required fields
    if (!fcmToken) {
      return res.status(400).json({ 
        error: 'FCM token is required',
        success: false 
      });
    }

    // Generate a unique device ID
    const deviceId = generateDeviceId();
    
    // Store device registration info
    const deviceRecord = {
      deviceId,
      fcmToken,
      deviceInfo,
      appInfo,
      registeredAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      status: 'active'
    };

    registeredDevices.set(deviceId, deviceRecord);
    
    console.log(`✅ Device registered successfully with ID: ${deviceId}`);
    console.log(`📊 Total registered devices: ${registeredDevices.size}`);

    // Respond with success
    res.status(200).json({
      success: true,
      deviceId,
      message: 'Device registered successfully',
      registeredAt: deviceRecord.registeredAt
    });

    // Optional: Send welcome notification
    setTimeout(() => {
      sendWelcomeNotification(fcmToken, deviceId);
    }, 2000);

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// Send notification endpoint - Use this from Postman to test notifications
app.post('/api/send-notification', async (req, res) => {
  try {
    const { deviceId, fcmToken, title, body, data = {} } = req.body;
    
    console.log('🔔 Sending notification:', { deviceId, title, body });

    let targetToken = fcmToken;
    
    // If deviceId provided, look up the FCM token
    if (deviceId && !fcmToken) {
      const device = registeredDevices.get(deviceId);
      if (!device) {
        return res.status(404).json({ 
          error: 'Device not found',
          success: false 
        });
      }
      targetToken = device.fcmToken;
    }

    if (!targetToken) {
      return res.status(400).json({ 
        error: 'FCM token or device ID is required',
        success: false 
      });
    }

    // Send notification via Firebase
    const message = {
      token: targetToken,
      notification: {
        title: title || 'Test Notification',
        body: body || 'This is a test notification from your service!'
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        sentBy: 'notification-service'
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
          priority: 'high',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent successfully:', response);

    res.status(200).json({
      success: true,
      messageId: response,
      sentAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Notification send error:', error);
    res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
});

// Get registered devices endpoint
app.get('/api/devices', (req, res) => {
  const devices = Array.from(registeredDevices.values()).map(device => ({
    deviceId: device.deviceId,
    platform: device.deviceInfo?.platform,
    appVersion: device.appInfo?.version,
    registeredAt: device.registeredAt,
    lastActive: device.lastActive,
    status: device.status,
    // Don't expose full FCM token for security
    fcmToken: device.fcmToken ? device.fcmToken.substring(0, 20) + '...' : null
  }));

  res.json({
    success: true,
    devices,
    total: devices.length
  });
});

// Helper functions
function generateDeviceId() {
  return 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

async function sendWelcomeNotification(fcmToken, deviceId) {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: '🎉 Welcome!',
        body: 'Your device has been successfully registered for push notifications!'
      },
      data: {
        type: 'welcome',
        deviceId,
        timestamp: new Date().toISOString()
      }
    };

    await admin.messaging().send(message);
    console.log(`📬 Welcome notification sent to device: ${deviceId}`);
  } catch (error) {
    console.error('❌ Welcome notification failed:', error);
  }
}

// Start server
app.listen(port, () => {
  console.log('🚀 Notification Service running on port', port);
  console.log('📱 Registration endpoint: POST /api/register');
  console.log('🔔 Send notification endpoint: POST /api/send-notification');
  console.log('📊 Get devices endpoint: GET /api/devices');
});

/* 
POSTMAN TEST EXAMPLES:

1. Send notification by device ID:
POST http://localhost:3000/api/send-notification
{
  "deviceId": "device_xxx_123456789",
  "title": "Hello from Postman!",
  "body": "This notification was sent via Postman",
  "data": {
    "action": "open_app",
    "url": "https://example.com"
  }
}

2. Send notification by FCM token:
POST http://localhost:3000/api/send-notification
{
  "fcmToken": "fGJP7KbYTbCXXXXXXXXXXXXXXX:XXXXXXXXX...",
  "title": "Direct Token Test",
  "body": "Testing with FCM token directly"
}

3. Get all registered devices:
GET http://localhost:3000/api/devices
*/