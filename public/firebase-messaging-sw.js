'use strict';

// Firebase SDK (互換版) をCDN経由で読み込み
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

// Firebase構成情報
firebase.initializeApp({
  apiKey: "AIzaSyDLwecd86ALdpenqmG5YnQyQHBqKZMvnY0",
  authDomain: "aina-life-dev.firebaseapp.com",
  projectId: "aina-life-dev",
  messagingSenderId: "361453219103",
  appId: "1:361453219103:web:78221bd07d7ce262d0142a",
});

// バックグラウンド通知処理
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon,
    data: payload.data // カスタムデータを通知に含める
  });
});

// Optional: Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.', event);
  event.notification.close();

  // 通知にURLが含まれていれば開く
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});