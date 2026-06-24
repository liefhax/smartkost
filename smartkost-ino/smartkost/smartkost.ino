#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>
#include "DHT.h"
#include <Preferences.h>
#include <WebServer.h>
#include <ElegantOTA.h>

// ================= KONFIGURASI WIFI & MQTT =================
const char* ssid = "Kosan 214";
const char* password = "SANCANGG";

const char* mqtt_server = "5e83bc92b0c643ccbc75e9a515c3e9cd.s1.eu.hivemq.cloud"; 
const int mqtt_port = 8883;
const char* mqtt_user = "liefhax";
const char* mqtt_pass = "Sukabumi123";

// Topics
const char* topic_suhu       = "kost/sensor/suhu";
const char* topic_kelembaban = "kost/sensor/kelembaban";
const char* topic_daya       = "kost/sensor/daya";
const char* topic_gas        = "kost/sensor/gas";
const char* topic_gerak      = "kost/sensor/gerak";
const char* topic_relay1     = "kost/relay/1";
const char* topic_relay2     = "kost/relay/2";
const char* topic_fan_speed  = "kost/fan/speed";
const char* topic_fan_auto   = "kost/fan/auto";
const char* topic_control    = "kost/control";
const char* topic_alert      = "kost/alert";
const char* topic_ota_status = "kost/ota/status";

WiFiClientSecure espClient;
PubSubClient client(espClient);
Preferences pref;
WebServer server(80);

// ================= KONFIGURASI PIN =================
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define PZEM_RX_PIN 16
#define PZEM_TX_PIN 17
PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);

#define MQ2_PIN 34
#define PIR_PIN 27
#define RELAY1_PIN 26
#define RELAY2_PIN 25
#define FAN_PIN 13

// PWM
const int freq = 5000;
const int resolution = 8;

// Relay: LOW = ON, HIGH = OFF
#define RELAY_ON LOW
#define RELAY_OFF HIGH

// ================= VARIABEL GLOBAL =================
unsigned long lastSensorRead = 0;
bool lastPirState = false;
bool otaMode = false; 

// Variabel Kontrol
bool autoFanMode = true;
float targetTemp = 28.0;
int manualFanSpeed = 0;
float maxPowerLimit = 1000.0;
int gasThreshold = 500;
bool relay1State = false;
bool relay2State = false;

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, PZEM_RX_PIN, PZEM_TX_PIN);

  // Load NVS
  pref.begin("smartkost", false);
  maxPowerLimit = pref.getFloat("max_power", 1000.0);
  targetTemp = pref.getFloat("target_temp", 28.0);
  gasThreshold = pref.getInt("gas_threshold", 500);
  autoFanMode = pref.getBool("auto_fan", true);
  
  Serial.println("=== Konfigurasi Tersimpan ===");
  Serial.printf("Power Limit: %.0f W\n", maxPowerLimit);
  Serial.printf("Target Suhu: %.1f °C\n", targetTemp);
  Serial.printf("Gas Threshold: %d\n", gasThreshold);
  Serial.printf("Auto Fan: %s\n", autoFanMode ? "ON" : "OFF");

  // Setup Pin
  pinMode(MQ2_PIN, INPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(RELAY1_PIN, OUTPUT);
  pinMode(RELAY2_PIN, OUTPUT);
  digitalWrite(RELAY1_PIN, RELAY_OFF);
  digitalWrite(RELAY2_PIN, RELAY_OFF);

  // PWM Fan
  ledcAttach(FAN_PIN, freq, resolution);
  ledcWrite(FAN_PIN, 0);

  // Sensor
  dht.begin();

  // WiFi
  setup_wifi();

  // MQTT
  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);

  // Web Server + OTA
  server.on("/", []() {
    String html = "<h2>SmartKost ESP32 Server</h2>";
    html += "<p>Mode OTA Aktif. Upload firmware baru di halaman update.</p>";
    html += "<a href='/update'><button style='padding:10px;font-size:16px;'>Upload Firmware</button></a>";
    html += "<br><br><a href='/otaoff'><button style='padding:8px;background:red;color:white;'>Matikan Mode OTA</button></a>";
    server.send(200, "text/html", html);
  });

  // Endpoint matikan OTA dari browser
  server.on("/otaoff", []() {
    otaMode = false;
    String msg = "<h2>Mode OTA Dimatikan</h2>";
    msg += "<p>ESP32 kembali ke mode normal. Sensor akan mulai membaca lagi.</p>";
    msg += "<a href='/'><button>Kembali</button></a>";
    server.send(200, "text/html", msg);
    Serial.println("OTA Mode dimatikan via web!");
  });

  ElegantOTA.begin(&server);
  server.begin();
  
  Serial.println("SmartKost ESP32 Ready!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void setup_wifi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500); Serial.print("."); attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP: "); Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Failed! Restarting...");
    ESP.restart();
  }
}

