// Service worker: receives Web Push events and shows notifications.
// This runs even when the PWA is closed / the phone is locked.

self.addEventListener('push', (event) => {
  let data = { title: 'ESP32', body: '' };
  try {
    data = event.data.json();
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const title = data.title || 'ESP32';
  const options = {
    body: data.body || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/badge-72.png',
    vibrate: [200, 100, 200],
    tag: 'esp32-msg',
    renotify: true,
    timestamp: data.ts || Date.now(),
    data: { ts: data.ts },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification focuses (or opens) the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
