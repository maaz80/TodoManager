// Save this as pwaInstall.js and import it in your main application file

let deferredPrompt;
const installButton = document.getElementById('install-button'); // Make sure you have this button in your UI

// Hide the install button initially
if (installButton) {
  installButton.style.display = 'none';
}

export function initializePWAInstall() {
  // Check if the app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true) {
    console.log('Application is already installed');
    return;
  }

  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Update UI to notify the user they can install the PWA
    if (installButton) {
      installButton.style.display = 'block';
      
      // Show the install prompt when the button is clicked
      installButton.addEventListener('click', installPWA);
    }
  });

  // Track when the app gets installed
  window.addEventListener('appinstalled', (evt) => {
    console.log('Application was successfully installed!');
    // Hide the install button after installation
    if (installButton) {
      installButton.style.display = 'none';
    }
  });
}

export function installPWA() {
  if (!deferredPrompt) {
    console.log('Installation prompt not available');
    return;
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We no longer need the prompt. Clear it.
    deferredPrompt = null;
  });
}