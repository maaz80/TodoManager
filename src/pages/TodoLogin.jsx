import React, { useContext, useState, useEffect } from "react";
import { supabase } from "../supabase-client";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { ThemeContext } from "../App";
import { useForm } from "react-hook-form";
import OTPInput from "react-otp-input";

function TodoLogin() {
  const [otpSent, setOtpSent] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91"); // Default to India

  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      phoneNumber: "",
      name: "",
      otp: "",
    }
  });

  // Watch values from form
  const phoneNumber = watch("phoneNumber");
  const name = watch("name");
  const otp = watch("otp");

  // Country codes list
  const countryCodes = [
    { code: "+1", country: "US/Canada" },
    { code: "+44", country: "UK" },
    { code: "+91", country: "India" },
    { code: "+61", country: "Australia" },
    { code: "+49", country: "Germany" },
    { code: "+33", country: "France" },
    { code: "+86", country: "China" },
    { code: "+81", country: "Japan" },
    { code: "+7", country: "Russia" },
    { code: "+55", country: "Brazil" },
    { code: "+27", country: "South Africa" },
    { code: "+971", country: "UAE" },
    { code: "+65", country: "Singapore" },
    { code: "+82", country: "South Korea" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCountryDropdown && !event.target.closest('.country-dropdown-container')) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountryDropdown]);

  // Get full phone with country code
  const getFullPhone = () => {
    return selectedCountryCode + phoneNumber;
  };

  // OTP sending
  const onSubmitOtp = async (formData) => {
    if (!formData.phoneNumber) {
      toast.error("Please enter a phone number!");
      return;
    }

    const fullPhone = selectedCountryCode + formData.phoneNumber;

    try {
      // For signup, also check name field
      if (!isLogin && !formData.name) {
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
            .eq('phone', fullPhone)
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
            .eq('phone', fullPhone)
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
        phone: fullPhone,
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

// Otp auto detection with retries
const attemptOtpAutofill = async (retries = 3, delay = 5000) => {
  if (!('OTPCredential' in window)) {
    console.warn('OTP Credential API not supported in this browser.');
    return;
  }
  
  let currentRetry = 0;
  
  const tryDetectOtp = async () => {
    try {
      console.log(`Starting OTP detection attempt ${currentRetry + 1}...`);
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), 30000); // 30 second timeout per attempt
      
      const content = await navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: abortController.signal
      });
      
      clearTimeout(timeout);
      
      if (content && content.code) {
        console.log("OTP detected:", content.code);
        toast.success("OTP detected successfully!");
        setValue('otp', content.code);
        return true; // Success
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        alert('OTP Autofill Error:', error)
        console.error('OTP Autofill Error:', error);
      } else {
        toast.error("OTP detection timed out!");
        console.log('OTP detection timed out for this attempt');
      }
    }
    
    currentRetry++;
    if (currentRetry < retries) {
      console.log(`Retrying OTP detection in ${delay/1000} seconds...`);
      setTimeout(tryDetectOtp, delay);
    } else {
      console.log('Maximum OTP detection attempts reached');
    }
  };
  
  tryDetectOtp();
};

