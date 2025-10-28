import { useState, useEffect } from 'react';
import { setup2FA, disable2FA } from '../services/auth.js';
import TwoFASetup from './TwoFASetup.jsx';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFAData, setTwoFAData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const data = await setup2FA();
      setTwoFAData(data);
      setShow2FASetup(true);
    } catch (error) {
      console.error('Failed to setup 2FA:', error);
      alert('Failed to setup 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA?')) return;
    
    setLoading(true);
    try {
      await disable2FA();
      alert('2FA has been disabled.');
      // Refresh user data or update state
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      alert('Failed to disable 2FA.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerified = () => {
    setShow2FASetup(false);
    setTwoFAData(null);
    alert('2FA has been successfully enabled!');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-2">
          <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Username:</strong> {user.username}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
        
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">Two-Factor Authentication</h3>
            <p className="text-gray-600 text-sm">
              Add an extra layer of security to your account
            </p>
          </div>
          
          <div className="space-x-2">
            <button
              onClick={handleEnable2FA}
              disabled={loading}
              className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Enable 2FA'}
            </button>
            
            <button
              onClick={handleDisable2FA}
              disabled={loading}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Disable 2FA
            </button>
          </div>
        </div>
      </div>

      {show2FASetup && twoFAData && (
        <TwoFASetup
          qrCode={twoFAData.qr_code}
          secret={twoFAData.secret}
          onVerified={handle2FAVerified}
          onCancel={() => setShow2FASetup(false)}
        />
      )}
    </div>
  );
}