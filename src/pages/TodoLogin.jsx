import React, { useContext, useState } from "react";
import { supabase } from "../supabase-client";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { ThemeContext } from "../App";

function TodoLogin() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [session, setSession] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  // OTP sending
  const sendOtp = async () => {

    if (!phone) {
      toast.error("Please enter a phone number!");
      return;
    }

    try {
      // For signup, also check name field
      if (!isLogin && !name) {
        toast.error("Please enter your name!");
        return;
      }

      // Try to check if user exists in the users table
      try {
        // For signup, first check if user exists
        if (!isLogin) {
          const { data, error } = await supabase
            .from('users')
            .select('phone')
            .eq('phone', phone)
            .single();
          
          if (!error && data) {
            toast.info("Number already registered! Please login instead.");
            setIsLogin(true);
            return;
          }
        }
        
        // For login, check if user exists
        if (isLogin) {
          const { data, error } = await supabase
            .from('users')
            .select('phone')
            .eq('phone', phone)
            .single();
          
          if (error || !data) {
            toast.info("Number not registered! Please sign up instead.");
            setIsLogin(false);
            return;
          }
        }
      } catch (checkError) {
        console.log("Error checking user existence. Continuing with OTP flow.", checkError);
      }

      // Send OTP
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (error) {
        console.error("Error sending OTP: ", error);
        toast.error("Error sending OTP!");
      } else {
        toast.success("OTP sent successfully!");
        setOtpSent(true);
      }
    } catch (error) {
      console.error("Error checking user: ", error);
      toast.error("Something went wrong!");
    }
  };

  // OTP verify
  const verifyOtp = async () => {
    if (!otp) {
      toast.error("Please enter the OTP!");
      return;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: "sms",
      });

      if (error) {
        console.error("Error verifying OTP: ", error);
        toast.error("Invalid OTP! Please try again.");
      } else {
        console.log("Authentication successful:", data);
        
        // If signup, create or update user in users table
        if (!isLogin) {
          // First check if user already exists in our custom table
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
            
          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
            console.error("Error checking existing user: ", fetchError);
            toast.error("Error creating account!");
            return;
          }
          
          // If user exists, update their name
          if (existingUser) {
            const { error: updateError } = await supabase
              .from('users')
              .update({ name: name })
              .eq('user_id', data.user.id);
              
            if (updateError) {
              console.error("Error updating user: ", updateError);
              toast.error("Error updating account!");
              return;
            }
          } else {
            // Otherwise create new user
            const { error: insertError } = await supabase
              .from('users')
              .insert([{ 
                phone: phone, 
                name: name,
                user_id: data.user.id
              }]);
              
            if (insertError) {
              console.error("Error creating user: ", insertError);
              toast.error("Error creating account! Please make sure you have set up the users table in Supabase.");
              return;
            }
          }
          
          // Store user info in localStorage
          localStorage.setItem('userName', name);
          localStorage.setItem('userPhone', phone);
        }

        // Fetch user name if login
        if (isLogin) {
          const { data: userData, error: userFetchError } = await supabase
            .from('users')
            .select('name')
            .eq('phone', phone)
            .single();
            
          if (userFetchError) {
            console.error("Error fetching user data: ", userFetchError);
            // Continue anyway since authentication succeeded
          }
            
          if (userData) {
            // Store user info in localStorage or context
            localStorage.setItem('userName', userData.name);
            localStorage.setItem('userPhone', phone);
          }
        }

        toast.success(isLogin ? "Login successful!" : "Signup successful!");
        setSession(data.session);
        navigate("/");
   } } catch (error) {
      console.error("Authentication error: ", error);
      toast.error("Authentication failed!");
    }
  };

  // Reset form state
  const resetForm = () => {
    setOtpSent(false);
    setOtp("");
  };

  // Toggle between login and signup
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="flex items-center justify-center h-[540px] p-2 md:p-4">
      <ToastContainer />
      <div className={`w-full max-w-md rounded-2xl shadow-xl px-3 py-4 md:p-8 space-y-3 md:space-y-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'} text-center mt-2`}>
          {isLogin ? "Login to TaskMaster" : "SignUp in TaskMaster"}
        </h2>
        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} text-sm md:text-base text-center`}>
          {isLogin ? "Login with your phone number" : "Create a new account"}
        </p>

        <div className="space-y-4">
          {/* Toggle buttons for Login/Signup */}
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => {
                setIsLogin(true);
                resetForm();
              }}
              className={`w-1/2 py-2 font-medium transition-all ${
                isLogin
                  ? theme === 'dark'
                    ? 'bg-blue-700 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                resetForm();
              }}
              className={`w-1/2 py-2 font-medium transition-all ${
                !isLogin
                  ? theme === 'dark'
                    ? 'bg-blue-700 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Phone number input */}
          <input
            type="tel"
            placeholder="+91XXXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none ${
              theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'
            }`}
            disabled={otpSent}
          />

          {/* Name input (only for signup) */}
          {!isLogin && (
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none ${
                theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'
              }`}
              disabled={otpSent}
            />
          )}

          {/* Conditional rendering based on OTP sent status */}
          {!otpSent ? (
            <button
              onClick={sendOtp}
              className={`w-full duration-300 font-semibold py-3 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'bg-blue-700 text-white hover:bg-blue-600'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg'
              }`}
            >
              Send OTP
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-600 outline-none ${
                  theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700'
                }`}
              />

              <button
                onClick={verifyOtp}
                className={`w-full duration-300 font-semibold py-3 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'bg-blue-700 text-white hover:bg-blue-600'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg'
                }`}
              >
                {isLogin ? "Login" : "Sign Up"}
              </button>

              <button
                onClick={resetForm}
                className={`w-full py-2 rounded-lg font-medium ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Change Number
              </button>
            </>
          )}
        </div>

        {/* Toggle auth mode text */}
        <p className={`text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={toggleAuthMode}
            className={`font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default TodoLogin;