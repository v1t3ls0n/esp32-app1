const $ = (id) => document.getElementById(id);

function log(msg) {
  const el = $('log');
  const time = new Date().toLocaleTimeString('he-IL');
  el.textContent = `${time}  ${msg}\n` + el.textContent;
}

// VAPID public key comes as URL-safe base64; the browser needs a Uint8Array.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function updateStatus(reg) {
  const sub = await reg.pushManager.getSubscription();
  const active = !!sub && Notification.permission === 'granted';
  $('status').textContent = active ? 'מנוי פעיל ✅' : 'לא רשום עדיין';
  $('status').className = active ? 'status ok' : 'status';
  $('enable').textContent = active ? 'רשום מחדש' : 'הפעל נוטיפיקיישנים';
  $('test').disabled = Notification.permission !== 'granted';
}

async function subscribe(reg) {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    log('❌ ההרשאה נדחתה. יש לאשר נוטיפיקיישנים בהגדרות הדפדפן.');
    return;
  }
  const key = await (await fetch('api/vapidPublicKey')).text();
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
  const res = await fetch('api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  });
  const json = await res.json();
  log(`✅ נרשמת בהצלחה! מספר מכשירים רשומים: ${json.count}`);
  await updateStatus(reg);
}

async function main() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    log('❌ הדפדפן הזה לא תומך ב-Web Push. נסי Chrome על אנדרואיד.');
    $('enable').disabled = true;
    return;
  }

  const reg = await navigator.serviceWorker.register('sw.js');
  log('Service Worker רשום ✔');
  await updateStatus(reg);

  $('enable').onclick = () => subscribe(reg).catch((e) => log('שגיאה: ' + e.message));

  // Fire a local notification so you can see how it looks without the ESP32.
  $('test').onclick = async () => {
    const r = await navigator.serviceWorker.ready;
    await r.showNotification('בדיקה מקומית 🔔', {
      body: 'ככה יראה נוטיפיקיישן מה-ESP32',
      icon: 'icons/icon-192.png',
      badge: 'icons/badge-72.png',
      vibrate: [200, 100, 200],
    });
    log('נשלח נוטיפיקיישן בדיקה מקומי');
  };
}

main().catch((e) => log('שגיאה בטעינה: ' + e.message));
