// swDev.js - Service Worker Registration
export default function swDev() {
  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    // Use a relative path that works in both local dev and production
    const swPath = './sw.js';
    
    // Wait for window load to avoid competing with important resources
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swPath)
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            console.log('New version installing...');
            
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New version installed but waiting to activate
                  console.log("New version available. Refreshing...");
                  
                    window.location.reload();
                } else {
                  console.log("Content cached for offline use.");
                }
              }
            });
          });
          
          // Check for updates every 60 minutes (optional)
          setInterval(() => {
            registration.update();
            console.log('Checking for service worker updates...');
          }, 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  } else {
    console.log('Service Workers not supported in this browser');
  }
}
