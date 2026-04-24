// public/firebase-messaging-sw.js
// Firebase Cloud Messaging Service Worker
// This file must live at the root of the public directory so it is served at /firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase public config — estos valores son públicos (NO son secretos).
//
// Los service workers son archivos estáticos descargados directamente por el browser.
// No tienen acceso a process.env ni a variables inyectadas por Next.js/webpack.
// Por eso los valores de config de Firebase deben estar aquí de forma literal.
//
// ▶ Para configurar los valores reales:
//   1. Ir a https://console.firebase.google.com/project/presupuestador-ak-producciones/settings/general
//   2. En "Tus apps" → app web → "Configuración del SDK de Firebase"
//   3. Reemplazar apiKey, messagingSenderId y appId con los valores reales.
//      Estos valores son PÚBLICOS y seguros de incluir en el código fuente.
//
// authDomain, projectId y storageBucket ya son correctos para este proyecto.
const firebaseConfig = {
  apiKey: 'REEMPLAZAR-CON-FIREBASE-API-KEY',
  authDomain: 'presupuestador-ak-producciones.firebaseapp.com',
  projectId: 'presupuestador-ak-producciones',
  storageBucket: 'presupuestador-ak-producciones.firebasestorage.app',
  messagingSenderId: 'REEMPLAZAR-CON-MESSAGING-SENDER-ID',
  appId: 'REEMPLAZAR-CON-APP-ID',
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
  };

  self.registration.showNotification(title, options);
});
