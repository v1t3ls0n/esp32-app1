// POST /api/notify — the ESP32 posts a message here; we fan it out as Web Push.
// Auth: Authorization: Bearer <DEVICE_TOKEN>  (or ?token=... query param)
const webpush = require('web-push');
const store = require('./_lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'server missing VAPID keys — set env vars' });
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/i, '') || (req.query && req.query.token);
  if (token !== (process.env.DEVICE_TOKEN || 'change-me')) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const body = req.body || {};
  const title = String(body.title || 'ESP32').slice(0, 100);
  const message = String(body.message ?? body.body ?? '').slice(0, 500);
  const payload = JSON.stringify({ title, body: message, ts: Date.now() });

  const subs = await store.all();
  if (subs.length === 0) {
    return res.json({ ok: true, sent: 0, total: 0, note: 'no subscribers yet' });
  }

  const results = await Promise.allSettled(
    subs.map((s) => webpush.sendNotification(s, payload))
  );

  // Prune subscriptions the push service reports as gone (404/410).
  const dead = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const code = r.reason && r.reason.statusCode;
      if (code === 404 || code === 410) dead.push(subs[i].endpoint);
    }
  });
  if (dead.length) await store.remove(dead);

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  res.json({ ok: true, sent, total: results.length });
};
