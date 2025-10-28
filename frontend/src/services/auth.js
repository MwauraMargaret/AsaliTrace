const API_BASE = 'http://localhost:8000/api/auth';

export const login = async (email, password) => {
  try {
    console.log('Sending login request to:', `${API_BASE}/login/`);
    
    const response = await fetch(`${API_BASE}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Login failed - Response text:', errorText);
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Login successful - Data:', data);
    return data;

  } catch (error) {
    console.error('Login request error:', error);
    throw new Error(`Network error: ${error.message}`);
  }
};

export const register = async (userData) => {
  try {
    console.log('Sending register request to:', `${API_BASE}/register/`);
    console.log('Register data:', userData);
    
    const response = await fetch(`${API_BASE}/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Register failed - Response text:', errorText);
      throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Register successful - Data:', data);
    return data;

  } catch (error) {
    console.error('Register request error:', error);
    throw new Error(`Network error: ${error.message}`);
  }
};

export const setup2FA = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/2fa/setup/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) throw new Error('Failed to setup 2FA');
  return response.json();
};

export const verify2FASetup = async (token) => {
  const userToken = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/2fa/verify-setup/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
  
  if (!response.ok) throw new Error('Invalid 2FA token');
  return response.json();
};

export const disable2FA = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/2fa/disable/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) throw new Error('Failed to disable 2FA');
  return response.json();
};

export const verify2FALogin = async (userId, token) => {
  const response = await fetch(`${API_BASE}/2fa/verify-login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, token }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Invalid 2FA token');
  }
  
  return response.json();
};