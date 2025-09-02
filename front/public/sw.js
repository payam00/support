// v1.1 - Force update to fix notification URL issue

self.addEventListener('push', event => {
  try {
    const data = event.data.json();
    console.log('Push received with data:', data); // For debugging
    const options = {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: {
        url: data.url // Ensure the URL from payload is stored here
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (e) {
    console.error('Error processing push event:', e);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
  console.log('Notification clicked, opening URL:', urlToOpen); // For debugging

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(urlToOpen); // Navigate the existing window
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});