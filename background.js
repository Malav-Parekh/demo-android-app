import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';

// Register background handler for when app is quit/backgrounded
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📩 Background message handled:', remoteMessage);
  
  try {
    // Log the notification details for debugging
    console.log('📊 Background notification data:', {
      messageId: remoteMessage.messageId,
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      data: remoteMessage.data,
      timestamp: new Date().toISOString(),
      hasNotification: !!remoteMessage.notification,
    });

    // For background notifications, the system should automatically display
    // notifications that have a 'notification' payload
    if (remoteMessage.notification) {
      console.log('✅ Notification payload detected - system will display notification');
      console.log('📱 Notification details:', {
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body,
        android: remoteMessage.notification.android
      });
    } else {
      console.log('⚠️ No notification payload - only data payload received');
    }

    // Process any custom data
    if (remoteMessage.data) {
      console.log('📦 Processing custom data:', remoteMessage.data);
    }

    // Return a promise to indicate successful processing
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Error in background message handler:', error);
    return Promise.reject(error);
  }
});

// Register the background task
AppRegistry.registerHeadlessTask('RNFirebaseBackgroundMessage', () => messaging().setBackgroundMessageHandler);