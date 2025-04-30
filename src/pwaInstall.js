let deferredPrompt = null;

export function initializePWAInstall() {
  console.log('PWA installation service initialized');
  
  // Check if the app is already installed
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true) {
    console.log('Application is already installed');
    return;
  }
}

export function installPWA() {
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

export function setDeferredPrompt(prompt) {
  deferredPrompt = prompt;
}