// Subscription storage.
//
// On Vercel (serverless) the filesystem is ephemeral and NOT shared between
// invocations, so subscriptions must live in a real store. We use Upstash
// Redis (a.k.a. Vercel KV — the Vercel integration sets the same env vars).
//
//   - Redis when KV_REST_API_URL / KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_*)
//     are set  -> used on Vercel.
//   - A local temp file otherwise -> used by `vercel dev` / offline tests.
//
// Subscriptions are stored in a Redis hash keyed by their endpoint URL, which
// gives free de-duplication and O(1) removal of dead endpoints.

const KEY = 'push:subs';

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let store;

if (url && token) {
  const { Redis } = require('@upstash/redis');
  const redis = new Redis({ url, token });
  store = {
    backend: 'redis',
    async add(sub) {
      await redis.hset(KEY, { [sub.endpoint]: sub });
    },
    async all() {
      const map = await redis.hgetall(KEY);
      return map ? Object.values(map) : [];
    },
    async remove(endpoints) {
      if (endpoints.length) await redis.hdel(KEY, ...endpoints);
    },
    async count() {
      return (await redis.hlen(KEY)) || 0;
    },
  };
} else {
  // Local fallback (ephemeral on Vercel — only for local dev/testing).
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  const file = path.join(os.tmpdir(), 'esp32-push-subs.json');
  const load = () => {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return {};
    }
  };
  const save = (map) => fs.writeFileSync(file, JSON.stringify(map));
  store = {
    backend: 'file(temp)',
    async add(sub) {
      const map = load();
      map[sub.endpoint] = sub;
      save(map);
    },
    async all() {
      return Object.values(load());
    },
    async remove(endpoints) {
      const map = load();
      endpoints.forEach((e) => delete map[e]);
      save(map);
    },
    async count() {
      return Object.keys(load()).length;
    },
  };
}

module.exports = store;
