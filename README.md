# ESP32 → Push Notifications on your phone

Send a message from an **ESP32** and get it as a **push notification** on your
Android phone — even when the app is closed and the phone is locked. Deployed on
**Vercel** (serverless).

```
ESP32 ──POST /api/notify──► Vercel Functions ──Web Push (VAPID)──► Chrome/Android ──► Service Worker ──► notification
                                 ▲       │
     PWA ──POST /api/subscribe───┘       └── subscriptions stored in Vercel KV / Upstash Redis
```

## Layout

| Path         | What it is                                                        |
|--------------|-------------------------------------------------------------------|
| `public/`    | The installable PWA (served at the site root by Vercel).          |
| `api/`       | Vercel serverless functions (`subscribe`, `notify`, `vapidPublicKey`, `health`). |
| `api/_lib/`  | Shared subscription store (Redis, with a local temp-file fallback). |
| `firmware/`  | Arduino sketch for the ESP32.                                     |
| `scripts/`   | `generate-vapid.js` — one-off VAPID key generator.                |

Because Vercel Functions are **stateless and ephemeral**, subscriptions can't
live in a file — they're kept in **Vercel KV / Upstash Redis**.

---

## Deploy to Vercel

### 1. Generate VAPID keys (once)

```bash
npm install
npm run gen-keys
```

Copy the printed `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.

### 2. Import the repo into Vercel

- [vercel.com/new](https://vercel.com/new) → import `v1t3ls0n/esp32-app1`.
- Framework preset: **Other**. No build command needed.

### 3. Add a Redis store (for subscriptions)

In the Vercel project: **Storage → Create Database → KV (Upstash Redis)** and
connect it to the project. Vercel injects `KV_REST_API_URL` and
`KV_REST_API_TOKEN` automatically.

> Prefer plain Upstash? Create a DB at [upstash.com](https://upstash.com) and set
> `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` instead — the code reads
> either pair.

### 4. Set environment variables

Project **Settings → Environment Variables**:

| Name                | Value                                            |
|---------------------|--------------------------------------------------|
| `VAPID_PUBLIC_KEY`  | from `npm run gen-keys`                           |
| `VAPID_PRIVATE_KEY` | from `npm run gen-keys`                           |
| `VAPID_SUBJECT`     | `mailto:you@example.com`                          |
| `DEVICE_TOKEN`      | a long random secret (the ESP32 must send it)     |

(`KV_REST_API_*` were added for you in step 3.) **Redeploy** after adding them.

### 5. Install the app on your phone

1. Open your `https://<project>.vercel.app` URL in **Chrome on Android**.
2. Tap **הפעל נוטיפיקיישנים** and allow notifications.
3. Tap **שלח נוטיפיקיישן בדיקה** — you should get a local test notification.
4. Chrome menu → **Add to Home screen** to install it as an app.

### 6. Flash the ESP32

Open `firmware/esp32-notify/esp32-notify.ino` in the Arduino IDE (ESP32 board
package installed) and edit the config block:

```cpp
const char* WIFI_SSID    = "YOUR_WIFI_NAME";
const char* WIFI_PASS    = "YOUR_WIFI_PASSWORD";
const char* RELAY_URL    = "https://<project>.vercel.app/api/notify";
const char* DEVICE_TOKEN = "same-secret-as-vercel-env";
```

Upload. On boot it sends "The ESP32 is online! 🚀", and it sends another message
every time you press the **BOOT** button. Replace that with your own sensor logic.

---

## Local development

```bash
npm install
npm i -g vercel   # or: npx vercel dev
vercel dev        # runs the functions + serves public/ at http://localhost:3000
```

Without Redis env vars, the store falls back to a local temp file so you can test
locally. Provide `VAPID_*` and `DEVICE_TOKEN` via a `.env.local` file.

## API reference

| Method & path              | Auth                                   | Purpose                          |
|----------------------------|----------------------------------------|----------------------------------|
| `GET  /api/vapidPublicKey` | none                                   | Public key for the front-end.    |
| `POST /api/subscribe`      | none                                   | Store a browser push subscription. |
| `POST /api/notify`         | `Authorization: Bearer <DEVICE_TOKEN>` | Send a notification. Body `{"title","message"}`. |
| `GET  /api/health`         | none                                   | `{ ok, backend, subscribers }`   |

Test the notify endpoint:

```bash
curl -X POST https://<project>.vercel.app/api/notify \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Hello from curl 👋"}'
```

## Notes & limits

- **iPhone**: Web Push works only for PWAs *installed* to the Home Screen
  (iOS 16.4+). On Android/Chrome it works once notifications are allowed.
- Dead subscriptions (404/410 from the push service) are pruned automatically.
- `client.setInsecure()` on the ESP32 skips TLS certificate checks for
  simplicity. For production, pin the root CA instead.
