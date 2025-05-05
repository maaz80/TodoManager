export default function swDev() {
  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    // Use a relative path that works in both local dev and production
    const swPath = './sw.js';
    
    navigator.serviceWorker.register(swPath)
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration);
       // Check for updates
       registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        console.log('New version installing...');
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available, show notification instead of auto-refresh
              console.log("New version available.");
              
              // Create and show update notification
              // const updateNotification = document.createElement('div');
              // updateNotification.style.position = 'fixed';
              // updateNotification.style.bottom = '20px';
              // updateNotification.style.right = '20px';
              // updateNotification.style.backgroundColor = '#4CAF50';
              // updateNotification.style.color = 'white';
              // updateNotification.style.padding = '16px';
              // updateNotification.style.borderRadius = '4px';
              // updateNotification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
              // updateNotification.style.zIndex = '9999';
              // updateNotification.innerHTML = 'New update available. <button id="refresh-app">Refresh</button>';
              
              // document.body.appendChild(updateNotification);
              
              // // Add event listener to refresh button
              // document.getElementById('refresh-app').addEventListener('click', () => {
                window.location.reload();
              // });
            } else {
              console.log("Content cached for offline use.");
            }
          }
        };
      };
    })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  } else {
    console.log('Service Workers not supported in this browser');
  }
}
