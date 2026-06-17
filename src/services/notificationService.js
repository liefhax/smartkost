// Minta izin browser notification
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Browser tidak support notification');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Tampilkan browser notification
export function showBrowserNotification(title, body, icon = '/favicon.ico') {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge: '/favicon.ico',
        tag: 'smartkost-notification',
        vibrate: [200, 100, 200],
      });

      // Auto close after 5 detik
      setTimeout(() => notification.close(), 5000);

      // Klik notification buka web
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.error('Error showing notification:', err);
    }
  }
}

// Cek status permission
export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}