export default function swDev() {
  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    // Wait until the page is fully loaded to avoid competition for network resources
    window.addEventListener('load', () => {
      // Use absolute path from origin to avoid scope issues
      const swPath = `${window.location.origin}/sw.js`;
      
      // Force update check by including a query parameter with timestamp
      const swUrl = `${swPath}?v=${new Date().getTime()}`;
      
      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          
          // Check for existing controller to determine if this is first load or a refresh
          if (navigator.serviceWorker.controller) {
            console.log('Service Worker is already controlling this page');
          }
          
          // Set up update detection
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            console.log('New version installing...');
            
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content is available, show notification
                  console.log("New version available.");
                  
                  // Create update notification with better visibility
                  showUpdateNotification();
                } else {
                  console.log("Content cached for offline use.");
                }
              }
            });
          });
          
          // Check for updates every 60 minutes (adjust as needed)
          setInterval(() => {
            console.log('Checking for service worker updates...');
            registration.update().catch(err => {
              console.error('Error checking for updates:', err);
            });
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

// Separate function for showing the notification
function showUpdateNotification() {
  // Remove any existing notification first
  const existingNotification = document.getElementById('sw-update-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // Create notification container
  const updateNotification = document.createElement('div');
  updateNotification.id = 'sw-update-notification';
  updateNotification.style.position = 'fixed';
  updateNotification.style.bottom = '20px';
  updateNotification.style.right = '20px';
  updateNotification.style.backgroundColor = '#4CAF50';
  updateNotification.style.color = 'white';
  updateNotification.style.padding = '16px';
  updateNotification.style.borderRadius = '4px';
  updateNotification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  updateNotification.style.zIndex = '9999';
  updateNotification.style.display = 'flex';
  updateNotification.style.alignItems = 'center';
  updateNotification.style.gap = '10px';
  
  // Add message and refresh button
  updateNotification.innerHTML = `
    <div>A new version is available!</div>
    <button id="refresh-app" style="background-color: white; color: #4CAF50; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">Refresh Now</button>
    <button id="dismiss-update" style="background-color: transparent; color: white; border: 1px solid white; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-left: 8px;">Later</button>
  `;
  
  document.body.appendChild(updateNotification);
  
  // Add event listeners
  document.getElementById('refresh-app').addEventListener('click', () => {
    window.location.reload();
  });
  
  document.getElementById('dismiss-update').addEventListener('click', () => {
    updateNotification.remove();
  });
  
  // Auto-dismiss after 5 minutes to avoid permanent notifications
  setTimeout(() => {
    if (document.getElementById('sw-update-notification')) {
      document.getElementById('sw-update-notification').remove();
    }
  }, 5 * 60 * 1000);
}