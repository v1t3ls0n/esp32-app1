# 📘 Lesson Summary — Claude Code, Git/GitHub, Vercel & ESP32

## 🎯 Goal of the lesson

In this lesson we built a **real, end-to-end system**:

> The ESP32 sends a message 📤 → and your phone gets a **push notification** 🔔 — from anywhere in the world, even when the app is closed and the screen is off.

But the real goal was bigger: to learn **how developers work today** —

- 🤖 **Claude Code** — an AI that writes the code for us
- 📚 **Git + GitHub** — saving every version of the code in the cloud
- 🚀 **Vercel** — publishing the app to the internet **automatically** on every change
- 📡 **ESP32** — the WiFi-enabled microcontroller that talks to all of it

📌 Our project links:

- The code (GitHub repository): https://github.com/v1t3ls0n/esp32-app1
- The live app (Vercel deployment): https://esp32-app1-dve4lt4f2-v1t3ls0ns-projects.vercel.app/

---

# 1) 🧩 The big picture — what did we actually build?

Before diving into the tools, let's understand what the system does. This is the journey of a single message:

```
ESP32 (at home)                 Vercel (cloud)                 Your phone
    │                               │                              │
    │  "Button pressed!" ─────────► │                              │
    │      (HTTP POST)              │                              │
    │                               │ ──► Google's Push service ──►│
    │                               │      (encrypted Web Push)    │
    │                               │                              🔔
    │                               │                       Notification!
```

Three players:

1. **The ESP32** — connected to WiFi; when something happens (a button press, a sensor trigger) it sends a message to the server.
2. **The cloud server (Vercel)** — receives the message and forwards it as a "push" to the phone.
3. **The app on the phone** — a browser app (PWA) installed on the home screen that knows how to receive the push and show a notification.

📌 Notice something amazing: **we didn't buy a server, didn't install anything on a computer, and didn't type the code ourselves.** All of it happened with the tools we're about to meet.

---

# 2) 🛠️ The tools — who's who

## 2.1 📚 Git — a "time machine" for code

**The problem:** when you write code, you change it constantly. Then something breaks... and there's no way back. Sound familiar from Word? Files named `final_final_REALLY2.docx` 😅

**The solution:** Git is a program that keeps **save points** (like in a video game 🎮) of the entire project folder.

Core concepts:

- **Repository (repo)** 📁 — the project folder, together with its entire history.
- **Commit** 📸 — a "snapshot" of the code at a moment in time, with a message explaining what changed. You can always go back to any commit.
- **Push** ⬆️ — sending your commits from the computer up to the cloud (GitHub).

📌 In short: Git = full history of the code + the ability to go back + teamwork without overwriting each other.

## 2.2 ☁️ GitHub — the cloud home of the code

If Git is the "time machine", then **GitHub is the place in the cloud where the repo lives**.

Think of it like Google Drive — but for code, and with full history:

- The code is available from any computer 💻
- You can share it with others 👥
- It is the **source of truth** — all the other tools (Claude, Vercel) connect to it

📌 The difference between Git and GitHub: **Git** = the technology (the time machine). **GitHub** = the website that hosts the repo in the cloud. (Like the difference between "email" and "Gmail".)

## 2.3 🤖 Claude Code — the programmer that works for you

Claude Code is an **AI agent** connected to your repo that can:

- Read and write code files ✍️
- Run commands and tests 🧪
- Commit and push to GitHub by itself ⬆️

And how do you talk to it? **In plain language.** This is exactly what we asked in class:

> "The ESP32 sends a message to the app. The app shows the message it received as a notification on my Android device"

And Claude designed the architecture, wrote all the files, verified everything works, and pushed to GitHub.

📌 Important: Claude is not a magician — it **works for you**. You are the manager: you define what you want, ask questions, request changes, and check the result. (During the lesson, for example, we told it mid-way: "no branches, just one main branch" — and it reorganized everything.)

## 2.4 🚀 Vercel — from code to the internet, automatically

**The problem:** we have code on GitHub. But code on GitHub is just text — how does it become a **live website** the phone can reach?

**The solution:** Vercel is a cloud service that connects to the GitHub repo, and every time a new commit is pushed, it:

1. Pulls the latest code ⬇️
2. Builds it 🏗️
3. Publishes it at a `https://...vercel.app` address 🌍

And this happens **by itself, in about a minute, on every commit**. This process is called a **Deployment**.

📌 Note: nobody "uploaded files to a server" manually. You just push code to GitHub — and the site updates. In the professional world this is called **CI/CD**, and it's today's standard.

## 2.5 📡 ESP32 — the brain with WiFi

We already know the ESP32 from previous lessons — a microcontroller like an Arduino, but with a superpower: **built-in WiFi**. That means it can talk to servers on the internet — and that's exactly what we used.

---

