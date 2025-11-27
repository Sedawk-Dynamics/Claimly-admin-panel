import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useTheme } from '../contexts/ThemeContext';
import logo from '../logo/claimly logo png.png';
import { Mail, Lock, LogIn } from 'lucide-react';

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
      const response = await authService.login(email, password);
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('admin', JSON.stringify(response.admin));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-glow opacity-20 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-sunset opacity-20 rounded-full blur-3xl animate-pulse-glow-orange"></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-scale-in">
        {/* Glassmorphic Login Card */}
        <div className="glass backdrop-blur-xl rounded-2xl p-8 sm:p-10 border-2 border-orange-400/30 shadow-card-3d-hover">

          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="relative p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                  <img src={logo} alt="Claimly" className="h-14 sm:h-16 w-auto" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 animate-slide-in">
              Admin Portal
            </h1>
            <p className="text-base sm:text-lg text-gray-700 font-medium animate-slide-in">
              Sign in to manage your platform
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up">
            {error && (
              <div className="bg-orange-500/20 border-2 border-orange-400 backdrop-blur-sm text-orange-900 px-4 py-3 rounded-lg text-sm animate-slide-in shadow-glow-orange">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black w-5 h-5 z-10" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white/90 border-2 border-cyan-400/30 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 backdrop-blur-sm hover:border-cyan-400/50"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-black w-5 h-5 z-10" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white/90 border-2 border-cyan-400/30 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all duration-300 backdrop-blur-sm hover:border-cyan-400/50"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden bg-gradient-sunset text-white px-6 py-4 rounded-xl font-bold text-lg shadow-glow-orange-lg hover:shadow-glow-orange transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-fire opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Decorative Bottom Border */}
          <div className="mt-8 pt-6 border-t border-cyan-400/20">
            <p className="text-center text-sm text-gray-700">
              Powered by <span className="text-gradient-sunset font-bold">Claimly</span>
            </p>
          </div>
        </div>

        {/* Floating glow effect */}
        <div className="absolute -inset-4 bg-gradient-brand opacity-20 blur-3xl -z-10 animate-pulse-glow"></div>
      </div>
    </div>
  );
}
