#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// WiFi Configuration
const char* ssid = "cypher";
const char* password = "123456789";

// Supabase Configuration
const char* supabaseUrl = "https://vqqiscgbiwcvqbwljjtt.supabase.co"; 
const char* supabaseAnonKey = "sb_publishable_SvSHXv25EL9eJy_PrwrF5Q_FES_YIDG";

// Pin definitions
const int trigPin = 5;
const int echoPin = 18;
const int led1 = 12;   // ON when distance <= 15 cm (Too Close)
const int led2 = 13;   // ON when distance > 15 cm (Safe)

long duration;
float distance;

// Tracking upload intervals
unsigned long lastTelemetryUpload = 0;
const unsigned long telemetryInterval = 2000; // Upload telemetry status every 2 seconds
bool lastTriggerState = false; // Tracks if door was triggered in last loop

/*
 * Establishes secure connection to Wi-Fi router
 */
void connectToWiFi() {
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi Connected successfully!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi Connection Failed. Will retry in the background.");
  }
}

/*
 * Pings the Supabase database REST API in setup() to diagnose connection and tables setup.
 */
void testSupabaseConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Supabase] WiFi not connected. Skipping API connection test.");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure(); // Bypass cert check for testing
  HTTPClient http;

  String url = String(supabaseUrl) + "/rest/v1/node2_telemetry?select=id&limit=1";
  
  // Cross-version compilation support for HTTPClient
  #if defined(ESP_ARDUINO_VERSION_VAL)
    // ESP32 core 2.x and 3.x
    http.begin(client, url);
  #else
    // ESP32 core 1.x
    http.begin(url);
  #endif

  http.addHeader("apikey", supabaseAnonKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseAnonKey));

  Serial.println("[Supabase] Testing database API connection...");
  int httpResponseCode = http.GET();

  Serial.println("==================================================");
  if (httpResponseCode == 200 || httpResponseCode == 206 || httpResponseCode == 204) {
    Serial.println("[Supabase] CONNECTION OK! Dashboard backend is online.");
    Serial.println("[Supabase] Table 'node2_telemetry' validated successfully.");
  } else {
    Serial.print("[Supabase] CONNECTION ERROR! HTTP Code: ");
    Serial.println(httpResponseCode);
    
    if (httpResponseCode == 401 || httpResponseCode == 403) {
      Serial.println("[Supabase] Auth Error: Please double-check your Anon API Key.");
    } else if (httpResponseCode == 404) {
      Serial.println("[Supabase] Setup Error: Table 'node2_telemetry' does not exist.");
      Serial.println("[Supabase] Action Required: Run the database SQL setup script in Supabase dashboard!");
    } else {
      Serial.println("[Supabase] Network Error: Failed to reach host. Check project URL and Wi-Fi signal.");
    }
  }
  Serial.println("==================================================");
  http.end();
}

/*
 * Pushes general ESP32 status metrics to the 'node2_telemetry' table
 * Updates Row ID 1 (PATCH updates)
 */
