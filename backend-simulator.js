// Simple Node.js script to simulate your App Server sending notifications
// This demonstrates the "Send Push Notification" part of your architecture

const sendNotificationToFirebase = async (fcmToken, title, body, data = {}) => {
  // This would be your actual Firebase Admin SDK call
  // For demo purposes, this is a template of what your App Server would do
  
  const notificationPayload = {
    token: fcmToken,
    notification: {
      title: title,
      body: body,
    },
    data: {
      ...data,
      timestamp: new Date().toISOString(),
      action: data.action || 'default',
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

  console.log('=== Simulating App Server Notification ===');
  console.log('Target FCM Token:', fcmToken);
  console.log('Notification Payload:', JSON.stringify(notificationPayload, null, 2));
  
  // In real implementation, this would be:
  // const admin = require('firebase-admin');
  // const response = await admin.messaging().send(notificationPayload);
  // console.log('Successfully sent message:', response);
  
  console.log('✅ Notification sent successfully!');
  console.log('👉 This would appear on your device now');
  console.log('==========================================\n');
};

// Example usage:
const exampleFcmToken = 'fGJP7KbYTbCXXXXXXXXXXXXXXX:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

// Simulate different types of notifications your App Server might send
const testNotifications = [
  {
    title: '🎉 Welcome!',
    body: 'Thanks for registering! Your device is now connected.',
    data: { action: 'welcome', url: 'https://yourapp.com/welcome' }
  },
  {
    title: '📱 New Update Available',
    body: 'Version 2.0 is now available with exciting new features!',
    data: { action: 'update', version: '2.0.0' }
  },
  {
    title: '🔔 Reminder',
    body: 'Don\'t forget to check your messages.',
    data: { action: 'reminder', category: 'messages' }
  },
  {
    title: '⚠️ Security Alert',
    body: 'New login detected from Windows device.',
    data: { action: 'security', priority: 'high' }
  }
];

// Usage examples (uncomment to test):
// sendNotificationToFirebase(exampleFcmToken, testNotifications[0].title, testNotifications[0].body, testNotifications[0].data);

module.exports = {
  sendNotificationToFirebase,
  testNotifications
};

console.log('🚀 Backend Notification Simulator Ready!');
console.log('📋 Copy this file to a Node.js project and install firebase-admin to actually send notifications');
console.log('💡 Replace exampleFcmToken with actual token from your app');