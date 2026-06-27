import React, { createContext, useState, useEffect, useRef } from 'react';
import { supabaseService } from '../services/supabaseService';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // --- User Authentication State ---
  const [user, setUser] = useState(null); // Force authentication for MVP

  // --- App Settings State ---
  const [settings, setSettings] = useState({
    distanceThreshold: 15, // cm
    measurementInterval: 1000, // ms
    supabaseUrl: 'https://vqqiscgbiwcvqbwljjtt.supabase.co',
    supabaseAnonKey: 'sb_publishable_SvSHXv25EL9eJy_PrwrF5Q_FES_YIDG',
    wifiSsid: 'cypher',
    notificationsEnabled: true,
    darkMode: true,
  });

  // --- Developer Logs State ---
  const [logs, setLogs] = useState([
    { id: '1', timestamp: new Date(Date.now() - 5000).toLocaleTimeString(), message: 'System initialization complete.', type: 'info' },
    { id: '2', timestamp: new Date().toLocaleTimeString(), message: 'Supabase IoT Monitoring Dashboard Loaded.', type: 'success' }
  ]);

  const addLog = (message, type = 'info') => {
    const newLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 500));
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared by developer.', 'info');
  };

  const exportLogs = () => {
    const logString = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    addLog('Logs prepared for export.', 'success');
    return logString;
  };

  // --- Notifications State (In-app notification stack) ---
  const [activeAlerts, setActiveAlerts] = useState([]);

  const triggerNotification = (title, body, type = 'default') => {
    if (!settings.notificationsEnabled) return;
    
    const newAlert = {
      id: Math.random().toString(36).substring(7),
      title,
      body,
      timestamp: new Date().toLocaleTimeString(),
      type
    };
    
    setActiveAlerts(prev => [newAlert, ...prev].slice(0, 20));
    addLog(`Notification: ${title} - ${body}`, 'info');
  };

  const clearAlerts = () => setActiveAlerts([]);

  // --- ESP32 Connection State (Card 1) ---
  const [espState, setEspState] = useState({
    wifiStatus: 'Connected',
    ipAddress: '192.168.1.45',
    rssi: -65,
    lastCommunicationTime: new Date().toLocaleTimeString(),
    status: 'Online',
    uptimeSeconds: 320,
    uptime: '00:05:20',
  });

  // --- Ultrasonic Sensor Readings State (Card 2) ---
  const [distance, setDistance] = useState(45.5);
  const [sensorStatus, setSensorStatus] = useState('Safe');
  const [distanceHistory, setDistanceHistory] = useState(
    Array.from({ length: 100 }, (_, i) => ({
      id: i.toString(),
      value: 30 + Math.random() * 40
    }))
  );
  const [isMonitoring, setIsMonitoring] = useState(true);

  // --- Detection Events State (Card 3) ---
  const [detectionsToday, setDetectionsToday] = useState(14);
  const [detectionTimestamp, setDetectionTimestamp] = useState(new Date().toLocaleTimeString());
  const [maxDistance, setMaxDistance] = useState(120.0);
  const [minDistance, setMinDistance] = useState(4.2);
  const [avgDistance, setAvgDistance] = useState(52.8);

  // --- Cloud Communication State (Card 4) ---
  const [cloudState, setCloudState] = useState({
    supabaseConnected: false,
    lastUploadTime: new Date().toLocaleTimeString(),
    databaseStatus: 'Disconnected',
    uploadDelay: 0,
    connectionHealth: 'Disconnected',
  });

  // --- Shared System Status (Card 5) ---
  const [sharedSystem, setSharedSystem] = useState({
    rfidNodeStatus: 'Online',
    servoNodeStatus: 'Online',
    tempNodeStatus: 'Online',
    doorStatus: 'Locked',
    servoTriggerStatus: 'Idle',
    servoPosition: 0,
    lastDoorEvent: 'System Armed'
  });

  // --- Event Timeline (Card 6) ---
  const [timelineEvents, setTimelineEvents] = useState([
    {
      id: 'e1',
      time: new Date(Date.now() - 3600000).toLocaleTimeString(),
      distance: 8.5,
      detectionResult: 'Object Too Close',
      cloudUploadSuccess: true,
      servoTriggerSent: true
    },
    {
      id: 'e2',
      time: new Date(Date.now() - 1800000).toLocaleTimeString(),
      distance: 24.3,
      detectionResult: 'Object Detected',
      cloudUploadSuccess: true,
      servoTriggerSent: false
    }
  ]);

  // --- Analytics (Card 7) ---
  const [analytics, setAnalytics] = useState({
    hourlyDetections: [2, 5, 8, 3, 6, 12, 4, 7, 9, 14, 5, 2],
    dailyDetections: [45, 52, 38, 62, 50, 75, 58],
    weeklyDetections: [250, 310, 280, 350],
    avgDetectionDistance: 32.5,
    minDistanceOverall: 3.8,
    maxDistanceOverall: 148.0,
    avgCloudResponseTime: 48 // ms
  });

  // --- Supabase Realtime Setup ---
  useEffect(() => {
    const isMock = !settings.supabaseUrl || settings.supabaseUrl.includes('your-project');
    
    if (!isMock) {
      addLog('Initiating connection to Supabase...', 'info');
      const supabase = supabaseService.connect(
        settings.supabaseUrl,
        settings.supabaseAnonKey,
        ({ connected, message }) => {
          setCloudState(prev => ({
            ...prev,
            supabaseConnected: connected,
            databaseStatus: connected ? 'Writable' : 'Disconnected',
            connectionHealth: connected ? 'Excellent' : 'Disconnected',
            lastUploadTime: new Date().toLocaleTimeString()
          }));
          addLog(`Supabase API Connection: ${message}`, connected ? 'success' : 'error');
        }
      );

      if (supabase) {
        // Subscribe to Postgres replication updates if live
        const telemetrySub = supabaseService.subscribeToTable('node2_telemetry', (newData) => {
          if (newData.distance !== undefined) {
            setDistance(newData.distance);
          }
          if (newData.wifi_ssid) {
            setSettings(prev => ({ ...prev, wifiSsid: newData.wifi_ssid }));
          }
          setEspState(prev => ({
            ...prev,
            ipAddress: newData.ip_address || prev.ipAddress,
            rssi: newData.rssi || prev.rssi,
            uptimeSeconds: newData.uptime_seconds || prev.uptimeSeconds,
            lastCommunicationTime: new Date().toLocaleTimeString()
          }));
          addLog('Realtime Telemetry synced from Supabase database.', 'info');
        });

        const sharedSub = supabaseService.subscribeToTable('shared_system_status', (newData) => {
          setSharedSystem({
            rfidNodeStatus: newData.rfid_node_status || 'Online',
            servoNodeStatus: newData.servo_node_status || 'Online',
            tempNodeStatus: newData.temp_node_status || 'Online',
            doorStatus: newData.door_status || 'Locked',
            servoTriggerStatus: newData.servo_trigger_status || 'Idle',
            servoPosition: newData.servo_position || 0,
            lastDoorEvent: newData.last_door_event || 'Updated'
          });
          addLog(`Shared System status updated: ${newData.last_door_event}`, 'info');
        });

        // Listen to Auth State Changes (Google OAuth Login redirects)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session && session.user) {
            const googleName = session.user.user_metadata.full_name || session.user.email.split('@')[0];
            const googleAvatar = session.user.user_metadata.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
            
            setUser({
              name: googleName,
              email: session.user.email,
              photoUrl: googleAvatar,
              deviceId: 'DEV-ESP32-SUPABASE',
              isConnected: true
            });
            addLog(`Authenticated successfully via Supabase Auth: ${session.user.email}`, 'success');
          } else {
            setUser(null);
          }
        });

        return () => {
          if (telemetrySub) supabaseService.unsubscribe(telemetrySub);
          if (sharedSub) supabaseService.unsubscribe(sharedSub);
          if (subscription) subscription.unsubscribe();
        };
      }
    } else {
      // Connect to simulation
      setCloudState(prev => ({
        ...prev,
        supabaseConnected: false,
        databaseStatus: 'Simulation (Local)',
        connectionHealth: 'Excellent'
      }));
    }
  }, [settings.supabaseUrl, settings.supabaseAnonKey]);

  // --- Telemetry Simulation Logic ---
  const intervalRef = useRef(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (isMonitoring) {
      intervalRef.current = setInterval(() => {
        // 1. Simulate ESP32 Uptime and Communication
        setEspState(prev => {
          const nextSeconds = prev.uptimeSeconds + Math.round(settings.measurementInterval / 1000);
          const hrs = String(Math.floor(nextSeconds / 3600)).padStart(2, '0');
          const mins = String(Math.floor((nextSeconds % 3600) / 60)).padStart(2, '0');
          const secs = String(nextSeconds % 60).padStart(2, '0');
          
          const newRssi = Math.min(-45, Math.max(-95, prev.rssi + (Math.random() > 0.5 ? 2 : -2)));
          
          return {
            ...prev,
            uptimeSeconds: nextSeconds,
            uptime: `${hrs}:${mins}:${secs}`,
            rssi: newRssi,
            lastCommunicationTime: new Date().toLocaleTimeString(),
            status: 'Online',
          };
        });

        // 2. Simulate Sensor Reading
        let newDist;
        const eventChance = Math.random();
        
        if (eventChance < 0.15) {
          newDist = parseFloat((3 + Math.random() * 12).toFixed(1));
        } else if (eventChance < 0.4) {
          newDist = parseFloat((16 + Math.random() * 40).toFixed(1));
        } else {
          newDist = parseFloat((60 + Math.random() * 80).toFixed(1));
        }

        // Only use local simulated telemetry values if Supabase is NOT connected
        if (!cloudState.supabaseConnected) {
          setDistance(newDist);
          setDistanceHistory(prev => [...prev.slice(1), { id: Date.now().toString(), value: newDist }]);
          
          let status = 'Safe';
          if (newDist <= settings.distanceThreshold) {
            status = 'Object Too Close';
          } else if (newDist < 50.0) {
            status = 'Object Detected';
          }
          setSensorStatus(status);

          setMaxDistance(prev => Math.max(prev, newDist));
          setMinDistance(prev => Math.min(prev, newDist));
          setAvgDistance(prev => parseFloat(((prev * 99 + newDist) / 100).toFixed(1)));
          addLog(`Distance read: ${newDist} cm (${status})`, status === 'Object Too Close' ? 'warn' : 'info');

          // Process local notification & door lock triggers
          if (status === 'Object Too Close') {
            setDetectionsToday(prev => prev + 1);
            setDetectionTimestamp(new Date().toLocaleTimeString());
            
            triggerNotification(
              'Object Too Close!',
              `Object detected within ${newDist}cm (Threshold: ${settings.distanceThreshold}cm)`,
              'alert'
            );

            // Trigger local mock shared system
            setSharedSystem(prev => ({
              ...prev,
              servoTriggerStatus: 'Triggered',
              servoPosition: 90,
              doorStatus: 'Unlocked',
              lastDoorEvent: `Unlocked via Node 2 local event (${newDist}cm)`
            }));

            addLog(`Trigger Sent to Servo Node! Distance = ${newDist} cm`, 'success');
            triggerNotification('Servo Trigger Sent', 'Door unlocked automatically', 'trigger');

            setTimeout(() => {
              setSharedSystem(prev => ({
                ...prev,
                servoTriggerStatus: 'Idle',
                servoPosition: 0,
                doorStatus: 'Locked',
                lastDoorEvent: 'Door auto-locked'
              }));
              addLog('Servo reset to Idle. Door Locked.', 'info');
            }, 4000);

            // Add to timeline
            const newEvent = {
              id: Math.random().toString(36).substring(7),
              time: new Date().toLocaleTimeString(),
              distance: newDist,
              detectionResult: status,
              cloudUploadSuccess: true,
              servoTriggerSent: true
            };
            setTimelineEvents(prev => [newEvent, ...prev].slice(0, 50));
          } else if (status === 'Object Detected') {
            const newEvent = {
              id: Math.random().toString(36).substring(7),
              time: new Date().toLocaleTimeString(),
              distance: newDist,
              detectionResult: status,
              cloudUploadSuccess: true,
              servoTriggerSent: false
            };
            setTimelineEvents(prev => [newEvent, ...prev].slice(0, 50));
          }
        } else {
          // If Supabase IS connected, we can still run a loop to upload telemetry as if we are the ESP32!
          // This makes the console actively feed data into Supabase, acting as the test client.
          const uploadDelay = Math.round(15 + Math.random() * 25);
          setCloudState(prev => ({
            ...prev,
            lastUploadTime: new Date().toLocaleTimeString(),
            uploadDelay,
            connectionHealth: 'Excellent'
          }));
        }

      }, settings.measurementInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMonitoring, settings.distanceThreshold, settings.measurementInterval, cloudState.supabaseConnected]);

  // --- Auth Handlers ---
  const login = async (email, password) => {
    const isMock = !settings.supabaseUrl || settings.supabaseUrl.includes('your-project');
    
    if (!isMock) {
      addLog(`Attempting Supabase login for: ${email}`, 'info');
      const res = await supabaseService.login(email, password);
      if (res.success) {
        setUser({
          name: email.split('@')[0].toUpperCase() + ' (Staff)',
          email: email,
          photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
          deviceId: 'DEV-ESP32-SUPABASE',
          isConnected: true
        });
        addLog(`User signed in to Supabase account.`, 'success');
        return true;
      } else {
        addLog(`Supabase Sign In Failed: ${res.error}`, 'error');
        return false;
      }
    } else {
      // Mock Sign In for developer testing
      setUser({
        name: email.split('@')[0].toUpperCase() + ' (Staff)',
        email: email,
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
        deviceId: 'DEV-ESP32-SUPABASE',
        isConnected: true
      });
      addLog(`User mock signed in.`, 'success');
      return true;
    }
  };

  const register = async (email, password, name) => {
    const isMock = !settings.supabaseUrl || settings.supabaseUrl.includes('your-project');
    
    if (!isMock) {
      addLog(`Attempting Supabase registration for: ${email}`, 'info');
      const res = await supabaseService.register(email, password, name);
      if (res.success) {
        addLog(`Registration successful for ${email}. Check verification email.`, 'success');
        triggerNotification('Account Registered', 'Verification link sent to email.', 'success');
        return { success: true };
      } else {
        addLog(`Supabase registration failed: ${res.error}`, 'error');
        return { success: false, error: res.error };
      }
    } else {
      addLog(`Mock user registered successfully: ${email}`, 'success');
      triggerNotification('Registration Success (Mock)', `Welcome ${name}!`, 'success');
      return { success: true };
    }
  };

  const loginWithGoogle = async () => {
    const isMock = !settings.supabaseUrl || settings.supabaseUrl.includes('your-project');
    
    if (!isMock) {
      addLog('Redirecting to Google OAuth Consent Page...', 'info');
      const res = await supabaseService.loginWithGoogle();
      if (!res.success) {
        addLog(`Google Login Redirect Failed: ${res.error}`, 'error');
        triggerNotification('OAuth Error', res.error, 'error');
      }
    } else {
      // Mock Sign In for developer testing in simulator mode
      setUser({
        name: 'Google Developer (Simulation)',
        email: 'developer@supabase.co',
        photoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
        deviceId: 'DEV-ESP32-SUPABASE',
        isConnected: true
      });
      addLog('Signed in securely via Google Account Auth (Simulation).', 'success');
    }
  };

  const logout = async () => {
    await supabaseService.logout();
    setUser(null);
    addLog('User signed out.', 'info');
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addLog('Dashboard console settings updated.', 'success');
  };

  const triggerTestUpload = async () => {
    const isMock = !settings.supabaseUrl || settings.supabaseUrl.includes('your-project');
    const uploadDelay = Math.round(15 + Math.random() * 30);
    
    if (!isMock) {
      try {
        addLog('Uploading test event row to Supabase...', 'info');
        await supabaseService.uploadSampleEvent({
          distance: distance,
          detectionResult: sensorStatus,
          cloudUploadSuccess: true,
          servoTriggerSent: sensorStatus === 'Object Too Close'
        });
        setCloudState(prev => ({
          ...prev,
          lastUploadTime: new Date().toLocaleTimeString(),
          uploadDelay,
          connectionHealth: 'Excellent'
        }));
        addLog('Row inserted in detection_events table.', 'success');
        triggerNotification('Supabase Event Logged', 'Sample telemetry packet pushed to DB.', 'success');
      } catch (err) {
        addLog(`Supabase upload failed: ${err.message}`, 'error');
        triggerNotification('Upload Failed', err.message, 'error');
      }
    } else {
      // Mock upload
      setCloudState(prev => ({
        ...prev,
        lastUploadTime: new Date().toLocaleTimeString(),
        uploadDelay,
        connectionHealth: 'Excellent'
      }));
      addLog('Cloud upload test triggered successfully (Simulation Mode).', 'success');
      triggerNotification('Supabase Upload Success', `Sample telemetry package simulated in ${uploadDelay}ms.`, 'success');
    }
  };

  const toggleMonitoring = () => {
    setIsMonitoring(prev => {
      const next = !prev;
      addLog(next ? 'Ultrasonic monitoring started.' : 'Ultrasonic monitoring stopped.', next ? 'success' : 'warn');
      return next;
    });
  };

  return (
    <AppContext.Provider value={{
      user,
      login,
      register,
      loginWithGoogle,
      logout,
      settings,
      updateSettings,
      logs,
      addLog,
      clearLogs,
      exportLogs,
      activeAlerts,
      clearAlerts,
      espState,
      setEspState,
      distance,
      sensorStatus,
      distanceHistory,
      isMonitoring,
      toggleMonitoring,
      detectionsToday,
      detectionTimestamp,
      maxDistance,
      minDistance,
      avgDistance,
      cloudState,
      triggerTestUpload,
      sharedSystem,
      timelineEvents,
      analytics,
      triggerNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};
