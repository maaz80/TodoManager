// This file now serves as a fallback for browsers that might not support the React component approach
// The main PWA installation logic is now in the InstallPrompt component

let deferredPrompt = null;

export function initializePWAInstall() {
  // This function is kept for compatibility with existing code
  // but most of the functionality is moved to the InstallPrompt component
  console.log('PWA installation service initialized');
  
  // Check if the app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true) {
    console.log('Application is already installed');
    return;
  }
  
  // The event listening now happens in the InstallPrompt component
}

export function installPWA() {
  // This is now primarily handled by the InstallPrompt component
  // This function is kept for backwards compatibility
  if (!deferredPrompt) {
    console.log('Installation prompt not available');
    return;
  }
  
  deferredPrompt.prompt();
  
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    deferredPrompt = null;
  });
}

// Export a function to set the deferred prompt from outside
// This allows the App component to pass the prompt to this service if needed
export function setDeferredPrompt(prompt) {
  deferredPrompt = prompt;
}