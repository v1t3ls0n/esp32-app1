// GET /api/vapidPublicKey — the front-end needs this to subscribe to push.
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(process.env.VAPID_PUBLIC_KEY || '');
};
