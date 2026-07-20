/*
 * ESP32 → Web Push notifier
 * -------------------------
 * Connects to WiFi and sends a message to your relay server, which forwards it
 * as a push notification to your phone.
 *
 * Board: any ESP32 dev board (Arduino core for ESP32 installed).
 * Libraries: WiFi, WiFiClientSecure, HTTPClient (all bundled with the ESP32 core).
 *
 * Two demo triggers are included:
 *   1. A "hello" message once, right after boot.
 *   2. A message every time you press the on-board BOOT button (GPIO0).
 * Replace those with your own sensor logic.
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// ------------------- CONFIG: edit these -------------------
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Your relay's public URL + /api/notify  (e.g. https://esp32-relay.onrender.com/api/notify)
const char* RELAY_URL = "https://YOUR-RELAY-HOST/api/notify";

// Must match DEVICE_TOKEN in the server's .env
const char* DEVICE_TOKEN = "change-me";
// ----------------------------------------------------------

const int BUTTON_PIN = 0;  // BOOT button on most ESP32 dev boards

// Escape the few characters that would break a JSON string.
String jsonEscape(const String& in) {
  String out;
  for (size_t i = 0; i < in.length(); i++) {
    char c = in[i];
    if (c == '"' || c == '\\') { out += '\\'; out += c; }
    else if (c == '\n') { out += "\\n"; }
    else { out += c; }
  }
  return out;
}

bool sendNotification(const String& title, const String& message) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping send");
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure();  // skip TLS cert validation (fine for a hobby project)

  HTTPClient https;
  if (!https.begin(client, RELAY_URL)) {
    Serial.println("https.begin() failed");
    return false;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);

  String body = String("{\"title\":\"") + jsonEscape(title) +
                "\",\"message\":\"" + jsonEscape(message) + "\"}";

  int code = https.POST(body);
  String resp = https.getString();
  Serial.printf("POST %s -> %d\n%s\n", RELAY_URL, code, resp.c_str());
  https.end();

  return code >= 200 && code < 300;
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi FAILED — check SSID/password");
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  connectWiFi();

  // Demo #1: say hello on boot
  sendNotification("ESP32", "The ESP32 is online! 🚀");
}

void loop() {
  // Reconnect if WiFi drops
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    delay(1000);
    return;
  }

  // Demo #2: send on button press (falling edge)
  static int last = HIGH;
  int now = digitalRead(BUTTON_PIN);
  if (last == HIGH && now == LOW) {
    sendNotification("ESP32", "Button pressed! ⚡");
    delay(300);  // debounce
  }
  last = now;

  delay(20);
}
