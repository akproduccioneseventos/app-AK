// public/firebase-messaging-sw.js
// Firebase Cloud Messaging Service Worker
// This file must live at the root of the public directory so it is served at /firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase public config — estos son valores públicos (no secretos).
// Los service workers son archivos estáticos: no tienen acceso a process.env
// ni a variables inyectadas dinámicamente como self.FIREBASE_*.
// Los valores aquí son los mismos que en src/lib/firebase/config.ts y son
// seguros para estar en código público (son visibles en cualquier app web).
const firebaseConfig = {
  apiKey: 'AIzaSyDummy-replace-with-real-value-from-firebase-console',
  authDomain: 'presupuestador-ak-producciones.firebaseapp.com',
  projectId: 'presupuestador-ak-producciones',
  storageBucket: 'presupuestador-ak-producciones.firebasestorage.app',
  messagingSenderId: '',
  appId: '',
};

// IMPORTANTE: Reemplazar los valores de apiKey, messagingSenderId y appId
// con los valores reales del proyecto Firebase.
// Obtenerlos en: https://console.firebase.google.com/project/presupuestador-ak-producciones/settings/general
// Estos valores son públicos y seguros de incluir en el código fuente del SW.

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
  };

  self.registration.showNotification(title, options);
});