void uploadTelemetry(float distVal) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(supabaseUrl) + "/rest/v1/node2_telemetry?id=eq.1";
  
  // Cross-version compilation support for HTTPClient
  #if defined(ESP_ARDUINO_VERSION_VAL)
    // ESP32 core 2.x and 3.x
    http.begin(client, url);
  #else
    // ESP32 core 1.x
    http.begin(url);
  #endif

  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseAnonKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseAnonKey));

  String payload = "{\"distance\":" + String(distVal) + 
                   ",\"wifi_ssid\":\"" + String(ssid) + "\"" +
                   ",\"ip_address\":\"" + WiFi.localIP().toString() + "\"" +
                   ",\"rssi\":" + String(WiFi.RSSI()) + 
                   ",\"uptime_seconds\":" + String(millis() / 1000) + "}";

  Serial.println("Uploading telemetry to Supabase...");
  int httpResponseCode = http.PATCH(payload);

  if (httpResponseCode > 0) {
    Serial.print("Telemetry update response: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Error sending PATCH: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

/*
 * Inserts a new detection record to 'detection_events' table (POST request)
 */
void sendSupabaseEvent(float distVal, const char* result, bool uploadSuccess, bool triggerSent) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(supabaseUrl) + "/rest/v1/detection_events";
  
  // Cross-version compilation support for HTTPClient
  #if defined(ESP_ARDUINO_VERSION_VAL)
    // ESP32 core 2.x and 3.x
    http.begin(client, url);
  #else
    // ESP32 core 1.x
    http.begin(url);
  #endif

  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseAnonKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseAnonKey));

  String payload = "{\"distance\":" + String(distVal) + 
                   ",\"detection_result\":\"" + String(result) + "\"" +
                   ",\"cloud_upload_success\":" + (uploadSuccess ? "true" : "false") + 
                   ",\"servo_trigger_sent\":" + (triggerSent ? "true" : "false") + "}";

  Serial.println("Inserting Event log to Supabase...");
  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    Serial.print("Event insert response: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Error sending POST: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

/*
 * Updates 'shared_system_status' Row ID 1 to control Node 3 (Servo)
 */
void triggerServoNode(bool trigger, float distVal) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(supabaseUrl) + "/rest/v1/shared_system_status?id=eq.1";
  
  // Cross-version compilation support for HTTPClient
  #if defined(ESP_ARDUINO_VERSION_VAL)
    // ESP32 core 2.x and 3.x
    http.begin(client, url);
  #else
    // ESP32 core 1.x
    http.begin(url);
  #endif

  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseAnonKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseAnonKey));

  String payload;
  if (trigger) {
    payload = "{\"servo_trigger_status\":\"Triggered\","
              "\"servo_position\":90,"
              "\"door_status\":\"Unlocked\","
              "\"last_door_event\":\"Unlocked via distance threshold breach: " + String(distVal) + " cm\"}";
  } else {
    payload = "{\"servo_trigger_status\":\"Idle\","
              "\"servo_position\":0,"
              "\"door_status\":\"Locked\","
              "\"last_door_event\":\"Door auto-locked\"}";
  }

  Serial.println("Updating Servo status in Supabase...");
  int httpResponseCode = http.PATCH(payload);

  if (httpResponseCode > 0) {
    Serial.print("Servo trigger response: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Error sending Servo PATCH: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000); // Give serial monitor time to attach

  // Initialize hardware pins
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);

  digitalWrite(led1, LOW);
  digitalWrite(led2, LOW);

  // Connect to Wi-Fi
  connectToWiFi();

  // Test connection to Supabase API
  testSupabaseConnection();
}

void loop() {
  // Ensure WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // 1. Measure distance via Ultrasonic sensor
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.0343 / 2;

  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  // 2. Control local indicator LEDs
  bool isAlert = (distance <= 15.0);
  if (isAlert) {
    digitalWrite(led1, HIGH);
    digitalWrite(led2, LOW);
  } else {
    digitalWrite(led1, LOW);
    digitalWrite(led2, HIGH);
  }

  // 3. IoT Cloud Synchronization Logic
  unsigned long now = millis();

  // Condition A: Object gets too close (distance <= 15cm) and trigger was not sent yet
  if (isAlert && !lastTriggerState) {
    lastTriggerState = true;
    
    // Log the detection event to 'detection_events' table and trigger the door (Servo node)
    sendSupabaseEvent(distance, "Object Too Close", true, true);
    triggerServoNode(true, distance);
    
    // Update local telemetry immediately
    uploadTelemetry(distance);
  } 
  // Reset trigger state when object leaves the critical threshold zone
  else if (!isAlert && lastTriggerState) {
    lastTriggerState = false;
    
    // Reset Servo status back to Idle
    triggerServoNode(false, distance);
    
    // Upload telemetry immediately to sync dashboard state
    uploadTelemetry(distance);
  }
  // Condition B: Periodic telemetry update
  else if (now - lastTelemetryUpload >= telemetryInterval) {
    lastTelemetryUpload = now;
    uploadTelemetry(distance);
  }

  delay(200);
}
