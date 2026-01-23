import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useTheme } from '../contexts/ThemeContext';
import logo from '../logo/claimly logo png.png';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  // Force light mode on login page
  useEffect(() => {
    setTheme('light');
    // Force light mode on document root as well
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, [setTheme]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First try admin login
      const adminResponse = await authService.login(email, password);
      localStorage.setItem('adminToken', adminResponse.token);
      localStorage.setItem('admin', JSON.stringify(adminResponse.admin));
      navigate('/');
      return;
    } catch (adminErr: any) {
      // If admin login fails, try agent login with email/password (no OTP)
      try {
        const agentResponse = await authService.agentLogin('', email, password);
        localStorage.setItem('adminToken', agentResponse.token);
        localStorage.setItem('admin', JSON.stringify(agentResponse.admin));
        navigate('/agent');
        return;
      } catch (agentErr: any) {
        const message =
          agentErr?.response?.data?.error ||
          adminErr?.response?.data?.error ||
          'Login failed. Please check your credentials.';
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* Left Side - Brand / Story */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-brand-50 via-cyan-50 to-blue-50 dark:from-navy-950 dark:via-navy-900 dark:to-navy-950 flex flex-col items-center justify-center px-6 sm:px-8 md:px-12 py-12 lg:py-16 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-glow opacity-10 dark:opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-sunset opacity-10 dark:opacity-5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-md text-center lg:text-left">
          {/* Logo */}
          <div className="flex justify-center lg:justify-start mb-8 lg:mb-12">
            <div className="relative">
              <div className="relative p-4 bg-white dark:bg-navy-800 rounded-2xl shadow-card-3d">
                <img src={logo} alt="Claimly" className="h-16 sm:h-20 w-auto" />
              </div>
            </div>
          </div>

          {/* Tagline / Value Proposition */}
          <div className="space-y-6 mb-8 lg:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              India's First AI-Driven Insurance Claim Platform
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
              Helping families claim their rightful insurance, stress-free & fast.
            </p>
          </div>

          {/* Additional Information */}
          <div className="mt-8 lg:mt-12 pt-8 border-t border-cyan-400/20 dark:border-cyan-500/20">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Experience seamless insurance management with cutting-edge AI technology.
            </p>
          </div>

        </div>
      </div>

      {/* Right Side - Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-12 lg:py-16 bg-white dark:bg-gray-900 relative">
        {/* Background subtle pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-navy-950 dark:to-navy-900"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Login Card */}
          <div className="card shadow-card-3d-hover p-8 sm:p-10 border border-gray-200 dark:border-navy-700">
            {/* Login Header */}
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gradient-brand mb-2">Welcome Back</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in with your email and password
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-orange-500/20 dark:bg-orange-900/20 border-2 border-orange-400 dark:border-orange-500 backdrop-blur-sm text-orange-900 dark:text-orange-300 px-4 py-3 rounded-lg text-sm shadow-glow-orange">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-400 dark:bg-orange-500 rounded-full animate-pulse"></div>
                    <p className="font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Email Field */}
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
                    className="input-elegant pl-12"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
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
                    className="input-elegant pl-12"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden bg-gradient-sunset text-white px-6 py-3 rounded-xl font-semibold text-base shadow-lg hover:shadow-glow-orange-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-fire opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-disabled:opacity-0"></div>
                <div className="relative flex items-center justify-center space-x-2.5">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-300" />
                      <span>Login</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Security Note + Agent Signup Link */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-navy-700 space-y-3">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Secure login powered by AI-driven Claimly platform.
              </p>
              <div className="flex flex-col items-center space-y-2">
                {/* <p className="text-xs text-gray-600 dark:text-gray-400">
                  Agent? You can sign up with OTP.
                </p> */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => navigate('/agent/signup')}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-brand-600 dark:text-cyan-300 bg-brand-50 dark:bg-cyan-500/10 hover:bg-brand-100 dark:hover:bg-cyan-500/20 border border-brand-200/70 dark:border-cyan-500/40 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Signup with OTP
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
