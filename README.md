# ESP32 → Push Notifications on your phone

Send a message from an **ESP32** and get it as a **push notification** on your
Android phone — even when the app is closed and the phone is locked.

```
ESP32 ──HTTP POST /api/notify──► Relay (cloud) ──Web Push (VAPID)──► Chrome/Android ──► Service Worker ──► notification
                                    ▲
        PWA ──POST /api/subscribe──┘   (registers the phone for push)
```

Three parts, all in this repo:

| Folder      | What it is                                                        |
|-------------|-------------------------------------------------------------------|
| `server/`   | Node.js relay. Receives ESP32 messages, sends Web Push, serves the app. |
| `web/`      | The installable PWA (the app on your phone).                      |
| `firmware/` | Arduino sketch for the ESP32.                                     |

---

## 1. Set up the relay server

```bash
cd server
npm install
npm run gen-keys        # prints VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
cp .env.example .env     # then paste the two keys into .env
```

Edit `server/.env`:

```
VAPID_PUBLIC_KEY=...        # from gen-keys
VAPID_PRIVATE_KEY=...       # from gen-keys
VAPID_SUBJECT=mailto:you@example.com
DEVICE_TOKEN=pick-a-long-random-secret   # the ESP32 must send this
```

Run it:

```bash
npm start        # http://localhost:3000
```

## 2. Put it online (needed for real push)

Web Push and service workers require **HTTPS**, and your phone needs to reach
the server from anywhere. Two easy options:

**A) Quick test — a tunnel to your laptop**
```bash
# in another terminal, with the server running on :3000
npx cloudflared tunnel --url http://localhost:3000
# or: ngrok http 3000
```
Use the `https://…` URL it prints.

**B) Permanent — deploy to Render (free)**
- Push this repo to GitHub, then "New Web Service" on [render.com] pointing at it
  (a `render.yaml` is included).
- Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `DEVICE_TOKEN` in the dashboard.
- You get a permanent `https://your-app.onrender.com` URL.

> `localhost` alone works for a desktop browser test, but your **phone** can't
> reach it — use a tunnel or a deploy for the real thing.

## 3. Install the app on your phone

1. Open the relay's HTTPS URL in **Chrome on Android**.
2. Tap **הפעל נוטיפיקיישנים** and allow notifications.
3. Tap **שלח נוטיפיקיישן בדיקה** — you should get a local test notification.
4. Chrome menu → **Add to Home screen** to install it as an app.

## 4. Flash the ESP32

Open `firmware/esp32-notify/esp32-notify.ino` in the Arduino IDE (with the
ESP32 board package installed) and edit the config block:

```cpp
const char* WIFI_SSID   = "YOUR_WIFI_NAME";
const char* WIFI_PASS   = "YOUR_WIFI_PASSWORD";
const char* RELAY_URL   = "https://YOUR-RELAY-HOST/api/notify";
const char* DEVICE_TOKEN = "same-secret-as-server-.env";
```

Upload. On boot it sends "The ESP32 is online! 🚀", and it sends another
message every time you press the **BOOT** button. Replace that with your own
sensor logic.

---

## API reference

| Method & path            | Auth                 | Purpose                          |
|--------------------------|----------------------|----------------------------------|
| `GET  /api/vapidPublicKey` | none               | Public key for the front-end.    |
| `POST /api/subscribe`      | none               | Store a browser push subscription. |
| `POST /api/notify`         | `Authorization: Bearer <DEVICE_TOKEN>` | Send a notification. Body: `{"title":"...","message":"..."}` |
| `GET  /api/health`         | none               | `{ ok, subscribers }`            |

Test the notify endpoint from a laptop:

```bash
curl -X POST https://YOUR-RELAY-HOST/api/notify \
  -H "Authorization: Bearer YOUR_DEVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Hello from curl 👋"}'
```

## Notes & limits

- **iPhone**: Web Push works only for PWAs *installed* to the Home Screen
  (iOS 16.4+). On Android/Chrome it works once notifications are allowed.
- Subscriptions are stored in `server/subscriptions.json`. Fine for personal
  use; move to a database if you need scale.
- Dead subscriptions (404/410 from the push service) are pruned automatically.
- `client.setInsecure()` on the ESP32 skips TLS certificate checks for
  simplicity. For production, pin the root CA instead.
