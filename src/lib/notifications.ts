export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
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
};

let lastNotificationTime = 0;

export const scheduleLocalNotification = (title: string, body: string, url: string = '/') => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Throttle notifications: pas plus d'une toutes les 4 heures
  const now = Date.now();
  if (now - lastNotificationTime < 4 * 60 * 60 * 1000) {
    return;
  }

  try {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body,
        icon: '/vite.svg', // Assurez-vous d'avoir une icône valide
        vibrate: [100, 50, 100],
        data: { url }
      } as any);
      lastNotificationTime = now;
    });
  } catch (err) {
    // Fallback if Service Worker fails
    const notif = new Notification(title, { body, icon: '/vite.svg' });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    lastNotificationTime = now;
  }
};
