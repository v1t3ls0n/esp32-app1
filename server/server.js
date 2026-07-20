// ESP32 → Web Push relay
// -----------------------
// Flow:
//   1. The PWA registers a push subscription  -> POST /api/subscribe (stored here)
//   2. The ESP32 sends a message             -> POST /api/notify (auth by DEVICE_TOKEN)
//   3. This server pushes a Web Push message to every stored subscription
//   4. The browser's service worker shows the notification (even when the app is closed)

require('dotenv').config();
const express = require('express');
const webpush = require('web-push');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '16kb' }));

const PORT = process.env.PORT || 3000;
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
// Shared secret between the ESP32 and this server. CHANGE IT.
const DEVICE_TOKEN = process.env.DEVICE_TOKEN || 'change-me';

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error('❌ Missing VAPID keys. Generate them with:  npm run gen-keys');
  console.error('   then put VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in server/.env');
  process.exit(1);
}
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

// --- Subscription storage (simple JSON file; swap for a DB when you outgrow it) ---
const SUBS_FILE = path.join(__dirname, 'subscriptions.json');
let subscriptions = [];
try {
  subscriptions = JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8'));
} catch {
  subscriptions = [];
}
function saveSubs() {
  fs.writeFileSync(SUBS_FILE, JSON.stringify(subscriptions, null, 2));
}

// --- Serve the PWA (static files in ../web) ---
app.use(express.static(path.join(__dirname, '..', 'web')));

// Public VAPID key so the front-end can subscribe
app.get('/api/vapidPublicKey', (req, res) => {
  res.type('text/plain').send(VAPID_PUBLIC);
});

// Front-end registers its push subscription here
app.post('/api/subscribe', (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) {
    return res.status(400).json({ error: 'invalid subscription' });
  }
  const exists = subscriptions.some((s) => s.endpoint === sub.endpoint);
  if (!exists) {
    subscriptions.push(sub);
    saveSubs();
  }
  res.status(201).json({ ok: true, count: subscriptions.length });
});

// The ESP32 posts messages here
app.post('/api/notify', async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '') || req.query.token;
  if (token !== DEVICE_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const title = String(req.body.title || 'ESP32').slice(0, 100);
  const body = String(req.body.message ?? req.body.body ?? '').slice(0, 500);
  const payload = JSON.stringify({ title, body, ts: Date.now() });

  if (subscriptions.length === 0) {
    return res.json({ ok: true, sent: 0, total: 0, note: 'no subscribers yet' });
  }

  const results = await Promise.allSettled(
    subscriptions.map((s) => webpush.sendNotification(s, payload))
  );

  // Drop subscriptions the push service reports as gone (404/410)
  const survivors = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      survivors.push(subscriptions[i]);
    } else {
      const code = r.reason && r.reason.statusCode;
      if (code !== 404 && code !== 410) survivors.push(subscriptions[i]);
    }
  });
  if (survivors.length !== subscriptions.length) {
    subscriptions = survivors;
    saveSubs();
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  res.json({ ok: true, sent, total: results.length });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, subscribers: subscriptions.length });
});

app.listen(PORT, () => {
  console.log(`✅ ESP32 relay listening on port ${PORT}`);
  console.log(`   Subscribers loaded: ${subscriptions.length}`);
});
