import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Switch, Card, useTheme, Appbar } from 'react-native-paper';
import { AppContext } from '../context/AppContext';

export default function SettingsScreen({ onBack }) {
  const { settings, updateSettings } = useContext(AppContext);
  const theme = useTheme();

  const [threshold, setThreshold] = useState(settings.distanceThreshold.toString());
  const [interval, setInterval] = useState(settings.measurementInterval.toString());
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl);
  const [supabaseKey, setSupabaseKey] = useState(settings.supabaseAnonKey);
  const [wifiSsid, setWifiSsid] = useState(settings.wifiSsid);
  const [notifications, setNotifications] = useState(settings.notificationsEnabled);
  const [darkMode, setDarkMode] = useState(settings.darkMode);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = () => {
    setErrorMsg('');
    setSuccessMsg('');

    const threshVal = parseFloat(threshold);
    const intervalVal = parseInt(interval, 10);

    if (isNaN(threshVal) || threshVal <= 0) {
      setErrorMsg('Distance threshold must be a positive number');
      return;
    }

    if (isNaN(intervalVal) || intervalVal < 100) {
      setErrorMsg('Measurement interval must be at least 100ms');
      return;
    }

    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
      setErrorMsg('Supabase URL must start with http:// or https://');
      return;
    }

    if (!supabaseKey) {
      setErrorMsg('Supabase Anon API Key is required');
      return;
    }

    if (!wifiSsid) {
      setErrorMsg('Wi-Fi SSID is required');
      return;
    }

    updateSettings({
      distanceThreshold: threshVal,
      measurementInterval: intervalVal,
      supabaseUrl,
      supabaseAnonKey: supabaseKey,
      wifiSsid,
      notificationsEnabled: notifications,
      darkMode
    });

    setSuccessMsg('Settings applied successfully!');
    setTimeout(() => {
      setSuccessMsg('');
      if (onBack) onBack();
    }, 1000);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 16,
      maxWidth: 600,
      width: '100%',
      alignSelf: 'center',
    },
    card: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      backgroundColor: theme.colors.elevation.level1,
    },
    cardTitle: {
      fontWeight: 'bold',
      marginBottom: 12,
      color: theme.colors.primary,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    rowLabelContainer: {
      flex: 1,
      marginRight: 16,
    },
    rowLabel: {
      fontWeight: '600',
    },
    rowSublabel: {
      color: theme.colors.onSurfaceVariant,
    },
    input: {
      marginBottom: 12,
    },
    btnContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
      gap: 12,
    },
    saveBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
    },
    cancelBtn: {
      borderRadius: 8,
      borderColor: theme.colors.outline,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: 16,
      fontWeight: '500',
    },
    successText: {
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: 16,
      fontWeight: '500',
    }
  });

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: theme.colors.elevation.level2 }}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title="Console Settings" titleStyle={{ fontWeight: 'bold' }} />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

          {/* Section 1: Telemetry Config */}
          <Card style={styles.card}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Sensor Configurations
            </Text>
            
            <TextInput
              label="Distance Threshold (cm)"
              value={threshold}
              onChangeText={setThreshold}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              left={<TextInput.Icon icon="map-marker-distance" />}
            />
            
            <TextInput
              label="Measurement Interval (ms)"
              value={interval}
              onChangeText={setInterval}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              left={<TextInput.Icon icon="timer-outline" />}
            />
          </Card>

          {/* Section 2: Wi-Fi & Cloud */}
          <Card style={styles.card}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Network & Database (Supabase)
            </Text>

            <TextInput
              label="Wi-Fi SSID"
              value={wifiSsid}
              onChangeText={setWifiSsid}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="wifi" />}
            />

            <TextInput
              label="Supabase API URL"
              value={supabaseUrl}
              onChangeText={setSupabaseUrl}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="link-variant" />}
            />

            <TextInput
              label="Supabase Anon API Key"
              value={supabaseKey}
              onChangeText={setSupabaseKey}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="key-variant" />}
            />
          </Card>

          {/* Section 3: System Controls */}
          <Card style={styles.card}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Preferences & Notifications
            </Text>

            <View style={styles.row}>
              <View style={styles.rowLabelContainer}>
                <Text variant="bodyLarge" style={styles.rowLabel}>Push Notifications</Text>
                <Text variant="bodySmall" style={styles.rowSublabel}>Alert when threshold breached or ESP disconnects</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                color={theme.colors.primary}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowLabelContainer}>
                <Text variant="bodyLarge" style={styles.rowLabel}>Dark UI Theme</Text>
                <Text variant="bodySmall" style={styles.rowSublabel}>Swap between Light and Dark Material themes</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                color={theme.colors.primary}
              />
            </View>
          </Card>

          {/* Action Buttons */}
          <View style={styles.btnContainer}>
            <Button
              mode="outlined"
              onPress={onBack}
              style={styles.cancelBtn}
              labelStyle={{ color: theme.colors.primary }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveBtn}
            >
              Apply Changes
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
