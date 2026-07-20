// POST /api/subscribe — store a browser's push subscription.
const store = require('./_lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  const sub = req.body;
  if (!sub || !sub.endpoint) {
    return res.status(400).json({ error: 'invalid subscription' });
  }
  await store.add(sub);
  res.status(201).json({ ok: true, count: await store.count() });
};
