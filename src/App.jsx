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
  toggleTheme: () => {}
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
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <div className={`poppins-regular min-h-[600px] ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
          <Navbar />
          <Routes>
            <Route path="/" element={<Todo />} />
            <Route path="/login" element={<TodoLogin  />} />
          </Routes>
    
          {/* Global Toast Container */}
          <ToastContainer position="bottom-right" theme={theme === 'dark' ? 'dark' : 'light'} />
        </div>
    </ThemeContext.Provider>
  )
}

export default App