import React, { useEffect, useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabase-client";
import { ThemeContext } from "../App";
import { toast } from "react-toastify";

const Navbar = () => {
  const [session, setSession] = useState(null);
  const [userName, setUserName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use our contexts
  const { theme, toggleTheme } = useContext(ThemeContext);

  const getSession = async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    
    // Get username from localStorage when session is available
    if (data.session) {
      const storedName = localStorage.getItem('userName');
      if (storedName) {
        setUserName(storedName);
      } else {
        // Fetch from database if not in localStorage
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('user_id', data.session.user.id)
            .single();
            
          if (userData && userData.name) {
            setUserName(userData.name);
            localStorage.setItem('userName', userData.name);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserName("");
    setIsMenuOpen(false);
    navigate('/login')
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhone');
    toast.success("Logged out successfully!");
  };

  useEffect(() => {
    getSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      if (!session) {
        setUserName("");
      } else {
        // Try to get username from localStorage when session changes
        const storedName = localStorage.getItem('userName');
        if (storedName) {
          setUserName(storedName);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Determine if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white shadow-md'} transition-all duration-300`}>
      <div className="max-w-4xl mx-auto px-2 lg:px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-700' : 'bg-gradient-to-r from-blue-500 to-purple-600'} text-white font-bold text-base md:text-xl`}>
                TM
              </div>
              <span className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                TaskMaster
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
            {/* Links */}
            {/* <Link 
              to="/" 
              className={`font-medium transition-colors ${
                isActive('/') 
                  ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600') 
                  : (theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              Todo
            </Link> */}
            
            {session ? (
              <div className="flex items-center space-x-4">
                {/* User Name Display */}
                {/* {userName && (
                  <div className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                    Hi, {userName}
                  </div>
                )} */}
                
                <button 
                  onClick={handleLogout}
                  className={`font-medium px-4 py-2 rounded-full transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-white hover:bg-gray-700' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link  to={'/login'}
                onClick={''}
                className={`font-medium px-4 py-2 rounded-full transition-all ${
                  theme === 'dark' 
                    ? 'bg-blue-700 text-white hover:bg-blue-600' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg'
                }`}
              >
                Login
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden transition-all duration-300 ease-in">
            <button
              onClick={toggleTheme}
              className={`p-2 mr-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-800'}`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-white hover:bg-gray-800'
                  : 'text-gray-800 hover:bg-gray-100'
              }`}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={`md:hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* User Name Display for Mobile */}
            {/* {session && userName && (
              <div className={`px-3 py-2 font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                 {userName}
              </div>
            )} */}
            
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md font-medium ${
                isActive('/') 
                  ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-blue-100 text-blue-800') 
                  : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100')
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Todo
            </Link>
            
            {session ? (
              <button
                onClick={handleLogout}
                className={`w-full text-left block px-3 py-2 rounded-md font-medium ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Logout
              </button>
            ) : (
              <Link to={'/login'}
                onClick={() => {
                  setIsMenuOpen(false);
                }}
                className={`w-full text-left block px-3 py-2 rounded-md font-medium ${
                  theme === 'dark'
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;