export default function swDev() {
  // Check if service workers are supported
  if ('serviceWorker' in navigator) {
    // Use a relative path that works in both local dev and production
    const swPath = './sw.js';
    
    navigator.serviceWorker.register(swPath)
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  } else {
    console.log('Service Workers not supported in this browser');
  }
}