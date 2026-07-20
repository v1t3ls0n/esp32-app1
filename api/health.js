// GET /api/health — quick sanity check.
const store = require('./_lib/store');

module.exports = async (req, res) => {
  res.json({ ok: true, backend: store.backend, subscribers: await store.count() });
};
