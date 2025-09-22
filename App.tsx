import React, {useEffect, useState} from 'react';
import {
  Alert,
  AppState,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';

// Configuration for your notification service
const NOTIFICATION_SERVICE_CONFIG = {
  // Replace with your actual notification service registration endpoint
  // For local testing with Android emulator, use 10.0.2.2 instead of localhost
  REGISTRATION_ENDPOINT: 'http://10.0.2.2:3000/api/register',
  // For production: 'https://your-server.com/api/register'
  
  // Add any required headers for your API
  HEADERS: {
    'Content-Type': 'application/json',
    // 'Authorization': 'Bearer your-api-key', // Add if needed
    // 'X-API-Key': 'your-api-key', // Add if needed
  },
};

interface DeviceInfo {
  token: string | null;
  permission: string;
  registrationStatus: string;
  notificationsEnabled: boolean;
}

function App(): React.JSX.Element {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    token: null,
    permission: 'Not requested',
    registrationStatus: 'Not registered',
    notificationsEnabled: false,
  });
  const [notifications, setNotifications] = useState<any[]>([]);

  const openNotificationSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        console.log('🔧 Attempting to open notification settings');
        
        // Try to open the notification settings directly
        try {
          await Linking.openURL(`android.settings.APP_NOTIFICATION_SETTINGS?package=com.demandroidapp`);
          return true;
        } catch (error) {
          console.log('Direct notification settings failed, trying app info:', error);
          
          // Fallback to app info page where user can access notifications
          try {
            await Linking.openURL(`android.settings.APPLICATION_DETAILS_SETTINGS?package=com.demandroidapp`);
            return true;
          } catch (error2) {
            console.log('App info page failed, trying general settings:', error2);
            
            // Final fallback - open general settings
            await Linking.openURL('android.settings.SETTINGS');
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to open notification settings:', error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    try {
      // First check current permission status
      const currentAuthStatus = await messaging().hasPermission();
      console.log('Current permission status:', currentAuthStatus);
      
      if (currentAuthStatus === 1 || currentAuthStatus === 2) {
        // Already have permission
        console.log('Permission already granted');
        setDeviceInfo(prev => ({
          ...prev,
          permission: 'Granted',
          notificationsEnabled: true,
        }));
        await getFCMToken();
        return true;
      }

      // Request permission
      const authStatus = await messaging().requestPermission({
        sound: true,
        announcement: true,
        alert: true,
        badge: true,
      });
      
      console.log('Permission request result:', authStatus);
      
      // Use numeric values instead of enum constants to avoid deprecation warnings
      const enabled = authStatus === 1 || authStatus === 2; // 1=AUTHORIZED, 2=PROVISIONAL

      if (enabled) {
        console.log('Notification permission granted');
        
        // Double-check by verifying permission again
        const verifyStatus = await messaging().hasPermission();
        const actuallyEnabled = verifyStatus === 1 || verifyStatus === 2;
        
        console.log('Verification check:', verifyStatus, 'Actually enabled:', actuallyEnabled);
        
        setDeviceInfo(prev => ({
          ...prev,
          permission: actuallyEnabled ? 'Granted' : 'Granted (verifying...)',
          notificationsEnabled: actuallyEnabled,
        }));
        
        if (actuallyEnabled) {
          await getFCMToken();
          return true;
        } else {
          // Instead of showing manual instructions, directly open settings
          Alert.alert(
            'Complete Setup',
            'Please enable notifications in the settings screen that will open next.',
            [
              {
                text: 'Open Settings', 
                onPress: async () => {
                  const opened = await openNotificationSettings();
                  if (!opened) {
                    Alert.alert(
                      'Settings Access Issue',
                      'Please manually go to Settings > Apps > Push Notification Demo > Notifications and enable notifications.',
                      [{text: 'OK'}]
                    );
                  }
                }
              },
              {text: 'Cancel', style: 'cancel'}
            ]
          );
          return false;
        }
      } else {
        console.log('Notification permission denied');
        setDeviceInfo(prev => ({
          ...prev,
          permission: 'Denied',
          notificationsEnabled: false,
        }));
        return false;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setDeviceInfo(prev => ({
        ...prev,
        permission: 'Error',
        notificationsEnabled: false,
      }));
      return false;
    }
  };

  const registerDeviceWithBackend = async (token: string) => {
    try {
      // Registering device with your notification service
      console.log('Registering device with notification service...', token);
      
      setDeviceInfo(prev => ({
        ...prev,
        registrationStatus: 'Registering...',
      }));

      const deviceData = {
        fcmToken: token,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
        },
        appInfo: {
          version: '1.0.0',
          bundleId: 'com.pushnotificationapp',
        },
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(NOTIFICATION_SERVICE_CONFIG.REGISTRATION_ENDPOINT, {
        method: 'POST',
        headers: NOTIFICATION_SERVICE_CONFIG.HEADERS,
        body: JSON.stringify(deviceData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Device registration successful:', result);
        
        setDeviceInfo(prev => ({
          ...prev,
          registrationStatus: 'Registered with Notification Service ✅',
        }));
      } else {
        const errorText = await response.text();
        console.error('Registration failed:', response.status, errorText);
        
        setDeviceInfo(prev => ({
          ...prev,
          registrationStatus: `Registration failed (${response.status})`,
        }));
      }
    } catch (error) {
      console.error('Device registration failed:', error);
      setDeviceInfo(prev => ({
        ...prev,
        registrationStatus: 'Registration failed - Network error',
      }));
    }
  };

  const getFCMToken = async () => {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      setDeviceInfo(prev => ({
        ...prev,
        token: token,
      }));
      
      // Register device with backend
      await registerDeviceWithBackend(token);
    } catch (error) {
      console.error('Failed to get FCM token:', error);
    }
  };

  const setupNotificationHandlers = () => {
    // Handle foreground notifications
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification:', remoteMessage);
      setNotifications(prev => [
        ...prev,
        {
          ...remoteMessage,
          type: 'foreground',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      
      Alert.alert(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body || 'New message received',
      );
    });

    // Handle notification when app is opened from notification
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('App opened from notification:', remoteMessage);
      setNotifications(prev => [
        ...prev,
        {
          ...remoteMessage,
          type: 'opened_app',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    });

    // Handle notification when app is opened from quit state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened from quit state:', remoteMessage);
          setNotifications(prev => [
            ...prev,
            {
              ...remoteMessage,
              type: 'initial',
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        }
      });

    return unsubscribeForeground;
  };

  const createNotificationChannel = async () => {
    // Create a default notification channel for Android
    try {
      const channel = {
        id: 'default_notification_channel_id',
        name: 'Default Notifications',
        description: 'Default notification channel for push notifications',
        importance: 4, // IMPORTANCE_HIGH
        sound: 'default',
        vibrate: true,
        showBadge: true,
      };
      
      // Note: React Native Firebase handles channel creation automatically
      // but we can ensure it's created with proper settings
      console.log('📱 Notification channel configured:', channel);
    } catch (error) {
      console.error('❌ Failed to create notification channel:', error);
    }
  };

  useEffect(() => {
    createNotificationChannel();
    requestNotificationPermission();
    setupNotificationHandlers();
    
    // Periodically check actual permission status to keep UI in sync
    const permissionCheckInterval = setInterval(async () => {
      await checkActualPermissionStatus();
    }, 3000); // Check every 3 seconds for better responsiveness
    
    // Listen for app state changes to check permissions when user returns from settings
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // User returned to app - check permission status
        setTimeout(async () => {
          await checkActualPermissionStatus();
        }, 500); // Small delay to ensure settings are applied
      }
    };
    
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      clearInterval(permissionCheckInterval);
      appStateSubscription?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkActualPermissionStatus = async () => {
    try {
      const authStatus = await messaging().hasPermission();
      const actuallyEnabled = authStatus === 1 || authStatus === 2; // 1=AUTHORIZED, 2=PROVISIONAL
      
      console.log('📊 Checking actual permission status:', authStatus, 'Enabled:', actuallyEnabled);
      
      // Update UI to reflect actual system permission status
      setDeviceInfo(prev => ({
        ...prev,
        notificationsEnabled: actuallyEnabled,
        permission: actuallyEnabled ? 'Granted' : 'Not granted in system settings',
      }));
      
      return actuallyEnabled;
    } catch (error) {
      console.error('❌ Failed to check permission status:', error);
      return false;
    }
  };

  const toggleNotifications = async () => {
    // First, check the actual system permission status
    const actualStatus = await checkActualPermissionStatus();
    
    if (actualStatus) {
      // Notifications are actually enabled - offer to disable
      Alert.alert(
        'Disable Notifications',
        'This will open settings where you can turn off notifications.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Open Settings',
            onPress: async () => {
              const opened = await openNotificationSettings();
              if (!opened) {
                Alert.alert(
                  'Manual Setup Required',
                  'Please go to Android Settings > Apps > Push Notification Demo > Notifications to disable notifications.',
                  [{text: 'OK'}]
                );
              }
            },
          },
        ]
      );
    } else {
      // Notifications are not enabled - seamless enable flow
      Alert.alert(
        'Enable Notifications',
        'Allow this app to send you push notifications?',
        [
          {text: 'Don\'t Allow', style: 'cancel'},
          {
            text: 'Allow',
            onPress: async () => {
              const success = await requestNotificationPermission();
              
              // If the initial permission request didn't fully work, guide to settings
              if (!success) {
                setTimeout(async () => {
                  const newStatus = await checkActualPermissionStatus();
                  if (!newStatus) {
                    Alert.alert(
                      'Complete in Settings',
                      'Let\'s finish setting up notifications in your device settings.',
                      [
                        {
                          text: 'Open Settings',
                          onPress: async () => {
                            const opened = await openNotificationSettings();
                            if (!opened) {
                              Alert.alert(
                                'Settings Access Issue',
                                'Please manually go to Settings > Apps > Push Notification Demo > Notifications and enable notifications.',
                                [{text: 'OK'}]
                              );
                            }
                          }
                        },
                        {text: 'Skip', style: 'cancel'}
                      ]
                    );
                  }
                }, 1000);
              }
            },
          },
        ]
      );
    }
  };

  const sendTestNotification = () => {
    // Simulate receiving a notification for testing
    const testNotification = {
      notification: {
        title: 'Test Notification',
        body: 'This is a test push notification from your app!',
      },
      data: {
        action: 'test',
        url: 'https://example.com',
      },
      type: 'test',
      timestamp: new Date().toLocaleTimeString(),
    };

    setNotifications(prev => [...prev, testNotification]);
    Alert.alert(
      testNotification.notification.title,
      testNotification.notification.body,
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <ScrollView contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>🔔 Push Notification Demo</Text>
          <Text style={styles.subtitle}>
            Testing FCM integration with your architecture
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Device Registration Status</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Permission Status:</Text>
            <Text style={[styles.infoValue, getStatusColor(deviceInfo.permission)]}>
              {deviceInfo.permission}
            </Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Registration Status:</Text>
            <Text style={[styles.infoValue, getStatusColor(deviceInfo.registrationStatus)]}>
              {deviceInfo.registrationStatus}
            </Text>
          </View>

          {deviceInfo.token && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>FCM Token:</Text>
              <Text style={styles.tokenText} numberOfLines={3}>
                {deviceInfo.token}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Notification Settings</Text>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              deviceInfo.notificationsEnabled 
                ? styles.toggleButtonEnabled 
                : styles.toggleButtonDisabled
            ]}
            onPress={toggleNotifications}>
            <Text style={[
              styles.toggleButtonText,
              deviceInfo.notificationsEnabled 
                ? styles.toggleButtonTextEnabled 
                : styles.toggleButtonTextDisabled
            ]}>
              {deviceInfo.notificationsEnabled ? '🔕 Disable Notifications' : '🔔 Enable Notifications'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.settingsHint}>
            {deviceInfo.notificationsEnabled 
              ? 'Tap to disable push notifications' 
              : 'Tap to enable push notifications (will request permission)'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Testing</Text>
          <TouchableOpacity
            style={[
              styles.testButton,
              !deviceInfo.notificationsEnabled && styles.testButtonDisabled
            ]}
            onPress={deviceInfo.notificationsEnabled ? sendTestNotification : undefined}
            disabled={!deviceInfo.notificationsEnabled}>
            <Text style={[
              styles.testButtonText,
              !deviceInfo.notificationsEnabled && styles.testButtonTextDisabled
            ]}>
              {deviceInfo.notificationsEnabled 
                ? 'Send Test Notification' 
                : 'Enable Notifications First'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📥 Received Notifications ({notifications.length})
          </Text>
          {notifications.length === 0 ? (
            <Text style={styles.emptyText}>
              No notifications received yet. Try sending a test notification!
            </Text>
          ) : (
            notifications.reverse().map((notification, index) => (
              <View key={index} style={styles.notificationCard}>
                <Text style={styles.notificationTitle}>
                  {notification.notification?.title || 'No Title'}
                </Text>
                <Text style={styles.notificationBody}>
                  {notification.notification?.body || 'No Body'}
                </Text>
                <Text style={styles.notificationMeta}>
                  Type: {notification.type} • {notification.timestamp}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const getStatusColor = (status: string) => {
  if (status.includes('Granted') || status.includes('Registered')) {
    return {color: '#28a745'};
  } else if (status.includes('Denied') || status.includes('failed')) {
    return {color: '#dc3545'};
  } else {
    return {color: '#ffc107'};
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 5,
  },
  section: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 15,
  },
  infoCard: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  infoValue: {
    fontSize: 14,
    marginTop: 5,
    fontWeight: '500',
  },
  tokenText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#495057',
    marginTop: 5,
    padding: 5,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
  },
  testButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  testButtonTextDisabled: {
    color: '#fff',
  },
  emptyText: {
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  notificationCard: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343a40',
  },
  notificationBody: {
    fontSize: 14,
    color: '#495057',
    marginTop: 5,
  },
  notificationMeta: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
  },
  toggleButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleButtonEnabled: {
    backgroundColor: '#dc3545',
  },
  toggleButtonDisabled: {
    backgroundColor: '#28a745',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButtonTextEnabled: {
    color: '#fff',
  },
  toggleButtonTextDisabled: {
    color: '#fff',
  },
  settingsHint: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default App;