# 3) 🔁 The workflow — the magic loop

This is what working actually looks like, over and over:

```
 ┌──────────────────────────────────────────────────────────┐
 │                                                          │
 │   1. Ask Claude in plain language                        │
 │            ↓                                             │
 │   2. Claude writes code + tests + commits + pushes       │
 │            ↓                                             │
 │   3. GitHub stores the new version                       │
 │            ↓                                             │
 │   4. Vercel detects the commit and deploys automatically │
 │            ↓                                             │
 │   5. Test on your phone → request a fix → back to 1      │
 │                                                          │
 └──────────────────────────────────────────────────────────┘
```

📌 This is the most important point of the lesson: **your job is not to type code — it's to define what you want, understand what's happening, and verify it works.** The tools do the rest.

---

# 4) 👣 Step by step — what we did in class

## Step 1: Created a repo on GitHub 📁

Go to github.com → click **New repository** → give it a name (ours: `esp32-app1`) → Create. That's it — the code has a home.

## Step 2: Opened a Claude Code session on the repo 🤖

Connect Claude Code to the repo (via claude.ai/code or the terminal). From this moment Claude can see the code and work on it.

## Step 3: Asked for the system in plain language 💬

We described what we wanted (ESP32 → message → notification on the phone). Claude asked two smart questions before starting:

- ✅ Messages should arrive **from anywhere** over the internet (not just the home network)
- ✅ Notifications should arrive **even when the app is closed** (real Web Push)

📌 Note — these are **architecture** decisions that completely changed what got built. That's why the person doing the asking needs to understand what they're asking for 😉

## Step 4: Claude built the project 🏗️

This is what the repo looks like:

| Folder | What's inside |
|---|---|
| `public/` | The app itself (PWA) — what you see on the phone |
| `api/` | The code that runs in Vercel's cloud (server functions) |
| `firmware/` | The ESP32 code (Arduino sketch) |
| `scripts/` | A one-off script for generating security keys |

## Step 5: Connected the repo to Vercel 🔗

1. Go to vercel.com/new
2. **Import** the `esp32-app1` repo
3. Framework Preset: **Other** → click **Deploy**

From this moment — every commit to the repo automatically creates a new deployment. ✨

## Step 6: Configured "secrets" — environment variables 🔐

The app needs a few secret values that must not live inside the code (the code is public on GitHub!). They go in Vercel under **Settings → Environment Variables**:

| Variable | What it is |
|---|---|
| `VAPID_PUBLIC_KEY` | The server's public "ID card" for the push service |
| `VAPID_PRIVATE_KEY` | The matching secret key (never share it!) |
| `VAPID_SUBJECT` | A contact email address (required by the standard) |
| `DEVICE_TOKEN` | The "password" the ESP32 must send for its messages to be accepted |

We also connected a **small database** (Redis) via **Storage → Create Database**, which stores the list of registered phones. Why is it needed? See section 5.

📌 After adding environment variables you must **Redeploy** for them to take effect.

## Step 7: Installed the app on the phone 📱

1. Open the Vercel URL in **Chrome on Android**
2. Tap **"Enable notifications"** → and allow ✅
3. Tap **"Send test notification"** → and watch it arrive 🔔
4. Chrome menu → **"Add to Home screen"** → and now we have an app!

## Step 8: Flashed the ESP32 🔥

Open `firmware/esp32-notify/esp32-notify.ino` in the Arduino IDE and update only the config block:

```cpp
const char* WIFI_SSID    = "YOUR_WIFI_NAME";
const char* WIFI_PASS    = "YOUR_WIFI_PASSWORD";
const char* RELAY_URL    = "https://<your-project>.vercel.app/api/notify";
const char* DEVICE_TOKEN = "same-password-as-in-vercel";
```

Upload to the board — done. As soon as the ESP32 connects to WiFi it sends "The ESP32 is online! 🚀", and every press of the **BOOT** button — another notification.

## Step 9: Verified everything works 🧪

You can test the system even **without** the ESP32, from any computer, using `curl` (sending a request to the server from the terminal):

```bash
curl -X POST https://<your-project>.vercel.app/api/notify \
  -H "Authorization: Bearer your-password" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Hello from my computer 👋"}'
```

If all is well — the phone rings within a second or two. 🔔

---

# 5) 🏗️ How the system works on the inside

Now that we've seen the "what", let's understand the "how" — in plain language.

## 5.1 📱 What is a PWA?

**PWA** (Progressive Web App) = a website that behaves like an app:

- You install it on the home screen (no app store!)
- It opens full-screen, with its own icon
- And most importantly for us: it can receive **push notifications**

📌 The huge advantage: write it once in HTML/JavaScript — and it works on Android, iPhone and desktop.

## 5.2 👷 What is a Service Worker?

