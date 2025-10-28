import { useState } from 'react';
import { verify2FALogin } from '../services/auth.js';

export default function TwoFALogin({ userId, onVerified, onBack }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await verify2FALogin(userId, token);
      
      // Save token and user data
      localStorage.setItem("token", response.access);
      localStorage.setItem("user", JSON.stringify(response.user));
      
      onVerified();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div>
            <label htmlFor="token" className="sr-only">
              2FA Code
            </label>
            <input
              id="token"
              name="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 text-center text-xl tracking-widest focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10"
              placeholder="000000"
              maxLength={6}
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700 text-center">{error}</div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="group relative w-1/2 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Back to Login
            </button>
            <button
              type="submit"
              disabled={loading || token.length !== 6}
              className="group relative w-1/2 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Can't access your authenticator app?{' '}
            <button
              onClick={() => alert('Please contact support for 2FA recovery.')}
              className="font-medium text-amber-600 hover:text-amber-500"
            >
              Get help
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}