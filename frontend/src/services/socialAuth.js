const API_BASE = 'http://localhost:8000/api/auth';

export const googleLogin = async (accessToken) => {
  const response = await fetch(`${API_BASE}/social/google/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: accessToken }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Google login failed');
  }

  return await response.json();
};

export const githubLogin = async (accessToken) => {
  const response = await fetch(`${API_BASE}/social/github/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: accessToken }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'GitHub login failed');
  }

  return await response.json();
};

export const appleLogin = async (accessToken) => {
  const response = await fetch(`${API_BASE}/social/apple/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ access_token: accessToken }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Apple login failed');
  }

  return await response.json();
};