void reconnect() {
  int retries = 0;
  while (!client.connected() && retries < 5) {
    Serial.print("Connecting MQTT...");
    String clientId = "ESP32_SmartKost_" + String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("Connected!");
      client.subscribe(topic_control);
      client.publish("kost/status", "{\"status\":\"online\"}");
      
      // Publish OTA status saat ini
      publishOTAStatus();
    } else {
      Serial.print("Failed, rc="); Serial.print(client.state());
      Serial.println(" retrying in 5s");
      retries++; delay(5000);
    }
  }
}

// ================= PUBLISH OTA STATUS =================
void publishOTAStatus() {
  StaticJsonDocument<128> doc;
  doc["ota_active"] = otaMode;
  doc["ip"] = WiFi.localIP().toString();
  char buffer[128];
  serializeJson(doc, buffer);
  client.publish(topic_ota_status, buffer);
  
  Serial.printf("📡 OTA Status: %s | IP: %s\n", otaMode ? "AKTIF" : "NONAKTIF", WiFi.localIP().toString().c_str());
}

// ================= PUBLISH ALL STATUS (buat request_status) =================
void publishAllStatus() {
  // Publish relay states
  client.publish(topic_relay1, relay1State ? "true" : "false");
  client.publish(topic_relay2, relay2State ? "true" : "false");
  client.publish(topic_fan_auto, autoFanMode ? "true" : "false");
  client.publish(topic_fan_speed, String(autoFanMode ? 0 : manualFanSpeed).c_str());
  
  // Publish settings
  StaticJsonDocument<256> settingsDoc;
  settingsDoc["overload_limit"] = maxPowerLimit;
  settingsDoc["target_temp"] = targetTemp;
  settingsDoc["gas_threshold"] = gasThreshold;
  char settingsBuffer[256];
  serializeJson(settingsDoc, settingsBuffer);
  client.publish("kost/settings/status", settingsBuffer);
  
  // Publish OTA status
  publishOTAStatus();
  
  Serial.println("📡 All status published (request_status)");
}

// ================= MQTT CALLBACK =================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) message += (char)payload[i];
  
  Serial.printf("MQTT Received [%s]: %s\n", topic, message.c_str());
  
  StaticJsonDocument<384> doc;
  DeserializationError error = deserializeJson(doc, message);
  if (error) {
    Serial.println("JSON Parse Error!");
    return;
  }

  // === REQUEST STATUS (dari web setelah connect) ===
  if (doc.containsKey("request_status")) {
    publishAllStatus();
    return;
  }

  // === KONTROL RELAY ===
  if (doc.containsKey("relay1")) {
    relay1State = doc["relay1"];
    digitalWrite(RELAY1_PIN, relay1State ? RELAY_ON : RELAY_OFF);
    client.publish(topic_relay1, relay1State ? "true" : "false");
    Serial.printf("Relay 1: %s\n", relay1State ? "ON" : "OFF");
  }
  
  if (doc.containsKey("relay2")) {
    relay2State = doc["relay2"];
    digitalWrite(RELAY2_PIN, relay2State ? RELAY_ON : RELAY_OFF);
    client.publish(topic_relay2, relay2State ? "true" : "false");
    Serial.printf("Relay 2: %s\n", relay2State ? "ON" : "OFF");
  }

  // === KONTROL FAN ===
  if (doc.containsKey("auto_fan")) {
    autoFanMode = doc["auto_fan"];
    pref.putBool("auto_fan", autoFanMode);
    client.publish(topic_fan_auto, autoFanMode ? "true" : "false");
    Serial.printf("Auto Fan: %s\n", autoFanMode ? "ON" : "OFF");
  }
  
  if (doc.containsKey("fan_speed") && !autoFanMode) {
    manualFanSpeed = doc["fan_speed"];
    manualFanSpeed = constrain(manualFanSpeed, 0, 255);
    ledcWrite(FAN_PIN, manualFanSpeed);
    client.publish(topic_fan_speed, String(manualFanSpeed).c_str());
    Serial.printf("Fan Speed: %d\n", manualFanSpeed);
  }

  // === SETTING DINAMIS ===
  if (doc.containsKey("set_power")) {
    maxPowerLimit = doc["set_power"];
    pref.putFloat("max_power", maxPowerLimit);
    Serial.printf("Power Limit Updated: %.0f W\n", maxPowerLimit);
  }
  
  if (doc.containsKey("set_temp")) {
    targetTemp = doc["set_temp"];
    pref.putFloat("target_temp", targetTemp);
    Serial.printf("Target Temp Updated: %.1f °C\n", targetTemp);
  }
  
  if (doc.containsKey("set_gas_threshold")) {
    gasThreshold = doc["set_gas_threshold"];
    pref.putInt("gas_threshold", gasThreshold);
    Serial.printf("Gas Threshold Updated: %d\n", gasThreshold);
  }

  // === OTA TOGGLE (ON/OFF) ===
  if (doc.containsKey("cmd")) {
    if (doc["cmd"] == "ota_on") {
      otaMode = true;
      Serial.println("✅ OTA Mode AKTIF! Stop sensor.");
      publishOTAStatus();
    } 
    else if (doc["cmd"] == "ota_off") {
      otaMode = false;
      Serial.println("❌ OTA Mode NONAKTIF! Sensor jalan lagi.");
      publishOTAStatus();
    }
  }
}

