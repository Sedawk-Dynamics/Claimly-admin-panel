import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useTheme } from '../contexts/ThemeContext';
import logo from '../logo/claimly logo png.png';
import { Phone, MessageSquare, Mail, Lock, User, UserPlus, ArrowLeft } from 'lucide-react';

export default function AgentLogin() {
  const [step, setStep] = useState<'phone' | 'otp' | 'signup'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [idToken, setIdToken] = useState<string>('');
  const recaptchaVerifierRef = useRef<any>(null);
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  // Initialize reCAPTCHA lazily when needed (not on mount)
  const initializeRecaptcha = async (): Promise<any> => {
    // If verifier already exists and is valid, return it
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    try {
      // Wait for the container element to exist
      const container = document.getElementById('recaptcha-container');
      if (!container) {
        throw new Error('reCAPTCHA container not found. Please refresh the page.');
      }

      // Clear any existing verifier first
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          // Ignore errors when clearing
        }
      }

      // Dynamically import Firebase
      const { auth } = await import('../config/firebase');
      const { RecaptchaVerifier } = await import('firebase/auth');
      
      // Ensure container is visible
      container.style.display = 'block';
      container.style.minHeight = '78px'; // Minimum height for reCAPTCHA
      
      // Use 'normal' size instead of 'invisible' for better compatibility
      // 'normal' size is less strict with domain matching
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          // reCAPTCHA solved
          console.log('reCAPTCHA verified successfully');
        },
        'expired-callback': () => {
          // reCAPTCHA expired - will be recreated when needed
          console.log('reCAPTCHA expired');
          recaptchaVerifierRef.current = null;
        },
        'error-callback': (error: any) => {
          console.error('reCAPTCHA error:', error);
          recaptchaVerifierRef.current = null;
        },
      });
      
      recaptchaVerifierRef.current = verifier;
      return verifier;
    } catch (err: any) {
      console.error('Failed to initialize reCAPTCHA:', err);
      
      // Provide helpful error message
      let errorMessage = 'Failed to initialize verification. ';
      if (err.code === 'auth/captcha-check-failed' || err.message?.includes('Hostname match not found')) {
        errorMessage += 'Please ensure your domain is authorized in Firebase Console. ';
        errorMessage += 'Go to Firebase Console → Authentication → Settings → Authorized domains and add your domain.';
      } else {
        errorMessage += err.message || 'Please refresh the page and try again.';
      }
      
      throw new Error(errorMessage);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (e) {
          // Ignore errors when clearing
        }
      }
    };
  }, []);

  // Force light mode on login page
  useEffect(() => {
    setTheme('light');
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, [setTheme]);

  const handlePhoneSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Initialize reCAPTCHA verifier (lazy initialization)
      const verifier = await initializeRecaptcha();

      const { auth } = await import('../config/firebase');
      const { signInWithPhoneNumber } = await import('firebase/auth');
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      // Render reCAPTCHA if using normal size
      if (verifier && typeof verifier.render === 'function') {
        try {
          await verifier.render();
        } catch (renderError) {
          // If render fails, try to proceed anyway (might already be rendered)
          console.warn('reCAPTCHA render warning:', renderError);
        }
      }
      
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setVerificationId(confirmationResult.verificationId);
      setStep('otp');
    } catch (err: any) {
      console.error('Phone submission error:', err);
      // Clear verifier on error to allow retry
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          // Ignore
        }
        recaptchaVerifierRef.current = null;
      }
      
      // Provide user-friendly error message
      let errorMessage = err.message || 'Failed to send OTP. Please try again.';
      if (err.code === 'auth/captcha-check-failed' || errorMessage.includes('Hostname match not found')) {
        errorMessage = 'Domain authorization error. Please contact support or ensure your domain is authorized in Firebase Console.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { auth } = await import('../config/firebase');
      const { PhoneAuthProvider, signInWithCredential } = await import('firebase/auth');
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseIdToken = await userCredential.user.getIdToken();
      setIdToken(firebaseIdToken);
      
      // After OTP verification, go to signup step
      setStep('signup');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let firebaseIdToken = idToken;
      if (!firebaseIdToken) {
        const { auth } = await import('../config/firebase');
        const { PhoneAuthProvider, signInWithCredential } = await import('firebase/auth');
        const credential = PhoneAuthProvider.credential(verificationId, otp);
        const userCredential = await signInWithCredential(auth, credential);
        firebaseIdToken = await userCredential.user.getIdToken();
        setIdToken(firebaseIdToken);
      }

      const response = await authService.agentSignup(firebaseIdToken, name, email, phoneNumber, password);
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('admin', JSON.stringify(response.agent));
      // Show message that agent needs verification
      alert('Account created successfully! Please wait for admin verification before accessing the system.');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden w-full max-w-full overflow-x-hidden">
      {/* Left Side - Brand / Story */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-brand-50 via-cyan-50 to-blue-50 dark:from-navy-950 dark:via-navy-900 dark:to-navy-950 flex flex-col items-center justify-center px-6 sm:px-8 md:px-12 py-12 lg:py-16 relative overflow-hidden min-w-0 max-w-full">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-glow opacity-10 dark:opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-sunset opacity-10 dark:opacity-5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md text-center lg:text-left min-w-0 max-w-full">
          <div className="flex justify-center lg:justify-start mb-8 lg:mb-12">
            <div className="relative">
              <div className="relative p-4 bg-white dark:bg-navy-800 rounded-2xl shadow-card-3d">
                <img src={logo} alt="Claimly" className="h-16 sm:h-20 w-auto max-w-full" />
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-8 lg:mb-12 min-w-0 max-w-full">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight text-zoom-safe break-words">
              Agent Portal
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 leading-relaxed text-zoom-safe break-words">
              Access your agent account with secure phone verification.
            </p>
          </div>

          <div className="mt-8 lg:mt-12 pt-8 border-t border-cyan-400/20 dark:border-cyan-500/20 min-w-0 max-w-full">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-zoom-safe break-words">
              Secure agent authentication powered by Claimly platform.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-12 lg:py-16 bg-white dark:bg-gray-900 relative min-w-0 max-w-full overflow-x-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-navy-950 dark:to-navy-900"></div>

        <div className="w-full max-w-md relative z-10 min-w-0 max-w-full">
          <div className="card shadow-card-3d-hover p-8 sm:p-10 border border-gray-200 dark:border-navy-700 w-full min-w-0 max-w-full overflow-x-hidden">
            <div className="mb-8 min-w-0 max-w-full">
              <h2 className="text-2xl sm:text-3xl font-bold text-gradient-brand mb-2 text-zoom-safe break-words">
                {step === 'phone' && 'Enter Phone Number'}
                {step === 'otp' && 'Verify OTP'}
                {step === 'signup' && 'Create Agent Account'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-zoom-safe break-words">
                {step === 'phone' && 'We will send you an OTP to verify your phone number'}
                {step === 'otp' && 'Enter the OTP sent to your phone'}
                {step === 'signup' && 'Fill in your details to create an agent account'}
              </p>
            </div>

            <div id="recaptcha-container" style={{ display: 'block', minHeight: '78px', marginBottom: '1rem' }}></div>

            {error && (
              <div className="bg-orange-500/20 dark:bg-orange-900/20 border-2 border-orange-400 dark:border-orange-500 backdrop-blur-sm text-orange-900 dark:text-orange-300 px-4 py-3 rounded-lg text-sm shadow-glow-orange mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 dark:bg-orange-500 rounded-full animate-pulse"></div>
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            {step === 'phone' && (
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                    <input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required
                      maxLength={10}
                      autoComplete="tel"
                      className="input-elegant pl-12"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden bg-gradient-sunset text-white px-6 py-3 rounded-xl font-semibold text-base shadow-lg hover:shadow-glow-orange-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-w-0 max-w-full text-zoom-safe"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleOTPSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    OTP Code
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      className="input-elegant pl-12 text-center text-2xl tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="flex-1 group relative overflow-hidden bg-gradient-sunset text-white px-6 py-3 rounded-xl font-semibold text-base shadow-lg hover:shadow-glow-orange-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setVerificationId('');
                  }}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Change phone number
                </button>
              </form>
            )}

            {step === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      className="input-elegant pl-12"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="input-elegant pl-12"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="input-elegant pl-12"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('otp')}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-navy-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 group relative overflow-hidden bg-gradient-sunset text-white px-6 py-3 rounded-xl font-semibold text-base shadow-lg hover:shadow-glow-orange-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="relative flex items-center justify-center space-x-2.5">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          <span>Sign Up</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-navy-700">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Secure authentication powered by Claimly platform.
              </p>
              
              {/* Back Button */}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-4 w-full flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                back to email login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