This is the coolest part: a **Service Worker** is a piece of JavaScript the browser runs **in the background — even when the app is closed**.

Think of it as a doorman in a building 🏢: even after everyone has gone home, he stays. And when a push message arrives — he wakes up and shows the notification.

In our project it's the file `public/sw.js`.

## 5.3 🔔 What is Web Push, and why "VAPID keys"?

Here's a surprising bit: our server **does not send the notification directly to the phone.** Why? Because the phone changes network addresses all the time (WiFi, cellular...) and there is no way to "find" it.

Instead, every browser has a central **push service** (Google's, for Chrome) that keeps a permanent connection to the phone:

1. When we enabled notifications, the browser gave us a unique **subscription address**
2. Our server stores that address
3. To send — our server sends the message (encrypted! 🔒) to Google's service
4. Google pushes it to the phone → the Service Worker wakes up → 🔔

And **VAPID keys**? They are our server's "ID card". Thanks to them, Google knows that only *our* server may send notifications to *our* subscribers — nobody can impersonate us.

## 5.4 ⚡ What is Serverless?

On Vercel we don't have a computer running 24/7. Instead there are **functions** — every file in the `api/` folder is a function that wakes up only when a request arrives, runs for a second, and disappears:

| Endpoint | What it does |
|---|---|
| `/api/subscribe` | Registers a new phone to the notification list |
| `/api/notify` | Receives a message from the ESP32 and sends a push to everyone registered |
| `/api/vapidPublicKey` | Gives the app the public key so it can subscribe |
| `/api/health` | "Pulse check" — is the server alive, and how many subscribers |

✅ Advantages: free (for hobby use), zero maintenance, scales by itself.

## 5.5 🗄️ Why do we need a database (Redis)?

Remember that the functions "disappear" after every request? That means they **remember nothing** between requests. So where do we keep the list of registered phones?

That's why we connected **Redis** — a small, fast cloud database. The `subscribe` function writes to it, and the `notify` function reads from it.

📌 An important rule of thumb in the serverless world: **anything that must persist goes in a database — not in memory and not in files.**

## 5.6 🔑 What is DEVICE_TOKEN?

The `/api/notify` endpoint is open to the internet — anyone can send it a request. Without protection, the whole world could flood you with notifications 😱

So we set a **shared password**: the ESP32 sends it with every request, and the server checks it. A request without the correct password is rejected with a `401 Unauthorized` error.

---

# 6) 🤖 What happens in the ESP32 code?

We won't go line by line (the full code is in the repo), but this is the essence:

```cpp
void setup() {
  connectWiFi();                                         // connect to the network
  sendNotification("ESP32", "The ESP32 is online! 🚀");  // "I'm alive" message
}

void loop() {
  // When the BOOT button is pressed → send a notification
  if (buttonPressed()) {
    sendNotification("ESP32", "Button pressed! ⚡");
  }
}
```

And the `sendNotification()` function does exactly one thing: sends an **HTTP POST** request to our Vercel server, with the message as JSON and the `DEVICE_TOKEN` in a header:

```json
{ "title": "ESP32", "message": "Button pressed! ⚡" }
```

📌 You can replace this demo (boot message + BOOT button) with any logic you want: a distance sensor detecting motion, a temperature sensor crossing a threshold, a light sensor... everything we learned in previous lessons plugs in right here. 🔗

---

# 7) 📖 Glossary

| Term | Plain-language meaning |
|---|---|
| **Repository (repo)** | A project folder + its entire change history |
| **Commit** | A save point of the code, with a description of what changed |
| **Push** | Sending commits from your computer to GitHub |
| **Deployment** | Publishing a version of the app to the internet |
| **PWA** | A website that behaves like an app and installs to the home screen |
| **Service Worker** | Code that runs in the browser's background, even when the app is closed |
| **Web Push** | The mechanism for delivering notifications via the browser's central push service |
| **VAPID** | A key pair that identifies our server to the push service |
| **Serverless** | Server code that runs as on-demand functions, with no 24/7 machine |
| **Redis** | A small, fast database that persists data between requests |
| **Environment Variables** | Secret values (keys, passwords) kept outside the code |
| **HTTP POST** | A network request that sends data to a server |
| **JSON** | A simple text format for structured data |
| **API** | The "doors" through which programs talk to each other |

---

# 🏁 Lesson recap

✅ We understood what Git and GitHub are — and why all the world's code is managed this way<br>
✅ We worked with Claude Code — defined requirements in plain language and got a complete system<br>
✅ We connected the repo to Vercel — and every commit automatically became a deployment<br>
✅ We installed a PWA on the phone with real push notifications (Web Push + Service Worker)<br>
✅ We connected an ESP32 to the cloud — and the phone rang 🔔<br>
✅ And most importantly: we experienced the **modern way of working** — define, understand, verify — and let the tools work for us 🤖🔥

---
