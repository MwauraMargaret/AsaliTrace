import { useState } from 'react';
import { verify2FASetup } from '../services/auth.js';

export default function TwoFASetup({ qrCode, secret, onVerified, onCancel }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await verify2FASetup(token);
      onVerified();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Set Up Two-Factor Authentication</h2>
        
        <div className="text-center mb-4">
          <p className="mb-4">Scan this QR code with your authenticator app:</p>
          <img src={qrCode} alt="QR Code" className="mx-auto mb-4 w-48 h-48" />
          <p className="text-sm text-gray-600 mb-2">Or enter this secret manually:</p>
          <code className="bg-gray-100 p-2 rounded text-sm block break-all">
            {secret}
          </code>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              Enter 6-digit code from your app
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-center text-xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || token.length !== 6}
              className="flex-1 bg-amber-500 text-white py-2 px-4 rounded-md hover:bg-amber-600 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}