// And update your useEffect
useEffect(() => {
  if (otpSent) {
    console.log("OTP sent, attempting autofill");
    // Start immediately but use retries
    attemptOtpAutofill(3, 10000); // 3 retries, 10 seconds apart
  }
}, [otpSent]);

  // OTP verify
  const verifyOtp = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP!");
      return;
    }

    const fullPhone = getFullPhone();

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
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
                phone: fullPhone,
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
          localStorage.setItem('userPhone', fullPhone);
        }

        // Fetch user name if login
        if (isLogin) {
          const { data: userData, error: userFetchError } = await supabase
            .from('users')
            .select('name')
            .eq('phone', fullPhone)
            .single();

          if (userFetchError) {
            console.error("Error fetching user data: ", userFetchError);
            // Continue anyway since authentication succeeded
          }

          if (userData) {
            // Store user info in localStorage or context
            localStorage.setItem('userName', userData.name);
            localStorage.setItem('userPhone', fullPhone);
          }
        }

        toast.success(isLogin ? "Login successful!" : "Signup successful!");
        navigate("/");
      }
    } catch (error) {
      console.error("Authentication error: ", error);
      toast.error("Authentication failed!");
    }
  };

  // Reset form state
  const resetForm = () => {
    setOtpSent(false);
    reset({
      phoneNumber: "",
      name: "",
      otp: ""
    });
  };

  // Toggle between login and signup
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className={`flex items-center justify-center h-[576px] md:h-[665px] p-2 md:p-4 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-blue-600' : 'bg-gradient-to-r from-blue-100 to-purple-200'}`} >
      <ToastContainer />
      <div className={`w-full max-w-md rounded-2xl shadow-xl px-3 py-4 md:p-8 space-y-3 md:space-y-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'} text-center mt-2`}>
          {isLogin ? "Login to TaskMaster" : "SignUp in TaskMaster"}
        </h2>
        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} text-sm md:text-base text-center`}>
          {isLogin ? "Login with your phone number" : "Create a new account"}
        </p>

        {/* Toggle buttons for Login/Signup */}
        <div className="flex rounded-lg overflow-hidden border border-gray-300">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              resetForm();
            }}
            className={`w-1/2 py-2 font-medium transition-all ${isLogin
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
            type="button"
            onClick={() => {
              setIsLogin(false);
              resetForm();
            }}
            className={`w-1/2 py-2 font-medium transition-all ${!isLogin
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

        {!otpSent ? (
          <form className="space-y-4" onSubmit={handleSubmit(onSubmitOtp)}>
            {/* Phone number input with country code dropdown */}
            <div className="flex">
              <div className="relative country-dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className={`flex items-center justify-center p-3 rounded-l-lg border border-gray-300 ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}
                >
                  <span className="font-medium">{selectedCountryCode}</span>
                  <svg
                    className={`w-4 h-4 ml-1 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Country code dropdown */}
                {showCountryDropdown && (
                  <div
                    className={`absolute z-10 w-48 mt-1 overflow-auto ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'
                      } rounded-md shadow-lg max-h-60 border border-gray-300`}
                  >
                    <ul className="py-1">
                      {countryCodes.map((country) => (
                        <li key={country.code}>
                          <button
                            type="button"
                            className={`w-full text-left px-4 py-2 hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                              } ${selectedCountryCode === country.code ?
                                theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100' : ''}`}
                            onClick={() => {
                              setSelectedCountryCode(country.code);
                              setShowCountryDropdown(false);
                            }}
                          >
                            <span className="font-medium">{country.code}</span> {country.country}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <input
                type="tel"
                placeholder="Phone Number"
                {...register("phoneNumber", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Invalid phone number format",
                  },
                  validate: (value) => value.trim() !== "" || "Phone number cannot be empty or spaces only",
                })}
                className={`w-full border border-gray-300 rounded-r-lg p-3 outline-none ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-white text-gray-700"
                  }`}
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm -mt-3">{errors.phoneNumber.message}</p>
            )}

            {/* Name input (only for signup) */}
            {!isLogin && (
              <>
                <input
                  type="text"
                  placeholder="Enter your name"
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters",
                    },
                    pattern: {
                      value: /^[A-Za-z\s]+$/,
                      message: "Name can only contain letters and spaces",
                    },
                    validate: (value) => value.trim() !== "" || "Name cannot be empty or spaces only",
                  })}
                  className={`w-full border border-gray-300 rounded-lg p-3 outline-none ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-white text-gray-700"
                    }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm -mt-3">{errors.name.message}</p>
                )}
              </>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className={`w-full duration-300 font-semibold py-3 rounded-lg transition-all ${!isValid
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : theme === "dark"
                  ? "bg-blue-700 text-white hover:bg-blue-600"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg"
                }`}
              disabled={!isValid}
            >
              Send OTP
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={verifyOtp} id="otp-form">
            {/* OTP input */}
            <OTPInput
              value={otp}
              onChange={(value) => setValue('otp', value)}
              numInputs={6}
              renderSeparator={<span className="mx-1"></span>}
              renderInput={(props) => (
                <input
                  {...props}
                  className={` text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-white text-gray-700"
                    }` }
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  style={{width:'30px', height:'50px'}}
                />
              )}
              containerStyle="flex justify-center gap-2"
            />
            {errors.otp && (
              <p className="text-red-500 text-sm -mt-3">{errors.otp.message}</p>
            )}

            {/* Submit and Reset buttons */}
            <button
              type="submit"
              className={`w-full duration-300 font-semibold py-3 rounded-lg transition-all ${!otp
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : theme === "dark"
                  ? "bg-blue-700 text-white hover:bg-blue-600"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg"
                }`}
              disabled={!otp}
            >
              {isLogin ? "Login" : "Sign Up"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className={`w-full py-2 rounded-lg font-medium ${theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              Change Number
            </button>
          </form>
        )}

        {/* Toggle auth mode text */}
        <p className={`text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
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