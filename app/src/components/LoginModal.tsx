import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

type Props = {
  show: boolean;
  onClose: () => void;
}

/**
 * LoginModal component displays a modal for user login or password reset.
 * It includes fields for email and password, a toggle for showing/hiding the password,
 * and buttons for submitting the login or requesting a password reset.
 *
 * @param props - The props for the LoginModal component
 * @returns The rendered LoginModal component or null if not shown
 */
const LoginModal: React.FC<Props> = (props) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginMode, setLoginMode] = useState<string>('login');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');

  return props.show
    ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {loginMode === 'login' ? 'Login' : 'Reset Password'}
            </h2>
            <button
              onClick={() => props.onClose()}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {loginMode === 'login' ? (
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={userEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={userPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                onClick={() => { }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => setLoginMode('reset')}
                className="w-full text-blue-600 hover:text-blue-700 py-2 text-sm"
              >
                Forgot your password?
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => console.log('change me')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Send Reset Link
              </button>
              <button
                onClick={() => setLoginMode('login')}
                className="w-full text-blue-600 hover:text-blue-700 py-2 text-sm"
              >
                Back to login
              </button>
            </div>
          )}
        </div>
      </div>
    ) : null;
};

export default LoginModal;
