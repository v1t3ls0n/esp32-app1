/*
 * 🚪 פעמון דלת חכם — פרויקט המשך
 * --------------------------------
 * חיישן מרחק אולטרה-סוני (HC-SR04, מוכר משיעור 2) + המערכת מהשיעור:
 * כשמישהו מתקרב מתחת לסף — הטלפון מקבל נוטיפיקיישן.
 *
 * מושגים חדשים בקוד הזה (מוסברים במדריך docs/project-doorbell-he.md):
 *   - סף (Threshold): מרחק שמתחתיו נחשב "מישהו בדלת"
 *   - דיבאונס (Debounce): דורשים כמה מדידות רצופות, לא מדידה בודדת
 *   - קולדאון (Cooldown): זמן שקט בין התראות, שלא יוצף הטלפון
 *
 * ⚠️ חיווט (שונה משיעור 2 — שם זה היה Arduino Uno!):
 *   TRIG  -> GPIO 5
 *   ECHO  -> GPIO 18  דרך מחלק מתח! (ראו אזהרה במדריך: ECHO מוציא 5V,
 *                     וה-ESP32 סובל רק 3.3V. שתי נגדים: 1kΩ + 2kΩ)
 *   VCC   -> 5V (VIN),  GND -> GND
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// ------------------- CONFIG: edit these -------------------
const char* WIFI_SSID    = "YOUR_WIFI_NAME";      // שם הרשת שלכם
const char* WIFI_PASS    = "YOUR_WIFI_PASSWORD";  // סיסמת הרשת
const char* RELAY_URL    = "https://YOUR-PROJECT.vercel.app/api/notify";
const char* DEVICE_TOKEN = "YOUR-SECRET-TOKEN";   // אותה סיסמה בדיוק כמו בענן

const int TRIG_PIN = 5;
const int ECHO_PIN = 18;

const int  THRESHOLD_CM      = 50;     // מתחת למרחק הזה = "מישהו בדלת"
const int  CONSECUTIVE_HITS  = 3;      // כמה מדידות רצופות מתחת לסף לפני התראה
const long COOLDOWN_MS       = 30000;  // 30 שניות שקט בין התראות
// ----------------------------------------------------------

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
  client.setInsecure();  // hobby project: skip TLS cert validation

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
  Serial.printf("POST -> %d\n", code);
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
    Serial.println("WiFi FAILED - check SSID/password");
  }
}

// Measure distance in cm. Returns -1 when no echo came back (nothing in
// range / sensor issue). Same math as lesson 2: (time / 2) / 29.1.
long measureDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // timeout 30ms = ~5m; without it pulseIn could block for a full second
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1;
  return (duration / 2) / 29.1;
}

int hitCount = 0;                 // consecutive readings below threshold
unsigned long lastAlertAt = 0;    // millis() of the last notification

void setup() {
  Serial.begin(115200);
  delay(300);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  connectWiFi();
  sendNotification("🚪 פעמון חכם", "המערכת באוויר ומנטרת את הדלת!");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    delay(1000);
    return;
  }

  long distance = measureDistanceCm();
  Serial.printf("distance: %ld cm  (hits: %d)\n", distance, hitCount);

  if (distance > 0 && distance < THRESHOLD_CM) {
    hitCount++;   // someone might be there - need CONSECUTIVE_HITS in a row
  } else {
    hitCount = 0; // reading above threshold resets the streak
  }

  bool cooldownOver = millis() - lastAlertAt > COOLDOWN_MS;
  if (hitCount >= CONSECUTIVE_HITS && (lastAlertAt == 0 || cooldownOver)) {
    String msg = String("מישהו בדלת! מרחק: ") + distance + " ס\"מ";
    if (sendNotification("🚪 פעמון חכם", msg)) {
      lastAlertAt = millis();
    }
    hitCount = 0;
  }

  delay(100);  // 10 measurements per second
}