// ================= PUBLISH SENSOR DATA =================
void publishSensorData() {
  float suhu = dht.readTemperature();
  float kelembaban = dht.readHumidity();
  int gasValue = analogRead(MQ2_PIN);
  float voltage = pzem.voltage();
  float current = pzem.current();
  float power = pzem.power();
  
  if (isnan(suhu) || isnan(kelembaban)) {
    Serial.println("DHT Error!");
    return;
  }
  
  if (isnan(voltage) || isnan(current) || isnan(power)) {
    Serial.println("PZEM Error!");
    return;
  }

  // Publish suhu
  char buffer[16];
  dtostrf(suhu, 4, 1, buffer);
  client.publish(topic_suhu, buffer);
  
  // Publish kelembaban
  dtostrf(kelembaban, 4, 1, buffer);
  client.publish(topic_kelembaban, buffer);
  
  // Publish daya
  StaticJsonDocument<128> dayaDoc;
  dayaDoc["watt"] = power;
  dayaDoc["volt"] = voltage;
  dayaDoc["ampere"] = current;
  char dayaBuffer[128];
  serializeJson(dayaDoc, dayaBuffer);
  client.publish(topic_daya, dayaBuffer);
  
  // Publish gas
  bool gasAman = (gasValue < gasThreshold);
  client.publish(topic_gas, gasAman ? "true" : "false");
  
  // Publish gerak
  bool currentPir = digitalRead(PIR_PIN);
  if (currentPir != lastPirState) {
    lastPirState = currentPir;
    client.publish(topic_gerak, currentPir ? "true" : "false");
    if (currentPir) {
      String motionMsg = "{\"type\":\"motion\",\"message\":\"Gerakan terdeteksi!\"}";
      client.publish(topic_alert, motionMsg.c_str());
    }
  }

  // Overload protection
  if (power > maxPowerLimit) {
    digitalWrite(RELAY1_PIN, RELAY_OFF);
    digitalWrite(RELAY2_PIN, RELAY_OFF);
    relay1State = false;
    relay2State = false;
    client.publish(topic_relay1, "false");
    client.publish(topic_relay2, "false");
    
    StaticJsonDocument<128> alertDoc;
    alertDoc["type"] = "overload";
    alertDoc["message"] = "Overload terdeteksi! Semua relay dimatikan.";
    alertDoc["power"] = power;
    alertDoc["limit"] = maxPowerLimit;
    char alertBuffer[128];
    serializeJson(alertDoc, alertBuffer);
    client.publish(topic_alert, alertBuffer);
    Serial.println("⚠️ OVERLOAD! All relays OFF");
  }

  // Auto Fan
  if (autoFanMode) {
    int autoSpeed = 0;
    if (suhu >= targetTemp + 1.0) autoSpeed = 255;
    else if (suhu >= targetTemp) autoSpeed = 128;
    else autoSpeed = 0;
    ledcWrite(FAN_PIN, autoSpeed);
    client.publish(topic_fan_speed, String(autoSpeed).c_str());
  }

  Serial.printf("Suhu: %.1f°C | Power: %.0fW | Relay1: %s | Relay2: %s | Fan: %s\n", 
    suhu, power, relay1State ? "ON" : "OFF", relay2State ? "ON" : "OFF", 
    autoFanMode ? "AUTO" : "MANUAL");
}

void loop() {
  server.handleClient();
  ElegantOTA.loop();

  // OTA aktif, stop sensor & MQTT publish
  if (otaMode) {
    if (!client.connected()) reconnect();
    client.loop();
    return;
  }

  if (!client.connected()) reconnect();
  client.loop();

  if (millis() - lastSensorRead > 2000) {
    lastSensorRead = millis();
    publishSensorData();
  }
}