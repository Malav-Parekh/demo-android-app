const express = require('express');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with your service account
const serviceAccount = require('./app-push-poc-4913d-900f64745604.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // No databaseURL needed for FCM
});

const app = express();
app.use(express.json());

// Store for registered devices (use a real database in production)
const registeredDevices = new Map();

// Device registration endpoint
app.post('/api/register', (req, res) => {
  try {
    const { fcmToken, deviceInfo, appInfo, timestamp } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({ 
        error: 'FCM token is required',
        success: false 
      });
    }

    // Store device information
    const deviceId = fcmToken.substring(0, 10); // Use first 10 chars as device ID
    registeredDevices.set(deviceId, {
      fcmToken,
      deviceInfo,
      appInfo,
      registeredAt: timestamp || new Date().toISOString(),
      lastSeen: new Date().toISOString()
    });

    console.log(`✅ Device registered: ${deviceId}`, {
      platform: deviceInfo?.platform,
      version: deviceInfo?.version,
      appVersion: appInfo?.version
    });

    res.json({
      success: true,
      deviceId,
      message: 'Device registered successfully',
      registeredDevices: registeredDevices.size
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// Send notification endpoint using Firebase Admin SDK
app.post('/api/send-notification', async (req, res) => {
  try {
    const { fcmToken, title, body, data } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({ 
        error: 'FCM token is required',
        success: false 
      });
    }

    // Construct the message payload for FCM v1 API
    const message = {
      token: fcmToken,
      notification: {
        title: title || 'Test Notification',
        body: body || 'This is a test notification from your service'
      },
      data: {
        // Add custom data (all values must be strings)
        ...data,
        timestamp: new Date().toISOString(),
        source: 'notification-service'
      },
      android: {
        priority: 'high',
        // Force the notification to be displayed even when app is backgrounded/closed
        notification: {
          title: title || 'Test Notification',
          body: body || 'This is a test notification from your service',
          icon: 'ic_notification',
          color: '#FF6B35',
          sound: 'default',
          channelId: 'default_notification_channel_id',
          priority: 'high'
        },
        // Data payload for background processing
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          source: 'notification-service'
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: title || 'Test Notification',
              body: body || 'This is a test notification from your service'
            },
            badge: 1,
            sound: 'default'
          }
        }
      }
    };

    console.log('📤 Sending notification via Firebase Admin SDK...', {
      token: fcmToken.substring(0, 20) + '...',
      title,
      body
    });

    // Send using Firebase Admin SDK (automatically handles OAuth2 + FCM v1 API)
    const response = await admin.messaging().send(message);
    
    console.log('✅ Notification sent successfully:', response);

    res.json({
      success: true,
      messageId: response,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('❌ Send notification error:', error);
    
    // Handle different types of Firebase errors
    let errorMessage = 'Failed to send notification';
    if (error.code === 'messaging/registration-token-not-registered') {
      errorMessage = 'FCM token is not registered or expired';
    } else if (error.code === 'messaging/invalid-registration-token') {
      errorMessage = 'Invalid FCM token format';
    }

    res.status(500).json({ 
      error: errorMessage,
      code: error.code,
      success: false 
    });
  }
});

// Send notification to all registered devices
app.post('/api/broadcast', async (req, res) => {
  try {
    const { title, body, data } = req.body;
    
    if (registeredDevices.size === 0) {
      return res.status(400).json({ 
        error: 'No devices registered',
        success: false 
      });
    }

    const tokens = Array.from(registeredDevices.values()).map(device => device.fcmToken);
    
    // Construct the message payload
    const message = {
      notification: {
        title: title || 'Broadcast Notification',
        body: body || 'This is a broadcast notification'
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'broadcast'
      },
      tokens // Send to multiple devices
    };

    console.log(`📤 Broadcasting to ${tokens.length} devices...`);

    // Send to multiple devices
    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`✅ Broadcast complete: ${response.successCount}/${tokens.length} sent`);
    
    if (response.failureCount > 0) {
      console.log('❌ Failed tokens:', response.responses
        .filter((resp, idx) => !resp.success)
        .map((resp, idx) => ({ token: tokens[idx].substring(0, 10), error: resp.error?.code }))
      );
    }

    res.json({
      success: true,
      totalDevices: tokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      message: 'Broadcast completed'
    });

  } catch (error) {
    console.error('❌ Broadcast error:', error);
    res.status(500).json({ 
      error: 'Failed to send broadcast',
      success: false 
    });
  }
});

// Get registered devices (for debugging)
app.get('/api/devices', (req, res) => {
  const devices = Array.from(registeredDevices.entries()).map(([id, device]) => ({
    deviceId: id,
    platform: device.deviceInfo?.platform,
    registeredAt: device.registeredAt,
    lastSeen: device.lastSeen
  }));

  res.json({
    success: true,
    totalDevices: devices.length,
    devices
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    firebaseInitialized: admin.apps.length > 0,
    projectId: serviceAccount.project_id
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 Production Notification Service Started');
  console.log('==========================================');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`📱 Firebase project: ${serviceAccount.project_id}`);
  console.log(`🔐 Service account: ${serviceAccount.client_email}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log(`   POST http://localhost:${PORT}/api/register - Register device`);
  console.log(`   POST http://localhost:${PORT}/api/send-notification - Send notification`);
  console.log(`   POST http://localhost:${PORT}/api/broadcast - Broadcast to all devices`);
  console.log(`   GET  http://localhost:${PORT}/api/devices - List devices`);
  console.log(`   GET  http://localhost:${PORT}/health - Health check`);
  console.log('');
  console.log('📋 Postman Examples:');
  console.log('');
  console.log('1. Send Single Notification:');
  console.log(`   POST http://localhost:${PORT}/api/send-notification`);
  console.log('   Content-Type: application/json');
  console.log('   {');
  console.log('     "fcmToken": "COPY_FROM_APP_DISPLAY",');
  console.log('     "title": "Hello from Server!",');
  console.log('     "body": "Real notification via FCM v1 API",');
  console.log('     "data": { "action": "open_app" }');
  console.log('   }');
  console.log('');
  console.log('2. Broadcast to All Devices:');
  console.log(`   POST http://localhost:${PORT}/api/broadcast`);
  console.log('   Content-Type: application/json');
  console.log('   {');
  console.log('     "title": "Broadcast Alert!",');
  console.log('     "body": "This goes to all registered devices"');
  console.log('   }');
});

module.exports = app;