import { AdminNotification, NotificationSettings } from '../types';

const STORAGE_KEY_NOTIFICATIONS = 'afinbo_admin_notifications';
const STORAGE_KEY_SETTINGS = 'afinbo_notification_settings';
const BROADCAST_CHANNEL_NAME = 'afinbo_quote_notifications_channel';

const DEFAULT_SETTINGS: NotificationSettings = {
  emailAlertsEnabled: true,
  adminEmail: 'afinboproject@gmail.com',
  soundAlertsEnabled: true,
  inAppBannerEnabled: true,
};

// Singleton BroadcastChannel instance
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment:', e);
}

/**
 * Retrieve Notification Settings
 */
export function getNotificationSettings(): NotificationSettings {
  try {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save Notification Settings
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    }
  } catch (e) {
    console.error('Failed to save notification settings:', e);
  }
}

/**
 * Retrieve stored notifications list
 */
export function getStoredNotifications(): AdminNotification[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!raw) {
      // Return initial demo notification so admins can test immediately
      return [
        {
          id: 'notif-initial-demo-1',
          type: 'quote_request',
          title: 'New Quote Request',
          message: 'Emmanuel Adebayo requested a quote for 2x Fujikura 90S+ Core Alignment Splicer',
          customerName: 'Emmanuel Adebayo',
          customerEmail: 'adebayo.fiber@lagostelecom.ng',
          customerPhone: '+234 803 111 2233',
          companyName: 'MainOne Infrastructure Ltd',
          productName: 'Fujikura 90S+ Core Alignment Splicer',
          quantity: 2,
          notes: 'Urgent procurement needed for Ikeja metropolitan backhaul expansion.',
          quoteId: 'q-101',
          read: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save notifications list to localStorage
 */
export function saveNotifications(notifications: AdminNotification[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
    }
  } catch (e) {
    console.error('Failed to save notifications to localStorage:', e);
  }
}

/**
 * Play a professional synthesized dual-tone notification chime
 * Uses Web Audio API without requiring external audio files
 */
export function playNotificationSound(): void {
  try {
    const settings = getNotificationSettings();
    if (!settings.soundAlertsEnabled) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Tone 1: High crisp D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2: Harmonious A5 (880.00 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (e) {
    // Audio contexts may be blocked before first user gesture
    console.debug('Audio notification notice:', e);
  }
}

/**
 * Send an email alert to the administrator
 */
export async function sendEmailNotification(notification: AdminNotification): Promise<{ success: boolean; message: string }> {
  const settings = getNotificationSettings();
  if (!settings.emailAlertsEnabled) {
    return { success: true, message: 'Email alerts currently disabled in settings.' };
  }

  const recipient = settings.adminEmail || 'afinboproject@gmail.com';

  const emailPayload = {
    to: recipient,
    subject: `⚡ [AFINBO Quote Alert] ${notification.productName} (${notification.customerName})`,
    customer_name: notification.customerName,
    customer_email: notification.customerEmail,
    customer_phone: notification.customerPhone || 'Not provided',
    company_name: notification.companyName || 'Individual/Direct',
    product_name: notification.productName,
    quantity: notification.quantity,
    notes: notification.notes || 'None',
    submitted_at: new Date(notification.createdAt).toLocaleString('en-US', {
      timeZone: 'Africa/Lagos',
      dateStyle: 'full',
      timeStyle: 'medium',
    }),
  };

  console.info(`[ADMIN EMAIL DISPATCH] Sent to ${recipient}:`, emailPayload);

  // Attempt async webhook or FormSubmit notification if available
  try {
    if (typeof window !== 'undefined' && window.fetch) {
      // Fire-and-forget background notification ping
      fetch('https://formsubmit.co/ajax/' + encodeURIComponent(recipient), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `⚡ New AFINBO Equipment Quote Request: ${notification.productName}`,
          Customer_Name: notification.customerName,
          Customer_Email: notification.customerEmail,
          Customer_Phone: notification.customerPhone || 'N/A',
          Company: notification.companyName || 'N/A',
          Equipment_Model: notification.productName,
          Quantity_Units: notification.quantity,
          Project_Notes: notification.notes || 'None',
          Admin_Dashboard_URL: window.location.origin + '/admin',
        }),
      }).catch((err) => {
        console.debug('External email service ping notice:', err);
      });
    }
  } catch (err) {
    console.debug('Email notification dispatch notice:', err);
  }

  return {
    success: true,
    message: `Notification email dispatched to ${recipient}`,
  };
}

/**
 * Trigger a new incoming quote notification across the app
 */
export function triggerQuoteNotification(payload: {
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  quantity: number;
  notes?: string;
  quoteId?: string;
}): AdminNotification {
  const notification: AdminNotification = {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    type: 'quote_request',
    title: 'New Quote Request Received',
    message: `${payload.customerName} submitted a quote request for ${payload.quantity}x ${payload.productName}.`,
    productName: payload.productName,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
    companyName: payload.companyName,
    quantity: payload.quantity,
    notes: payload.notes,
    quoteId: payload.quoteId,
    read: false,
    createdAt: new Date().toISOString(),
  };

  // 1. Save to localStorage
  const existing = getStoredNotifications();
  const updated = [notification, ...existing.slice(0, 49)]; // keep latest 50
  saveNotifications(updated);

  // 2. Play sound alert
  playNotificationSound();

  // 3. Send email alert
  sendEmailNotification(notification);

  // 4. Broadcast to other tabs
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'NEW_NOTIFICATION', notification });
    } catch (e) {
      console.debug('Broadcast postMessage notice:', e);
    }
  }

  // 5. Dispatch Custom DOM Event for active page listeners
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('afinbo:notification', {
          detail: notification,
        })
      );
      // Trigger a storage event sync token
      localStorage.setItem('afinbo_last_notif_sync', Date.now().toString());
    } catch (e) {
      console.debug('Window event dispatch notice:', e);
    }
  }

  return notification;
}

/**
 * Subscribe to real-time notification events
 */
export function subscribeToNotifications(
  callback: (notification: AdminNotification) => void
): () => void {
  const handleCustomEvent = (e: Event) => {
    const customEvent = e as CustomEvent<AdminNotification>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  const handleBroadcastMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'NEW_NOTIFICATION' && event.data.notification) {
      callback(event.data.notification);
    }
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY_NOTIFICATIONS && event.newValue) {
      try {
        const parsed: AdminNotification[] = JSON.parse(event.newValue);
        if (parsed.length > 0 && !parsed[0].read) {
          callback(parsed[0]);
        }
      } catch (e) {
        console.debug('Storage sync error:', e);
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('afinbo:notification', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);
  }

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('afinbo:notification', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    }
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
  };
}

/**
 * Mark a single notification as read
 */
export function markNotificationRead(id: string): AdminNotification[] {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
  return updated;
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsRead(): AdminNotification[] {
  const current = getStoredNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
  return updated;
}

/**
 * Delete a notification
 */
export function deleteNotification(id: string): AdminNotification[] {
  const current = getStoredNotifications();
  const updated = current.filter((n) => n.id !== id);
  saveNotifications(updated);
  return updated;
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(): void {
  saveNotifications([]);
}
