import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;
let activeChannels = [];

export const supabaseService = {
  /**
   * Initializes the Supabase client dynamically based on the user's dashboard settings.
   */
  connect: (supabaseUrl, supabaseAnonKey, onConnectionChange) => {
    try {
      // Unsubscribe from active channels
      activeChannels.forEach(channel => {
        if (supabaseInstance) supabaseInstance.removeChannel(channel);
      });
      activeChannels = [];
      supabaseInstance = null;

      if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
        onConnectionChange({ connected: false, message: 'Invalid Supabase URL or Anon Key' });
        return null;
      }

      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      });

      onConnectionChange({ connected: true, message: 'Connected to Supabase API Gateway' });
      return supabaseInstance;
    } catch (error) {
      console.warn('Supabase connection failed, running in simulation mode:', error);
      onConnectionChange({ connected: false, message: error.message });
      return null;
    }
  },

  /**
   * Universal Realtime Subscription helper for PostgreSQL tables
   */
  subscribeToTable: (tableName, onDataChange) => {
    if (!supabaseInstance) return null;

    try {
      const channel = supabaseInstance
        .channel(`public-${tableName}-changes`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          (payload) => {
            if (payload.new) {
              onDataChange(payload.new);
            }
          }
        )
        .subscribe((status) => {
          console.log(`Supabase Realtime Channel: ${tableName} status is ${status}`);
        });

      activeChannels.push(channel);
      return channel;
    } catch (error) {
      console.error(`Failed to subscribe to Supabase table ${tableName}:`, error);
      return null;
    }
  },

  /**
   * Remove a specific realtime channel subscription
   */
  unsubscribe: (channel) => {
    if (supabaseInstance && channel) {
      supabaseInstance.removeChannel(channel);
      activeChannels = activeChannels.filter(c => c !== channel);
    }
  },

  /**
   * Upload / Insert a sample event row to the 'detection_events' table.
   */
  uploadSampleEvent: async (eventData) => {
    if (!supabaseInstance) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await supabaseInstance
        .from('detection_events')
        .insert([
          {
            distance: eventData.distance,
            detection_result: eventData.detectionResult,
            cloud_upload_success: eventData.cloudUploadSuccess,
            servo_trigger_sent: eventData.servoTriggerSent
          }
        ]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Supabase event upload failed:', error);
      throw error;
    }
  },

  /**
   * Updates the shared system row (id: 1) to simulate trigger commands sent to the Servo Node (Node 3).
   */
  sendServoTrigger: async (triggerState = true) => {
    if (!supabaseInstance) return false;

    try {
      const { error } = await supabaseInstance
        .from('shared_system_status')
        .update({
          servo_trigger_status: triggerState ? 'Triggered' : 'Idle',
          servo_position: triggerState ? 90 : 0,
          door_status: triggerState ? 'Unlocked' : 'Locked',
          last_door_event: triggerState ? 'Unlocked via Node 2 Supabase trigger' : 'Locked'
        })
        .eq('id', 1);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Supabase servo trigger failed:', error);
      return false;
    }
  },

  /**
   * Supabase Authentication Providers
   */
  login: async (email, password) => {
    if (!supabaseInstance) return { success: false, error: 'Database not initialized' };
    
    try {
      const { data, error } = await supabaseInstance.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  loginWithGoogle: async () => {
    if (!supabaseInstance) return { success: false, error: 'Database not initialized' };
    
    try {
      const { data, error } = await supabaseInstance.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
        }
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  register: async (email, password, name) => {
    if (!supabaseInstance) return { success: false, error: 'Database not initialized' };
    
    try {
      const { data, error } = await supabaseInstance.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name
          }
        }
      });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    if (supabaseInstance) {
      await supabaseInstance.auth.signOut();
    }
  }
};
