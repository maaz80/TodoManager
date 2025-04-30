import { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../App'; // Adjust the import path as needed

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const { theme } = useContext(ThemeContext);
  
  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Store the event for later use
      setDeferredPrompt(e);
      
      // Show our custom install prompt
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Track when the app gets installed
    const handleAppInstalled = () => {
      console.log('Application was successfully installed!');
      setShowPrompt(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = () => {
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
      
      // We no longer need the prompt. Clear it and hide our UI
      setDeferredPrompt(null);
      setShowPrompt(false);
    });
  };

  const handleCancel = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-2xl bg-opacity-50">
      <div className={`rounded-lg p-6 shadow-xl max-w-md w-full mx-4 ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}>
        <div className="flex items-center mb-4">
          <div className="mr-3 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Install App</h2>
        </div>
        
        <p className="mb-6">Install this application on your device to use it offline and get a better experience.</p>
        
        <div className="flex justify-end space-x-3">
          <button 
            onClick={handleCancel}
            className={`px-4 py-2 rounded ${
              theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Not Now
          </button>
          <button 
            onClick={handleInstall}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;