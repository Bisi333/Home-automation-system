# Smart Door Access System – Node 2 (Ultrasonic Sensor Monitoring Dashboard)

This is a modern engineering dashboard built with **React Native** and **Expo** designed for monitoring and controlling the Ultrasonic Sensor Node (ESP32) in a shared Smart Door Access system.

---

## 🛠 Tech Stack & Dependencies

*   **Framework:** Expo SDK 51 (React Native)
*   **UI Framework:** React Native Paper (Material Design 3 Theme Engine)
*   **Icons:** Material Community Icons
*   **Data Visualizations:** Custom Responsive SVG charts (Sparkline, Bar Chart, Dial Gauge)
*   **Database Client:** Firebase Web JS SDK (Realtime Database & Authentication)
*   **State Management:** React Context API (global telemetry and logging loop)
*   **Notification Engine:** Web Notification API with custom in-app stack fallback

---

## 📁 Folder Structure

```text
iot class/
├── App.js                     # Root entry point, theme declaration & routing
├── app.json                   # Expo application metadata configuration
├── babel.config.js            # Babel preset for React Native & Paper
├── package.json               # Package manifests and script definitions
└── src/
    ├── context/
    │   └── AppContext.js      # Global state, authentication, & telemetry simulation
    ├── screens/
    │   ├── LoginScreen.js     # Developer / Google Sign-In panel
    │   ├── DashboardScreen.js # Master engineering dashboard (8 cards)
    │   └── SettingsScreen.js  # Node settings & system variables panel
    └── services/
        ├── firebaseService.js # Firebase Database connection wrapper
        └── notificationService.js # Notification dispatcher
```

---

## 🚀 How to Run Locally

### 1. Install Dependencies
Ensure you have Node.js installed, then run:
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run start
```
This opens the Expo CLI in your terminal.

### 3. Run in the Browser (Recommended for quick testing)
Press **`w`** in the terminal to launch the web dashboard. It will open in your default browser at `http://localhost:8081`. 

The design is fully responsive and supports grid layout on desktop screens and single-column cards on mobile viewports.

### 4. Test on a Mobile Device
Install the **Expo Go** app from the Google Play Store (Android) or Apple App Store (iOS). Ensure your phone is on the same Wi-Fi network as your computer, and scan the QR code printed in the terminal.

---

## 🔄 Data Simulation & Verification

To enable immediate testing and verification without requiring a physical ESP32 breadboard:
1.  A **Telemetry Simulator** runs automatically in the background when monitoring is active.
2.  It generates realistic, fluctuating distance values every second.
3.  When simulated distance drops below the **Distance Threshold** (configured in Settings, defaults to `15 cm`):
    *   An alert banner flashes at the top.
    *   A notification is dispatched.
    *   It updates the **Today's Detections** count.
    *   It triggers the **Shared Servo Node** to open the door (`90°` position, `Unlocked` status) and automatically locks it back after `4 seconds`.
    *   The event is recorded in the **Timeline** and **Developer Logs**.
4.  You can toggled monitoring on/off via the **Start/Stop Monitoring** button.

---

## ☁️ Firebase Connection Configuration

To connect this dashboard to a live Firebase instance:
1.  Go to the **Settings** panel (click the gear icon in the top right of the dashboard).
2.  Input your **Firebase Realtime Database URL** (e.g. `https://your-app.firebaseio.com`).
3.  Enter the root database path (default is `node2`).
4.  Click **Apply Changes**. The client will attempt to establish a WebSocket connection to your database.
5.  Click the **Test Cloud Upload** button on the dashboard to test pushing sample payloads.

---

## 📦 Building the Production APK

Since local building requires Android Studio, JDK, and the Android SDK command-line toolchain, the easiest and most professional way to build a standalone APK is through **Expo Application Services (EAS Build)**, which compiles the app in the cloud.

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Log in to Expo
Create a free Expo account at [expo.dev](https://expo.dev) and log in:
```bash
eas login
```

### Step 3: Configure EAS Build
Initialize the build configuration (this will generate an `eas.json` file in your directory):
```bash
eas build:configure
```
Choose `Android` when prompted.

### Step 4: Run the Build (Generate APK)
Run the build on Expo's remote servers:
```bash
eas build -p android --profile preview
```
This build profile (`preview`) compiles the application into a standalone **APK** file rather than an `.aab` file. Once the cloud build completes, the terminal will print a direct download link for the APK, which you can install on any Android phone.
