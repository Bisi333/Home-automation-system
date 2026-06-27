import React, { useContext, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, FlatList, Platform, Share } from 'react-native';
import { Text, Card, Button, Avatar, IconButton, useTheme, TextInput, Chip, Badge, Divider } from 'react-native-paper';
import { AppContext } from '../context/AppContext';
import Svg, { Circle, Polyline, Line, Rect, G, Text as TextSvg } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Card 2: Custom SVG Gauge Component ---
const SensorGauge = ({ value, max = 150, threshold = 15, theme }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = 60;
  const strokeWidth = 8;
  const innerRadius = radius - strokeWidth;
  const circumference = innerRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let color = '#4CAF50'; // Safe (Green)
  if (value <= threshold) {
    color = '#F44336'; // Too Close (Red)
  } else if (value < 50) {
    color = '#FF9800'; // Detected (Orange)
  }

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 12 }}>
      <Svg height={radius * 2} width={radius * 2}>
        <Circle
          stroke={theme.colors.outlineVariant}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={innerRadius}
          cx={radius}
          cy={radius}
        />
        <Circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={innerRadius}
          cx={radius}
          cy={radius}
          transform={`rotate(-90 ${radius} ${radius})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: theme.colors.onSurface }}>
          {value.toFixed(1)}
        </Text>
        <Text style={{ fontSize: 11, color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
          cm
        </Text>
      </View>
    </View>
  );
};

// --- Card 2: Custom SVG Sparkline Chart ---
const SensorSparkline = ({ history, threshold, theme }) => {
  if (!history || history.length === 0) return null;
  const maxVal = 150;
  const height = 70;
  const width = 280;
  
  const points = history.map((d, index) => {
    const x = (index / (history.length - 1)) * width;
    const y = height - (d.value / maxVal) * (height - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  const thresholdY = height - (threshold / maxVal) * (height - 10) - 5;

  return (
    <View style={{ alignItems: 'center', marginTop: 12 }}>
      <Svg height={height} width={width} style={{ overflow: 'visible' }}>
        {/* Threshold line */}
        <Line
          x1={0}
          y1={thresholdY}
          x2={width}
          y2={thresholdY}
          stroke="#F44336"
          strokeWidth={1.5}
          strokeDasharray="4,4"
        />
        {/* Sparkline path */}
        <Polyline
          fill="none"
          stroke={theme.colors.primary}
          strokeWidth={2}
          points={points}
        />
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: width, marginTop: 4 }}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>100s ago</Text>
        <Text variant="labelSmall" style={{ color: '#F44336', fontWeight: 'bold' }}>Limit: {threshold}cm</Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Now</Text>
      </View>
    </View>
  );
};

// --- Card 7: Custom SVG Bar Chart ---
const BarChart = ({ data, labels, theme, height = 90, width = 280 }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data) || 1;
  const spacing = 10;
  const colWidth = (width / data.length);
  const barWidth = colWidth - spacing;

  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Svg height={height} width={width}>
        {data.map((val, i) => {
          const barHeight = (val / maxVal) * (height - 25);
          const x = i * colWidth + spacing / 2;
          const y = height - barHeight - 15;
          return (
            <G key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={theme.colors.primary}
                rx={4}
              />
              <TextSvg
                x={x + barWidth / 2}
                y={height - 2}
                fontSize={8}
                fill={theme.colors.onSurfaceVariant}
                textAnchor="middle"
                fontWeight="600"
              >
                {labels[i]}
              </TextSvg>
              <TextSvg
                x={x + barWidth / 2}
                y={y - 4}
                fontSize={8}
                fill={theme.colors.primary}
                textAnchor="middle"
                fontWeight="bold"
              >
                {val}
              </TextSvg>
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

export default function DashboardScreen({ onOpenSettings }) {
  const {
    user,
    logout,
    settings,
    logs,
    clearLogs,
    exportLogs,
    activeAlerts,
    clearAlerts,
    espState,
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
  } = useContext(AppContext);

  const theme = useTheme();
  const [logSearch, setLogSearch] = useState('');

  // Filtering Logs
  const filteredLogs = logs.filter(l => 
    l.message.toLowerCase().includes(logSearch.toLowerCase()) || 
    l.type.toLowerCase().includes(logSearch.toLowerCase())
  );

  const handleExport = () => {
    const rawLogs = exportLogs();
    if (Platform.OS === 'web') {
      const element = document.createElement("a");
      const file = new Blob([rawLogs], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = "esp32_node2_logs.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      Share.share({
        message: rawLogs,
        title: 'ESP32 Node 2 Console Logs'
      });
    }
  };

  const getSignalIcon = (rssi) => {
    if (rssi >= -60) return 'wifi-strength-4';
    if (rssi >= -70) return 'wifi-strength-3';
    if (rssi >= -80) return 'wifi-strength-2';
    return 'wifi-strength-1';
  };

  const getSignalStrength = (rssi) => {
    if (rssi >= -60) return 'Excellent';
    if (rssi >= -70) return 'Good';
    if (rssi >= -80) return 'Fair';
    return 'Poor';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.elevation.level2,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    profileSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    profileInfo: {
      justifyContent: 'center',
    },
    alertBanner: {
      backgroundColor: theme.colors.errorContainer,
      margin: 16,
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 8,
      justifyContent: 'space-around',
    },
    card: {
      width: Platform.OS === 'web' && Dimensions.get('window').width > 768 ? '47%' : '95%',
      margin: 8,
      borderRadius: 16,
      backgroundColor: theme.colors.elevation.level1,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    cardFullWidth: {
      width: '95%',
      margin: 8,
      borderRadius: 16,
      backgroundColor: theme.colors.elevation.level1,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    cardTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    cardTitle: {
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    metricRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.outlineVariant,
      alignItems: 'center',
    },
    metricValue: {
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    monitoringBtn: {
      marginTop: 16,
      borderRadius: 12,
    },
    timelineContainer: {
      maxHeight: 250,
      marginTop: 8,
    },
    timelineRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderLeftWidth: 2,
      borderLeftColor: theme.colors.primary,
      paddingLeft: 12,
      marginBottom: 8,
      backgroundColor: theme.colors.elevation.level2,
      borderRadius: 8,
    },
    logContainer: {
      height: 200,
      backgroundColor: '#0d1117',
      borderRadius: 12,
      padding: 8,
      marginTop: 12,
    },
    logRow: {
      fontSize: 11,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      marginBottom: 4,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      fontWeight: 'bold',
      fontSize: 11,
    }
  });

  return (
    <View style={styles.container}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Avatar.Image size={40} source={{ uri: user.photoUrl }} />
          <View style={styles.profileInfo}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{user.name}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{user.email}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <IconButton icon="cog" iconColor={theme.colors.primary} size={24} onPress={onOpenSettings} />
          <IconButton icon="logout" iconColor={theme.colors.error} size={24} onPress={logout} />
        </View>
      </View>

      <ScrollView>
        {/* Active Alert Banner */}
        {activeAlerts.length > 0 && (
          <View style={styles.alertBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Icon name="alert-decagram" size={24} color={theme.colors.error} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: theme.colors.onErrorContainer }}>
                  {activeAlerts[0].title}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer }}>
                  {activeAlerts[0].body}
                </Text>
              </View>
            </View>
            <IconButton icon="close" iconColor={theme.colors.error} size={18} onPress={clearAlerts} />
          </View>
        )}

        {/* Dashboard Grid */}
        <View style={styles.grid}>

          {/* CARD 1: ESP32 Connection */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardTitleContainer}>
                <Icon name="microcontroller" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.cardTitle}>ESP32 Node Status</Text>
              </View>
              
              <View style={styles.metricRow}>
                <Text>ESP32 Status</Text>
                <Text style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: espState.status === 'Online' ? '#e8f5e9' : '#ffebee',
                    color: espState.status === 'Online' ? '#2e7d32' : '#c62828'
                  }
                ]}>
                  {espState.status.toUpperCase()}
                </Text>
              </View>

              <View style={styles.metricRow}>
                <Text>Wi-Fi SSID</Text>
                <Text style={styles.metricValue}>{settings.wifiSsid}</Text>
              </View>

              <View style={styles.metricRow}>
                <Text>IP Address</Text>
                <Text style={styles.metricValue}>{espState.ipAddress}</Text>
              </View>

              <View style={styles.metricRow}>
                <Text>RSSI Signal Strength</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name={getSignalIcon(espState.rssi)} size={16} color={theme.colors.primary} />
                  <Text style={styles.metricValue}>{espState.rssi} dBm ({getSignalStrength(espState.rssi)})</Text>
                </View>
              </View>

              <View style={styles.metricRow}>
                <Text>Uptime</Text>
                <Text style={styles.metricValue}>{espState.uptime}</Text>
              </View>

              <View style={styles.metricRow}>
                <Text>Last Communication</Text>
                <Text style={styles.metricValue}>{espState.lastCommunicationTime}</Text>
              </View>
            </Card.Content>
          </Card>

          {/* CARD 2: Ultrasonic Sensor */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardTitleContainer}>
                <Icon name="radar" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.cardTitle}>Ultrasonic Sensor</Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
                <SensorGauge value={distance} threshold={settings.distanceThreshold} theme={theme} />
                <View style={{ alignItems: 'flex-start', gap: 6 }}>
                  <Text variant="titleSmall" style={{ color: theme.colors.onSurfaceVariant }}>Distance Status</Text>
                  <Chip 
                    textStyle={{ fontWeight: 'bold' }}
                    style={{ 
                      backgroundColor: sensorStatus === 'Safe' ? '#e8f5e9' : 
                                       sensorStatus === 'Object Detected' ? '#fff3e0' : '#ffebee'
                    }}
                  >
                    {sensorStatus}
                  </Chip>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Threshold: {settings.distanceThreshold} cm
                  </Text>
                </View>
              </View>

              {/* Sparkline Graph */}
              <SensorSparkline history={distanceHistory} threshold={settings.distanceThreshold} theme={theme} />
            </Card.Content>
          </Card>

          {/* CARD 3: Detection Events */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardTitleContainer}>
                <Icon name="counter" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.cardTitle}>Detection Events</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginVertical: 12 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text variant="headlineLarge" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                    {detectionsToday}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Detections Today</Text>
                </View>
                <Divider style={{ height: 40, width: 1, backgroundColor: theme.colors.outlineVariant }} />
                <View style={{ alignItems: 'center' }}>
                  <Text variant="titleMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                    {detectionTimestamp}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Last Event</Text>
                </View>
              </View>

              <View style={styles.metricRow}>
                <Text>Minimum Distance</Text>
                <Text style={styles.metricValue}>{minDistance.toFixed(1)} cm</Text>
              </View>
              <View style={styles.metricRow}>
                <Text>Maximum Distance</Text>
                <Text style={styles.metricValue}>{maxDistance.toFixed(1)} cm</Text>
              </View>
              <View style={styles.metricRow}>
                <Text>Average Distance</Text>
                <Text style={styles.metricValue}>{avgDistance.toFixed(1)} cm</Text>
              </View>

              <Button 
                mode={isMonitoring ? 'outlined' : 'contained'} 
                onPress={toggleMonitoring}
                style={[styles.monitoringBtn, { borderColor: isMonitoring ? theme.colors.error : theme.colors.primary }]}
                labelStyle={{ color: isMonitoring ? theme.colors.error : '#ffffff', fontWeight: 'bold' }}
                icon={isMonitoring ? 'stop-circle-outline' : 'play-circle-outline'}
              >
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </Button>
            </Card.Content>
          </Card>

          {/* CARD 4: Cloud Communication */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardTitleContainer}>
                <Icon name="cloud-sync" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.cardTitle}>Cloud Communication</Text>
              </View>

              <View style={styles.metricRow}>
                <Text>Supabase Connected</Text>
                <Badge style={{ 
                  backgroundColor: cloudState.supabaseConnected ? '#2e7d32' : '#c62828',
                  paddingHorizontal: 8,
                  height: 20,
                  alignSelf: 'center'
                }}>
                  {cloudState.supabaseConnected ? 'OK' : 'DISCONNECTED'}
                </Badge>
              </View>

              <View style={styles.metricRow}>
                <Text>Database Status</Text>
                <Text style={styles.metricValue}>{cloudState.databaseStatus}</Text>
              </View>

              <View style={styles.metricRow}>
                <Text>Upload Delay (ms)</Text>
                <Text style={styles.metricValue}>{cloudState.uploadDelay} ms</Text>
              </View>

              <View style={styles.metricRow}>
                <Text>Connection Health</Text>
                <Text style={[
                  styles.metricValue, 
                  { color: cloudState.connectionHealth === 'Excellent' ? '#2e7d32' : '#f57c00' }
                ]}>
                  {cloudState.connectionHealth}
                </Text>
              </View>

              <View style={styles.metricRow}>
                <Text>Last Sync Time</Text>
                <Text style={styles.metricValue}>{cloudState.lastUploadTime}</Text>
              </View>

              <Button
                mode="contained"
                onPress={triggerTestUpload}
                style={{ marginTop: 16, borderRadius: 12 }}
                icon="cloud-upload-outline"
              >
                Test Cloud Upload
              </Button>
            </Card.Content>
          </Card>

          {/* CARD 5: Shared System Status */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardTitleContainer}>
                <Icon name="lan" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.cardTitle}>Shared System Status</Text>
              </View>

              <View style={styles.metricRow}>
                <Text>RFID Node (Node 1)</Text>
                <Text style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: sharedSystem.rfidNodeStatus === 'Online' ? '#e8f5e9' : '#ffebee',
                    color: sharedSystem.rfidNodeStatus === 'Online' ? '#2e7d32' : '#c62828'
                  }
                ]}>
                  {sharedSystem.rfidNodeStatus.toUpperCase()}
                </Text>
              </View>

              <View style={styles.metricRow}>
                <Text>Servo Node (Node 3)</Text>
                <Text style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: sharedSystem.servoNodeStatus === 'Online' ? '#e8f5e9' : '#ffebee',
                    color: sharedSystem.servoNodeStatus === 'Online' ? '#2e7d32' : '#c62828'
                  }
                ]}>
                  {sharedSystem.servoNodeStatus.toUpperCase()}
                </Text>
              </View>

              <View style={styles.metricRow}>
                <Text>Temp Node (Node 4)</Text>
                <Text style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: sharedSystem.tempNodeStatus === 'Online' ? '#e8f5e9' : '#ffebee',
                    color: sharedSystem.tempNodeStatus === 'Online' ? '#2e7d32' : '#c62828'
                  }
                ]}>
                  {sharedSystem.tempNodeStatus.toUpperCase()}
                </Text>
              </View>

              <View style={styles.metricRow}>
                <Text>Current Door Status</Text>
                <Text style={[
                  styles.metricValue, 
                  { color: sharedSystem.doorStatus === 'Unlocked' ? '#2e7d32' : theme.colors.onSurface }
                ]}>
                  {sharedSystem.doorStatus.toUpperCase()}
                </Text>
              </View>

              <View style={styles.metricRow}>
                <Text>Servo Trigger Status</Text>
                <Text style={styles.metricValue}>{sharedSystem.servoTriggerStatus}</Text>
              </View>

              <View style={styles.metricRow}>
                <Text>Servo Position</Text>
                <Text style={styles.metricValue}>{sharedSystem.servoPosition}°</Text>
              </View>

              <View style={styles.metricRow}>
                <Text>Last Event Info</Text>
                <Text variant="bodySmall" style={{ fontWeight: '500', color: theme.colors.onSurfaceVariant }}>
                  {sharedSystem.lastDoorEvent}
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* CARD 6: Event Timeline */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardTitleContainer}>
                <Icon name="timeline-text" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.cardTitle}>Event Timeline</Text>
              </View>

              <ScrollView style={styles.timelineContainer}>
                {timelineEvents.map((item, index) => (
                  <View key={item.id || index} style={styles.timelineRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold' }}>{item.detectionResult}</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Distance: {item.distance} cm • {item.time}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Icon 
                        name={item.cloudUploadSuccess ? 'cloud-check' : 'cloud-alert'} 
                        size={16} 
                        color={item.cloudUploadSuccess ? '#2e7d32' : '#c62828'} 
                      />
                      {item.servoTriggerSent && (
                        <Icon name="door-open" size={16} color="#f57c00" />
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </Card.Content>
          </Card>

          {/* CARD 7: Analytics */}
          <Card style={styles.cardFullWidth}>
            <Card.Content>
              <View style={styles.cardTitleContainer}>
                <Icon name="chart-bar" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.cardTitle}>Device Analytics</Text>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 16 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 4 }}>Hourly Detections</Text>
                  <BarChart 
                    data={analytics.hourlyDetections} 
                    labels={['08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h']} 
                    theme={theme}
                  />
                </View>

                <View style={{ alignItems: 'center' }}>
                  <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 4 }}>Daily Detections</Text>
                  <BarChart 
                    data={analytics.dailyDetections} 
                    labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} 
                    theme={theme}
                  />
                </View>
              </View>

              <Divider style={{ marginVertical: 12 }} />

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
                <Text variant="bodySmall">Avg Detection Distance: <Text style={{ fontWeight: 'bold' }}>{analytics.avgDetectionDistance} cm</Text></Text>
                <Text variant="bodySmall">Min Distance Record: <Text style={{ fontWeight: 'bold' }}>{analytics.minDistanceOverall} cm</Text></Text>
                <Text variant="bodySmall">Max Distance Record: <Text style={{ fontWeight: 'bold' }}>{analytics.maxDistanceOverall} cm</Text></Text>
                <Text variant="bodySmall">Cloud Response (Avg): <Text style={{ fontWeight: 'bold' }}>{analytics.avgCloudResponseTime} ms</Text></Text>
              </View>
            </Card.Content>
          </Card>

          {/* CARD 8: Developer Logs */}
          <Card style={styles.cardFullWidth}>
            <Card.Content>
              <View style={styles.cardTitleContainer}>
                <Icon name="console" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.cardTitle}>Developer Logs</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <TextInput
                  placeholder="Search logs..."
                  value={logSearch}
                  onChangeText={setLogSearch}
                  mode="outlined"
                  dense
                  style={{ flex: 1, height: 40 }}
                  left={<TextInput.Icon icon="magnify" />}
                />
                <Button mode="outlined" compact onPress={clearLogs} style={{ borderRadius: 8 }}>
                  Clear
                </Button>
                <Button mode="contained-tonal" compact onPress={handleExport} style={{ borderRadius: 8 }} icon="export">
                  Export
                </Button>
              </View>

              <ScrollView style={styles.logContainer}>
                {filteredLogs.map((log) => {
                  let color = '#a3b1bf';
                  if (log.type === 'success') color = '#34d058';
                  else if (log.type === 'warn') color = '#ffab70';
                  else if (log.type === 'error') color = '#f97583';

                  return (
                    <Text key={log.id} style={[styles.logRow, { color }]}>
                      [{log.timestamp}] [{log.type.toUpperCase()}] {log.message}
                    </Text>
                  );
                })}
              </ScrollView>
            </Card.Content>
          </Card>

        </View>
      </ScrollView>
    </View>
  );
}
