import { useState, createContext, useEffect } from 'react'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import Todo from './pages/Todo'
import Navbar from './components/Navbar'
import TodoLogin from './pages/TodoLogin'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Create theme context and login modal context
export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => { }
});

const App = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  // Apply theme to body when it changes
  useEffect(() => {
    document.body.className = theme === 'dark'
      ? 'bg-gray-900 text-white'
      : 'bg-gradient-to-br from-blue-50 to-purple-50';
  }, [theme]);

  useEffect(() => {
    let deferredPrompt;
    const installButton = document.getElementById('install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      if (installButton) {
        installButton.style.display = 'block';

        installButton.addEventListener('click', () => {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the install prompt');
            } else {
              console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
          });
        });
      }
    });
  }, []);



  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`poppins-regular min-h-[600px] ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Todo />} />
          <Route path="/login" element={<TodoLogin />} />
        </Routes>
        <button id="install-btn" style={{ display: 'none', padding: '10px', background: '#1976d2', color: '#fff', borderRadius: '8px' }}>
          Install App
        </button>
        {/* Global Toast Container */}
        <ToastContainer position="bottom-right" theme={theme === 'dark' ? 'dark' : 'light'} />
      </div>
    </ThemeContext.Provider>
  )
}

export default App