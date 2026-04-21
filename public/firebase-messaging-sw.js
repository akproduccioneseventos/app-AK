// public/firebase-messaging-sw.js
// Firebase Cloud Messaging Service Worker
// This file must live at the root of the public directory so it is served at /firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase config — public values only (no secrets).
// These mirror the values in src/lib/firebase/config.ts.
const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY || 'dummy-key-for-firestore',
  authDomain: self.FIREBASE_AUTH_DOMAIN || 'presupuestador-ak-producciones.firebaseapp.com',
  projectId: self.FIREBASE_PROJECT_ID || 'presupuestador-ak-producciones',
  storageBucket: self.FIREBASE_STORAGE_BUCKET || 'presupuestador-ak-producciones.firebasestorage.app',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: self.FIREBASE_APP_ID || '',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'AK Producciones';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    silent: false,
    tag: payload.data?.tag || payload.messageId || 'ak-notification',
    renotify: true,
  };

  self.registration.showNotification(title, options);
});
