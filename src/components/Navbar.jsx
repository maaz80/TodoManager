import React, { useEffect, useState, useContext, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabase-client";
import { ThemeContext } from "../App";
import { toast } from "react-toastify";

const Navbar = () => {
  const [session, setSession] = useState(null);
  const [userName, setUserName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null)
  const [referringPoints, setReferringPoints] = useState(null)
  const { theme, toggleTheme } = useContext(ThemeContext);
  const shareMenuRef = useRef(null);

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
            .select('name , points')
            .eq('user_id', data.session.user.id)
            .single();

          if (userData && userData.name) {
            console.log("userPoints", userData.points);

            setUserName(userData.name);
            localStorage.setItem('userName', userData.name);
          }
          if (userData && userData.points) {
            console.log("userPoints", userData.points);
            setReferringPoints(userData.points)
            localStorage.setItem('userPoints', userData.points);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id);
      }
    }
    getUser();
  }, []);

  // Close share menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setIsShareMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  // Generate the sharing link
  const getSharingLink = () => {
    return `${window.location.origin}/login/?ref=${userId}`;
  };

  // Handle different social media sharing options
  const handleShare = (platform) => {
    const link = getSharingLink();
    const text = "Join TaskMaster and get organized with me!";

    switch (platform) {
      case 'clipboard':
        navigator.clipboard.writeText(link);
        toast.success("Link copied to clipboard!");
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, '_blank');
        break;
      default:
        break;
    }

    setIsShareMenuOpen(false);
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
        const storedPoints = localStorage.getItem('userPoints');
        if (storedPoints) {
          setReferringPoints(storedPoints);
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

            {session && (
              <>
                {referringPoints && (
                  <div className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                    Points: {referringPoints}
                  </div>
                )}

                {/* Share button with dropdown */}
                <div className="relative" ref={shareMenuRef}>
                  <button
                    onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                    className={`font-medium px-4 py-2 rounded-full transition-all flex items-center ${theme === 'dark'
                        ? 'bg-gray-800 text-white hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                  >
                    <span>Share</span>
                  </button>

                  {/* Share dropdown menu */}
                  {isShareMenuOpen && (
                    <div className="fixed inset-0 backdrop-blur-md bg-opacity-40 z-40">
                      <div
                      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw] rounded-xl shadow-2xl p-6 z-50 flex flex-col items-center ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                        }`}
                      style={{ minWidth: '260px' }}
                      ref={shareMenuRef}
                    >
                      <div className="w-full flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Share TaskMaster</h3>
                        <button
                          onClick={() => setIsShareMenuOpen(false)}
                          className="text-2xl font-bold hover:text-red-500"
                          aria-label="Close"
                        >
                          &times;
                        </button>
                      </div>
                      <div className="w-full flex flex-col gap-3">
                        <button
                          onClick={() => handleShare('clipboard')}
                          className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg transition ${theme !== 'dark' ?'hover:bg-gray-100' : ' hover:bg-gray-800'}`}
                        >
                          {/* Clipboard SVG */}
                          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                            <rect x="9" y="2" width="6" height="4" rx="1" fill="currentColor" className="text-blue-100" />
                            <rect x="5" y="6" width="14" height="16" rx="2" stroke="currentColor" />
                          </svg>
                          <span>Copy Link</span>
                        </button>
                        <button
                          onClick={() => handleShare('whatsapp')}
                          className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg transition ${theme !== 'dark' ?'hover:bg-gray-100' : ' hover:bg-gray-800'}`}
                        >
                          {/* WhatsApp SVG */}
                          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <circle cx="16" cy="16" r="16" fill="#25D366" />
                            <path d="M23.5 20.5c-.3-.2-1.8-.9-2.1-1-0.3-.1-.5-.2-.7.2s-.8 1-1 1.2c-.2.2-.4.2-.7.1-2-.8-3.3-2.8-3.5-3.2-.2-.3 0-.5.1-.7.1-.1.2-.3.3-.4.1-.1.1-.2.2-.3.1-.1.1-.2.2-.3.1-.2.1-.3 0-.5s-.7-1.7-1-2.3c-.2-.5-.4-.4-.7-.4h-.6c-.2 0-.5.1-.7.3-.2.2-.8.8-.8 2 0 1.2.8 2.4 1.1 2.8 1.2 1.8 2.8 3.1 4.7 3.7.6.2 1.1.2 1.5.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2z" fill="#fff" />
                          </svg>
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleShare('twitter')}
                          className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg transition ${theme !== 'dark' ?'hover:bg-gray-100' : ' hover:bg-gray-800'}`}
                        >
                          {/* Twitter SVG */}
                          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                            <circle cx="16" cy="16" r="16" fill="#1DA1F2" />
                            <path d="M24 12.1c-.5.2-1 .4-1.6.5.6-.4 1-1 1.2-1.7-.6.4-1.2.7-1.9.9-.6-.6-1.4-1-2.3-1-1.7 0-3 1.6-2.6 3.2-2.3-.1-4.4-1.2-5.8-3-.2.4-.3.8-.3 1.2 0 1.1.6 2 1.5 2.5-.5 0-.9-.1-1.3-.3v.1c0 1.5 1.1 2.7 2.5 3-.3.1-.7.2-1 .2-.2 0-.5 0-.7-.1.5 1.3 1.8 2.2 3.3 2.2-1.2.9-2.7 1.5-4.3 1.5-.3 0-.6 0-.9-.1 1.5 1 3.3 1.6 5.2 1.6 6.2 0 9.6-5.1 9.6-9.6v-.4c.7-.5 1.2-1 1.6-1.6z" fill="#fff" />
                          </svg>
                          <span>Twitter</span>
                        </button>
                      </div>
                    </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {session ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLogout}
                  className={`font-medium px-4 py-2 rounded-full transition-all ${theme === 'dark'
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to={'/login'}
                onClick={''}
                className={`font-medium px-4 py-2 rounded-full transition-all ${theme === 'dark'
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
              className={`p-2 rounded-lg transition-colors ${theme === 'dark'
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
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md font-medium ${isActive('/')
                ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-blue-100 text-blue-800')
                : (theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100')
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Todo
            </Link>

            {/* Mobile Share Options */}
            {session && (
              <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                <button
                  onClick={() => handleShare('clipboard')}
                  className={`p-2 rounded-md text-center ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  <div className="text-xl mb-1">📋</div>
                  <div className="text-xs">Copy</div>
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className={`p-2 rounded-md text-center ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  <div className="text-xl mb-1">💬</div>
                  <div className="text-xs">WhatsApp</div>
                </button>

                <button
                  onClick={() => handleShare('twitter')}
                  className={`p-2 rounded-md text-center ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  <div className="text-xl mb-1">🐦</div>
                  <div className="text-xs">Twitter</div>
                </button>

              </div>
            )}

            {session ? (
              <button
                onClick={handleLogout}
                className={`w-full text-left block px-3 py-2 rounded-md font-medium ${theme === 'dark'
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
                className={`w-full text-left block px-3 py-2 rounded-md font-medium ${theme === 'dark'
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