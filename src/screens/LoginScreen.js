import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Animated, Pressable } from 'react-native';
import { Text, TextInput, Button, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { AppContext } from '../context/AppContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LoginScreen() {
  const { login, register, loginWithGoogle } = useContext(AppContext);
  const theme = useTheme();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- Animation References ---
  const fadeAnim = useRef(new Animated.Value(0)).current; // Opacity for sign-up fields
  const slideAnim = useRef(new Animated.Value(-15)).current; // Translate Y for sign-up fields
  const tabSlideAnim = useRef(new Animated.Value(0)).current; // Tab underline offset

  // Trigger animations when isSignUp toggles
  useEffect(() => {
    if (isSignUp) {
      // Animate signup fields in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(tabSlideAnim, {
          toValue: 120, // Slide right to signup tab
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        })
      ]).start();
    } else {
      // Animate signup fields out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(slideAnim, {
          toValue: -15,
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(tabSlideAnim, {
          toValue: 0, // Slide left to signin tab
          duration: 250,
          useNativeDriver: Platform.OS !== 'web',
        })
      ]).start();
    }
    setError('');
  }, [isSignUp]);

  const handleAction = async () => {
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in email and password fields.');
      return;
    }

    if (isSignUp) {
      if (!name) {
        setError('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      setLoading(true);
      const res = await register(email, password, name);
      setLoading(false);
      
      if (res.success) {
        setSuccess('Registration complete! Please check your verification email.');
        // Return to sign in screen
        setTimeout(() => {
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
        }, 3000);
      } else {
        setError(res.error || 'Registration failed.');
      }
    } else {
      setLoading(true);
      const successLogin = await login(email, password);
      setLoading(false);
      if (!successLogin) {
        setError('Invalid login credentials.');
      }
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setError('');
    setTimeout(() => {
      loginWithGoogle();
      setLoading(false);
    }, 1000);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 440,
      padding: 24,
      borderRadius: 24,
      elevation: 4,
      backgroundColor: theme.colors.elevation.level1,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: 'hidden',
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    logoIcon: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: theme.colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontWeight: '700',
      textAlign: 'center',
      color: theme.colors.primary,
    },
    subtitle: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    tabsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 24,
      position: 'relative',
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      paddingBottom: 4,
      width: 240,
      alignSelf: 'center',
    },
    tabButton: {
      width: 120,
      paddingVertical: 8,
      alignItems: 'center',
    },
    tabText: {
      fontWeight: 'bold',
      fontSize: 14,
    },
    activeLine: {
      position: 'absolute',
      bottom: -1,
      left: 0,
      width: 120,
      height: 3,
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
    },
    input: {
      marginBottom: 14,
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
    },
    actionBtn: {
      borderRadius: 12,
      paddingVertical: 4,
      marginBottom: 16,
      backgroundColor: theme.colors.primary,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
    },
    dividerText: {
      marginHorizontal: 12,
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
      fontWeight: '600',
    },
    googleBtn: {
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.outline,
      paddingVertical: 4,
    },
    googleBtnLabel: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    footer: {
      marginTop: 24,
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Icon name="supabase" size={40} color="#3ECF8E" />
            </View>
            <Text variant="headlineSmall" style={styles.title}>
              SMART ACCESS
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Supabase Telemetry Dashboard
            </Text>
          </View>

          {/* Sliding Animated Tabs */}
          <View style={styles.tabsContainer}>
            <Pressable style={styles.tabButton} onPress={() => setIsSignUp(false)}>
              <Text style={[styles.tabText, { color: !isSignUp ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
                Sign In
              </Text>
            </Pressable>
            <Pressable style={styles.tabButton} onPress={() => setIsSignUp(true)}>
              <Text style={[styles.tabText, { color: isSignUp ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
                Sign Up
              </Text>
            </Pressable>
            
            {/* Sliding Underline */}
            <Animated.View style={[styles.activeLine, { transform: [{ translateX: tabSlideAnim }] }]} />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          {/* Animated signup field (Full Name) */}
          {isSignUp && (
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <TextInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                disabled={loading}
                left={<TextInput.Icon icon="account-outline" />}
              />
            </Animated.View>
          )}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            disabled={loading}
            left={<TextInput.Icon icon="email-outline" />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
            disabled={loading}
            left={<TextInput.Icon icon="lock-outline" />}
          />

          {/* Animated signup field (Confirm Password) */}
          {isSignUp && (
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
                disabled={loading}
                left={<TextInput.Icon icon="lock-outline" />}
              />
            </Animated.View>
          )}

          {loading ? (
            <ActivityIndicator animating={true} color={theme.colors.primary} style={{ marginVertical: 16 }} />
          ) : (
            <Button
              mode="contained"
              onPress={handleAction}
              style={styles.actionBtn}
              contentStyle={{ height: 44 }}
            >
              {isSignUp ? 'Create Account' : 'Sign In to Console'}
            </Button>
          )}

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR DEVELOPER OAUTH</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            mode="outlined"
            onPress={handleGoogleLogin}
            style={styles.googleBtn}
            labelStyle={styles.googleBtnLabel}
            contentStyle={{ height: 44 }}
            disabled={loading}
            icon={({ size }) => (
              <Icon name="google" size={size} color="#4285F4" style={{ marginRight: 8 }} />
            )}
          >
            Sign In with Google
          </Button>

          <Text style={styles.footer}>
            Engineering Portal • Node 2 Supabase Client
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
